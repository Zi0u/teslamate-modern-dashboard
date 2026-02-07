import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useTopDestinations } from "../hooks/useApi";
import { useTranslation } from "../i18n/LanguageContext";

function shortenAddress(address: string) {
  const parts = address.split(",");
  let result = parts[0].trim();
  if (/^\d+$/.test(result) && parts.length > 1) {
    result = `${result}, ${parts[1].trim()}`;
  }
  return result.length > 25 ? result.slice(0, 25) + "..." : result;
}

const medals = ["text-amber-400", "text-zinc-400", "text-orange-400"];

export function TopDestinations() {
  const { data, isLoading, error } = useTopDestinations();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("destinations.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          {t("destinations.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((dest, i) => (
          <div key={dest.address} className="flex items-center gap-2">
            <span className={`text-sm font-bold w-5 ${medals[i] || "text-muted-foreground"}`}>
              #{i + 1}
            </span>
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium truncate flex-1">
              {shortenAddress(dest.address)}
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {dest.visit_count} {t("destinations.visits")}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
