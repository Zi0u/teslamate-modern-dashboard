import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  CarSummary,
  CarStatus,
  MonthlyStats,
  Drive,
  BatteryHistoryPoint,
  LastCharge,
  CurrentCharge,
  BatteryHealth,
  TopDestination,
  DriveActivity,
  ConsumptionPoint,
  CurrentWeather,
  FuelPrices,
} from "../types";

const API_BASE = "/api";

// Browser time zone, so the backend cuts days/weeks/months at local midnight
const TZ = `tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`;

// Keeps the HTTP status so components can tell "nothing yet" (404) from a real error
export class ApiError extends Error {
  constructor(public status: number, statusText: string) {
    super(`API error: ${status} ${statusText}`);
  }
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText);
  }
  return res.json();
}

export function useCars() {
  return useQuery<CarSummary[]>({
    queryKey: ["car", "list"],
    queryFn: () => fetchJson("/car/list"),
    staleTime: Infinity,
    refetchInterval: false,
  });
}

export function useCarStatus(carId?: number) {
  return useQuery<CarStatus>({
    queryKey: ["car", "status", carId],
    queryFn: () => fetchJson(carId ? `/car/status?car_id=${carId}` : "/car/status"),
    // TeslaMate streams positions several times per second while driving:
    // poll fast so the map follows the car, slow down otherwise.
    refetchInterval: (query) => (query.state.data?.state === "driving" ? 3_000 : 30_000),
  });
}

export function usePeriodStats(period: "week" | "month" | "last_month" = "month", carId = 1) {
  return useQuery<MonthlyStats>({
    queryKey: ["stats", "period", period, carId],
    queryFn: () => fetchJson(`/stats/period?car_id=${carId}&period=${period}&${TZ}`),
    refetchInterval: 60_000,
    // Keep the current numbers while another period loads (no skeleton flash when switching tabs)
    placeholderData: keepPreviousData,
  });
}

export function useRecentDrives(limit = 5, carId = 1) {
  return useQuery<Drive[]>({
    queryKey: ["drives", "recent", carId, limit],
    queryFn: () => fetchJson(`/drives/recent?car_id=${carId}&limit=${limit}`),
    refetchInterval: 60_000,
  });
}

export function useBatteryHistory(days = 7, carId = 1) {
  return useQuery<BatteryHistoryPoint[]>({
    queryKey: ["battery", "history", carId, days],
    queryFn: () => fetchJson(`/battery/history?car_id=${carId}&days=${days}`),
    refetchInterval: 300_000,
  });
}

export function useLastCharge(carId = 1) {
  return useQuery<LastCharge>({
    queryKey: ["charges", "last", carId],
    queryFn: () => fetchJson(`/charges/last?car_id=${carId}`),
    refetchInterval: 300_000,
    // 404 = no charge recorded yet for this car: nothing to retry
    retry: (count, error) => !isNotFound(error) && count < 3,
  });
}

// Average fuel prices for the "vs gasoline/diesel" comparison (backend caches 6h)
export function useFuelPrices() {
  return useQuery<FuelPrices>({
    queryKey: ["fuel-prices"],
    queryFn: () => fetchJson("/fuel-prices"),
    staleTime: 3_600_000,
    refetchInterval: 3_600_000,
  });
}

export function useCurrentCharge(carId = 1, enabled = true) {
  return useQuery<CurrentCharge>({
    queryKey: ["charges", "current", carId],
    queryFn: () => fetchJson(`/charges/current?car_id=${carId}`),
    enabled,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useBatteryHealth(carId = 1) {
  return useQuery<BatteryHealth>({
    queryKey: ["charges", "battery-health", carId],
    queryFn: () => fetchJson(`/charges/battery-health?car_id=${carId}`),
    refetchInterval: 600_000,
  });
}

export function useTopDestinations(limit = 3, carId = 1) {
  return useQuery<TopDestination[]>({
    queryKey: ["drives", "top-destinations", carId, limit],
    queryFn: () => fetchJson(`/drives/top-destinations?car_id=${carId}&limit=${limit}`),
    refetchInterval: 300_000,
  });
}

export function useDriveActivity(days = 15, carId = 1) {
  return useQuery<DriveActivity[]>({
    queryKey: ["drives", "activity", carId, days],
    queryFn: () => fetchJson(`/drives/activity?car_id=${carId}&days=${days}&${TZ}`),
    refetchInterval: 300_000,
  });
}

export function useConsumptionHistory(days = 7, carId = 1) {
  return useQuery<ConsumptionPoint[]>({
    queryKey: ["drives", "consumption-history", carId, days],
    queryFn: () => fetchJson(`/drives/consumption-history?car_id=${carId}&days=${days}&${TZ}`),
    refetchInterval: 300_000,
  });
}

export function useGrafanaUrl() {
  return useQuery<{ grafana_url: string | null; base_url: string | null }>({
    queryKey: ["settings", "grafana-url"],
    queryFn: () => fetchJson("/settings/grafana-url"),
    refetchInterval: false,
    staleTime: Infinity,
  });
}

export function useWeather(lat?: number, lon?: number) {
  return useQuery<CurrentWeather>({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchJson(`/weather?lat=${lat}&lon=${lon}`),
    enabled: lat != null && lon != null,
    refetchInterval: 600_000,
  });
}
