# Health Coach — Product Specification

## 1. Purpose & Target User
Health Coach is a personal, AI-assisted nutrition and strength-training web application designed for daily mobile and desktop use. It combines calorie/macro tracking, AI meal estimation and suggestions, and a structured gym workout logger in one unified app.

## 2. Core Pillars & User Flows

### 2.1 Nutrition Coach
- **Food Diary (`FoodLogSection`)**:
  - Log meals by category (`Breakfast`, `Lunch`, `Dinner`, `Snack`) with date (`YYYY-MM-DD`) and time (`HH:MM`), plus 1-click `<` / `>` day navigation and "Today" reset.
  - Edit meal categories and review daily caloric/macro progress against user targets (`dailyCaloricLimit`, `proteinTarget`, `carbsTarget`, `fatsTarget`).
- **AI Quick Log & Multimodal Photo Logging (`/api/gemini/estimate`)**:
  - Enter natural language descriptions (e.g., *"2 eggs, 50g oats, 200ml skim milk"*) and/or upload a meal photo (client-side resized/compressed).
  - Gemini estimates meal name, calories, and macros for 1-click logging, with a deterministic local keyword fallback if no API key is available.
- **Meal Suggester (`/api/gemini/suggest-meals`)**:
  - Generates 3 structured meal ideas (prep time, ingredients, instructions, calories, macros) tailored to the user's goal, meal type, and `dietaryPreferences`.
- **Saved Meals Library (`SavedMealsModal`)**:
  - Bookmark staple meals or AI-generated recipes (preserving original prompt/ingredient notes) for 1-click re-logging.
- **Nutrition Analytics (`AnalyticsDashboard`)**:
  - Visualizes caloric and macronutrient trends over time.

### 2.2 Strength Coach
- **Routines & AI Routine Importer (`RoutineManager`, `AiWorkoutArchitectModal`)**:
  - Manage multi-day training schedules (`workout`, `rest`, `cardio` days) or paste unstructured routine text to parse into structured routines via `/api/gemini/parse-routine`.
  - Edit routines in-place, reorder exercises (`ReorderExercisesModal`), and sync templates across devices.
- **Active Workout Logger (`ActiveWorkoutLogger`)**:
  - Track sets (`Weight kg`, `Reps`, `RPE @1–@10`, `Completed`), auto-replicate weight/rep edits to subsequent incomplete sets, and swipe-to-delete sets on mobile.
  - Per-exercise rest timers with wall-clock timestamp accuracy and Web Audio completion chimes.
  - Auto-save active session drafts to `localStorage` so refreshes or mobile lock screens do not lose progress.
  - Swap exercises mid-workout (prioritizing matching `targetMuscleGroup`) and save structural changes back to the routine template mid-session or on the completion modal (`WorkoutCompletionModal`).
- **Exercise Library & Details (`ExerciseLibraryModal`, `ExerciseDetailModal`)**:
  - Searchable catalog across `Chest`, `Back`, `Legs`, `Shoulders`, `Arms`, `Core`, `Full Body` and categories (`Barbell`, `Dumbbell`, `Machine`, `Cable`, `Bodyweight`, `Stretching`), plus custom exercise creation.
  - 3-tab modal for Instructions, persistent personal Notes, and past session History.
- **Recovery & History (`BodyHeatmapView`, `WorkoutHistory`)**:
  - 7-day muscle fatigue heatmap (Front Anterior & Back Posterior views) and chronological workout log history.

### 2.3 Guest Mode, Auth & Feedback
- **Guest Mode**: Full offline/unauthenticated usage backed by `localStorage`, automatically migrating guest data to Cloud Firestore upon Google sign-in.
- **Profile & Targets (`ProfileModal`)**: Configure daily calorie/macro goals, current/target weight, and dietary preferences.
- **In-App Feedback (`FeedbackModal`)**: Submit bug reports or improvement ideas (with optional compressed screenshot) directly to Firestore.
