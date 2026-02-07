import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, CloudLightning, Wind, Droplets } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useWeather, useCarStatus } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function weatherInfo(code: number, isDay: boolean) {
  if (code === 0) return { icon: Sun, label: "Ciel degagé", labelEn: "Clear sky" };
  if (code <= 3) return { icon: isDay ? Sun : Cloud, label: "Partiellement nuageux", labelEn: "Partly cloudy" };
  if (code <= 49) return { icon: CloudFog, label: "Brouillard", labelEn: "Fog" };
  if (code <= 59) return { icon: Droplets, label: "Bruine", labelEn: "Drizzle" };
  if (code <= 69) return { icon: CloudRain, label: "Pluie", labelEn: "Rain" };
  if (code <= 79) return { icon: CloudSnow, label: "Neige", labelEn: "Snow" };
  if (code <= 84) return { icon: CloudRain, label: "Averses", labelEn: "Showers" };
  if (code <= 94) return { icon: CloudSnow, label: "Averses neige", labelEn: "Snow showers" };
  return { icon: CloudLightning, label: "Orage", labelEn: "Thunderstorm" };
}

export function WeatherCard() {
  const { data: car } = useCarStatus();
  const { data: weather, isLoading } = useWeather(car?.latitude, car?.longitude);
  const { locale } = useTranslation();

  if (isLoading || !weather) return null;

  const info = weatherInfo(weather.weathercode, weather.is_day === 1);
  const Icon = info.icon;
  const label = locale === "fr" ? info.label : info.labelEn;

  return (
    <Card>
      <CardContent className="py-2 px-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-400 shrink-0" />
          <span className="text-sm font-bold">{Math.round(weather.temperature)}°C</span>
          <span className="text-[10px] text-muted-foreground truncate flex-1">{label}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Wind className="h-2.5 w-2.5" />
            {Math.round(weather.windspeed)} km/h
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
