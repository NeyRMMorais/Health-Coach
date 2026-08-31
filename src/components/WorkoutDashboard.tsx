import React, { useState, useEffect } from 'react';
import { Dumbbell, Play, Plus, BookOpen, History, Award, CheckCircle2, Activity } from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { WorkoutLog, WorkoutExercise, Exercise } from '../types';
import { ActiveWorkoutLogger, ACTIVE_WORKOUT_DRAFT_KEY, ActiveWorkoutDraft } from './ActiveWorkoutLogger';
import { RoutineManager } from './RoutineManager';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { WorkoutHistory } from './WorkoutHistory';
import { BodyHeatmapView } from './BodyHeatmapView';
import { WorkoutCompletionModal } from './WorkoutCompletionModal';
import { resolveStartingSets } from '../utils/workoutProgression';

interface WorkoutDashboardProps {
  user?: any;
}

export const WorkoutDashboard: React.FC<WorkoutDashboardProps> = ({ user: propUser }) => {
  const [recapLog, setRecapLog] = useState<WorkoutLog | null>(null);
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

  // Firestore Real-Time Sync & Guest Migration
  useEffect(() => {
    const currentUser = propUser || auth.currentUser;
    if (!currentUser) return;

    // Migrate guest workout logs from localStorage to Firestore
    const guestLogsStr = localStorage.getItem('workout_history');
    if (guestLogsStr) {
      try {
        const guestLogs: WorkoutLog[] = JSON.parse(guestLogsStr);
        if (guestLogs.length > 0) {
          guestLogs.forEach(async (log) => {
            const logId = log.id.startsWith('log-') ? log.id : `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const ref = doc(db, `users/${currentUser.uid}/workoutLogs`, logId);
            await setDoc(
              ref,
              {
                ...log,
                id: logId,
                userId: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          });
          localStorage.removeItem('workout_history');
        }
      } catch (e) {
        console.error('Failed to migrate guest workout logs:', e);
      }
    }

    // Subscribe to user's workoutLogs collection
    const logsPath = `users/${currentUser.uid}/workoutLogs`;
    const unsubscribe = onSnapshot(
      collection(db, logsPath),
      (snapshot) => {
        const loaded: WorkoutLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId || currentUser.uid,
            name: data.name || 'Workout',
            date: data.date || new Date().toISOString().split('T')[0],
            startTime: data.startTime || '00:00',
            endTime: data.endTime,
            durationMinutes: data.durationMinutes || 0,
            exercises: Array.isArray(data.exercises) ? data.exercises : [],
            totalVolumeKg: data.totalVolumeKg || 0,
            activeCaloriesBurned: data.activeCaloriesBurned,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as WorkoutLog);
        });

        // Sort by actual realization date and time (newest first)
        loaded.sort((a, b) => {
          const dateTimeA = `${a.date || '1970-01-01'}T${a.startTime || '00:00'}`;
          const dateTimeB = `${b.date || '1970-01-01'}T${b.startTime || '00:00'}`;
          const timeA = new Date(dateTimeA).getTime();
          const timeB = new Date(dateTimeB).getTime();

          if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
            return timeB - timeA;
          }

          const dateComp = (b.date || '').localeCompare(a.date || '');
          if (dateComp !== 0) return dateComp;

          const createdA = a.createdAt?.seconds || 0;
          const createdB = b.createdAt?.seconds || 0;
          return createdB - createdA;
        });

        setHistory(loaded);
      },
      (error) => {
        console.error('Firestore workoutLogs listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [propUser]);

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

  const handleFinishWorkout = async (log: WorkoutLog) => {
    const currentUser = propUser || auth.currentUser;
    const finalUserId = currentUser ? currentUser.uid : 'guest';
    const logId = log.id && !log.id.startsWith('draft_') ? log.id : `log-${Date.now()}`;
    const finalizedLog: WorkoutLog = {
      ...log,
      id: logId,
      userId: finalUserId,
    };

    const updated = [finalizedLog, ...history.filter((h) => h.id !== logId)];
    saveHistory(updated);

    if (currentUser) {
      try {
        const ref = doc(db, `users/${currentUser.uid}/workoutLogs`, logId);
        await setDoc(ref, {
          ...finalizedLog,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to save workout log to Firestore:', err);
      }
    }

    try {
      localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear draft on finish', e);
    }
    setActiveSession(null);
    setRecapLog(finalizedLog);
  };

  const handleCancelWorkout = () => {
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear draft on cancel', e);
    }
    setActiveSession(null);
  };

  const handleDeleteWorkout = async (logId: string) => {
    const updated = history.filter((h) => h.id !== logId);
    saveHistory(updated);

    const currentUser = propUser || auth.currentUser;
    if (currentUser) {
      try {
        await deleteDoc(doc(db, `users/${currentUser.uid}/workoutLogs`, logId));
      } catch (err) {
        console.error('Failed to delete workout log from Firestore:', err);
      }
    }
  };

  // If an active session is in progress, show Active Workout Logger
  if (activeSession) {
    return (
      <ActiveWorkoutLogger
        initialWorkoutName={activeSession.name}
        initialExercises={activeSession.exercises}
        workoutHistory={history}
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
        <RoutineManager
          onStartWorkoutFromRoutine={handleStartWorkoutFromRoutine}
          workoutHistory={history}
        />
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
          // If no active session, start a workout with this exercise using progression history
          const sets = resolveStartingSets(
            exercise.id,
            exercise.name,
            exercise.category,
            exercise.targetMuscleGroup,
            3,
            10,
            `${exercise.name} Session`,
            history
          );

          setActiveSession({
            name: `${exercise.name} Session`,
            exercises: [
              {
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                targetMuscleGroup: exercise.targetMuscleGroup,
                category: exercise.category,
                sets,
              },
            ],
          });
        }}
      />

      {/* Post-Workout Closing Celebration & Stats Recap Modal */}
      <WorkoutCompletionModal
        isOpen={!!recapLog}
        workoutLog={recapLog}
        onClose={() => setRecapLog(null)}
        onViewHistory={() => {
          setRecapLog(null);
          handleSelectTab('history');
        }}
      />
    </div>
  );
};
