import React, { useState, useEffect } from 'react';
import { Dumbbell, Play, Plus, BookOpen, History, Award, CheckCircle2, Activity } from 'lucide-react';
import { WorkoutLog, WorkoutExercise, Exercise } from '../types';
import { ActiveWorkoutLogger, ACTIVE_WORKOUT_DRAFT_KEY, ActiveWorkoutDraft } from './ActiveWorkoutLogger';
import { RoutineManager } from './RoutineManager';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { WorkoutHistory } from './WorkoutHistory';
import { BodyHeatmapView } from './BodyHeatmapView';

export const WorkoutDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routines' | 'heatmap' | 'history' | 'library'>(() => {
    try {
      const savedTab = localStorage.getItem('healthcoach_workout_dashboard_tab');
      if (savedTab && ['routines', 'heatmap', 'history', 'library'].includes(savedTab)) {
        return savedTab as any;
      }
    } catch (e) {}
    return 'routines';
  });

  const handleSelectTab = (tab: 'routines' | 'heatmap' | 'history' | 'library') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('healthcoach_workout_dashboard_tab', tab);
    } catch (e) {}
  };
  const [activeSession, setActiveSession] = useState<{
    name: string;
    exercises: WorkoutExercise[];
  } | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_WORKOUT_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ActiveWorkoutDraft;
        if (parsed && (parsed.exercises || parsed.workoutName)) {
          return {
            name: parsed.workoutName || 'Custom Workout',
            exercises: parsed.exercises || [],
          };
        }
      }
    } catch (e) {
      console.error('Failed to restore active workout session draft', e);
    }
    return null;
  });

  const [history, setHistory] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem('workout_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const saveHistory = (newHistory: WorkoutLog[]) => {
    setHistory(newHistory);
    localStorage.setItem('workout_history', JSON.stringify(newHistory));
  };

  const handleStartCustomWorkout = () => {
    setActiveSession({
      name: 'Custom Workout',
      exercises: [],
    });
  };

  const handleStartWorkoutFromRoutine = (routineName: string, exercises: WorkoutExercise[]) => {
    setActiveSession({
      name: routineName,
      exercises,
    });
  };

  const handleFinishWorkout = (log: WorkoutLog) => {
    const updated = [log, ...history];
    saveHistory(updated);
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear draft on finish', e);
    }
    setActiveSession(null);
    setSuccessToast(`🎉 ${log.name} logged successfully! (${log.totalVolumeKg.toLocaleString()} kg lifted)`);

    setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
  };

  const handleCancelWorkout = () => {
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear draft on cancel', e);
    }
    setActiveSession(null);
  };

  const handleDeleteWorkout = (logId: string) => {
    const updated = history.filter((h) => h.id !== logId);
    saveHistory(updated);
  };

  // If an active session is in progress, show Active Workout Logger
  if (activeSession) {
    return (
      <ActiveWorkoutLogger
        initialWorkoutName={activeSession.name}
        initialExercises={activeSession.exercises}
        onFinishWorkout={handleFinishWorkout}
        onCancel={handleCancelWorkout}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Strength Workout & Gym Tracker
          </h1>
          <p className="text-sm text-slate-400">
            Log your workouts set-by-set, track progressive overload volume, and calculate your 1RM metrics in real time.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleSelectTab('routines')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'routines'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Routines & Schedules
        </button>

        <button
          onClick={() => handleSelectTab('heatmap')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'heatmap'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Muscle Recovery Heatmap
        </button>

        <button
          onClick={() => handleSelectTab('history')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Workout History ({history.length})
        </button>

        <button
          onClick={() => setIsLibraryOpen(true)}
          className="pb-3 flex items-center gap-2 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4" />
          Exercise Library
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'routines' && (
        <RoutineManager onStartWorkoutFromRoutine={handleStartWorkoutFromRoutine} />
      )}

      {activeTab === 'heatmap' && (
        <BodyHeatmapView workoutLogs={history} />
      )}

      {activeTab === 'history' && (
        <WorkoutHistory history={history} onDeleteWorkout={handleDeleteWorkout} />
      )}

      {/* Exercise Library Modal (Triggered from nav tab or routine creator) */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectExercise={(exercise) => {
          // If no active session, start a workout with this exercise
          setActiveSession({
            name: `${exercise.name} Session`,
            exercises: [
              {
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                targetMuscleGroup: exercise.targetMuscleGroup,
                category: exercise.category,
                sets: [
                  {
                    id: `set-${Date.now()}-1`,
                    setNumber: 1,
                    weight: 20,
                    reps: 10,
                    rpe: 8,
                    completed: false,
                    isWarmup: false,
                  },
                ],
              },
            ],
          });
        }}
      />
    </div>
  );
};
