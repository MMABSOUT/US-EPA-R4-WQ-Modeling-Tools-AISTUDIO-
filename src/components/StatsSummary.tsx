import React, { useMemo } from 'react';
import { MetStation } from '../types';
import { computeStationStats } from '../utils/metCalculations';
import { CloudRain, Thermometer, Wind, Sun, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface StatsSummaryProps {
  station: MetStation;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ station }) => {
  const stats = useMemo(() => computeStationStats(station), [station]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Annual Precipitation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Annual Precip</span>
          <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-xl font-bold text-slate-100 font-mono">
          {stats.annualPrecip} <span className="text-xs font-normal text-slate-400">in/yr</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {stats.annualRainDays} wet days (&ge;0.01")
        </div>
      </div>

      {/* Mean Temperature */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Mean Max / Min</span>
          <Thermometer className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="text-xl font-bold text-slate-100 font-mono">
          {stats.meanTmax}° / {stats.meanTmin}° <span className="text-xs font-normal text-slate-400">F</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Diurnal: {(stats.meanTmax - stats.meanTmin).toFixed(1)}°F
        </div>
      </div>

      {/* Annual PET */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Annual PET</span>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl font-bold text-slate-100 font-mono">
          {stats.annualPEVT} <span className="text-xs font-normal text-slate-400">in/yr</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          P/PET ratio: {(stats.annualPrecip / Math.max(1, stats.annualPEVT)).toFixed(2)}
        </div>
      </div>

      {/* Mean Wind */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Mean Wind</span>
          <Wind className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="text-xl font-bold text-slate-100 font-mono">
          {stats.meanWind} <span className="text-xs font-normal text-slate-400">mph</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Standard 10m anemometer
        </div>
      </div>

      {/* Missing Data Gaps */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Data Gaps</span>
          <AlertTriangle className={`w-3.5 h-3.5 ${stats.missingDays > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
        </div>
        <div className="text-xl font-bold font-mono">
          <span className={stats.missingDays > 0 ? 'text-amber-400' : 'text-emerald-400'}>
            {stats.missingDays}
          </span>
          <span className="text-xs font-normal text-slate-400"> days</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {station.missingPercent}% QA/QC missing
        </div>
      </div>

      {/* Estimated Days */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Filled / Est</span>
          <CheckCircle className={`w-3.5 h-3.5 ${stats.estimatedDays > 0 ? 'text-purple-400' : 'text-slate-500'}`} />
        </div>
        <div className="text-xl font-bold font-mono">
          <span className={stats.estimatedDays > 0 ? 'text-purple-400' : 'text-slate-400'}>
            {stats.estimatedDays}
          </span>
          <span className="text-xs font-normal text-slate-400"> days</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Spatial &amp; AR interpolation
        </div>
      </div>
    </div>
  );
};
