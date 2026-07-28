<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🥗 Health Coach AI

An intelligent, AI-powered health and nutrition coach application built with React, Vite, Express, and Google Gemini AI.

**Live Production URL**: [https://health-coach-294927768151.europe-west2.run.app](https://health-coach-294927768151.europe-west2.run.app)

---

## ✨ Features

- **🏋️ Strength Coach & Gym Tracker (Phase 1)**:
  - **Set-by-Set Logger**: Track weight (**kg**), reps, RPE (1–10 scale / Reps in Reserve), and real-time **Est. 1RM** (Epley Formula $1\text{RM} = w \times (1 + r/30)$).
  - **Per-Exercise Rest Timers**: Preset timer options ($30\text{s}$ to $300\text{s}$) + custom input capability with floating timer overlays and Web Audio synthesized completion beeps.
  - **Multi-Day Schedule Routines**: Build training programs with multi-day structures (Workout Sessions, Cardio Days, Rest Days) and persistent template deletion.
  - **🗺️ Anatomical Muscle Heatmap & Recovery Visualizer**: High-fidelity 2D vector anatomical body diagram (Front Anterior & Back Posterior views) with 7-day fatigue calculations, localized recovery levels (Fresh, Recovering, Fatigued), and AI readiness recommendations.
  - **Exercise Library**: Searchable catalog filtered by muscle group and category with custom exercise creation.
- **🤖 AI Quick Log**: Natural language food entry using Google Gemini AI (`gemini-3.5-flash`). Describe what you ate in natural language (e.g. *"2 eggs, 50g oats, 200ml skim milk"*) and let AI estimate calories and macros.
- **📜 AI Recipe & Prompt Preservation**: Save original AI prompt descriptions and recipe measurements directly into your Saved Meals Library to easily repeat meals later.
- **📚 Saved Meals Library**: Store staple meals in a searchable library, featuring collapsible recipe details (`>` / `v`) and 1-click logging to your daily diary.
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
