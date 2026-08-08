import React, { useState } from 'react';
import { Sparkles, Copy, Check, X, ArrowRight, Dumbbell, Calendar, Layers, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { WorkoutRoutine, RoutineDay } from '../types';

interface AiWorkoutArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: WorkoutRoutine) => void;
}

export const AiWorkoutArchitectModal: React.FC<AiWorkoutArchitectModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
}) => {
  const [rawText, setRawText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed Result State
  const [parsedTitle, setParsedTitle] = useState('');
  const [parsedDescription, setParsedDescription] = useState('');
  const [parsedDays, setParsedDays] = useState<RoutineDay[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const sampleGeminiPrompt = `Create a detailed 4-day workout training split (Push / Pull / Legs / Upper) tailored for hyper-trophy. For each day, include 4-5 exercises specifying sets, reps, and target muscle groups. Format it clearly like:
Day 1: Push Day - Bench Press 4x8, Overhead Dumbbell Press 3x10, Incline Flyes 3x12, Tricep Pushdowns 3x12.
Day 2: Pull Day - Barbell Rows 4x8, Lat Pulldowns 3x10, Face Pulls 3x12, Bicep Curls 3x10.
Day 3: Rest Day.
Day 4: Legs & Core - Barbell Squats 4x8, Romanian Deadlifts 3x10, Leg Extension 3x12, Hanging Leg Raises 3x15.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(sampleGeminiPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleArchitectRoutine = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Please paste routine text from Gemini Web, ChatGPT, or your notes.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/parse-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse routine. Please check your network or try again.');
      }

      const data = await response.json();

      if (!data.days || data.days.length === 0) {
        throw new Error('Could not identify valid workout days or exercises. Please format like "Day 1: Bench Press 3x10".');
      }

      setParsedTitle(data.title || 'Custom AI Routine');
      setParsedDescription(data.description || 'Imported workout schedule generated with AI.');
      setParsedDays(data.days || []);
      setStep('preview');
    } catch (err: any) {
      console.error('Error parsing routine:', err);
      setErrorMessage(err.message || 'An error occurred while parsing your routine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const finalRoutine: WorkoutRoutine = {
      id: `routine_ai_${Date.now()}`,
      userId: 'user_current',
      title: parsedTitle.trim() || 'AI Workout Routine',
      description: parsedDescription.trim() || 'AI Imported Routine',
      days: parsedDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRoutine(finalRoutine);
    onClose();
    // Reset state
    setRawText('');
    setStep('input');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
                AI Routine Import
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">AI Workout Architect</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {step === 'input' ? (
            <div className="space-y-5">
              
              {/* Informational Prompt Banner */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      1-Click Gemini Web Prompt Generator
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Need a new schedule? Copy our optimized prompt, ask Gemini Web or ChatGPT to generate your routine, then paste the text below!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isCopied
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Text Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Paste Raw Workout Routine Text</span>
                  <span className="text-[10px] text-slate-500 font-normal">Supports markdown, lists, & freeform text</span>
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Paste text here, e.g.:\nDay 1: Push Day\n- Bench Press 4 sets x 8 reps\n- Overhead Dumbbell Press 3 sets x 10 reps\n- Incline Dumbbell Flyes 3 sets x 12 reps\n\nDay 2: Pull Day\n- Barbell Rows 4x8\n- Lat Pulldowns 3x10`}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500 transition-all font-mono leading-relaxed resize-none"
                />
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Action */}
              <button
                type="button"
                disabled={isLoading || !rawText.trim()}
                onClick={handleArchitectRoutine}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Architecting Routine with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Architect Routine with AI</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Title & Description Edit Fields */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Routine Title</label>
                  <input
                    type="text"
                    value={parsedTitle}
                    onChange={(e) => setParsedTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-extrabold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={parsedDescription}
                    onChange={(e) => setParsedDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Parsed Day-by-Day Schedule List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  <span>Parsed Training Split ({parsedDays.length} Days)</span>
                  <span className="text-[10px] text-cyan-400 font-semibold">Review & Edit</span>
                </h4>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {parsedDays.map((day, idx) => (
                    <div key={day.id || idx} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-xs text-white">{day.dayName}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            day.type === 'rest'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {day.type}
                        </span>
                      </div>

                      {day.type === 'rest' ? (
                        <p className="text-xs text-slate-500 italic">Scheduled recovery day. Rest & refuel.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {day.exercises?.map((ex, exIdx) => (
                            <div key={ex.exerciseId || exIdx} className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Dumbbell className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <div>
                                  <span className="font-bold text-xs text-slate-200">{ex.exerciseName}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="text-cyan-400/90 font-medium">{ex.targetMuscleGroup}</span>
                                    <span>•</span>
                                    <span>{ex.category}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-xs font-black">
                                  {ex.targetSets} sets × {ex.targetReps} reps
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  ← Edit Text
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to My Routines</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
