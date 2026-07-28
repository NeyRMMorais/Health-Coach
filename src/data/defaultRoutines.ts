import { WorkoutRoutine } from '../types';

export const DEFAULT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine-push-day',
    userId: 'default',
    title: 'Push Day (Chest, Shoulders & Triceps)',
    description: 'Hypertrophy and strength push session focused on pressing movements.',
    targetMuscleGroup: 'Chest',
    exercises: [
      { exerciseId: 'bench-press-barbell', exerciseName: 'Barbell Bench Press', targetMuscleGroup: 'Chest', category: 'Barbell', targetSets: 4, targetReps: 8 },
      { exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline Dumbbell Press', targetMuscleGroup: 'Chest', category: 'Dumbbell', targetSets: 3, targetReps: 10 },
      { exerciseId: 'seated-dumbbell-shoulder-press', exerciseName: 'Seated Dumbbell Shoulder Press', targetMuscleGroup: 'Shoulders', category: 'Dumbbell', targetSets: 3, targetReps: 10 },
      { exerciseId: 'dumbbell-lateral-raise', exerciseName: 'Dumbbell Lateral Raise', targetMuscleGroup: 'Shoulders', category: 'Dumbbell', targetSets: 4, targetReps: 12 },
      { exerciseId: 'tricep-rope-pushdown', exerciseName: 'Tricep Rope Pushdown', targetMuscleGroup: 'Arms', category: 'Cable', targetSets: 3, targetReps: 12 },
    ]
  },
  {
    id: 'routine-pull-day',
    userId: 'default',
    title: 'Pull Day (Back, Rear Delts & Biceps)',
    description: 'Complete back width, thickness, and arm volume workout.',
    targetMuscleGroup: 'Back',
    exercises: [
      { exerciseId: 'lat-pulldown', exerciseName: 'Lat Pulldown', targetMuscleGroup: 'Back', category: 'Cable', targetSets: 4, targetReps: 10 },
      { exerciseId: 'bent-over-row-barbell', exerciseName: 'Barbell Bent Over Row', targetMuscleGroup: 'Back', category: 'Barbell', targetSets: 4, targetReps: 8 },
      { exerciseId: 'face-pull', exerciseName: 'Cable Face Pull', targetMuscleGroup: 'Shoulders', category: 'Cable', targetSets: 3, targetReps: 15 },
      { exerciseId: 'barbell-bicep-curl', exerciseName: 'Barbell Bicep Curl', targetMuscleGroup: 'Arms', category: 'Barbell', targetSets: 3, targetReps: 10 },
      { exerciseId: 'dumbbell-hammer-curl', exerciseName: 'Dumbbell Hammer Curl', targetMuscleGroup: 'Arms', category: 'Dumbbell', targetSets: 3, targetReps: 12 },
    ]
  },
  {
    id: 'routine-leg-day',
    userId: 'default',
    title: 'Leg Day (Quads, Hamstrings & Calves)',
    description: 'Comprehensive lower body volume session.',
    targetMuscleGroup: 'Legs',
    exercises: [
      { exerciseId: 'barbell-squat', exerciseName: 'Barbell Back Squat', targetMuscleGroup: 'Legs', category: 'Barbell', targetSets: 4, targetReps: 8 },
      { exerciseId: 'romanian-deadlift', exerciseName: 'Romanian Deadlift (RDL)', targetMuscleGroup: 'Legs', category: 'Barbell', targetSets: 3, targetReps: 10 },
      { exerciseId: 'leg-press', exerciseName: 'Leg Press', targetMuscleGroup: 'Legs', category: 'Machine', targetSets: 3, targetReps: 12 },
      { exerciseId: 'lying-leg-curl', exerciseName: 'Lying Leg Curl', targetMuscleGroup: 'Legs', category: 'Machine', targetSets: 3, targetReps: 12 },
      { exerciseId: 'standing-calf-raise', exerciseName: 'Standing Calf Raise', targetMuscleGroup: 'Legs', category: 'Machine', targetSets: 4, targetReps: 15 },
    ]
  }
];
