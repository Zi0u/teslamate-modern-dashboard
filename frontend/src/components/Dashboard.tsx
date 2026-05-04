import { Battery, BatteryLow, BatteryMedium, BatteryFull, EvCharger, Car, Cpu, Languages, HelpCircle, Settings, MapPin, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useCarStatus, useCars, useGrafanaUrl } from "../hooks/useApi";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Tooltip } from "./ui/tooltip";
import { CarMap } from "./CarMap";
import { MonthlyStats } from "./MonthlyStats";
import { DriveHeatmap } from "./DriveHeatmap";
import { RecentDrives } from "./RecentDrives";
import { TopDestinations } from "./TopDestinations";
import { BatteryChart } from "./BatteryChart";
import { BatteryHealthGauge } from "./BatteryHealthGauge";
import { LastChargeCard } from "./LastChargeCard";
import { GrafanaNav } from "./GrafanaNav";
import type { TranslationKey } from "../i18n/translations";

const pillStyle =
  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground whitespace-nowrap";

const stateVariants: Record<string, "success" | "secondary" | "info" | "warning" | "destructive"> = {
  online: "success",
  asleep: "secondary",
  driving: "info",
  charging: "warning",
  suspended: "secondary",
  offline: "destructive",
};

function batteryColor(level: number) {
  if (level >= 20) return "text-emerald-400";
  if (level >= 10) return "text-amber-400";
  return "text-red-400";
}

function BatteryIcon({ level, className }: { level: number; className?: string }) {
  if (level >= 75) return <BatteryFull className={className} />;
  if (level >= 50) return <BatteryMedium className={className} />;
  if (level >= 25) return <BatteryLow className={className} />;
  return <Battery className={className} />;
}

function HelpDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center rounded-lg border h-9 w-9 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border bg-card shadow-lg z-50 p-1">
          <a
            href="https://github.com/teslamate-org/teslamate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-end gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-md"
          >
            GitHub
            <img src="/logo-github.png" alt="GitHub" className="h-4 w-4 rounded-sm bg-white p-[1px]" />
          </a>
          <a
            href="https://docs.teslamate.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-end gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-md"
          >
            Documentation
            <img src="/logo_doc.svg" alt="Docs" className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}

function CarSelector({ cars, selectedId, onSelect }: {
  cars: { id: number; name: string | null; model: string | null; marketing_name: string | null }[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = cars.find((c) => c.id === selectedId) ?? cars[0];
  const longestName = cars.reduce((a, c) => {
    const name = c.name ?? `Model ${c.model}`;
    return name.length > a.length ? name : a;
  }, "");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`${pillStyle} transition-colors hover:bg-muted hover:text-foreground`}
      >
        <Car className="h-4 w-4" />
        <span className="relative">
          <span className="invisible">{longestName}</span>
          <span className="absolute inset-0">{selected?.name ?? `Model ${selected?.model}`}</span>
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-full rounded-lg border bg-card shadow-lg z-50 p-1 space-y-0.5">
          {cars.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left
                ${c.id === selectedId
                  ? "bg-primary/10 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
            >
              <Car className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.name ?? `Model ${c.model}`}</span>
              <span className="text-xs opacity-60 shrink-0">M{c.model}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { locale, toggle, t } = useTranslation();
  const { data: cars } = useCars();
  const [selectedCarId, setSelectedCarId] = useState<number>(1);
  const { data: car, isLoading } = useCarStatus(selectedCarId);
  const { data: settingsData } = useGrafanaUrl();

  useEffect(() => {
    if (cars && cars.length > 0 && !cars.find((c) => c.id === selectedCarId)) {
      setSelectedCarId(cars[0].id);
    }
  }, [cars, selectedCarId]);

  const stateKey = car ? (`state.${car.state}` as TranslationKey) : undefined;
  const stateLabel = stateKey ? t(stateKey) : "";
  const stateVariant = car ? (stateVariants[car.state] ?? "secondary") : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Top row on mobile / Left on desktop: title + car info */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              TeslaMate Modern Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : car ? (
                <>
                  <span className="text-sm text-muted-foreground truncate">
                    {car.name ?? "Tesla"} — Model {car.model} {car.marketing_name ?? ""}
                  </span>
                  <Badge variant={stateVariant} className="text-xs">
                    {stateLabel}
                  </Badge>
                  {car.demo_mode && (
                    <a
                      href="https://github.com/Zi0u/teslamate-modern-dashboard#teslamate-modern-dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground no-underline"
                    >
                      <img src="/logo-github.png" alt="GitHub" className="h-3.5 w-3.5 rounded-sm bg-white p-[1px]" />
                      {t("demo.install")}
                    </a>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Bottom row on mobile / Right on desktop: all pills scrollable together */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {cars && cars.length > 1 && (
              <CarSelector cars={cars} selectedId={selectedCarId} onSelect={setSelectedCarId} />
            )}
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </>
            ) : car ? (
              <>
                {/* Range */}
                <div className={pillStyle}>
                  <EvCharger className="h-4 w-4" />
                  {Math.round(car.ideal_battery_range_km)} km
                </div>

                {/* Battery */}
                <div className={pillStyle}>
                  <BatteryIcon level={car.battery_level} className={`h-4 w-4 ${batteryColor(car.battery_level)}`} />
                  <span className={batteryColor(car.battery_level)}>
                    {car.battery_level}%
                  </span>
                </div>

                {/* Odometer */}
                <div className={pillStyle}>
                  <Car className="h-4 w-4" />
                  {Math.round(car.odometer).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB")} km
                </div>

                {/* Firmware */}
                {car.firmware_version && (
                  <div className={pillStyle}>
                    <Cpu className="h-4 w-4" />
                    {car.firmware_version}
                  </div>
                )}
              </>
            ) : null}

            {/* Language toggle */}
            <Tooltip label={t("tooltip.language")}>
              <button
                onClick={toggle}
                className={`${pillStyle} transition-colors hover:bg-muted hover:text-foreground`}
              >
                <Languages className="h-4 w-4" />
                {locale === "fr" ? "EN" : "FR"}
              </button>
            </Tooltip>

            {/* Geo-fences link */}
            {settingsData?.base_url && (
              <Tooltip label={t("tooltip.geofences")}>
                <a
                  href={`${settingsData.base_url}/geo-fences`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg border h-9 w-9 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MapPin className="h-4 w-4" />
                </a>
              </Tooltip>
            )}

            {/* Settings link */}
            {settingsData?.base_url && (
              <Tooltip label={t("tooltip.settings")}>
                <a
                  href={`${settingsData.base_url}/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg border h-9 w-9 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                </a>
              </Tooltip>
            )}

            {/* Help dropdown */}
            <Tooltip label={t("tooltip.help")}>
              <HelpDropdown />
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Map (with weather) + Stats + Heatmap */}
          <div className="space-y-6">
            <CarMap carId={selectedCarId} />
            <MonthlyStats carId={selectedCarId} />
            <DriveHeatmap carId={selectedCarId} />
          </div>

          {/* Columns 2-3: Battery health + Last charge (top), Battery chart with tabs (bottom) */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <BatteryHealthGauge carId={selectedCarId} />
              <LastChargeCard carId={selectedCarId} />
            </div>
            <BatteryChart carId={selectedCarId} />
          </div>

          {/* Column 4: Recent drives + Top destinations */}
          <div className="space-y-6">
            <RecentDrives carId={selectedCarId} />
            <TopDestinations carId={selectedCarId} />
          </div>
        </div>
      </main>

      <GrafanaNav />
    </div>
  );
}
