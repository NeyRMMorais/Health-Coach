import { ExerciseSet, ExerciseCategory, TargetMuscleGroup, WorkoutLog } from '../types';

/**
 * Resolves the starting sets for an exercise when launching a workout or adding an exercise.
 *
 * 2-Tier Hierarchy:
 * 1. Tier 1 (Context-Specific History): Matches the routine day name (e.g. "Upper Body - Day 1") in workoutHistory.
 *    Replicates the exact set-by-set breakdown (weights, reps, and target RPE) from the latest completed session of this routine day.
 * 2. Tier 2 (Global Cross-Routine Fallback): Matches exerciseId/name across ANY past workout in workoutHistory.
 *    Seeds with the most recent performance of this exercise.
 * 3. Tier 3 (Category Default): Sensible category starting weights (0kg for bodyweight/stretching, 12kg for dumbbell, 15kg for cable/machine, 20kg for barbell).
 */
export const resolveStartingSets = (
  exerciseId: string,
  exerciseName: string,
  category: ExerciseCategory,
  targetMuscleGroup: TargetMuscleGroup,
  targetSetsCount: number = 3,
  targetRepsFromTemplate: number = 10,
  workoutName?: string,
  workoutHistory?: WorkoutLog[]
): ExerciseSet[] => {
  const normExName = (exerciseName || '').toLowerCase().trim();
  const normExId = (exerciseId || '').trim();

  // Tier 1: Match within the same routine / workout day
  if (workoutName && workoutHistory && workoutHistory.length > 0) {
    const normWorkoutName = workoutName.toLowerCase().trim();

    // Look for the most recent completed log matching this workout / routine day
    const matchingWorkout = workoutHistory.find((log) => {
      if (!log.exercises || log.exercises.length === 0) return false;
      const logName = (log.name || '').toLowerCase().trim();
      // Match exact workout name or prefix (e.g. "Upper Body - Day 1")
      const matchesName =
        logName === normWorkoutName ||
        logName.startsWith(normWorkoutName) ||
        normWorkoutName.startsWith(logName);
      if (!matchesName) return false;

      return log.exercises.some((e) => {
        const eId = (e.exerciseId || '').trim();
        const eName = (e.exerciseName || '').toLowerCase().trim();
        return (normExId && eId === normExId) || (normExName && eName === normExName);
      });
    });

    if (matchingWorkout) {
      const exInLog = matchingWorkout.exercises.find((e) => {
        const eId = (e.exerciseId || '').trim();
        const eName = (e.exerciseName || '').toLowerCase().trim();
        return (normExId && eId === normExId) || (normExName && eName === normExName);
      });

      if (exInLog && exInLog.sets && exInLog.sets.length > 0) {
        const completedSets = exInLog.sets.filter((s) => s.completed);
        const historySets = completedSets.length > 0 ? completedSets : exInLog.sets;

        const effectiveCount = Math.max(targetSetsCount, historySets.length);

        return Array.from({ length: effectiveCount }).map((_, idx) => {
          const histSet = historySets[idx] || historySets[historySets.length - 1];
          return {
            id: `set-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            setNumber: idx + 1,
            weight: histSet?.weight !== undefined && histSet?.weight !== null ? histSet.weight : 20,
            reps: histSet?.reps !== undefined && histSet?.reps !== null ? histSet.reps : targetRepsFromTemplate,
            rpe: histSet?.rpe || 8,
            completed: false,
          };
        });
      }
    }
  }

  // Tier 2: Search across ANY past workout (Global fallback)
  if (workoutHistory && workoutHistory.length > 0) {
    for (const log of workoutHistory) {
      if (!log.exercises || log.exercises.length === 0) continue;

      const exInLog = log.exercises.find((e) => {
        const eId = (e.exerciseId || '').trim();
        const eName = (e.exerciseName || '').toLowerCase().trim();
        return (normExId && eId === normExId) || (normExName && eName === normExName);
      });

      if (exInLog && exInLog.sets && exInLog.sets.length > 0) {
        const completedSets = exInLog.sets.filter((s) => s.completed);
        const historySets = completedSets.length > 0 ? completedSets : exInLog.sets;

        return Array.from({ length: targetSetsCount }).map((_, idx) => {
          const histSet = historySets[idx] || historySets[historySets.length - 1];
          return {
            id: `set-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            setNumber: idx + 1,
            weight: histSet?.weight !== undefined && histSet?.weight !== null ? histSet.weight : 20,
            reps: histSet?.reps !== undefined && histSet?.reps !== null ? histSet.reps : targetRepsFromTemplate,
            rpe: histSet?.rpe || 8,
            completed: false,
          };
        });
      }
    }
  }

  // Tier 3: Category default starting weights
  const isStretching = category === 'Stretching';
  const isBodyweight = category === 'Bodyweight';

  let defaultWeight = 20;
  if (isStretching || isBodyweight) {
    defaultWeight = 0;
  } else if (category === 'Dumbbell') {
    defaultWeight = 12;
  } else if (category === 'Cable' || category === 'Machine') {
    defaultWeight = 15;
  }

  return Array.from({ length: targetSetsCount }).map((_, idx) => ({
    id: `set-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    setNumber: idx + 1,
    weight: defaultWeight,
    reps: targetRepsFromTemplate || 10,
    rpe: 8,
    completed: false,
  }));
};
