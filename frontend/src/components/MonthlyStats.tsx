import { useState } from "react";
import { Route, Zap, Fuel, Hash, PiggyBank, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useFuelPrices, usePeriodStats } from "../hooks/useApi";
import { FUEL_COLOR, FUEL_CONSUMPTION, FUELS, useCustomFuelPrices } from "../lib/fuel";
import { FuelPriceEditor } from "./FuelPriceEditor";
import { useTranslation } from "../i18n/LanguageContext";

type Period = "week" | "month" | "last_month" | "year";

export function MonthlyStats({ carId = 1 }: { carId?: number }) {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading, error } = usePeriodStats(period, carId);
  const { locale, t } = useTranslation();
  const { data: nationalPrices } = useFuelPrices();
  const [customPrices] = useCustomFuelPrices();
  // Fuel price editor, shared with the last charge "Savings" tab (same prices, synced)
  const [editingPrices, setEditingPrices] = useState(false);

  const periods: { value: Period; label: string }[] = [
    { value: "week", label: t("stats.week") },
    { value: "month", label: t("stats.month") },
    { value: "last_month", label: t("stats.lastMonth") },
    { value: "year", label: t("stats.year") },
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

  // Savings vs gasoline/diesel over the period, same logic as the last charge "Savings" tab:
  // real km = energy of the charges with a cost ÷ consumption; combustion cost = real km ×
  // L/100km × fuel price; savings = combustion cost − what those charges cost.
  // Price: the viewer's own price, else the French average if all those charges were in France.
  const costedEnergy = Number(data.costed_energy_kwh ?? 0);
  const savingsConsumption = Number(data.savings_consumption_kwh_100km ?? 0);
  const allInFrance = costedCount > 0 && Number(data.costed_charges_in_france ?? 0) === costedCount;
  const realKm = savingsConsumption > 0 ? (costedEnergy / savingsConsumption) * 100 : null;
  const autoPrice = (fuel: (typeof FUELS)[number]) => (allInFrance ? nationalPrices?.[fuel] ?? null : null);
  // Prices used for the savings, shown next to the "Prices" button
  const usedPrices = FUELS.flatMap((fuel) => {
    const price = customPrices[fuel] ?? autoPrice(fuel);
    return price == null ? [] : [`${t(fuel === "gasoline" ? "charge.gasoline" : "charge.diesel")} ${formatNumber(price, 2)} €/L`];
  });
  const hasCustomPrices = Object.keys(customPrices).length > 0;
  const savingsRows = FUELS.map((fuel) => {
    const price = customPrices[fuel] ?? autoPrice(fuel);
    const label = `${t("stats.savingsVs")} ${t(fuel === "gasoline" ? "charge.gasoline" : "charge.diesel").toLocaleLowerCase(locale)}`;
    const base = { icon: PiggyBank, label, dot: FUEL_COLOR[fuel] };
    if (costedCount === 0) return { ...base, value: "—", sub: chargeCount === 0 ? t("stats.noCharge") : t("stats.costNotSet") };
    if (realKm == null) return { ...base, value: "—", sub: t("stats.notComputedYet") };
    if (price == null) return { ...base, value: "—", sub: t("stats.noFuelPrice") };
    const fuelCost = (realKm * FUEL_CONSUMPTION[fuel] * price) / 100;
    const savings = fuelCost - Number(data.total_cost ?? 0);
    return {
      ...base,
      value: `${costPartial ? "≈ " : ""}${formatNumber(savings, 0)} €`,
      valueClass: savings >= 0 ? "text-emerald-400" : "text-red-400",
      sub: fuelCost > 0 ? `${savings >= 0 ? "−" : "+"}${Math.round((Math.abs(savings) / fuelCost) * 100)} %` : "",
      hint: costPartial ? t("stats.savingsPartialHint") : undefined,
    };
  });

  const stats: {
    icon: typeof Route;
    label: string;
    value: string;
    sub: string;
    hint?: string;
    dot?: string;
    valueClass?: string;
  }[] = [
    {
      icon: Route,
      label: t("stats.distance"),
      value: `${formatNumber(Number(data.total_distance_km), 0)} km`,
      sub: `${data.drive_count} ${t(Number(data.drive_count) === 1 ? "stats.trip" : "stats.trips")}`,
    },
    {
      icon: Zap,
      label: t("stats.avgConsumption"),
      // Unknown until TeslaMate has computed the car's efficiency
      value: data.avg_consumption_kwh_per_100km == null ? "—" : formatNumber(Number(data.avg_consumption_kwh_per_100km), 1),
      sub: data.avg_consumption_kwh_per_100km == null ? t("stats.notComputedYet") : "kWh/100km",
    },
    {
      icon: Fuel,
      label: t("stats.totalEnergy"),
      value: `${formatNumber(Number(data.total_energy_kwh), 1)} kWh`,
      sub: `${data.charge_count} ${t(chargeCount === 1 ? "stats.charge" : "stats.charges")}`,
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
    ...savingsRows,
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("stats.title")}
        </CardTitle>
        {/* Period tabs */}
        <div role="tablist" className="mt-3 grid grid-cols-4 border-b border-border">
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
            <span className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground">
              {stat.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${stat.dot}`} />}
              {stat.label}
            </span>
            <span className={`text-sm font-bold tabular-nums ${stat.valueClass ?? ""}`}>{stat.value}</span>
            <span
              className={`text-[10px] w-16 text-right ${stat.hint ? "text-amber-400 cursor-help" : "text-muted-foreground"}`}
              title={stat.hint}
            >
              {stat.sub}
            </span>
          </div>
        ))}

        {/* Fuel prices used for the savings + button to change them */}
        <div className="flex items-center justify-between gap-2 pt-1.5 text-[10px] text-muted-foreground">
          <span className="min-w-0 truncate">
            {usedPrices.length > 0
              ? `${usedPrices.join(" · ")} (${t(hasCustomPrices ? "charge.fuelCustom" : "stats.franceAverage")})`
              : t("charge.fuelNoPriceShort")}
          </span>
          <button
            onClick={() => setEditingPrices(!editingPrices)}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
              editingPrices ? "bg-muted text-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <Settings2 className="h-3 w-3" />
            {t("charge.fuelPrices")}
          </button>
        </div>
        {editingPrices && (
          <FuelPriceEditor
            // Hints: the French average (used automatically for charges in France)
            placeholders={{ gasoline: nationalPrices?.gasoline ?? null, diesel: nationalPrices?.diesel ?? null }}
            onDone={() => setEditingPrices(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
