import React, { useState } from 'react';
import { Activity, Flame, Clock, Award, Info, Dumbbell, Zap, RefreshCw, ChevronRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { WorkoutLog, TargetMuscleGroup } from '../types';

interface BodyHeatmapViewProps {
  workoutLogs: WorkoutLog[];
}

export type MuscleKey =
  | 'ChestUpper'
  | 'ChestLower'
  | 'FrontDelts'
  | 'SideDelts'
  | 'RearDelts'
  | 'Lats'
  | 'Traps'
  | 'LowerBack'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Abs'
  | 'Obliques'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves';

interface MuscleData {
  key: MuscleKey;
  label: string;
  sublabel: string;
  targetGroup: TargetMuscleGroup;
  view: 'front' | 'back' | 'both';
  totalSets7Days: number;
  totalVolume7DaysKg: number;
  lastTrainedHoursAgo: number | null;
  lastTrainedDateStr: string | null;
  exercisesLogged: string[];
  status: 'fresh' | 'recovering' | 'fatigued' | 'untrained';
  recoveryPct: number;
  readinessRecommendation: string;
}

export const BodyHeatmapView: React.FC<BodyHeatmapViewProps> = ({ workoutLogs }) => {
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
  const [selectedKey, setSelectedKey] = useState<MuscleKey>('ChestUpper');

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentLogs = workoutLogs.filter((log) => {
    const logDate = new Date(`${log.date}T${log.startTime || '00:00'}`);
    return logDate >= sevenDaysAgo;
  });

  // Calculate Muscle Fatigue Stats
  const calculateMuscleData = (
    key: MuscleKey,
    label: string,
    sublabel: string,
    targetGroup: TargetMuscleGroup,
    view: 'front' | 'back' | 'both'
  ): MuscleData => {
    let totalSets = 0;
    let totalVolume = 0;
    let latestTimestamp: number | null = null;
    let latestDateStr: string | null = null;
    const exerciseNames = new Set<string>();

    recentLogs.forEach((log) => {
      const logTimestamp = new Date(`${log.date}T${log.startTime || '12:00'}`).getTime();
      log.exercises.forEach((ex) => {
        const isMatch =
          ex.targetMuscleGroup === targetGroup ||
          (key.includes('Delt') && ex.targetMuscleGroup === 'Shoulders') ||
          (key === 'Traps' && (ex.targetMuscleGroup === 'Back' || ex.targetMuscleGroup === 'Shoulders')) ||
          (key === 'Lats' && ex.targetMuscleGroup === 'Back') ||
          (key === 'LowerBack' && ex.targetMuscleGroup === 'Back') ||
          (key === 'Abs' && ex.targetMuscleGroup === 'Core') ||
          (key === 'Obliques' && ex.targetMuscleGroup === 'Core');

        if (isMatch) {
          const completed = ex.sets.filter((s) => s.completed);
          if (completed.length > 0) {
            totalSets += completed.length;
            totalVolume += completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
            exerciseNames.add(ex.exerciseName);

            if (!latestTimestamp || logTimestamp > latestTimestamp) {
              latestTimestamp = logTimestamp;
              latestDateStr = `${log.date} @ ${log.startTime || '12:00'}`;
            }
          }
        }
      });
    });

    let hoursAgo: number | null = null;
    let status: 'fresh' | 'recovering' | 'fatigued' | 'untrained' = 'untrained';
    let recoveryPct = 100;
    let recommendation = 'No recent training logged. Ready for heavy loading.';

    if (latestTimestamp) {
      const diffMs = now.getTime() - latestTimestamp;
      hoursAgo = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

      if (hoursAgo < 24 || totalSets >= 16) {
        status = 'fatigued';
        recoveryPct = Math.min(55, Math.max(10, Math.round((hoursAgo / 24) * 55)));
        recommendation = `High muscle stress. Allow ~${Math.max(4, 36 - hoursAgo)}h for optimal protein synthesis.`;
      } else if (hoursAgo <= 60 || totalSets >= 8) {
        status = 'recovering';
        recoveryPct = Math.min(95, 60 + Math.round(((hoursAgo - 24) / 36) * 35));
        recommendation = 'Moderate recovery phase. Ideal for moderate or hyper-trophy loading.';
      } else {
        status = 'fresh';
        recoveryPct = 100;
        recommendation = 'Fully recovered & supercompensated. Prime window for peak progressive overload.';
      }
    }

    return {
      key,
      label,
      sublabel,
      targetGroup,
      view,
      totalSets7Days: totalSets,
      totalVolume7DaysKg: totalVolume,
      lastTrainedHoursAgo: hoursAgo,
      lastTrainedDateStr: latestDateStr,
      exercisesLogged: Array.from(exerciseNames),
      status,
      recoveryPct,
      readinessRecommendation: recommendation,
    };
  };

  const MUSCLES: MuscleData[] = [
    // Front View Muscles
    calculateMuscleData('ChestUpper', 'Upper Chest', 'Pectoralis Major (Clavicular)', 'Chest', 'front'),
    calculateMuscleData('ChestLower', 'Lower Chest', 'Pectoralis Major (Sternal)', 'Chest', 'front'),
    calculateMuscleData('FrontDelts', 'Front Delts', 'Anterior Deltoid', 'Shoulders', 'front'),
    calculateMuscleData('SideDelts', 'Side Delts', 'Lateral Deltoid', 'Shoulders', 'front'),
    calculateMuscleData('Biceps', 'Biceps Brachii', 'Biceps Short & Long Heads', 'Arms', 'front'),
    calculateMuscleData('Forearms', 'Forearms', 'Brachioradialis & Flexors', 'Arms', 'front'),
    calculateMuscleData('Abs', 'Abs / Core', 'Rectus Abdominis', 'Core', 'front'),
    calculateMuscleData('Obliques', 'Obliques', 'External & Internal Obliques', 'Core', 'front'),
    calculateMuscleData('Quads', 'Quadriceps', 'Rectus Femoris & Vastus Lateralis', 'Legs', 'front'),

    // Back View Muscles
    calculateMuscleData('Traps', 'Trapezius', 'Upper & Mid Trapezius', 'Back', 'back'),
    calculateMuscleData('Lats', 'Lats (Latissimus Dorsi)', 'Latissimus Dorsi & Rhomboids', 'Back', 'back'),
    calculateMuscleData('RearDelts', 'Rear Delts', 'Posterior Deltoid', 'Shoulders', 'back'),
    calculateMuscleData('Triceps', 'Triceps Brachii', 'Triceps Long, Lateral & Medial Heads', 'Arms', 'back'),
    calculateMuscleData('LowerBack', 'Lower Back', 'Erector Spinae', 'Back', 'back'),
    calculateMuscleData('Glutes', 'Gluteus Maximus', 'Gluteus Maximus & Medius', 'Legs', 'back'),
    calculateMuscleData('Hamstrings', 'Hamstrings', 'Biceps Femoris & Semitendinosus', 'Legs', 'back'),
    calculateMuscleData('Calves', 'Calves', 'Gastrocnemius & Soleus', 'Legs', 'both'),
  ];

  const selected = MUSCLES.find((m) => m.key === selectedKey) || MUSCLES[0];

  // Helper color map for vector diagram
  const getMuscleFill = (mKey: MuscleKey) => {
    const m = MUSCLES.find((item) => item.key === mKey);
    const isSelected = selectedKey === mKey;

    if (isSelected) return '#38bdf8'; // Electric Cyan highlight when active
    if (!m || m.status === 'untrained') return '#1e293b'; // Dark Slate
    if (m.status === 'fatigued') return '#ef4444'; // Neon Red
    if (m.status === 'recovering') return '#f59e0b'; // Gold / Amber
    return '#10b981'; // Emerald Green
  };

  const getMuscleGlowClass = (mKey: MuscleKey) => {
    const m = MUSCLES.find((item) => item.key === mKey);
    if (selectedKey === mKey) return 'drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]';
    if (!m || m.status === 'untrained') return '';
    if (m.status === 'fatigued') return 'drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]';
    if (m.status === 'recovering') return 'drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]';
    return 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Activity className="w-3.5 h-3.5" />
            7-Day Muscle Activation & Recovery Matrix
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Anatomical Muscle Heatmap
          </h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Track muscle fatigue, volume distribution, and localized recovery windows across all major target groups.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner z-10">
          <button
            onClick={() => {
              setViewMode('front');
              setSelectedKey('ChestUpper');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              viewMode === 'front'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>Anterior (Front)</span>
          </button>
          <button
            onClick={() => {
              setViewMode('back');
              setSelectedKey('Lats');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              viewMode === 'back'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>Posterior (Back)</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Anatomical Vector Model & Legend */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between relative min-h-[560px]">
          
          {/* Status Legend Header */}
          <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {viewMode === 'front' ? 'Anterior View' : 'Posterior View'}
            </span>

            <div className="flex items-center gap-3 text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                <span className="text-slate-300">Fresh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
                <span className="text-slate-300">Recovering</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                <span className="text-slate-300">Fatigued</span>
              </div>
            </div>
          </div>

          {/* High-Fidelity Anatomical SVG Body Illustration */}
          <div className="w-full max-w-sm h-[420px] my-4 flex items-center justify-center relative">
            <svg viewBox="0 0 300 600" className="w-full h-full">
              {/* Outer Body Outline / Shadow Silhouette */}
              <path
                d="M150 25 C165 25 175 40 175 62 C175 75 190 90 215 95 C238 100 250 130 242 180 C235 225 228 270 225 310 C222 350 210 420 195 540 C182 550 165 550 158 540 C158 430 154 340 150 340 C146 340 142 430 142 540 C135 550 118 550 105 540 C90 420 78 350 75 310 C72 270 65 225 58 180 C50 130 62 100 85 95 C110 90 125 75 125 62 C125 40 135 25 150 25 Z"
                fill="#090d16"
                stroke="#1e293b"
                strokeWidth="3"
              />

              {viewMode === 'front' ? (
                <>
                  {/* FRONT: Upper Chest */}
                  <path
                    d="M108 120 C125 112 150 116 150 145 C125 145 108 138 108 120 Z M192 120 C175 112 150 116 150 145 C175 145 192 138 192 120 Z"
                    fill={getMuscleFill('ChestUpper')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('ChestUpper')}`}
                    onClick={() => setSelectedKey('ChestUpper')}
                  />

                  {/* FRONT: Lower Chest */}
                  <path
                    d="M108 142 C125 142 150 147 150 170 C125 170 108 162 108 142 Z M192 142 C175 142 150 147 150 170 C175 170 192 162 192 142 Z"
                    fill={getMuscleFill('ChestLower')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('ChestLower')}`}
                    onClick={() => setSelectedKey('ChestLower')}
                  />

                  {/* FRONT: Front Delts */}
                  <path
                    d="M82 110 C98 105 108 120 102 148 C84 140 76 126 82 110 Z M218 110 C202 105 192 120 198 148 C216 140 224 126 218 110 Z"
                    fill={getMuscleFill('FrontDelts')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('FrontDelts')}`}
                    onClick={() => setSelectedKey('FrontDelts')}
                  />

                  {/* FRONT: Side Delts */}
                  <path
                    d="M72 118 C80 115 84 135 78 152 C68 145 65 132 72 118 Z M228 118 C220 115 216 135 222 152 C232 145 235 132 228 118 Z"
                    fill={getMuscleFill('SideDelts')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('SideDelts')}`}
                    onClick={() => setSelectedKey('SideDelts')}
                  />

                  {/* FRONT: Biceps */}
                  <path
                    d="M70 155 C85 155 88 190 76 220 C66 205 62 178 70 155 Z M230 155 C215 155 212 190 224 220 C234 205 238 178 230 155 Z"
                    fill={getMuscleFill('Biceps')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Biceps')}`}
                    onClick={() => setSelectedKey('Biceps')}
                  />

                  {/* FRONT: Forearms */}
                  <path
                    d="M66 225 C76 225 78 265 68 295 C58 285 56 250 66 225 Z M234 225 C224 225 222 265 232 295 C242 285 244 250 234 225 Z"
                    fill={getMuscleFill('Forearms')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Forearms')}`}
                    onClick={() => setSelectedKey('Forearms')}
                  />

                  {/* FRONT: Abs */}
                  <path
                    d="M118 175 L182 175 L176 270 L124 270 Z"
                    fill={getMuscleFill('Abs')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Abs')}`}
                    onClick={() => setSelectedKey('Abs')}
                  />

                  {/* FRONT: Obliques */}
                  <path
                    d="M102 175 L116 175 L122 265 L108 265 Z M198 175 L184 175 L178 265 L192 265 Z"
                    fill={getMuscleFill('Obliques')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Obliques')}`}
                    onClick={() => setSelectedKey('Obliques')}
                  />

                  {/* FRONT: Quads */}
                  <path
                    d="M92 290 L142 290 L138 415 L102 415 Z M208 290 L158 290 L162 415 L198 415 Z"
                    fill={getMuscleFill('Quads')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Quads')}`}
                    onClick={() => setSelectedKey('Quads')}
                  />

                  {/* FRONT: Calves */}
                  <path
                    d="M105 435 L135 435 L128 530 L112 530 Z M195 435 L165 435 L172 530 L188 530 Z"
                    fill={getMuscleFill('Calves')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Calves')}`}
                    onClick={() => setSelectedKey('Calves')}
                  />
                </>
              ) : (
                <>
                  {/* BACK: Traps */}
                  <path
                    d="M120 70 L180 70 L195 110 L105 110 Z"
                    fill={getMuscleFill('Traps')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Traps')}`}
                    onClick={() => setSelectedKey('Traps')}
                  />

                  {/* BACK: Rear Delts */}
                  <path
                    d="M82 110 C98 105 108 120 102 148 C84 140 76 126 82 110 Z M218 110 C202 105 192 120 198 148 C216 140 224 126 218 110 Z"
                    fill={getMuscleFill('RearDelts')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('RearDelts')}`}
                    onClick={() => setSelectedKey('RearDelts')}
                  />

                  {/* BACK: Lats */}
                  <path
                    d="M108 115 C128 112 150 120 150 210 L112 215 Z M192 115 C172 112 150 120 150 210 L188 215 Z"
                    fill={getMuscleFill('Lats')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Lats')}`}
                    onClick={() => setSelectedKey('Lats')}
                  />

                  {/* BACK: Triceps */}
                  <path
                    d="M70 155 C85 155 88 190 76 220 C66 205 62 178 70 155 Z M230 155 C215 155 212 190 224 220 C234 205 238 178 230 155 Z"
                    fill={getMuscleFill('Triceps')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Triceps')}`}
                    onClick={() => setSelectedKey('Triceps')}
                  />

                  {/* BACK: Lower Back */}
                  <path
                    d="M120 215 L180 215 L174 265 L126 265 Z"
                    fill={getMuscleFill('LowerBack')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('LowerBack')}`}
                    onClick={() => setSelectedKey('LowerBack')}
                  />

                  {/* BACK: Glutes */}
                  <path
                    d="M95 270 L205 270 L198 340 L102 340 Z"
                    fill={getMuscleFill('Glutes')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Glutes')}`}
                    onClick={() => setSelectedKey('Glutes')}
                  />

                  {/* BACK: Hamstrings */}
                  <path
                    d="M95 345 L142 345 L136 425 L102 425 Z M205 345 L158 345 L164 425 L198 425 Z"
                    fill={getMuscleFill('Hamstrings')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Hamstrings')}`}
                    onClick={() => setSelectedKey('Hamstrings')}
                  />

                  {/* BACK: Calves */}
                  <path
                    d="M105 435 L135 435 L128 530 L112 530 Z M195 435 L165 435 L172 530 L188 530 Z"
                    fill={getMuscleFill('Calves')}
                    stroke="#020617"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all hover:opacity-90 ${getMuscleGlowClass('Calves')}`}
                    onClick={() => setSelectedKey('Calves')}
                  />
                </>
              )}
            </svg>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Click any highlighted muscle region to inspect details
          </div>
        </div>

        {/* Right Column: Muscle Details Inspector Panel & Muscle Quick Grid */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Active Muscle Inspector Card */}
          <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Selected Muscle Group
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">{selected.label}</h3>
                <p className="text-xs text-slate-400 font-mono">{selected.sublabel}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg ${
                  selected.status === 'fatigued'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-red-500/10'
                    : selected.status === 'recovering'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/10'
                    : selected.status === 'fresh'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {selected.status === 'fatigued'
                  ? '🔴 Fatigued'
                  : selected.status === 'recovering'
                  ? '🟡 Recovering'
                  : selected.status === 'fresh'
                  ? '🟢 Fresh'
                  : '⚪ Untrained'}
              </span>
            </div>

            {/* Recovery Bar & Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Estimated Recovery Level:</span>
                <span className="text-emerald-400 font-mono text-sm">{selected.recoveryPct}%</span>
              </div>
              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selected.status === 'fatigued'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                      : selected.status === 'recovering'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                  }`}
                  style={{ width: `${selected.recoveryPct}%` }}
                ></div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Time Since Last Set</span>
                </div>
                <div className="text-base font-extrabold text-white font-mono">
                  {selected.lastTrainedHoursAgo !== null
                    ? `${selected.lastTrainedHoursAgo} hrs ago`
                    : 'Not trained recently'}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>7-Day Volume Load</span>
                </div>
                <div className="text-base font-extrabold text-white font-mono">
                  {selected.totalSets7Days} sets ({selected.totalVolume7DaysKg.toLocaleString()} kg)
                </div>
              </div>
            </div>

            {/* Readiness Recommendation Box */}
            <div className="p-4 bg-slate-950/90 border border-emerald-500/20 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>AI Readiness & Overload Recommendation</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {selected.readinessRecommendation}
              </p>
            </div>

            {/* Exercises Performed in Last 7 Days */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-300 block">
                Logged Exercises Targetting {selected.label} (Last 7 Days):
              </span>

              {selected.exercisesLogged.length === 0 ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                  No exercises logged for this muscle in the last 7 days.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selected.exercisesLogged.map((exName, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2"
                    >
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      {exName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Muscle Selector Matrix Grid */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Quick Muscle Selector Matrix:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MUSCLES.filter((m) => m.view === viewMode || m.view === 'both').map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedKey(m.key)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedKey === m.key
                      ? 'bg-slate-800 border-sky-400 text-white shadow-lg'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold truncate">{m.label.split(' ')[0]}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      m.status === 'fatigued'
                        ? 'bg-red-500'
                        : m.status === 'recovering'
                        ? 'bg-amber-500'
                        : m.status === 'fresh'
                        ? 'bg-emerald-500'
                        : 'bg-slate-700'
                    }`}
                  ></span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
