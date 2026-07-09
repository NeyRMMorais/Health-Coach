# Health Coach - Product Backlog

This backlog tracks upcoming feature requests, architectural improvements, and bug fixes for the Health Coach application. Items are prioritized based on user interest and utility.

---

## 📋 Active Backlog

### 1. 🍲 Meal Ideas Library (Saved Meals Repository)
*   **Goal**: Allow users to save frequently eaten or "perfectly balanced" meals to a personal repository for quick reference and logging in the future.
*   **User Story**: *"When I log a great meal (like 'Oatmeal with whey protein'), I want a 'Save to Library' button so I can store its name, type, calories, and macros. Later, I want to view my library and click a meal to instantly log it for today."*
*   **Technical Details**:
    *   Add a new Firestore subcollection `/users/{userId}/savedMeals/{mealId}`.
    *   Add a bookmark/star button next to logged items in the daily tracker.
    *   Create a "Saved Meals" sub-section or modal to browse and quickly log them.

---

## 🚀 Up Next (Medium Priority)

### 2. 💧 Hydration Tracker
*   **Goal**: Integrate a simple visual tracker to log daily water intake.
*   **User Story**: *"I want to set a daily water goal (e.g. 2.5L) and click quick-add buttons (+250ml, +500ml) to log my water consumption throughout the day."*
*   **Technical Details**:
    *   Store logs in `/users/{userId}/waterLogs/{date}`.

### 3. 🏃 Exercise & Activity Log
*   **Goal**: Track daily workouts and calculate active calories burned.
*   **User Story**: *"I want to log my exercise (running, weightlifting) so that the calories burned are subtracted from my daily net intake budget."*
*   **Technical Details**:
    *   Update dashboard to show: `Net Calories = Food Consumed - Active Burned`.

### 4. 📉 Weight Tracking & Analytics Chart
*   **Goal**: Monitor weight fluctuations over time to track fitness progression.
*   **User Story**: *"I want to log my weight daily or weekly, and see a line chart under the Analytics tab showing my weight trend alongside my target weight."*

---

## 💡 Future Enhancements (Low Priority)

### 5. 📷 Gemini Multimodal Food Logging
*   **Goal**: Log meals simply by taking/uploading a photo.
*   **User Story**: *"I want to upload a photo of my plate, and have Gemini automatically estimate the meal name, calories, and macro breakdown for quick logging."*
