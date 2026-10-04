import { Battery, BatteryLow, BatteryMedium, BatteryFull, EvCharger, Car, Cpu, Languages, HelpCircle, Settings, MapPin, ChevronDown, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useCarStatus, useCars, useGrafanaUrl } from "../hooks/useApi";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tooltip } from "./ui/tooltip";
import { CarMap } from "./CarMap";
import { MonthlyStats } from "./MonthlyStats";
import { DriveHeatmap } from "./DriveHeatmap";
import { RecentDrives } from "./RecentDrives";
import { TopDestinations } from "./TopDestinations";
import { BatteryChart } from "./BatteryChart";
import { BatteryHealthGauge } from "./BatteryHealthGauge";
import { LastChargeCard } from "./LastChargeCard";
import { CurrentChargeCard } from "./CurrentChargeCard";
import { GrafanaNav } from "./GrafanaNav";
import { AboutModal } from "./AboutModal";
import { DayDetailCard } from "./DayDetailCard";
import { localDayKey } from "../lib/day";
import type { TranslationKey } from "../i18n/translations";

const pillBase = "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap";
// Clickable header items get a blue tint so they stand out from the read-only info pills
const interactiveStyle =
  "border-primary/40 bg-primary/10 text-foreground transition-colors hover:border-primary/70 hover:bg-primary/20";
// Read-only info (range, battery, odometer)
const pillStyle = `${pillBase} text-muted-foreground`;
// Clickable pill (car selector, firmware release notes, language)
const pillButtonStyle = `${pillBase} ${interactiveStyle}`;
// Clickable icon-only button (geo-fences, settings, help)
const iconButtonStyle = `flex h-9 w-9 items-center justify-center rounded-lg border ${interactiveStyle}`;

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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
        className={iconButtonStyle}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border bg-card shadow-lg z-50 p-1">
          <button
            onClick={() => {
              setOpen(false);
              setShowAbout(true);
            }}
            className="flex w-full items-center justify-end gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-md cursor-pointer"
          >
            {t("help.about")}
            <Info className="h-4 w-4" />
          </button>
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
          <div className="border-t mt-1 pt-1.5 px-3 pb-1 text-right text-[10px] leading-tight text-muted-foreground/70">
            <div>v{__APP_VERSION__}</div>
            <div>{__BUILD_DATE__.slice(0, 16).replace("T", " ")} UTC</div>
          </div>
        </div>
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
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
        className={pillButtonStyle}
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
  const [pickedCarId, setSelectedCarId] = useState<number | null>(null);
  // The car picked in the selector, else the first listed one (cars with data collection
  // disabled in TeslaMate are not listed, so a sold car is never shown by default)
  const selectedCarId =
    pickedCarId != null && cars?.some((c) => c.id === pickedCarId) ? pickedCarId : cars?.[0]?.id ?? null;
  const { data: car, isLoading } = useCarStatus(selectedCarId ?? undefined);
  // Day shown in the "Day details" card, picked in the activity heatmap; today by default,
  // and back to today when another car is selected
  const [pickedDay, setPickedDay] = useState<{ carId: number | null; day: string } | null>(null);
  const selectedDay = pickedDay && pickedDay.carId === selectedCarId ? pickedDay.day : localDayKey(new Date());
  const { data: settingsData } = useGrafanaUrl();

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
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium no-underline ${interactiveStyle}`}
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
              <CarSelector cars={cars} selectedId={selectedCarId ?? cars[0].id} onSelect={setSelectedCarId} />
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
                  {car.ideal_battery_range_km != null ? `${Math.round(car.ideal_battery_range_km)} km` : "—"}
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

                {/* Firmware: links to the release notes of this version on Not a Tesla App
                    (some versions carry a build hash after a space, e.g. "2026.32.3 a1b2c3") */}
                {car.firmware_version && (
                  <Tooltip label={t("tooltip.releaseNotes")}>
                    <a
                      href={`https://www.notateslaapp.com/software-updates/version/${encodeURIComponent(
                        car.firmware_version.trim().split(" ")[0]
                      )}/release-notes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={pillButtonStyle}
                    >
                      <Cpu className="h-4 w-4" />
                      {car.firmware_version}
                    </a>
                  </Tooltip>
                )}
              </>
            ) : null}

            {/* Language toggle */}
            <Tooltip label={t("tooltip.language")}>
              <button
                onClick={toggle}
                className={pillButtonStyle}
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
                  className={iconButtonStyle}
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
                  className={iconButtonStyle}
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
        {/* Demo mode: make it clear the data is fictional */}
        {car?.demo_mode && (
          <div
            role="note"
            className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm"
          >
            <p className="flex items-center gap-2 text-sky-100">
              <Info className="h-4 w-4 shrink-0 text-sky-400" />
              <span>
                <span className="font-semibold">{t("demo.bannerTitle")}</span> {t("demo.bannerText")}
              </span>
            </p>
            <a
              href="https://github.com/Zi0u/teslamate-modern-dashboard#teslamate-modern-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium text-sky-300 underline-offset-2 hover:underline"
            >
              {t("demo.bannerLink")} →
            </a>
          </div>
        )}

        {/* Wait for the car list to know which car to show */}
        {selectedCarId != null && (
          <>
            {/* Live charge: full-width banner on top, only while charging */}
            {car?.state === "charging" && (
              <div className="mb-6">
                <CurrentChargeCard carId={selectedCarId} />
              </div>
            )}

            {/* 3 columns (1/4 · 1/2 · 1/4) on shared grid rows, each card filling its cell
                ([&>*]:flex-1) so bottoms line up:
                row 1: map + battery health | last charge | recent drives (rows 1-2)
                row 2: stats                | chart (rows 2-3)
                row 3:                      |                | top destinations
                Explicit md/lg placement, DOM order kept for mobile (single column). */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_1fr_auto]">
              {/* Map (with weather, grows) + battery health: bottom aligned with the last charge */}
              <div className="flex flex-col gap-6 md:col-start-1 md:row-start-1 lg:col-start-1 lg:row-start-1">
                <div className="flex flex-1 flex-col [&>*]:flex-1">
                  <CarMap carId={selectedCarId} />
                </div>
                <BatteryHealthGauge carId={selectedCarId} />
              </div>

              {/* Stats: bottom aligned with recent drives */}
              <div className="flex flex-col [&>*]:flex-1 md:col-start-1 md:row-start-2 lg:col-start-1 lg:row-start-2">
                <MonthlyStats carId={selectedCarId} />
              </div>

              {/* Recent drives, next to the first column */}
              <div className="flex flex-col [&>*]:flex-1 md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-4 lg:row-span-2 lg:row-start-1">
                <RecentDrives carId={selectedCarId} />
              </div>

              {/* Last charge (double width) */}
              <div className="flex flex-col [&>*]:flex-1 md:col-span-2 md:row-start-3 lg:col-span-2 lg:col-start-2 lg:row-start-1">
                {isLoading || !car ? (
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ) : (
                  <LastChargeCard carId={selectedCarId} />
                )}
              </div>

              {/* Battery / consumption chart (double width): bottom aligned with top destinations */}
              <div className="flex flex-col [&>*]:flex-1 md:col-span-2 md:row-start-4 lg:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-2">
                <BatteryChart carId={selectedCarId} />
              </div>

              {/* Day details (picked in the activity), under the stats */}
              <div className="flex flex-col [&>*]:flex-1 md:col-start-1 md:row-start-5 lg:col-start-1 lg:row-start-3">
                <DayDetailCard carId={selectedCarId} day={selectedDay} />
              </div>

              {/* Top destinations */}
              <div className="flex flex-col [&>*]:flex-1 md:col-start-2 md:row-start-5 lg:col-span-1 lg:col-start-4 lg:row-start-3">
                <TopDestinations carId={selectedCarId} />
              </div>

              {/* Full width: 30-day driving activity */}
              <div className="md:col-span-2 md:row-start-6 lg:col-span-4 lg:row-start-4">
                <DriveHeatmap
                  carId={selectedCarId}
                  selectedDay={selectedDay}
                  onSelectDay={(day) => setPickedDay({ carId: selectedCarId, day })}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <GrafanaNav />
    </div>
  );
}
