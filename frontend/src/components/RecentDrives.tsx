import { Flag, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useRecentDrives } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

function shortenAddress(address: string | null) {
  if (!address) return "?";
  const parts = address.split(",");
  // If first part is just a number (street number), include the street name too
  let result = parts[0].trim();
  if (/^\d+$/.test(result) && parts.length > 1) {
    result = `${result}, ${parts[1].trim()}`;
  }
  return result.length > 22 ? result.slice(0, 22) + "..." : result;
}

export function RecentDrives({ carId = 1 }: { carId?: number }) {
  const { data, isLoading, error } = useRecentDrives(10, carId);
  const { locale, t } = useTranslation();

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("drives.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("drives.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          {t("drives.loadError")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          {t("drives.title")}
        </CardTitle>
      </CardHeader>
      {/* When the card is taller than the list, the rows spread evenly over the height */}
      <CardContent className="flex flex-1 flex-col">
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">
            {t("drives.noData")}
          </p>
        ) : (
          <div className="relative flex flex-1 flex-col max-h-[250px] sm:max-h-none overflow-y-auto">
            {/* Main timeline line */}
            <div className="absolute left-[28px] top-3 bottom-3 w-px border-l border-dashed border-muted-foreground/30" />

            <div className="flex flex-1 flex-col justify-between gap-3">
              {data.map((drive) => (
                <div key={drive.id} className="relative flex gap-3">
                  {/* Timeline: date badge (fixed width so every row lines up, centered on the timeline) */}
                  <div className="flex w-14 items-center justify-center shrink-0 z-10">
                    <span className="w-full text-center text-[10px] font-medium text-muted-foreground bg-muted border py-0.5 rounded whitespace-nowrap">
                      {formatDate(drive.start_date)}
                    </span>
                  </div>

                  {/* Flags column */}
                  <div className="flex flex-col items-center w-3 shrink-0 py-1">
                    <Flag className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500 shrink-0" />
                    <div className="flex-1 w-px border-l border-dotted border-muted-foreground/40 my-0.5" />
                    <Flag className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {/* Addresses */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <span className="text-xs font-medium truncate">
                        {shortenAddress(drive.end_address)}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {shortenAddress(drive.start_address)}
                      </span>
                    </div>

                    {/* Stats: icons in one column, values right-aligned in the other */}
                    <div className="grid w-[60px] grid-cols-[auto_1fr] items-center gap-x-1 text-[10px] text-muted-foreground tabular-nums shrink-0">
                      <MapPin className="h-2.5 w-2.5" />
                      <span className="text-right">
                        {Number(drive.distance_km).toLocaleString(dateLocale, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{" "}
                        km
                      </span>
                      <Clock className="h-2.5 w-2.5" />
                      <span className="text-right">{formatDuration(drive.duration_min)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
