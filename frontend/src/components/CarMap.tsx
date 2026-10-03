import { useEffect, useRef, useState } from "react";
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

export function CarMap({ carId = 1 }: { carId?: number }) {
  const { data: car, isLoading } = useCarStatus(carId);
  const { locale, t } = useTranslation();
  const { data: weather } = useWeather(car?.latitude, car?.longitude);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const hasPosition = Boolean(car?.latitude && car?.longitude);

  // Create the map once; position updates only move the marker (no rebuild/flicker)
  useEffect(() => {
    if (!hasPosition || !mapRef.current) return;

    let resizeObserver: ResizeObserver | undefined;

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
      }).setView([0, 0], 16);
      // +/- buttons, revealed on hover (see .car-map in index.css)
      L.control.zoom({ position: "topright" }).addTo(map);
      map.attributionControl.setPrefix(false);

      // OpenStreetMap tiles (free, no API key — attribution required by the OSM tile policy)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
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

      markerRef.current = L.marker([0, 0], { icon: carIcon }).addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);

      // The container height follows the grid row: tell Leaflet when it changes
      resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(mapRef.current);
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
      resizeObserver?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  }, [hasPosition]);

  // Follow the car: move the marker and pan smoothly, keeping the user's zoom level
  useEffect(() => {
    if (!mapReady || !car?.latitude || !car?.longitude) return;
    const latLng = [Number(car.latitude), Number(car.longitude)];
    markerRef.current.setLatLng(latLng);
    mapInstanceRef.current.panTo(latLng, { animate: true });
  }, [mapReady, car?.latitude, car?.longitude]);

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

  if (!car?.latitude || !car?.longitude) {
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
    <Card className="flex flex-col">
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
      {/* Map grows to fill the card when the row is taller (cards on a row share the same height) */}
      <CardContent className="flex flex-1 flex-col">
        <div
          ref={mapRef}
          // isolate: keeps Leaflet's internal z-indexes (400+) from covering dialogs and dropdowns
          className="car-map isolate w-full flex-1 min-h-48 rounded-md border overflow-hidden"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {t("map.lastUpdate")}: {new Date(car.last_update).toLocaleString(dateLocale)}
        </p>
      </CardContent>
    </Card>
  );
}
