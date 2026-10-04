import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useDriveActivity } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";
import { localDayKey } from "../lib/day";
import { Zap } from "lucide-react";

const DAYS = 30;

// Intensity by distance driven (km), more telling than the number of drives
const LEVELS = [
  { min: 100, className: "bg-emerald-500/80", label: "100+" },
  { min: 50, className: "bg-emerald-500/55", label: "50" },
  { min: 20, className: "bg-emerald-500/35", label: "20" },
  { min: 0.1, className: "bg-emerald-500/20", label: "0" },
];

function intensityClass(distance: number) {
  return LEVELS.find((l) => distance >= l.min)?.className ?? "bg-muted/30";
}

// Click a day to show its details in the "Day details" card (selectedDay = "YYYY-MM-DD")
export function DriveHeatmap({
  carId = 1,
  selectedDay,
  onSelectDay,
}: {
  carId?: number;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const { data, isLoading, error } = useDriveActivity(DAYS, carId);
  const { locale, t } = useTranslation();

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("heatmap.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) return null;

  // Build a map of day -> data
  const activityMap = new Map(
    (data || []).map((d) => [d.day, d])
  );

  // Generate last N days (local date keys, see CLAUDE.md pitfall #9)
  const days = [];
  const now = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = localDayKey(d);
    const activity = activityMap.get(key);
    days.push({
      date: d,
      key,
      isToday: i === 0,
      count: activity ? Number(activity.drive_count) : 0,
      distance: activity ? Number(activity.total_distance_km) : 0,
      charges: activity ? Number(activity.charge_count ?? 0) : 0,
    });
  }

  const totalDistance = days.reduce((sum, d) => sum + d.distance, 0);
  const totalDrives = days.reduce((sum, d) => sum + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  const summary = [
    { value: `${Math.round(totalDistance).toLocaleString(dateLocale)} km`, label: t("heatmap.distance") },
    { value: totalDrives, label: t("heatmap.drives") },
    { value: `${activeDays}/${DAYS}`, label: t("heatmap.activeDays") },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("heatmap.title")}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {summary.map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-sm font-bold text-foreground">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))] lg:grid-cols-[repeat(30,minmax(0,1fr))]">
          {days.map((day, index) => {
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
            // Show the month name on the first cell and whenever the month changes
            const showMonth = index === 0 || day.date.getDate() === 1;
            return (
              // The whole day column is clickable (shows the day in "Day details"), with a hover
              // background; weekends get a tinted column and weekday letter
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                aria-pressed={selectedDay === day.key}
                aria-label={day.date.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}
                className={`group relative flex cursor-pointer flex-col items-center gap-1 rounded-md px-0.5 py-1 transition-colors ${
                  isWeekend ? "bg-sky-500/10 hover:bg-sky-500/25" : "hover:bg-muted/70"
                } ${selectedDay === day.key ? (isWeekend ? "bg-sky-500/25" : "bg-muted/70") : ""}`}
              >
                <span className={`text-[10px] ${isWeekend ? "font-semibold text-sky-400" : "text-muted-foreground"}`}>
                  {day.date.toLocaleDateString(dateLocale, { weekday: "narrow" })}
                </span>
                <div
                  className={`relative flex h-10 w-full items-center justify-center rounded-md border border-border/50 transition-transform group-hover:scale-105 ${intensityClass(day.distance)} ${
                    selectedDay === day.key
                      ? "ring-2 ring-foreground ring-offset-1 ring-offset-card"
                      : day.isToday
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                        : ""
                  }`}
                >
                  {/* Small bolt when the car charged that day */}
                  {day.charges > 0 && (
                    <Zap className="absolute right-1 top-1 h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  )}
                  {day.distance > 0 && (
                    <span className="hidden text-[10px] font-medium text-foreground/90 xl:inline">
                      {Math.round(day.distance)}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${day.isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                  {day.date.getDate()}
                </span>
                {showMonth && (
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70 -mt-1">
                    {day.date.toLocaleDateString(dateLocale, { month: "short" })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-muted-foreground">0 km</span>
          <div className="h-3 w-3 rounded-sm border border-border/50 bg-muted/30" />
          {[...LEVELS].reverse().map((l) => (
            <div key={l.label} className={`h-3 w-3 rounded-sm border border-border/50 ${l.className}`} />
          ))}
          <span className="text-[10px] text-muted-foreground">100+ km</span>
        </div>
      </CardContent>
    </Card>
  );
}
