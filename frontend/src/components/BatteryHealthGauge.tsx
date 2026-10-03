import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useBatteryHealth } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

// Color based on health
function healthColor(pct: number) {
  return pct >= 95 ? "hsl(142, 71%, 45%)" : pct >= 85 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)";
}

export function BatteryHealthGauge({ carId = 1 }: { carId?: number }) {
  const { data, isLoading, error } = useBatteryHealth(carId);
  const { locale, t } = useTranslation();

  const numLocale = locale === "fr" ? "fr-FR" : "en-GB";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("health.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.battery_health_pct == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("health.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {/* No data yet (new car: TeslaMate needs a few charges) vs a real loading error */}
          {data && data.battery_health_pct == null ? t("health.notEnoughData") : t("health.loadError")}
        </CardContent>
      </Card>
    );
  }

  const pct = Number(data.battery_health_pct);
  const color = healthColor(pct);

  const label = `${pct.toLocaleString(numLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  // Battery-shaped bar with the health percentage inside, then the two details on one line
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("health.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("health.title")}>
          {/* Battery body */}
          <div className="relative h-9 flex-1 rounded-lg border-2 border-muted-foreground/40 p-[3px]">
            <div
              className="h-full rounded-[5px]"
              style={{
                width: `${Math.min(Math.max(pct, 0), 100)}%`,
                background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 75%, black))`,
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
              {label}
            </span>
          </div>
          {/* Battery terminal */}
          <div className="h-3.5 w-1.5 rounded-r-sm bg-muted-foreground/40" />
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            {t("health.degradation")}{" "}
            <span className="font-bold text-red-400">
              -{Number(data.degradation_pct).toLocaleString(numLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
            </span>
          </span>
          <span className="text-muted-foreground">
            {t("health.currentShort")}{" "}
            <span className="font-bold text-foreground">
              {Math.round(Number(data.current_range_km)).toLocaleString(numLocale)} km
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
