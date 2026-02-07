import { Battery, BatteryLow, BatteryMedium, BatteryFull, EvCharger, Car, Cpu, Languages, HelpCircle, Settings, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useCarStatus, useGrafanaUrl } from "../hooks/useApi";
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
  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground";

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

export function Dashboard() {
  const { locale, toggle, t } = useTranslation();
  const { data: car, isLoading } = useCarStatus();
  const { data: settingsData } = useGrafanaUrl();

  const stateKey = car ? (`state.${car.state}` as TranslationKey) : undefined;
  const stateLabel = stateKey ? t(stateKey) : "";
  const stateVariant = car ? (stateVariants[car.state] ?? "secondary") : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: title + car name/status as subtitle */}
          <div className="min-w-0 shrink-0">
            <h1 className="text-xl font-bold tracking-tight">
              TeslaMate Modern Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
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
                </>
              ) : null}
            </div>
          </div>

          {/* Right: pills row */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto">
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

            </div>

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
            <CarMap />
            <MonthlyStats />
            <DriveHeatmap />
          </div>

          {/* Columns 2-3: Battery health + Last charge (top), Battery chart with tabs (bottom) */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <BatteryHealthGauge />
              <LastChargeCard />
            </div>
            <BatteryChart />
          </div>

          {/* Column 4: Recent drives + Top destinations */}
          <div className="space-y-6">
            <RecentDrives />
            <TopDestinations />
          </div>
        </div>
      </main>

      <GrafanaNav />
    </div>
  );
}
