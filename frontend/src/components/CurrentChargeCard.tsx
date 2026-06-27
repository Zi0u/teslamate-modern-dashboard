import { Zap, Gauge, Thermometer, ThermometerSun, BatteryCharging } from "lucide-react";
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

export function CurrentChargeCard({ carId = 1 }: { carId?: number }) {
  const { data, isLoading, error } = useCurrentCharge(carId);
  const { t } = useTranslation();

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

  const level = Number(data.battery_level);
  const fmtTemp = (v: number | null) => (v != null ? `${Number(v).toFixed(1)}°` : "—");
  const items = [
    {
      icon: Zap,
      label: t("charging.added"),
      value: `${Number(data.charge_energy_added).toFixed(2)} kWh`,
    },
    {
      icon: BatteryCharging,
      label: t("charging.power"),
      value: `${Number(data.charger_power)} kW`,
    },
    {
      icon: Gauge,
      label: t("charging.range"),
      value: `${Math.round(Number(data.ideal_battery_range_km))} km`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            {t("charging.title")}
          </CardTitle>
          <p className="text-xs font-medium text-foreground/70 mt-1">
            {t("charging.since")} {formatSince(data.start_date)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Charge level bar (towards 100%) */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{t("charging.level")}</span>
            <span className={`font-semibold ${batteryTextColor(level)}`}>{level}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`relative h-full rounded-full ${batteryBarColor(level)} overflow-hidden transition-[width] duration-1000 ease-out`}
              style={{ width: `${level}%` }}
            >
              {/* Shimmer sweep to convey active charging */}
              <div className="absolute inset-0 animate-[charge-shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <item.icon className="h-3 w-3" />
                {item.label}
              </div>
              <p className="text-sm font-bold">{item.value}</p>
            </div>
          ))}

          {/* Outside + cabin temperatures grouped in one box */}
          <div className="rounded-lg border bg-muted/30 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <Thermometer className="h-3 w-3" />
              {t("charging.temps")}
            </div>
            <div className="flex flex-col gap-0.5 text-sm font-bold">
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-muted-foreground shrink-0" />
                {fmtTemp(data.outside_temp)}
                <span className="text-[10px] font-normal text-muted-foreground">{t("charging.tempOutShort")}</span>
              </span>
              <span className="flex items-center gap-1">
                <ThermometerSun className="h-3 w-3 text-muted-foreground shrink-0" />
                {fmtTemp(data.inside_temp)}
                <span className="text-[10px] font-normal text-muted-foreground">{t("charging.tempInShort")}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
