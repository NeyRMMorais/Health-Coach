import { WorkoutRoutine } from '../types';

export const DEFAULT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine-ppl-split',
    userId: 'default',
    title: 'Push / Pull / Legs 5-Day Program',
    description: 'Hypertrophy and strength split featuring dedicated push, pull, leg, and cardio/rest recovery days.',
    days: [
      {
        id: 'day-ppl-1',
        dayNumber: 1,
        dayName: 'D1 - Push Day',
        type: 'workout',
        exercises: [
          { exerciseId: 'bench-press-barbell', exerciseName: 'Barbell Bench Press', targetMuscleGroup: 'Chest', category: 'Barbell', targetSets: 4, targetReps: 8, targetRestSeconds: 120 },
          { exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline Dumbbell Press', targetMuscleGroup: 'Chest', category: 'Dumbbell', targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
          { exerciseId: 'seated-dumbbell-shoulder-press', exerciseName: 'Seated Dumbbell Shoulder Press', targetMuscleGroup: 'Shoulders', category: 'Dumbbell', targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
          { exerciseId: 'dumbbell-lateral-raise', exerciseName: 'Dumbbell Lateral Raise', targetMuscleGroup: 'Shoulders', category: 'Dumbbell', targetSets: 4, targetReps: 12, targetRestSeconds: 60 },
          { exerciseId: 'tricep-rope-pushdown', exerciseName: 'Tricep Rope Pushdown', targetMuscleGroup: 'Arms', category: 'Cable', targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
        ]
      },
      {
        id: 'day-ppl-2',
        dayNumber: 2,
        dayName: 'D2 - Rest & Active Recovery',
        type: 'rest',
        notes: 'Take a full rest day, light walking, stretching, or foam rolling.'
      },
      {
        id: 'day-ppl-3',
        dayNumber: 3,
        dayName: 'D3 - Pull Day',
        type: 'workout',
        exercises: [
          { exerciseId: 'lat-pulldown', exerciseName: 'Lat Pulldown', targetMuscleGroup: 'Back', category: 'Cable', targetSets: 4, targetReps: 10, targetRestSeconds: 90 },
          { exerciseId: 'bent-over-row-barbell', exerciseName: 'Barbell Bent Over Row', targetMuscleGroup: 'Back', category: 'Barbell', targetSets: 4, targetReps: 8, targetRestSeconds: 120 },
          { exerciseId: 'face-pull', exerciseName: 'Cable Face Pull', targetMuscleGroup: 'Shoulders', category: 'Cable', targetSets: 3, targetReps: 15, targetRestSeconds: 60 },
          { exerciseId: 'barbell-bicep-curl', exerciseName: 'Barbell Bicep Curl', targetMuscleGroup: 'Arms', category: 'Barbell', targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
          { exerciseId: 'dumbbell-hammer-curl', exerciseName: 'Dumbbell Hammer Curl', targetMuscleGroup: 'Arms', category: 'Dumbbell', targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
        ]
      },
      {
        id: 'day-ppl-4',
        dayNumber: 4,
        dayName: 'D4 - Aerobic / Cardio & Core',
        type: 'cardio',
        notes: '30-45 mins Zone 2 cardio (treadmill, cycling, or swimming) + 3 sets of hanging leg raises.'
      },
      {
        id: 'day-ppl-5',
        dayNumber: 5,
        dayName: 'D5 - Leg Day',
        type: 'workout',
        exercises: [
          { exerciseId: 'barbell-squat', exerciseName: 'Barbell Back Squat', targetMuscleGroup: 'Legs', category: 'Barbell', targetSets: 4, targetReps: 8, targetRestSeconds: 150 },
          { exerciseId: 'romanian-deadlift', exerciseName: 'Romanian Deadlift (RDL)', targetMuscleGroup: 'Legs', category: 'Barbell', targetSets: 3, targetReps: 10, targetRestSeconds: 120 },
          { exerciseId: 'leg-press', exerciseName: 'Leg Press', targetMuscleGroup: 'Legs', category: 'Machine', targetSets: 3, targetReps: 12, targetRestSeconds: 90 },
          { exerciseId: 'lying-leg-curl', exerciseName: 'Lying Leg Curl', targetMuscleGroup: 'Legs', category: 'Machine', targetSets: 3, targetReps: 12, targetRestSeconds: 60 },
          { exerciseId: 'standing-calf-raise', exerciseName: 'Standing Calf Raise', targetMuscleGroup: 'Legs', category: 'Machine', targetSets: 4, targetReps: 15, targetRestSeconds: 60 },
        ]
      }
    ]
  },
  {
    id: 'routine-upper-lower',
    userId: 'default',
    title: 'Upper / Lower 4-Day Schedule',
    description: 'Balanced upper and lower body split interspersed with rest and cardio days.',
    days: [
      {
        id: 'day-ul-1',
        dayNumber: 1,
        dayName: 'D1 - Upper Body Strength',
        type: 'workout',
        exercises: [
          { exerciseId: 'bench-press-barbell', exerciseName: 'Barbell Bench Press', targetMuscleGroup: 'Chest', category: 'Barbell', targetSets: 4, targetReps: 6, targetRestSeconds: 150 },
          { exerciseId: 'bent-over-row-barbell', exerciseName: 'Barbell Bent Over Row', targetMuscleGroup: 'Back', category: 'Barbell', targetSets: 4, targetReps: 6, targetRestSeconds: 150 },
          { exerciseId: 'overhead-press-barbell', exerciseName: 'Overhead Barbell Press (OHP)', targetMuscleGroup: 'Shoulders', category: 'Barbell', targetSets: 3, targetReps: 8, targetRestSeconds: 120 },
          { exerciseId: 'pull-up', exerciseName: 'Pull-Up', targetMuscleGroup: 'Back', category: 'Bodyweight', targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
        ]
      },
      {
        id: 'day-ul-2',
        dayNumber: 2,
        dayName: 'D2 - Rest Day',
        type: 'rest',
        notes: 'Rest & recovery.'
      },
      {
        id: 'day-ul-3',
        dayNumber: 3,
        dayName: 'D3 - Lower Body Strength',
        type: 'workout',
        exercises: [
          { exerciseId: 'barbell-squat', exerciseName: 'Barbell Back Squat', targetMuscleGroup: 'Legs', category: 'Barbell', targetSets: 4, targetReps: 6, targetRestSeconds: 150 },
          { exerciseId: 'romanian-deadlift', exerciseName: 'Romanian Deadlift (RDL)', targetMuscleGroup: 'Legs', category: 'Barbell', targetSets: 4, targetReps: 8, targetRestSeconds: 120 },
          { exerciseId: 'walking-lunges', exerciseName: 'Dumbbell Walking Lunges', targetMuscleGroup: 'Legs', category: 'Dumbbell', targetSets: 3, targetReps: 10, targetRestSeconds: 90 },
        ]
      },
      {
        id: 'day-ul-4',
        dayNumber: 4,
        dayName: 'D4 - Aerobic Session',
        type: 'cardio',
        notes: '30 minutes moderate cardio.'
      },
      {
        id: 'day-ul-5',
        dayNumber: 5,
        dayName: 'D5 - Rest Day',
        type: 'rest',
        notes: 'Rest & recovery.'
      }
    ]
  }
];
