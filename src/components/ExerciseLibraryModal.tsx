import React, { useState } from 'react';
import { Search, Plus, Dumbbell, X, Check } from 'lucide-react';
import { Exercise, TargetMuscleGroup, ExerciseCategory } from '../types';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS: TargetMuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
const CATEGORIES: ExerciseCategory[] = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Stretching'];

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const saved = localStorage.getItem('custom_exercises');
    if (saved) {
      try {
        const custom: Exercise[] = JSON.parse(saved);
        return [...DEFAULT_EXERCISES, ...custom];
      } catch (e) {
        return DEFAULT_EXERCISES;
      }
    }
    return DEFAULT_EXERCISES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<TargetMuscleGroup | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');

  // Custom Exercise Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<TargetMuscleGroup>('Chest');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('Barbell');

  if (!isOpen) return null;

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || ex.targetMuscleGroup === selectedMuscle;
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesMuscle && matchesCategory;
  });

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      targetMuscleGroup: newMuscle,
      category: newCategory,
    };

    const updated = [newEx, ...exercises];
    setExercises(updated);

    // Save custom exercises to localStorage
    const customOnly = updated.filter((ex) => ex.id.startsWith('custom-'));
    localStorage.setItem('custom_exercises', JSON.stringify(customOnly));

    setNewName('');
    setIsCreating(false);
    onSelectExercise(newEx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Exercise Library</h2>
              <p className="text-xs text-slate-400">Select an exercise to add to your workout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercise by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Muscle Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedMuscle('All')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedMuscle === 'All'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Muscles
            </button>
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedMuscle === m
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-slate-700 text-white font-medium'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? 'bg-slate-700 text-white font-medium'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isCreating ? (
            <form onSubmit={handleCreateExercise} className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-400">Create Custom Exercise</h3>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Incline Cable Flyes"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Muscle Group</label>
                  <select
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value as TargetMuscleGroup)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {MUSCLE_GROUPS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Equipment Type</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Save & Select
                </button>
              </div>
            </form>
          ) : (
            <>
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No exercises found matching your filter.</p>
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      onSelectExercise(ex);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          {ex.targetMuscleGroup}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {ex.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 text-slate-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 rounded-lg transition-colors">
                      <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isCreating && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <span className="text-xs text-slate-400">{filteredExercises.length} exercises available</span>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
