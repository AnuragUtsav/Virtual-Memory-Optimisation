import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function MemoryGrid({ memory, processes, lastEvent }) {
  if (!memory) return null;

  return (
    <div className="glass-card p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Physical Memory ({memory.numFrames} Frames)
        </h2>
        <div className="text-sm text-gray-400 font-mono">
          Size: {memory.totalCapacity / 1024} KB
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
        <AnimatePresence>
          {memory.frames.map((frame, index) => {
            const isFault = lastEvent?.type === 'fault' && lastEvent?.frameId === index;
            const isReplace = lastEvent?.type === 'replace' && lastEvent?.frameId === index;
            const isHit = (lastEvent?.type === 'hit' || lastEvent?.type === 'tlb_hit') && lastEvent?.frameId === index;
            
            const proc = frame.occupied ? processes.find(p => p.id === frame.processId) : null;
            const color = proc ? proc.color : 'transparent';
            
            // Calculate fragmentation percentage for visual fill
            const fillPercent = frame.occupied ? (frame.usedBytes / frame.frameSize) * 100 : 0;

            return (
              <motion.div
                key={`frame-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  relative h-24 rounded-lg flex flex-col items-center justify-center border-2 overflow-hidden
                  ${!frame.occupied ? 'border-slate-700 bg-slate-800/50' : ''}
                  ${isFault ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}
                  ${isReplace ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : ''}
                  ${isHit ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}
                  ${frame.occupied && !isFault && !isReplace && !isHit ? 'border-slate-600' : ''}
                  transition-all duration-300
                `}
                style={{
                  backgroundColor: frame.occupied ? `${color}20` : undefined,
                  borderColor: frame.occupied && !isFault && !isReplace && !isHit ? color : undefined,
                }}
              >
                {/* Background fill representing used space */}
                {frame.occupied && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 opacity-20"
                    style={{ 
                      height: `${fillPercent}%`,
                      backgroundColor: color
                    }}
                  />
                )}

                <div className="z-10 font-mono text-xs text-slate-400 mb-1">
                  Frame {index}
                </div>
                
                {frame.occupied ? (
                  <>
                    <div className="z-10 font-bold text-lg" style={{ color }}>
                      P{frame.processId}-P{frame.pageId}
                    </div>
                    {/* Tooltip on hover (simplified with title for now) */}
                    <div className="absolute inset-0 z-20" title={`Process: ${proc?.name || frame.processId}\nPage: ${frame.pageId}\nLoaded: step ${frame.loadedAt}\nUsed: ${frame.usedBytes}/${frame.frameSize}B\nFrag: ${frame.fragmentation}B`} />
                  </>
                ) : (
                  <div className="z-10 text-slate-500 text-sm">Empty</div>
                )}

                {/* Highlight animations */}
                {(isFault || isReplace) && (
                  <motion.div 
                    initial={{ opacity: 0.8, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 rounded-lg ${isFault ? 'bg-red-500' : 'bg-yellow-500'}`}
                  />
                )}
                {isHit && (
                  <motion.div 
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-green-500"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-700"></div> Empty</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Hit</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Page Fault</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div> Replacement</div>
      </div>
    </div>
  );
}
