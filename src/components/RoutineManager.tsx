import React, { useState } from 'react';
import { Play, Plus, Dumbbell, Trash2, Edit, Check, ChevronRight, X, Calendar, HeartPulse, Flame, Sun, Layers, Sparkles } from 'lucide-react';
import { WorkoutRoutine, RoutineDay, RoutineDayType, WorkoutExercise, Exercise, TargetMuscleGroup } from '../types';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';

import { AiWorkoutArchitectModal } from './AiWorkoutArchitectModal';

interface RoutineManagerProps {
  onStartWorkoutFromRoutine: (routineName: string, exercises: WorkoutExercise[]) => void;
}

export const RoutineManager: React.FC<RoutineManagerProps> = ({ onStartWorkoutFromRoutine }) => {
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

  // Routine Creation & AI Architect State
  const [isCreating, setIsCreating] = useState(false);
  const [isAiArchitectOpen, setIsAiArchitectOpen] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [days, setDays] = useState<RoutineDay[]>([
    { id: `day-${Date.now()}-1`, dayNumber: 1, dayName: 'D1 - Workout Session', type: 'workout', exercises: [] },
  ]);

  const handleAiRoutineSave = (newRoutine: WorkoutRoutine) => {
    setRoutines((prev) => [newRoutine, ...prev]);

    // Save to localStorage
    const savedCustom = localStorage.getItem('custom_routines');
    let customRoutines: WorkoutRoutine[] = [];
    if (savedCustom) {
      try {
        customRoutines = JSON.parse(savedCustom);
      } catch (e) {
        customRoutines = [];
      }
    }
    customRoutines.unshift(newRoutine);
    localStorage.setItem('custom_routines', JSON.stringify(customRoutines));
  };

  // Track which day is currently being edited in the modal

  // Track which day is currently being edited in the modal
  const [activeEditingDayIndex, setActiveEditingDayIndex] = useState<number>(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

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

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim() || days.length === 0) return;

    const newRoutine: WorkoutRoutine = {
      id: `routine-custom-${Date.now()}`,
      userId: 'guest',
      title: routineTitle.trim(),
      description: routineDesc.trim() || 'Custom multi-day training schedule',
      days,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRoutine, ...routines];
    setRoutines(updated);

    // Save custom routines to localStorage
    const customOnly = updated.filter((r) => r.id.startsWith('routine-custom-'));
    localStorage.setItem('custom_routines', JSON.stringify(customOnly));

    // Reset form
    setRoutineTitle('');
    setRoutineDesc('');
    setDays([{ id: `day-${Date.now()}-1`, dayNumber: 1, dayName: 'D1 - Workout Session', type: 'workout', exercises: [] }]);
    setIsCreating(false);
  };

  const handleDeleteRoutine = (routineId: string) => {
    // Remove from active state
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);

    // Persist deleted IDs so default templates can be erased persistently
    const savedDeleted = localStorage.getItem('deleted_routine_ids');
    const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
    if (!deletedIds.includes(routineId)) {
      deletedIds.push(routineId);
      localStorage.setItem('deleted_routine_ids', JSON.stringify(deletedIds));
    }

    // Also update custom routines list if it was a custom one
    const customOnly = updated.filter((r) => r.id.startsWith('routine-custom-'));
    localStorage.setItem('custom_routines', JSON.stringify(customOnly));
  };

  const handleLaunchDayWorkout = (routineTitle: string, day: RoutineDay) => {
    if (!day.exercises || day.exercises.length === 0) return;

    const initialWorkoutExercises: WorkoutExercise[] = day.exercises.map((item) => {
      const sets = Array.from({ length: item.targetSets }).map((_, idx) => ({
        id: `set-${Date.now()}-${idx}`,
        setNumber: idx + 1,
        weight: 20,
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all"
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

      {/* Routine Creation Form */}
      {isCreating && (
        <form onSubmit={handleSaveRoutine} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-emerald-400">Create Multi-Day Training Schedule</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
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
                      <button
                        type="button"
                        onClick={() => setIsLibraryOpen(true)}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Exercise to Day {days[activeEditingDayIndex].dayNumber}
                      </button>
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
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!routineTitle.trim() || days.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50"
            >
              Save Training Schedule
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

                    {/* Delete Routine / Template Button (Works for ALL templates!) */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to erase template "${routine.title}"?`)) {
                          handleDeleteRoutine(routine.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                      title="Erase Routine / Template"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Multi-Day Schedule Breakdown */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Schedule Days:
                    </span>

                    {daysList.map((day) => (
                      <div
                        key={day.id}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2"
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
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-all shrink-0"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            Start Day {day.dayNumber}
                          </button>
                        )}
                      </div>
                    ))}
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
      />
    </div>
  );
};
