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
          <div className="w-full max-w-sm h-[440px] my-2 flex items-center justify-center relative">
            <svg viewBox="0 0 300 600" className="w-full h-full filter drop-shadow-xl">
              {/* Outer Anatomical Body Silhouette Base */}
              <g opacity="0.25" fill="#090d16" stroke="#334155" strokeWidth="1.5">
                <path d="M 150 22 C 163 22 172 32 172 48 C 172 62 163 70 158 72 C 166 75 178 82 190 90 C 218 100 238 120 240 148 C 242 175 230 215 228 250 C 226 280 232 300 234 320 C 236 335 230 350 224 355 C 220 340 214 310 208 290 C 204 310 200 360 196 420 C 192 480 186 525 180 545 C 175 560 165 565 158 565 C 153 565 150 550 150 420 C 150 550 147 565 142 565 C 135 565 125 560 120 545 C 114 525 108 480 104 420 C 100 360 96 310 92 290 C 86 310 80 340 76 355 C 70 350 64 335 66 320 C 68 300 74 280 72 250 C 70 215 58 175 60 148 C 62 120 82 100 110 90 C 122 82 134 75 142 72 C 137 70 128 62 128 48 C 128 32 137 22 150 22 Z" />
              </g>

              {viewMode === 'front' ? (
                <>
                  {/* FRONT: Upper Chest */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('ChestUpper')}>
                    <path
                      d="M 150 108 C 136 108 124 112 114 122 C 116 132 128 138 150 138 Z M 150 108 C 164 108 176 112 186 122 C 184 132 172 138 150 138 Z"
                      fill={getMuscleFill('ChestUpper')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('ChestUpper')}`}
                    />
                  </g>

                  {/* FRONT: Lower Chest */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('ChestLower')}>
                    <path
                      d="M 114 124 C 126 139 138 144 150 144 L 150 166 C 138 166 120 160 112 144 C 108 136 110 128 114 124 Z M 186 124 C 174 139 162 144 150 144 L 150 166 C 162 166 180 160 188 144 C 192 136 190 128 186 124 Z"
                      fill={getMuscleFill('ChestLower')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('ChestLower')}`}
                    />
                  </g>

                  {/* FRONT: Front Delts */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('FrontDelts')}>
                    <path
                      d="M 108 100 C 114 96 122 92 128 90 C 122 102 114 118 112 128 C 102 124 92 118 94 108 C 96 102 102 100 108 100 Z M 192 100 C 186 96 178 92 172 90 C 178 102 186 118 188 128 C 198 124 208 118 206 108 C 204 102 198 100 192 100 Z"
                      fill={getMuscleFill('FrontDelts')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('FrontDelts')}`}
                    />
                  </g>

                  {/* FRONT: Side Delts */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('SideDelts')}>
                    <path
                      d="M 92 106 C 90 116 100 124 108 132 C 102 144 96 150 90 148 C 82 142 78 130 82 118 C 84 112 88 108 92 106 Z M 208 106 C 210 116 200 124 192 132 C 198 144 204 150 210 148 C 218 142 222 130 218 118 C 216 112 212 108 208 106 Z"
                      fill={getMuscleFill('SideDelts')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('SideDelts')}`}
                    />
                  </g>

                  {/* FRONT: Biceps */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Biceps')}>
                    <path
                      d="M 88 150 C 96 148 106 148 108 160 C 110 180 102 205 92 215 C 84 210 78 190 80 170 C 82 158 84 152 88 150 Z M 212 150 C 204 148 194 148 192 160 C 190 180 198 205 208 215 C 216 210 222 190 220 170 C 218 158 216 152 212 150 Z"
                      fill={getMuscleFill('Biceps')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Biceps')}`}
                    />
                  </g>

                  {/* FRONT: Forearms */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Forearms')}>
                    <path
                      d="M 88 218 C 96 218 100 235 96 260 C 92 280 84 298 76 308 C 68 300 66 275 70 250 C 74 235 80 222 88 218 Z M 212 218 C 204 218 200 235 204 260 C 208 280 216 298 224 308 C 232 300 234 275 230 250 C 226 235 220 222 212 218 Z"
                      fill={getMuscleFill('Forearms')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Forearms')}`}
                    />
                  </g>

                  {/* FRONT: Abs (Segmented 6-Pack) */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Abs')}>
                    <path
                      d="M 124 172 C 136 170 164 170 176 172 L 174 200 C 162 202 138 202 126 200 Z M 126 204 C 138 206 162 206 174 204 L 172 232 C 160 234 140 234 128 232 Z M 128 236 C 140 238 160 238 172 236 L 168 268 C 158 274 142 274 132 268 Z"
                      fill={getMuscleFill('Abs')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Abs')}`}
                    />
                  </g>

                  {/* FRONT: Obliques */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Obliques')}>
                    <path
                      d="M 108 170 C 116 170 122 174 122 200 L 124 264 C 114 260 106 240 104 215 C 102 195 104 180 108 170 Z M 192 170 C 184 170 178 174 178 200 L 176 264 C 186 260 194 240 196 215 C 198 195 196 180 192 170 Z"
                      fill={getMuscleFill('Obliques')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Obliques')}`}
                    />
                  </g>

                  {/* FRONT: Quads */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Quads')}>
                    <path
                      d="M 104 280 C 122 276 142 282 146 295 C 148 335 144 380 140 412 C 128 418 114 416 104 402 C 94 380 92 330 96 300 C 98 290 100 284 104 280 Z M 196 280 C 178 276 158 282 154 295 C 152 335 156 380 160 412 C 172 418 186 416 196 402 C 206 380 208 330 204 300 C 202 290 200 284 196 280 Z"
                      fill={getMuscleFill('Quads')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Quads')}`}
                    />
                  </g>

                  {/* FRONT: Calves */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Calves')}>
                    <path
                      d="M 108 430 C 122 426 134 430 136 445 C 138 470 132 505 126 532 C 118 534 112 530 110 515 C 106 490 102 460 104 442 C 105 435 106 432 108 430 Z M 192 430 C 178 426 166 430 164 445 C 162 470 168 505 174 532 C 182 534 188 530 190 515 C 194 490 198 460 196 442 C 195 435 194 432 192 430 Z"
                      fill={getMuscleFill('Calves')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Calves')}`}
                    />
                  </g>
                </>
              ) : (
                <>
                  {/* BACK: Traps */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Traps')}>
                    <path
                      d="M 150 72 C 160 76 172 84 184 92 C 170 104 158 124 150 148 C 142 124 130 104 116 92 C 128 84 140 76 150 72 Z"
                      fill={getMuscleFill('Traps')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Traps')}`}
                    />
                  </g>

                  {/* BACK: Rear Delts */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('RearDelts')}>
                    <path
                      d="M 112 94 C 104 98 94 104 90 112 C 86 124 90 134 98 138 C 106 132 112 122 116 110 C 116 102 114 96 112 94 Z M 188 94 C 196 98 206 104 210 112 C 214 124 210 134 202 138 C 194 132 188 122 184 110 C 184 102 186 96 188 94 Z"
                      fill={getMuscleFill('RearDelts')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('RearDelts')}`}
                    />
                  </g>

                  {/* BACK: Lats */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Lats')}>
                    <path
                      d="M 118 114 C 132 124 142 140 146 160 L 146 210 C 136 214 122 210 114 195 C 104 175 100 148 104 130 C 108 120 112 116 118 114 Z M 182 114 C 168 124 158 140 154 160 L 154 210 C 164 214 178 210 186 195 C 196 175 200 148 196 130 C 192 120 188 116 182 114 Z"
                      fill={getMuscleFill('Lats')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Lats')}`}
                    />
                  </g>

                  {/* BACK: Triceps */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Triceps')}>
                    <path
                      d="M 88 145 C 96 142 104 145 106 155 C 108 175 102 200 94 215 C 84 210 78 188 80 168 C 82 155 84 148 88 145 Z M 212 145 C 204 142 196 145 194 155 C 192 175 198 200 206 215 C 216 210 222 188 220 168 C 218 155 216 148 212 145 Z"
                      fill={getMuscleFill('Triceps')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Triceps')}`}
                    />
                  </g>

                  {/* BACK: Lower Back */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('LowerBack')}>
                    <path
                      d="M 126 212 C 140 210 160 210 174 212 L 172 262 C 160 266 140 266 128 262 Z"
                      fill={getMuscleFill('LowerBack')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('LowerBack')}`}
                    />
                  </g>

                  {/* BACK: Glutes */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Glutes')}>
                    <path
                      d="M 100 266 C 114 262 136 264 148 272 C 148 295 144 322 138 335 C 122 342 106 338 98 322 C 92 305 94 280 100 266 Z M 200 266 C 186 262 164 264 152 272 C 152 295 156 322 162 335 C 178 342 194 338 202 322 C 208 305 206 280 200 266 Z"
                      fill={getMuscleFill('Glutes')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Glutes')}`}
                    />
                  </g>

                  {/* BACK: Hamstrings */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Hamstrings')}>
                    <path
                      d="M 102 340 C 120 338 138 342 144 352 C 146 375 142 405 138 420 C 126 424 114 422 104 410 C 96 392 96 362 102 340 Z M 198 340 C 180 338 162 342 156 352 C 154 375 158 405 162 420 C 174 424 186 422 196 410 C 204 392 204 362 198 340 Z"
                      fill={getMuscleFill('Hamstrings')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Hamstrings')}`}
                    />
                  </g>

                  {/* BACK: Calves */}
                  <g className="cursor-pointer group" onClick={() => setSelectedKey('Calves')}>
                    <path
                      d="M 108 430 C 122 426 134 430 136 445 C 138 470 132 505 126 532 C 118 534 112 530 110 515 C 106 490 102 460 104 442 C 105 435 106 432 108 430 Z M 192 430 C 178 426 166 430 164 445 C 162 470 168 505 174 532 C 182 534 188 530 190 515 C 194 490 198 460 196 442 C 195 435 194 432 192 430 Z"
                      fill={getMuscleFill('Calves')}
                      stroke="#020617"
                      strokeWidth="1.5"
                      className={`transition-all duration-300 group-hover:opacity-90 ${getMuscleGlowClass('Calves')}`}
                    />
                  </g>
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
