import React, { useState } from 'react';
import { Calendar, Clock, Dumbbell, Award, Flame, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutLog } from '../types';

interface WorkoutHistoryProps {
  history: WorkoutLog[];
  onDeleteWorkout: (logId: string) => void;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ history, onDeleteWorkout }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalVolumeAllTime = history.reduce((acc, h) => acc + (h.totalVolumeKg || 0), 0);
  const totalMinutesAllTime = history.reduce((acc, h) => acc + (h.durationMinutes || 0), 0);

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

        {history.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workout history logged yet.</p>
            <p className="text-xs text-slate-600 mt-1">Start a routine or empty workout to record your sessions.</p>
          </div>
        ) : (
          history.map((log) => {
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
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${log.name}" (${log.date}) from your workout history? This action cannot be undone.`
                          )
                        ) {
                          onDeleteWorkout(log.id);
                        }
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
    </div>
  );
};
