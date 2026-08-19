# Health Coach - Product Backlog

This backlog tracks upcoming feature requests, architectural improvements, and bug fixes for the Health Coach application. Items are prioritized based on user interest and utility.

---

## 📋 Active Backlog

### 1. 🤖 Phase 2: AI Strength Coach Engine
* **Goal**: Intelligent AI workout recommendation & progressive overload engine.
* **User Story**: *"I want the AI coach to analyze my previous performance, RPE, and 1RM metrics to automatically calculate progressive weight/rep targets for my next session, suggest exercise substitutions, and parse natural language workout entries."*

---

## 🚀 Up Next (Medium Priority)

### 2. 🔗 Phase 3: Deep Health Coach Integration
* **Goal**: Integrate active workout calories into daily net nutrition budget and sync workout logs to Firestore.
* **User Story**: *"I want my strength workout active calories burned to subtract automatically from my daily calorie budget in the Food Diary tab."*

### 3. 💧 Hydration Tracker
* **Goal**: Integrate a simple visual tracker to log daily water intake.

---

## ✅ Completed

* **🏋️ Phase 1: Strength Tracker & Gym Logger (PUSH Replica)**:
  * **Set-by-Set Tracker**: Real-time weight (**kg**), reps, RPE (@1–@10 / Reps in Reserve), and Epley 1RM estimation ($1\text{RM} = w \times (1 + r/30)$).
  * **Per-Exercise Rest Timers**: Rest duration selector dropdown on exercise cards ($30\text{s}$ to $300\text{s}$) + custom input capability with floating timer overlays and Web Audio synthesized completion beeps.
  * **Multi-Day Schedule Routines**: Multi-day training schedules (Workout Sessions, Cardio Days, Rest Days) with persistent template deletion.
  * **🗺️ Anatomical Muscle Heatmap & Recovery Visualizer**: High-fidelity 2D vector anatomical body diagram (Front Anterior & Back Posterior views) with 7-day fatigue calculations, localized recovery levels (Fresh, Recovering, Fatigued), and AI readiness recommendations.
  * **Exercise Catalog**: Searchable catalog filtered by target muscle group and category with custom exercise creation.

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

## 💡 Future Enhancements (Low Priority)

### 7. 📷 Gemini Multimodal Food Logging
*   **Goal**: Log meals simply by taking/uploading a photo.
*   **User Story**: *"I want to upload a photo of my plate, and have Gemini automatically estimate the meal name, calories, and macro breakdown for quick logging."*
