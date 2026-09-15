# Health Coach - Product Backlog

This backlog tracks upcoming feature requests, architectural improvements, and bug fixes for the Health Coach application. Items are prioritized based on user interest and utility.

---

## 📋 Active Backlog

### 1. 🤖 Phase 2: AI Strength Coach Engine
* **Goal**: Intelligent AI workout recommendation & progressive overload engine.
* **User Story**: *"I want the AI coach to analyze my previous performance, RPE, and 1RM metrics to automatically calculate progressive weight/rep targets for my next session, suggest exercise substitutions, and parse natural language workout entries."*

### 2. 📊 Phase 3: Body Metrics & Performance Tracking (The 3rd Pillar)
* **Goal**: Comprehensive body composition tracking, cardiovascular activity logs, and smart device connectivity.
* **User Story**: *"I want to track my body metrics over time and view my training holistically across nutrition, strength, and overall performance."*
* **Key Sub-Pillars**:
  * **Body Metrics & Scale**: Weight curve, 7-day rolling average, Body Fat %, Lean Mass, and weigh-in log history.
  * **Activities & Training**: Cardio & aerobic sessions (duration, pace, distance, heart rate, active calories burned).
  * **Connected Integrations**: Cloud sync for smart scales (e.g., Renpho/Withings) and wearables (Garmin/Fitbit).

---

## ✅ Completed

*   **📷 Gemini Multimodal Photo Food Logging**:
    * **Photo Plate Analysis**: Take or upload a photo of your plate (JPG, PNG, WEBP) directly from the Food Diary.
    * **Client-Side Image Optimization**: Instant canvas-based compression and auto-resizing (1024px maximum dimension) to ensure snappy, low-bandwidth uploads.
    * **Gemini 3.7 Flash Nutrition Estimation**: Uses `@google/genai` to automatically estimate meal name, calories, and complete macronutrient breakdown (protein, carbs, fats).
    * **1-Click Diary Logging**: Automatically pre-fills the logging form with estimated values and meal category for quick diary addition.
*   **🛡️ Opaque Set Completion Styling (Fix Red Bleed-Through)**:
    * Replaced semi-transparent emerald styling (`bg-emerald-950/45`) with solid opaque `bg-emerald-950` and isolated the red swipe-to-delete trigger area, resolving the issue where completed set rows appeared dark red/maroon ("Porque está vermelho?").
*   **📐 Mobile Sticky Top Bar Viewport Offset (Fix Timer Obscured)**:
    * Offset the active workout sticky header to `sticky top-[4.5rem] sm:top-[4.75rem]` so that elapsed workout duration, volume, and active rest countdown timers sit cleanly below the fixed main app navigation bar without collision on mobile scrolling.
*   **🎯 Same-Muscle Group Priority on Exercise Swap**:
    * When initiating an exercise swap mid-workout, `ExerciseLibraryModal` now dynamically pre-selects the replaced exercise's target muscle group, showing matching movement patterns first.
*   **☁️ Real-Time Cross-Device Sync for Workout History & Custom Exercises**:
    * **Workout History (`/users/{userId}/workoutLogs`)**: Real-time Firestore synchronization for all completed workout logs with automatic migration of guest sessions from `localStorage` upon login.
    * **Custom Exercises (`/users/{userId}/customExercises`)**: Real-time Firestore sync for user-created custom exercises with guest fallback and migration.
    * **Firestore Security Rules**: Strict ownership and verified email security rules for workout logs and custom exercises under `/users/{userId}`.
*   **🔊 Mobile AudioContext Autoplay Unlock**: Seamless Web Audio `AudioContext` initialization and resume on touch/click gestures, ensuring rest timer completion chimes are never silenced by iOS/Android browser autoplay policies.
*   **🤖 AI Routine Importer User ID Fix**: Bound authenticated user ID dynamically in AI Workout Architect routine generator to prevent permission rejections when saving imported routines.

* **🏋️ Phase 1: Strength Tracker & Gym Logger (PUSH Replica)**:
  * **Set-by-Set Tracker**: Real-time weight (**kg**), reps, RPE (@1–@10 / Reps in Reserve), and Epley 1RM estimation ($1\text{RM} = w \times (1 + r/30)$).
  * **Per-Exercise Rest Timers**: Rest duration selector dropdown on exercise cards ($30\text{s}$ to $300\text{s}$) + custom input capability with floating timer overlays and Web Audio synthesized completion beeps.
  * **Multi-Day Schedule Routines**: Multi-day training schedules (Workout Sessions, Cardio Days, Rest Days) with persistent template deletion.
  * **🗺️ Anatomical Muscle Heatmap & Recovery Visualizer**: High-fidelity 2D vector anatomical body diagram (Front Anterior & Back Posterior views) with 7-day fatigue calculations, localized recovery levels (Fresh, Recovering, Fatigued), and AI readiness recommendations.
  * **Exercise Catalog**: Searchable catalog filtered by target muscle group and category with custom exercise creation.

*   **📖 3-Tab Exercise Details Modal (Instructions, Notes, History)**: Clicking any exercise title opens a comprehensive modal with 3 specialized tabs:
    * **Instructions**: Step-by-step form cues, target muscle groups, and movement execution tips.
    * **Notes**: Persistent personal setup notes (grip, seat pin, bench angle) auto-remembered across all workouts.
    * **History**: Chronological log of past sessions with set-by-set weight, reps, RPE, and 1RM metrics.
*   **🖐️ Drag & Hold Exercise Reordering Modal**: Dedicated reordering screen with draggable cards and instant up/down controls in both the Routine Editor and Active Workout session.
*   **🔀 In-Workout Exercise Replacement with Permanent Swap Pill**: Swap exercises mid-workout with an instant confirmation pill banner offering to update the routine template permanently or keep it for the current workout only.
*   **🔽 Auto-Collapsing Completed Exercise Cards**: Exercise cards automatically compact into a sleek completed summary bar once all sets are finished, with 1-click expand/collapse.
*   **⏱️ Sticky Top Bar Live Rest Timer**: Integrated a real-time resting countdown and quick adjustment controls (`-10s` / `+10s` / dismiss) in the sticky top header so rest intervals remain visible and manageable while scrolling through exercises.
*   **🔁 Auto-Replicating Set Weight & Reps Cascade**: Adjusting weight or reps on any set automatically replicates the updated values down to all subsequent incomplete sets in that exercise.
*   **🔢 Sleek Integer @RPE Selector**: Redesigned the RPE selector to a compact dark-themed component using standardized whole integers (`@6` to `@10`) with Reps In Reserve (RIR) guidance.
*   **0️⃣ 0 kg Bodyweight & Stretching Support**: Fixed input binding so `0 kg` weight does not blank out, and automatically default stretching and mobility exercises to `0 kg`.
*   **📑 App-Wide Tab & Navigation Screen Persistence**: Automatically persist active groups (Nutrition vs. Strength Coach) and sub-tabs in `localStorage` so refreshing or backgrounding the app keeps the user on their active training screen.
*   **📱 Streamlined Exercise Set Logging Table**: Refitted exercise cards by removing Warmup and Est. 1RM columns for a clean 6-column interface (`Set`, `Weight`, `Reps`, `RPE`, `Done`, `Delete`).
*   **💾 Active Workout Session Persistence & Background Recovery**: Complete `localStorage` draft auto-saving on every set/weight change, wall-clock timer synchronization across phone lock screens and tab throttling, and accidental discard confirmation modal.
*   **📜 AI Recipe & Prompt Preservation**: Preserve original text prompts and ingredient measurements directly when saving meals to the library, allowing users to inspect exact components to repeat recipes accurately.
*   **▶️ Collapsible Saved Meal Recipe Cards**: Expand/collapse (`>` / `v`) saved meal prompt details in the library modal by clicking on the meal title.
*   **⚡ Guest Mode & Local Storage Fallback**: Complete browser `localStorage` persistence for unauthenticated/offline users, with optimistic local UI state updates and automatic Firestore synchronization upon login.
*   **🍲 Meal Ideas Library (Saved Meals Repository)**: Store staple/favorite meals in Firestore subcollection `/users/{userId}/savedMeals`, bookmark meals from diary or AI recipes, edit/delete saved templates, and log to daily food diary with 1-click.
*   **⏱️ Specific Meal Timestamps**: Track the exact time a meal was consumed, with auto-fill to current time, manual picker, and mobile-optimized inline edit layout.
*   **📅 Date Navigation Arrows (`<` / `>`)**: Added 1-click previous/next day date navigation arrows next to the date picker in the Food Diary header, with a quick reset to "Today".
*   **✏️ Edit Logged Meal Categories**: Added the ability to reclassify a logged food item's category (Breakfast, Lunch, Dinner, Snack) directly from the dashboard.
