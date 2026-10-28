import React, { useState, useMemo } from 'react';
import { INITIAL_STATIONS } from './data/mockStations';
import { MetStation, MetDataSource } from './types';
import { Header } from './components/Header';
import { StationMap } from './components/StationMap';
import { StationList } from './components/StationList';
import { TimeSeriesViewer } from './components/TimeSeriesViewer';
import { StatsSummary } from './components/StatsSummary';
import { GapFillingModal } from './components/GapFillingModal';
import { StochasticGenModal } from './components/StochasticGenModal';
import { PetCalculatorModal } from './components/PetCalculatorModal';
import { ExportModal } from './components/ExportModal';
import { 
  CloudRain, 
  Layers, 
  Wand2, 
  SunMedium, 
  Download, 
  Database,
  MapPin,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [stations, setStations] = useState<MetStation[]>(INITIAL_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState<string>('USW00013874');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');

  // Modal open states
  const [isGapFillOpen, setIsGapFillOpen] = useState<boolean>(false);
  const [isStochasticOpen, setIsStochasticOpen] = useState<boolean>(false);
  const [isPETOpen, setIsPETOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Active selected station object
  const selectedStation = useMemo(() => {
    return stations.find(s => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  // Filtered station list based on search and filters
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      const matchesSearch = 
        station.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.hucName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.huc8.includes(searchTerm);

      const matchesSource = filterSource === 'ALL' || station.source === filterSource;
      const matchesState = filterState === 'ALL' || station.state === filterState;

      return matchesSearch && matchesSource && matchesState;
    });
  }, [stations, searchTerm, filterSource, filterState]);

  // Handle station records update from gap filling
  const handleUpdateStationRecords = (stationId: string, updatedRecords: any[]) => {
    setStations(prev => prev.map(st => {
      if (st.id === stationId) {
        // Recalculate missing percentage
        const missingCount = updatedRecords.filter(r => r.prec === -9999 || r.tmax === -9999).length;
        const missingPct = Math.round((missingCount / updatedRecords.length) * 1000) / 10;
        return {
          ...st,
          missingPercent: missingPct,
          records: updatedRecords
        };
      }
      return st;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Header & Global Actions */}
      <Header
        totalStations={stations.length}
        selectedCount={1}
        activeDataSource={selectedStation.source}
        onOpenGapFill={() => setIsGapFillOpen(true)}
        onOpenStochastic={() => setIsStochasticOpen(true)}
        onOpenPET={() => setIsPETOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Hydro-Climatic Summary Metrics for Active Station */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Hydro-Climatic Summary Statistics
              </span>
              <span className="text-xs text-cyan-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {selectedStation.name} ({selectedStation.id})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Period: {selectedStation.startDate} &rarr; {selectedStation.endDate}
            </div>
          </div>
          <StatsSummary station={selectedStation} />
        </section>

        {/* Primary Workspace Layout (Map & Station Directory on Left, Chart & Diagnostics on Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Spatial GIS Map & Station List */}
          <div className="lg:col-span-5 space-y-4">
            <StationMap
              stations={filteredStations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              filterSource={filterSource}
              filterState={filterState}
            />

            <StationList
              stations={filteredStations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterSource={filterSource}
              onSourceChange={setFilterSource}
              filterState={filterState}
              onStateChange={setFilterState}
            />
          </div>

          {/* Right Column: Time Series Visualizer & Modeling Actions */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Active Station Card & Fast Exporter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">{selectedStation.name}</h3>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                      {selectedStation.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>Watershed: {selectedStation.hucName} (HUC {selectedStation.huc8})</span>
                    <span>Elevation: {selectedStation.elevation} ft</span>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGapFillOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Fill Gaps</span>
                </button>
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Export Models</span>
                </button>
              </div>
            </div>

            {/* Time Series Graph & Grid */}
            <TimeSeriesViewer station={selectedStation} />

            {/* Modeling Guide / Information Box */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-slate-200">
                  EPA Region 4 Modeling Formats Supported:
                </div>
                <p className="leading-relaxed">
                  Export ready-to-run meteorological files for <strong className="text-slate-300">LSPC</strong> (.air), <strong className="text-slate-300">SWAT</strong> (pcp1.pcp, tmp1.tmp), <strong className="text-slate-300">EFDC</strong> (.wea), <strong className="text-slate-300">SWMM</strong> (.dat), <strong className="text-slate-300">WASP</strong> (.sdb), and <strong className="text-slate-300">WDM/CSV</strong>. Missing values are filled using spatial inverse distance weighting (IDW) or autoregressive models before generating simulation datasets.
                </p>
              </div>
            </div>

          </div>

        </section>
      </main>

      {/* Modals */}
      <GapFillingModal
        isOpen={isGapFillOpen}
        onClose={() => setIsGapFillOpen(false)}
        targetStation={selectedStation}
        allStations={stations}
        onUpdateStationRecords={handleUpdateStationRecords}
      />

      <StochasticGenModal
        isOpen={isStochasticOpen}
        onClose={() => setIsStochasticOpen(false)}
        station={selectedStation}
      />

      <PetCalculatorModal
        isOpen={isPETOpen}
        onClose={() => setIsPETOpen(false)}
        station={selectedStation}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        station={selectedStation}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        EPA Region 4 Water Quality Modeling &amp; Weather Data Processing Suite &bull; Migrated from MMABSOUT/R4-WQ-Modeling-Tools
      </footer>
    </div>
  );
}
