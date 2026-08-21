import React, { useState, useEffect } from 'react';
import { X, BookOpen, FileText, History, Dumbbell, Target, Layers, Calendar, CheckCircle2, Save, Clock } from 'lucide-react';
import { WorkoutLog, WorkoutExercise } from '../types';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    exerciseId: string;
    exerciseName: string;
    targetMuscleGroup?: string;
    category?: string;
    description?: string;
    notes?: string;
    restSeconds?: number;
  } | null;
  workoutHistory?: WorkoutLog[];
  restSeconds?: number;
  onUpdateRestSeconds?: (seconds: number) => void;
  onSaveNotes?: (notes: string) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  isOpen,
  onClose,
  exercise,
  workoutHistory = [],
  restSeconds,
  onUpdateRestSeconds,
  onSaveNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'notes' | 'history'>('instructions');
  const [noteContent, setNoteContent] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load persistent note for this exercise whenever exercise changes or modal opens
  useEffect(() => {
    if (exercise && isOpen) {
      const storageKey = `exercise_note_${exercise.exerciseId || exercise.exerciseName.toLowerCase().replace(/\s+/g, '_')}`;
      const saved = localStorage.getItem(storageKey);
      setNoteContent(exercise.notes || saved || '');
      setSavedSuccess(false);
    }
  }, [exercise, isOpen]);

  if (!isOpen || !exercise) return null;

  // Find full exercise catalog definition if description is missing
  const matchedCatalogExercise = DEFAULT_EXERCISES.find(
    (e) => e.id === exercise.exerciseId || e.name.toLowerCase() === exercise.exerciseName.toLowerCase()
  );

  const muscleGroup = exercise.targetMuscleGroup || matchedCatalogExercise?.targetMuscleGroup || 'Full Body';
  const category = exercise.category || matchedCatalogExercise?.category || 'Strength';
  const description = exercise.description || matchedCatalogExercise?.description || 'Focus on controlled tempo and proper form through full range of motion.';
  const currentRest = restSeconds ?? exercise.restSeconds ?? 90;

  // Filter history logs for this specific exercise
  const allLogs: WorkoutLog[] = workoutHistory.length > 0 ? workoutHistory : (() => {
    try {
      const saved = localStorage.getItem('workout_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const exerciseHistory = allLogs
    .map((log) => {
      const matchedEx = log.exercises?.find(
        (e) => e.exerciseId === exercise.exerciseId || e.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase()
      );
      if (!matchedEx) return null;
      return {
        logId: log.id,
        workoutName: log.name,
        date: log.date,
        sets: matchedEx.sets || [],
      };
    })
    .filter((item): item is { logId: string; workoutName: string; date: string; sets: any[] } => item !== null);

  const handleSaveNote = () => {
    const storageKey = `exercise_note_${exercise.exerciseId || exercise.exerciseName.toLowerCase().replace(/\s+/g, '_')}`;
    localStorage.setItem(storageKey, noteContent);
    if (onSaveNotes) {
      onSaveNotes(noteContent);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{exercise.exerciseName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {muscleGroup}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                    {category}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rest Interval Dropdown (Below tags, above tabs) */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Target Rest Interval:</span>
            </div>
            <select
              value={currentRest}
              onChange={(e) => onUpdateRestSeconds && onUpdateRestSeconds(parseInt(e.target.value) || 90)}
              className="bg-slate-950 text-emerald-400 font-bold border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
            >
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>60s (1m)</option>
              <option value={90}>90s (1.5m)</option>
              <option value={120}>120s (2m)</option>
              <option value={150}>150s (2.5m)</option>
              <option value={180}>180s (3m)</option>
              <option value={240}>240s (4m)</option>
              <option value={300}>300s (5m)</option>
            </select>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Instructions
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'notes'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Notes
            {noteContent.trim() && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            History ({exerciseHistory.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  Primary Muscle Focus
                </h4>
                <p className="text-slate-300 font-medium">
                  {muscleGroup} ({category})
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Execution & Technique
                </h4>
                <p className="text-slate-300 whitespace-pre-line">
                  {description}
                </p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 space-y-2 text-xs text-emerald-300">
                <span className="font-bold text-emerald-400">💡 Coach's Pro Tip:</span>
                <p className="text-slate-300">
                  Ensure full range of motion on each repetition. Maintain a controlled 2-3 second eccentric (lowering) phase to maximize muscle fiber recruitment and tendon health.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Personal Exercise Notes & Setup Settings
                </label>
                <p className="text-xs text-slate-500">
                  Save your specific equipment settings (e.g. seat pin #4, bench angle 30°, wide grip, cues) to automatically recall them in future workouts.
                </p>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="e.g. Seat pin: #4 | Grip: Overhand shoulder-width | Cue: Drive elbows down into back pockets..."
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none font-sans"
              />

              <div className="flex items-center justify-between">
                {savedSuccess ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" /> Note saved successfully!
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Saved notes are remembered whenever you select this exercise.
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Note
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {exerciseHistory.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 border-dashed rounded-2xl p-8 text-center space-y-2">
                  <History className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No workout history yet for this exercise</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete and save a workout session with {exercise.exerciseName} to view your progressive overload timeline here.
                  </p>
                </div>
              ) : (
                exerciseHistory.map((item, idx) => (
                  <div key={`${item.logId}-${idx}`} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-white">{item.date}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{item.workoutName}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        {item.sets.length} sets logged
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {item.sets.map((s: any, sIdx: number) => {
                        const est1RM = s.weight && s.reps ? Math.round(s.weight * (1 + s.reps / 30)) : null;
                        return (
                          <div
                            key={sIdx}
                            className="bg-slate-900 border border-slate-800/60 rounded-xl p-2.5 text-center space-y-1"
                          >
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Set {s.setNumber || sIdx + 1}
                            </span>
                            <div className="text-sm font-black text-white">
                              {s.weight} kg <span className="text-xs font-normal text-slate-400">× {s.reps}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                              {s.rpe && <span className="text-emerald-400 font-bold">@{s.rpe}</span>}
                              {est1RM && <span>(1RM: {est1RM}k)</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
