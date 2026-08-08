import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Bookmark,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { SavedMeal } from '../types';

interface SavedMealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMeals: SavedMeal[];
  selectedDate?: string;
  onAddSavedMeal: (meal: Omit<SavedMeal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteSavedMeal: (id: string) => Promise<void>;
  onUpdateSavedMeal: (id: string, updatedFields: Partial<SavedMeal>) => Promise<void>;
  onLogSavedMeal: (meal: SavedMeal, targetDate?: string) => Promise<void>;
}

export default function SavedMealsModal({
  isOpen,
  onClose,
  savedMeals,
  selectedDate,
  onAddSavedMeal,
  onDeleteSavedMeal,
  onUpdateSavedMeal,
  onLogSavedMeal
}: SavedMealsModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [expandedMealIds, setExpandedMealIds] = useState<string[]>([]);

  const toggleExpand = (mealId: string) => {
    setExpandedMealIds(prev => 
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    );
  };

  // New Saved Meal Form State
  const [newName, setNewName] = useState<string>('');
  const [newMealType, setNewMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [newCalories, setNewCalories] = useState<string>('');
  const [newProtein, setNewProtein] = useState<string>('');
  const [newCarbs, setNewCarbs] = useState<string>('');
  const [newFats, setNewFats] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit State
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editMealType, setEditMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [editCalories, setEditCalories] = useState<string>('');
  const [editProtein, setEditProtein] = useState<string>('');
  const [editCarbs, setEditCarbs] = useState<string>('');
  const [editFats, setEditFats] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Logging Feedback tracking
  const [loggedMealIds, setLoggedMealIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // Filtering
  const filteredMeals = savedMeals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (meal.description && meal.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || meal.mealType === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('Meal name is required.');
      return;
    }

    const kcal = parseInt(newCalories) || 0;
    const p = parseInt(newProtein) || 0;
    const c = parseInt(newCarbs) || 0;
    const f = parseInt(newFats) || 0;

    if (kcal < 0 || p < 0 || c < 0 || f < 0) {
      setFormError('Calories and macros cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSavedMeal({
        name: newName.trim(),
        mealType: newMealType,
        calories: kcal,
        protein: p,
        carbs: c,
        fats: f,
        description: newDescription.trim() || undefined,
      });

      setNewName('');
      setNewCalories('');
      setNewProtein('');
      setNewCarbs('');
      setNewFats('');
      setNewDescription('');
      setIsAddingNew(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save meal template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (meal: SavedMeal) => {
    setEditingMealId(meal.id);
    setEditName(meal.name);
    setEditMealType(meal.mealType);
    setEditCalories(String(meal.calories));
    setEditProtein(String(meal.protein));
    setEditCarbs(String(meal.carbs));
    setEditFats(String(meal.fats));
    setEditDescription(meal.description || '');
    setEditError(null);
  };

  const handleSaveEdit = async (mealId: string) => {
    if (!editName.trim()) {
      setEditError('Meal name is required.');
      return;
    }
    const kcal = parseInt(editCalories) || 0;
    const p = parseInt(editProtein) || 0;
    const c = parseInt(editCarbs) || 0;
    const f = parseInt(editFats) || 0;

    try {
      await onUpdateSavedMeal(mealId, {
        name: editName.trim(),
        mealType: editMealType,
        calories: kcal,
        protein: p,
        carbs: c,
        fats: f,
        description: editDescription.trim() || undefined,
      });
      setEditingMealId(null);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Failed to update saved meal.');
    }
  };

  const handleLog = async (meal: SavedMeal) => {
    try {
      await onLogSavedMeal(meal, selectedDate);
      setLoggedMealIds(prev => [...prev, meal.id]);
      setTimeout(() => {
        setLoggedMealIds(prev => prev.filter(id => id !== meal.id));
      }, 2000);
    } catch (err) {
      console.error('Failed to log saved meal:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
              <Bookmark className="h-5 w-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Saved Meal Ideas</h2>
              <p className="text-xs text-slate-400">Quickly re-log your staple meals & favorite wholesome recipes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls Bar: Search + Category Filter + Add New toggle */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search saved meals..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            {/* Add New Button */}
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              {isAddingNew ? 'Close Form' : 'Create Saved Meal'}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Add New Form */}
        <AnimatePresence>
          {isAddingNew && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Create Meal Template
              </h3>

              {formError && (
                <div className="p-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meal Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="E.g., Whey Protein Oatmeal"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meal Category</label>
                    <select
                      value={newMealType}
                      onChange={e => setNewMealType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 text-center">Calories</label>
                    <input
                      type="number"
                      value={newCalories}
                      onChange={e => setNewCalories(e.target.value)}
                      placeholder="400"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-600 uppercase mb-1 text-center">Protein (g)</label>
                    <input
                      type="number"
                      value={newProtein}
                      onChange={e => setNewProtein(e.target.value)}
                      placeholder="30"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 text-center">Carbs (g)</label>
                    <input
                      type="number"
                      value={newCarbs}
                      onChange={e => setNewCarbs(e.target.value)}
                      placeholder="45"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1 text-center">Fats (g)</label>
                    <input
                      type="number"
                      value={newFats}
                      onChange={e => setNewFats(e.target.value)}
                      placeholder="10"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recipe / Prompt Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="E.g., 2 eggs, 50g oats, 200ml skim milk, 1 scoop whey protein"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none text-slate-700"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    Save Meal
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Meals List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredMeals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl block">🥗</span>
              <p className="text-sm font-semibold text-slate-600">No saved meals found</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchQuery || categoryFilter !== 'All'
                  ? 'Try clearing your filters or search query.'
                  : 'Bookmark meals from your daily food log or AI recipes to save them here for 1-click logging!'}
              </p>
            </div>
          ) : (
            filteredMeals.map(meal => {
              const isEditing = editingMealId === meal.id;
              const isLogged = loggedMealIds.includes(meal.id);

              if (isEditing) {
                return (
                  <div
                    key={meal.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fadeIn"
                  >
                    {editError && (
                      <div className="p-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
                        {editError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      <select
                        value={editMealType}
                        onChange={e => setEditMealType(e.target.value as any)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        value={editCalories}
                        onChange={e => setEditCalories(e.target.value)}
                        placeholder="Calories"
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                      />
                      <input
                        type="number"
                        value={editProtein}
                        onChange={e => setEditProtein(e.target.value)}
                        placeholder="Protein"
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                      />
                      <input
                        type="number"
                        value={editCarbs}
                        onChange={e => setEditCarbs(e.target.value)}
                        placeholder="Carbs"
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                      />
                      <input
                        type="number"
                        value={editFats}
                        onChange={e => setEditFats(e.target.value)}
                        placeholder="Fats"
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Recipe / Prompt Notes (Optional)"
                      className="w-full px-3 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 resize-none"
                    />

                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleSaveEdit(meal.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs flex items-center gap-1 font-semibold"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingMealId(null)}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              const isExpanded = expandedMealIds.includes(meal.id);

              return (
                <div
                  key={meal.id}
                  className="flex items-start justify-between p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition shadow-xs group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {meal.description ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(meal.id)}
                          className="flex items-center gap-1 text-left font-bold text-slate-800 text-sm hover:text-amber-700 transition cursor-pointer group/title"
                          title={isExpanded ? 'Collapse recipe details' : 'Expand recipe details'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-amber-600 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover/title:text-amber-600 shrink-0 transition" />
                          )}
                          <span className="truncate">{meal.name}</span>
                        </button>
                      ) : (
                        <h4 className="font-bold text-slate-800 text-sm truncate">{meal.name}</h4>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {meal.mealType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-semibold text-emerald-600">{meal.calories} kcal</span>
                      <span>•</span>
                      <span>P: <strong className="text-rose-500">{meal.protein}g</strong></span>
                      <span>•</span>
                      <span>C: <strong className="text-indigo-500">{meal.carbs}g</strong></span>
                      <span>•</span>
                      <span>F: <strong className="text-amber-500">{meal.fats}g</strong></span>
                    </div>
                    {meal.description && isExpanded && (
                      <div className="mt-2.5 text-xs bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-slate-700 animate-fadeIn shadow-xs">
                        <div className="font-bold text-[10px] text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Recipe / Prompt Details:</span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{meal.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Log button */}
                    <button
                      onClick={() => handleLog(meal)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs ${
                        isLogged
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isLogged ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Logged!
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Log to Today
                        </>
                      )}
                    </button>

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleStartEdit(meal)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition"
                        title="Edit meal template"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSavedMeal(meal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete from saved library"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
