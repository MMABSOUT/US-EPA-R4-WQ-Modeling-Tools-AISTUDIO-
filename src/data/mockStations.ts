import { MetStation, WeatherRecord, MetVariable } from '../types';

// Deterministic pseudo-random number generator for consistent dataset creation
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateTimeSeries(
  startYear: number, 
  numDays: number, 
  lat: number, 
  baseTemp: number, 
  baseRainFactor: number,
  seed: number,
  injectMissing: boolean = true
): WeatherRecord[] {
  const rand = pseudoRandom(seed);
  const records: WeatherRecord[] = [];
  const startDate = new Date(startYear, 0, 1);

  let wasWetYesterday = false;

  for (let i = 0; i < numDays; i++) {
    const curDate = new Date(startDate.getTime() + i * 86400000);
    const dateStr = curDate.toISOString().slice(0, 10);
    const dayOfYear = Math.floor((curDate.getTime() - new Date(curDate.getFullYear(), 0, 0).getTime()) / 86400000);
    const radians = (dayOfYear - 105) * (2 * Math.PI / 365);
    
    // Seasonal temperature cycle
    const seasonalTemp = baseTemp + 20 * Math.sin(radians);
    const dayVariation = (rand() - 0.5) * 14;
    const tmean = Math.round((seasonalTemp + dayVariation) * 10) / 10;
    const diurnalSpread = 14 + rand() * 12;
    const tmax = Math.round((tmean + diurnalSpread / 2) * 10) / 10;
    const tmin = Math.round((tmean - diurnalSpread / 2) * 10) / 10;

    // Precipitation with Markov 2-state process
    const pWet = wasWetYesterday ? 0.45 : 0.22;
    const isWet = rand() < (pWet * baseRainFactor);
    let prec = 0;
    if (isWet) {
      // Exponential / Gamma rain depth
      prec = Math.round((-Math.log(1 - rand() * 0.98) * 0.42 * baseRainFactor) * 100) / 100;
      wasWetYesterday = true;
    } else {
      wasWetYesterday = false;
    }

    // Solar radiation (Langleys/day: 1 Ly/day ≈ 0.484 W/m2)
    // Latitude factor: higher in summer, lower in winter
    const maxSolr = 250 + 350 * Math.sin((dayOfYear - 80) * (Math.PI / 185));
    const cloudFactor = isWet ? (0.2 + rand() * 0.35) : (0.7 + rand() * 0.3);
    const solr = Math.round(Math.max(80, maxSolr * cloudFactor));
    const clou = Math.round((1 - cloudFactor) * 10);

    // Dew point & Relative Humidity
    const dewp = Math.round((tmin - (rand() * 4)) * 10) / 10;
    // Approximating relative humidity via Magnus formula
    const es = 6.11 * Math.exp((17.27 * tmean) / (tmean + 237.3));
    const e = 6.11 * Math.exp((17.27 * dewp) / (dewp + 237.3));
    const rhum = Math.min(100, Math.max(25, Math.round((e / es) * 100)));

    // Wind speed (mph)
    const wind = Math.round((4 + rand() * 10 + (isWet ? rand() * 8 : 0)) * 10) / 10;

    // Hargreaves / Penman PET estimate (in/day)
    const Ra = 15 * Math.sin(radians + 0.3) + 25; // extraterrestrial radiation equivalent
    const deltaT = Math.max(1, tmax - tmin);
    const pevt = Math.round(Math.max(0.01, 0.0023 * Ra * (tmean + 17.8) * Math.sqrt(deltaT) * 0.03937) * 100) / 100;

    // Introduce missing data chunks for testing gap-filling (approx 3% gaps)
    let isMissing = false;
    if (injectMissing && (
      (i >= 120 && i <= 126) || // Spring 7-day storm gap
      (i >= 210 && i <= 214) || // Summer 5-day equipment maintenance
      (i === 300) || (i === 305)
    )) {
      isMissing = true;
    }

    records.push({
      date: dateStr,
      prec: isMissing ? -9999 : prec,
      tmax: isMissing ? -9999 : tmax,
      tmin: isMissing ? -9999 : tmin,
      tmean: isMissing ? -9999 : tmean,
      solr: isMissing ? -9999 : solr,
      wind: isMissing ? -9999 : wind,
      dewp: isMissing ? -9999 : dewp,
      rhum: isMissing ? -9999 : rhum,
      pevt: isMissing ? -9999 : pevt,
      clou: isMissing ? -9999 : clou,
      isEstimated: {}
    });
  }

  return records;
}

const DEFAULT_VARS: MetVariable[] = ['PREC', 'TMAX', 'TMIN', 'TMEAN', 'SOLR', 'WIND', 'DEWP', 'RHUM', 'PEVT', 'CLOU'];

export const INITIAL_STATIONS: MetStation[] = [
  {
    id: 'USW00013874',
    name: 'Atlanta Hartsfield-Jackson Intl Airport',
    state: 'GA',
    county: 'Fulton',
    latitude: 33.6407,
    longitude: -84.4277,
    elevation: 1026,
    huc8: '03130001',
    hucName: 'Upper Chattahoochee',
    source: 'ISD',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 3.8,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 33.64, 62, 1.0, 101, true)
  },
  {
    id: 'NLDAS_03130001_G1',
    name: 'NLDAS-2 Grid Cell (Chattahoochee Basins)',
    state: 'GA',
    county: 'Gwinnett',
    latitude: 33.9500,
    longitude: -84.1250,
    elevation: 980,
    huc8: '03130001',
    hucName: 'Upper Chattahoochee',
    source: 'NLDAS',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 0.0,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 33.95, 61, 1.05, 102, false)
  },
  {
    id: 'USW00013881',
    name: 'Charlotte Douglas International Airport',
    state: 'NC',
    county: 'Mecklenburg',
    latitude: 35.2140,
    longitude: -80.9431,
    elevation: 748,
    huc8: '03050101',
    hucName: 'Upper Catawba',
    source: 'GHCN',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 2.5,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 35.21, 60, 0.95, 103, true)
  },
  {
    id: 'USW00013897',
    name: 'Nashville International Airport',
    state: 'TN',
    county: 'Davidson',
    latitude: 36.1263,
    longitude: -86.6774,
    elevation: 590,
    huc8: '05130202',
    hucName: 'Lower Cumberland',
    source: 'ISD',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 3.1,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 36.12, 59, 1.02, 104, true)
  },
  {
    id: 'USW00012839',
    name: 'Miami International Airport',
    state: 'FL',
    county: 'Miami-Dade',
    latitude: 25.7959,
    longitude: -80.2870,
    elevation: 9,
    huc8: '03090206',
    hucName: 'Everglades',
    source: 'ISD',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 1.8,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 25.79, 76, 1.35, 105, true)
  },
  {
    id: 'USW00013876',
    name: 'Birmingham-Shuttlesworth Intl Airport',
    state: 'AL',
    county: 'Jefferson',
    latitude: 33.5629,
    longitude: -86.7535,
    elevation: 644,
    huc8: '03150202',
    hucName: 'Locust Fork',
    source: 'GHCN',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 4.2,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 33.56, 62, 1.15, 106, true)
  },
  {
    id: 'USW00023811',
    name: 'Columbia Metropolitan Airport',
    state: 'SC',
    county: 'Lexington',
    latitude: 33.9388,
    longitude: -81.1195,
    elevation: 236,
    huc8: '03050110',
    hucName: 'Congaree',
    source: 'HRAIN',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 2.1,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 33.93, 64, 0.98, 107, true)
  },
  {
    id: 'USW00093821',
    name: 'Louisville Muhammad Ali Intl Airport',
    state: 'KY',
    county: 'Jefferson',
    latitude: 38.1744,
    longitude: -85.7360,
    elevation: 501,
    huc8: '05140101',
    hucName: 'Silver-Little Kentucky',
    source: 'PRISM',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 0.0,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 38.17, 57, 1.08, 108, false)
  },
  {
    id: 'USW00003940',
    name: 'Jackson-Medgar Wiley Evers Intl Airport',
    state: 'MS',
    county: 'Rankin',
    latitude: 32.3112,
    longitude: -90.0759,
    elevation: 346,
    huc8: '03180002',
    hucName: 'Middle Pearl-Strong',
    source: 'GLDAS',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 0.0,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 32.31, 65, 1.22, 109, false)
  },
  {
    id: 'CMIP6_SSP585_R4_01',
    name: 'CMIP6 Downscaled Ensemble (SSP5-8.5 Future)',
    state: 'GA',
    county: 'Fulton',
    latitude: 33.7500,
    longitude: -84.3800,
    elevation: 1050,
    huc8: '03130001',
    hucName: 'Upper Chattahoochee',
    source: 'CMIP6',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 0.0,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 33.75, 66, 1.25, 110, false)
  },
  {
    id: 'EDDE_03050101_S1',
    name: 'EDDE Dynamically Downscaled Ensemble',
    state: 'SC',
    county: 'Oconee',
    latitude: 34.6800,
    longitude: -83.0200,
    elevation: 820,
    huc8: '03060101',
    hucName: 'Seneca',
    source: 'EDDE',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    recordsCount: 730,
    missingPercent: 0.0,
    availableVars: DEFAULT_VARS,
    records: generateTimeSeries(2022, 730, 34.68, 60, 1.12, 111, false)
  }
];
