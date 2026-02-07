import { useEffect, useRef } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, CloudLightning, Droplets, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useCarStatus, useWeather } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function weatherIcon(code: number, isDay: boolean) {
  if (code === 0) return Sun;
  if (code <= 3) return isDay ? Sun : Cloud;
  if (code <= 49) return CloudFog;
  if (code <= 59) return Droplets;
  if (code <= 69) return CloudRain;
  if (code <= 79) return CloudSnow;
  if (code <= 84) return CloudRain;
  if (code <= 94) return CloudSnow;
  return CloudLightning;
}

export function CarMap() {
  const { data: car, isLoading, error } = useCarStatus();
  const { locale, t } = useTranslation();
  const { data: weather } = useWeather(car?.latitude, car?.longitude);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!car || !car.latitude || !car.longitude || !mapRef.current) return;

    const lat = Number(car.latitude);
    const lon = Number(car.longitude);

    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS and initialize map
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lon], 16);

      // CartoDB Voyager tiles (free, no API key)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Custom marker
      const carIcon = L.divIcon({
        className: "car-marker",
        html: `<div style="
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([lat, lon], { icon: carIcon }).addTo(map);

      mapInstanceRef.current = map;
    };

    if (!(window as typeof window & { L?: unknown }).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [car?.latitude, car?.longitude]);

  // Update map view when position changes
  useEffect(() => {
    if (!car || !mapInstanceRef.current) return;
    const lat = Number(car.latitude);
    const lon = Number(car.longitude);
    mapInstanceRef.current.setView([lat, lon], 16);
  }, [car?.latitude, car?.longitude]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("map.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (error || !car || !car.latitude || !car.longitude) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("map.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm py-8">
          {t("car.loadError")}
        </CardContent>
      </Card>
    );
  }

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("map.title")}
          </CardTitle>
          {weather && (() => {
            const WIcon = weatherIcon(weather.weathercode, weather.is_day === 1);
            return (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <WIcon className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-bold text-foreground">{Math.round(weather.temperature)}°C</span>
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Wind className="h-2.5 w-2.5" />
                  {Math.round(weather.windspeed)} km/h
                </span>
              </div>
            );
          })()}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-48 rounded-md border overflow-hidden"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {t("map.lastUpdate")}: {new Date(car.last_update).toLocaleString(dateLocale)}
        </p>
      </CardContent>
    </Card>
  );
}
