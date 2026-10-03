import { Request } from "express";

// The viewer's IANA time zone (sent by the frontend as ?tz=Europe/Paris), used to
// cut days/weeks/months at local midnight. TeslaMate stores dates in UTC.
// Always passed to SQL as a bound parameter; falls back to UTC if missing or invalid.
export function getTimeZone(req: Request): string {
  const tz = req.query.tz;
  if (typeof tz !== "string" || tz.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

// SQL helpers. `tzParam` is the placeholder of the time zone parameter (e.g. "$3").

// A TeslaMate UTC timestamp column converted to local wall-clock time
export const toLocal = (column: string, tzParam: string) =>
  `(${column} AT TIME ZONE 'UTC' AT TIME ZONE ${tzParam})`;

// A local wall-clock timestamp expression converted back to UTC, to compare
// against TeslaMate columns (keeps the comparison index-friendly)
export const localToUtc = (localExpr: string, tzParam: string) =>
  `((${localExpr}) AT TIME ZONE ${tzParam} AT TIME ZONE 'UTC')`;

// Current local wall-clock time
export const localNow = (tzParam: string) => `(NOW() AT TIME ZONE ${tzParam})`;
