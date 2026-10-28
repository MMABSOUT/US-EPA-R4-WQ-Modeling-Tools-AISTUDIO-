import React, { useState, useMemo } from 'react';
import { MetStation, StochasticParameters } from '../types';
import { fitMarkovRainModel } from '../utils/metCalculations';
import { X, Layers, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

interface StochasticGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: MetStation;
}

export const StochasticGenModal: React.FC<StochasticGenModalProps> = ({
  isOpen,
  onClose,
  station
}) => {
  const defaultParams = useMemo(() => fitMarkovRainModel(station.records), [station]);

  const [p01, setP01] = useState<number>(defaultParams.p01);
  const [p11, setP11] = useState<number>(defaultParams.p11);
  const [meanRain, setMeanRain] = useState<number>(defaultParams.meanRain);
  const [simYears, setSimYears] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResults, setGeneratedResults] = useState<{
    totalRain: number;
    wetDays: number;
    annualAvg: number;
    maxEvent: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate Markov chain for simYears * 365 days
      const days = simYears * 365;
      let wetCount = 0;
      let totalRain = 0;
      let maxEvent = 0;
      let isWetYesterday = false;

      for (let i = 0; i < days; i++) {
        const pWet = isWetYesterday ? p11 : p01;
        const isWetToday = Math.random() < pWet;
        if (isWetToday) {
          wetCount++;
          // Gamma rain depth approximation
          const rain = Math.round((-Math.log(1 - Math.random() * 0.99) * meanRain) * 100) / 100;
          totalRain += rain;
          if (rain > maxEvent) maxEvent = rain;
          isWetYesterday = true;
        } else {
          isWetYesterday = false;
        }
      }

      setGeneratedResults({
        totalRain: Math.round(totalRain * 10) / 10,
        wetDays: wetCount,
        annualAvg: Math.round((totalRain / simYears) * 10) / 10,
        maxEvent: Math.round(maxEvent * 100) / 100
      });
      setIsGenerating(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">WeaGen: Stochastic Weather Generator</h2>
              <p className="text-xs text-slate-400">
                Markov Chain Transition Model for <span className="text-cyan-400 font-mono">{station.name}</span>
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
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-300">
            <div className="font-semibold text-slate-200 mb-1">Empirically Calibrated Parameters:</div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">P(W|D) Dry &rarr; Wet</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">{defaultParams.p01}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">P(W|W) Wet &rarr; Wet</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">{defaultParams.p11}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Mean Wet Depth</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">{defaultParams.meanRain} in</span>
              </div>
            </div>
          </div>

          {/* Parameter Sliders */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Transition Prob P(W|D) - Dry to Wet Day:</span>
                <span className="font-mono text-cyan-400 font-bold">{p01.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.01"
                value={p01}
                onChange={(e) => setP01(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Transition Prob P(W|W) - Wet to Wet Day (Persistence):</span>
                <span className="font-mono text-cyan-400 font-bold">{p11.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.01"
                value={p11}
                onChange={(e) => setP11(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Mean Rain Event Depth (inches):</span>
                <span className="font-mono text-cyan-400 font-bold">{meanRain.toFixed(2)} in</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={meanRain}
                onChange={(e) => setMeanRain(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Simulation Horizon (Years):</span>
                <span className="font-mono text-cyan-400 font-bold">{simYears} years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={simYears}
                onChange={(e) => setSimYears(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Generated Results Banner */}
          {generatedResults && (
            <div className="p-3.5 bg-cyan-950/40 border border-cyan-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Synthetic Realization Generated ({simYears} Years)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Annual Average Precipitation:</span>
                  <span className="text-base font-bold font-mono text-white">{generatedResults.annualAvg} in/yr</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Wet Day Count:</span>
                  <span className="text-base font-bold font-mono text-white">{generatedResults.wetDays} days</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Max 24-hr Rain Event:</span>
                  <span className="text-base font-bold font-mono text-white">{generatedResults.maxEvent} in</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Total Precipitation:</span>
                  <span className="text-base font-bold font-mono text-white">{generatedResults.totalRain} in</span>
                </div>
              </div>
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
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition shadow-md shadow-cyan-900/40 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Simulating...' : 'Generate Synthetic Series'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
