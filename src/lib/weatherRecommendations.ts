import { WeatherResponse, AIRecommendations, DailyReadiness } from "../types";
import { formatDateStr } from "./weatherUtils";

export function getWeatherRecommendations(weatherData: WeatherResponse): AIRecommendations {
  const currentTemp = weatherData.current?.temperature_2m ?? 0;
  const isDay = weatherData.current?.is_day === 1;
  const humidity = weatherData.current?.relative_humidity_2m ?? 0;
  const windSpeed = weatherData.current?.wind_speed_10m ?? 0;
  const uvMax = Math.max(...(weatherData.daily?.uv_index_max || [0]));
  const rainProb = weatherData.daily?.precipitation_probability_max?.[0] ?? 0;

  // 1. Generate Editorial summary
  let summary = `The region is experiencing moderate weather at ${Math.round(currentTemp)}°C with ${humidity}% humidity. Excellent conditions for general planning.`;
  if (currentTemp > 28) {
    summary = `High thermal profiles detected, hovering around ${Math.round(currentTemp)}°C. UV exposure risks are heightened. Ensure constant hydration and minimize strenuous sun exposures.`;
  } else if (currentTemp < 10) {
    summary = `Chilly atmospheric currents observed at ${Math.round(currentTemp)}°C. High thermal dissipation is likely. Bundle up with protective thermal layers for commute.`;
  } else if (rainProb > 60) {
    summary = `Atmospheric moisture saturation is high with a ${rainProb}% risk of precipitation. Wet surfaces and reduced visibility call for waterproof gear and indoor alternatives.`;
  }

  // 2. Clothing advices
  const essentials: string[] = [];
  let footwear = "Standard comfortable walking shoes or sneakers.";
  let tip = "Check ambient wind chills before moving out.";

  if (currentTemp > 25) {
    essentials.push("Light linen shirt", "Breathable shorts/chinos", "UV polarized sunglasses", "Wide-brimmed sun hat");
    footwear = "Breathable canvas sneakers, light sandals, or loafers.";
    tip = "Lighter colors reflect radiant heat better under direct high UV.";
  } else if (currentTemp < 12) {
    essentials.push("Heavy wool coat", "Insulating mid-layer fleece", "Cashmere scarf", "Windproof gloves");
    footwear = "Water-resistant leather boots or insulated footwear.";
    tip = "The head and extremities lose heat rapidly. Protect them with a beanie.";
  } else {
    essentials.push("Cotton crewneck sweater", "Denim or casual trousers", "Light utility jacket", "Classic shades");
    footwear = "Standard versatile leather sneakers or suede chelsea boots.";
    tip = "A windbreaker or smart trench is perfect for shifting transitional breezes.";
  }

  if (rainProb > 40) {
    essentials.push("Gore-Tex rain shell", "Compact wind-resistant umbrella");
    footwear = "Treated waterproof boots or non-slip walking shoes.";
    tip = "Moisture can ruin suede and light leather. Opt for treated synthetics.";
  }

  // 3. Health & safety
  let uvAlert = "Low UV exposure. Regular daylight protection is adequate.";
  if (uvMax >= 8) {
    uvAlert = `Very High UV index of ${uvMax}. Sunburn can occur in under 15 minutes. Broad-spectrum SPF 50+ is essential.`;
  } else if (uvMax >= 5) {
    uvAlert = `Moderate-to-High UV index of ${uvMax}. Apply SPF 30+ generously, wear protective hats and shades.`;
  }

  let hydration = "1.5 to 2.0 Liters of fresh water for standard metabolic support.";
  if (currentTemp > 28) {
    hydration = "2.5 to 3.5 Liters. Supplement with trace minerals or electrolyte formulations due to sweating.";
  } else if (currentTemp < 8) {
    hydration = "1.5 Liters. Warm herbal infusions or broths can help maintain internal thermal equilibrium.";
  }

  const precautions = ["Apply broad-spectrum sunscreen on exposed dermis."];
  if (currentTemp > 30) {
    precautions.push("Limit prolonged direct midday sun exposure.", "Avoid caffeinated or alcoholic diuretics to stay hydrated.");
  } else if (currentTemp < 10) {
    precautions.push("Watch out for slippery pavement and ice patches.", "Wear layers to trapping body warmth effectively.");
  } else {
    precautions.push("Perfect climate for stretching outdoors.", "Maintain healthy indoor air exchange.");
  }

  // 4. Activity suitability
  const activities = [
    {
      name: "Running & Cardio Workouts",
      suitability: currentTemp > 32 ? "Indoor Only" : currentTemp < 5 ? "Fair" : rainProb > 70 ? "Indoor Only" : "Highly Recommended",
      reason: currentTemp > 32 
        ? "Risk of hyperthermia and rapid fatigue in extreme heat." 
        : rainProb > 70 
          ? "Slippery tracks and heavy cloudbursts make indoor treadmills safer."
          : "Superb ambient thermal comfort supports optimal VO2 max."
    },
    {
      name: "Outdoor Café & Co-working",
      suitability: (currentTemp > 28 || currentTemp < 15 || rainProb > 40) ? "Indoor Only" : "Highly Recommended",
      reason: rainProb > 40 
        ? "Moisture and electronic equipment do not mix well." 
        : currentTemp < 15 
          ? "Ambient chill might lock up fingers; find a cozy heated bistro."
          : "Pleasant breeze and golden hour daylight boost productivity."
    },
    {
      name: "Cycling & Commuting Trips",
      suitability: rainProb > 65 ? "Challenging" : windSpeed > 25 ? "Challenging" : "Excellent",
      reason: rainProb > 65 
        ? "Wet asphalt dramatically reduces tyre traction and visibility." 
        : windSpeed > 25 
          ? "Aggressive head-winds and cross-winds jeopardize steering safety."
          : "Mild head-winds and clear visibility create prime riding conditions."
    },
    {
      name: "Photography & Sightseeing",
      suitability: rainProb > 50 ? "Fair" : "Excellent",
      reason: rainProb > 50 
        ? "Challenging lightning and moisture hazards for camera rigs." 
        : "Superb dynamic range and light diffusion through scattered high clouds."
    }
  ];

  // 5. Weekly readiness scores
  const weeklyReadiness: DailyReadiness[] = (weatherData.daily?.time || []).map((time, idx) => {
    const max = weatherData.daily?.temperature_2m_max?.[idx] ?? 15;
    const rain = weatherData.daily?.precipitation_probability_max?.[idx] ?? 0;
    const wind = weatherData.daily?.wind_speed_10m_max?.[idx] ?? 0;

    // Compute basic readiness score
    let score = 100;
    
    // Deduct for rain
    score -= (rain * 0.4);
    
    // Deduct for extreme cold or heat
    if (max > 32) score -= (max - 32) * 4;
    if (max < 10) score -= (10 - max) * 3;
    
    // Deduct for wind
    if (wind > 20) score -= (wind - 20) * 1.5;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let label = "Favorable";
    let desc = "Optimal atmospheric variables for normal outdoor logistics.";
    if (score >= 85) {
      label = "Prime";
      desc = "Flawless day. High thermal comfort with minimal environmental hazards.";
    } else if (score < 50) {
      label = "Severe";
      desc = "Extreme variables. Prepare backups or remain sheltered.";
    } else if (score < 70) {
      label = "Challenging";
      desc = "Precipitation or temperature fluctuations could affect operations.";
    }

    return {
      date: formatDateStr(time),
      score,
      label,
      summary: desc
    };
  });

  return {
    summary,
    clothingAdvice: { essentials, footwear, tip },
    healthAlerts: { uvAlert, hydration, precautions },
    activities,
    weeklyReadiness
  };
}
