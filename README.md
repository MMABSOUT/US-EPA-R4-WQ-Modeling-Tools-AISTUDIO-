# EPA Region 4 Water Quality Modeling & Weather Data Processing Suite

Migrated web edition of the EPA Region 4 Water Quality Modeling Tools (WeaProc / SWAT / LSPC / EFDC / SWMM / WASP / WDM).

## Features
- **Spatial GIS Viewer**: Interactive map of EPA Region 4 states (AL, FL, GA, KY, MS, NC, SC, TN) with HUC-8 watershed basin corridors and meteorological stations (ISD, NLDAS, GHCN, HRAIN, GLDAS, PRISM, CMIP6, EDDE).
- **Time Series Visualization**: Interactive hyetographs (precipitation), thermographs (Tmax, Tmin, Tmean), solar radiation, Penman-Monteith PET, wind speed, and relative humidity.
- **Gap Filling & Spatial Estimation**: Spatial Inverse Distance Weighting (IDW) using donor stations and Autoregressive AR(1) interpolation for missing observations (-9999 quality flags).
- **WeaGen (Stochastic Weather Generator)**: First-order two-state Markov chain transition model ($P_{01}, P_{11}$) with Gamma/exponential rain depth simulation.
- **Evapotranspiration Calculator (MetCmp)**: FAO-56 / SWAT Penman-Monteith, Hargreaves-Samani, and Jensen-Haise PET formulations.
- **Water Quality Model Exporters**: One-click generation and download of formatted weather inputs for:
  - **LSPC** (`.air`)
  - **SWAT** (`pcp1.pcp`, `tmp1.tmp`)
  - **EFDC** (`.wea`)
  - **SWMM** (`.dat`)
  - **WASP** (`.sdb`)
  - **CSV / WDM Table**

## Running Locally
```bash
npm install
npm run dev
```
The app runs on port 3000 (`0.0.0.0:3000`) without any required environment variables.
