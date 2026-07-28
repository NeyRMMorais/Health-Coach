export interface UserProfile {
  userId: string;
  dailyCaloricLimit: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  weight: number;
  targetWeight: number;
  dietaryPreferences: string[];
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface FoodLog {
  id: string;
  userId: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  createdAt?: any;
  updatedAt?: any;
}

export interface MealSuggestion {
  title: string;
  description: string;
  prepTime: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description?: string; // Saved prompt, ingredients, or recipe notes
  createdAt?: any;
  updatedAt?: any;
}

export type TargetMuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body';
export type ExerciseCategory = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight';

export interface Exercise {
  id: string;
  name: string;
  targetMuscleGroup: TargetMuscleGroup;
  category: ExerciseCategory;
  description?: string;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  weight: number; // in kg
  reps: number;
  rpe?: number; // 1-10 rating of perceived exertion
  isWarmup?: boolean;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  targetMuscleGroup: TargetMuscleGroup;
  category: ExerciseCategory;
  sets: ExerciseSet[];
  restSeconds?: number; // Custom rest timer per exercise in seconds (default 90s)
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  activeCaloriesBurned?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface WorkoutRoutine {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetMuscleGroup?: TargetMuscleGroup;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetMuscleGroup: TargetMuscleGroup;
    category: ExerciseCategory;
    targetSets: number;
    targetReps: number;
    targetRestSeconds?: number;
  }[];
  createdAt?: any;
  updatedAt?: any;
}


