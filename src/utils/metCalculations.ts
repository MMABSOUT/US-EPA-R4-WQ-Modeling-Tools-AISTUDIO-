import { MetStation, WeatherRecord, MetVariable, StochasticParameters, StationStats } from '../types';

/**
 * Calculates Potential Evapotranspiration (PET) via FAO-56 / SWAT Penman-Monteith method.
 * Ported from modPenmanMonteith_SWAT.vb
 * 
 * @param tmean Mean air temp (°C)
 * @param tmax Max air temp (°C)
 * @param tmin Min air temp (°C)
 * @param solr Solar radiation (MJ/m2/day)
 * @param wind Wind speed at 2m (m/s)
 * @param rhum Relative humidity (%)
 * @param elevation Elevation above sea level (m)
 * @returns PET in mm/day
 */
export function calculatePenmanMonteith(
  tmeanC: number,
  tmaxC: number,
  tminC: number,
  solrMJ: number,
  windMps: number,
  rhumPct: number,
  elevationM: number
): number {
  // Atmospheric pressure (kPa)
  const P = 101.3 * Math.pow((293 - 0.0065 * elevationM) / 293, 5.26);

  // Psychrometric constant (kPa/°C)
  const gamma = 0.000665 * P;

  // Slope of saturation vapor pressure curve Delta (kPa/°C)
  const delta = (4098 * (0.6108 * Math.exp((17.27 * tmeanC) / (tmeanC + 237.3)))) / Math.pow(tmeanC + 237.3, 2);

  // Saturation vapor pressure eo (kPa)
  const eTmax = 0.6108 * Math.exp((17.27 * tmaxC) / (tmaxC + 237.3));
  const eTmin = 0.6108 * Math.exp((17.27 * tminC) / (tminC + 237.3));
  const es = (eTmax + eTmin) / 2;

  // Actual vapor pressure ea (kPa)
  const ea = (es * (rhumPct / 100));

  // Net radiation Rn (approx from solar radiation with 0.23 grass albedo)
  const Rns = (1 - 0.23) * solrMJ;
  // Net longwave radiation Rnl approx
  const sigma = 4.903e-9; // Stefan-Boltzmann constant
  const tmaxK4 = Math.pow(tmaxC + 273.16, 4);
  const tminK4 = Math.pow(tminC + 273.16, 4);
  const Rnl = sigma * ((tmaxK4 + tminK4) / 2) * (0.34 - 0.14 * Math.sqrt(Math.max(0.1, ea))) * 0.7; // simplified clear-sky factor
  const Rn = Math.max(0, Rns - Rnl);

  // Soil heat flux density G (assumed 0 for daily intervals)
  const G = 0;

  // FAO-56 Penman-Monteith equation
  const numerator = 0.408 * delta * (Rn - G) + gamma * (900 / (tmeanC + 273)) * windMps * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * windMps);

  const petMm = Math.max(0, numerator / denominator);
  return petMm;
}

/**
 * Calculates Hargreaves-Samani PET (in mm/day)
 * Ported from frmCmpHPET.vb
 */
export function calculateHargreaves(
  tmeanC: number,
  tmaxC: number,
  tminC: number,
  latDeg: number,
  dayOfYear: number
): number {
  // Extraterrestrial radiation Ra (MJ/m2/day)
  const phi = (latDeg * Math.PI) / 180;
  const delta = 0.409 * Math.sin(((2 * Math.PI / 365) * dayOfYear) - 1.39);
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
  const ws = Math.acos(-Math.tan(phi) * Math.tan(delta));
  const Gsc = 0.0820; // MJ/m2/min
  const Ra = ((24 * 60) / Math.PI) * Gsc * dr * (
    ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws)
  );

  const deltaT = Math.max(0.1, tmaxC - tminC);
  const petMm = 0.0023 * (tmeanC + 17.8) * Math.pow(deltaT, 0.5) * 0.408 * Ra;
  return Math.max(0, petMm);
}

/**
 * Compute station statistics summary
 */
export function computeStationStats(station: MetStation): StationStats {
  let annualPrecip = 0;
  let annualRainDays = 0;
  let tmaxSum = 0;
  let tminSum = 0;
  let windSum = 0;
  let pevtSum = 0;
  let validTempCount = 0;
  let missingDays = 0;
  let estimatedDays = 0;

  for (const r of station.records) {
    if (r.prec === -9999 || r.tmax === -9999) {
      missingDays++;
      continue;
    }
    if (r.isEstimated && Object.values(r.isEstimated).some(Boolean)) {
      estimatedDays++;
    }

    annualPrecip += Math.max(0, r.prec);
    if (r.prec >= 0.01) annualRainDays++;
    tmaxSum += r.tmax;
    tminSum += r.tmin;
    windSum += r.wind;
    pevtSum += Math.max(0, r.pevt);
    validTempCount++;
  }

  const years = Math.max(1, station.records.length / 365);
  return {
    annualPrecip: Math.round((annualPrecip / years) * 10) / 10,
    annualRainDays: Math.round(annualRainDays / years),
    meanTmax: validTempCount > 0 ? Math.round((tmaxSum / validTempCount) * 10) / 10 : 0,
    meanTmin: validTempCount > 0 ? Math.round((tminSum / validTempCount) * 10) / 10 : 0,
    meanWind: validTempCount > 0 ? Math.round((windSum / validTempCount) * 10) / 10 : 0,
    annualPEVT: Math.round((pevtSum / years) * 10) / 10,
    missingDays,
    estimatedDays
  };
}

/**
 * Spatial Inverse Distance Weighting (IDW) Gap-Filling
 * Ported from clsEstimate.cs
 */
export function estimateByIDW(
  targetStation: MetStation,
  donorStations: MetStation[],
  variable: MetVariable,
  power: number = 2
): WeatherRecord[] {
  // Deep clone target records
  const filledRecords: WeatherRecord[] = targetStation.records.map(r => ({
    ...r,
    isEstimated: { ...(r.isEstimated || {}) }
  }));

  // Calculate distance from target to each donor (Haversine formula in km)
  const donorsWithDist = donorStations.filter(d => d.id !== targetStation.id).map(donor => {
    const R = 6371; // Earth radius km
    const dLat = ((donor.latitude - targetStation.latitude) * Math.PI) / 180;
    const dLon = ((donor.longitude - targetStation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((targetStation.latitude * Math.PI) / 180) *
      Math.cos((donor.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.max(0.5, R * c);
    return { donor, distanceKm, weight: 1 / Math.pow(distanceKm, power) };
  });

  const varKey = variable.toLowerCase() as keyof WeatherRecord;

  filledRecords.forEach((record, idx) => {
    const val = record[varKey] as number;
    if (val === -9999 || isNaN(val)) {
      // Need estimation
      let weightedSum = 0;
      let totalWeight = 0;

      for (const { donor, weight } of donorsWithDist) {
        const donorRecord = donor.records[idx];
        if (donorRecord) {
          const donorVal = donorRecord[varKey] as number;
          if (donorVal !== -9999 && !isNaN(donorVal)) {
            weightedSum += donorVal * weight;
            totalWeight += weight;
          }
        }
      }

      if (totalWeight > 0) {
        let estimated = weightedSum / totalWeight;
        if (variable === 'PREC' || variable === 'PEVT') {
          estimated = Math.round(estimated * 100) / 100;
        } else {
          estimated = Math.round(estimated * 10) / 10;
        }
        (record as any)[varKey] = estimated;
        if (!record.isEstimated) record.isEstimated = {};
        record.isEstimated[variable] = true;
      }
    }
  });

  return filledRecords;
}

/**
 * Autoregressive AR(1) Gap-Filling
 * Ported from LinearAR.cs
 */
export function estimateByAR1(
  station: MetStation,
  variable: MetVariable
): WeatherRecord[] {
  const filledRecords: WeatherRecord[] = station.records.map(r => ({
    ...r,
    isEstimated: { ...(r.isEstimated || {}) }
  }));

  const varKey = variable.toLowerCase() as keyof WeatherRecord;
  const validVals = station.records
    .map(r => r[varKey] as number)
    .filter(v => v !== -9999 && !isNaN(v));

  const mean = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 50;
  const phi = 0.78; // 1-day autocorrelation parameter typical for daily temp/humidity

  let lastValid = mean;
  for (let i = 0; i < filledRecords.length; i++) {
    const val = filledRecords[i][varKey] as number;
    if (val !== -9999 && !isNaN(val)) {
      lastValid = val;
    } else {
      // Fill via AR(1)
      const filled = mean + phi * (lastValid - mean);
      const rounded = variable === 'PREC' ? Math.round(Math.max(0, filled) * 100) / 100 : Math.round(filled * 10) / 10;
      (filledRecords[i] as any)[varKey] = rounded;
      if (!filledRecords[i].isEstimated) filledRecords[i].isEstimated = {};
      filledRecords[i].isEstimated![variable] = true;
      lastValid = rounded;
    }
  }

  return filledRecords;
}

/**
 * Stochastic Weather Model Fitting & Generation (Markov Chain + Gamma)
 * Ported from clsRainModel.cs & WeaGen
 */
export function fitMarkovRainModel(records: WeatherRecord[]): StochasticParameters {
  let n00 = 0, n01 = 0, n10 = 0, n11 = 0;
  const wetDepths: number[] = [];

  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1].prec;
    const curr = records[i].prec;
    if (prev === -9999 || curr === -9999) continue;

    const prevWet = prev >= 0.01;
    const currWet = curr >= 0.01;

    if (!prevWet && !currWet) n00++;
    else if (!prevWet && currWet) {
      n01++;
      wetDepths.push(curr);
    } else if (prevWet && !currWet) n10++;
    else if (prevWet && currWet) {
      n11++;
      wetDepths.push(curr);
    }
  }

  const p01 = (n00 + n01) > 0 ? n01 / (n00 + n01) : 0.22;
  const p11 = (n10 + n11) > 0 ? n11 / (n10 + n11) : 0.45;
  const meanRain = wetDepths.length > 0 ? wetDepths.reduce((a, b) => a + b, 0) / wetDepths.length : 0.45;

  return {
    p01: Math.round(p01 * 1000) / 1000,
    p11: Math.round(p11 * 1000) / 1000,
    meanRain: Math.round(meanRain * 100) / 100,
    gammaAlpha: 0.85,
    gammaBeta: Math.round((meanRain / 0.85) * 100) / 100
  };
}

/**
 * Model File Exporters (LSPC, SWAT, EFDC, SWMM, WASP)
 */

export function exportToLSPC(station: MetStation): string {
  // LSPC .air file format
  let out = `* LSPC METEOROLOGICAL AIR DATA FILE\n`;
  out += `* STATION: ${station.id} - ${station.name}\n`;
  out += `* LATITUDE: ${station.latitude.toFixed(4)} LONGITUDE: ${station.longitude.toFixed(4)}\n`;
  out += `* YEAR MN DY HR  PREC(in)  TAIR(F)   DEWP(F)   WIND(mph) SOLR(Ly)  CLOU(10ths)\n`;

  station.records.slice(0, 120).forEach(r => {
    const parts = r.date.split('-');
    const yr = parts[0];
    const mn = parts[1].padStart(2, ' ');
    const dy = parts[2].padStart(2, ' ');
    // Representing daily summary with 24-hr timestamp
    const precStr = (r.prec >= 0 ? r.prec.toFixed(2) : '-9.99').padStart(9, ' ');
    const tmeanStr = (r.tmean >= -100 ? r.tmean.toFixed(1) : '-99.9').padStart(9, ' ');
    const dewpStr = (r.dewp >= -100 ? r.dewp.toFixed(1) : '-99.9').padStart(9, ' ');
    const windStr = (r.wind >= 0 ? r.wind.toFixed(1) : '-99.9').padStart(10, ' ');
    const solrStr = (r.solr >= 0 ? r.solr.toFixed(0) : '-999').padStart(9, ' ');
    const clouStr = (r.clou >= 0 ? r.clou.toFixed(1) : '-9.9').padStart(12, ' ');

    out += `${yr} ${mn} ${dy} 24${precStr}${tmeanStr}${dewpStr}${windStr}${solrStr}${clouStr}\n`;
  });

  return out;
}

export function exportToSWAT(station: MetStation, type: 'PCP' | 'TMP' = 'PCP'): string {
  if (type === 'PCP') {
    let out = `Station  , ${station.name}\n`;
    out += `Lati     , ${station.latitude.toFixed(4)}\n`;
    out += `Long     , ${station.longitude.toFixed(4)}\n`;
    out += `Elev     , ${station.elevation}\n`;
    station.records.slice(0, 150).forEach(r => {
      const dateNum = r.date.replace(/-/g, '');
      const p = r.prec >= 0 ? (r.prec * 25.4).toFixed(1) : '-99.0'; // SWAT expects mm
      out += `${dateNum}${p.padStart(6, ' ')}\n`;
    });
    return out;
  } else {
    let out = `Station  , ${station.name}\n`;
    out += `Lati     , ${station.latitude.toFixed(4)}\n`;
    out += `Long     , ${station.longitude.toFixed(4)}\n`;
    out += `Elev     , ${station.elevation}\n`;
    station.records.slice(0, 150).forEach(r => {
      const dateNum = r.date.replace(/-/g, '');
      const tmaxC = r.tmax >= -100 ? (((r.tmax - 32) * 5) / 9).toFixed(1) : '-99.0';
      const tminC = r.tmin >= -100 ? (((r.tmin - 32) * 5) / 9).toFixed(1) : '-99.0';
      out += `${dateNum}${tmaxC.padStart(6, ' ')}${tminC.padStart(6, ' ')}\n`;
    });
    return out;
  }
}

export function exportToEFDC(station: MetStation): string {
  let out = `C EFDC ATMOSPHERIC FORCING (ASER.INP / .WEA)\n`;
  out += `C GAGE: ${station.id} ${station.name}\n`;
  out += `C TIME(DAYS)  ATM_P(mb) DRY_T(C)  REL_HUM   PREC(m/s)  EVAP(m/s) SOLAR(W/m2) CLOUD(0-1)\n`;

  station.records.slice(0, 100).forEach((r, idx) => {
    const day = (idx + 1).toFixed(3).padStart(11, ' ');
    const press = '1013.25'.padStart(10, ' ');
    const tc = (((r.tmean - 32) * 5) / 9).toFixed(2).padStart(10, ' ');
    const rh = (r.rhum / 100).toFixed(2).padStart(10, ' ');
    // precip in m/s: prec in inches -> m / 86400
    const precMps = ((r.prec * 0.0254) / 86400).toExponential(3).padStart(12, ' ');
    const evapMps = ((r.pevt * 0.0254) / 86400).toExponential(3).padStart(12, ' ');
    const solrW = (r.solr * 0.4843).toFixed(1).padStart(12, ' ');
    const clouFraction = (r.clou / 10).toFixed(1).padStart(11, ' ');

    out += `${day}${press}${tc}${rh}${precMps}${evapMps}${solrW}${clouFraction}\n`;
  });

  return out;
}

export function exportToSWMM(station: MetStation): string {
  let out = `;; EPA SWMM Climate/Rainfall Input File\n`;
  out += `;; Format: Station Year Month Day Hour Minute Value\n`;
  out += `;; Station: ${station.id} (${station.name})\n`;

  station.records.slice(0, 120).forEach(r => {
    const [yr, mn, dy] = r.date.split('-');
    const p = Math.max(0, r.prec).toFixed(2);
    out += `${station.id.slice(0, 8)} ${yr} ${mn} ${dy} 23 00 ${p}\n`;
  });

  return out;
}

export function exportToWASP(station: MetStation): string {
  let out = `[WASP SDB METEOROLOGICAL TABLE]\n`;
  out += `METEOROLOGICAL STATION: ${station.id}\n`;
  out += `WATERSHED HUC8: ${station.huc8} (${station.hucName})\n`;
  out += `DATE,PREC_IN,TEMP_F,SOLAR_RAD_LY,WIND_MPH,EVAP_IN\n`;

  station.records.slice(0, 120).forEach(r => {
    out += `${r.date},${r.prec.toFixed(2)},${r.tmean.toFixed(1)},${r.solr.toFixed(0)},${r.wind.toFixed(1)},${r.pevt.toFixed(2)}\n`;
  });

  return out;
}

export function exportToCSV(station: MetStation): string {
  let out = `Date,Station_ID,Station_Name,Latitude,Longitude,Precip_in,Tmax_F,Tmin_F,Tmean_F,Solar_Ly,Wind_mph,DewPt_F,RH_pct,PET_in,Cloud_10ths,Quality_Flag\n`;

  station.records.forEach(r => {
    const isEst = r.isEstimated && Object.values(r.isEstimated).some(Boolean) ? 'ESTIMATED' : 'RAW';
    out += `${r.date},${station.id},"${station.name}",${station.latitude},${station.longitude},${r.prec},${r.tmax},${r.tmin},${r.tmean},${r.solr},${r.wind},${r.dewp},${r.rhum},${r.pevt},${r.clou},${isEst}\n`;
  });

  return out;
}
