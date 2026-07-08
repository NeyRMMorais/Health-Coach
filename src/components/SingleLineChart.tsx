import React, { useState } from 'react';

interface SingleLineChartProps {
  title: string;
  dates: string[];
  actuals: number[];
  target: number;
  colorClass: 'emerald' | 'rose' | 'indigo' | 'amber';
  unit: string;
}

export default function SingleLineChart({ title, dates, actuals, target, colorClass, unit }: SingleLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const N = dates.length;
  if (N === 0) return null;

  // Find max value for scaling
  const maxActual = Math.max(...actuals);
  const maxValue = Math.max(maxActual, target, 1);
  const yMax = maxValue * 1.15; // 15% padding on top to prevent data points touching roof

  // Chart dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const points = actuals.map((val, idx) => {
    const x = N > 1 
      ? paddingLeft + (idx / (N - 1)) * chartWidth 
      : paddingLeft + chartWidth / 2;
    const y = paddingTop + chartHeight - (val / yMax) * chartHeight;
    return { x, y, val, date: dates[idx] };
  });

  // Calculate target Y coordinate
  const yTarget = paddingTop + chartHeight - (target / yMax) * chartHeight;

  // Colors config mapping
  const colorMap = {
    emerald: {
      line: '#10b981',
      hoverBg: 'bg-emerald-500',
      text: 'text-emerald-600',
    },
    rose: {
      line: '#f43f5e',
      hoverBg: 'bg-rose-500',
      text: 'text-rose-600',
    },
    indigo: {
      line: '#6366f1',
      hoverBg: 'bg-indigo-500',
      text: 'text-indigo-600',
    },
    amber: {
      line: '#f59e0b',
      hoverBg: 'bg-amber-500',
      text: 'text-amber-600',
    }
  };

  const currentColors = colorMap[colorClass];

  // SVG Path for the actual data line
  let linePath = '';
  let areaPath = '';
  if (N > 0) {
    linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    // Area path for gradient fill
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = paddingTop + chartHeight;
    areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  // Grid lines values
  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount }, (_, i) => {
    const val = (yMax / (gridLinesCount - 1)) * i;
    const y = paddingTop + chartHeight - (val / yMax) * chartHeight;
    return { y, val: Math.round(val) };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5 flex flex-col space-y-3 relative group">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: currentColors.line }} />
            <span className="font-semibold text-slate-600 text-[11px]">Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-[2px] w-3 border-t-2 border-dashed border-slate-400" />
            <span className="font-semibold text-slate-400 text-[11px]">Target ({target}{unit})</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[240px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${colorClass}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentColors.line} stopOpacity="0.25" />
              <stop offset="100%" stopColor={currentColors.line} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 8}
                y={line.y + 4}
                className="text-[9px] text-slate-400 font-semibold text-right"
                textAnchor="end"
              >
                {line.val}
              </text>
            </g>
          ))}

          {/* Target line */}
          <line
            x1={paddingLeft}
            y1={yTarget}
            x2={width - paddingRight}
            y2={yTarget}
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            className="opacity-70"
          />

          {/* Actual Line Gradient Area */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#grad-${colorClass})`}
            />
          )}

          {/* Actual Line path */}
          {linePath && (
            <path
              d={linePath}
              fill="transparent"
              stroke={currentColors.line}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 4.5 : 2.5}
              fill={hoveredIdx === idx ? currentColors.line : '#ffffff'}
              stroke={currentColors.line}
              strokeWidth={2}
              className="transition-all duration-100"
            />
          ))}

          {/* Vertical guideline on hover */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <line
              x1={points[hoveredIdx].x}
              y1={paddingTop}
              x2={points[hoveredIdx].x}
              y2={paddingTop + chartHeight}
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
          )}

          {/* Transparent hit boxes for hovering */}
          {points.map((p, idx) => {
            const rectWidth = chartWidth / (N - 1 || 1);
            const rectX = N > 1 
              ? p.x - rectWidth / 2 
              : paddingLeft;
            return (
              <rect
                key={idx}
                x={rectX}
                y={0}
                width={N > 1 ? rectWidth : chartWidth}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              />
            );
          })}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            // Filter labels to prevent overlaps on dense charts
            const modulo = N > 20 ? 5 : N > 10 ? 2 : 1;
            if (idx % modulo !== 0 && idx !== N - 1) return null;

            // Format date nicely (e.g. Jul 8)
            const dateParts = p.date.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formattedDate = dateParts.length === 3
              ? `${monthNames[parseInt(dateParts[1], 10) - 1]} ${parseInt(dateParts[2], 10)}`
              : p.date;

            return (
              <text
                key={idx}
                x={p.x}
                y={height - 8}
                className="text-[9px] text-slate-400 font-bold"
                textAnchor="middle"
              >
                {formattedDate}
              </text>
            );
          })}
        </svg>

        {/* Dynamic Overlay Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div 
            className="absolute z-10 pointer-events-none bg-slate-900/95 backdrop-blur border border-slate-800 text-white rounded-xl p-2.5 shadow-xl text-[11px] space-y-1 transition-all duration-100"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              transform: `translateX(-50%)`,
              top: `${Math.max(10, (points[hoveredIdx].y / height) * 100 - 35)}%`
            }}
          >
            <div className="font-bold text-slate-300">
              {(() => {
                const dateParts = points[hoveredIdx].date.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return dateParts.length === 3 
                  ? `${monthNames[parseInt(dateParts[1], 10) - 1]} ${parseInt(dateParts[2], 10)}, ${dateParts[0]}`
                  : points[hoveredIdx].date;
              })()}
            </div>
            <div className="flex justify-between gap-4">
              <span>Actual:</span>
              <strong className={currentColors.text}>{points[hoveredIdx].val}{unit}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Target:</span>
              <strong className="text-slate-400">{target}{unit}</strong>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 mt-1 text-[10px]">
              <span>Status:</span>
              {points[hoveredIdx].val > target ? (
                <span className="text-rose-400 font-bold">Over Target</span>
              ) : points[hoveredIdx].val === 0 ? (
                <span className="text-slate-400">No logs</span>
              ) : (
                <span className="text-emerald-400 font-bold">On Track</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
