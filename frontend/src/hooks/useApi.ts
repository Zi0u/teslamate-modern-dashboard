import { useQuery } from "@tanstack/react-query";
import type {
  CarStatus,
  MonthlyStats,
  Drive,
  BatteryHistoryPoint,
  LastCharge,
  BatteryHealth,
  TopDestination,
  DriveActivity,
  ConsumptionPoint,
  CurrentWeather,
} from "../types";

const API_BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function useCarStatus() {
  return useQuery<CarStatus>({
    queryKey: ["car", "status"],
    queryFn: () => fetchJson("/car/status"),
    refetchInterval: 30_000,
  });
}

export function usePeriodStats(period: "week" | "month" | "last_month" = "month", carId = 1) {
  return useQuery<MonthlyStats>({
    queryKey: ["stats", "period", period, carId],
    queryFn: () => fetchJson(`/stats/period?car_id=${carId}&period=${period}`),
    refetchInterval: 60_000,
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
    queryFn: () => fetchJson(`/drives/activity?car_id=${carId}&days=${days}`),
    refetchInterval: 300_000,
  });
}

export function useConsumptionHistory(days = 7, carId = 1) {
  return useQuery<ConsumptionPoint[]>({
    queryKey: ["drives", "consumption-history", carId, days],
    queryFn: () => fetchJson(`/drives/consumption-history?car_id=${carId}&days=${days}`),
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
