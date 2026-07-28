import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Trash2, Check, Clock, Dumbbell, Award, RotateCcw, ChevronRight, X, Volume2 } from 'lucide-react';
import { WorkoutLog, WorkoutExercise, ExerciseSet, Exercise, TargetMuscleGroup, ExerciseCategory } from '../types';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';

interface ActiveWorkoutLoggerProps {
  initialWorkoutName?: string;
  initialExercises?: WorkoutExercise[];
  onFinishWorkout: (log: WorkoutLog) => void;
  onCancel: () => void;
}

// Simple Web Audio API Beep Generator (no external asset required)
const playCompletionBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.error('Audio beep failed', e);
  }
};

export const ActiveWorkoutLogger: React.FC<ActiveWorkoutLoggerProps> = ({
  initialWorkoutName = 'Custom Workout',
  initialExercises = [],
  onFinishWorkout,
  onCancel,
}) => {
  const [workoutName, setWorkoutName] = useState(initialWorkoutName);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() => {
    if (initialExercises.length > 0) return initialExercises;
    return [];
  });

  // Elapsed Session Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Rest Timer State
  const [restDuration, setRestDuration] = useState(90); // default 90s
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [isRestActive, setIsRestActive] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('');

  // Exercise Library Modal State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Start Session Elapsed Timer
  useEffect(() => {
    let interval: any = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  // Rest Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (isRestActive && restRemaining !== null && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining((prev) => (prev !== null ? prev - 1 : 0));
      }, 1000);
    } else if (isRestActive && restRemaining === 0) {
      setIsRestActive(false);
      setRestRemaining(null);
      playCompletionBeep();
    }
    return () => clearInterval(interval);
  }, [isRestActive, restRemaining]);

  const startRestTimer = (seconds: number = restDuration) => {
    setRestDuration(seconds);
    setRestRemaining(seconds);
    setIsRestActive(true);
  };

  const cancelRestTimer = () => {
    setIsRestActive(false);
    setRestRemaining(null);
  };

  const adjustRestTime = (deltaSeconds: number) => {
    if (restRemaining !== null) {
      const next = Math.max(0, restRemaining + deltaSeconds);
      setRestRemaining(next);
    }
  };

  // Helper 1RM Estimator (Epley Formula)
  const calculate1RM = (weight: number, reps: number): number => {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  // Stats Calculations
  const totalVolumeKg = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return s.completed ? sAcc + s.weight * s.reps : sAcc;
      }, 0)
    );
  }, 0);

  const completedSetsCount = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  // Set Handlers
  const handleToggleSetComplete = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const setItem = updated[exIndex].sets[setIndex];
    const willComplete = !setItem.completed;
    setItem.completed = willComplete;
    setExercises(updated);

    if (willComplete) {
      startRestTimer(restDuration);
    }
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof ExerciseSet,
    value: any
  ) => {
    const updated = [...exercises];
    (updated[exIndex].sets[setIndex] as any)[field] = value;
    setExercises(updated);
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    const targetEx = updated[exIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1];

    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      setNumber: targetEx.sets.length + 1,
      weight: lastSet ? lastSet.weight : 20,
      reps: lastSet ? lastSet.reps : 10,
      rpe: lastSet ? lastSet.rpe : 8,
      completed: false,
      isWarmup: false,
    };

    targetEx.sets.push(newSet);
    setExercises(updated);
  };

  const handleDeleteSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exIndex].sets.splice(setIndex, 1);
    // Reindex set numbers
    updated[exIndex].sets.forEach((s, idx) => (s.setNumber = idx + 1));
    setExercises(updated);
  };

  const handleRemoveExercise = (exIndex: number) => {
    const updated = [...exercises];
    updated.splice(exIndex, 1);
    setExercises(updated);
  };

  const handleAddExerciseFromLibrary = (selected: Exercise) => {
    const newWorkoutEx: WorkoutExercise = {
      exerciseId: selected.id,
      exerciseName: selected.name,
      targetMuscleGroup: selected.targetMuscleGroup,
      category: selected.category,
      sets: [
        {
          id: `set-${Date.now()}-1`,
          setNumber: 1,
          weight: 20,
          reps: 10,
          rpe: 8,
          completed: false,
          isWarmup: false,
        },
      ],
    };

    setExercises((prev) => [...prev, newWorkoutEx]);
  };

  const handleFinish = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    const log: WorkoutLog = {
      id: `workout-${Date.now()}`,
      userId: 'guest',
      name: workoutName.trim() || 'Workout Session',
      date: dateStr,
      startTime: timeStr,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      exercises,
      totalVolumeKg,
      activeCaloriesBurned: Math.round((elapsedSeconds / 60) * 6), // ~6 kcal/min estimate
      createdAt: new Date().toISOString(),
    };

    onFinishWorkout(log);
  };

  // Format Elapsed Time (HH:MM:SS)
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-4 z-30 backdrop-blur-md bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5"
              placeholder="Workout Name"
            />
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {formatTime(elapsedSeconds)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                {totalVolumeKg.toLocaleString()} kg Volume
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                {completedSetsCount}/{totalSetsCount} Sets Completed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isPaused ? 'Resume Session' : 'Pause Session'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleFinish}
              disabled={exercises.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Finish Workout
            </button>
          </div>
        </div>
      </div>

      {/* Floating Rest Timer Bar (if active) */}
      {isRestActive && restRemaining !== null && (
        <div className="bg-emerald-950 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-emerald-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Rest Timer</div>
              <div className="text-2xl font-extrabold text-white font-mono">{formatTime(restRemaining)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustRestTime(-10)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-xs font-medium text-emerald-200 border border-emerald-500/30"
            >
              -10s
            </button>
            <button
              onClick={() => adjustRestTime(10)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-xs font-medium text-emerald-200 border border-emerald-500/30"
            >
              +10s
            </button>
            <button
              onClick={cancelRestTimer}
              className="p-1.5 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Rest Duration Presets Selector */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Rest Timer Preset:</span>
          <div className="flex gap-1">
            {[30, 60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => setRestDuration(s)}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  restDuration === s
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s >= 60 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Custom (s)"
            value={customRestInput}
            onChange={(e) => setCustomRestInput(e.target.value)}
            className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => {
              const val = parseInt(customRestInput);
              if (val > 0) setRestDuration(val);
            }}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-medium"
          >
            Set
          </button>
        </div>
      </div>

      {/* Exercise Cards */}
      {exercises.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No exercises in this workout yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your first exercise from the exercise library to start logging sets.
            </p>
          </div>
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>
      ) : (
        exercises.map((ex, exIndex) => (
          <div key={`${ex.exerciseId}-${exIndex}`} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Card Header */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {exIndex + 1}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{ex.exerciseName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      {ex.targetMuscleGroup}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {ex.category}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveExercise(exIndex)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove Exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Set Table */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="pb-2 w-12 text-center">Set</th>
                    <th className="pb-2 w-16 text-center">Warmup</th>
                    <th className="pb-2">Weight (kg)</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2 w-20">RPE (1-10)</th>
                    <th className="pb-2 text-slate-500">Est. 1RM</th>
                    <th className="pb-2 w-16 text-center">Done</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ex.sets.map((s, setIndex) => {
                    const est1RM = calculate1RM(s.weight, s.reps);
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          s.completed ? 'bg-emerald-950/20 text-emerald-100' : 'hover:bg-slate-850/50'
                        }`}
                      >
                        {/* Set Number */}
                        <td className="py-2.5 text-center font-bold text-slate-300">
                          {s.isWarmup ? <span className="text-amber-400 font-semibold">W</span> : s.setNumber}
                        </td>

                        {/* Warmup Checkbox */}
                        <td className="py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={s.isWarmup || false}
                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'isWarmup', e.target.checked)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950 cursor-pointer"
                          />
                        </td>

                        {/* Weight */}
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={s.weight || ''}
                            onChange={(e) =>
                              handleUpdateSet(exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        {/* Reps */}
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="0"
                            value={s.reps || ''}
                            onChange={(e) =>
                              handleUpdateSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)
                            }
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        {/* RPE */}
                        <td className="py-2.5 pr-2">
                          <select
                            value={s.rpe || 8}
                            onChange={(e) =>
                              handleUpdateSet(exIndex, setIndex, 'rpe', parseInt(e.target.value) || 8)
                            }
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                          >
                            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                              <option key={v} value={v}>
                                @{v}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Est 1RM */}
                        <td className="py-2.5 text-slate-400 font-mono">
                          {est1RM > 0 ? `${est1RM} kg` : '-'}
                        </td>

                        {/* Complete Checkbox */}
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSetComplete(exIndex, setIndex)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              s.completed
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>

                        {/* Delete Set */}
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSet(exIndex, setIndex)}
                            className="text-slate-600 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                onClick={() => handleAddSet(exIndex)}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Set
              </button>
            </div>
          </div>
        ))
      )}

      {/* Bottom Add Exercise Button */}
      {exercises.length > 0 && (
        <button
          onClick={() => setIsLibraryOpen(true)}
          className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Another Exercise
        </button>
      )}

      {/* Exercise Selector Modal */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectExercise={handleAddExerciseFromLibrary}
      />
    </div>
  );
};
