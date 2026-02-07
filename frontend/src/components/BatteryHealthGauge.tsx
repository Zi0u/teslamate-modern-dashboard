import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useBatteryHealth } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function GaugeArc({ pct }: { pct: number }) {
  // Semi-circle gauge from 180° to 0° (left to right)
  const radius = 70;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 12;

  // Background arc (full semi-circle)
  const bgStart = { x: cx - radius, y: cy };
  const bgEnd = { x: cx + radius, y: cy };
  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${bgEnd.x} ${bgEnd.y}`;

  // Value arc (partial)
  const angle = Math.PI * (1 - pct / 100);
  const valEnd = {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  };
  const valPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${valEnd.x} ${valEnd.y}`;

  // Color based on health
  const color =
    pct >= 95
      ? "hsl(142, 71%, 45%)"
      : pct >= 85
        ? "hsl(48, 96%, 53%)"
        : "hsl(0, 84%, 60%)";

  return (
    <svg viewBox="0 0 160 95" className="w-full max-w-[200px] mx-auto">
      <path
        d={bgPath}
        fill="none"
        stroke="hsl(217, 33%, 17%)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={valPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        className="text-2xl font-bold"
        fill="currentColor"
        fontSize="24"
      >
        {pct.toFixed(1)}%
      </text>
    </svg>
  );
}

export function BatteryHealthGauge() {
  const { data, isLoading, error } = useBatteryHealth();
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

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("health.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {t("health.loadError")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          {t("health.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GaugeArc pct={Number(data.battery_health_pct)} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">
              {t("health.degradation")}
            </p>
            <p className="text-sm font-bold text-red-400">
              -{Number(data.degradation_pct).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">
              {t("health.current")}
            </p>
            <p className="text-sm font-bold">
              {Math.round(Number(data.current_range_km)).toLocaleString(numLocale)} km
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
