import { WorkoutRoutine, WorkoutExercise } from '../types';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface RoutineUpdateResult {
  success: boolean;
  routineTitle?: string;
  dayName?: string;
  error?: string;
}

/**
 * Checks if the current workout exercise list differs from the initial routine exercises
 * (e.g. exercises were added, removed, or reordered).
 */
export function detectRoutineModifications(
  initialExercises: WorkoutExercise[] = [],
  currentExercises: WorkoutExercise[] = []
): boolean {
  if (initialExercises.length !== currentExercises.length) return true;

  for (let i = 0; i < currentExercises.length; i++) {
    const curr = currentExercises[i];
    const init = initialExercises[i];
    if (!init) return true;
    if (curr.exerciseId !== init.exerciseId || curr.exerciseName !== init.exerciseName) {
      return true;
    }
  }

  return false;
}

/**
 * Updates a routine day template permanently based on the current workout session.
 * Handles both custom user routines and defaults (promoting a default routine to custom if needed),
 * updating localStorage and syncing to Cloud Firestore.
 */
export async function updateRoutineTemplateFromSession(
  workoutName: string,
  exercises: WorkoutExercise[]
): Promise<RoutineUpdateResult> {
  try {
    const parts = workoutName.split(' • ');
    if (parts.length < 2) {
      return { success: false, error: 'Workout was not started from a routine day template' };
    }
    const rTitle = parts[0].trim();
    const dName = parts[1].trim();

    // 1. Fetch custom routines from localStorage
    const savedCustom = localStorage.getItem('custom_routines');
    let customRoutines: WorkoutRoutine[] = savedCustom ? JSON.parse(savedCustom) : [];

    let routineIndex = customRoutines.findIndex(
      (r) => r.title.toLowerCase() === rTitle.toLowerCase()
    );

    let targetRoutine: WorkoutRoutine;

    if (routineIndex >= 0) {
      targetRoutine = customRoutines[routineIndex];
    } else {
      // Find in DEFAULT_ROUTINES
      const defaultMatch = DEFAULT_ROUTINES.find(
        (r) => r.title.toLowerCase() === rTitle.toLowerCase()
      );
      if (!defaultMatch) {
        return { success: false, error: `Could not find routine "${rTitle}" in saved templates` };
      }
      // Clone default routine to create a customized version
      targetRoutine = JSON.parse(JSON.stringify(defaultMatch));
      targetRoutine.id = `custom-${targetRoutine.id}-${Date.now()}`;
      customRoutines.push(targetRoutine);
      routineIndex = customRoutines.length - 1;
    }

    // 2. Find and update the matching day in this routine
    const updatedDays = (targetRoutine.days || []).map((d) => {
      if (d.dayName.toLowerCase() === dName.toLowerCase()) {
        return {
          ...d,
          exercises: exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            targetMuscleGroup: ex.targetMuscleGroup,
            category: ex.category,
            targetSets: ex.sets.length || 3,
            targetReps: ex.sets[0]?.reps || 10,
            targetRestSeconds: ex.restSeconds || 90,
          })),
        };
      }
      return d;
    });

    targetRoutine.days = updatedDays;
    targetRoutine.updatedAt = new Date().toISOString();
    customRoutines[routineIndex] = targetRoutine;

    // 3. Save to localStorage
    localStorage.setItem('custom_routines', JSON.stringify(customRoutines));

    // 4. Sync to Firestore if user is authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      const routineRef = doc(db, `users/${currentUser.uid}/workoutRoutines`, targetRoutine.id);
      await setDoc(
        routineRef,
        {
          ...targetRoutine,
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { success: true, routineTitle: targetRoutine.title, dayName: dName };
  } catch (err: any) {
    console.error('Failed to update routine template from session:', err);
    return { success: false, error: err.message || String(err) };
  }
}
