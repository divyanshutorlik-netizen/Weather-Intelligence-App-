export interface CityGeocode {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  country_code?: string;
  timezone?: string;
}

export interface CurrentWeatherData {
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
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
}

export interface DailyWeatherData {
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
}

export interface HourlyWeatherData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  uv_index: number[];
  wind_speed_10m: number[];
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: Record<string, string>;
  current: CurrentWeatherData;
  hourly_units: Record<string, string>;
  hourly: HourlyWeatherData;
  daily_units: Record<string, string>;
  daily: DailyWeatherData;
}

export interface AIClothingAdvice {
  essentials: string[];
  footwear: string;
  tip: string;
}

export interface AIActivity {
  name: string;
  suitability: "Highly Recommended" | "Suitable" | "Indoor Only" | string;
  bestTime: string;
  reason: string;
}

export interface AIHealthAlerts {
  uvAlert: string;
  hydration: string;
  precautions: string[];
}

export interface AIDailyIntelligence {
  day: string;
  date: string;
  activityScore: number;
  briefRecommendation: string;
}

export interface AIRecommendations {
  summary: string;
  clothingAdvice: AIClothingAdvice;
  activities: AIActivity[];
  healthAlerts: AIHealthAlerts;
  dailyIntelligence: AIDailyIntelligence[];
}
