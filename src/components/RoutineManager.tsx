import React, { useState, useEffect } from 'react';
import { Play, Plus, Dumbbell, Trash2, Edit, Check, ChevronRight, X, Calendar, HeartPulse, Flame, Sun, Layers, Sparkles, GripVertical } from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { WorkoutRoutine, RoutineDay, RoutineDayType, WorkoutExercise, Exercise, TargetMuscleGroup, WorkoutLog } from '../types';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { AiWorkoutArchitectModal } from './AiWorkoutArchitectModal';
import { ReorderExercisesModal } from './ReorderExercisesModal';

interface RoutineManagerProps {
  onStartWorkoutFromRoutine: (routineName: string, exercises: WorkoutExercise[]) => void;
  workoutHistory?: WorkoutLog[];
}

export const RoutineManager: React.FC<RoutineManagerProps> = ({ onStartWorkoutFromRoutine, workoutHistory = [] }) => {
  // Helper to determine the next recommended workout day based on history
  const getSuggestedNextDayIndex = (routine: WorkoutRoutine): number => {
    const daysList = Array.isArray(routine.days) ? routine.days : [];
    if (daysList.length <= 1) return 0;
    if (!workoutHistory || workoutHistory.length === 0) return 0;

    // Find the latest workout that matched this routine
    const matchingWorkout = workoutHistory.find((log) => {
      if (log.name.startsWith(routine.title)) return true;
      const logExerciseNames = new Set(log.exercises.map((e) => e.exerciseName));
      return daysList.some((d) =>
        d.exercises?.some((e) => logExerciseNames.has(e.exerciseName))
      );
    });

    if (!matchingWorkout) return 0;

    let lastCompletedIndex = -1;
    for (let i = 0; i < daysList.length; i++) {
      const d = daysList[i];
      if (
        matchingWorkout.name.includes(d.dayName) ||
        matchingWorkout.name.includes(`Day ${d.dayNumber}`)
      ) {
        lastCompletedIndex = i;
        break;
      }
    }

    if (lastCompletedIndex === -1) {
      let maxOverlap = 0;
      daysList.forEach((d, idx) => {
        if (d.type === 'workout' && d.exercises) {
          const overlap = d.exercises.filter((ex) =>
            matchingWorkout.exercises.some((e) => e.exerciseName === ex.exerciseName)
          ).length;
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            lastCompletedIndex = idx;
          }
        }
      });
    }

    if (lastCompletedIndex >= 0) {
      return (lastCompletedIndex + 1) % daysList.length;
    }

    return 0;
  };
  // Load saved routines or defaults (ignoring deleted templates stored in localStorage)
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() => {
    const savedDeleted = localStorage.getItem('deleted_routine_ids');
    const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];

    const savedCustom = localStorage.getItem('custom_routines');
    let customRoutines: WorkoutRoutine[] = [];
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        customRoutines = parsed.map((r: any) => {
          if (!Array.isArray(r.days)) {
            return {
              ...r,
              days: [
                {
                  id: `day-${r.id || Date.now()}-1`,
                  dayNumber: 1,
                  dayName: 'D1 - Workout Session',
                  type: 'workout',
                  exercises: Array.isArray(r.exercises) ? r.exercises : [],
                },
              ],
            };
          }
          return r;
        });
      } catch (e) {
        customRoutines = [];
      }
    }

    const combined = [...DEFAULT_ROUTINES, ...customRoutines];
    return combined.filter((r) => !deletedIds.includes(r.id));
  });

  // Routine Creation & Editing & AI Architect State
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isAiArchitectOpen, setIsAiArchitectOpen] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [days, setDays] = useState<RoutineDay[]>([
    { id: `day-${Date.now()}-1`, dayNumber: 1, dayName: 'D1 - Workout Session', type: 'workout', exercises: [] },
  ]);

  const handleAiRoutineSave = async (newRoutine: WorkoutRoutine) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const rId = newRoutine.id.startsWith('routine-custom-') ? newRoutine.id : `routine-custom-${Date.now()}`;
        const ref = doc(db, `users/${user.uid}/workoutRoutines`, rId);
        await setDoc(
          ref,
          {
            id: rId,
            userId: user.uid,
            title: newRoutine.title,
            description: newRoutine.description || '',
            days: newRoutine.days || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Firestore save AI routine error:', err);
      }
    } else {
      setRoutines((prev) => [newRoutine, ...prev]);
      const savedCustom = localStorage.getItem('custom_routines');
      let customRoutines: WorkoutRoutine[] = savedCustom ? JSON.parse(savedCustom) : [];
      customRoutines.unshift(newRoutine);
      localStorage.setItem('custom_routines', JSON.stringify(customRoutines));
    }
  };

  // Real-time Firestore Sync & Auto-Migration for Workout Routines
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const routinesPath = `users/${user.uid}/workoutRoutines`;
    const unsub = onSnapshot(
      collection(db, routinesPath),
      (snapshot) => {
        const cloudRoutines: WorkoutRoutine[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          cloudRoutines.push({
            id: docSnap.id,
            userId: data.userId || user.uid,
            title: data.title,
            description: data.description,
            days: data.days || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as WorkoutRoutine);
        });

        // Filter deleted templates
        const savedDeleted = localStorage.getItem('deleted_routine_ids');
        const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];

        // Combine default routines with cloud custom routines
        const combined = [...DEFAULT_ROUTINES, ...cloudRoutines];
        setRoutines(combined.filter((r) => !deletedIds.includes(r.id)));
      },
      (error) => {
        console.error('Firestore workoutRoutines listener error:', error);
      }
    );

    // Auto-migrate any local custom routines saved previously into Firestore
    const savedCustom = localStorage.getItem('custom_routines');
    if (savedCustom) {
      try {
        const localCustoms: WorkoutRoutine[] = JSON.parse(savedCustom);
        if (localCustoms.length > 0) {
          localCustoms.forEach(async (r) => {
            const rId = r.id.startsWith('routine-custom-') ? r.id : `routine-custom-${Date.now()}`;
            const ref = doc(db, `users/${user.uid}/workoutRoutines`, rId);
            await setDoc(
              ref,
              {
                id: rId,
                userId: user.uid,
                title: r.title,
                description: r.description || '',
                days: r.days || [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          });
          localStorage.removeItem('custom_routines');
        }
      } catch (e) {
        console.error('Failed to migrate local custom routines to Firestore:', e);
      }
    }

    return () => unsub();
  }, []);

  // Track which day is currently being edited in the modal
  const [activeEditingDayIndex, setActiveEditingDayIndex] = useState<number>(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const handleAddDay = () => {
    const nextNum = days.length + 1;
    const newDay: RoutineDay = {
      id: `day-${Date.now()}-${nextNum}`,
      dayNumber: nextNum,
      dayName: `D${nextNum} - Workout Session`,
      type: 'workout',
      exercises: [],
    };
    setDays((prev) => [...prev, newDay]);
    setActiveEditingDayIndex(days.length);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) return;
    const updated = [...days];
    updated.splice(index, 1);
    // Reindex dayNumbers
    updated.forEach((d, i) => {
      d.dayNumber = i + 1;
    });
    setDays(updated);
    if (activeEditingDayIndex >= updated.length) {
      setActiveEditingDayIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleAddExerciseToCurrentDay = (exercise: Exercise) => {
    const updatedDays = [...days];
    const currentDay = updatedDays[activeEditingDayIndex];
    if (!currentDay.exercises) currentDay.exercises = [];

    currentDay.exercises.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetMuscleGroup: exercise.targetMuscleGroup,
      category: exercise.category,
      targetSets: 3,
      targetReps: 10,
      targetRestSeconds: 90,
    });

    setDays(updatedDays);
  };

  const handleRemoveExerciseFromDay = (dayIdx: number, exIdx: number) => {
    const updatedDays = [...days];
    updatedDays[dayIdx].exercises?.splice(exIdx, 1);
    setDays(updatedDays);
  };

  const handleStartEdit = (routine: WorkoutRoutine) => {
    setEditingRoutineId(routine.id);
    setRoutineTitle(routine.title);
    setRoutineDesc(routine.description || '');
    const clonedDays = JSON.parse(JSON.stringify(routine.days || []));
    setDays(clonedDays.length > 0 ? clonedDays : [{ id: `day-${Date.now()}-1`, dayNumber: 1, dayName: 'D1 - Workout Session', type: 'workout', exercises: [] }]);
    setActiveEditingDayIndex(0);
    setIsCreating(true);
  };

  const handleCancelForm = () => {
    setEditingRoutineId(null);
    setRoutineTitle('');
    setRoutineDesc('');
    setDays([{ id: `day-${Date.now()}-1`, dayNumber: 1, dayName: 'D1 - Workout Session', type: 'workout', exercises: [] }]);
    setIsCreating(false);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim() || days.length === 0) return;

    const user = auth.currentUser;
    const rId = editingRoutineId || `routine-custom-${Date.now()}`;

    const routinePayload: WorkoutRoutine = {
      id: rId,
      userId: user?.uid || 'guest',
      title: routineTitle.trim(),
      description: routineDesc.trim() || 'Custom multi-day training schedule',
      days,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const ref = doc(db, `users/${user.uid}/workoutRoutines`, rId);
        await setDoc(
          ref,
          {
            id: rId,
            userId: user.uid,
            title: routinePayload.title,
            description: routinePayload.description,
            days: routinePayload.days,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Firestore save routine error:', err);
      }
    } else {
      const updated = editingRoutineId
        ? routines.map((r) => (r.id === editingRoutineId ? routinePayload : r))
        : [routinePayload, ...routines];

      setRoutines(updated);
      const customOnly = updated.filter((r) => r.id.startsWith('routine-custom-'));
      localStorage.setItem('custom_routines', JSON.stringify(customOnly));
    }

    // Reset form
    setEditingRoutineId(null);
    setRoutineTitle('');
    setRoutineDesc('');
    setDays([{ id: `day-${Date.now()}-1`, dayNumber: 1, dayName: 'D1 - Workout Session', type: 'workout', exercises: [] }]);
    setIsCreating(false);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/workoutRoutines`, routineId));
      } catch (err) {
        console.error('Firestore delete routine error:', err);
      }
    }

    // Remove from local state
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);

    const savedDeleted = localStorage.getItem('deleted_routine_ids');
    const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
    if (!deletedIds.includes(routineId)) {
      deletedIds.push(routineId);
      localStorage.setItem('deleted_routine_ids', JSON.stringify(deletedIds));
    }
  };

  const handleLaunchDayWorkout = (routineTitle: string, day: RoutineDay) => {
    if (!day.exercises || day.exercises.length === 0) return;

    const initialWorkoutExercises: WorkoutExercise[] = day.exercises.map((item) => {
      const isStretching = item.category === 'Stretching';
      const initialWeight = isStretching ? 0 : 20;

      const sets = Array.from({ length: item.targetSets }).map((_, idx) => ({
        id: `set-${Date.now()}-${idx}`,
        setNumber: idx + 1,
        weight: initialWeight,
        reps: item.targetReps,
        rpe: 8,
        completed: false,
        isWarmup: idx === 0,
      }));

      return {
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        targetMuscleGroup: item.targetMuscleGroup,
        category: item.category,
        sets,
        restSeconds: item.targetRestSeconds || 90,
      };
    });

    onStartWorkoutFromRoutine(`${routineTitle} • ${day.dayName}`, initialWorkoutExercises);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workout Routines & Multi-Day Schedules</h2>
          <p className="text-xs text-slate-500 font-medium">
            Build, import with AI, and manage multi-day training splits (workouts, cardio sessions & rest days)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiArchitectOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Import with AI ✨
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Routine Creation & Editing Form */}
      {isCreating && (
        <form onSubmit={handleSaveRoutine} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-emerald-400">
              {editingRoutineId ? 'Edit Routine Schedule' : 'Create Multi-Day Training Schedule'}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block font-medium">Routine Title</label>
              <input
                type="text"
                placeholder="e.g. 5-Day Push/Pull/Legs + Rest Schedule"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block font-medium">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Upper body focus with 2 rest days per week"
                value={routineDesc}
                onChange={(e) => setRoutineDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Day Schedule Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Schedule Days ({days.length} Days)
              </span>
              <button
                type="button"
                onClick={handleAddDay}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-4 h-4" /> Add Day
              </button>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {days.map((d, idx) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveEditingDayIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                    activeEditingDayIndex === idx
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>D{d.dayNumber}</span>
                  <span className="text-[10px] opacity-80 uppercase">({d.type})</span>
                </button>
              ))}
            </div>

            {/* Active Day Detail Configurator */}
            {days[activeEditingDayIndex] && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={days[activeEditingDayIndex].dayName}
                      onChange={(e) => {
                        const updated = [...days];
                        updated[activeEditingDayIndex].dayName = e.target.value;
                        setDays(updated);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
                      placeholder="Day Name"
                    />

                    {/* Day Type Selector */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...days];
                          updated[activeEditingDayIndex].type = 'workout';
                          setDays(updated);
                        }}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          days[activeEditingDayIndex].type === 'workout'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🏋️ Workout
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...days];
                          updated[activeEditingDayIndex].type = 'cardio';
                          setDays(updated);
                        }}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          days[activeEditingDayIndex].type === 'cardio'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🏃 Aerobic
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...days];
                          updated[activeEditingDayIndex].type = 'rest';
                          setDays(updated);
                        }}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          days[activeEditingDayIndex].type === 'rest'
                            ? 'bg-blue-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🧘 Rest Day
                      </button>
                    </div>
                  </div>

                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(activeEditingDayIndex)}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Day
                    </button>
                  )}
                </div>

                {/* Content based on Day Type */}
                {days[activeEditingDayIndex].type === 'rest' && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs space-y-2">
                    <p className="font-semibold text-blue-400">🧘 Rest & Recovery Day</p>
                    <input
                      type="text"
                      placeholder="Notes (e.g. Light stretching, foam rolling, 8 hours sleep)"
                      value={days[activeEditingDayIndex].notes || ''}
                      onChange={(e) => {
                        const updated = [...days];
                        updated[activeEditingDayIndex].notes = e.target.value;
                        setDays(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                )}

                {days[activeEditingDayIndex].type === 'cardio' && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs space-y-2">
                    <p className="font-semibold text-amber-400">🏃 Aerobic / Cardio Session</p>
                    <input
                      type="text"
                      placeholder="Notes (e.g. 30-45 mins Zone 2 cardio cycling/treadmill)"
                      value={days[activeEditingDayIndex].notes || ''}
                      onChange={(e) => {
                        const updated = [...days];
                        updated[activeEditingDayIndex].notes = e.target.value;
                        setDays(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                )}

                {days[activeEditingDayIndex].type === 'workout' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Exercises ({days[activeEditingDayIndex].exercises?.length || 0})
                      </span>
                      <div className="flex items-center gap-2">
                        {days[activeEditingDayIndex].exercises && days[activeEditingDayIndex].exercises!.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setIsReorderModalOpen(true)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                          >
                            <GripVertical className="w-3.5 h-3.5 text-emerald-400" /> Reorder
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsLibraryOpen(true)}
                          className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Exercise to Day {days[activeEditingDayIndex].dayNumber}
                        </button>
                      </div>
                    </div>

                    {(!days[activeEditingDayIndex].exercises || days[activeEditingDayIndex].exercises!.length === 0) ? (
                      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
                        No exercises added to this workout day yet. Click "Add Exercise to Day" above.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {days[activeEditingDayIndex].exercises!.map((ex, exIdx) => (
                          <div key={exIdx} className="flex flex-wrap items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-white">{ex.exerciseName}</h4>
                              <span className="text-[10px] text-emerald-400">{ex.targetMuscleGroup} • {ex.category}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-xs">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={ex.targetSets}
                                  onChange={(e) => {
                                    const updated = [...days];
                                    updated[activeEditingDayIndex].exercises![exIdx].targetSets = parseInt(e.target.value) || 1;
                                    setDays(updated);
                                  }}
                                  className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center text-white"
                                />
                                <span className="text-slate-500">sets ×</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={ex.targetReps}
                                  onChange={(e) => {
                                    const updated = [...days];
                                    updated[activeEditingDayIndex].exercises![exIdx].targetReps = parseInt(e.target.value) || 1;
                                    setDays(updated);
                                  }}
                                  className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center text-white"
                                />
                                <span className="text-slate-500">reps</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveExerciseFromDay(activeEditingDayIndex, exIdx)}
                                className="text-slate-500 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!routineTitle.trim() || days.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50"
            >
              {editingRoutineId ? 'Save Changes' : 'Save Training Schedule'}
            </button>
          </div>
        </form>
      )}

      {/* Routine Cards Grid */}
      {routines.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Layers className="w-8 h-8 mx-auto opacity-50 text-emerald-400" />
          <p className="text-sm font-semibold text-white">No training routines saved</p>
          <p className="text-xs text-slate-400">Click "Create Schedule" above to build a custom multi-day routine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routines.map((routine) => {
            const daysList = Array.isArray(routine.days) ? routine.days : [];
            const workoutDaysCount = daysList.filter((d) => d.type === 'workout').length;
            const restDaysCount = daysList.filter((d) => d.type === 'rest').length;
            const cardioDaysCount = daysList.filter((d) => d.type === 'cardio').length;

            return (
              <div
                key={routine.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all group"
              >
                <div className="space-y-4">
                  {/* Header & Delete Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {daysList.length} Days Total
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {workoutDaysCount} Workouts
                        </span>
                        {cardioDaysCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {cardioDaysCount} Cardio
                          </span>
                        )}
                        {restDaysCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {restDaysCount} Rest
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {routine.title}
                      </h3>
                      {routine.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{routine.description}</p>
                      )}
                    </div>

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(routine)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Edit Routine Schedule"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to erase template "${routine.title}"?`)) {
                            handleDeleteRoutine(routine.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Erase Routine / Template"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Day Schedule Breakdown */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Schedule Days:
                    </span>

                    {daysList.map((day, dIdx) => {
                      const isUpNext = dIdx === getSuggestedNextDayIndex(routine) && day.type === 'workout';

                      return (
                        <div
                          key={day.id}
                          className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 transition-all ${
                            isUpNext
                              ? 'bg-slate-950 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                              : 'bg-slate-950/80 border border-slate-800'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{day.dayName}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  day.type === 'workout'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : day.type === 'cardio'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}
                              >
                                {day.type}
                              </span>

                              {isUpNext && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm animate-pulse">
                                  👉 Up Next
                                </span>
                              )}
                            </div>

                            {day.type === 'workout' && day.exercises && (
                              <div className="text-[11px] text-slate-400">
                                {day.exercises.length} exercises (
                                {day.exercises.slice(0, 3).map((e) => e.exerciseName).join(', ')}
                                {day.exercises.length > 3 ? '...' : ''})
                              </div>
                            )}

                            {(day.type === 'rest' || day.type === 'cardio') && day.notes && (
                              <div className="text-[11px] text-slate-400 italic">{day.notes}</div>
                            )}
                          </div>

                          {day.type === 'workout' && day.exercises && day.exercises.length > 0 && (
                            <button
                              onClick={() => handleLaunchDayWorkout(routine.title, day)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all shrink-0 ${
                                isUpNext
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black shadow-emerald-500/20 scale-[1.02]'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-slate-950" />
                              Start Day {day.dayNumber}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise Selector Modal for Schedule Creator */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectExercise={handleAddExerciseToCurrentDay}
      />

      {/* AI Workout Architect Routine Import Modal */}
      <AiWorkoutArchitectModal
        isOpen={isAiArchitectOpen}
        onClose={() => setIsAiArchitectOpen(false)}
        onSaveRoutine={handleAiRoutineSave}
        userId={auth.currentUser?.uid || 'guest'}
      />

      {/* Reorder Exercises Modal */}
      <ReorderExercisesModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        exercises={days[activeEditingDayIndex]?.exercises || []}
        title={`Reorder Day ${days[activeEditingDayIndex]?.dayNumber} Exercises`}
        onSaveOrder={(reordered) => {
          const updated = [...days];
          updated[activeEditingDayIndex].exercises = reordered;
          setDays(updated);
        }}
      />
    </div>
  );
};
