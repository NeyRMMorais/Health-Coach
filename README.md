<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

# 🥗 Health Coach AI

An intelligent, AI-powered health and nutrition coach application built with React, Vite, Express, and Google Gemini AI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-10B981?style=for-the-badge&logo=googlecloudrun&logoColor=white)](https://health-coach-294927768151.europe-west2.run.app)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Live Production URL**: [https://health-coach-294927768151.europe-west2.run.app](https://health-coach-294927768151.europe-west2.run.app)

</div>

---

## ✨ Features

- **🗂️ Two-Level Navigation & Screen Persistence**: Clean two-tier group navigation separating **Nutrition Coach** (*Food Diary*, *Meal Suggester*, *Analytics*) and **Strength Coach** (*Strength Coach*) with full local screen persistence across page reloads.
- **💾 Active Workout Auto-Save & Recovery**: In-progress workout sessions (sets, weights, reps, completed checks) continuously auto-save to `localStorage`. If you lock your phone, switch tabs, or refresh the page, your workout seamlessly resumes without data loss.
- **⏱️ Wall-Clock Background Timers**: Elapsed workout duration and rest countdown timers use timestamp synchronization, maintaining 100% accuracy even during mobile sleep mode or tab throttling.
- **📱 Real-Time Cross-Device Routine Sync**: Synchronizes custom & AI-imported workout routines across web and mobile devices in real time via Cloud Firestore.
- **✏️ In-Place Routine Editor**: Full editing capability to modify titles, training days, exercises, target sets, reps, and rest timers on existing routine cards.
- **🧘 Stretching & Flexibility Library**: Expanded Exercise Library with 16 stretching exercises (including *90/90 Hip Mobility Stretch* & *Scapular Wall Slides*) and a dedicated `Stretching` category filter.
- **📅 1-Click Date Navigation Arrows (`<` / `>`)**: Navigate day-by-day in the Food Diary header with previous/next day arrow controls and a quick reset to "Today".
- **🏋️ Strength Coach & Gym Tracker (Phase 1)**:
  - **Set-by-Set Logger**: Streamlined 6-column set tracker (`Set`, `Weight kg`, `Reps`, `RPE @1–@10`, `Done`, `Delete`).
  - **Per-Exercise Rest Timers**: Preset timer options ($30\text{s}$ to $300\text{s}$) + custom input capability with floating timer overlays and Web Audio synthesized completion beeps.
  - **Multi-Day Schedule Routines**: Build training programs with multi-day structures (Workout Sessions, Cardio Days, Rest Days) and persistent template deletion.
  - **🗺️ Anatomical Muscle Heatmap & Recovery Visualizer**: High-fidelity 2D vector anatomical body diagram (Front Anterior & Back Posterior views) with 7-day fatigue calculations, localized recovery levels (Fresh, Recovering, Fatigued), and AI readiness recommendations.
  - **Exercise Library**: Searchable catalog filtered by muscle group and category with custom exercise creation.
- **🤖 AI Quick Log**: Natural language food entry using Google Gemini AI (`gemini-3.7-flash`, centrally configurable via [`gemini.config.json`](./gemini.config.json)). Describe what you ate in natural language (e.g. *"2 eggs, 50g oats, 200ml skim milk"*) or annex a photo of your plate, and let AI estimate calories and macros.
- **📜 AI Recipe & Prompt Preservation**: Save original AI prompt descriptions and recipe measurements directly into your Saved Meals Library to easily repeat meals later.
- **📚 Saved Meals Library**: Store staple meals in a searchable library, featuring collapsible recipe details (`>` / `v`) and 1-click logging to your daily diary.
- **💬 In-App Feedback & Screenshot Attachment**: Direct bug and improvement reporting with optional client-side compressed screenshot attachments stored in Cloud Firestore.
- **✨ Soft Exercise Completion Transitions**: Polished set completion animations powered by `motion` with immediate visual feedback, illuminated badges, and gentle accordion compacting.
- **⚡ Guest Mode & Local Storage**: Full offline/unauthenticated support using browser `localStorage` when not logged in, automatically syncing to Firebase Firestore upon Google Auth login.
- **📊 Daily Nutrition Dashboard**: Real-time caloric and macro tracking (Protein, Carbs, Fats) against customized user goals.

---

## 🚀 Run Locally

### Prerequisites
- **Node.js** (v18+)
- **npm**

### Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file (or copy from `.env.example`):
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   ```
   *Note: If no API key is provided, the application uses an intelligent local fallback estimator.*

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## ☁️ Deploy to GCP Cloud Run Production

To deploy updates directly to GCP Cloud Run (`europe-west2`):

```bash
gcloud run deploy health-coach \
  --source . \
  --region europe-west2 \
  --project health-coach-501615
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, TailwindCSS, Motion (Framer Motion), Lucide Icons
- **Backend**: Express, Node.js, `tsx`, `esbuild`
- **Hosting**: GCP Cloud Run (Docker / Source build)
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **Database & Auth**: Firebase Auth, Firebase Firestore
