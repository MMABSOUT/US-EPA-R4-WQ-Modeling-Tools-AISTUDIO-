import React, { useState, useMemo } from 'react';
import { MetStation, ExportFormat } from '../types';
import { 
  exportToLSPC, 
  exportToSWAT, 
  exportToEFDC, 
  exportToSWMM, 
  exportToWASP, 
  exportToCSV 
} from '../utils/metCalculations';
import { X, Download, FileText, Check, Copy } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: MetStation;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  station
}) => {
  const [format, setFormat] = useState<ExportFormat>('LSPC');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate file content dynamically based on selected format
  const { content, filename, description } = useMemo(() => {
    switch (format) {
      case 'LSPC':
        return {
          content: exportToLSPC(station),
          filename: `${station.id}_weather.air`,
          description: 'Loading Simulation Program in C++ (LSPC) .air weather forcing file'
        };
      case 'SWAT':
        return {
          content: exportToSWAT(station, 'PCP'),
          filename: `pcp1_${station.id}.pcp`,
          description: 'Soil and Water Assessment Tool (SWAT) pcp1.pcp daily precipitation file'
        };
      case 'EFDC':
        return {
          content: exportToEFDC(station),
          filename: `efdc_${station.id}.wea`,
          description: 'Environmental Fluid Dynamics Code (EFDC) .wea atmospheric boundary file'
        };
      case 'SWMM':
        return {
          content: exportToSWMM(station),
          filename: `swmm_${station.id}.dat`,
          description: 'EPA Storm Water Management Model (SWMM) rainfall/climate series .dat'
        };
      case 'WASP':
        return {
          content: exportToWASP(station),
          filename: `wasp_${station.id}.sdb`,
          description: 'Water Quality Analysis Simulation Program (WASP) meteorological .sdb table'
        };
      case 'WDM_CSV':
      default:
        return {
          content: exportToCSV(station),
          filename: `${station.id}_meteorology.csv`,
          description: 'Standard comma-delimited time series table with quality flags'
        };
    }
  }, [format, station]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Water Quality Model File Exporter</h2>
              <p className="text-xs text-slate-400">
                Target Station: <span className="text-cyan-400 font-mono">{station.id}</span> ({station.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Selection Tabs */}
        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Select Target Water Quality / Hydrology Model:</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['LSPC', 'SWAT', 'EFDC', 'SWMM', 'WASP', 'WDM_CSV'] as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-2.5 rounded-lg border text-center font-bold font-mono transition ${
                    format === fmt
                      ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {fmt === 'WDM_CSV' ? 'CSV / WDM' : fmt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-cyan-400/90 mt-2 font-medium">
              Format: {description}
            </p>
          </div>

          {/* Code / Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-300">{filename}</span>
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400/90 overflow-x-auto max-h-64 leading-relaxed">
              {content}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition shadow-md shadow-cyan-900/40"
          >
            <Download className="w-4 h-4" />
            <span>Download {filename}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
