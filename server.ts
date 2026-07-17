import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Geocoding API Proxy (to avoid CORS/client failures and centralize requests)
app.get("/api/geocode", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "City name parameter 'name' is required" });
      return;
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`
    );
    if (!response.ok) {
      throw new Error(`Geocoding service returned status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: error.message || "Failed to geocode city name" });
  }
});

// 2. Weather Forecast API Proxy
app.get("/api/weather", async (req, res) => {
  try {
    const { latitude, longitude, timezone } = req.query;
    if (!latitude || !longitude) {
      res.status(400).json({ error: "Latitude and longitude are required" });
      return;
    }

    const tz = timezone || "auto";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,uv_index,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=${tz}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather service returned status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Weather data fetch error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch weather data" });
  }
});

// 3. AI-Powered Intelligence planning recommendations
app.post("/api/recommendations", async (req, res) => {
  try {
    const { cityName, country, currentWeather, forecast } = req.body;
    if (!cityName || !currentWeather || !forecast) {
      res.status(400).json({ error: "cityName, currentWeather, and forecast data are required" });
      return;
    }

    // Verify API key is configured
    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({
        error: "Please configure your GEMINI_API_KEY in Settings > Secrets to unlock AI recommendations!"
      });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `
      You are an expert meteorological intelligence agent. 
      Analyze the weather data for ${cityName}, ${country || "Unknown Country"} to generate detailed, highly personalized, and intelligent planning recommendations for the next 7 days.
      
      Current Weather:
      - Temperature: ${currentWeather.temperature_2m}°C
      - Apparent (Feels Like) Temperature: ${currentWeather.apparent_temperature}°C
      - Humidity: ${currentWeather.relative_humidity_2m}%
      - Wind Speed: ${currentWeather.wind_speed_10m} km/h
      - Weather Code: ${currentWeather.weather_code} (WMO weather interpretation code)
      
      7-Day Daily Forecast:
      - Dates: ${JSON.stringify(forecast.time)}
      - Max Temps: ${JSON.stringify(forecast.temperature_2m_max)}°C
      - Min Temps: ${JSON.stringify(forecast.temperature_2m_min)}°C
      - Weather Codes: ${JSON.stringify(forecast.weather_code)}
      - Precipitation Probabilities (Max): ${JSON.stringify(forecast.precipitation_probability_max)}%
      - UV Index (Max): ${JSON.stringify(forecast.uv_index_max)}
      - Wind Speeds (Max): ${JSON.stringify(forecast.wind_speed_10m_max)} km/h

      Instructions:
      1. Review the data to create weather-smart clothing advice, daily activity suitability, key health alerts (sunscreen, allergy, hydration), and a daily intelligence activity score (0-100) for outdoor planning.
      2. Provide recommendations that are realistic, practical, and tightly aligned with the metrics provided.
      3. Your response MUST strictly follow the requested JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional, helpful Weather Intelligence assistant. Always output valid JSON that strictly matches the schema. Do not include markdown formatting like ```json in the output text, just return the raw JSON object.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "clothingAdvice", "activities", "healthAlerts", "dailyIntelligence"],
          properties: {
            summary: {
              type: Type.STRING,
              description: "A professional 1-2 sentence summary of the weather intelligence for the upcoming week in the requested city."
            },
            clothingAdvice: {
              type: Type.OBJECT,
              required: ["essentials", "footwear", "tip"],
              properties: {
                essentials: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of clothing items suited to the weather, e.g., 'Warm wool sweater', 'Waterproof rain jacket'."
                },
                footwear: {
                  type: Type.STRING,
                  description: "Footwear recommendation, e.g., 'Insulated waterproof boots' or 'Breathable mesh running shoes'."
                },
                tip: {
                  type: Type.STRING,
                  description: "A dynamic outfit layering or comfort tip based on humidity, temperature variation, and wind."
                }
              }
            },
            activities: {
              type: Type.ARRAY,
              description: "List of general activities and their weather suitability",
              items: {
                type: Type.OBJECT,
                required: ["name", "suitability", "bestTime", "reason"],
                properties: {
                  name: { type: Type.STRING, description: "Activity name, e.g., 'Jogging', 'Cycling', 'Museum Visits', 'Hiking'." },
                  suitability: { type: Type.STRING, description: "Highly Recommended, Suitable, or Indoor Only" },
                  bestTime: { type: Type.STRING, description: "Best time of day, e.g., 'Early morning', 'Afternoon', 'Late evening'." },
                  reason: { type: Type.STRING, description: "Explanation of why this is or isn't suitable based on wind, precipitation, or temperature." }
                }
              }
            },
            healthAlerts: {
              type: Type.OBJECT,
              required: ["uvAlert", "hydration", "precautions"],
              properties: {
                uvAlert: { type: Type.STRING, description: "UV-index based protection recommendation, e.g., SPF 30+ needed." },
                hydration: { type: Type.STRING, description: "Hydration target advice based on thermal heat/sweat levels." },
                precautions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Precautions to take, e.g., 'Watch for slick pavement', 'Carry an umbrella', 'Windchill protection'."
                }
              }
            },
            dailyIntelligence: {
              type: Type.ARRAY,
              description: "A day-by-day score and brief summary of outdoor readiness.",
              items: {
                type: Type.OBJECT,
                required: ["day", "date", "activityScore", "briefRecommendation"],
                properties: {
                  day: { type: Type.STRING, description: "Day of the week, e.g., 'Monday'." },
                  date: { type: Type.STRING, description: "ISO formatted date, e.g., '2026-07-20'." },
                  activityScore: { type: Type.INTEGER, description: "An outdoor activity score from 0 (very bad weather) to 100 (perfect, beautiful weather)." },
                  briefRecommendation: { type: Type.STRING, description: "A highly concise outdoor suggestion, e.g., 'Best day for outdoor chores' or 'Heavy rain, stay inside.'" }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error("AI recommendations error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI planning recommendations" });
  }
});

// Serve frontend assets in production and Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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

startServer();
