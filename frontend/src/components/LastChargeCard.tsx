import { useState } from "react";
import { Zap, Clock, Gauge, MapPin, Settings2, Info, Calculator, BatteryCharging } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { isNotFound, useFuelPrices, useLastCharge } from "../hooks/useApi";
import { FUEL_COLOR, FUEL_CONSUMPTION, FUEL_DATA_URL, FUELS, parsePrice, useCustomFuelPrices, type Fuel, type CustomPrices } from "../lib/fuel";
import { useTranslation } from "../i18n/LanguageContext";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

// "il y a 5 jours" / "5 days ago", "hier" / "yesterday" — spelled out in the UI language
function formatTimeAgo(date: Date, locale: string, justNow: string): string {
  const diffMs = Date.now() - date.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (minutes < 1) return justNow;
  if (days >= 1) return rtf.format(-days, "day");
  if (hours >= 1) return rtf.format(-hours, "hour");
  return rtf.format(-minutes, "minute");
}

export function LastChargeCard({ carId = 1 }: { carId?: number }) {
  const { data, isLoading, error } = useLastCharge(carId);
  const { locale, t } = useTranslation();
  const [tab, setTab] = useState<"details" | "compare">("details");

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
          {isNotFound(error) ? (
            // New car in TeslaMate: no charge recorded yet
            <div className="flex flex-col items-center gap-2 py-4">
              <BatteryCharging className="h-6 w-6 text-muted-foreground/60" />
              <p>{t("charge.noCharge")}</p>
            </div>
          ) : (
            t("charge.loadError")
          )}
        </CardContent>
      </Card>
    );
  }

  const numberFormat = (value: number, digits: number) =>
    value.toLocaleString(numLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const euros = (value: number) => `${numberFormat(value, 2)} €`;

  const energyAdded = Number(data.charge_energy_added);
  const energyUsed = data.charge_energy_used != null ? Number(data.charge_energy_used) : null;
  const cost = data.cost != null ? Number(data.cost) : null;
  const rangeGained = Math.round(Number(data.end_rated_range_km) - Number(data.start_rated_range_km));
  const avgPowerKw = data.duration_min > 0 ? energyAdded / (data.duration_min / 60) : null;
  // Price per kWh paid at the plug (energy drawn from the grid, losses included)
  const pricePerKwh = cost != null && (energyUsed ?? energyAdded) > 0 ? cost / (energyUsed ?? energyAdded) : null;

  // Real kilometers this charge gives, from the real-world consumption of the last 30 days
  // (falls back to the range gained shown by the car)
  const consumption = Number(data.consumption_30d_kwh_100km);
  const realKm = consumption > 0 ? Math.round((energyAdded / consumption) * 100) : rangeGained;

  const startTime = new Date(data.start_date).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  // Share of the grid energy that ended up in the battery
  const efficiency = energyUsed && energyUsed > 0 ? Math.round((energyAdded / energyUsed) * 100) : null;


  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const endDate = new Date(data.end_date);
  const chargeDate = endDate.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    // Year only when it isn't the current one, to keep the header on one line
    ...(endDate.getFullYear() !== new Date().getFullYear() ? { year: "numeric" as const } : {}),
  });
  const chargeTime = endDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeAgo = formatTimeAgo(endDate, locale, t("charge.justNow"));

  // Secondary metrics, one compact row under the headline numbers
  const secondary = [
    { icon: Clock, label: t("charge.duration"), value: formatDuration(data.duration_min), sub: `${startTime}–${chargeTime}` },
    {
      icon: Zap,
      label: t("charge.powerShort"),
      value: avgPowerKw != null ? `${numberFormat(avgPowerKw, 1)} kW` : "—",
      sub: data.max_power_kw ? `max ${data.max_power_kw} kW` : null,
    },
    {
      icon: Gauge,
      label: t("charge.rangeShort"),
      value: `+${rangeGained} km`,
      sub: consumption > 0 ? `≈ ${realKm} ${t("charge.realKm")}*` : null,
    },
  ];

  // Where: geofence name if set in TeslaMate, else the first parts of the address
  const location = data.geofence || data.address?.split(",").slice(0, 2).join(",").trim() || null;

  const start = data.start_battery_level;
  const end = data.end_battery_level;

  const tabs = [
    { value: "details" as const, label: t("charge.tabDetails") },
    { value: "compare" as const, label: t("charge.tabCompare") },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <CardTitle className="whitespace-nowrap text-base font-semibold text-foreground">
                {t("charge.title")}
              </CardTitle>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  data.is_dc ? "bg-amber-500/15 text-amber-400" : "bg-sky-500/15 text-sky-400"
                }`}
              >
                {data.is_dc ? "DC" : "AC"}
                {data.max_power_kw ? ` · ${data.max_power_kw} kW max` : ""}
              </span>
            </div>
            {/* Where, right under the title */}
            {location && (
              <p className="mt-1 flex items-center gap-1 min-w-0 text-xs text-muted-foreground" title={data.address ?? undefined}>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>
          {/* When: date, then how long ago */}
          <div className="shrink-0 text-right">
            <p className="text-xs font-medium text-foreground/80">
              {chargeDate} {locale === "fr" ? "\u00e0" : "at"} {chargeTime}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        {/* Tabs, same style as the stats card */}
        <div role="tablist" className="mt-3 grid grid-cols-2 border-b border-border">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`-mb-px border-b-2 pb-2 text-xs font-medium transition-colors cursor-pointer ${
                tab === value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Both panels share one grid cell: the card keeps the height of the taller one,
            so switching tabs never changes the row height */}
        <div className="grid grid-cols-[minmax(0,1fr)]">
          <div className={`[grid-area:1/1] min-w-0 ${tab === "details" ? "" : "invisible"}`} aria-hidden={tab !== "details"}>
            {/* Battery level bar: level before the charge (dim) + what this charge added (bright) */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-baseline justify-between tabular-nums">
                <span className="text-base font-semibold text-foreground/70">{start}%</span>
                <span className="text-lg font-bold text-emerald-400">+{end - start}%</span>
                <span className="text-base font-bold text-foreground">{end}%</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-emerald-500/30" style={{ width: `${start}%` }} />
                <div
                  className="absolute inset-y-0 rounded-r-full bg-emerald-500"
                  style={{ left: `${start}%`, width: `${end - start}%` }}
                />
              </div>
            </div>

            {/* Headline: what went into the battery, and what it cost */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t("charge.added")}</p>
                <p className="text-2xl font-bold leading-tight tabular-nums">
                  {numberFormat(energyAdded, 1)} <span className="text-sm font-semibold text-muted-foreground">kWh</span>
                </p>
                {energyUsed != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {numberFormat(energyUsed, 1)} kWh {t("charge.fromGrid")}
                  </p>
                )}
                {efficiency != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {t("charge.efficiency")} {efficiency} %
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">{t("charge.cost")}</p>
                <p className="text-2xl font-bold leading-tight tabular-nums text-emerald-400">
                  {cost != null ? euros(cost) : "—"}
                </p>
                <p className="text-xs font-medium text-foreground/80 tabular-nums">
                  {pricePerKwh != null ? `${numberFormat(pricePerKwh, 3)} €/kWh` : t("charge.costNotSet")}
                </p>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg border bg-muted/30 py-3">
              {secondary.map((m) => (
                <div key={m.label} className="min-w-0 px-2 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground/75">
                    <m.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{m.label}</span>
                  </p>
                  <p className="mt-1 text-base font-bold tabular-nums">{m.value}</p>
                  {m.sub && <p className="truncate text-[11px] text-muted-foreground">{m.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className={`[grid-area:1/1] min-w-0 ${tab === "compare" ? "" : "invisible"}`} aria-hidden={tab !== "compare"}>
            <FuelComparison
              realKm={realKm}
              cost={cost}
              countryCode={data.country_code}
              realKmLabel={consumption > 0 ? `${t("charge.realKm")}*` : ""}
              numberFormat={numberFormat}
            />
          </div>
        </div>

        {/* How the "real" km are computed */}
        {consumption > 0 && (
          <p className="mt-3 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
            * {t("charge.realKmNote")} ({numberFormat(energyAdded, 1)} kWh ÷ {numberFormat(consumption, 1)} kWh/100 km)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// What the same real distance would have cost with gasoline and with diesel.
// Prices: the viewer's own prices if set ("Prices" button), else the French national
// average — only for charges in France (country of the charge location in TeslaMate).
function FuelComparison({
  realKm,
  cost,
  countryCode,
  realKmLabel,
  numberFormat,
}: {
  realKm: number;
  cost: number | null;
  countryCode: string | null;
  // "réels*" when the distance comes from the 30-day consumption, empty when it's the car's range gained
  realKmLabel: string;
  numberFormat: (value: number, digits: number) => string;
}) {
  const { locale, t } = useTranslation();
  const { data: nationalPrices } = useFuelPrices();
  const [customPrices, saveCustomPrices] = useCustomFuelPrices();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<Fuel, string>>({ gasoline: "", diesel: "" });

  const inFrance = countryCode === "fr";
  // Country name in the UI language (e.g. "es" -> "Espagne"), whatever TeslaMate's geocoding language
  const countryName = (() => {
    try {
      return countryCode ? new Intl.DisplayNames([locale], { type: "region" }).of(countryCode.toUpperCase()) : null;
    } catch {
      return null;
    }
  })();

  const nationalPrice = (f: Fuel) => (inFrance ? nationalPrices?.[f] ?? null : null);
  const fuelLabel = (f: Fuel) => t(f === "gasoline" ? "charge.gasoline" : "charge.diesel");
  const euros = (value: number) => `${numberFormat(value, 2)} €`;
  const hasCustom = Object.keys(customPrices).length > 0;

  const openSettings = () => {
    setDraft({
      gasoline: customPrices.gasoline != null ? numberFormat(customPrices.gasoline, 3) : "",
      diesel: customPrices.diesel != null ? numberFormat(customPrices.diesel, 3) : "",
    });
    setEditing(true);
  };

  const saveSettings = () => {
    const next: CustomPrices = {};
    for (const f of FUELS) {
      const price = parsePrice(draft[f]);
      if (price) next[f] = price;
    }
    saveCustomPrices(next);
    setEditing(false);
  };

  const resetSettings = () => {
    saveCustomPrices({});
    setEditing(false);
  };

  // One line per fuel that has a price (custom first, else France average)
  const fuels = FUELS.flatMap((f) => {
    const custom = customPrices[f];
    const price = custom ?? nationalPrice(f);
    if (price == null || realKm <= 0) return [];
    return [{ fuel: f, price, isCustom: custom != null, cost: (realKm * FUEL_CONSUMPTION[f] * price) / 100 }];
  });

  // Prices used + the (highlighted) button to set them
  const pricesBar = (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5">
      <span className="min-w-0 text-xs text-muted-foreground">
        {fuels.length > 0 ? (
          <>
            <span className="text-foreground/90">
              {fuels.map((f) => `${fuelLabel(f.fuel)} ${numberFormat(f.price, 2)} €/L`).join(" · ")}
            </span>{" "}
            {hasCustom ? (
              `(${t("charge.fuelCustom")})`
            ) : (
              // Where the average comes from (official French open data, refreshed automatically), on its own line
              <span className="mt-0.5 block text-[11px]">
                {t("charge.fuelNationalSource")}{" "}
                <a
                  href={FUEL_DATA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  data.economie.gouv.fr
                </a>
              </span>
            )}
          </>
        ) : (
          t("charge.fuelNoPriceShort")
        )}
      </span>
      <button
        onClick={() => (editing ? setEditing(false) : openSettings())}
        className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
          editing
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        <Settings2 className="h-3 w-3" />
        {t("charge.fuelPrices")}
      </button>
    </div>
  );

  // Price settings, saved in this browser
  if (editing) {
    return (
      <div>
        {pricesBar}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
          <p className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 p-2 text-xs text-foreground/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {t("charge.fuelSettingsHint")}
          </p>
          {FUELS.map((f) => (
            <label key={f} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{fuelLabel(f)}</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft[f]}
                  onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
                  placeholder={nationalPrice(f) != null ? numberFormat(nationalPrice(f)!, 3) : "—"}
                  className="w-20 rounded-md border bg-background px-2 py-1 text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground">€/L</span>
              </span>
            </label>
          ))}
          <div className="flex items-center justify-end gap-2 pt-1">
            {hasCustom && (
              <button
                onClick={resetSettings}
                className="rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                {t("charge.fuelReset")}
              </button>
            )}
            <button
              onClick={saveSettings}
              className="rounded-md bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {t("charge.fuelSave")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No price (charge outside France without custom prices, or API down): invite to set one
  if (fuels.length === 0) {
    return (
      <div>
        {pricesBar}
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            {!inFrance && countryName ? `${t("charge.fuelChargedIn")} (${countryName}). ` : ""}
            {t("charge.fuelNoPrice")}
          </p>
          <button
            onClick={openSettings}
            className="rounded-md bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            {t("charge.fuelSettings")}
          </button>
        </div>
      </div>
    );
  }

  const bars = [
    ...(cost != null ? [{ key: "electric", label: t("charge.electric"), value: cost, className: "bg-sky-500" }] : []),
    ...fuels.map((f) => ({
      key: f.fuel,
      label: fuelLabel(f.fuel),
      value: f.cost,
      className: FUEL_COLOR[f.fuel],
    })),
  ];
  const max = Math.max(...bars.map((b) => b.value));

  return (
    <div>
      {pricesBar}

      {/* Cost bars: electric, then gasoline, then diesel */}
      <div className="space-y-2">
        {bars.map((bar) => (
          <div key={bar.key} className="grid grid-cols-[64px_1fr_auto] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{bar.label}</span>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${bar.className}`} style={{ width: `${(bar.value / max) * 100}%` }} />
            </div>
            <span className="font-semibold tabular-nums text-right">{euros(bar.value)}</span>
          </div>
        ))}
      </div>

      {/* Electric cost per 100 km, shown once (it doesn't depend on the fuel compared) */}
      {cost != null && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 shrink-0 text-sky-400" />
          {t("charge.electricPer100")}
          <span>
            <span className="font-semibold tabular-nums text-sky-400">{numberFormat((cost / realKm) * 100, 2)} €</span>/100 km
          </span>
        </p>
      )}

      {/* Savings vs each fuel */}
      {cost != null ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {fuels.map((f) => {
            const difference = f.cost - cost;
            const cheaper = difference >= 0;
            // Share of the combustion cost saved (or extra paid)
            const percent = f.cost > 0 ? Math.round((Math.abs(difference) / f.cost) * 100) : 0;
            // Combustion cost per 100 km (the electric one is shown once, under the bars)
            const fuelPer100 = (f.cost / realKm) * 100;
            return (
              <div key={f.fuel} className="rounded-lg border bg-muted/30 p-2.5">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${FUEL_COLOR[f.fuel]}`} />
                  vs {fuelLabel(f.fuel)}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={`text-base font-bold tabular-nums ${cheaper ? "text-emerald-400" : "text-red-400"}`}>
                    {cheaper ? "−" : "+"}
                    {euros(Math.abs(difference))}
                  </p>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                      cheaper ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {cheaper ? "−" : "+"}
                    {percent} %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {cheaper ? t("charge.saved") : t("charge.extraShort")}
                </p>
                <div className="mt-1.5 border-t border-border/50 pt-1.5 text-[11px] text-muted-foreground">
                  <p className="text-[10px]">{t("charge.costPer100")}</p>
                  <p className="tabular-nums">
                    <span className="font-semibold text-foreground">{numberFormat(fuelPer100, 2)} €</span>/100 km
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[10px] text-muted-foreground">{t("charge.costUnknown")}</p>
      )}

      {/* Calculation assumptions: the distance every figure above is based on + combustion consumption */}
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        <Calculator className="h-3.5 w-3.5 shrink-0 text-primary" />
        {t("charge.calcBasis")}
        <span className="font-semibold text-foreground">
          ≈ {realKm} km{realKmLabel ? ` ${realKmLabel}` : ""}
        </span>
        <span>
          ·{" "}
          {fuels
            .map((f) => `${fuelLabel(f.fuel).toLocaleLowerCase(locale)} ${numberFormat(FUEL_CONSUMPTION[f.fuel], 1)} L/100`)
            .join(" · ")}
        </span>
      </p>
    </div>
  );
}
