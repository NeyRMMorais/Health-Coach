import React, { useState, useEffect } from 'react';
import { Activity, Calendar } from 'lucide-react';
import { FoodLog, UserProfile } from '../types';
import SingleLineChart from './SingleLineChart';

interface AnalyticsDashboardProps {
  logs: FoodLog[];
  profile: UserProfile | null;
}

// Local helper to parse YYYY-MM-DD local dates safely without timezone shifts
const parseLocalDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

// Local helper to format Date to YYYY-MM-DD local date string
const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generates an array of YYYY-MM-DD date strings from start to end (inclusive)
const getDatesRange = (filterType: string, customDateStr: string) => {
  const dates: string[] = [];
  const today = new Date();
  let start = new Date();

  if (filterType === '7') {
    start.setDate(today.getDate() - 6);
  } else if (filterType === '14') {
    start.setDate(today.getDate() - 13);
  } else if (filterType === '30') {
    start.setDate(today.getDate() - 29);
  } else if (filterType === 'custom' && customDateStr) {
    const parsed = parseLocalDate(customDateStr);
    if (!isNaN(parsed.getTime())) {
      start = parsed;
    }
  }

  // Normalize times to compare by calendar date
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  if (current > end) {
    dates.push(formatLocalDate(today));
    return dates;
  }

  // Set absolute limit of 90 days to prevent chart overcrowding
  let count = 0;
  while (current <= end && count < 90) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
};

export default function AnalyticsDashboard({ logs, profile }: AnalyticsDashboardProps) {
  // Load persisted states from localStorage
  const [filter, setFilter] = useState<string>(() => {
    return localStorage.getItem('healthcoach_analytics_filter') || '7';
  });
  
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    return localStorage.getItem('healthcoach_custom_start_date') || '';
  });

  // Save filter state changes to localStorage
  useEffect(() => {
    localStorage.setItem('healthcoach_analytics_filter', filter);
  }, [filter]);

  // Save custom start date changes to localStorage
  useEffect(() => {
    localStorage.setItem('healthcoach_custom_start_date', customStartDate);
  }, [customStartDate]);

  // Generate date ranges
  const activeDates = getDatesRange(filter, customStartDate);

  // Group logs by date
  const aggregatedData = activeDates.reduce((acc, dateStr) => {
    acc[dateStr] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return acc;
  }, {} as Record<string, { calories: number; protein: number; carbs: number; fats: number }>);

  logs.forEach(log => {
    if (aggregatedData[log.date]) {
      aggregatedData[log.date].calories += log.calories;
      aggregatedData[log.date].protein += log.protein;
      aggregatedData[log.date].carbs += log.carbs;
      aggregatedData[log.date].fats += log.fats;
    }
  });

  // Prepare arrays for line charting
  const caloriesActuals = activeDates.map(d => aggregatedData[d].calories);
  const proteinActuals = activeDates.map(d => aggregatedData[d].protein);
  const carbsActuals = activeDates.map(d => aggregatedData[d].carbs);
  const fatsActuals = activeDates.map(d => aggregatedData[d].fats);

  // Extract goals
  const calLimit = profile?.dailyCaloricLimit ?? 2000;
  const pTarget = profile?.proteinTarget ?? 130;
  const cTarget = profile?.carbsTarget ?? 220;
  const fTarget = profile?.fatsTarget ?? 65;

  return (
    <div className="space-y-6" id="analytics-dashboard-view">
      {/* Header Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-slate-800">Historical Health Metrics</h2>
            <p className="text-xs text-slate-400">Track targets vs. actual intake over time</p>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {[
              { id: '7', label: '7 Days' },
              { id: '14', label: '14 Days' },
              { id: '30', label: '30 Days' },
              { id: 'custom', label: 'Custom Period' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all duration-150 ${
                  filter === btn.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/60'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom Date Input (shows when filter is set to custom) */}
          {filter === 'custom' && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // limit to today or past
                className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Calories Chart */}
      <SingleLineChart
        title="Caloric Intake (kcal)"
        dates={activeDates}
        actuals={caloriesActuals}
        target={calLimit}
        colorClass="emerald"
        unit=" kcal"
      />

      {/* Macronutrient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SingleLineChart
          title="Protein Intake (g)"
          dates={activeDates}
          actuals={proteinActuals}
          target={pTarget}
          colorClass="rose"
          unit="g"
        />
        <SingleLineChart
          title="Carbohydrates Intake (g)"
          dates={activeDates}
          actuals={carbsActuals}
          target={cTarget}
          colorClass="indigo"
          unit="g"
        />
        <SingleLineChart
          title="Fats Intake (g)"
          dates={activeDates}
          actuals={fatsActuals}
          target={fTarget}
          colorClass="amber"
          unit="g"
        />
      </div>
    </div>
  );
}
