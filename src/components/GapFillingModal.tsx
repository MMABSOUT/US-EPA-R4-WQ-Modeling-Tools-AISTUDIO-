import React, { useState } from 'react';
import { MetStation, MetVariable, EstimationMethod } from '../types';
import { estimateByIDW, estimateByAR1 } from '../utils/metCalculations';
import { X, Wand2, ArrowRight, CheckCircle2, AlertCircle, Compass } from 'lucide-react';

interface GapFillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStation: MetStation;
  allStations: MetStation[];
  onUpdateStationRecords: (stationId: string, updatedRecords: any[]) => void;
}

export const GapFillingModal: React.FC<GapFillingModalProps> = ({
  isOpen,
  onClose,
  targetStation,
  allStations,
  onUpdateStationRecords
}) => {
  const [selectedVar, setSelectedVar] = useState<MetVariable>('PREC');
  const [method, setMethod] = useState<EstimationMethod>('IDW');
  const [power, setPower] = useState<number>(2.0);
  const [selectedDonors, setSelectedDonors] = useState<string[]>(
    allStations.filter(s => s.id !== targetStation.id && s.missingPercent === 0).map(s => s.id)
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const donorList = allStations.filter(s => s.id !== targetStation.id);

  const toggleDonor = (id: string) => {
    if (selectedDonors.includes(id)) {
      setSelectedDonors(selectedDonors.filter(d => d !== id));
    } else {
      setSelectedDonors([...selectedDonors, id]);
    }
  };

  const handleExecute = () => {
    setIsProcessing(true);
    setResultMsg(null);

    setTimeout(() => {
      let updated;
      if (method === 'IDW') {
        const activeDonors = donorList.filter(d => selectedDonors.includes(d.id));
        updated = estimateByIDW(targetStation, activeDonors, selectedVar, power);
      } else {
        updated = estimateByAR1(targetStation, selectedVar);
      }

      const filledCount = updated.filter(r => r.isEstimated && r.isEstimated[selectedVar]).length;
      onUpdateStationRecords(targetStation.id, updated);
      setIsProcessing(false);
      setResultMsg(`Successfully filled ${filledCount} missing records for variable [${selectedVar}] using ${method === 'IDW' ? 'Spatial Inverse Distance Weighting' : 'Autoregressive AR(1)'}.`);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Meteorological Gap Filling &amp; Estimation</h2>
              <p className="text-xs text-slate-400">
                Target: <span className="text-cyan-400 font-mono">{targetStation.id}</span> ({targetStation.name})
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

        {/* Form Body */}
        <div className="py-4 space-y-4 text-xs">
          {/* Target Variable */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">1. Target Variable to Estimate</label>
            <div className="grid grid-cols-4 gap-2">
              {(['PREC', 'TMAX', 'TMIN', 'SOLR', 'WIND', 'DEWP', 'RHUM', 'PEVT'] as MetVariable[]).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVar(v)}
                  className={`py-2 px-3 rounded-lg border text-center font-mono font-medium transition ${
                    selectedVar === v
                      ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Estimation Method */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">2. Estimation Methodology</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setMethod('IDW')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  method === 'IDW'
                    ? 'bg-cyan-950/50 border-cyan-500 text-slate-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Spatial IDW (Nearby Gages)</span>
                  {method === 'IDW' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Inverse Distance Weighting (d⁻ᵖ) using neighboring stations or grid cells in watershed.
                </p>
              </div>

              <div
                onClick={() => setMethod('AR1')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  method === 'AR1'
                    ? 'bg-cyan-950/50 border-cyan-500 text-slate-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Autoregressive AR(1) Fill</span>
                  {method === 'AR1' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Time-domain persistence and autocorrelation interpolation for continuous variables.
                </p>
              </div>
            </div>
          </div>

          {/* IDW Power Parameter & Donors */}
          {method === 'IDW' && (
            <div className="space-y-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Distance Weighting Power (p)</span>
                <span className="font-mono text-cyan-400 font-bold">{power.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.5"
                value={power}
                onChange={(e) => setPower(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />

              <div className="pt-2">
                <span className="text-slate-300 font-medium block mb-1">Donor Meteorological Stations:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {donorList.map(donor => {
                    const isChecked = selectedDonors.includes(donor.id);
                    return (
                      <label
                        key={donor.id}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer text-[11px] ${
                          isChecked ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDonor(donor.id)}
                            className="rounded bg-slate-700 border-slate-600 text-cyan-500"
                          />
                          <span className="font-mono text-cyan-400">{donor.id}</span>
                          <span className="truncate max-w-[220px]">{donor.name}</span>
                        </div>
                        <span className="font-mono text-slate-400">{donor.source}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Status / Success Banner */}
          {resultMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}
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
            onClick={handleExecute}
            disabled={isProcessing || (method === 'IDW' && selectedDonors.length === 0)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition shadow-md shadow-purple-900/40 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isProcessing ? 'Estimating...' : 'Run Estimation & Fill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
