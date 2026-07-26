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

