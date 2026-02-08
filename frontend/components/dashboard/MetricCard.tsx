interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: string;
  }
  
  export function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
    const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    
    return (
      <div className="glass-card p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <svg className="w-16 h-16 fill-current text-white" viewBox="0 0 24 24"><path d={icon} /></svg>
        </div>
        
        <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 ${trendColor} flex items-center gap-1`}>
            <span>{trendIcon}</span>
            {change}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">前月比</p>
      </div>
    );
  }
