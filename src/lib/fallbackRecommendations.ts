import { AIRecommendations, CurrentWeatherData, DailyWeatherData } from "../types";

export function getFallbackRecommendations(
  cityName: string,
  current: CurrentWeatherData,
  daily: DailyWeatherData
): AIRecommendations {
  const avgMaxTemp = daily.temperature_2m_max.reduce((a, b) => a + b, 0) / daily.temperature_2m_max.length;
  const maxRainProb = Math.max(...daily.precipitation_probability_max);
  const maxUV = Math.max(...daily.uv_index_max);
  const maxWind = Math.max(...daily.wind_speed_10m_max);

  // 1. Clothing advice
  const essentials: string[] = [];
  let footwear = "Comfortable walking shoes";
  let tip = "Dress in lightweight layers to stay comfortable throughout the day.";

  if (avgMaxTemp > 25) {
    essentials.push("Lightweight cotton t-shirt", "Sunglasses", "Sun cap");
    footwear = "Breathable mesh sneakers or sandals";
    tip = "Stick to light-colored, breathable fabrics. Keep sunglasses handy.";
  } else if (avgMaxTemp < 10) {
    essentials.push("Heavy insulated coat", "Thermal base layer", "Warm wool beanie", "Gloves");
    footwear = "Warm insulated boots";
    tip = "Ensure a windproof outer shell to trap heat. Three layers recommended.";
  } else {
    essentials.push("Light jacket or windbreaker", "Long-sleeve shirt", "Comfortable pants");
    footwear = "Standard leather sneakers or closed shoes";
    tip = "A simple cardigans or light jacket will protect from moderate evening wind.";
  }

  if (maxRainProb > 50) {
    essentials.push("Compact umbrella", "Waterproof rain jacket");
    footwear = "Water-resistant boots or sneakers";
    tip = "Add a waterproof outer layer; carrying a travel umbrella is highly recommended today.";
  }

  // 2. Activities
  const activities = [
    {
      name: "Running & Jogging",
      suitability: avgMaxTemp > 30 ? "Indoor Only" : maxRainProb > 70 ? "Indoor Only" : "Highly Recommended",
      bestTime: avgMaxTemp > 25 ? "Early morning (6 AM - 8 AM)" : "Late afternoon",
      reason: avgMaxTemp > 30 ? "Temperatures are too high for safe outdoor cardio." : maxRainProb > 70 ? "High probability of rainfall." : "Moderate temperatures and clear tracks make this perfect."
    },
    {
      name: "Hiking & Cycling",
      suitability: maxRainProb > 40 || maxWind > 35 ? "Suitable" : "Highly Recommended",
      bestTime: "Mid-morning",
      reason: maxWind > 35 ? "Gusty winds may make cycling difficult." : maxRainProb > 40 ? "Slippery trails; check local forecasts before setting out." : "Excellent weather with clear views and safe, dry ground."
    },
    {
      name: "Museums & Indoor Dining",
      suitability: maxRainProb > 60 || avgMaxTemp < 5 ? "Highly Recommended" : "Suitable",
      bestTime: "Anytime",
      reason: maxRainProb > 60 ? "Great way to spend a rainy, grey day comfortable indoors." : "Perfect indoor escape from cold temperatures."
    },
    {
      name: "Photography & Sightseeing",
      suitability: maxRainProb > 50 ? "Suitable" : "Highly Recommended",
      bestTime: "Golden hour (near sunrise or sunset)",
      reason: maxRainProb > 50 ? "Cloudy skies can yield unique ambient light, but carry protective gear for cameras." : "Clear skies and moderate wind guarantee sharp outdoor landscape shots."
    }
  ];

  // 3. Health & Sun Safety
  let uvAlert = "Low UV radiation. No special precautions needed.";
  if (maxUV >= 8) {
    uvAlert = "Very High UV index! Wear SPF 50+ sunscreen, a wide-brim hat, and limit direct sun between 11 AM and 4 PM.";
  } else if (maxUV >= 3) {
    uvAlert = "Moderate UV index. Apply SPF 30+ sunscreen if spending more than 20 minutes outdoors.";
  }

  let hydration = "Standard hydration (1.5 - 2 liters of water daily).";
  if (avgMaxTemp > 28) {
    hydration = "High perspiration likely. Drink at least 2.5 - 3 liters of fluids, including electrolyte-replenishing drinks.";
  }

  const precautions: string[] = [];
  if (maxRainProb > 50) precautions.push("Carry a raincoat or compact umbrella.");
  if (maxWind > 25) precautions.push("Secure loose items and wear windbreaker clothing.");
  if (avgMaxTemp < 8) precautions.push("Protect extremities from cold wind gusts.");
  if (maxUV > 6) precautions.push("Seek shade during intense midday hours.");
  if (precautions.length === 0) precautions.push("No severe meteorological warnings active. Enjoy the beautiful day!");

  // 4. Daily Intelligence timeline
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dailyIntelligence = daily.time.map((timeStr, index) => {
    const dateObj = new Date(timeStr);
    const dayName = daysOfWeek[dateObj.getDay()];
    const code = daily.weather_code[index];
    const maxTemp = daily.temperature_2m_max[index];
    const rainProb = daily.precipitation_probability_max[index];
    const windSpeed = daily.wind_speed_10m_max[index];

    // Simple outdoor activity score calculation (start at 100, deduct for bad factors)
    let score = 100;
    
    // Temp penalty
    if (maxTemp > 32) score -= (maxTemp - 32) * 4;
    else if (maxTemp < 10) score -= (10 - maxTemp) * 3;

    // Rain penalty
    score -= (rainProb / 100) * 40;

    // Wind penalty
    if (windSpeed > 20) score -= (windSpeed - 20) * 1;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let briefRecommendation = "Great conditions for outdoor plans!";
    if (score < 40) {
      briefRecommendation = "Poor weather. Ideal for warm indoor activities.";
    } else if (score < 70) {
      briefRecommendation = "Fair conditions. Be mindful of occasional clouds or breeze.";
    }

    return {
      day: dayName,
      date: timeStr,
      activityScore: score,
      briefRecommendation
    };
  });

  return {
    summary: `Generally ${avgMaxTemp > 22 ? "warm" : avgMaxTemp < 10 ? "cold" : "moderate"} conditions expected across ${cityName} for the coming week. The highest rain chance is around ${maxRainProb}%.`,
    clothingAdvice: { essentials, footwear, tip },
    activities,
    healthAlerts: { uvAlert, hydration, precautions },
    dailyIntelligence
  };
}
