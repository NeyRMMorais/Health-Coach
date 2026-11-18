# Health Coach — Technical Architecture

## 1. High-Level Stack
- **Frontend**: React 19, TypeScript (`~5.8`), Vite 6, Tailwind CSS v4, `motion`, `lucide-react`.
- **Backend**: Express (`server.ts`) serving both `/api/gemini/*` endpoints and the Vite dev middleware (in development) or static `dist/` bundle (in production).
- **AI**: `@google/genai` configured centrally via `gemini.config.json` (with optional `.env` overrides `GEMINI_MODEL_NUTRITION_ESTIMATE`, `GEMINI_MODEL_MEAL_SUGGEST`, `GEMINI_MODEL_ROUTINE_ARCHITECT`, defaulting to `gemini-3.7-flash`).
- **Database & Auth**: Firebase Auth + Cloud Firestore (`src/firebase.ts`, `firebase-applet-config.json`, `firestore.rules`).
- **Hosting**: Google Cloud Run (`health-coach` in `europe-west2`, GCP project `health-coach-501615`) built from `Dockerfile`.

## 2. Repository Map
```text
Health-Coach/
├── server.ts                  # Express server, Gemini API routes, Vite/static serving
├── gemini.config.json         # Centralized Gemini model configuration
├── firestore.rules            # Firestore security & schema validation rules
├── firebase-applet-config.json# Firebase project & database configuration
├── Dockerfile                 # Container build for Cloud Run
├── docs/
│   ├── PRODUCT.md             # Business rules, pillars, and user flows
│   └── ARCHITECTURE.md        # Technical design, data model, and deployment
├── src/
│   ├── App.tsx                # Top-level navigation, auth state, and screen persistence
│   ├── firebase.ts            # Firebase app, Auth, Firestore initialization & error helper
│   ├── types.ts               # Shared TypeScript domain interfaces
│   ├── components/            # Feature UI & modals (Food, Meal AI, Strength Logger, Heatmap)
│   ├── data/                  # Default exercise catalog & default workout routines
│   └── utils/                 # Routine template updater & workout progression helpers
├── AGENTS.md                  # Agent instructions, doc map, and verification commands
├── BACKLOG.md                 # Living product roadmap
└── README.md                  # Project overview, setup, and Cloud Run deploy guide
```

## 3. Backend API Endpoints (`server.ts`)
- `POST /api/gemini/estimate` — Accepts `{ query?, image? }` (base64 `inlineData`), returns `{ name, calories, protein, carbs, fats }`. Falls back to keyword-based `fallbackEstimate` when `GEMINI_API_KEY` is missing or errors occur.
- `POST /api/gemini/suggest-meals` — Accepts `{ goal, mealType, dietaryPreferences }`, returns 3 structured `MealSuggestion` objects (falls back to `fallbackSuggestMeals`).
- `POST /api/gemini/parse-routine` — Accepts `{ text }`, returns a structured multi-day `WorkoutRoutine` payload with generated day/exercise IDs (falls back to regex `fallbackParseRoutine`).

## 4. Firestore Data Model & Security (`firestore.rules`)
All user data is strictly scoped to the authenticated owner (`request.auth.uid == userId`) with email-verification and schema checks:
- `/users/{userId}` — `UserProfile` (calorie/macro targets, weight, dietary preferences)
- `/users/{userId}/foodLogs/{logId}` — `FoodLog`
- `/users/{userId}/savedMeals/{mealId}` — `SavedMeal`
- `/users/{userId}/workoutRoutines/{routineId}` — `WorkoutRoutine`
- `/users/{userId}/workoutLogs/{logId}` — `WorkoutLog`
- `/users/{userId}/customExercises/{exerciseId}` — `Exercise`
- `/feedback/{feedbackId}` — Write-only user feedback (`type`: `bug` | `improvement`, optional `imageBase64` <= 1 MB)

## 5. Build, Verification & Deployment
- **Typecheck**: `npm run lint` (`tsc --noEmit`)
- **Production Build**: `npm run build` (bundles client to `dist/` via Vite and `server.ts` to `dist/server.cjs` via `esbuild`)
- **Local Dev**: `npm run dev` (`tsx server.ts` on `PORT`, default `3000`)
- **Manual Cloud Run Deploy** (from `main`):
  ```bash
  gcloud run deploy health-coach --source . --region europe-west2 --project health-coach-501615
  ```
