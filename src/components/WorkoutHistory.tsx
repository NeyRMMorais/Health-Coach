import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Dumbbell, Award, Flame, Trash2, ChevronDown, ChevronUp, AlertTriangle, X } from 'lucide-react';
import { WorkoutLog } from '../types';

interface WorkoutHistoryProps {
  history: WorkoutLog[];
  onDeleteWorkout: (logId: string) => void;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ history, onDeleteWorkout }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteWorkout, setPendingDeleteWorkout] = useState<WorkoutLog | null>(null);

  const totalVolumeAllTime = history.reduce((acc, h) => acc + (h.totalVolumeKg || 0), 0);
  const totalMinutesAllTime = history.reduce((acc, h) => acc + (h.durationMinutes || 0), 0);

  // Sort strictly by actual realization date and start time (newest/latest first)
  const sortedHistory = [...history].sort((a, b) => {
    const dateTimeA = `${a.date || '1970-01-01'}T${a.startTime || '00:00'}`;
    const dateTimeB = `${b.date || '1970-01-01'}T${b.startTime || '00:00'}`;
    const timeA = new Date(dateTimeA).getTime();
    const timeB = new Date(dateTimeB).getTime();

    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }

    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;

    const createdA = (a.createdAt as any)?.seconds || 0;
    const createdB = (b.createdAt as any)?.seconds || 0;
    return createdB - createdA;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{history.length}</div>
            <div className="text-xs text-slate-400">Total Workouts</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{totalVolumeAllTime.toLocaleString()} kg</div>
            <div className="text-xs text-slate-400">Volume Lifted</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{Math.round(totalMinutesAllTime / 60)} hrs</div>
            <div className="text-xs text-slate-400">Time Training</div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Workout History</h3>

        {sortedHistory.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workout history logged yet.</p>
            <p className="text-xs text-slate-600 mt-1">Start a routine or empty workout to record your sessions.</p>
          </div>
        ) : (
          sortedHistory.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all shadow-lg"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-850/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{log.name}</h4>
                      <span className="text-xs text-slate-500">({log.exercises.length} Exercises)</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        {log.date} @ {log.startTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {log.durationMinutes} mins
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                        {log.totalVolumeKg.toLocaleString()} kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteWorkout(log);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Workout Log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-1.5 text-slate-400 bg-slate-800 rounded-lg">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-4">
                    {log.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                          <span>{ex.exerciseName}</span>
                          <span className="text-slate-500">{ex.targetMuscleGroup}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {ex.sets.map((s, sIdx) => (
                            <div
                              key={s.id}
                              className={`p-2 rounded-lg border ${
                                s.completed
                                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                                  : 'bg-slate-950 border-slate-900 text-slate-600 line-through'
                              }`}
                            >
                              <div className="text-[10px] text-slate-500">
                                Set {s.setNumber} {s.isWarmup && '(Warmup)'}
                              </div>
                              <div className="font-bold text-white">
                                {s.weight} kg × {s.reps} reps
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Custom In-App Styled Confirmation Modal */}
      <AnimatePresence>
        {pendingDeleteWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden text-white p-6 md:p-7 space-y-5"
            >
              {/* Header Gradient Ambient Glow */}
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-red-500/15 to-transparent pointer-events-none" />

              {/* Close Icon */}
              <button
                onClick={() => setPendingDeleteWorkout(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5 relative z-10">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Workout Log?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This action is permanent and cannot be reversed.
                  </p>
                </div>
              </div>

              {/* Session Summary Pill */}
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 relative z-10">
                <div className="font-bold text-sm text-white flex items-center justify-between">
                  <span>{pendingDeleteWorkout.name}</span>
                  <span className="text-xs text-slate-400 font-normal">{pendingDeleteWorkout.date}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {pendingDeleteWorkout.durationMinutes} mins
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                    {pendingDeleteWorkout.totalVolumeKg.toLocaleString()} kg
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">
                    {pendingDeleteWorkout.exercises.length} exercises
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 relative z-10">
                <button
                  type="button"
                  onClick={() => setPendingDeleteWorkout(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingDeleteWorkout) {
                      onDeleteWorkout(pendingDeleteWorkout.id);
                      setPendingDeleteWorkout(null);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/20 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Workout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
