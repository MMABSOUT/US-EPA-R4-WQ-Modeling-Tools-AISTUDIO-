import React from 'react';
import { MetStation } from '../types';
import { Search, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StationListProps {
  stations: MetStation[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterSource: string;
  onSourceChange: (source: string) => void;
  filterState: string;
  onStateChange: (state: string) => void;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  searchTerm,
  onSearchChange,
  filterSource,
  onSourceChange,
  filterState,
  onStateChange,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col h-full">
      {/* Search & Filter Header */}
      <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search station ID, name, basin..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">State:</span>
          <select
            value={filterState}
            onChange={(e) => onStateChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All States</option>
            <option value="AL">Alabama (AL)</option>
            <option value="FL">Florida (FL)</option>
            <option value="GA">Georgia (GA)</option>
            <option value="KY">Kentucky (KY)</option>
            <option value="MS">Mississippi (MS)</option>
            <option value="NC">North Carolina (NC)</option>
            <option value="SC">South Carolina (SC)</option>
            <option value="TN">Tennessee (TN)</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Source:</span>
          <select
            value={filterSource}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sources</option>
            <option value="ISD">ISD (NOAA Hourly)</option>
            <option value="NLDAS">NLDAS-2 Grid</option>
            <option value="GHCN">GHCN (Daily)</option>
            <option value="HRAIN">HRAIN (Hourly)</option>
            <option value="GLDAS">GLDAS Global</option>
            <option value="PRISM">PRISM Climate</option>
            <option value="CMIP6">CMIP6 Scenarios</option>
            <option value="EDDE">EDDE Downscaled</option>
          </select>
        </div>
      </div>

      {/* Station Table */}
      <div className="overflow-x-auto flex-1 max-h-[340px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2 px-3">Station ID</th>
              <th className="py-2 px-3">Name / Watershed</th>
              <th className="py-2 px-2">State</th>
              <th className="py-2 px-2">Source</th>
              <th className="py-2 px-2">HUC-8</th>
              <th className="py-2 px-2">Lat / Lon</th>
              <th className="py-2 px-2">Missing</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {stations.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No meteorological stations matched the current filters.
                </td>
              </tr>
            ) : (
              stations.map(station => {
                const isSelected = station.id === selectedStationId;
                const hasGaps = station.missingPercent > 0;

                return (
                  <tr
                    key={station.id}
                    onClick={() => onSelectStation(station.id)}
                    className={`cursor-pointer transition hover:bg-slate-800/60 ${
                      isSelected ? 'bg-cyan-950/40 text-cyan-200 font-medium' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-cyan-400">
                      {station.id}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-200 truncate max-w-[200px]" title={station.name}>
                        {station.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{station.hucName}</div>
                    </td>
                    <td className="py-2 px-2 font-semibold text-slate-300">
                      {station.state}
                    </td>
                    <td className="py-2 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {station.source}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-400">
                      {station.huc8}
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-400">
                      {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
                    </td>
                    <td className="py-2 px-2">
                      {hasGaps ? (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {station.missingPercent}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          0%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(station.id);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] transition ${
                          isSelected
                            ? 'bg-cyan-600 text-white font-semibold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
