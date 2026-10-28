import React, { useState } from 'react';
import { MetStation, MetDataSource } from '../types';
import { MapPin, Navigation, Eye, CheckCircle2, Layers } from 'lucide-react';

interface StationMapProps {
  stations: MetStation[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  filterSource: string;
  filterState: string;
}

// Bounding box for Southeast US (EPA Region 4):
// Longitude: -91.5 (west MS) to -75.0 (east NC)
// Latitude: 24.5 (south FL) to 39.5 (north KY)
const MIN_LON = -91.5;
const MAX_LON = -75.0;
const MIN_LAT = 24.5;
const MAX_LAT = 39.5;

const SOURCE_COLORS: Record<MetDataSource, string> = {
  ISD: '#38bdf8', // light blue
  NLDAS: '#34d399', // emerald
  GHCN: '#f59e0b', // amber
  HRAIN: '#a855f7', // purple
  GLDAS: '#ec4899', // pink
  TRMM: '#f97316', // orange
  PRISM: '#06b6d4', // cyan
  CMIP6: '#e11d48', // rose
  EDDE: '#8b5cf6', // violet
};

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  filterSource,
  filterState
}) => {
  const [hoveredStation, setHoveredStation] = useState<MetStation | null>(null);
  const [showHUCs, setShowHUCs] = useState<boolean>(true);

  // Convert lat/lon to SVG coordinate space (800 x 540)
  const width = 800;
  const height = 540;

  const project = (lat: number, lon: number) => {
    const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (width - 80) + 40;
    // Invert Y because latitude increases upwards
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (height - 80) + 40;
    return { x, y };
  };

  const selectedStation = stations.find(s => s.id === selectedStationId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col">
      {/* Map Control Bar */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">EPA Region 4 Spatial GIS Viewer</span>
          <span className="text-slate-400 font-mono">({stations.length} Active Gages)</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showHUCs}
              onChange={(e) => setShowHUCs(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-0"
            />
            <span>HUC-8 Basin Polygons</span>
          </label>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <span className="text-slate-400">Sources:</span>
            {['ISD', 'NLDAS', 'GHCN', 'PRISM', 'GLDAS', 'CMIP6'].map(src => (
              <span key={src} className="flex items-center gap-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: SOURCE_COLORS[src as MetDataSource] }}
                />
                <span className="text-[11px] text-slate-300">{src}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[16/10] bg-slate-950 flex items-center justify-center p-2 select-none overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full max-h-[500px]"
        >
          <defs>
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b1329" />
              <stop offset="100%" stopColor="#070c1a" />
            </radialGradient>
            <linearGradient id="hucGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" />
            </filter>
          </defs>

          {/* Background Oceanic / Region grid lines */}
          <rect width={width} height={height} fill="url(#oceanGrad)" />
          
          {/* Latitude & Longitude graticules */}
          {[26, 29, 32, 35, 38].map(lat => {
            const { y } = project(lat, MIN_LON);
            return (
              <g key={`lat-${lat}`}>
                <line x1="20" y1={y} x2={width - 20} y2={y} stroke="#334155" strokeDasharray="3 4" strokeWidth="0.8" />
                <text x="24" y={y - 4} fill="#64748b" fontSize="9" fontFamily="monospace">{lat}°N</text>
              </g>
            );
          })}
          {[-90, -87, -84, -81, -78].map(lon => {
            const { x } = project(MIN_LAT, lon);
            return (
              <g key={`lon-${lon}`}>
                <line x1={x} y1="20" x2={x} y2={height - 20} stroke="#334155" strokeDasharray="3 4" strokeWidth="0.8" />
                <text x={x + 3} y={height - 12} fill="#64748b" fontSize="9" fontFamily="monospace">{Math.abs(lon)}°W</text>
              </g>
            );
          })}

          {/* Region 4 Simplified State Boundaries & Basins */}
          <g id="states-and-basins" stroke="#475569" strokeWidth="1.2" fill="url(#hucGrad)">
            {/* Florida Peninsula */}
            <path d="M 440,360 L 530,360 L 560,420 L 580,480 L 545,510 L 520,440 L 440,410 Z" />
            {/* Georgia */}
            <path d="M 360,260 L 450,260 L 480,310 L 450,380 L 360,375 Z" />
            {/* Alabama */}
            <path d="M 270,260 L 360,260 L 360,375 L 290,390 L 270,390 Z" />
            {/* Mississippi */}
            <path d="M 170,260 L 270,260 L 270,390 L 230,400 L 190,370 Z" />
            {/* South Carolina */}
            <path d="M 450,260 L 550,240 L 580,290 L 480,310 Z" />
            {/* North Carolina */}
            <path d="M 450,200 L 670,180 L 680,220 L 580,250 L 450,260 Z" />
            {/* Tennessee */}
            <path d="M 220,200 L 450,200 L 450,260 L 220,260 Z" />
            {/* Kentucky */}
            <path d="M 250,130 L 460,110 L 440,200 L 240,200 Z" />
          </g>

          {/* State Code Watermarks */}
          <g fill="#475569" fontSize="14" fontWeight="bold" fontFamily="sans-serif" opacity="0.6" textAnchor="middle">
            <text x="315" y="325">AL</text>
            <text x="405" y="325">GA</text>
            <text x="520" y="440">FL</text>
            <text x="220" y="330">MS</text>
            <text x="330" y="235">TN</text>
            <text x="350" y="165">KY</text>
            <text x="510" y="280">SC</text>
            <text x="560" y="225">NC</text>
          </g>

          {/* Major River & Watershed Corridors (Chattahoochee, Savannah, Cumberland, Tennessee, Mississippi, St. Johns) */}
          {showHUCs && (
            <g stroke="#0284c7" strokeWidth="1.5" strokeOpacity="0.4" fill="none">
              {/* Chattahoochee River corridor */}
              <path d="M 400,240 Q 380,290 375,340 T 385,385" strokeDasharray="2 3" />
              {/* Savannah River */}
              <path d="M 450,240 Q 480,280 510,320" strokeDasharray="2 3" />
              {/* Cumberland / Tennessee */}
              <path d="M 260,180 Q 340,220 440,220" strokeDasharray="2 3" />
            </g>
          )}

          {/* Station Pins */}
          {stations.map(station => {
            const { x, y } = project(station.latitude, station.longitude);
            const isSelected = station.id === selectedStationId;
            const isHovered = hoveredStation?.id === station.id;
            const color = SOURCE_COLORS[station.source] || '#38bdf8';

            return (
              <g
                key={station.id}
                className="cursor-pointer transition-transform duration-150"
                onClick={() => onSelectStation(station.id)}
                onMouseEnter={() => setHoveredStation(station)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Highlight ring for selected station */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin origin-center"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : isHovered ? 8 : 6}
                  fill={color}
                  fillOpacity={isSelected ? 0.95 : 0.8}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1.2}
                  filter={isSelected ? 'url(#glow)' : undefined}
                />

                {/* Core dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#0f172a"
                />

                {/* Station Label */}
                {(isSelected || isHovered) && (
                  <g>
                    <rect
                      x={x + 10}
                      y={y - 18}
                      width={station.name.length * 6.5 + 40}
                      height="24"
                      rx="4"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                      className="shadow-xl"
                    />
                    <text
                      x={x + 16}
                      y={y - 2}
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {station.id}: {station.name.slice(0, 22)} ({station.state})
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Station Overlay Banner */}
        {selectedStation && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
            <div className="flex items-center gap-3">
              <div 
                className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: SOURCE_COLORS[selectedStation.source] }} 
              />
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <span>{selectedStation.name}</span>
                  <span className="font-mono text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                    {selectedStation.id}
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[11px]">
                    HUC-8: {selectedStation.huc8} ({selectedStation.hucName})
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Lat: {selectedStation.latitude.toFixed(4)}° | Lon: {selectedStation.longitude.toFixed(4)}° | Elev: {selectedStation.elevation} ft | Source: {selectedStation.source}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                selectedStation.missingPercent > 0 
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              }`}>
                {selectedStation.missingPercent > 0 ? `${selectedStation.missingPercent}% Missing` : 'Complete (0% Gaps)'}
              </span>
              <span className="text-slate-400">
                {selectedStation.recordsCount} Daily Records ({selectedStation.startDate} to {selectedStation.endDate})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
