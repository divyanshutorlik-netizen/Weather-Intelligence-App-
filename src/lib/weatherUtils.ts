import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle, 
  CloudFog, 
  LucideIcon 
} from "lucide-react";

export interface WeatherCondition {
  description: string;
  icon: LucideIcon;
  bgColor: string; // Tailwind class gradient
  accentColor: string; // text/border color
  cardBg: string;
}

export function getWeatherCondition(code: number, isDay: boolean = true): WeatherCondition {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) {
    return {
      description: "Clear sky",
      icon: Sun,
      bgColor: isDay 
        ? "from-amber-400 to-orange-500" 
        : "from-slate-800 to-indigo-950",
      accentColor: "text-amber-500",
      cardBg: "bg-amber-50/10"
    };
  }
  
  if (code === 1 || code === 2 || code === 3) {
    return {
      description: code === 1 ? "Mainly clear" : code === 2 ? "Partly cloudy" : "Overcast",
      icon: Cloud,
      bgColor: isDay 
        ? "from-sky-400 to-blue-500" 
        : "from-slate-700 to-slate-900",
      accentColor: "text-blue-400",
      cardBg: "bg-blue-50/10"
    };
  }

  if (code === 45 || code === 48) {
    return {
      description: code === 45 ? "Foggy" : "Depositing rime fog",
      icon: CloudFog,
      bgColor: "from-zinc-400 to-slate-500",
      accentColor: "text-zinc-500",
      cardBg: "bg-zinc-50/10"
    };
  }

  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) {
    return {
      description: "Drizzle",
      icon: CloudDrizzle,
      bgColor: "from-cyan-400 to-sky-600",
      accentColor: "text-cyan-500",
      cardBg: "bg-cyan-50/10"
    };
  }

  if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67 || code === 80 || code === 81 || code === 82) {
    return {
      description: "Rainy",
      icon: CloudRain,
      bgColor: "from-blue-500 to-indigo-600",
      accentColor: "text-blue-500",
      cardBg: "bg-blue-50/10"
    };
  }

  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return {
      description: "Snowy",
      icon: CloudSnow,
      bgColor: "from-sky-300 to-blue-400",
      accentColor: "text-sky-400",
      cardBg: "bg-sky-50/10"
    };
  }

  if (code === 95 || code === 96 || code === 99) {
    return {
      description: "Thunderstorm",
      icon: CloudLightning,
      bgColor: "from-purple-600 to-indigo-900",
      accentColor: "text-purple-500",
      cardBg: "bg-purple-50/10"
    };
  }

  return {
    description: "Unknown",
    icon: Cloud,
    bgColor: "from-neutral-400 to-neutral-600",
    accentColor: "text-neutral-500",
    cardBg: "bg-neutral-50/10"
  };
}

export function getWindDirectionStr(degree: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((degree % 360) / 22.5)) % 16;
  return directions[index];
}

export function formatDateStr(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function formatTimeStr(timeStr: string): string {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
