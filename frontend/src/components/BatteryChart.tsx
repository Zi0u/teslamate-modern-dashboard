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

type Tab = "battery" | "consumption";

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
  payload?: TooltipPayloadItem[];
  label?: string;
  dateLocale: string;
  consumptionLabel: string;
  avgLabel: string;
}

function ConsumptionTooltip({ active, payload, label, dateLocale, consumptionLabel, avgLabel }: ConsumptionTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  const formatted = new Date(label + "T00:00:00").toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
  });
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{formatted}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium">
          {entry.dataKey === "avg_consumption"
            ? `${consumptionLabel}: ${entry.value} kWh/100km`
            : `${avgLabel}: ${entry.value} kWh/100km`}
        </p>
      ))}
    </div>
  );
}

export function BatteryChart() {
  const [tab, setTab] = useState<Tab>("battery");
  const { data: batteryData, isLoading: batteryLoading } = useBatteryHistory();
  const { data: consumptionData, isLoading: consumptionLoading } = useConsumptionHistory();
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

  // Compute average consumption
  const avgConsumption =
    consumptionData && consumptionData.length > 0
      ? consumptionData.reduce((sum, d) => sum + Number(d.avg_consumption), 0) / consumptionData.length
      : 0;

  // Compute Y domain for consumption chart with headroom
  const maxConsumption =
    consumptionData && consumptionData.length > 0
      ? Math.max(...consumptionData.map((d) => Number(d.avg_consumption)))
      : 20;
  const yMax = Math.ceil(Math.max(maxConsumption, avgConsumption) / 2) * 2 + 4;

  const title = tab === "battery"
    ? t("battery.tabBattery") + " (7 " + (locale === "fr" ? "jours" : "days") + ")"
    : t("battery.tabConsumption") + " (7 " + (locale === "fr" ? "jours" : "days") + ")";

  if (isLoading) {
    return (
      <Card>
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
    <Card>
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
      <CardContent>
        {tab === "battery" ? (
          batteryData && batteryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
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
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("battery.noData")}
            </p>
          )
        ) : consumptionData && consumptionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={consumptionData}>
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
                tickFormatter={(v: number) => `${v}`}
                stroke="hsl(215, 20%, 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={
                  <ConsumptionTooltip
                    dateLocale={dateLocale}
                    consumptionLabel={t("battery.tooltipConsumption")}
                    avgLabel={locale === "fr" ? "Moyenne" : "Average"}
                  />
                }
              />
              <ReferenceLine
                y={Number(avgConsumption.toFixed(1))}
                stroke="hsl(48, 96%, 53%)"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `${locale === "fr" ? "Moy" : "Avg"}: ${avgConsumption.toFixed(1)}`,
                  position: "right",
                  fill: "hsl(48, 96%, 53%)",
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="avg_consumption"
                fill="hsl(142, 71%, 45%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t("battery.noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
