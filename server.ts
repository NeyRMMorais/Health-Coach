import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "3000");

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function fallbackEstimate(query: string) {
  const q = query.toLowerCase();
  let calories = 250;
  let protein = 12;
  let carbs = 25;
  let fats = 8;
  
  if (q.includes('whey') || q.includes('protein')) { protein += 24; calories += 120; }
  if (q.includes('milk') || q.includes('kwark') || q.includes('yogurt')) { protein += 14; carbs += 10; calories += 110; }
  if (q.includes('egg')) { protein += 12; fats += 10; calories += 140; }
  if (q.includes('oat') || q.includes('bread') || q.includes('rice')) { carbs += 30; calories += 150; }
  if (q.includes('strawberry') || q.includes('fruit') || q.includes('berry') || q.includes('banana')) { carbs += 15; calories += 60; }
  if (q.includes('avocado') || q.includes('nuts') || q.includes('oil') || q.includes('peanut')) { fats += 14; calories += 130; }
  if (q.includes('chicken') || q.includes('steak') || q.includes('salmon') || q.includes('turkey')) { protein += 30; fats += 6; calories += 220; }

  let cleanName = query.split(',')[0].split('.')[0].trim();
  if (cleanName.length > 40) cleanName = cleanName.slice(0, 40) + '...';
  cleanName = cleanName.replace(/\b\w/g, l => l.toUpperCase());

  return {
    name: cleanName || "Estimated Meal",
    calories,
    protein,
    carbs,
    fats
  };
}

function fallbackSuggestMeals(goal: string, mealType: string) {
  return [
    {
      title: `${mealType || 'Meal'} Power Bowl`,
      description: `High protein option designed for "${goal || 'healthy eating'}".`,
      prepTime: "15 mins",
      ingredients: ["150g Grilled Chicken or Tofu", "1 cup Brown Rice", "1 cup Mixed Greens", "1 tbsp Olive Oil"],
      instructions: ["Cook protein thoroughly in pan.", "Assemble rice and greens in bowl.", "Drizzle olive oil and serve warm."],
      calories: 450,
      protein: 38,
      carbs: 42,
      fats: 14
    },
    {
      title: `Balanced ${mealType || 'Meal'} Smoothie`,
      description: `Quick nutrient-dense smoothie option.`,
      prepTime: "5 mins",
      ingredients: ["1 scoop Whey Protein", "200ml Skim Milk", "1/2 Banana", "1 tbsp Peanut Butter"],
      instructions: ["Add all ingredients to high-speed blender.", "Blend until smooth for 45 seconds.", "Pour and enjoy."],
      calories: 340,
      protein: 30,
      carbs: 32,
      fats: 10
    },
    {
      title: `Mediterranean ${mealType || 'Meal'} Plate`,
      description: `Wholesome ingredients with balanced macros.`,
      prepTime: "12 mins",
      ingredients: ["2 Whole Eggs", "50g Feta Cheese", "1/2 Avocado sliced", "1 slice Whole Grain Toast"],
      instructions: ["Lightly toast bread.", "Prepare eggs to preference.", "Top toast with avocado, eggs, and feta."],
      calories: 410,
      protein: 24,
      carbs: 28,
      fats: 22
    }
  ];
}

// Endpoint to estimate nutrition macros from text
app.post("/api/gemini/estimate", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query parameter" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log("No valid GEMINI_API_KEY found, using local smart nutrition fallback.");
    return res.json(fallbackEstimate(query));
  }

  try {
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
    console.error("Error in /api/gemini/estimate, falling back to local estimator:", error);
    res.json(fallbackEstimate(query));
  }
});

// Endpoint to suggest healthy meal options based on goals
app.post("/api/gemini/suggest-meals", async (req, res) => {
  const { goal, mealType, dietaryPreferences } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log("No valid GEMINI_API_KEY found, using local meal suggestions fallback.");
    return res.json(fallbackSuggestMeals(goal, mealType));
  }

  try {
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
// Fallback Offline Routine Parser
function fallbackParseRoutine(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title = "AI Imported Routine";
  let description = "Imported workout schedule parsed from custom text.";
  const days: any[] = [];
  let currentDay: any = null;

  lines.forEach((line) => {
    // Check for routine title line
    if (line.toLowerCase().startsWith("title:") || line.toLowerCase().startsWith("routine:")) {
      title = line.replace(/^(title|routine):/i, "").trim();
      return;
    }

    // Check for Day headers (e.g., "Day 1:", "Day 2 - Push:", "Upper Body Day:")
    const dayMatch = line.match(/^(day\s*\d+|day\s*[-:]|[A-Z][a-z0-9\s]+Day)[:\s-]*(.*)/i);
    if (dayMatch) {
      if (currentDay && currentDay.exercises.length > 0) {
        days.push(currentDay);
      }
      const dayHeader = dayMatch[1].trim();
      const restMatch = line.toLowerCase().includes("rest day") || line.toLowerCase().includes("off");
      currentDay = {
        id: `day_${Date.now()}_${days.length + 1}`,
        dayNumber: days.length + 1,
        dayName: dayMatch[2] ? `${dayHeader}: ${dayMatch[2].trim()}` : dayHeader,
        type: restMatch ? "rest" : "workout",
        exercises: [],
      };
      return;
    }

    // Check for Exercise lines (e.g. "Bench Press 4x8", "Barbell Squats - 3 sets x 10 reps", "Lat Pulldown 3x12")
    if (currentDay && currentDay.type === "workout") {
      const exMatch = line.match(/^(?:[-*•]\s*)?([A-Za-z0-9\s/()'-]+?)(?:\s*[:@,|-]\s*|\s+)(\d+)\s*(?:sets?|x)\s*(\d+)\s*(?:reps?)?/i);
      if (exMatch) {
        const exName = exMatch[1].replace(/^[0-9.]+\s*/, "").trim();
        const sets = parseInt(exMatch[2], 10) || 3;
        const reps = parseInt(exMatch[3], 10) || 10;
        
        let muscleGroup = "Full Body";
        const lowerName = exName.toLowerCase();
        if (lowerName.includes("bench") || lowerName.includes("chest") || lowerName.includes("fly") || lowerName.includes("dip")) muscleGroup = "Chest";
        else if (lowerName.includes("row") || lowerName.includes("lat") || lowerName.includes("pull") || lowerName.includes("back")) muscleGroup = "Back";
        else if (lowerName.includes("squat") || lowerName.includes("leg") || lowerName.includes("lunge") || lowerName.includes("calf") || lowerName.includes("deadlift")) muscleGroup = "Legs";
        else if (lowerName.includes("press") || lowerName.includes("shoulder") || lowerName.includes("delt") || lowerName.includes("raise")) muscleGroup = "Shoulders";
        else if (lowerName.includes("curl") || lowerName.includes("tricep") || lowerName.includes("bicep") || lowerName.includes("extension")) muscleGroup = "Arms";
        else if (lowerName.includes("ab") || lowerName.includes("crunch") || lowerName.includes("plank") || lowerName.includes("core")) muscleGroup = "Core";

        let category = "Barbell";
        if (lowerName.includes("dumbbell") || lowerName.includes("db ")) category = "Dumbbell";
        else if (lowerName.includes("cable") || lowerName.includes("rope")) category = "Cable";
        else if (lowerName.includes("machine") || lowerName.includes("press machine") || lowerName.includes("leg extension")) category = "Machine";
        else if (lowerName.includes("bodyweight") || lowerName.includes("pushup") || lowerName.includes("pullup")) category = "Bodyweight";

        currentDay.exercises.push({
          exerciseId: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          exerciseName: exName,
          targetMuscleGroup: muscleGroup,
          category,
          targetSets: sets,
          targetReps: reps,
          targetRestSeconds: 90,
        });
      }
    }
  });

  if (currentDay && currentDay.exercises.length > 0) {
    days.push(currentDay);
  }

  if (days.length === 0) {
    // Fallback single day if regex failed
    days.push({
      id: `day_${Date.now()}_1`,
      dayNumber: 1,
      dayName: "Day 1 - Custom Split",
      type: "workout",
      exercises: [
        {
          exerciseId: "ex_fallback_1",
          exerciseName: "Bench Press",
          targetMuscleGroup: "Chest",
          category: "Barbell",
          targetSets: 4,
          targetReps: 8,
          targetRestSeconds: 90,
        },
        {
          exerciseId: "ex_fallback_2",
          exerciseName: "Barbell Squats",
          targetMuscleGroup: "Legs",
          category: "Barbell",
          targetSets: 4,
          targetReps: 8,
          targetRestSeconds: 120,
        },
      ],
    });
  }

  return { title, description, days };
}

// AI Workout Architect Endpoint
app.post("/api/gemini/parse-routine", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Workout routine text is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("GEMINI_API_KEY missing. Using fallback regex routine parser.");
    return res.json(fallbackParseRoutine(text));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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
      model: "gemini-2.5-flash",
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
    console.error("Error in /api/gemini/parse-routine, falling back to regex parser:", error);
    res.json(fallbackParseRoutine(text));
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
