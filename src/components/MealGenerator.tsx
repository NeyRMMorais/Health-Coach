import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, ListChecks, ChevronRight, Check, Flame, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { MealSuggestion, SavedMeal } from '../types';

interface MealGeneratorProps {
  userGoal: string;
  userDietaryPreferences: string[];
  savedMeals?: SavedMeal[];
  onLogMeal: (meal: {
    name: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }) => Promise<void>;
  onSaveToLibrary?: (meal: Omit<SavedMeal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const PRESET_GOALS = [
  'Lose Weight / Calorie Deficit',
  'Build Muscle / Lean Bulk',
  'Maintain Weight & Active Vitality',
  'Keto Adaptability',
  'Clean Eating & General Wellness'
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

const LOADER_MESSAGES = [
  'Analyzing dietary goals and macronutrients...',
  'Sifting through wholesome ingredient ideas...',
  'Plating customized chef recommendations...',
  'Calculating precise nutrient distributions...',
  'Curating delicious prep guides for you...'
];

export default function MealGenerator({
  userGoal,
  userDietaryPreferences,
  savedMeals = [],
  onLogMeal,
  onSaveToLibrary
}: MealGeneratorProps) {
  const [goal, setGoal] = useState<string>(userGoal || 'Lose Weight / Calorie Deficit');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(userDietaryPreferences || []);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderMsgIndex, setLoaderMsgIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loggedIndices, setLoggedIndices] = useState<number[]>([]);
  const [savedIndices, setSavedIndices] = useState<number[]>([]);

  const handleSaveToLibrary = async (index: number, suggestion: MealSuggestion) => {
    if (!onSaveToLibrary) return;
    setSavedIndices(prev => [...prev, index]);
    try {
      const recipeNotes = [
        suggestion.description,
        suggestion.ingredients?.length ? `Ingredients: ${suggestion.ingredients.join(', ')}` : ''
      ].filter(Boolean).join('\n');

      await onSaveToLibrary({
        name: suggestion.title,
        mealType,
        calories: suggestion.calories,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        fats: suggestion.fats,
        description: recipeNotes || undefined,
      });
    } catch (err) {
      console.error('Failed to save to library:', err);
    }
  };

  // Keep goal and dietary preferences updated from profile changes
  useEffect(() => {
    if (userGoal) setGoal(userGoal);
  }, [userGoal]);

  useEffect(() => {
    if (userDietaryPreferences) setDietaryPrefs(userDietaryPreferences);
  }, [userDietaryPreferences]);

  // Rotates loader message
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoaderMsgIndex(prev => (prev + 1) % LOADER_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setExpandedIndex(null);
    setLoggedIndices([]);

    try {
      const res = await fetch('/api/gemini/suggest-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          mealType,
          dietaryPreferences: dietaryPrefs
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch healthy meal recommendations from server.');
      }

      const data = await res.json();
      setSuggestions(data);
      if (data.length > 0) {
        setExpandedIndex(0); // expand first item by default
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate suggestions. Please ensure your Gemini API key is configured correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLog = async (index: number, suggestion: MealSuggestion) => {
    try {
      await onLogMeal({
        name: suggestion.title,
        mealType,
        calories: suggestion.calories,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        fats: suggestion.fats
      });
      setLoggedIndices(prev => [...prev, index]);
    } catch (err) {
      console.error(err);
      setError('Failed to log meal to food diary.');
    }
  };

  const togglePref = (pref: string) => {
    setDietaryPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 space-y-6" id="meal-generator-section">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-800">AI Meal Suggestions</h2>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
          Powered by Gemini
        </span>
      </div>

      {error && (
        <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goal selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Current Objective</label>
          <select
            value={goal}
            onChange={e => setGoal(e.target.value)}
            className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            {PRESET_GOALS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Meal type selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Meal Category</label>
          <div className="grid grid-cols-4 gap-1">
            {MEAL_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  mealType === type
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dietary overrider / checkboxes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Dietary Adjustments (For generation)</label>
        <div className="flex flex-wrap gap-1.5">
          {['Vegetarian', 'Vegan', 'Keto', 'Low Carb', 'Gluten-free', 'Dairy-free', 'High Protein'].map(pref => {
            const selected = dietaryPrefs.includes(pref);
            return (
              <button
                key={pref}
                type="button"
                onClick={() => togglePref(pref)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  selected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {pref}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2 shadow disabled:opacity-75 disabled:cursor-not-allowed"
      >
        <Sparkles className="h-4 w-4" />
        Generate Wholesome Recipes
      </button>

      {/* Suggestions output area */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute h-8 w-8 rounded-full bg-emerald-400 opacity-20"></div>
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-100 border-t-emerald-600"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 animate-pulse text-center max-w-xs">
              {LOADER_MESSAGES[loaderMsgIndex]}
            </p>
          </div>
        )}

        {/* Suggestion List Cards */}
        <AnimatePresence>
          {suggestions.map((s, idx) => {
            const isExpanded = expandedIndex === idx;
            const isLogged = loggedIndices.includes(idx);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border border-slate-100 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Collapsed Header */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="px-4 py-3 bg-slate-50 hover:bg-slate-100/50 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">{s.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-500" />
                        {s.prepTime}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <Flame className="h-3.5 w-3.5" />
                        {s.calories} kcal
                      </span>
                      <span className="font-medium text-rose-500">P: {s.protein}g</span>
                      <span className="font-medium text-indigo-500">C: {s.carbs}g</span>
                      <span className="font-medium text-amber-500">F: {s.fats}g</span>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 px-5 py-4 space-y-4 text-slate-700 bg-white"
                    >
                      <p className="text-xs md:text-sm text-slate-500 italic">
                        {s.description}
                      </p>

                      {/* Ingredients */}
                      <div>
                        <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ListChecks className="h-3.5 w-3.5 text-emerald-600" />
                          Ingredients
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {s.ingredients.map((ing, i) => (
                            <li key={i} className="text-xs flex items-start gap-1.5 text-slate-600">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Preparation Instructions */}
                      <div>
                        <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider mb-2">
                          Instructions
                        </h4>
                        <ol className="space-y-1.5">
                          {s.instructions.map((inst, i) => (
                            <li key={i} className="text-xs text-slate-600 flex gap-2">
                              <span className="font-bold text-slate-400 shrink-0">{i + 1}.</span>
                              <span>{inst}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        {onSaveToLibrary && (
                          <button
                            type="button"
                            onClick={() => handleSaveToLibrary(idx, s)}
                            disabled={savedIndices.includes(idx)}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                              savedIndices.includes(idx)
                                ? 'bg-amber-50 text-amber-700 cursor-default border border-amber-200/60'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${savedIndices.includes(idx) ? 'fill-amber-500 text-amber-600' : ''}`} />
                            {savedIndices.includes(idx) ? 'Saved to Library' : 'Save to Library'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleLog(idx, s)}
                          disabled={isLogged}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ml-auto ${
                            isLogged
                              ? 'bg-emerald-50 text-emerald-700 cursor-default'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {isLogged ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Logged to Diary
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Log to {mealType} Diary
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
