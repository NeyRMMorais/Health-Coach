import React, { useState } from 'react';
import { Activity, Flame, Clock, Award, ChevronRight, Info, RotateCcw, Dumbbell } from 'lucide-react';
import { WorkoutLog, TargetMuscleGroup } from '../types';

interface BodyHeatmapViewProps {
  workoutLogs: WorkoutLog[];
}

export type MuscleKey =
  | 'Chest'
  | 'FrontDelts'
  | 'RearDelts'
  | 'Lats'
  | 'Traps'
  | 'Biceps'
  | 'Triceps'
  | 'Abs'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves';

interface MuscleStats {
  key: MuscleKey;
  label: string;
  targetMuscleGroup: TargetMuscleGroup;
  view: 'front' | 'back' | 'both';
  totalSets7Days: number;
  totalVolume7DaysKg: number;
  lastTrainedHoursAgo: number | null; // null if not trained recently
  lastTrainedDateStr: string | null;
  exercisesLogged: string[];
  status: 'fresh' | 'recovering' | 'fatigued';
  recoveryPct: number; // 0 - 100%
}

export const BodyHeatmapView: React.FC<BodyHeatmapViewProps> = ({ workoutLogs }) => {
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
  const [selectedMuscleKey, setSelectedMuscleKey] = useState<MuscleKey>('Chest');

  // Filter logs within the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentLogs = workoutLogs.filter((log) => {
    const logDate = new Date(`${log.date}T${log.startTime || '00:00'}`);
    return logDate >= sevenDaysAgo;
  });

  // Calculate Muscle Fatigue Stats for each muscle
  const getMuscleStats = (key: MuscleKey, label: string, targetGroup: TargetMuscleGroup, view: 'front' | 'back' | 'both'): MuscleStats => {
    let totalSets = 0;
    let totalVolume = 0;
    let latestTimestamp: number | null = null;
    let latestDateStr: string | null = null;
    const exerciseNamesSet = new Set<string>();

    recentLogs.forEach((log) => {
      const logTimestamp = new Date(`${log.date}T${log.startTime || '12:00'}`).getTime();
      log.exercises.forEach((ex) => {
        // Match exercise to target muscle group or key
        const isMatch =
          ex.targetMuscleGroup === targetGroup ||
          (key === 'FrontDelts' && ex.targetMuscleGroup === 'Shoulders') ||
          (key === 'RearDelts' && ex.targetMuscleGroup === 'Shoulders') ||
          (key === 'Traps' && (ex.targetMuscleGroup === 'Back' || ex.targetMuscleGroup === 'Shoulders')) ||
          (key === 'Lats' && ex.targetMuscleGroup === 'Back') ||
          (key === 'Abs' && ex.targetMuscleGroup === 'Core');

        if (isMatch) {
          const completedSets = ex.sets.filter((s) => s.completed);
          if (completedSets.length > 0) {
            totalSets += completedSets.length;
            totalVolume += completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
            exerciseNamesSet.add(ex.exerciseName);

            if (!latestTimestamp || logTimestamp > latestTimestamp) {
              latestTimestamp = logTimestamp;
              latestDateStr = `${log.date} @ ${log.startTime || '12:00'}`;
            }
          }
        }
      });
    });

    let hoursAgo: number | null = null;
    let status: 'fresh' | 'recovering' | 'fatigued' = 'fresh';
    let recoveryPct = 100;

    if (latestTimestamp) {
      const diffMs = now.getTime() - latestTimestamp;
      hoursAgo = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

      // Recovery curves:
      // < 24h or > 16 sets: Fatigued
      // 24-60h or 8-15 sets: Recovering
      // > 60h or < 6 sets: Fresh
      if (hoursAgo < 24 || totalSets >= 16) {
        status = 'fatigued';
        recoveryPct = Math.min(60, Math.round((hoursAgo / 24) * 60));
      } else if (hoursAgo <= 60 || totalSets >= 8) {
        status = 'recovering';
        recoveryPct = Math.min(95, 60 + Math.round(((hoursAgo - 24) / 36) * 35));
      } else {
        status = 'fresh';
        recoveryPct = 100;
      }
    }

    return {
      key,
      label,
      targetMuscleGroup: targetGroup,
      view,
      totalSets7Days: totalSets,
      totalVolume7DaysKg: totalVolume,
      lastTrainedHoursAgo: hoursAgo,
      lastTrainedDateStr: latestDateStr,
      exercisesLogged: Array.from(exerciseNamesSet),
      status,
      recoveryPct,
    };
  };

  // Define Muscle Groups
  const ALL_MUSCLES: MuscleStats[] = [
    getMuscleStats('Chest', 'Chest (Pectorals)', 'Chest', 'front'),
    getMuscleStats('FrontDelts', 'Front Shoulders (Deltoids)', 'Shoulders', 'front'),
    getMuscleStats('Abs', 'Abs & Core', 'Core', 'front'),
    getMuscleStats('Biceps', 'Biceps', 'Arms', 'front'),
    getMuscleStats('Quads', 'Quadriceps', 'Legs', 'front'),

    getMuscleStats('Lats', 'Lats & Mid-Back', 'Back', 'back'),
    getMuscleStats('Traps', 'Traps & Upper Back', 'Back', 'back'),
    getMuscleStats('RearDelts', 'Rear Shoulders', 'Shoulders', 'back'),
    getMuscleStats('Triceps', 'Triceps', 'Arms', 'back'),
    getMuscleStats('Glutes', 'Glutes', 'Legs', 'back'),
    getMuscleStats('Hamstrings', 'Hamstrings', 'Legs', 'back'),
    getMuscleStats('Calves', 'Calves', 'Legs', 'both'),
  ];

  const selectedStats = ALL_MUSCLES.find((m) => m.key === selectedMuscleKey) || ALL_MUSCLES[0];

  // Helper color map for body diagram
  const getStatusColor = (status: 'fresh' | 'recovering' | 'fatigued', isSelected: boolean) => {
    if (isSelected) return '#3b82f6'; // Bright blue highlight when selected
    if (status === 'fatigued') return '#ef4444'; // Red
    if (status === 'recovering') return '#f59e0b'; // Amber / Yellow
    return '#10b981'; // Emerald / Fresh
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            7-Day Muscle Recovery & Volume Engine
          </div>
          <h2 className="text-xl font-bold text-white">Anatomical Muscle Heatmap</h2>
          <p className="text-xs text-slate-400">
            Interactive fatigue & recovery status based on your last 7 days of training.
          </p>
        </div>

        {/* Front / Back Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setViewMode('front')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'front'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👤 Front View (Anterior)
          </button>
          <button
            onClick={() => setViewMode('back')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'back'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👤 Back View (Posterior)
          </button>
        </div>
      </div>

      {/* Main Grid: Body Diagram (Left) & Muscle Detail Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Anatomical Body Diagram Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center relative min-h-[460px]">
          
          {/* Status Legend */}
          <div className="absolute top-4 left-4 flex items-center gap-3 text-xs bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-3 py-2 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300 font-medium">Fresh (Ready)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-300 font-medium">Recovering</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-slate-300 font-medium">Fatigued</span>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            {viewMode === 'front' ? 'Anterior Body View' : 'Posterior Body View'} (Click a muscle to inspect)
          </div>

          {/* Interactive SVG Body Diagram */}
          <div className="w-full max-w-xs h-96 flex items-center justify-center relative">
            <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl">
              {/* Silhouette Outline */}
              <path
                d="M100 20 C110 20 115 30 115 45 C115 55 125 65 140 70 C155 75 165 95 160 130 C155 165 150 200 150 230 C150 260 140 310 130 380 C120 385 110 385 105 380 C105 300 102 240 100 240 C98 240 95 300 95 380 C90 385 80 385 70 380 C60 310 50 260 50 230 C50 200 45 165 40 130 C35 95 45 75 60 70 C75 65 85 55 85 45 C85 30 90 20 100 20 Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="2"
              />

              {viewMode === 'front' ? (
                <>
                  {/* Chest */}
                  <path
                    d="M72 85 C85 80 100 83 100 105 C85 105 72 100 72 85 Z M128 85 C115 80 100 83 100 105 C115 105 128 100 128 85 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Chest')!.status, selectedMuscleKey === 'Chest')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Chest')}
                  />

                  {/* Front Delts */}
                  <path
                    d="M55 78 C65 75 72 85 68 105 C55 100 50 90 55 78 Z M145 78 C135 75 128 85 132 105 C145 100 150 90 145 78 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'FrontDelts')!.status, selectedMuscleKey === 'FrontDelts')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('FrontDelts')}
                  />

                  {/* Biceps */}
                  <path
                    d="M48 110 C58 110 60 135 52 155 C45 145 42 125 48 110 Z M152 110 C142 110 140 135 148 155 C155 145 158 125 152 110 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Biceps')!.status, selectedMuscleKey === 'Biceps')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Biceps')}
                  />

                  {/* Abs / Core */}
                  <path
                    d="M78 110 L122 110 L118 175 L82 175 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Abs')!.status, selectedMuscleKey === 'Abs')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Abs')}
                  />

                  {/* Quads */}
                  <path
                    d="M62 195 L95 195 L92 280 L68 280 Z M138 195 L105 195 L108 280 L132 280 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Quads')!.status, selectedMuscleKey === 'Quads')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Quads')}
                  />

                  {/* Calves (Front) */}
                  <path
                    d="M70 295 L90 295 L85 360 L75 360 Z M130 295 L110 295 L115 360 L125 360 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Calves')!.status, selectedMuscleKey === 'Calves')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Calves')}
                  />
                </>
              ) : (
                <>
                  {/* Traps */}
                  <path
                    d="M80 50 L120 50 L130 75 L70 75 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Traps')!.status, selectedMuscleKey === 'Traps')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Traps')}
                  />

                  {/* Rear Delts */}
                  <path
                    d="M55 78 C65 75 72 85 68 105 C55 100 50 90 55 78 Z M145 78 C135 75 128 85 132 105 C145 100 150 90 145 78 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'RearDelts')!.status, selectedMuscleKey === 'RearDelts')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('RearDelts')}
                  />

                  {/* Lats */}
                  <path
                    d="M72 85 C85 80 100 83 100 150 L75 155 Z M128 85 C115 80 100 83 100 150 L125 155 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Lats')!.status, selectedMuscleKey === 'Lats')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Lats')}
                  />

                  {/* Triceps */}
                  <path
                    d="M48 110 C58 110 60 135 52 155 C45 145 42 125 48 110 Z M152 110 C142 110 140 135 148 155 C155 145 158 125 152 110 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Triceps')!.status, selectedMuscleKey === 'Triceps')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Triceps')}
                  />

                  {/* Glutes */}
                  <path
                    d="M65 180 L135 180 L130 230 L70 230 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Glutes')!.status, selectedMuscleKey === 'Glutes')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Glutes')}
                  />

                  {/* Hamstrings */}
                  <path
                    d="M65 235 L95 235 L90 290 L70 290 Z M135 235 L105 235 L110 290 L130 290 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Hamstrings')!.status, selectedMuscleKey === 'Hamstrings')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Hamstrings')}
                  />

                  {/* Calves (Back) */}
                  <path
                    d="M70 295 L90 295 L85 360 L75 360 Z M130 295 L110 295 L115 360 L125 360 Z"
                    fill={getStatusColor(ALL_MUSCLES.find((m) => m.key === 'Calves')!.status, selectedMuscleKey === 'Calves')}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => setSelectedMuscleKey('Calves')}
                  />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Selected Muscle Inspection Card (Right Side) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Inspecting Muscle
                </span>
                <h3 className="text-xl font-extrabold text-white">{selectedStats.label}</h3>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedStats.status === 'fatigued'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : selectedStats.status === 'recovering'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedStats.status === 'fatigued'
                  ? '🔴 Fatigued'
                  : selectedStats.status === 'recovering'
                  ? '🟡 Recovering'
                  : '🟢 Fresh'}
              </span>
            </div>

            {/* Recovery Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Recovery Status:</span>
                <span className="text-emerald-400">{selectedStats.recoveryPct}% Recovered</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedStats.status === 'fatigued'
                      ? 'bg-red-500'
                      : selectedStats.status === 'recovering'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${selectedStats.recoveryPct}%` }}
                ></div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Last Trained</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {selectedStats.lastTrainedHoursAgo !== null
                    ? `${selectedStats.lastTrainedHoursAgo} hrs ago`
                    : 'Not trained recently'}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>7-Day Volume</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {selectedStats.totalSets7Days} sets ({selectedStats.totalVolume7DaysKg.toLocaleString()} kg)
                </div>
              </div>
            </div>

            {/* Exercises Performed in Last 7 Days */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300">
                Logged Exercises Targetting {selectedStats.label} (Last 7 Days):
              </span>

              {selectedStats.exercisesLogged.length === 0 ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  No exercises logged for this muscle group in the last 7 days.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedStats.exercisesLogged.map((exName, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-between"
                    >
                      <span>{exName}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                        Logged
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Tip: Switch between <strong>Front</strong> and <strong>Back</strong> views to inspect all major muscle groups.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
