import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Compass,
  Sunrise,
  Sunset,
  Calendar,
  Droplets,
  Activity,
  Heart,
  Shirt,
  Cpu,
  Sparkles,
  MapPin,
  Search,
  AlertTriangle,
  Lightbulb,
  X,
  RefreshCw,
  Clock
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { CityGeocode, WeatherResponse, AIRecommendations } from "./types";
import { getWeatherCondition, getWindDirectionStr, formatDateStr, formatTimeStr } from "./lib/weatherUtils";
import { getWeatherRecommendations } from "./lib/weatherRecommendations";

// Preset favorite cities for instant navigation
const FAVORITE_CITIES: CityGeocode[] = [
  { id: 2643743, name: "London", latitude: 51.5085, longitude: -0.1257, country: "United Kingdom", country_code: "GB" },
  { id: 5128581, name: "New York", latitude: 40.7143, longitude: -74.006, country: "United States", country_code: "US" },
  { id: 1850147, name: "Tokyo", latitude: 35.6895, longitude: 139.6917, country: "Japan", country_code: "JP" },
  { id: 2147714, name: "Sydney", latitude: -33.8679, longitude: 151.2073, country: "Australia", country_code: "AU" },
  { id: 2867714, name: "Munich", latitude: 48.1374, longitude: 11.5755, country: "Germany", country_code: "DE" },
  { id: 2988507, name: "Paris", latitude: 48.8534, longitude: 2.3488, country: "France", country_code: "FR" }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityGeocode[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityGeocode>(FAVORITE_CITIES[0]);
  
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null);
  
  // Loaders
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Chart Category States ("temp" for Temperature metrics, "rain" for Moisture/Rain metrics)
  const [chartMetric, setChartMetric] = useState<"temp" | "rain">("temp");

  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initial weather load
  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  // Fetch Weather and Recommendations
  const fetchWeather = async (city: CityGeocode) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      // 1. Fetch weather via absolute Open-Meteo URL directly from frontend
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,cloud_cover&hourly=temperature_2m,apparent_temperature,precipitation_probability,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=auto`
      );
      if (!weatherRes.ok) {
        throw new Error("Failed to retrieve current weather metrics from the meteorological server.");
      }
      const weatherJson: WeatherResponse = await weatherRes.json();
      if (!weatherJson || !weatherJson.current || !weatherJson.daily) {
        throw new Error("No robust weather data payload was found.");
      }

      setWeatherData(weatherJson);
      
      // Calculate high-precision weather planning recommendations instantly on-device
      const recs = getWeatherRecommendations(weatherJson);
      setAiRecommendations(recs);
      setLoadingWeather(false);

    } catch (err: any) {
      console.error(err);
      setWeatherError(err.message || "Could not connect to the meteorological station. Please check your network.");
      setLoadingWeather(false);
    }
  };

  // Live query search with debounce logic
  const handleSearchChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchError(null);

    if (val.trim().length > 2) {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=5&language=en&format=json`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setSearchResults(data.results);
            setShowDropdown(true);
          } else {
            setSearchError(`No locations matching "${val}" were found.`);
            setShowDropdown(true);
          }
        } else {
          setSearchError("Failed to fetch geocoding data from the server.");
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
        setSearchError("Error searching for cities. Check your connectivity.");
        setShowDropdown(true);
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
    setSearchError(null);
  };

  const currentCondition = weatherData
    ? getWeatherCondition(weatherData.current.weather_code, weatherData.current.is_day === 1)
    : getWeatherCondition(0);

  // Transform hourly weather data into Recharts friendly format
  const getHourlyChartData = () => {
    if (!weatherData || !weatherData.hourly) return [];
    
    // Return first 24 hours of data
    return weatherData.hourly.time.slice(0, 24).map((timeStr, idx) => {
      const date = new Date(timeStr);
      const timeLabel = date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      return {
        name: timeLabel,
        temperature: Math.round(weatherData.hourly.temperature_2m[idx]),
        feelsLike: Math.round(weatherData.hourly.apparent_temperature[idx]),
        precipitationProb: weatherData.hourly.precipitation_probability[idx],
        humidity: weatherData.hourly.relative_humidity_2m[idx]
      };
    });
  };

  const chartData = getHourlyChartData();

  // Dynamic Outfit Card Styling (Based on average max forecast temperature)
  const getClothingCardStyles = () => {
    if (!weatherData) return { bg: "bg-white", border: "border-neutral-200", badge: "bg-amber-50 text-amber-700" };
    const avgMax = weatherData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / 7;
    
    if (avgMax > 26) {
      return {
        bg: "bg-amber-50/30",
        border: "border-amber-100",
        badge: "bg-amber-100 text-amber-800"
      };
    } else if (avgMax < 11) {
      return {
        bg: "bg-sky-50/20",
        border: "border-sky-100",
        badge: "bg-sky-100 text-sky-800"
      };
    }
    return {
      bg: "bg-emerald-50/10",
      border: "border-emerald-100/50",
      badge: "bg-emerald-50 text-emerald-800"
    };
  };

  // Dynamic Health Card Styling
  const getHealthCardStyles = () => {
    if (!weatherData) return { bg: "bg-white", border: "border-neutral-200" };
    const maxUV = Math.max(...weatherData.daily.uv_index_max);
    
    if (maxUV >= 7) {
      return {
        bg: "bg-rose-50/20",
        border: "border-rose-100",
        header: "text-rose-800",
        badge: "bg-rose-100 text-rose-800"
      };
    }
    return {
      bg: "bg-blue-50/15",
      border: "border-blue-100/50",
      header: "text-blue-800",
      badge: "bg-blue-50 text-blue-800"
    };
  };

  const clothingStyle = getClothingCardStyles();
  const healthStyle = getHealthCardStyles();

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1a1a19] font-sans antialiased selection:bg-amber-100 selection:text-amber-900 pb-16">
      
      {/* 1. TOP BRANDING BAR */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-black tracking-tight text-lg">
              W
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-neutral-900">
                Weather Intelligence
              </h1>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                ATMOSPHERIC INSIGHTS & PLANNING COGNITION
              </p>
            </div>
          </div>
          
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Met Station Status</p>
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Operational Feed
            </p>
          </div>
        </div>
      </header>

      {/* 2. CONTROL HUB: SEARCH & FAVORITES */}
      <div className="bg-white border-b border-neutral-200 py-6 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Autocomplete Search input */}
          <div className="lg:col-span-1 relative" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search microclimate station (e.g. London, Munich...)"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-neutral-800 rounded-xl text-xs font-semibold tracking-wide transition-all outline-hidden placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Suggestions & Search Feedback Dropdown */}
            <AnimatePresence>
              {showDropdown && (searchResults.length > 0 || searchError) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto z-40"
                >
                  {searchError ? (
                    <div className="p-4 text-center text-xs text-neutral-500 font-medium flex flex-col items-center gap-1">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      {searchError}
                    </div>
                  ) : (
                    searchResults.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => selectCity(city)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex items-center justify-between transition-colors cursor-pointer"
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
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Favorites quick links */}
          <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mr-2">
              QUICK PINS
            </span>
            {FAVORITE_CITIES.map((city) => {
              const isActive = selectedCity.id === city.id;
              return (
                <button
                  key={city.id}
                  onClick={() => selectCity(city)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300"
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. CORE CONTENT AREA */}
      {weatherError ? (
        <div className="max-w-xl mx-auto mt-16 px-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm text-center flex flex-col items-center gap-5">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-800">Connection Interrupted</h3>
              <p className="text-sm text-neutral-500 mt-2">
                {weatherError}
              </p>
            </div>
            <button 
              onClick={() => fetchWeather(selectedCity)}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: WEATHER CURRENT METRICS & FORECAST */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* A. CURRENT WEATHER HERO CARD */}
            <section id="current-weather-card" className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col h-fit animate-fade-in">
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
                          <currentCondition.icon className="w-5 h-5 shrink-0 animate-bounce" />
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

          {/* RIGHT COLUMN (SPAN 2): INTERACTIVE CHARTS & AI WEATHER PLANNING */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* HOURLY ATMOSPHERIC TRENDS (RECHARTS INTERACTIVE CHART) */}
            <section id="hourly-atmospheric-trends" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">24-Hour Microclimate Trends</h3>
                    <p className="text-[11px] text-neutral-400 font-semibold">Interactive charting of upcoming atmospheric metrics</p>
                  </div>
                </div>

                <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 w-fit self-start sm:self-auto">
                  <button
                    onClick={() => setChartMetric("temp")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartMetric === "temp"
                        ? "bg-white text-neutral-800 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Temperature
                  </button>
                  <button
                    onClick={() => setChartMetric("rain")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartMetric === "rain"
                        ? "bg-white text-neutral-800 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Rain & Humidity
                  </button>
                </div>
              </div>

              {loadingWeather ? (
                <div className="h-64 bg-neutral-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-neutral-400">
                  Rendering interactive microclimate canvas...
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-64 w-full text-xs font-medium">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorFeels" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1ef" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#a3a3a1" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis 
                        stroke="#a3a3a1" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dx={-8}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#1a1a19", 
                          borderColor: "#1a1a19", 
                          borderRadius: "12px", 
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                      {chartMetric === "temp" ? (
                        <>
                          <Area 
                            type="monotone" 
                            dataKey="temperature" 
                            name="Temp (°C)" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorTemp)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="feelsLike" 
                            name="Feels Like (°C)" 
                            stroke="#3b82f6" 
                            strokeWidth={1.5}
                            fillOpacity={1} 
                            fill="url(#colorFeels)" 
                          />
                        </>
                      ) : (
                        <>
                          <Area 
                            type="monotone" 
                            dataKey="precipitationProb" 
                            name="Rain Prob (%)" 
                            stroke="#06b6d4" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorRain)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="humidity" 
                            name="Humidity (%)" 
                            stroke="#10b981" 
                            strokeWidth={1.5}
                            fillOpacity={1} 
                            fill="url(#colorHumid)" 
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </section>

            {/* ATMOSPHERIC INTELLIGENCE ENGINE */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-950 text-white rounded-xl flex items-center justify-center">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Weather Planning Intelligence</h3>
                  <p className="text-[11px] text-neutral-500 font-medium">High-precision computed recommendations and environmental safety analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Secure Offline Model
              </div>
            </div>

            {/* INTEL CONTENT AREA */}
            <AnimatePresence mode="wait">
              {aiRecommendations ? (
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
                    <div className="absolute top-0 right-0 p-3">
                      <span className="text-[10px] bg-neutral-900 text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        Intelligence Summary
                      </span>
                    </div>
                    <div className="max-w-2xl mt-4">
                      <p className="text-sm font-semibold text-neutral-700 leading-relaxed italic">
                        "{aiRecommendations.summary}"
                      </p>
                    </div>
                  </section>

                  {/* 2. CLOTHING & OUTDOOR ACTIVITIES BENTO ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Clothing Outfits Planner */}
                    <section id="clothing-planner" className={`rounded-2xl border p-6 shadow-sm flex flex-col gap-5 transition-all ${clothingStyle.bg} ${clothingStyle.border}`}>
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-neutral-900/5 text-neutral-800 rounded-lg">
                            <Shirt className="w-4.5 h-4.5" />
                          </div>
                          <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Outfits & Layering</h4>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${clothingStyle.badge}`}>
                          THERMAL ACCLIMATIZATION
                        </span>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">Recommended Essentials</p>
                          <div className="flex flex-wrap gap-1.5">
                            {aiRecommendations.clothingAdvice.essentials.map((item, i) => (
                              <span 
                                key={i} 
                                className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
                              >
                                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Footwear Guidance</p>
                          <p className="text-xs font-semibold text-neutral-700 bg-white border border-neutral-100 p-3 rounded-xl shadow-2xs leading-relaxed">
                            {aiRecommendations.clothingAdvice.footwear}
                          </p>
                        </div>

                        <div className="mt-2 p-3 bg-white/60 border border-neutral-100 rounded-xl flex items-start gap-2.5">
                          <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Atmospheric Style Tip</p>
                            <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed font-semibold">{aiRecommendations.clothingAdvice.tip}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Health Alerts & Sun Safety */}
                    <section id="health-safety" className={`rounded-2xl border p-6 shadow-sm flex flex-col gap-5 transition-all ${healthStyle.bg} ${healthStyle.border}`}>
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-neutral-900/5 text-neutral-800 rounded-lg">
                            <Heart className="w-4.5 h-4.5" />
                          </div>
                          <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Clinical Health & Sun Safety</h4>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${healthStyle.badge}`}>
                          BIOCLIMATIC ALERT
                        </span>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">UV Protection Alert</p>
                          <p className="text-xs font-semibold text-neutral-700 bg-white border border-neutral-100 p-3 rounded-xl flex items-start gap-2 shadow-2xs leading-relaxed">
                            <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>{aiRecommendations.healthAlerts.uvAlert}</span>
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Recommended Hydration Target</p>
                          <p className="text-xs font-semibold text-neutral-700 bg-white border border-neutral-100 p-3 rounded-xl flex items-start gap-2 shadow-2xs leading-relaxed">
                            <Droplets className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <span>{aiRecommendations.healthAlerts.hydration}</span>
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">General Precautions</p>
                          <ul className="flex flex-col gap-2">
                            {aiRecommendations.healthAlerts.precautions.map((item, i) => (
                              <li key={i} className="text-xs text-neutral-600 flex items-start gap-2 font-semibold">
                                <span className="text-rose-500 text-lg leading-none select-none">•</span>
                                <span className="leading-relaxed">{item}</span>
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
                        <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Outdoor Activity Suitability Index</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiRecommendations.activities.map((act, i) => {
                        const isHighlyRec = act.suitability.toLowerCase().includes("highly") || act.suitability.toLowerCase().includes("excellent");
                        const isIndoor = act.suitability.toLowerCase().includes("indoor") || act.suitability.toLowerCase().includes("challenging");
                        
                        let badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                        if (isHighlyRec) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        else if (isIndoor) badgeColor = "bg-rose-50 text-rose-700 border-rose-100";

                        return (
                          <div key={i} className="p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors bg-neutral-50/30 flex flex-col justify-between shadow-2xs">
                            <div>
                              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2 mb-2">
                                <span className="text-xs font-bold text-neutral-800">{act.name}</span>
                                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${badgeColor}`}>
                                  {act.suitability}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                                {act.reason}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* 4. WEEKLY OUTDOOR READINESS TIMELINE */}
                  <section id="weekly-readiness-timeline" className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-6">
                    <div className="border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Weekly Outdoor Readiness Forecast</h4>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {aiRecommendations.weeklyReadiness.map((day, idx) => {
                        // Color ranges for score
                        let scoreColor = "text-emerald-600 bg-emerald-50";
                        let progressColor = "bg-emerald-500";
                        
                        if (day.score < 55) {
                          scoreColor = "text-rose-600 bg-rose-50";
                          progressColor = "bg-rose-500";
                        } else if (day.score < 80) {
                          scoreColor = "text-amber-600 bg-amber-50";
                          progressColor = "bg-amber-500";
                        }

                        return (
                          <div 
                            key={idx} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 hover:bg-neutral-50/50 transition-all gap-4"
                          >
                            <div className="flex items-center gap-4">
                              {/* Radial Score Indicator */}
                              <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${scoreColor}`}>
                                <span className="text-[10px] text-neutral-400 font-bold tracking-tighter leading-none">SCORE</span>
                                <span className="text-sm font-black tracking-tight">{day.score}</span>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-neutral-800">{day.date}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wide border border-transparent ${scoreColor}`}>
                                    {day.label}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 font-semibold leading-relaxed">
                                  {day.summary}
                                </p>
                              </div>
                            </div>

                            {/* Progress Visual Bar */}
                            <div className="w-full sm:w-32 bg-neutral-100 h-2 rounded-full overflow-hidden shrink-0">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ${progressColor}`} 
                                style={{ width: `${day.score}%` }}
                              ></div>
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
      )}

    </div>
  );
}
