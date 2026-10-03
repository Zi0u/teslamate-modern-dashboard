import { useState } from "react";
import { Route, Zap, Fuel, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { usePeriodStats } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

type Period = "week" | "month" | "last_month";

export function MonthlyStats({ carId = 1 }: { carId?: number }) {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading, error } = usePeriodStats(period, carId);
  const { locale, t } = useTranslation();

  const periods: { value: Period; label: string }[] = [
    { value: "week", label: t("stats.week") },
    { value: "month", label: t("stats.month") },
    { value: "last_month", label: t("stats.lastMonth") },
  ];

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

  const formatNumber = (value: number, digits: number) =>
    value.toLocaleString(numLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  // Cost is only meaningful for charges that have a price set in TeslaMate
  const chargeCount = Number(data.charge_count);
  const costedCount = Number(data.costed_charge_count ?? chargeCount);
  const costUnknown = chargeCount > 0 && costedCount === 0;
  const costPartial = costedCount > 0 && costedCount < chargeCount;

  const stats = [
    {
      icon: Route,
      label: t("stats.distance"),
      value: `${formatNumber(Number(data.total_distance_km), 0)} km`,
      sub: `${data.drive_count} ${t("stats.trips")}`,
    },
    {
      icon: Zap,
      label: t("stats.avgConsumption"),
      value: formatNumber(Number(data.avg_consumption_kwh_per_100km), 1),
      sub: "kWh/100km",
    },
    {
      icon: Fuel,
      label: t("stats.totalEnergy"),
      value: `${formatNumber(Number(data.total_energy_kwh), 1)} kWh`,
      sub: `${data.charge_count} ${t("stats.charges")}`,
    },
    {
      icon: Hash,
      label: t("stats.energyCost"),
      value: costUnknown ? "N/A" : `${formatNumber(Number(data.total_cost), 2)} €`,
      sub: costUnknown
        ? t("stats.costNotSet")
        : costPartial
          ? `${costedCount}/${chargeCount} ${t("stats.charges")}`
          : t("stats.thisPeriod"),
      hint: costPartial ? t("stats.costPartialHint") : undefined,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("stats.title")}
        </CardTitle>
        {/* Period tabs */}
        <div role="tablist" className="mt-3 grid grid-cols-3 border-b border-border">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={period === value}
              onClick={() => setPeriod(value)}
              className={`-mb-px border-b-2 pb-2 text-xs font-medium transition-colors cursor-pointer ${
                period === value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
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
            <span
              className={`text-[10px] w-16 text-right ${stat.hint ? "text-amber-400 cursor-help" : "text-muted-foreground"}`}
              title={stat.hint}
            >
              {stat.sub}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
