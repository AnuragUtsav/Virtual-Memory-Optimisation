import React, { useState, useEffect, useRef } from 'react';
import { Simulator, runComparison } from './core/Simulator';
import { WORKLOAD_TYPES } from './core/WorkloadGenerator';
import { MemoryGrid } from './components/MemoryGrid';
import { MetricsPanel } from './components/MetricsPanel';
import { ComparisonGraphs } from './components/Graphs';
import { ControlPanel } from './components/ControlPanel';

function App() {
  const [config, setConfig] = useState({
    algorithm: 'LRU',
    numFrames: 16,
    frameSize: 4096,
    tlbEnabled: true,
    tlbSize: 8,
    totalAccesses: 100,
    speed: 500, // ms per step
    processes: [
      { id: 0, name: 'Process A', numPages: 10, workloadType: WORKLOAD_TYPES.LOCALITY },
      { id: 1, name: 'Process B', numPages: 15, workloadType: WORKLOAD_TYPES.LOOPING },
    ],
  });

  const [simState, setSimState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [comparisonData, setComparisonData] = useState({});
  const [showEventLog, setShowEventLog] = useState(false);

  const simRef = useRef(null);
  const timerRef = useRef(null);
  const eventsEndRef = useRef(null);

  // Initialize simulator
  useEffect(() => {
    resetSim();
    // Run initial comparison graph data
    generateComparison();
  }, []);

  // Auto-scroll event log
  useEffect(() => {
    if (showEventLog && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simState?.events, showEventLog]);

  const generateComparison = () => {
    const data = runComparison(config, [4, 8, 12, 16, 20, 24, 32]);
    setComparisonData(data);
  };

  const updateStateFromSim = () => {
    if (!simRef.current) return;
    const snap = simRef.current._snapshot(simRef.current.events[simRef.current.events.length - 1]);
    setSimState({
      memory: snap.memory,
      stats: snap.stats,
      processes: snap.processes,
      events: [...simRef.current.events], // Copy to trigger render
      lastEvent: snap.event,
    });
    setProgress(simRef.current.getProgress());

    if (simRef.current.isDone()) {
      setIsRunning(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const resetSim = () => {
    clearInterval(timerRef.current);
    const sim = new Simulator(config);
    sim.init();
    simRef.current = sim;
    setIsRunning(false);
    setIsPaused(false);
    updateStateFromSim();
  };

  const startSim = () => {
    if (simRef.current?.isDone()) resetSim();
    
    // If config changed while not running, apply it
    if (!isRunning && !isPaused) {
       simRef.current = new Simulator(config);
       simRef.current.init();
    }

    setIsRunning(true);
    setIsPaused(false);
    
    timerRef.current = setInterval(() => {
      if (simRef.current) {
        simRef.current.step();
        updateStateFromSim();
      }
    }, Math.max(50, 2050 - config.speed)); // Map slider 50-2000 to timeout
  };

  const stopSim = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setIsPaused(true);
  };

  const stepSim = () => {
    if (!isRunning && simRef.current && !simRef.current.isDone()) {
      // Re-init if needed
      if (!isPaused && progress === 0) {
         simRef.current = new Simulator(config);
         simRef.current.init();
      }
      simRef.current.step();
      updateStateFromSim();
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    // Regen comparison when frame count changes
    generateComparison();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-700/50 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight gradient-text mb-2">
            Virtual Memory Optimizer
          </h1>
          <p className="text-slate-400 font-medium">Interactive Demand Paging & Page Replacement Simulator</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowEventLog(!showEventLog)}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showEventLog ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}
           >
             {showEventLog ? 'Hide Event Log' : 'Show Event Log'}
           </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column (Main Viz) */}
        <div className="flex-1 flex flex-col gap-6">
          <MetricsPanel stats={simState?.stats} />
          <MemoryGrid 
             memory={simState?.memory} 
             processes={simState?.processes}
             lastEvent={simState?.lastEvent}
          />
          <ControlPanel 
             config={config}
             setConfig={handleConfigChange}
             onStart={startSim}
             onStop={stopSim}
             onStep={stepSim}
             onReset={resetSim}
             isRunning={isRunning}
             isPaused={isPaused}
             isFinished={simState && simRef.current?.isDone()}
             progress={progress}
          />
          <ComparisonGraphs comparisonData={comparisonData} />
        </div>

        {/* Right Column (Sidebar / Event Log) */}
        {showEventLog && (
          <div className="w-full lg:w-96 glass-card-accent border-l border-cyan-500/20 p-4 flex flex-col h-[800px]">
            <h3 className="font-bold text-white mb-4 flex justify-between items-center">
              <span>Simulation Events</span>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded text-cyan-400">Step: {simState?.events?.length || 0}</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {simState?.events?.map((evt, idx) => {
                let color = 'text-slate-400';
                let bg = 'bg-slate-800/50';
                let icon = '•';
                
                if (evt.type === 'fault') { color = 'text-red-400'; bg = 'bg-red-500/10 border border-red-500/20'; icon = '⚠'; }
                else if (evt.type === 'replace') { color = 'text-yellow-400'; bg = 'bg-yellow-500/10 border border-yellow-500/20'; icon = '↻'; }
                else if (evt.type === 'hit') { color = 'text-green-400'; bg = 'bg-green-500/10 border border-green-500/20'; icon = '✓'; }
                else if (evt.type === 'tlb_hit') { color = 'text-blue-400'; bg = 'bg-blue-500/10 border border-blue-500/20'; icon = '⚡'; }

                return (
                  <div key={idx} className={`p-3 rounded-lg text-sm ${bg} transition-all duration-300 animate-in fade-in slide-in-from-right-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={color}>{icon}</span>
                      <span className="font-mono font-bold text-white">Step {evt.step + 1}</span>
                    </div>
                    <div className={`${color} font-mono text-xs leading-relaxed`}>
                      {evt.detail}
                    </div>
                  </div>
                );
              })}
              {(!simState?.events || simState.events.length === 0) && (
                <div className="text-slate-500 text-center py-10 italic">
                  Start the simulation to see events...
                </div>
              )}
              <div ref={eventsEndRef} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
