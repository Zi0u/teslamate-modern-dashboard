import { Route, Car, Zap, BatteryCharging, Hash, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useDriveActivity } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";
import { formatMoney, useCurrency } from "../lib/currency";
import { localDayKey } from "../lib/day";

// A light-hearted message for days without any drive or charge; picked from the date so a
// given day always shows the same one (no change on refresh)
const IDLE_MESSAGES = ["day.idle1", "day.idle2", "day.idle3", "day.idle4", "day.idle5"] as const;
const idleIndex = (day: string) => [...day].reduce((sum, c) => sum + c.charCodeAt(0), 0) % IDLE_MESSAGES.length;

// Details of the day picked in the 30-day activity (today by default): drives and charges.
// Uses the same query as the activity card (shared React Query cache, no extra request).
export function DayDetailCard({ carId = 1, day }: { carId?: number; day: string }) {
  const { data, isLoading } = useDriveActivity(30, carId);
  const { locale, t } = useTranslation();
  const [currency] = useCurrency();
  const numLocale = locale === "fr" ? "fr-FR" : "en-GB";

  // "YYYY-MM-DD" -> local date (no UTC shift)
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const isToday = day === localDayKey(new Date());
  const dateLabel = date.toLocaleDateString(numLocale, { weekday: "long", day: "numeric", month: "long" });

  // Title, then the date on its own line (one text run, so it wraps cleanly on narrow cards)
  const header = (
    <CardHeader className="pb-2">
      <CardTitle className="whitespace-nowrap text-base font-semibold text-foreground">{t("day.title")}</CardTitle>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          {isToday ? `${t("day.today")} · ${dateLabel}` : dateLabel.charAt(0).toLocaleUpperCase(numLocale) + dateLabel.slice(1)}
        </span>
      </p>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card>
        {header}
        <CardContent>
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const activity = data?.find((a) => a.day === day);
  const drives = Number(activity?.drive_count ?? 0);
  const distance = Number(activity?.total_distance_km ?? 0);
  const charges = Number(activity?.charge_count ?? 0);
  const costedCharges = Number(activity?.costed_charge_count ?? 0);
  const cost = activity?.charge_cost != null ? Number(activity.charge_cost) : null;
  const energy = activity?.charge_energy_kwh != null ? Number(activity.charge_energy_kwh) : null;
  const plural = (n: number, one: Parameters<typeof t>[0], many: Parameters<typeof t>[0]) => t(n === 1 ? one : many);

  const rows = [
    { icon: Route, label: t("stats.distance"), value: `${distance.toLocaleString(numLocale, { maximumFractionDigits: 1 })} km` },
    { icon: Car, label: t("day.drives"), value: String(drives), sub: plural(drives, "heatmap.drive", "heatmap.drives") },
    { icon: Zap, label: t("day.charges"), value: String(charges), sub: plural(charges, "heatmap.charge", "heatmap.charges") },
    {
      icon: BatteryCharging,
      label: t("day.energy"),
      value: energy != null ? `${energy.toLocaleString(numLocale, { maximumFractionDigits: 1 })} kWh` : "—",
    },
    {
      icon: Hash,
      label: t("stats.energyCost"),
      // ≈ when some charges of the day have no price in TeslaMate
      value:
        cost != null
          ? `${costedCharges < charges ? "≈ " : ""}${formatMoney(cost, numLocale, currency)}`
          : "—",
      sub: charges > 0 && cost == null ? t("stats.costNotSet") : undefined,
    },
  ];

  return (
    <Card>
      {header}
      <CardContent className="space-y-1.5">
        {drives === 0 && charges === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t(IDLE_MESSAGES[idleIndex(day)])}</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2 border-b border-border/50 py-1.5 last:border-0">
              <row.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm font-bold tabular-nums">{row.value}</span>
              <span className="w-16 text-right text-[10px] text-muted-foreground">{row.sub ?? ""}</span>
            </div>
          ))
        )}
        <p className="pt-1 text-[10px] text-muted-foreground/80">{t("day.hint")}</p>
      </CardContent>
    </Card>
  );
}
