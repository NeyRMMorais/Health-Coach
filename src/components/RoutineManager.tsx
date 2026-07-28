import React, { useState } from 'react';
import { Play, Plus, Dumbbell, Trash2, Edit, Check, ChevronRight, X } from 'lucide-react';
import { WorkoutRoutine, WorkoutExercise, Exercise, TargetMuscleGroup } from '../types';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';

interface RoutineManagerProps {
  onStartWorkoutFromRoutine: (routineName: string, exercises: WorkoutExercise[]) => void;
}

export const RoutineManager: React.FC<RoutineManagerProps> = ({ onStartWorkoutFromRoutine }) => {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() => {
    const saved = localStorage.getItem('custom_routines');
    if (saved) {
      try {
        const custom: WorkoutRoutine[] = JSON.parse(saved);
        return [...DEFAULT_ROUTINES, ...custom];
      } catch (e) {
        return DEFAULT_ROUTINES;
      }
    }
    return DEFAULT_ROUTINES;
  });

  // Routine Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newExercises, setNewExercises] = useState<
    { exerciseId: string; exerciseName: string; targetMuscleGroup: TargetMuscleGroup; category: any; targetSets: number; targetReps: number }[]
  >([]);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const handleAddExerciseToRoutine = (exercise: Exercise) => {
    setNewExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        targetMuscleGroup: exercise.targetMuscleGroup,
        category: exercise.category,
        targetSets: 3,
        targetReps: 10,
      },
    ]);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newExercises.length === 0) return;

    const newRoutine: WorkoutRoutine = {
      id: `routine-${Date.now()}`,
      userId: 'guest',
      title: newTitle.trim(),
      description: newDescription.trim() || 'Custom workout routine',
      exercises: newExercises,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRoutine, ...routines];
    setRoutines(updated);

    // Save custom routines to localStorage
    const customOnly = updated.filter((r) => r.id.startsWith('routine-') && !r.id.startsWith('routine-push') && !r.id.startsWith('routine-pull') && !r.id.startsWith('routine-leg'));
    localStorage.setItem('custom_routines', JSON.stringify(customOnly));

    setNewTitle('');
    setNewDescription('');
    setNewExercises([]);
    setIsCreating(false);
  };

  const handleDeleteRoutine = (routineId: string) => {
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    const customOnly = updated.filter((r) => r.id.startsWith('routine-') && !r.id.startsWith('routine-push') && !r.id.startsWith('routine-pull') && !r.id.startsWith('routine-leg'));
    localStorage.setItem('custom_routines', JSON.stringify(customOnly));
  };

  const handleLaunchRoutine = (routine: WorkoutRoutine) => {
    // Convert routine template to WorkoutExercise[] with initial sets
    const initialWorkoutExercises: WorkoutExercise[] = routine.exercises.map((item) => {
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

    onStartWorkoutFromRoutine(routine.title, initialWorkoutExercises);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workout Routines & Templates</h2>
          <p className="text-xs text-slate-500 font-medium">Launch a saved routine or create a custom workout split</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Routine
        </button>
      </div>

      {/* Routine Creation Form */}
      {isCreating && (
        <form onSubmit={handleSaveRoutine} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-emerald-400">Create New Workout Routine</h3>
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
                placeholder="e.g. Upper Body Power"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block font-medium">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Hypertrophy focus with 8-12 reps"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Exercise List for Routine */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Exercises ({newExercises.length})</span>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            </div>

            {newExercises.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-6 text-center text-xs text-slate-500">
                No exercises added to this routine yet. Click "Add Exercise" above.
              </div>
            ) : (
              <div className="space-y-2">
                {newExercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
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
                            const updated = [...newExercises];
                            updated[idx].targetSets = parseInt(e.target.value) || 1;
                            setNewExercises(updated);
                          }}
                          className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-white"
                        />
                        <span className="text-slate-500">sets ×</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={ex.targetReps}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].targetReps = parseInt(e.target.value) || 1;
                            setNewExercises(updated);
                          }}
                          className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-white"
                        />
                        <span className="text-slate-500">reps</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...newExercises];
                          updated.splice(idx, 1);
                          setNewExercises(updated);
                        }}
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
              disabled={newExercises.length === 0 || !newTitle.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50"
            >
              Save Routine
            </button>
          </div>
        </form>
      )}

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.map((routine) => (
          <div
            key={routine.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {routine.exercises.length} Exercises
                </span>
                {!['routine-push-day', 'routine-pull-day', 'routine-leg-day'].includes(routine.id) && (
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Delete Routine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                {routine.title}
              </h3>
              {routine.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{routine.description}</p>
              )}

              {/* Exercise Summary Preview */}
              <div className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3">
                {routine.exercises.slice(0, 4).map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate max-w-[180px]">{ex.exerciseName}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {ex.targetSets} × {ex.targetReps}
                    </span>
                  </div>
                ))}
                {routine.exercises.length > 4 && (
                  <div className="text-[11px] text-slate-500 italic">
                    +{routine.exercises.length - 4} more exercises...
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleLaunchRoutine(routine)}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Start Workout
            </button>
          </div>
        ))}
      </div>

      {/* Exercise Selector Modal for Routine Creator */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectExercise={handleAddExerciseToRoutine}
      />
    </div>
  );
};
