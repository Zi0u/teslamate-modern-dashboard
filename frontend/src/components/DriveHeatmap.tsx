import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useDriveActivity } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function intensityColor(count: number) {
  if (count === 0) return "bg-muted/30";
  if (count === 1) return "bg-emerald-500/20";
  if (count <= 3) return "bg-emerald-500/40";
  return "bg-emerald-500/70";
}

export function DriveHeatmap() {
  const { data, isLoading, error } = useDriveActivity();
  const { locale, t } = useTranslation();

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("heatmap.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) return null;

  // Build a map of day -> data
  const activityMap = new Map(
    (data || []).map((d) => [d.day, d])
  );

  // Generate last 15 days
  const days = [];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const activity = activityMap.get(key);
    days.push({
      date: d,
      key,
      count: activity ? Number(activity.drive_count) : 0,
      distance: activity ? Number(activity.total_distance_km) : 0,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          {t("heatmap.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {days.map((day) => (
            <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground">
                {day.date.toLocaleDateString(dateLocale, { weekday: "narrow" })}
              </span>
              <div
                className={`w-full aspect-square rounded-sm ${intensityColor(day.count)} border border-border/50`}
                title={
                  day.count > 0
                    ? `${day.count} ${t("heatmap.drives")} — ${day.distance.toFixed(1)} km`
                    : t("heatmap.noActivity")
                }
              />
              <span className="text-[8px] text-muted-foreground">
                {day.date.getDate()}
              </span>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-2">
          <span className="text-[9px] text-muted-foreground">0</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-muted/30 border border-border/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-border/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-border/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 border border-border/50" />
          <span className="text-[9px] text-muted-foreground">4+</span>
        </div>
      </CardContent>
    </Card>
  );
}
