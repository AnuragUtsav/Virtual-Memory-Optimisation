import React from 'react';
import { Play, Square, SkipForward, FastForward, RotateCcw } from 'lucide-react';
import { WORKLOAD_TYPES, workloadInfo } from '../core/WorkloadGenerator';

export function ControlPanel({ 
  config, 
  setConfig, 
  onStart, 
  onStop, 
  onStep, 
  onReset,
  isRunning, 
  isPaused,
  isFinished,
  progress 
}) {
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleProcessChange = (index, key, value) => {
    const newProcs = [...config.processes];
    newProcs[index] = { ...newProcs[index], [key]: value };
    setConfig(prev => ({ ...prev, processes: newProcs }));
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-500">
          Simulation Controls
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Config */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-400 font-medium">Algorithm</label>
          <select 
            disabled={isRunning || isPaused || isFinished}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
            value={config.algorithm}
            onChange={(e) => handleConfigChange('algorithm', e.target.value)}
          >
            <option value="LRU">LRU (Least Recently Used)</option>
            <option value="FIFO">FIFO (First-In, First-Out)</option>
            <option value="Optimal">Optimal (Bélády's)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-400 font-medium">Physical Frames</label>
          <input 
            type="number" 
            min="2" max="64"
            disabled={isRunning || isPaused || isFinished}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
            value={config.numFrames}
            onChange={(e) => handleConfigChange('numFrames', parseInt(e.target.value) || 8)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-400 font-medium">Total Accesses (Length)</label>
          <input 
            type="number" 
            min="10" max="1000"
            disabled={isRunning || isPaused || isFinished}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
            value={config.totalAccesses}
            onChange={(e) => handleConfigChange('totalAccesses', parseInt(e.target.value) || 50)}
          />
        </div>
        
        <div className="flex flex-col gap-2">
           <label className="text-sm text-slate-400 font-medium">Speed (ms/step)</label>
           <input 
            type="range" 
            min="50" max="2000" step="50"
            className="mt-2 accent-cyan-500"
            value={config.speed || 500}
            onChange={(e) => handleConfigChange('speed', parseInt(e.target.value))}
            style={{ direction: 'rtl' }} // Reverse direction so right is faster
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
             <span>Slow</span>
             <span>Fast</span>
          </div>
        </div>
      </div>

      {/* Process Config */}
      <div className="border-t border-slate-700/50 pt-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Workload Configuration</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {config.processes.map((proc, idx) => (
            <div key={proc.id} className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center">
               <div className="flex items-center gap-2 font-mono font-bold w-12" style={{ color: ['#06d6a0', '#4cc9f0', '#a78bfa', '#f472b6'][proc.id % 4] }}>
                  P{proc.id}
               </div>
               <div className="flex-1 flex gap-2 w-full">
                  <div className="flex-1">
                     <select 
                        disabled={isRunning || isPaused || isFinished}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-sm text-white outline-none"
                        value={proc.workloadType}
                        onChange={(e) => handleProcessChange(idx, 'workloadType', e.target.value)}
                     >
                        {Object.entries(workloadInfo).map(([k, v]) => (
                           <option key={k} value={k} title={v.description}>{v.icon} {v.name}</option>
                        ))}
                     </select>
                  </div>
                  <div className="w-24 flex items-center gap-2">
                     <span className="text-xs text-slate-400">Pages:</span>
                     <input 
                        type="number" min="2" max="100"
                        disabled={isRunning || isPaused || isFinished}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-sm text-white outline-none text-center"
                        value={proc.numPages}
                        onChange={(e) => handleProcessChange(idx, 'numPages', parseInt(e.target.value) || 10)}
                     />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons & Progress */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
        <div className="flex gap-3">
          {(!isRunning && !isPaused && !isFinished) && (
            <button 
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
            >
              <Play size={18} fill="currentColor" /> Start Simulation
            </button>
          )}

          {(isRunning || isPaused) && (
            <button 
              onClick={onStop}
              className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
            >
              <Square size={18} fill="currentColor" /> Stop
            </button>
          )}

          {(!isRunning && !isFinished) && (
             <button 
               onClick={onStep}
               className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
               title="Step forward 1 access"
             >
               <SkipForward size={18} /> Step
             </button>
          )}

          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg font-medium transition-all"
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>

        <div className="w-full sm:w-1/3 flex items-center gap-3">
           <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{(progress * 100).toFixed(0)}%</span>
           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                 className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                 style={{ width: `${progress * 100}%` }}
              ></div>
           </div>
        </div>
      </div>
    </div>
  );
}
