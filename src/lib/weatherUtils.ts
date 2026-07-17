import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Sparkles,
  LucideIcon
} from "lucide-react";

export interface WeatherConditionInfo {
  description: string;
  icon: LucideIcon;
  bgColor: string; // Tailwind class for background gradient
  accentColor: string; // Base color class
  textColor: string;
}

export function getWeatherCondition(code: number, isDay: boolean = true): WeatherConditionInfo {
  // Map WMO codes
  switch (code) {
    case 0:
      return {
        description: "Clear Sky",
        icon: Sun,
        bgColor: isDay 
          ? "from-amber-400 via-orange-400 to-sky-500" 
          : "from-slate-900 via-indigo-950 to-slate-900",
        accentColor: "text-amber-500",
        textColor: "text-amber-600"
      };
    case 1:
    case 2:
    case 3:
      return {
        description: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast",
        icon: CloudSun,
        bgColor: isDay 
          ? "from-sky-400 via-blue-300 to-slate-200" 
          : "from-slate-800 via-slate-900 to-indigo-950",
        accentColor: "text-blue-400",
        textColor: "text-blue-500"
      };
    case 45:
    case 48:
      return {
        description: "Foggy",
        icon: CloudFog,
        bgColor: "from-slate-300 via-zinc-400 to-slate-500",
        accentColor: "text-zinc-500",
        textColor: "text-zinc-600"
      };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return {
        description: "Drizzle",
        icon: CloudDrizzle,
        bgColor: "from-blue-300 via-slate-400 to-sky-600",
        accentColor: "text-sky-400",
        textColor: "text-sky-500"
      };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return {
        description: code === 61 ? "Light Rain" : code === 63 ? "Moderate Rain" : "Heavy Rain",
        icon: CloudRain,
        bgColor: "from-slate-700 via-blue-800 to-slate-900",
        accentColor: "text-blue-500",
        textColor: "text-blue-400"
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        description: "Snowfall",
        icon: CloudSnow,
        bgColor: "from-sky-100 via-indigo-100 to-blue-200",
        accentColor: "text-sky-300",
        textColor: "text-sky-500"
      };
    case 80:
    case 81:
    case 82:
      return {
        description: "Rain Showers",
        icon: CloudRain,
        bgColor: "from-cyan-600 via-blue-700 to-slate-800",
        accentColor: "text-cyan-400",
        textColor: "text-cyan-500"
      };
    case 85:
    case 86:
      return {
        description: "Snow Showers",
        icon: CloudSnow,
        bgColor: "from-blue-200 via-slate-300 to-indigo-300",
        accentColor: "text-blue-300",
        textColor: "text-blue-400"
      };
    case 95:
    case 96:
    case 99:
      return {
        description: "Thunderstorm",
        icon: CloudLightning,
        bgColor: "from-indigo-950 via-slate-900 to-violet-950",
        accentColor: "text-violet-400",
        textColor: "text-violet-500"
      };
    default:
      return {
        description: "Unknown Weather",
        icon: Sparkles,
        bgColor: "from-slate-800 to-zinc-900",
        accentColor: "text-indigo-400",
        textColor: "text-indigo-500"
      };
  }
}
