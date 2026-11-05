import React from 'react';

interface TrendChartProps {
  data: { date: string; sales: number; count: number }[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        No sales records in the past 7 days
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.sales), 100);
  const chartHeight = 120;
  const chartWidth = 500;
  const paddingX = 30;
  const paddingY = 20;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.sales / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 overflow-visible">
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill="url(#salesGrad)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r={p.sales > 0 ? "3.5" : "2"}
                className="fill-white stroke-emerald-600 stroke-2 hover:r-5 transition-all"
              />
              {p.sales > 0 && (
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-600 font-medium"
                >
                  ₹{p.sales >= 1000 ? `${(p.sales / 1000).toFixed(1)}k` : p.sales}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Date labels */}
      <div className="flex justify-between px-4 mt-1 border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-mono">
        {data.map((d, i) => {
          const dateObj = new Date(d.date);
          const formatted = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
          return (
            <span key={i} className="text-center">
              {formatted}
            </span>
          );
        })}
      </div>
    </div>
  );
};

