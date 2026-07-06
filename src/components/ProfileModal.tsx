import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Scale, Flame, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const PRESET_DIETS = [
  'Vegetarian',
  'Vegan',
  'Keto',
  'Low Carb',
  'Gluten-free',
  'Dairy-free',
  'High Protein',
  'Paleo'
];

export default function ProfileModal({ isOpen, onClose, profile, onSave }: ProfileModalProps) {
  const [weight, setWeight] = useState<number>(75);
  const [targetWeight, setTargetWeight] = useState<number>(70);
  const [calories, setCalories] = useState<number>(2000);
  const [protein, setProtein] = useState<number>(130);
  const [carbs, setCarbs] = useState<number>(220);
  const [fats, setFats] = useState<number>(65);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setWeight(profile.weight || 75);
      setTargetWeight(profile.targetWeight || 70);
      setCalories(profile.dailyCaloricLimit || 2000);
      setProtein(profile.proteinTarget || 130);
      setCarbs(profile.carbsTarget || 220);
      setFats(profile.fatsTarget || 65);
      setDietaryPreferences(profile.dietaryPreferences || []);
    }
  }, [profile]);

  // Quick auto-macro allocator based on calories and standard ratio
  const handleAutoAllocate = (type: 'balanced' | 'lowcarb' | 'highprotein') => {
    let pRatio = 0.3; // protein
    let cRatio = 0.4; // carbs
    let fRatio = 0.3; // fat

    if (type === 'lowcarb') {
      pRatio = 0.35;
      cRatio = 0.15;
      fRatio = 0.5;
    } else if (type === 'highprotein') {
      pRatio = 0.4;
      cRatio = 0.35;
      fRatio = 0.25;
    }

    // Protein: 4 kcal/g
    // Carbs: 4 kcal/g
    // Fats: 9 kcal/g
    const pGrams = Math.round((calories * pRatio) / 4);
    const cGrams = Math.round((calories * cRatio) / 4);
    const fGrams = Math.round((calories * fRatio) / 9);

    setProtein(pGrams);
    setCarbs(cGrams);
    setFats(fGrams);
  };

  const handleTogglePref = (pref: string) => {
    setDietaryPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (calories < 500 || calories > 10000) {
      setError('Calories goal must be between 500 and 10,000 kcal.');
      return;
    }
    if (protein < 0 || protein > 1000 || carbs < 0 || carbs > 1000 || fats < 0 || fats > 1000) {
      setError('Macros must be positive numbers below 1000 grams.');
      return;
    }
    if (weight < 0 || weight > 500 || targetWeight < 0 || targetWeight > 500) {
      setError('Weight must be between 0 and 500.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        dailyCaloricLimit: calories,
        proteinTarget: protein,
        carbsTarget: carbs,
        fatsTarget: fats,
        weight,
        targetWeight,
        dietaryPreferences
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving your profile goals.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="profile-modal-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-800 text-lg">Set Goals & Preferences</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg border border-rose-100 font-medium">
                  {error}
                </div>
              )}

              {/* Section 1: Weight Objectives */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span>⚖️ Weight Goals</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={e => setTargetWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Energy Target */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span>Daily Calorie Target</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Calories Limit (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={e => setCalories(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Section 3: Macronutrients Targets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-700 text-sm uppercase tracking-wider">
                    🥩 Macronutrient Targets
                  </h4>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleAutoAllocate('balanced')}
                      className="px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition"
                    >
                      Balanced
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoAllocate('lowcarb')}
                      className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded transition"
                    >
                      Low Carb
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoAllocate('highprotein')}
                      className="px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition"
                    >
                      High Protein
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-rose-600 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={protein}
                      onChange={e => setProtein(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-sm text-center focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                    />
                    <span className="block text-[10px] text-slate-400 text-center mt-1">
                      {protein * 4} kcal
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-600 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={e => setCarbs(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <span className="block text-[10px] text-slate-400 text-center mt-1">
                      {carbs * 4} kcal
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-600 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      value={fats}
                      onChange={e => setFats(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                    />
                    <span className="block text-[10px] text-slate-400 text-center mt-1">
                      {fats * 9} kcal
                    </span>
                  </div>
                </div>

                {/* Total macros energy indicator */}
                <div className="mt-3 text-right">
                  <span className="text-xs text-slate-400 font-medium">
                    Allocated Macros: <strong className="text-slate-600">{(protein * 4) + (carbs * 4) + (fats * 9)}</strong> kcal / {calories} kcal
                  </span>
                </div>
              </div>

              {/* Section 4: Dietary Preferences */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3 text-sm uppercase tracking-wider">
                  🌱 Dietary Preferences
                </h4>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DIETS.map(diet => {
                    const active = dietaryPreferences.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => handleTogglePref(diet)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-5 py-2 text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 text-sm font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Goals
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
