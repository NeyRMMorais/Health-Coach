import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to estimate nutrition macros from text
app.post("/api/gemini/estimate", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid query parameter" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Estimate the calories (kcal) and macronutrients (protein, carbs, fats in grams) for this meal: "${query}". Provide a reasonable single food name or short summary as "name".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A concise name for the meal or item (e.g. 'Scrambled Eggs and Whole Wheat Toast')" },
            calories: { type: Type.INTEGER, description: "Estimated total energy in kcal (must be non-negative)" },
            protein: { type: Type.INTEGER, description: "Estimated protein in grams (must be non-negative)" },
            carbs: { type: Type.INTEGER, description: "Estimated carbohydrates in grams (must be non-negative)" },
            fats: { type: Type.INTEGER, description: "Estimated fats in grams (must be non-negative)" }
          },
          required: ["name", "calories", "protein", "carbs", "fats"]
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
    console.error("Error in /api/gemini/estimate:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to estimate nutrition" });
  }
});

// Endpoint to suggest healthy meal options based on goals
app.post("/api/gemini/suggest-meals", async (req, res) => {
  try {
    const { goal, mealType, dietaryPreferences } = req.body;

    const prefsStr = dietaryPreferences && Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0
      ? `Dietary preferences/restrictions: ${dietaryPreferences.join(", ")}.`
      : "No specific dietary restrictions.";

    const prompt = `Generate exactly 3 healthy, creative, and delicious meal options for a user with the following goals and preferences:
- Current goal: "${goal || "Eat healthy"}"
- Meal type: "${mealType || "Lunch"}"
- ${prefsStr}

Provide clear, structured recipes. Make sure preparation times, calories, and macros are realistic.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    console.error("Error in /api/gemini/suggest-meals:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to suggest meals" });
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
  });
}

start();
