export interface CityGeocode {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

export interface ClothingAdvice {
  essentials: string[];
  footwear: string;
  tip: string;
}

export interface HealthAlerts {
  uvAlert: string;
  hydration: string;
  precautions: string[];
}

export interface ActivitySuitability {
  name: string;
  suitability: string; // e.g. "Excellent", "Good", "Fair", "Indoor Only"
  reason: string;
}

export interface DailyReadiness {
  date: string;
  score: number; // 0 to 100
  label: string; // e.g. "Prime", "Favorable", "Challenging", "Severe"
  summary: string;
}

export interface AIRecommendations {
  summary: string;
  clothingAdvice: ClothingAdvice;
  healthAlerts: HealthAlerts;
  activities: ActivitySuitability[];
  weeklyReadiness: DailyReadiness[];
}
