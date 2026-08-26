import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Trash2, Check, Clock, Dumbbell, Award, RotateCcw, ChevronRight, ChevronDown, X, Volume2, AlertTriangle, ArrowLeftRight, GripVertical, Info, FileText, CheckCircle2 } from 'lucide-react';
import { WorkoutLog, WorkoutExercise, ExerciseSet, Exercise, TargetMuscleGroup, ExerciseCategory } from '../types';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ReorderExercisesModal } from './ReorderExercisesModal';

export const ACTIVE_WORKOUT_DRAFT_KEY = 'healthcoach_active_workout_draft';

export interface ActiveWorkoutDraft {
  workoutName: string;
  exercises: WorkoutExercise[];
  startedAtTimestamp: number;
  accumulatedElapsedSeconds: number;
  lastResumeTimestamp: number;
  isPaused: boolean;
  restDuration: number;
  restEndTimeStamp: number | null;
  isRestActive: boolean;
}

interface ActiveWorkoutLoggerProps {
  initialWorkoutName?: string;
  initialExercises?: WorkoutExercise[];
  workoutHistory?: WorkoutLog[];
  onFinishWorkout: (log: WorkoutLog) => void;
  onCancel: () => void;
}

// Simple Web Audio API Beep Generator (no external asset required) with Mobile Autoplay Unlock
let sharedAudioContext: AudioContext | null = null;

const unlockAudioContext = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch((err) => console.warn('AudioContext resume rejected', err));
    }
    return sharedAudioContext;
  } catch (e) {
    console.warn('AudioContext unlock failed', e);
    return null;
  }
};

const playCompletionBeep = () => {
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return;
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
  workoutHistory = [],
  onFinishWorkout,
  onCancel,
}) => {
  // Mobile AudioContext Gesture Unlock Listener
  useEffect(() => {
    const handleUnlockGesture = () => {
      unlockAudioContext();
    };
    window.addEventListener('click', handleUnlockGesture, { once: true, passive: true });
    window.addEventListener('touchstart', handleUnlockGesture, { once: true, passive: true });
    return () => {
      window.removeEventListener('click', handleUnlockGesture);
      window.removeEventListener('touchstart', handleUnlockGesture);
    };
  }, []);

  // Load initial state from localStorage draft if present
  const [savedDraft] = useState<ActiveWorkoutDraft | null>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_WORKOUT_DRAFT_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error parsing active workout draft', e);
    }
    return null;
  });

  // Helper to compute suggested starting weight from workoutHistory
  const getSuggestedWeight = (exId: string, exName: string, category?: string, muscleGroup?: string): number => {
    if (category === 'Stretching' || muscleGroup === 'Flexibility') return 0;
    if (category === 'Bodyweight') return 0;

    if (workoutHistory && workoutHistory.length > 0) {
      for (const log of workoutHistory) {
        const found = log.exercises.find(
          (e) => e.exerciseId === exId || e.exerciseName.toLowerCase() === exName.toLowerCase()
        );
        if (found && found.sets && found.sets.length > 0) {
          const completedSets = found.sets.filter((s) => s.completed && s.weight !== undefined && s.weight !== null);
          if (completedSets.length > 0) {
            return completedSets[completedSets.length - 1].weight;
          }
          if (found.sets[0].weight !== undefined && found.sets[0].weight !== null) {
            return found.sets[0].weight;
          }
        }
      }
    }

    if (category === 'Dumbbell') return 12;
    if (category === 'Barbell') return 20;
    if (category === 'Cable' || category === 'Machine') return 15;
    return 20;
  };

  const [workoutName, setWorkoutName] = useState<string>(
    savedDraft?.workoutName ?? initialWorkoutName
  );
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() => {
    if (savedDraft?.exercises && savedDraft.exercises.length > 0) {
      return savedDraft.exercises;
    }
    if (initialExercises.length > 0) {
      return initialExercises.map((ex) => {
        const suggested = getSuggestedWeight(ex.exerciseId, ex.exerciseName, ex.category, ex.targetMuscleGroup);
        return {
          ...ex,
          sets: ex.sets.map((s) => ({
            ...s,
            weight: (s.weight === undefined || s.weight === 0) && (ex.category !== 'Stretching' && ex.targetMuscleGroup !== 'Flexibility')
              ? suggested
              : s.weight,
          })),
        };
      });
    }
    return [];
  });

  // Wall-Clock Time Tracking
  const [startedAtTimestamp] = useState<number>(
    savedDraft?.startedAtTimestamp ?? Date.now()
  );
  const [accumulatedElapsedSeconds, setAccumulatedElapsedSeconds] = useState<number>(
    savedDraft?.accumulatedElapsedSeconds ?? 0
  );
  const [lastResumeTimestamp, setLastResumeTimestamp] = useState<number>(
    savedDraft?.lastResumeTimestamp ?? Date.now()
  );
  const [isPaused, setIsPaused] = useState<boolean>(
    savedDraft?.isPaused ?? false
  );

  // Compute live elapsed seconds
  const computeElapsed = () => {
    if (isPaused) return accumulatedElapsedSeconds;
    const delta = Math.floor((Date.now() - lastResumeTimestamp) / 1000);
    return Math.max(0, accumulatedElapsedSeconds + Math.max(0, delta));
  };

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(computeElapsed);

  // Rest Timer State with wall-clock end timestamp
  const [restDuration, setRestDuration] = useState<number>(
    savedDraft?.restDuration ?? 90
  );
  const [restEndTimeStamp, setRestEndTimeStamp] = useState<number | null>(() => {
    if (savedDraft?.isRestActive && savedDraft.restEndTimeStamp) {
      return savedDraft.restEndTimeStamp;
    }
    return null;
  });
  const [isRestActive, setIsRestActive] = useState<boolean>(() => {
    if (savedDraft?.isRestActive && savedDraft.restEndTimeStamp) {
      return savedDraft.restEndTimeStamp > Date.now();
    }
    return false;
  });
  const [restRemaining, setRestRemaining] = useState<number | null>(() => {
    if (savedDraft?.isRestActive && savedDraft.restEndTimeStamp) {
      const rem = Math.ceil((savedDraft.restEndTimeStamp - Date.now()) / 1000);
      return rem > 0 ? rem : null;
    }
    return null;
  });
  const [customRestInput, setCustomRestInput] = useState('');

  // Modals & Interactive States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [selectedExerciseForDetails, setSelectedExerciseForDetails] = useState<WorkoutExercise | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState<number | null>(null);
  const [permanentReplacePill, setPermanentReplacePill] = useState<{
    oldName: string;
    newName: string;
    oldId: string;
    newExercise: Exercise;
  } | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<Record<number, boolean>>({});

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsReorderModalOpen(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Auto-save draft helper
  const saveDraft = (overrides?: Partial<ActiveWorkoutDraft>) => {
    try {
      const draft: ActiveWorkoutDraft = {
        workoutName,
        exercises,
        startedAtTimestamp,
        accumulatedElapsedSeconds: isPaused ? accumulatedElapsedSeconds : computeElapsed(),
        lastResumeTimestamp: isPaused ? lastResumeTimestamp : Date.now(),
        isPaused,
        restDuration,
        restEndTimeStamp,
        isRestActive,
        ...overrides,
      };
      localStorage.setItem(ACTIVE_WORKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save workout draft', e);
    }
  };

  // Synchronize Elapsed Time accurately via Wall-Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setElapsedSeconds(computeElapsed());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, lastResumeTimestamp, accumulatedElapsedSeconds]);

  // Rest Countdown Timer with wall-clock sync
  useEffect(() => {
    if (!isRestActive || !restEndTimeStamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((restEndTimeStamp - now) / 1000));
      setRestRemaining(remaining);

      if (remaining <= 0) {
        setIsRestActive(false);
        setRestEndTimeStamp(null);
        setRestRemaining(null);
        saveDraft({ isRestActive: false, restEndTimeStamp: null });
        playCompletionBeep();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRestActive, restEndTimeStamp]);

  // Save draft whenever exercises, name, or pause state change
  useEffect(() => {
    saveDraft();
  }, [workoutName, exercises, isPaused, restDuration, isRestActive, restEndTimeStamp]);

  // Pause / Resume Handlers
  const handleTogglePause = () => {
    if (!isPaused) {
      const current = computeElapsed();
      setAccumulatedElapsedSeconds(current);
      setIsPaused(true);
      saveDraft({ isPaused: true, accumulatedElapsedSeconds: current });
    } else {
      const now = Date.now();
      setLastResumeTimestamp(now);
      setIsPaused(false);
      saveDraft({ isPaused: false, lastResumeTimestamp: now });
    }
  };

  const startRestTimer = (seconds: number = restDuration) => {
    const end = Date.now() + seconds * 1000;
    setRestDuration(seconds);
    setRestEndTimeStamp(end);
    setRestRemaining(seconds);
    setIsRestActive(true);
    saveDraft({ restDuration: seconds, restEndTimeStamp: end, isRestActive: true });
  };

  const cancelRestTimer = () => {
    setIsRestActive(false);
    setRestEndTimeStamp(null);
    setRestRemaining(null);
    saveDraft({ isRestActive: false, restEndTimeStamp: null });
  };

  const adjustRestTime = (deltaSeconds: number) => {
    if (restEndTimeStamp) {
      const newEnd = Math.max(Date.now(), restEndTimeStamp + deltaSeconds * 1000);
      setRestEndTimeStamp(newEnd);
      setRestRemaining(Math.max(0, Math.ceil((newEnd - Date.now()) / 1000)));
      saveDraft({ restEndTimeStamp: newEnd });
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
      // If all sets in this exercise are now completed, automatically compact/collapse the card
      const allDone = updated[exIndex].sets.every((s) => s.completed);
      if (allDone) {
        setCollapsedExercises((prev) => ({ ...prev, [exIndex]: true }));
      }

      const exerciseRest = updated[exIndex].restSeconds || restDuration;
      startRestTimer(exerciseRest);
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

    // Auto-cascade weight and reps adjustments to subsequent incomplete sets of this exercise
    if (field === 'weight' || field === 'reps') {
      for (let i = setIndex + 1; i < updated[exIndex].sets.length; i++) {
        if (!updated[exIndex].sets[i].completed) {
          (updated[exIndex].sets[i] as any)[field] = value;
        }
      }
    }

    setExercises(updated);
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    const targetEx = updated[exIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1];
    const isStretching = targetEx.category === 'Stretching' || targetEx.targetMuscleGroup === 'Flexibility';
    const fallbackWeight = isStretching ? 0 : 20;

    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      setNumber: targetEx.sets.length + 1,
      weight: lastSet ? (lastSet.weight ?? fallbackWeight) : fallbackWeight,
      reps: lastSet ? (lastSet.reps ?? 10) : 10,
      rpe: lastSet ? (lastSet.rpe ?? 8) : 8,
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

  const handleSelectExerciseFromLibrary = (selected: Exercise) => {
    if (replacingExerciseIndex !== null) {
      // Swapping existing exercise in place
      const updated = [...exercises];
      const target = updated[replacingExerciseIndex];
      const oldName = target.exerciseName;
      const oldId = target.exerciseId;

      const suggestedWeight = getSuggestedWeight(selected.id, selected.name, selected.category, selected.targetMuscleGroup);
      
      target.exerciseId = selected.id;
      target.exerciseName = selected.name;
      target.targetMuscleGroup = selected.targetMuscleGroup;
      target.category = selected.category;

      target.sets.forEach((s) => {
        if (!s.completed) {
          s.weight = suggestedWeight;
        }
      });

      setExercises(updated);
      setReplacingExerciseIndex(null);

      // Trigger the permanent swap pill notification
      setPermanentReplacePill({
        oldName,
        newName: selected.name,
        oldId,
        newExercise: selected,
      });
    } else {
      // Adding new exercise with suggested weight
      const suggestedWeight = getSuggestedWeight(selected.id, selected.name, selected.category, selected.targetMuscleGroup);

      const newWorkoutEx: WorkoutExercise = {
        exerciseId: selected.id,
        exerciseName: selected.name,
        targetMuscleGroup: selected.targetMuscleGroup,
        category: selected.category,
        sets: [
          {
            id: `set-${Date.now()}-1`,
            setNumber: 1,
            weight: suggestedWeight,
            reps: 10,
            rpe: 8,
            completed: false,
            isWarmup: false,
          },
        ],
      };

      setExercises((prev) => [...prev, newWorkoutEx]);
    }
  };

  const handleUpdateRoutinePermanently = () => {
    if (!permanentReplacePill) return;
    try {
      const savedRoutinesRaw = localStorage.getItem('workout_routines');
      if (savedRoutinesRaw) {
        const routines = JSON.parse(savedRoutinesRaw);
        let modified = false;
        routines.forEach((r: any) => {
          r.days?.forEach((d: any) => {
            d.exercises?.forEach((exItem: any) => {
              if (
                exItem.exerciseId === permanentReplacePill.oldId ||
                exItem.exerciseName?.toLowerCase() === permanentReplacePill.oldName.toLowerCase()
              ) {
                exItem.exerciseId = permanentReplacePill.newExercise.id;
                exItem.exerciseName = permanentReplacePill.newExercise.name;
                exItem.targetMuscleGroup = permanentReplacePill.newExercise.targetMuscleGroup;
                exItem.category = permanentReplacePill.newExercise.category;
                modified = true;
              }
            });
          });
        });
        if (modified) {
          localStorage.setItem('workout_routines', JSON.stringify(routines));
        }
      }
    } catch (e) {
      console.error('Failed to update permanent routine', e);
    }
    setPermanentReplacePill(null);
  };

  const handleFinish = () => {
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear workout draft on finish', e);
    }

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

  const handleDiscardClick = () => {
    if (exercises.length === 0 && elapsedSeconds < 30) {
      handleConfirmDiscard();
    } else {
      setShowDiscardModal(true);
    }
  };

  const handleConfirmDiscard = () => {
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear workout draft on discard', e);
    }
    setShowDiscardModal(false);
    onCancel();
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl sticky top-2 sm:top-4 z-30 backdrop-blur-md bg-slate-900/95 space-y-3">
        {/* Row 1: Workout Title & Live Session Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
          <div className="space-y-0.5 min-w-0">
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="text-lg sm:text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 w-full truncate"
              placeholder="Workout Name"
            />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono font-medium text-slate-300">
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
                {completedSetsCount}/{totalSetsCount} Sets Done
              </span>
            </div>
          </div>

          {/* Quick Header Badges & Actions on sm+ screens */}
          <div className="hidden sm:flex items-center gap-2">
            {exercises.length > 1 && (
              <button
                onClick={() => setIsReorderModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reorder Exercises"
              >
                <GripVertical className="w-4 h-4 text-emerald-400" />
              </button>
            )}
            <button
              onClick={handleTogglePause}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isPaused ? 'Resume Session' : 'Pause Session'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDiscardClick}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>

        {/* Row 2: Live Rest Timer Chip + Finish Workout / Mobile Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Mobile Secondary Action Icons (visible on mobile only) */}
          <div className="flex sm:hidden items-center gap-1.5">
            {exercises.length > 1 && (
              <button
                onClick={() => setIsReorderModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reorder Exercises"
              >
                <GripVertical className="w-4 h-4 text-emerald-400" />
              </button>
            )}
            <button
              onClick={handleTogglePause}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isPaused ? 'Resume Session' : 'Pause Session'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDiscardClick}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Discard
            </button>
          </div>

          {/* Live Rest Timer Chip */}
          {isRestActive && restRemaining !== null ? (
            <div className="flex items-center gap-1.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2.5 py-1.5 rounded-xl shadow-lg animate-pulse">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Rest:</span>
              <span className="font-mono font-black text-xs sm:text-sm text-white">{formatTime(restRemaining)}</span>
              <div className="flex items-center gap-1 border-l border-emerald-800/60 pl-1.5">
                <button
                  onClick={() => adjustRestTime(-10)}
                  className="px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-[10px] font-bold text-emerald-200"
                  title="Subtract 10s"
                >
                  -10s
                </button>
                <button
                  onClick={() => adjustRestTime(10)}
                  className="px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-[10px] font-bold text-emerald-200"
                  title="Add 10s"
                >
                  +10s
                </button>
                <button
                  onClick={cancelRestTimer}
                  className="p-0.5 text-emerald-400 hover:text-white rounded hover:bg-emerald-900 ml-0.5"
                  title="Dismiss timer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden sm:block text-xs text-slate-500 italic">
              {isPaused ? 'Workout paused' : 'Session active'}
            </div>
          )}

          {/* Finish Workout Button - Cleanly fitted, full/flexible on mobile and auto on desktop */}
          <button
            onClick={handleFinish}
            disabled={exercises.length === 0}
            className="flex-1 sm:flex-initial min-w-[120px] px-4 sm:px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
          >
            Finish Workout
          </button>
        </div>
      </div>

      {/* Permanent Replacement Confirmation Pill Banner */}
      {permanentReplacePill && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400">Exercise Replaced Mid-Workout</div>
              <div className="text-sm font-semibold text-slate-200">
                Replaced <span className="line-through text-slate-400">{permanentReplacePill.oldName}</span> with <span className="text-emerald-300 font-bold">{permanentReplacePill.newName}</span>.
              </div>
              <p className="text-[11px] text-slate-400">Would you like to update this routine template permanently for future sessions?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPermanentReplacePill(null)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              This Workout Only
            </button>
            <button
              onClick={handleUpdateRoutinePermanently}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              Update Routine Permanently
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
        exercises.map((ex, exIndex) => {
          const isCollapsed = !!collapsedExercises[exIndex];
          const completedInEx = ex.sets.filter((s) => s.completed).length;
          const totalInEx = ex.sets.length;
          const exVolume = ex.sets.reduce((sum, s) => sum + (s.completed ? s.weight * s.reps : 0), 0);

          if (isCollapsed) {
            return (
              <div
                key={`${ex.exerciseId}-${exIndex}`}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 shadow-xl flex items-center justify-between transition-all"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => setCollapsedExercises((prev) => ({ ...prev, [exIndex]: false }))}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExerciseForDetails(ex);
                        }}
                        className="text-sm font-bold text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                      >
                        {ex.exerciseName}
                        <Info className="w-3.5 h-3.5 text-emerald-400/80" />
                      </h3>
                      {completedInEx === totalInEx && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Complete
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {completedInEx}/{totalInEx} Sets Complete • {exVolume.toLocaleString()} kg Volume
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReplacingExerciseIndex(exIndex);
                      setIsLibraryOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Replace Exercise"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCollapsedExercises((prev) => ({ ...prev, [exIndex]: false }))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span>Expand</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={`${ex.exerciseId}-${exIndex}`} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Card Header */}
              <div
                className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {exIndex + 1}
                  </div>
                  <div>
                    <h3
                      onClick={() => setSelectedExerciseForDetails(ex)}
                      className="text-base font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 group"
                      title="Click to view Instructions, Notes & History"
                    >
                      {ex.exerciseName}
                      <Info className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </h3>
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

                <div className="flex items-center gap-2">
                  {/* Replace Exercise Button */}
                  <button
                    onClick={() => {
                      setReplacingExerciseIndex(exIndex);
                      setIsLibraryOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Replace / Substitute Exercise"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>

                  {/* Collapse Button */}
                  <button
                    onClick={() => setCollapsedExercises((prev) => ({ ...prev, [exIndex]: true }))}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Compact / Collapse Exercise"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRemoveExercise(exIndex)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Set Table */}
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-2">
                      <th className="pb-2 w-12 text-center">Set</th>
                      <th className="pb-2">Weight (kg)</th>
                      <th className="pb-2">Reps</th>
                      <th className="pb-2 w-20">RPE (1-10)</th>
                      <th className="pb-2 w-16 text-center">Done</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ex.sets.map((s, setIndex) => {
                      return (
                        <tr
                          key={s.id}
                          className={`transition-all duration-150 ${
                            s.completed
                              ? 'bg-emerald-950/35 border-l-4 border-emerald-400 text-emerald-100'
                              : 'hover:bg-slate-850/50 text-slate-300'
                          }`}
                        >
                          {/* Set Number */}
                          <td className={`py-2.5 text-center font-bold ${s.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {s.setNumber}
                          </td>

                          {/* Weight */}
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={s.weight !== undefined && s.weight !== null ? s.weight : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                handleUpdateSet(exIndex, setIndex, 'weight', isNaN(val) ? 0 : val);
                              }}
                              className={`w-20 border rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:border-emerald-500 transition-colors ${
                                s.completed
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                                  : 'bg-slate-950 border-slate-800 text-white'
                              }`}
                            />
                          </td>

                          {/* Reps */}
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              min="0"
                              value={s.reps !== undefined && s.reps !== null ? s.reps : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                handleUpdateSet(exIndex, setIndex, 'reps', isNaN(val) ? 0 : val);
                              }}
                              className={`w-16 border rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:border-emerald-500 transition-colors ${
                                s.completed
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                                  : 'bg-slate-950 border-slate-800 text-white'
                              }`}
                            />
                          </td>

                          {/* RPE */}
                          <td className="py-2.5 pr-2">
                            <select
                              value={s.rpe || 8}
                              onChange={(e) =>
                                handleUpdateSet(exIndex, setIndex, 'rpe', parseInt(e.target.value) || 8)
                              }
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
                              title={`@${s.rpe || 8} (${10 - (s.rpe || 8)} RIR)`}
                            >
                              <option value={6} className="bg-slate-900 text-slate-200">@6 (4 RIR)</option>
                              <option value={7} className="bg-slate-900 text-slate-200">@7 (3 RIR)</option>
                              <option value={8} className="bg-slate-900 text-emerald-400 font-bold">@8 (2 RIR)</option>
                              <option value={9} className="bg-slate-900 text-amber-400 font-bold">@9 (1 RIR)</option>
                              <option value={10} className="bg-slate-900 text-red-400 font-bold">@10 (Max)</option>
                            </select>
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
          );
        })
      )}

      {/* Bottom Add Exercise Button */}
      {exercises.length > 0 && (
        <button
          onClick={() => {
            setReplacingExerciseIndex(null);
            setIsLibraryOpen(true);
          }}
          className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Another Exercise
        </button>
      )}

      {/* Exercise Selector Modal */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => {
          setIsLibraryOpen(false);
          setReplacingExerciseIndex(null);
        }}
        onSelectExercise={handleSelectExerciseFromLibrary}
      />

      {/* 3-Tab Exercise Detail Modal (Instructions, Notes, History) */}
      <ExerciseDetailModal
        isOpen={selectedExerciseForDetails !== null}
        onClose={() => setSelectedExerciseForDetails(null)}
        exercise={selectedExerciseForDetails}
        workoutHistory={workoutHistory}
        restSeconds={selectedExerciseForDetails?.restSeconds}
        onUpdateRestSeconds={(newRest) => {
          if (selectedExerciseForDetails) {
            const updated = exercises.map((item) =>
              item.exerciseId === selectedExerciseForDetails.exerciseId
                ? { ...item, restSeconds: newRest }
                : item
            );
            setExercises(updated);
            setSelectedExerciseForDetails((prev) => prev ? { ...prev, restSeconds: newRest } : null);
          }
        }}
        onSaveNotes={(noteText) => {
          if (selectedExerciseForDetails) {
            const updated = exercises.map((item) =>
              item.exerciseId === selectedExerciseForDetails.exerciseId
                ? { ...item, notes: noteText }
                : item
            );
            setExercises(updated);
          }
        }}
      />

      {/* Reorder Exercises Modal */}
      <ReorderExercisesModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        exercises={exercises}
        title="Reorder Workout Exercises"
        onSaveOrder={(reordered) => setExercises(reordered)}
      />

      {/* Discard Workout Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Discard Workout?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to discard this workout? All {completedSetsCount} completed sets and current progress will be permanently lost.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Continue Workout
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
