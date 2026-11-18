import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Dumbbell, Clock, Flame, Award, CheckCircle2, X, Sparkles, ChevronRight, Activity, Save, Check } from 'lucide-react';
import { WorkoutLog } from '../types';
import { updateRoutineTemplateFromSession } from '../utils/routineUpdater';

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  workoutLog: WorkoutLog | null;
  onClose: () => void;
  onViewHistory?: () => void;
}

export const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  isOpen,
  workoutLog,
  onClose,
  onViewHistory,
}) => {
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isTemplateUpdated, setIsTemplateUpdated] = useState(false);

  if (!isOpen || !workoutLog) return null;

  const isRoutineWorkout = Boolean(workoutLog.name && workoutLog.name.includes(' • '));

  const handleUpdateTemplate = async () => {
    if (!workoutLog || isTemplateUpdated || isUpdatingTemplate) return;
    setIsUpdatingTemplate(true);
    try {
      const res = await updateRoutineTemplateFromSession(workoutLog.name, workoutLog.exercises);
      if (res.success) {
        setIsTemplateUpdated(true);
      }
    } catch (e) {
      console.error('Failed to update routine from completion modal', e);
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  const totalSets = workoutLog.exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const muscleGroups = Array.from(
    new Set(workoutLog.exercises.map((e) => e.targetMuscleGroup).filter(Boolean))
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.45 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-6"
        >
          {/* Glowing Ambient Backdrop Header */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8 space-y-6 relative z-10">
            {/* Header Celebration Icon & Title */}
            <div className="text-center space-y-3 pt-2">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
              >
                <Trophy className="w-10 h-10 drop-shadow-md" />
              </motion.div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mb-1.5">
                  Workout Crushed!
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white">{workoutLog.name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Session recorded and synced to your recovery profile.
                </p>
              </div>
            </div>

            {/* Core Stats Bento Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Volume */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Volume</span>
                <span className="text-base md:text-lg font-black text-emerald-400">
                  {workoutLog.totalVolumeKg.toLocaleString()}
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">kg</span>
                </span>
              </div>

              {/* Duration */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                <span className="text-base md:text-lg font-black text-white">
                  {workoutLog.durationMinutes || 1}
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">min</span>
                </span>
              </div>

              {/* Completed Sets */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center space-y-1">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Sets Done</span>
                <span className="text-base md:text-lg font-black text-white">
                  {totalSets}
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">sets</span>
                </span>
              </div>
            </div>

            {/* Muscles Worked */}
            {muscleGroups.length > 0 && (
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Muscles Targeted:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {muscleGroups.map((group) => (
                    <span
                      key={group}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise Breakdown List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Session Performance:
              </span>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {workoutLog.exercises.map((ex, idx) => {
                  const completedSets = ex.sets.filter((s) => s.completed);
                  const maxWeight = completedSets.reduce((max, s) => Math.max(max, s.weight || 0), 0);
                  const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{ex.exerciseName}</div>
                        <span className="text-[10px] text-slate-400">
                          {completedSets.length} sets completed • {totalReps} total reps
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">
                          Top: {maxWeight} kg
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Update Routine Template Section (if session originated from a routine) */}
            {isRoutineWorkout && (
              <div className="p-4 bg-slate-950/70 border border-emerald-500/30 rounded-2xl space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">
                      Update Routine Template?
                    </span>
                  </div>
                  {isTemplateUpdated && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Updated!
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Save this session's exercises ({workoutLog.exercises.length} movements) permanently to{' '}
                  <span className="text-emerald-300 font-semibold">{workoutLog.name}</span> for future sessions.
                </p>

                <button
                  type="button"
                  onClick={handleUpdateTemplate}
                  disabled={isTemplateUpdated || isUpdatingTemplate}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isTemplateUpdated
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isUpdatingTemplate
                      ? 'Saving Template...'
                      : isTemplateUpdated
                      ? 'Template Updated Successfully ✨'
                      : 'Update Routine Day Template'}
                  </span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {onViewHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewHistory();
                  }}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
                >
                  View in History
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Back to Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
