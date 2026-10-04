import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useBatteryHistory, useConsumptionHistory } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";
import type { ConsumptionPoint } from "../types";

type Tab = "battery" | "consumption";

const AVG_COLOR = "hsl(48, 96%, 53%)";

type ConsumptionChartPoint = Omit<ConsumptionPoint, "avg_consumption"> & { avg_consumption: number | null };

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
}

interface BatteryTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  dateLocale: string;
  batteryLabel: string;
  rangeLabel: string;
}

function BatteryTooltip({ active, payload, label, dateLocale, batteryLabel, rangeLabel }: BatteryTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  const formatted = new Date(label).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{formatted}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium">
          {entry.dataKey === "battery_level"
            ? `${batteryLabel}: ${entry.value}%`
            : `${rangeLabel}: ${entry.value} km`}
        </p>
      ))}
    </div>
  );
}

interface ConsumptionTooltipProps {
  active?: boolean;
  payload?: { payload: ConsumptionChartPoint }[];
  label?: string;
  dateLocale: string;
  average: number;
  consumptionLabel: string;
  vsAverageLabel: string;
  distanceLabel: string;
  drivesLabel: string;
}

function ConsumptionTooltip({
  active,
  payload,
  label,
  dateLocale,
  average,
  consumptionLabel,
  vsAverageLabel,
  distanceLabel,
  drivesLabel,
}: ConsumptionTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  const point = payload[0].payload;
  const formatted = new Date(label + "T00:00:00").toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
  });
  const diff = point.avg_consumption !== null && average > 0 ? point.avg_consumption - average : null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{formatted}</p>
      {point.avg_consumption !== null && (
        <p className="text-sm font-medium">
          {consumptionLabel}: {point.avg_consumption.toFixed(1)} kWh/100km
        </p>
      )}
      {diff !== null && (
        <p className={`text-xs font-medium ${diff > 0 ? "text-red-400" : "text-green-400"}`}>
          {diff > 0 ? "+" : ""}
          {diff.toFixed(1)} {vsAverageLabel}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {distanceLabel}: {Number(point.total_distance_km).toFixed(1)} km · {point.drive_count} {drivesLabel}
      </p>
    </div>
  );
}

export function BatteryChart({ carId = 1 }: { carId?: number }) {
  const [tab, setTab] = useState<Tab>("battery");
  const { data: batteryData, isLoading: batteryLoading } = useBatteryHistory(7, carId);
  const { data: consumptionData, isLoading: consumptionLoading } = useConsumptionHistory(7, carId);
  const { locale, t } = useTranslation();

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";

  const pillBase =
    "px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer";
  const pillActive = "bg-primary text-primary-foreground";
  const pillInactive = "text-muted-foreground hover:text-foreground hover:bg-muted";

  const formatAxisDate = (dateStr: string) => {
    const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
    });
  };

  const isLoading = tab === "battery" ? batteryLoading : consumptionLoading;

  // PostgreSQL numerics arrive as strings: convert once for the chart.
  // Days can have drives but no consumption (car efficiency not computed yet by TeslaMate):
  // the chart is only shown when at least one day has a value, else "no data".
  const consumptionPoints: ConsumptionChartPoint[] = (consumptionData ?? []).map((d) => ({
    ...d,
    avg_consumption: d.avg_consumption === null ? null : Number(d.avg_consumption),
  }));

  // Period average weighted by distance (total energy / total distance), not a mean of daily values
  const weightedDays = consumptionPoints.filter(
    (d) => d.avg_consumption !== null && Number(d.consumption_distance_km) > 0
  );
  const weightedDistance = weightedDays.reduce((sum, d) => sum + Number(d.consumption_distance_km), 0);
  const avgConsumption =
    weightedDistance > 0
      ? weightedDays.reduce((sum, d) => sum + (d.avg_consumption ?? 0) * Number(d.consumption_distance_km), 0) /
        weightedDistance
      : 0;
  const totalDistance = consumptionPoints.reduce((sum, d) => sum + Number(d.total_distance_km), 0);
  const totalDrives = consumptionPoints.reduce((sum, d) => sum + Number(d.drive_count), 0);

  // Y axis with headroom and round ticks (0, 5, 10... or 0, 10, 20...)
  const maxConsumption = Math.max(avgConsumption, ...consumptionPoints.map((d) => d.avg_consumption ?? 0));
  const yStep = maxConsumption > 30 ? 10 : 5;
  const yMax = Math.max(yStep, Math.ceil((maxConsumption * 1.1) / yStep) * yStep);
  const yTicks = Array.from({ length: yMax / yStep + 1 }, (_, i) => i * yStep);

  const title = tab === "battery"
    ? t("battery.tabBattery") + " (7 " + (locale === "fr" ? "jours" : "days") + ")"
    : t("battery.tabConsumption") + " (7 " + (locale === "fr" ? "jours" : "days") + ")";

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1 rounded-full border p-0.5">
            <button
              onClick={() => setTab("battery")}
              className={`${pillBase} ${tab === "battery" ? pillActive : pillInactive}`}
            >
              {t("battery.tabBattery")}
            </button>
            <button
              onClick={() => setTab("consumption")}
              className={`${pillBase} ${tab === "consumption" ? pillActive : pillInactive}`}
            >
              {t("battery.tabConsumption")}
            </button>
          </div>
        </div>
      </CardHeader>
      {/* Chart grows to fill the card when the grid row is taller (bottom aligned with column 4) */}
      <CardContent className="flex flex-1 flex-col">
        {tab === "battery" ? (
          batteryData && batteryData.length > 0 ? (
            <div className="relative min-h-[280px] flex-1 lg:min-h-[200px]">
            {/* Absolute so the chart never feeds back into the container height */}
            <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
              <AreaChart data={batteryData}>
                <defs>
                  <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 100%, 52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 100%, 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(217, 33%, 17%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  stroke="hsl(215, 20%, 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  stroke="hsl(215, 20%, 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  content={
                    <BatteryTooltip
                      dateLocale={dateLocale}
                      batteryLabel={t("battery.tooltipBattery")}
                      rangeLabel={t("battery.tooltipRange")}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="battery_level"
                  stroke="hsl(210, 100%, 52%)"
                  strokeWidth={2}
                  fill="url(#batteryGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <p className="my-auto text-center text-muted-foreground py-8">
              {t("battery.noData")}
            </p>
          )
        ) : consumptionPoints.some((d) => d.avg_consumption !== null) ? (
          <div className="flex flex-1 flex-col">
            {/* Period average, matching the dashed line on the chart */}
            <div className="h-[52px]">
              {avgConsumption > 0 && (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">{avgConsumption.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">kWh/100km</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: AVG_COLOR }} />
                    <span>
                      {t("battery.avgPeriod")} · {Math.round(totalDistance)} km · {totalDrives} {t("battery.drives")}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="relative min-h-[228px] flex-1 lg:min-h-[148px]">
            {/* Absolute so the chart never feeds back into the container height */}
            <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
              <BarChart data={consumptionPoints}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(217, 33%, 17%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatAxisDate}
                  stroke="hsl(215, 20%, 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, yMax]}
                  ticks={yTicks}
                  tickFormatter={(v: number) => `${v}`}
                  stroke="hsl(215, 20%, 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "hsl(217, 33%, 17%)", opacity: 0.4 }}
                  content={
                    <ConsumptionTooltip
                      dateLocale={dateLocale}
                      average={avgConsumption}
                      consumptionLabel={t("battery.tooltipConsumption")}
                      vsAverageLabel={t("battery.vsAverage")}
                      distanceLabel={t("battery.tooltipDistance")}
                      drivesLabel={t("battery.drives")}
                    />
                  }
                />
                <Bar
                  dataKey="avg_consumption"
                  fill="hsl(142, 71%, 45%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                {avgConsumption > 0 && (
                  <ReferenceLine
                    y={Number(avgConsumption.toFixed(1))}
                    stroke={AVG_COLOR}
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    ifOverflow="extendDomain"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="my-auto text-center text-muted-foreground py-8">
            {t("battery.noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
