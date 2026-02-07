import { useState } from "react";
import { Route, Zap, Fuel, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { usePeriodStats } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

type Period = "week" | "month" | "last_month";

export function MonthlyStats() {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading, error } = usePeriodStats(period);
  const { locale, t } = useTranslation();

  const pillBase =
    "px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer";
  const pillActive = "bg-primary text-primary-foreground";
  const pillInactive = "text-muted-foreground hover:text-foreground hover:bg-muted";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("stats.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("stats.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {t("stats.loadError")}
        </CardContent>
      </Card>
    );
  }

  const numLocale = locale === "fr" ? "fr-FR" : "en-GB";

  const stats = [
    {
      icon: Route,
      label: t("stats.distance"),
      value: `${Number(data.total_distance_km).toLocaleString(numLocale, { maximumFractionDigits: 0 })} km`,
      sub: `${data.drive_count} ${t("stats.trips")}`,
    },
    {
      icon: Zap,
      label: t("stats.avgConsumption"),
      value: `${data.avg_consumption_kwh_per_100km}`,
      sub: "kWh/100km",
    },
    {
      icon: Fuel,
      label: t("stats.totalEnergy"),
      value: `${data.total_energy_kwh} kWh`,
      sub: `${data.charge_count} ${t("stats.charges")}`,
    },
    {
      icon: Hash,
      label: t("stats.energyCost"),
      value:
        data.total_cost != null
          ? `${Number(data.total_cost).toLocaleString(numLocale, {
              minimumFractionDigits: 2,
            })} €`
          : "N/A",
      sub: t("stats.thisPeriod"),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("stats.title")}
          </CardTitle>
          <div className="flex items-center gap-1 rounded-full border p-0.5">
            <button
              onClick={() => setPeriod("week")}
              className={`${pillBase} ${period === "week" ? pillActive : pillInactive}`}
            >
              {t("stats.week")}
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`${pillBase} ${period === "month" ? pillActive : pillInactive}`}
            >
              {t("stats.month")}
            </button>
            <button
              onClick={() => setPeriod("last_month")}
              className={`${pillBase} ${period === "last_month" ? pillActive : pillInactive}`}
            >
              {t("stats.lastMonth")}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0"
          >
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground flex-1">{stat.label}</span>
            <span className="text-sm font-bold">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground w-16 text-right">{stat.sub}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
