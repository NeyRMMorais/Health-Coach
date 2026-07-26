# Health Coach - Product Backlog

This backlog tracks upcoming feature requests, architectural improvements, and bug fixes for the Health Coach application. Items are prioritized based on user interest and utility.

---

## 📋 Active Backlog

### 1. 💧 Hydration Tracker
*   **Goal**: Integrate a simple visual tracker to log daily water intake.
*   **User Story**: *"I want to set a daily water goal (e.g. 2.5L) and click quick-add buttons (+250ml, +500ml) to log my water consumption throughout the day."*
*   **Technical Details**:
    *   Store logs in `/users/{userId}/waterLogs/{date}`.

---

## 🚀 Up Next (Medium Priority)

### 2. 🏃 Exercise & Activity Log
*   **Goal**: Track daily workouts and calculate active calories burned.
*   **User Story**: *"I want to log my exercise (running, weightlifting) so that the calories burned are subtracted from my daily net intake budget."*
*   **Technical Details**:
    *   Update dashboard to show: `Net Calories = Food Consumed - Active Burned`.

### 3. 📉 Weight Tracking & Analytics Chart
*   **Goal**: Monitor weight fluctuations over time to track fitness progression.
*   **User Story**: *"I want to log my weight daily or weekly, and see a line chart under the Analytics tab showing my weight trend alongside my target weight."*

---

## ✅ Completed

*   **📜 AI Recipe & Prompt Preservation**: Preserve original text prompts and ingredient measurements directly when saving meals to the library, allowing users to inspect exact components to repeat recipes accurately.
*   **▶️ Collapsible Saved Meal Recipe Cards**: Expand/collapse (`>` / `v`) saved meal prompt details in the library modal by clicking on the meal title.
*   **⚡ Guest Mode & Local Storage Fallback**: Complete browser `localStorage` persistence for unauthenticated/offline users, with optimistic local UI state updates and automatic Firestore synchronization upon login.
*   **🍲 Meal Ideas Library (Saved Meals Repository)**: Store staple/favorite meals in Firestore subcollection `/users/{userId}/savedMeals`, bookmark meals from diary or AI recipes, edit/delete saved templates, and log to daily food diary with 1-click.
*   **⏱️ Specific Meal Timestamps**: Track the exact time a meal was consumed, with auto-fill to current time, manual picker, and mobile-optimized inline edit layout.
*   **✏️ Edit Logged Meal Categories**: Added the ability to reclassify a logged food item's category (Breakfast, Lunch, Dinner, Snack) directly from the dashboard.

## 💡 Future Enhancements (Low Priority)

### 7. 📷 Gemini Multimodal Food Logging
*   **Goal**: Log meals simply by taking/uploading a photo.
*   **User Story**: *"I want to upload a photo of my plate, and have Gemini automatically estimate the meal name, calories, and macro breakdown for quick logging."*
