import { BatteryCharging, Gauge, MapPin, Thermometer, ThermometerSun, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useCurrentCharge } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

// Mirrors the header's batteryColor thresholds (Dashboard.tsx)
function batteryBarColor(level: number) {
  if (level >= 20) return "bg-emerald-500";
  if (level >= 10) return "bg-amber-500";
  return "bg-red-500";
}

function batteryTextColor(level: number) {
  if (level >= 20) return "text-emerald-400";
  if (level >= 10) return "text-amber-400";
  return "text-red-400";
}

function formatSince(startDate: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m} min`;
}

// Live charge, shown as a full-width banner at the top of the dashboard while charging
export function CurrentChargeCard({ carId = 1 }: { carId?: number }) {
  const { data, isLoading, error } = useCurrentCharge(carId);
  const { locale, t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("charging.title")}</CardTitle>
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
          <CardTitle>{t("charging.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {t("charge.loadError")}
        </CardContent>
      </Card>
    );
  }

  const numLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const numberFormat = (value: number, digits: number) =>
    value.toLocaleString(numLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const level = Number(data.battery_level);
  const start = data.start_battery_level != null ? Math.min(Number(data.start_battery_level), level) : null;
  const power = Number(data.charger_power);
  const startTime = new Date(data.start_date).toLocaleTimeString(numLocale, { hour: "2-digit", minute: "2-digit" });
  const fmtTemp = (v: number | null) => (v != null ? `${numberFormat(Number(v), 1)}°` : "—");
  // Where: geofence name if set in TeslaMate, else the first parts of the address
  const location = data.geofence || data.address?.split(",").slice(0, 2).join(",").trim() || null;

  const metrics = [
    {
      icon: Zap,
      label: t("charging.energy"),
      value: `${numberFormat(Number(data.charge_energy_added), 1)} kWh`,
      highlight: "",
    },
    {
      icon: BatteryCharging,
      label: t("charging.power"),
      value: `${numberFormat(power, power < 10 ? 1 : 0)} kW`,
      highlight: "text-amber-400",
    },
    {
      icon: Gauge,
      label: t("charging.range"),
      value: `${Math.round(Number(data.ideal_battery_range_km))} km`,
      highlight: "",
    },
    { icon: Thermometer, label: t("charging.outside"), value: fmtTemp(data.outside_temp), highlight: "" },
    { icon: ThermometerSun, label: t("charging.inside"), value: fmtTemp(data.inside_temp), highlight: "" },
  ];

  // Slim banner: one row on large screens (title + level bar | live metrics)
  return (
    <Card className="border-amber-500/30">
      <CardContent className="p-4 sm:px-6">
        <div className="grid gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
          <div className="min-w-0">
            {/* Title, charger type, where */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <CardTitle className="flex items-center gap-2 whitespace-nowrap text-base font-semibold text-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {t("charging.title")}
              </CardTitle>
              {data.is_dc != null && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    data.is_dc ? "bg-amber-500/15 text-amber-400" : "bg-sky-500/15 text-sky-400"
                  }`}
                >
                  {data.is_dc ? "DC" : "AC"}
                  {data.max_power_kw ? ` · ${data.max_power_kw} kW max` : ""}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1 min-w-0 text-xs text-muted-foreground" title={data.address ?? undefined}>
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </span>
              )}
            </div>

            {/* Level: percentage + bar from the level at plug-in (dim) to now (bright, animated) */}
            <div className="mt-2 flex items-center gap-3">
              <span className={`text-2xl font-bold leading-none tabular-nums ${batteryTextColor(level)}`}>{level}%</span>
              <div className="relative h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                {start != null && (
                  <div className={`absolute inset-y-0 left-0 ${batteryBarColor(level)} opacity-30`} style={{ width: `${start}%` }} />
                )}
                <div
                  className={`absolute inset-y-0 overflow-hidden rounded-r-full ${batteryBarColor(level)} transition-[width] duration-1000 ease-out`}
                  style={{ left: `${start ?? 0}%`, width: `${level - (start ?? 0)}%` }}
                >
                  {/* Shimmer sweep to convey active charging */}
                  <div className="absolute inset-0 animate-[charge-shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                </div>
              </div>
              {start != null && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {start}% → <span className="font-semibold text-emerald-400">+{level - start}%</span>
                </span>
              )}
            </div>

            {/* Since when */}
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {t("charging.since")} {formatSince(data.start_date)}
              </span>{" "}
              · {t("charging.started")} {startTime}
            </p>
          </div>

          {/* Live metrics */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-5">
            {metrics.map((m) => (
              // 5 metrics: on the 2-column mobile grid the last one takes the full width (no empty cell)
              <div key={m.label} className="min-w-0 bg-card px-2 py-2 text-center last:col-span-2 sm:last:col-span-1">
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground/75">
                  <m.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{m.label}</span>
                </p>
                <p className={`mt-0.5 text-base font-bold tabular-nums ${m.highlight}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
