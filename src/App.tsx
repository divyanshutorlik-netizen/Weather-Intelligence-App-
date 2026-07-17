import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  MapPin, 
  Wind, 
  Droplets, 
  Sun, 
  CloudRain, 
  Compass, 
  Activity, 
  Info, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Calendar, 
  Shirt, 
  Heart, 
  Sunrise, 
  Sunset,
  ChevronRight,
  TrendingUp,
  CloudLightning,
  AlertTriangle,
  Lightbulb,
  X
} from "lucide-react";
import { CityGeocode, WeatherResponse, AIRecommendations } from "./types";
import { getWeatherCondition } from "./lib/weatherUtils";
import { getFallbackRecommendations } from "./lib/fallbackRecommendations";

const DEFAULT_CITIES: CityGeocode[] = [
  { id: 5128581, name: "New York", latitude: 40.7128, longitude: -74.006, country: "United States", country_code: "US" },
  { id: 1850147, name: "Tokyo", latitude: 35.6762, longitude: 139.6503, country: "Japan", country_code: "JP" },
  { id: 2643743, name: "London", latitude: 51.5074, longitude: -0.1278, country: "United Kingdom", country_code: "GB" },
  { id: 2988507, name: "Paris", latitude: 48.8566, longitude: 2.3522, country: "France", country_code: "FR" },
  { id: 2147714, name: "Sydney", latitude: -33.8688, longitude: 151.2093, country: "Australia", country_code: "AU" }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityGeocode>(DEFAULT_CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null);
  
  const [searchResults, setSearchResults] = useState<CityGeocode[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMode, setAiMode] = useState<"ai" | "rules">("ai");
  const [aiError, setAiError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside search listener to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Weather and Recommendations
  const fetchWeather = async (city: CityGeocode, modeOverride?: "ai" | "rules") => {
    setLoadingWeather(true);
    setAiError(null);
    try {
      // 1. Fetch real-time weather from proxy
      const weatherRes = await fetch(
        `/api/weather?latitude=${city.latitude}&longitude=${city.longitude}&timezone=${city.timezone || "auto"}`
      );
      if (!weatherRes.ok) {
        throw new Error("Failed to retrieve current weather metrics from server.");
      }
      const weatherJson: WeatherResponse = await weatherRes.ok ? await weatherRes.json() : null;
      if (!weatherJson) throw new Error("No weather data found.");

      setWeatherData(weatherJson);
      setLoadingWeather(false);

      // 2. Fetch AI Recommendations or rules fallback
      const activeMode = modeOverride || aiMode;
      if (activeMode === "ai") {
        setLoadingAI(true);
        try {
          const aiRes = await fetch("/api/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cityName: city.name,
              country: city.country,
              currentWeather: weatherJson.current,
              forecast: weatherJson.daily
            })
          });

          if (!aiRes.ok) {
            const errData = await aiRes.json();
            throw new Error(errData.error || "Failed to generate AI recommendations.");
          }

          const aiData: AIRecommendations = await aiRes.json();
          setAiRecommendations(aiData);
        } catch (err: any) {
          console.warn("AI generation failed, falling back to local engine:", err);
          setAiError(err.message || "Could not retrieve Gemini Intelligence.");
          // Fallback to rules-based automatically
          const fallbackData = getFallbackRecommendations(city.name, weatherJson.current, weatherJson.daily);
          setAiRecommendations(fallbackData);
        } finally {
          setLoadingAI(false);
        }
      } else {
        // Direct rules fallback mode
        const fallbackData = getFallbackRecommendations(city.name, weatherJson.current, weatherJson.daily);
        setAiRecommendations(fallbackData);
      }

    } catch (err: any) {
      console.error(err);
      setLoadingWeather(false);
      setLoadingAI(false);
    }
  };

  // Run on mount or when active city changes
  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  // Handle live search
  const handleSearchChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 2) {
      try {
        const res = await fetch(`/api/geocode?name=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            setSearchResults(data.results);
            setShowDropdown(true);
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const selectCity = (city: CityGeocode) => {
    setSelectedCity(city);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const toggleAiMode = (mode: "ai" | "rules") => {
    setAiMode(mode);
    if (weatherData) {
      fetchWeather(selectedCity, mode);
    }
  };

  // Helper for WMO wind direction
  const getWindDirectionStr = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const val = Math.floor((deg / 22.5) + 0.5);
    return directions[val % 16];
  };

  // Helper to format timestamps to readable strings
  const formatTimeStr = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateStr = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const currentCondition = weatherData 
    ? getWeatherCondition(weatherData.current.weather_code, weatherData.current.is_day === 1)
    : getWeatherCondition(0);

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1a1a19] font-sans antialiased selection:bg-amber-100 selection:text-amber-900 pb-16">
      
      {/* 1. HEADER SECTION */}
      <header className="border-b border-[#e2e2df] bg-white sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-900 text-white rounded-xl shadow-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Weather Intelligence</h1>
              <p className="text-xs text-neutral-500 font-medium">Precision meteorology & smart activity planning</p>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <div ref={searchRef} className="relative w-full md:max-w-md z-50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
              <input
                id="search-city-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search worldwide cities (e.g. Kyoto, Vancouver...)"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showDropdown && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                >
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => selectCity(city)}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="font-semibold text-neutral-800">{city.name}</span>
                        {city.admin1 && <span className="text-neutral-400 text-xs">({city.admin1})</span>}
                      </div>
                      {city.country && (
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full font-medium">
                          {city.country}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 2. CHIP NAVIGATION / FAVS BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider shrink-0 mr-1">Favorites:</span>
          {DEFAULT_CITIES.map((city) => {
            const isActive = selectedCity.id === city.id;
            return (
              <button
                key={city.id}
                id={`fav-city-${city.name.toLowerCase()}`}
                onClick={() => selectCity(city)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: WEATHER CURRENT METRICS & FORECAST */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* A. CURRENT WEATHER HERO CARD */}
          <section id="current-weather-card" className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col h-fit">
            {loadingWeather ? (
              <div className="p-8 animate-pulse flex flex-col gap-4">
                <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-24 bg-neutral-200 rounded w-full"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-neutral-200 rounded"></div>
                  <div className="h-10 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ) : weatherData ? (
              <div>
                {/* Condition-based gradient header */}
                <div className={`p-6 bg-gradient-to-br ${currentCondition.bgColor} text-white relative overflow-hidden transition-all duration-500`}>
                  <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-10 blur-xl w-60 h-60 bg-white rounded-full"></div>
                  
                  <div className="flex justify-between items-start z-10 relative">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-white/95" />
                        <h2 className="text-xl font-bold tracking-tight">{selectedCity.name}</h2>
                      </div>
                      <p className="text-xs text-white/85 font-medium mt-0.5">
                        {selectedCity.country || "Meteorological Station"}
                      </p>
                    </div>
                    <span className="text-xs bg-white/25 px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                      {weatherData.current.is_day === 1 ? "Day" : "Night"}
                    </span>
                  </div>

                  <div className="mt-8 flex items-end justify-between z-10 relative">
                    <div>
                      <div className="text-5xl font-black tracking-tighter flex items-start">
                        {Math.round(weatherData.current.temperature_2m)}
                        <span className="text-2xl font-light">°C</span>
                      </div>
                      <p className="text-sm font-semibold tracking-wide text-white/90 mt-1 flex items-center gap-1.5">
                        <currentCondition.icon className="w-5 h-5 shrink-0" />
                        {currentCondition.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/80">Feels like</p>
                      <p className="text-lg font-bold">{Math.round(weatherData.current.apparent_temperature)}°C</p>
                    </div>
                  </div>
                </div>

                {/* Key weather metrics grid */}
                <div className="p-6 grid grid-cols-2 gap-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Wind Speed</p>
                      <p className="text-sm font-bold text-neutral-800">{weatherData.current.wind_speed_10m} km/h</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Wind Dir</p>
                      <p className="text-sm font-bold text-neutral-800">
                        {weatherData.current.wind_direction_10m}° ({getWindDirectionStr(weatherData.current.wind_direction_10m)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Humidity</p>
                      <p className="text-sm font-bold text-neutral-800">{weatherData.current.relative_humidity_2m}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Cloud Cover</p>
                      <p className="text-sm font-bold text-neutral-800">{weatherData.current.cloud_cover}%</p>
                    </div>
                  </div>
                </div>

                {/* Day cycle details */}
                <div className="px-6 py-4 bg-neutral-50/50 flex justify-between text-xs text-neutral-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                    Sunrise: {formatTimeStr(weatherData.daily.sunrise[0])}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                    Sunset: {formatTimeStr(weatherData.daily.sunset[0])}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-neutral-400">No weather data found</div>
            )}
          </section>

          {/* B. 7-DAY FORECAST SECTION */}
          <section id="seven-day-forecast" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight uppercase text-neutral-400">7-Day Forecast</h3>
              <Calendar className="w-4 h-4 text-neutral-400" />
            </div>

            {loadingWeather ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-10 bg-neutral-100 rounded w-full"></div>
                ))}
              </div>
            ) : weatherData ? (
              <div className="flex flex-col gap-1.5">
                {weatherData.daily.time.map((time, idx) => {
                  const maxTemp = Math.round(weatherData.daily.temperature_2m_max[idx]);
                  const minTemp = Math.round(weatherData.daily.temperature_2m_min[idx]);
                  const rainProb = weatherData.daily.precipitation_probability_max[idx];
                  const code = weatherData.daily.weather_code[idx];
                  const dayCondition = getWeatherCondition(code, true);

                  return (
                    <div 
                      key={time} 
                      className="flex items-center justify-between py-2.5 px-3 hover:bg-neutral-50 rounded-xl transition-colors text-sm border border-transparent hover:border-neutral-100"
                    >
                      <div className="w-24 font-semibold text-neutral-700">
                        {idx === 0 ? "Today" : formatDateStr(time)}
                      </div>
                      
                      <div className="flex items-center gap-2.5 w-28 text-neutral-500">
                        <dayCondition.icon className={`w-4 h-4 shrink-0 ${dayCondition.accentColor}`} />
                        <span className="text-xs truncate font-medium">{dayCondition.description}</span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 text-xs text-neutral-400 font-semibold w-16">
                        {rainProb > 20 ? (
                          <span className="flex items-center text-blue-500 text-[10px] gap-0.5">
                            <CloudRain className="w-3 h-3" />
                            {rainProb}%
                          </span>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 font-semibold w-20 text-right">
                        <span className="text-neutral-800">{maxTemp}°</span>
                        <span className="text-neutral-400 font-medium text-xs">{minTemp}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

        </div>

        {/* RIGHT COLUMN (SPAN 2): AI WEATHER INTELLIGENCE PLANNING */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* AI SUITE CONTROLLER BAR */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-800">Meteorological Intelligence Engine</h3>
                <p className="text-[11px] text-neutral-500">Select model algorithm style for recommendations</p>
              </div>
            </div>

            <div className="flex bg-neutral-100 p-1.5 rounded-xl border border-neutral-200">
              <button
                id="ai-mode-gemini"
                onClick={() => toggleAiMode("ai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  aiMode === "ai"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                Gemini 3.5 AI
              </button>
              <button
                id="ai-mode-rules"
                onClick={() => toggleAiMode("rules")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  aiMode === "rules"
                    ? "bg-white text-neutral-800 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                Bespoke Rules
              </button>
            </div>
          </div>

          {/* AI CONTENT AREA */}
          <AnimatePresence mode="wait">
            {loadingAI ? (
              <motion.div 
                key="ai-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px] gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-800">Analyzing Atmospheric Conditions...</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mt-1">
                    Gemini AI is parsing temperature peaks, barometric gradients, and precipitation models to generate clothing and planning suggestions.
                  </p>
                </div>
              </motion.div>
            ) : aiRecommendations ? (
              <motion.div
                key="ai-content"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-8"
              >
                {/* 1. EDITORIAL SUMMARY BOX */}
                <section id="intelligence-summary" className="relative bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs overflow-hidden">
                  {/* Subtle decorative elements */}
                  <div className="absolute top-0 right-0 p-3">
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      Intelligence Summary
                    </span>
                  </div>
                  {aiError && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Offline Fallback Mode:</span> Could not connect to Gemini server. Displaying high-precision calculated recommendations instead. Add GEMINI_API_KEY in Secrets panel to unlock.
                      </div>
                    </div>
                  )}
                  <div className="max-w-2xl mt-4">
                    <p className="text-base font-medium text-neutral-800 leading-relaxed italic">
                      "{aiRecommendations.summary}"
                    </p>
                  </div>
                </section>

                {/* 2. CLOTHING & OUTDOOR ACTIVITIES BENTO ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Clothing Outfits Planner */}
                  <section id="clothing-planner" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                        <Shirt className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Outfits & Layering Planner</h4>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">Recommended Essentials</p>
                        <div className="flex flex-wrap gap-2">
                          {aiRecommendations.clothingAdvice.essentials.map((item, i) => (
                            <span 
                              key={i} 
                              className="px-3 py-1 bg-neutral-50 border border-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Footwear Guidance</p>
                        <p className="text-xs font-semibold text-neutral-700 bg-neutral-50 border border-neutral-100 p-3 rounded-xl">
                          {aiRecommendations.clothingAdvice.footwear}
                        </p>
                      </div>

                      <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                        <Lightbulb className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Atmospheric Style Tip</p>
                          <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{aiRecommendations.clothingAdvice.tip}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Health Alerts & Sun Safety */}
                  <section id="health-safety" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                        <Heart className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Health & Sun Safety</h4>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">UV Protection Alert</p>
                        <p className="text-xs font-semibold text-neutral-700 bg-rose-50/20 border border-rose-100/40 p-3 rounded-xl flex items-start gap-2">
                          <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{aiRecommendations.healthAlerts.uvAlert}</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Recommended Hydration Target</p>
                        <p className="text-xs font-semibold text-neutral-700 bg-blue-50/20 border border-blue-100/40 p-3 rounded-xl flex items-start gap-2">
                          <Droplets className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>{aiRecommendations.healthAlerts.hydration}</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">General Precautions</p>
                        <ul className="flex flex-col gap-1.5">
                          {aiRecommendations.healthAlerts.precautions.map((item, i) => (
                            <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                              <span className="text-rose-500 text-lg leading-none select-none">•</span>
                              <span className="font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                </div>

                {/* 3. ACTIVITY SUITABILITY INDEX */}
                <section id="activities-index" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                        <Activity className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Outdoor Activity Suitability</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiRecommendations.activities.map((act, i) => {
                      const isHighlyRec = act.suitability.toLowerCase().includes("highly");
                      const isIndoor = act.suitability.toLowerCase().includes("indoor");
                      
                      let badgeColor = "bg-neutral-100 text-neutral-700 border-neutral-200";
                      if (isHighlyRec) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      else if (isIndoor) badgeColor = "bg-rose-50 text-rose-700 border-rose-100";

                      return (
                        <div key={i} className="p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors bg-neutral-50/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-800">{act.name}</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${badgeColor}`}>
                                {act.suitability}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-2 leading-relaxed font-medium">
                              {act.reason}
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-2.5 border-t border-neutral-100 text-[11px] text-neutral-400 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>Best timing:</span>
                            <span className="text-neutral-700 lowercase font-semibold first-letter:uppercase">{act.bestTime}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 4. WEEKLY METEOROLOGICAL INTELLIGENCE TIMELINE */}
                <section id="weekly-timeline" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Outdoor Readiness Timeline</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {aiRecommendations.dailyIntelligence.map((day, idx) => {
                      const score = day.activityScore;
                      
                      let barColor = "bg-emerald-500";
                      let textColor = "text-emerald-700";
                      let ringBg = "bg-emerald-50";

                      if (score < 40) {
                        barColor = "bg-rose-500";
                        textColor = "text-rose-700";
                        ringBg = "bg-rose-50";
                      } else if (score < 70) {
                        barColor = "bg-amber-500";
                        textColor = "text-amber-700";
                        ringBg = "bg-amber-50";
                      }

                      return (
                        <div 
                          key={idx} 
                          className="flex flex-col items-center justify-between p-3.5 border border-neutral-100 hover:border-neutral-200 rounded-xl text-center bg-[#fbfbfa] transition-all hover:shadow-xs group relative"
                        >
                          <div>
                            <p className="text-xs font-bold text-neutral-700">{day.day}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">{formatDateStr(day.date)}</p>
                          </div>

                          <div className="my-4 relative flex items-center justify-center">
                            {/* Circular progress container */}
                            <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center ${ringBg} border border-neutral-100`}>
                              <span className={`text-base font-black ${textColor}`}>{score}</span>
                              <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-wider leading-none">Score</span>
                            </div>
                          </div>

                          <div className="w-full">
                            <p className="text-[10px] text-neutral-500 leading-tight line-clamp-2 font-semibold">
                              {day.briefRecommendation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </motion.div>
            ) : null}
          </AnimatePresence>

        </div>

      </main>

    </div>
  );
}
