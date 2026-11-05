import React from 'react';

interface TrendChartProps {
  data: { date: string; sales: number; count: number }[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
        No sales records in the past 7 days
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.sales), 100);
  const chartHeight = 130;
  const chartWidth = 500;
  const paddingX = 35;
  const paddingY = 24;

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
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#09090b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#e4e4e7"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#f4f4f5"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill="url(#salesGrad)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r={p.sales > 0 ? "4" : "2.5"}
                className="fill-white stroke-black stroke-2"
              />
              {p.sales > 0 && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="text-xs fill-black font-sans tabular-nums font-bold"
                >
                  ₹{p.sales >= 1000 ? `${(p.sales / 1000).toFixed(1)}k` : p.sales}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Date labels */}
      <div className="flex justify-between px-4 mt-2 border-t border-zinc-200 pt-2.5 text-xs text-zinc-600 font-medium">
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

