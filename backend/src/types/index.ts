export interface CarStatus {
  id: number;
  name: string | null;
  model: string | null;
  marketing_name: string | null;
  battery_level: number;
  ideal_battery_range_km: number;
  rated_battery_range_km: number;
  est_battery_range_km: number;
  odometer: number;
  state: string;
  latitude: number;
  longitude: number;
  last_update: string;
  firmware_version: string | null;
}

export interface MonthlyStats {
  total_distance_km: number;
  avg_consumption_kwh_per_100km: number;
  total_energy_kwh: number;
  total_cost: number | null;
  drive_count: number;
  charge_count: number;
}

export interface Drive {
  id: number;
  start_date: string;
  end_date: string;
  distance_km: number;
  duration_min: number;
  avg_speed_kmh: number;
  start_address: string | null;
  end_address: string | null;
  start_battery_level: number | null;
  end_battery_level: number | null;
  consumption_kwh: number | null;
  consumption_kwh_per_100km: number | null;
}

export interface BatteryHistoryPoint {
  date: string;
  battery_level: number;
  ideal_range_km: number;
}
