import React, { useState } from 'react';
import { MetStation } from '../types';
import { calculatePenmanMonteith, calculateHargreaves } from '../utils/metCalculations';
import { X, SunMedium, Flame, Wind, Droplet, ArrowRight, Gauge } from 'lucide-react';

interface PetCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: MetStation;
}

export const PetCalculatorModal: React.FC<PetCalculatorModalProps> = ({
  isOpen,
  onClose,
  station
}) => {
  // Test sample climate parameters
  const [tmean, setTmean] = useState<number>(75); // °F
  const [tmax, setTmax] = useState<number>(86); // °F
  const [tmin, setTmin] = useState<number>(64); // °F
  const [solr, setSolr] = useState<number>(450); // Ly/day
  const [wind, setWind] = useState<number>(6.5); // mph
  const [rhum, setRhum] = useState<number>(65); // %
  const [elevation, setElevation] = useState<number>(station.elevation || 800); // ft

  if (!isOpen) return null;

  // Convert units to metric for standard equations
  const tmeanC = ((tmean - 32) * 5) / 9;
  const tmaxC = ((tmax - 32) * 5) / 9;
  const tminC = ((tmin - 32) * 5) / 9;
  // 1 Langley/day = 0.04184 MJ/m2/day
  const solrMJ = solr * 0.04184;
  // 1 mph = 0.44704 m/s
  const windMps = wind * 0.44704;
  const elevationM = elevation * 0.3048;

  // Compute Penman-Monteith (FAO-56 / SWAT)
  const penmanMm = calculatePenmanMonteith(tmeanC, tmaxC, tminC, solrMJ, windMps, rhum, elevationM);
  const penmanIn = penmanMm * 0.03937;

  // Compute Hargreaves-Samani
  const hargreavesMm = calculateHargreaves(tmeanC, tmaxC, tminC, station.latitude, 180);
  const hargreavesIn = hargreavesMm * 0.03937;

  // Jensen-Haise solar PET
  const jensenMm = Math.max(0, (0.025 * (tmeanC - 3)) * (solrMJ / 2.45));
  const jensenIn = jensenMm * 0.03937;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Evapotranspiration MetCmp Module</h2>
              <p className="text-xs text-slate-400">
                Penman-Monteith (FAO-56/SWAT) &amp; Hargreaves PET Formulations
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

        {/* Body Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Comparison Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-800/80 shadow-md">
              <div className="text-[11px] text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                <span>Penman-Monteith</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {penmanIn.toFixed(2)} <span className="text-xs font-normal text-slate-400">in/day</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {penmanMm.toFixed(2)} mm/day (FAO-56 SWAT)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-950/60 to-slate-900 border border-amber-800/80 shadow-md">
              <div className="text-[11px] text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Hargreaves-Samani</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {hargreavesIn.toFixed(2)} <span className="text-xs font-normal text-slate-400">in/day</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {hargreavesMm.toFixed(2)} mm/day (Temp-Ra based)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-cyan-950/60 to-slate-900 border border-cyan-800/80 shadow-md">
              <div className="text-[11px] text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5" />
                <span>Jensen-Haise</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {jensenIn.toFixed(2)} <span className="text-xs font-normal text-slate-400">in/day</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {jensenMm.toFixed(2)} mm/day (Radiation based)
              </div>
            </div>
          </div>

          {/* Interactive Parameters */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <span className="font-semibold text-slate-200 block text-xs">
              Meteorological Inputs for Calibration:
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Max / Min Temp (°F):</span>
                  <span className="font-mono text-cyan-400 font-bold">{tmax}° / {tmin}°</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="40"
                    max="110"
                    value={tmax}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTmax(val);
                      setTmean((val + tmin) / 2);
                    }}
                    className="w-full accent-rose-500"
                  />
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={tmin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTmin(val);
                      setTmean((tmax + val) / 2);
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Solar Radiation (Ly/day):</span>
                  <span className="font-mono text-amber-400 font-bold">{solr} Ly</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="750"
                  value={solr}
                  onChange={(e) => setSolr(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Wind Speed (mph):</span>
                  <span className="font-mono text-purple-400 font-bold">{wind.toFixed(1)} mph</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.5"
                  value={wind}
                  onChange={(e) => setWind(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Relative Humidity (%):</span>
                  <span className="font-mono text-sky-400 font-bold">{rhum}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={rhum}
                  onChange={(e) => setRhum(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-slate-200">Engineering Note:</strong> The Penman-Monteith method incorporates both aerodynamic vapor transport and net radiation energy flux, recommended by the EPA and SWAT for watershed water yield modeling.
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
        </div>
      </div>
    </div>
  );
};
