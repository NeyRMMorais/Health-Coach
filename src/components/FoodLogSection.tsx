import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, Plus, Sparkles, AlertCircle, RefreshCw, Edit2, Check, X, Bookmark, ChevronLeft, ChevronRight, Camera, Paperclip } from 'lucide-react';
import { FoodLog, UserProfile, SavedMeal } from '../types';

interface FoodLogSectionProps {
  logs: FoodLog[];
  profile: UserProfile | null;
  savedMeals: SavedMeal[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onAddLog: (log: Omit<FoodLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdateLog: (id: string, updatedFields: Partial<FoodLog>) => Promise<void>;
  onSaveToLibrary: (meal: Omit<SavedMeal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onOpenSavedMealsModal: () => void;
}

export default function FoodLogSection({
  logs,
  profile,
  savedMeals,
  selectedDate: propSelectedDate,
  onDateChange,
  onAddLog,
  onDeleteLog,
  onUpdateLog,
  onSaveToLibrary,
  onOpenSavedMealsModal,
}: FoodLogSectionProps) {
  // Input fields
  const [name, setName] = useState<string>('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fats, setFats] = useState<string>('');
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [time, setTime] = useState<string>(getCurrentTimeString);
  const [isTimeManuallyEdited, setIsTimeManuallyEdited] = useState<boolean>(false);

  // Synchronize time to "now" on mount, tab navigation, focus, or app resume
  useEffect(() => {
    const syncTimeToNow = () => {
      if (!isTimeManuallyEdited) {
        setTime(getCurrentTimeString());
      }
    };

    // Immediate sync on mount / screen navigation
    syncTimeToNow();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTimeToNow();
      }
    };

    const handleFocus = () => {
      syncTimeToNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isTimeManuallyEdited]);

  // Editing state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [tempMealType, setTempMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | null>(null);
  const [tempTime, setTempTime] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // AI assistant input & image attachment
  const [aiInput, setAiInput] = useState<string>('');
  const [aiPromptUsed, setAiPromptUsed] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isRecipeSaved, setIsRecipeSaved] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; name: string; sizeKb: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side image downscaling & compression helper (max 1024x1024, quality 0.8)
  const compressImage = (file: File): Promise<{ dataUrl: string; name: string; sizeKb: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

          resolve({
            dataUrl,
            name: file.name || 'photo.jpg',
            sizeKb: approxSizeKb,
          });
        };
        img.onerror = () => reject(new Error('Failed to decode image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const compressed = await compressImage(file);
      setSelectedImage(compressed);
      setAiError(null);
    } catch (err) {
      console.error('Image compression failed', err);
      setAiError('Could not process the selected image. Please try another picture.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Saved Meals Library tracking
  const [savedToLibraryIds, setSavedToLibraryIds] = useState<string[]>([]);

  const handleSaveLogToLibrary = async (log: FoodLog) => {
    setSavedToLibraryIds(prev => [...prev, log.id]);
    try {
      await onSaveToLibrary({
        name: log.name,
        mealType: log.mealType,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fats: log.fats,
      });
    } catch (err) {
      console.error('Failed to save to library:', err);
    }
  };

  const handleSaveAiPromptToLibrary = async () => {
    if (!name.trim()) return;
    const kcalVal = parseInt(calories) || 0;
    const pVal = parseInt(protein) || 0;
    const cVal = parseInt(carbs) || 0;
    const fVal = parseInt(fats) || 0;

    setIsRecipeSaved(true);
    try {
      await onSaveToLibrary({
        name: name.trim(),
        mealType,
        calories: kcalVal,
        protein: pVal,
        carbs: cVal,
        fats: fVal,
        description: aiPromptUsed || undefined,
      });
    } catch (err) {
      console.error('Failed to save to library:', err);
    }
  };

  const handleStartEdit = (log: FoodLog) => {
    setEditingLogId(log.id);
    setTempMealType(log.mealType);
    setTempTime(log.time || '12:00');
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setTempMealType(null);
    setTempTime(null);
    setEditError(null);
  };

  const handleSaveEdit = async (logId: string) => {
    const finalMealType = tempMealType;
    const finalTime = tempTime ? tempTime.slice(0, 5) : '12:00';
    if (!finalMealType || !finalTime) return;

    setIsSaving(true);
    setEditError(null);
    try {
      await onUpdateLog(logId, { mealType: finalMealType, time: finalTime });
      setEditingLogId(null);
      setTempMealType(null);
      setTempTime(null);
    } catch (err: any) {
      console.error('Error updating meal type/time:', err);
      let errMsg = 'Failed to update food log.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errMsg = parsed.error;
        }
      } catch {
        if (err?.message) errMsg = err.message;
      }
      setEditError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [internalDate, setInternalDate] = useState<string>(todayStr);
  const selectedDate = propSelectedDate || internalDate;
  const setSelectedDate = (d: string) => {
    setInternalDate(d);
    onDateChange?.(d);
  };

  const handleShiftDate = (daysDelta: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + daysDelta);

    const newYear = dateObj.getFullYear();
    const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newDay = String(dateObj.getDate()).padStart(2, '0');

    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter logs for selected date
  const filteredLogs = logs.filter(l => l.date === selectedDate);

  // Grouped logs totals
  const breakfastLogs = filteredLogs.filter(l => l.mealType === 'Breakfast');
  const lunchLogs = filteredLogs.filter(l => l.mealType === 'Lunch');
  const dinnerLogs = filteredLogs.filter(l => l.mealType === 'Dinner');
  const snackLogs = filteredLogs.filter(l => l.mealType === 'Snack');

  const getMealSummary = (mealLogs: FoodLog[]) => {
    return mealLogs.reduce(
      (acc, curr) => {
        acc.calories += curr.calories;
        acc.protein += curr.protein;
        acc.carbs += curr.carbs;
        acc.fats += curr.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const totals = getMealSummary(filteredLogs);

  const handleAiAnalyze = async () => {
    if (!aiInput.trim() && !selectedImage) return;
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiInput.trim(),
          image: selectedImage
            ? {
                data: selectedImage.dataUrl,
                mimeType: 'image/jpeg',
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to estimate calories from meal.');
      }

      const parsed = await res.json();
      const promptRecord = selectedImage && aiInput.trim()
        ? `[Photo + Notes] ${aiInput.trim()}`
        : selectedImage
        ? `[Photo of Meal]`
        : aiInput.trim();

      setAiPromptUsed(promptRecord);
      setIsRecipeSaved(false);
      setName(parsed.name || '');
      setCalories(String(parsed.calories ?? ''));
      setProtein(String(parsed.protein ?? ''));
      setCarbs(String(parsed.carbs ?? ''));
      setFats(String(parsed.fats ?? ''));

      // Switch to manual input to let them review and submit
      setActiveTab('manual');
    } catch (err) {
      console.error(err);
      setAiError('Gemini could not analyze this meal. Please try again or log manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Food description or item name is required.');
      return;
    }

    const kcalVal = parseInt(calories) || 0;
    const pVal = parseInt(protein) || 0;
    const cVal = parseInt(carbs) || 0;
    const fVal = parseInt(fats) || 0;

    if (kcalVal < 0 || pVal < 0 || cVal < 0 || fVal < 0) {
      setFormError('Calories and macros must be non-negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddLog({
        name,
        mealType,
        calories: kcalVal,
        protein: pVal,
        carbs: cVal,
        fats: fVal,
        date: selectedDate,
        time
      });

      // Clear form
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setAiInput('');
      setSelectedImage(null);
      setTime(getCurrentTimeString());
      setIsTimeManuallyEdited(false);
    } catch (err: any) {
      console.error('Error logging food:', err);
      let errMsg = 'Failed to save food log to Firestore database.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errMsg = `Failed to save food log to Firestore database: ${parsed.error}`;
        }
      } catch {
        if (err?.message) {
          errMsg = `Failed to save food log to Firestore database: ${err.message}`;
        }
      }
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="food-log-section-container">
      {/* Left 2 Columns: Food diary logs */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-md p-6 flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            📊 Daily Food Log
          </h2>

          {/* Date Selector with Previous/Next Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition flex items-center justify-center border border-slate-200/80 bg-slate-50 shadow-2xs"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 font-extrabold text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleShiftDate(1)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition flex items-center justify-center border border-slate-200/80 bg-slate-50 shadow-2xs"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 text-[11px] font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl transition shadow-sm ml-1"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-100/60">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Energy</span>
            <span className="text-base font-extrabold text-slate-800">{totals.calories} <span className="text-[10px] font-medium text-slate-500">kcal</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-rose-500 font-bold uppercase">Protein</span>
            <span className="text-base font-extrabold text-rose-600">{totals.protein} <span className="text-[10px] font-medium text-slate-400">g</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-indigo-500 font-bold uppercase">Carbs</span>
            <span className="text-base font-extrabold text-indigo-600">{totals.carbs} <span className="text-[10px] font-medium text-slate-400">g</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-500 font-bold uppercase">Fats</span>
            <span className="text-base font-extrabold text-amber-600">{totals.fats} <span className="text-[10px] font-medium text-slate-400">g</span></span>
          </div>
        </div>

        {/* Log Entries grouped by Meal Type */}
        <div className="space-y-6 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <span className="text-4xl mb-3">🍏</span>
              <p className="text-sm font-semibold text-slate-500">Your diet diary is empty on this day.</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Use the quick AI assistant or log manually to populate your metrics.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(meal => {
                const mealList = filteredLogs.filter(l => l.mealType === meal);
                if (mealList.length === 0) return null;

                const mealSummary = getMealSummary(mealList);

                return (
                  <div key={meal} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    {/* Meal Header with totals */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="text-base">
                          {meal === 'Breakfast' ? '🥞' : meal === 'Lunch' ? '🥗' : meal === 'Dinner' ? '🥩' : '🍪'}
                        </span>
                        {meal}
                      </h3>
                      <div className="text-xs font-semibold text-slate-500 space-x-2">
                        <span className="text-emerald-600 font-bold">{mealSummary.calories} kcal</span>
                        <span className="text-slate-400">|</span>
                        <span>P: <strong className="text-rose-600">{mealSummary.protein}g</strong></span>
                        <span>C: <strong className="text-indigo-600">{mealSummary.carbs}g</strong></span>
                        <span>F: <strong className="text-amber-600">{mealSummary.fats}g</strong></span>
                      </div>
                    </div>

                    {/* Meal Entries */}
                    <div className="space-y-2">
                      {mealList.map(log => {
                        const isEditing = editingLogId === log.id;

                        if (isEditing) {
                          return (
                            <div
                              key={log.id}
                              className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2 animate-fadeIn"
                            >
                              {/* Line 1: Description */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-700 text-sm truncate">{log.name}</h4>
                              </div>

                              {/* Line 2: Calories & Macros */}
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span><strong className="text-slate-600">{log.calories} kcal</strong></span>
                                <span>•</span>
                                <span>P: <strong className="text-rose-500/80">{log.protein}g</strong></span>
                                <span>•</span>
                                <span>C: <strong className="text-indigo-500/80">{log.carbs}g</strong></span>
                                <span>•</span>
                                <span>F: <strong className="text-amber-500/80">{log.fats}g</strong></span>
                              </div>

                              {editError && (
                                <div className="text-[10px] text-rose-600 bg-rose-50 px-2 py-1.5 rounded border border-rose-100 font-medium">
                                  {editError}
                                </div>
                              )}

                              {/* Line 3: Edit inputs (Time, Category) & Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                  {/* Time Picker */}
                                  <input
                                    type="time"
                                    value={tempTime || log.time}
                                    onChange={e => setTempTime(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition w-24"
                                  />
                                  {/* Category Dropdown */}
                                  <select
                                    value={tempMealType || log.mealType}
                                    onChange={e => setTempMealType(e.target.value as any)}
                                    className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition flex-1"
                                  >
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                    <option value="Snack">Snack</option>
                                  </select>
                                </div>

                                {/* Save / Cancel buttons */}
                                <div className="flex items-center gap-1 ml-auto">
                                  <button
                                    onClick={() => handleSaveEdit(log.id)}
                                    disabled={isSaving}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                                    title="Confirm changes"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                                    title="Cancel"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Normal state
                        const isBookmarked = savedMeals.some(
                          m => m.name.toLowerCase() === log.name.toLowerCase() && m.mealType === log.mealType && m.calories === log.calories
                        ) || savedToLibraryIds.includes(log.id);

                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition"
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-700 text-sm truncate">{log.name}</h4>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold shrink-0">
                                  {log.time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                <span>P: <strong className="text-rose-500/80">{log.protein}g</strong></span>
                                <span>•</span>
                                <span>C: <strong className="text-indigo-500/80">{log.carbs}g</strong></span>
                                <span>•</span>
                                <span>F: <strong className="text-amber-500/80">{log.fats}g</strong></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-extrabold text-slate-700">
                                {log.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSaveLogToLibrary(log)}
                                  disabled={isBookmarked}
                                  className={`p-1.5 rounded-lg transition ${
                                    isBookmarked
                                      ? 'text-amber-500 bg-amber-50'
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                  }`}
                                  title={isBookmarked ? 'Saved in Meal Library' : 'Save to Meal Library'}
                                >
                                  <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleStartEdit(log)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition"
                                  title="Reclassify meal category"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteLog(log.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Logging tools */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-md">Add Wholesome Food</h3>
          <button
            onClick={onOpenSavedMealsModal}
            className="px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition flex items-center gap-1.5 border border-amber-200/60 shadow-xs"
            title="Open Saved Meal Ideas Library"
          >
            <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
            <span>Saved Library ({savedMeals.length})</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'manual'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ✏️ Manual
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === 'ai'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-3 w-3 text-emerald-500" />
            AI Quick Log
          </button>
        </div>

        {formError && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-100 font-medium flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* AI Quick Log Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {aiError && (
              <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-100 font-medium">
                {aiError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">WHAT DID YOU EAT?</label>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder={
                  selectedImage
                    ? "Optional: Add notes (e.g. 'Ate half', 'Low carb wrap') or leave empty to analyze picture."
                    : "E.g., I ate 2 scrambled eggs, a slice of multigrain bread, and half an avocado."
                }
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
              />

              {/* Hidden native file input for camera & photo gallery */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* Annex a picture pill & attached badge */}
              <div className="mt-2 flex items-center flex-wrap gap-2">
                {!selectedImage ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition cursor-pointer border border-slate-200/80 shadow-2xs hover:border-slate-300 active:scale-98"
                  >
                    <Camera className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Annex a picture</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-medium shadow-2xs">
                    <img
                      src={selectedImage.dataUrl}
                      alt="Annexed meal"
                      className="w-5 h-5 rounded-full object-cover border border-emerald-300"
                    />
                    <span className="truncate max-w-[170px] text-[11px]">
                      {selectedImage.name} ({selectedImage.sizeKb}KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="text-emerald-700 hover:text-emerald-950 ml-0.5 p-0.5 rounded-full hover:bg-emerald-100 transition"
                      title="Remove picture"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleAiAnalyze}
              disabled={isAnalyzing || (!aiInput.trim() && !selectedImage)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg py-2 text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Analyzing details...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Estimate Nutrition with AI
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Gemini will estimate calories and macros from your picture, natural description, or both, then load them so you can review and log!
            </p>
          </div>
        )}

        {/* Manual Log Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {aiPromptUsed && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-amber-900 shadow-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1 text-amber-800 text-[11px] uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    Original AI Recipe Prompt:
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveAiPromptToLibrary}
                    disabled={isRecipeSaved}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isRecipeSaved
                        ? 'bg-amber-200/60 text-amber-900 border border-amber-300'
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    }`}
                  >
                    <Bookmark className={`h-3 w-3 ${isRecipeSaved ? 'fill-amber-800' : ''}`} />
                    {isRecipeSaved ? 'Saved with Recipe!' : 'Save to Library with Recipe'}
                  </button>
                </div>
                <p className="text-xs italic text-slate-700 bg-white/70 p-2 rounded-lg border border-amber-100/80 leading-relaxed">
                  "{aiPromptUsed}"
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">FOOD ITEM / DESCRIPTION</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g., Scrambled Eggs with Avocado"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">MEAL CATEGORY</label>
                <select
                  value={mealType}
                  onChange={e => setMealType(e.target.value as any)}
                  className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TIME</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => {
                    setTime(e.target.value);
                    setIsTimeManuallyEdited(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ENERGY (KCAL)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  placeholder="350"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-rose-600 mb-1 text-center">PROTEIN (G)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  placeholder="15"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-600 mb-1 text-center">CARBS (G)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  placeholder="20"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-amber-600 mb-1 text-center">FATS (G)</label>
                <input
                  type="number"
                  value={fats}
                  onChange={e => setFats(e.target.value)}
                  placeholder="10"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Log Wholesome Food
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
