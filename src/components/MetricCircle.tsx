import React from 'react';

interface MetricCircleProps {
  value: number; // current intake
  target: number; // caloric goal
  size?: number;
  strokeWidth?: number;
}

export default function MetricCircle({ value, target, size = 180, strokeWidth = 12 }: MetricCircleProps) {
  const goal = target || 2000;
  const percentage = Math.min(Math.round((value / goal) * 100), 999);
  const remaining = goal - value;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Offset to represent the progress
  const strokeDashoffset = circumference - (Math.min(value, goal) / goal) * circumference;

  return (
    <div className="flex flex-col items-center justify-center" id="metric-circle-component">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress Circle with a beautiful emerald green to amber/rose if they go over */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`transition-all duration-500 ease-out ${
              remaining < 0 ? 'text-rose-500' : percentage >= 90 ? 'text-amber-500' : 'text-emerald-500'
            }`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {remaining >= 0 ? 'Remaining' : 'Over Limit'}
          </span>
          <span className={`text-3xl font-extrabold tracking-tight transition-colors duration-300 ${
            remaining < 0 ? 'text-rose-600' : 'text-slate-800'
          }`}>
            {Math.abs(remaining)}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            of {goal} kcal
          </span>
          <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            remaining < 0
              ? 'bg-rose-50 text-rose-600'
              : percentage >= 90
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            {percentage}%
          </div>
        </div>
      </div>
    </div>
  );
}
