export type MetDataSource = 
  | 'NLDAS' 
  | 'ISD' 
  | 'GHCN' 
  | 'HRAIN' 
  | 'GLDAS' 
  | 'TRMM' 
  | 'PRISM' 
  | 'CMIP6' 
  | 'EDDE';

export type MetVariable = 
  | 'PREC' // Precipitation (in or mm)
  | 'TMAX' // Max Temperature (°F or °C)
  | 'TMIN' // Min Temperature (°F or °C)
  | 'TMEAN' // Mean Temperature
  | 'SOLR' // Solar Radiation (Ly/day or W/m2)
  | 'WIND' // Wind Speed (mph or m/s)
  | 'DEWP' // Dew Point Temperature (°F or °C)
  | 'RHUM' // Relative Humidity (%)
  | 'PEVT' // Potential Evapotranspiration (in/day)
  | 'CLOU'; // Cloud Cover (tenths 0-10)

export interface WeatherRecord {
  date: string; // YYYY-MM-DD
  prec: number; // inches
  tmax: number; // °F
  tmin: number; // °F
  tmean: number; // °F
  solr: number; // Langleys/day
  wind: number; // mph
  dewp: number; // °F
  rhum: number; // %
  pevt: number; // in/day
  clou: number; // tenths (0-10)
  isEstimated?: {
    [key in MetVariable]?: boolean;
  };
}

export interface MetStation {
  id: string;
  name: string;
  state: 'AL' | 'FL' | 'GA' | 'KY' | 'MS' | 'NC' | 'SC' | 'TN' | string;
  county: string;
  latitude: number;
  longitude: number;
  elevation: number; // feet
  huc8: string; // 8-digit Hydrologic Unit Code
  hucName: string;
  source: MetDataSource;
  startDate: string;
  endDate: string;
  recordsCount: number;
  missingPercent: number;
  availableVars: MetVariable[];
  records: WeatherRecord[];
}

export type ExportFormat = 'LSPC' | 'SWAT' | 'EFDC' | 'SWMM' | 'WASP' | 'WDM_CSV' | 'JSON';

export type EstimationMethod = 'IDW' | 'AR1' | 'LINEAR' | 'STOCHASTIC_MARKOV';

export type PETMethod = 'PENMAN_MONTEITH' | 'HARGREAVES' | 'JENSEN_HAISE';

export type ClimateScenario = 'BASELINE' | 'SSP126' | 'SSP245' | 'SSP370' | 'SSP585';

export interface StochasticParameters {
  p01: number; // Probability of rain given dry yesterday
  p11: number; // Probability of rain given wet yesterday
  meanRain: number; // Mean depth on wet days (in)
  gammaAlpha: number; // Shape parameter
  gammaBeta: number; // Scale parameter
}

export interface StationStats {
  annualPrecip: number; // in
  annualRainDays: number;
  meanTmax: number;
  meanTmin: number;
  meanWind: number;
  annualPEVT: number;
  missingDays: number;
  estimatedDays: number;
}
