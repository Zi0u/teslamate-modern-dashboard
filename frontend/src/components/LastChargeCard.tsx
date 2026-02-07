import { Zap, Clock, Coins, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useLastCharge } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

function formatTimeAgo(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t("charge.justNow");

  const ago = t("charge.ago");
  if (diffDays >= 1) {
    return ago ? `${ago} ${diffDays}${t("charge.daysAgo")}` : `${diffDays}${t("charge.daysAgo")}`;
  }
  if (diffHours >= 1) {
    return ago ? `${ago} ${diffHours}${t("charge.hoursAgo")}` : `${diffHours}${t("charge.hoursAgo")}`;
  }
  return ago ? `${ago} ${diffMin}${t("charge.minutesAgo")}` : `${diffMin}${t("charge.minutesAgo")}`;
}

export function LastChargeCard() {
  const { data, isLoading, error } = useLastCharge();
  const { locale, t } = useTranslation();

  const numLocale = locale === "fr" ? "fr-FR" : "en-GB";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charge.title")}</CardTitle>
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
          <CardTitle>{t("charge.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {t("charge.loadError")}
        </CardContent>
      </Card>
    );
  }

  const rangeGained = Math.round(Number(data.end_rated_range_km) - Number(data.start_rated_range_km));

  const items = [
    {
      icon: Zap,
      label: t("charge.added"),
      value: `${Number(data.charge_energy_added).toFixed(1)} kWh`,
    },
    {
      icon: Clock,
      label: t("charge.duration"),
      value: formatDuration(data.duration_min),
    },
    {
      icon: Coins,
      label: t("charge.cost"),
      value:
        data.cost != null
          ? `${Number(data.cost).toLocaleString(numLocale, { minimumFractionDigits: 2 })} EUR`
          : "N/A",
    },
    {
      icon: Gauge,
      label: t("charge.range"),
      value: `+${rangeGained} km`,
    },
  ];

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const endDate = new Date(data.end_date);
  const chargeDate = endDate.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const chargeTime = endDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeAgo = formatTimeAgo(endDate, t as (key: string) => string);

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("charge.title")}
            </CardTitle>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-xs font-medium text-foreground/70 mt-1">
            {chargeDate} {locale === "fr" ? "\u00e0" : "at"} {chargeTime}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Battery level bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{data.start_battery_level}%</span>
            <span>{data.end_battery_level}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${data.end_battery_level}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border bg-muted/30 p-2.5"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <item.icon className="h-3 w-3" />
                {item.label}
              </div>
              <p className="text-sm font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
