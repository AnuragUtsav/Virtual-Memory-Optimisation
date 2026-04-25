import React from 'react';
import { Activity, Zap, Server, AlertTriangle, Layers, Percent } from 'lucide-react';

export function MetricsPanel({ stats }) {
  if (!stats) return null;

  const MetricCard = ({ title, value, subtext, icon: Icon, colorClass, alert }) => (
    <div className={`glass-card p-4 relative overflow-hidden group border ${alert ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-700/50'}`}>
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorClass}`}></div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
      </div>
      <div className="flex flex-col">
        <span className={`text-2xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</span>
        {subtext && <span className="text-xs text-slate-500 mt-1">{subtext}</span>}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
      <MetricCard 
        title="Total Accesses" 
        value={stats.totalAccesses} 
        icon={Activity} 
        colorClass="bg-blue-500" 
      />
      <MetricCard 
        title="Page Faults" 
        value={stats.pageFaults} 
        subtext={`${(stats.pageFaultRate * 100).toFixed(1)}% Rate`}
        icon={AlertTriangle} 
        colorClass="bg-red-500" 
        alert={stats.thrashDetected}
      />
      <MetricCard 
        title="Hit Rate" 
        value={`${(stats.hitRate * 100).toFixed(1)}%`} 
        icon={Zap} 
        colorClass="bg-green-500" 
      />
      <MetricCard 
        title="Replacements" 
        value={stats.replacements} 
        icon={Layers} 
        colorClass="bg-yellow-500" 
      />
      <MetricCard 
        title="Memory Util" 
        value={`${(stats.memoryUtilization * 100).toFixed(0)}%`} 
        icon={Server} 
        colorClass="bg-purple-500" 
      />
      <MetricCard 
        title="Fragmentation" 
        value={`${(stats.totalFragmentation / 1024).toFixed(1)} KB`} 
        icon={Percent} 
        colorClass="bg-pink-500" 
      />
    </div>
  );
}
