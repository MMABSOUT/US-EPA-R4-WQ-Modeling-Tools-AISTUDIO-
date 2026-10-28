import React from 'react';
import { 
  CloudRain, 
  Download, 
  Wand2, 
  SunMedium, 
  FileSpreadsheet, 
  Compass, 
  Database,
  Layers
} from 'lucide-react';

interface HeaderProps {
  totalStations: number;
  selectedCount: number;
  activeDataSource: string;
  onOpenGapFill: () => void;
  onOpenStochastic: () => void;
  onOpenPET: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalStations,
  selectedCount,
  activeDataSource,
  onOpenGapFill,
  onOpenStochastic,
  onOpenPET,
  onOpenExport,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Context */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-900/40 text-white font-bold text-lg">
            <CloudRain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">R4 Water Quality Modeling Tools</h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                EPA Region 4
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                v2.2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Hydro-climatic data processor, stochastic modeling &amp; model exporter (LSPC, SWAT, EFDC, SWMM, WASP)
            </p>
          </div>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-sm">
          <button
            onClick={onOpenGapFill}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition font-medium shadow-sm active:scale-95"
            title="Spatial IDW and Autoregressive gap filling"
          >
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>Gap Fill &amp; Estimate</span>
          </button>

          <button
            onClick={onOpenStochastic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition font-medium shadow-sm active:scale-95"
            title="Stochastic Markov Chain Weather Generator"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>WeaGen (Markov)</span>
          </button>

          <button
            onClick={onOpenPET}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition font-medium shadow-sm active:scale-95"
            title="Penman-Monteith & Hargreaves Evapotranspiration Calculator"
          >
            <SunMedium className="w-4 h-4 text-amber-400" />
            <span>PET MetCmp</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm shadow-cyan-900/30 transition active:scale-95"
            title="Export files for LSPC, SWAT, EFDC, SWMM, WASP"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Model Export</span>
          </button>
        </div>

      </div>
    </header>
  );
};
