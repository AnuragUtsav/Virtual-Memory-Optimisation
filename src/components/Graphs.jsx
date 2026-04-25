import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export function ComparisonGraphs({ comparisonData }) {
  if (!comparisonData || Object.keys(comparisonData).length === 0) return null;

  // Transform data for Recharts
  const algos = Object.keys(comparisonData);
  if (algos.length === 0 || !comparisonData[algos[0]]) return null;

  const chartData = comparisonData[algos[0]].map((item, index) => {
    const point = { frames: item.frames };
    algos.forEach(algo => {
      point[algo] = comparisonData[algo][index].pageFaults;
    });
    return point;
  });

  const colors = {
    FIFO: '#4cc9f0',
    LRU: '#06d6a0',
    Optimal: '#a78bfa'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-slate-700 !bg-slate-900/90 text-sm">
          <p className="font-bold mb-2 text-white">{`${label} Frames`}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex justify-between gap-4 mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-mono text-white">{entry.value} faults</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 w-full">
      <h2 className="text-xl font-bold mb-6 text-white">Algorithm Comparison (Page Faults vs Frames)</h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="frames" 
              stroke="#94a3b8" 
              label={{ value: 'Number of Physical Frames', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} 
            />
            <YAxis 
              stroke="#94a3b8" 
              label={{ value: 'Total Page Faults', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            {algos.map(algo => (
              <Line 
                key={algo}
                type="monotone" 
                dataKey={algo} 
                stroke={colors[algo]} 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-slate-400 text-center">
        * Bélády's Anomaly may be visible in FIFO (faults increasing with more frames).
      </div>
    </div>
  );
}
