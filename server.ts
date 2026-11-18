import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import geminiConfig from "./gemini.config.json";

dotenv.config();

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const PORT = parseInt(process.env.PORT || "3000");

// Centralized Gemini Model Configuration with optional .env overrides
const GEMINI_MODELS = {
  nutritionEstimate:
    process.env.GEMINI_MODEL_NUTRITION_ESTIMATE ||
    geminiConfig.models.nutritionEstimate ||
    "gemini-3.8-flash",
  mealSuggest:
    process.env.GEMINI_MODEL_MEAL_SUGGEST ||
    geminiConfig.models.mealSuggest ||
    "gemini-3.8-flash",
  routineArchitect:
    process.env.GEMINI_MODEL_ROUTINE_ARCHITECT ||
    geminiConfig.models.routineArchitect ||
    "gemini-3.8-flash",
};

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function hasValidApiKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(
    apiKey &&
      apiKey.trim().length > 0 &&
      apiKey !== "MY_GEMINI_API_KEY" &&
      apiKey !== "your_api_key_here"
  );
}

function sendAiUnavailable(res: express.Response, context: string, error?: unknown) {
  if (error) {
    console.error(`[Gemini AI Error] ${context}:`, error);
    return res.status(502).json({
      error: "AI service failed to respond. Please try again in a moment or enter values manually.",
    });
  }
  console.error(`[Gemini AI Config] ${context}: GEMINI_API_KEY is missing or invalid.`);
  return res.status(503).json({
    error: "AI service is not configured on the server. Please contact support or enter values manually.",
  });
}

// Endpoint to estimate nutrition macros from text, photo, or both
app.post("/api/gemini/estimate", async (req, res) => {
  const { query, image } = req.body;
  const hasQuery = query && typeof query === "string" && query.trim().length > 0;
  const hasImage = image && typeof image === "object" && typeof image.data === "string" && image.data.length > 0;

  if (!hasQuery && !hasImage) {
    return res.status(400).json({ error: "Please provide a meal description, a photo, or both." });
  }

  if (!hasValidApiKey()) {
    return sendAiUnavailable(res, "/api/gemini/estimate");
  }

  try {
    const contents: any[] = [];

    // If an image was attached, include it as inlineData
    if (hasImage) {
      const mimeType = image.mimeType || "image/jpeg";
      const base64Clean = image.data.replace(/^data:[^;]+;base64,/, "");
      contents.push({
        inlineData: {
          data: base64Clean,
          mimeType: mimeType,
        },
      });
    }

    const nutritionRules = `Accuracy rules:
1. Identify every distinct food component and estimate realistic portion weights/volumes (using plate/utensil scale when a photo is provided).
2. Account for likely preparation fats, cooking oils, sauces, and dressings if visible or typical for the dish.
3. Ensure caloric math is consistent: calories ≈ 4*protein + 4*carbs + 9*fats (rounded to nearest integer).
4. Return a concise meal "name" and a brief 1-sentence "breakdown" listing the assumed items and portions.`;

    let promptText = "";
    if (hasImage && hasQuery) {
      promptText = `You are a registered dietitian and nutrition analyst. Analyze this meal photo together with the user's notes: "${query.trim()}".\n\n${nutritionRules}`;
    } else if (hasImage) {
      promptText = `You are a registered dietitian and nutrition analyst. Analyze this meal photo carefully.\n\n${nutritionRules}`;
    } else {
      promptText = `You are a registered dietitian and nutrition analyst. Estimate nutrition for this meal: "${query.trim()}".\n\n${nutritionRules}`;
    }

    contents.push(promptText);

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.nutritionEstimate,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A concise name for the meal or item (e.g. 'Scrambled Eggs and Whole Wheat Toast')" },
            breakdown: { type: Type.STRING, description: "Concise 1-sentence list of assumed items and portions (e.g. '150g grilled chicken breast, 120g cooked white rice, 1 tbsp olive oil')" },
            calories: { type: Type.INTEGER, description: "Estimated total energy in kcal (must be non-negative)" },
            protein: { type: Type.INTEGER, description: "Estimated protein in grams (must be non-negative)" },
            carbs: { type: Type.INTEGER, description: "Estimated carbohydrates in grams (must be non-negative)" },
            fats: { type: Type.INTEGER, description: "Estimated fats in grams (must be non-negative)" }
          },
          required: ["name", "breakdown", "calories", "protein", "carbs", "fats"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error) {
    return sendAiUnavailable(res, "/api/gemini/estimate", error);
  }
});

// Endpoint to suggest healthy meal options based on goals
app.post("/api/gemini/suggest-meals", async (req, res) => {
  const { goal, mealType, dietaryPreferences } = req.body;

  if (!hasValidApiKey()) {
    return sendAiUnavailable(res, "/api/gemini/suggest-meals");
  }

  try {
    const prefsStr = dietaryPreferences && Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0
      ? `Dietary preferences/restrictions (strictly enforce): ${dietaryPreferences.join(", ")}.`
      : "No specific dietary restrictions.";

    const prompt = `You are a registered dietitian and culinary coach. Generate exactly 3 distinct, practical, and delicious meal options for:
- Goal: "${goal || "Eat healthy"}"
- Meal type: "${mealType || "Lunch"}"
- ${prefsStr}

Accuracy & quality rules:
1. Include exact, realistic ingredient weights/measurements for a single serving.
2. Calculate calories and macros from those exact ingredients, ensuring calories ≈ 4*protein + 4*carbs + 9*fats.
3. Provide clear, concise step-by-step cooking instructions and realistic prep time.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.mealSuggest,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The name of the recipe or meal" },
              description: { type: Type.STRING, description: "A brief, appetizing description of the meal and why it suits the goal" },
              prepTime: { type: Type.STRING, description: "Estimated preparation and cooking time (e.g., '15 mins', '25 mins')" },
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of ingredients with measurements"
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step preparation and cooking instructions"
              },
              calories: { type: Type.INTEGER, description: "Estimated calories in kcal" },
              protein: { type: Type.INTEGER, description: "Estimated protein in grams" },
              carbs: { type: Type.INTEGER, description: "Estimated carbohydrates in grams" },
              fats: { type: Type.INTEGER, description: "Estimated fats in grams" }
            },
            required: ["title", "description", "prepTime", "ingredients", "instructions", "calories", "protein", "carbs", "fats"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error) {
    return sendAiUnavailable(res, "/api/gemini/suggest-meals", error);
  }
});

// AI Workout Architect Endpoint
app.post("/api/gemini/parse-routine", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Workout routine text is required." });
  }

  if (!hasValidApiKey()) {
    return sendAiUnavailable(res, "/api/gemini/parse-routine");
  }

  try {
    const prompt = `You are a world-class strength & conditioning coach. Parse the following unstructured workout routine text into a structured multi-day training routine JSON object.

Text to parse:
"""
${text}
"""

Rules:
1. Extract a clear, catchy routine title and concise description.
2. Parse all training days (e.g. Day 1 - Push, Day 2 - Pull, Day 3 - Rest Day).
3. For each day, classify type as "workout", "rest", or "cardio".
4. For workout days, extract all exercises with targetMuscleGroup ('Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'), category ('Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'), targetSets (number, default 3), targetReps (number, default 10), and targetRestSeconds (number, default 90).`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.routineArchitect,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Catchy title of the workout routine" },
            description: { type: Type.STRING, description: "Brief description of the routine split" },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: { type: Type.STRING, description: "Name of the day, e.g. Day 1 - Push" },
                  type: { type: Type.STRING, enum: ["workout", "rest", "cardio"] },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        exerciseName: { type: Type.STRING },
                        targetMuscleGroup: {
                          type: Type.STRING,
                          enum: ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"],
                        },
                        category: {
                          type: Type.STRING,
                          enum: ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"],
                        },
                        targetSets: { type: Type.INTEGER },
                        targetReps: { type: Type.INTEGER },
                        targetRestSeconds: { type: Type.INTEGER },
                      },
                      required: ["exerciseName", "targetMuscleGroup", "category", "targetSets", "targetReps"],
                    },
                  },
                },
                required: ["dayName", "type"],
              },
            },
          },
          required: ["title", "description", "days"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    
    // Add missing IDs and index numbers
    const processedDays = (parsed.days || []).map((day: any, idx: number) => ({
      id: `day_${Date.now()}_${idx + 1}`,
      dayNumber: idx + 1,
      dayName: day.dayName || `Day ${idx + 1}`,
      type: day.type || "workout",
      exercises: (day.exercises || []).map((ex: any, exIdx: number) => ({
        exerciseId: `ex_${Date.now()}_${idx}_${exIdx}`,
        exerciseName: ex.exerciseName || "Exercise",
        targetMuscleGroup: ex.targetMuscleGroup || "Full Body",
        category: ex.category || "Barbell",
        targetSets: Number(ex.targetSets) || 3,
        targetReps: Number(ex.targetReps) || 10,
        targetRestSeconds: Number(ex.targetRestSeconds) || 90,
      })),
    }));

    res.json({
      title: parsed.title || "AI Imported Routine",
      description: parsed.description || "Imported workout schedule parsed with Gemini AI.",
      days: processedDays,
    });
  } catch (error) {
    return sendAiUnavailable(res, "/api/gemini/parse-routine", error);
  }
});

// Vite integration
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Gemini AI Config] Active models:`);
    console.log(` - Nutrition Estimate (/api/gemini/estimate): ${GEMINI_MODELS.nutritionEstimate}`);
    console.log(` - Meal Suggester (/api/gemini/suggest-meals): ${GEMINI_MODELS.mealSuggest}`);
    console.log(` - Routine Architect (/api/gemini/parse-routine): ${GEMINI_MODELS.routineArchitect}`);
  });
}

start();
