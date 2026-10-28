import React, { useState, useMemo } from 'react';
import { MetStation, MetVariable } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  Calendar, 
  BarChart2, 
  Thermometer, 
  Sun, 
  Wind, 
  Droplets,
  Table as TableIcon,
  AlertCircle
} from 'lucide-react';

interface TimeSeriesViewerProps {
  station: MetStation;
}

type TabType = 'PRECIP' | 'TEMP' | 'SOLAR_PET' | 'WIND_RH' | 'TABLE';

export const TimeSeriesViewer: React.FC<TimeSeriesViewerProps> = ({ station }) => {
  const [activeTab, setActiveTab] = useState<TabType>('PRECIP');
  const [yearFilter, setYearFilter] = useState<'ALL' | '2022' | '2023'>('ALL');

  // Filter records based on selected year
  const filteredRecords = useMemo(() => {
    if (yearFilter === 'ALL') return station.records;
    return station.records.filter(r => r.date.startsWith(yearFilter));
  }, [station.records, yearFilter]);

  // Downsample or format for charting so performance is snappy
  const chartData = useMemo(() => {
    // For smooth charting of 730 points, downsample slightly if rendering all, or take every 2nd point
    const step = yearFilter === 'ALL' ? 2 : 1;
    const sampled = [];
    for (let i = 0; i < filteredRecords.length; i += step) {
      const r = filteredRecords[i];
      const isMissingPrec = r.prec === -9999;
      const isMissingTemp = r.tmax === -9999;

      sampled.push({
        date: r.date,
        prec: isMissingPrec ? null : r.prec,
        tmax: isMissingTemp ? null : r.tmax,
        tmin: isMissingTemp ? null : r.tmin,
        tmean: isMissingTemp ? null : r.tmean,
        solr: r.solr === -9999 ? null : r.solr,
        pevt: r.pevt === -9999 ? null : r.pevt,
        wind: r.wind === -9999 ? null : r.wind,
        rhum: r.rhum === -9999 ? null : r.rhum,
        clou: r.clou === -9999 ? null : r.clou,
        isEstimated: r.isEstimated && Object.values(r.isEstimated).some(Boolean)
      });
    }
    return sampled;
  }, [filteredRecords, yearFilter]);

  // Check if current station has missing data in the filtered view
  const missingCount = useMemo(() => {
    return filteredRecords.filter(r => r.prec === -9999 || r.tmax === -9999).length;
  }, [filteredRecords]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col">
      {/* Chart Control Ribbon */}
      <div className="p-3.5 bg-slate-800/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('PRECIP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'PRECIP'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Precipitation</span>
          </button>

          <button
            onClick={() => setActiveTab('TEMP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'TEMP'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature (Max/Min/Mean)</span>
          </button>

          <button
            onClick={() => setActiveTab('SOLAR_PET')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'SOLAR_PET'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Solar Radiation &amp; PET</span>
          </button>

          <button
            onClick={() => setActiveTab('WIND_RH')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'WIND_RH'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind &amp; Humidity</span>
          </button>

          <button
            onClick={() => setActiveTab('TABLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'TABLE'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Data Grid</span>
          </button>
        </div>

        {/* Date Filter & Status */}
        <div className="flex items-center gap-3">
          {missingCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{missingCount} missing gaps detected (-9999 flag)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">2022 - 2023 (Full Period)</option>
              <option value="2022">2022 Calendar Year</option>
              <option value="2023">2023 Calendar Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Canvas or Table View */}
      <div className="p-4 bg-slate-950/60">
        {activeTab === 'PRECIP' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Daily Precipitation Hyetograph (in/day)</span>
              <span>Total days: {filteredRecords.length}</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.slice(5)} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    label={{ value: 'Rain (in)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="prec" name="Precipitation (in)" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'TEMP' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Daily Temperature Thermograph (°F)</span>
              <span>Max, Min &amp; Mean</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.slice(5)} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    label={{ value: 'Temp (°F)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="tmax" name="Max Temp (°F)" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="tmean" name="Mean Temp (°F)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="tmin" name="Min Temp (°F)" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'SOLAR_PET' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Solar Radiation (Ly/day) &amp; Potential Evapotranspiration (in/day)</span>
              <span>FAO-56 Penman-Monteith / Hargreaves</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.slice(5)} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#f59e0b" 
                    tick={{ fontSize: 10 }} 
                    label={{ value: 'Solar (Ly/day)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 10 }} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    tick={{ fontSize: 10 }} 
                    label={{ value: 'PET (in/day)', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="solr" name="Solar Radiation (Ly/day)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pevt" name="Penman PET (in/day)" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'WIND_RH' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Wind Speed (mph) &amp; Relative Humidity (%)</span>
              <span>Anemometer &amp; Hygrometer Series</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.slice(5)} 
                  />
                  <YAxis 
                    yAxisId="wind" 
                    stroke="#a855f7" 
                    tick={{ fontSize: 10 }} 
                    label={{ value: 'Wind (mph)', angle: -90, position: 'insideLeft', fill: '#a855f7', fontSize: 10 }} 
                  />
                  <YAxis 
                    yAxisId="rhum" 
                    orientation="right" 
                    stroke="#38bdf8" 
                    tick={{ fontSize: 10 }} 
                    label={{ value: 'RH (%)', angle: 90, position: 'insideRight', fill: '#38bdf8', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="wind" type="monotone" dataKey="wind" name="Wind Speed (mph)" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="rhum" type="monotone" dataKey="rhum" name="Relative Humidity (%)" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'TABLE' && (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2">Precip (in)</th>
                  <th className="py-2 px-2">Tmax (°F)</th>
                  <th className="py-2 px-2">Tmin (°F)</th>
                  <th className="py-2 px-2">Tmean (°F)</th>
                  <th className="py-2 px-2">Solar (Ly)</th>
                  <th className="py-2 px-2">Wind (mph)</th>
                  <th className="py-2 px-2">RH (%)</th>
                  <th className="py-2 px-2">PET (in)</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                {filteredRecords.slice(0, 100).map((r, i) => {
                  const isMissing = r.prec === -9999 || r.tmax === -9999;
                  const isEstimated = r.isEstimated && Object.values(r.isEstimated).some(Boolean);

                  return (
                    <tr key={r.date} className={isMissing ? 'bg-amber-950/20' : isEstimated ? 'bg-purple-950/20' : ''}>
                      <td className="py-1.5 px-2.5 text-slate-200">{r.date}</td>
                      <td className={`py-1.5 px-2 ${r.prec === -9999 ? 'text-amber-400 font-bold' : ''}`}>
                        {r.prec === -9999 ? '-9999' : r.prec.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-2 ${r.tmax === -9999 ? 'text-amber-400 font-bold' : ''}`}>
                        {r.tmax === -9999 ? '-9999' : r.tmax.toFixed(1)}
                      </td>
                      <td className={`py-1.5 px-2 ${r.tmin === -9999 ? 'text-amber-400 font-bold' : ''}`}>
                        {r.tmin === -9999 ? '-9999' : r.tmin.toFixed(1)}
                      </td>
                      <td className={`py-1.5 px-2 ${r.tmean === -9999 ? 'text-amber-400 font-bold' : ''}`}>
                        {r.tmean === -9999 ? '-9999' : r.tmean.toFixed(1)}
                      </td>
                      <td className="py-1.5 px-2">{r.solr === -9999 ? '-9999' : r.solr}</td>
                      <td className="py-1.5 px-2">{r.wind === -9999 ? '-9999' : r.wind.toFixed(1)}</td>
                      <td className="py-1.5 px-2">{r.rhum === -9999 ? '-9999' : `${r.rhum}%`}</td>
                      <td className="py-1.5 px-2">{r.pevt === -9999 ? '-9999' : r.pevt.toFixed(2)}</td>
                      <td className="py-1.5 px-2">
                        {isMissing ? (
                          <span className="text-amber-400 font-sans text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">
                            Missing
                          </span>
                        ) : isEstimated ? (
                          <span className="text-purple-300 font-sans text-[10px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800">
                            Estimated
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-sans text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                            Observed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
