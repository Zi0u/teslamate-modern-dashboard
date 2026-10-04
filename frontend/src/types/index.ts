export interface CarSummary {
  id: number;
  name: string | null;
  model: string | null;
  marketing_name: string | null;
}

export interface CarStatus {
  id: number;
  name: string | null;
  model: string | null;
  marketing_name: string | null;
  battery_level: number;
  ideal_battery_range_km: number | null;
  rated_battery_range_km: number;
  est_battery_range_km: number;
  odometer: number;
  state: string;
  latitude: number;
  longitude: number;
  last_update: string;
  firmware_version: string | null;
  demo_mode?: boolean;
}

export interface MonthlyStats {
  total_distance_km: number;
  // null until TeslaMate has computed the car's efficiency (after a few charges)
  avg_consumption_kwh_per_100km: number | null;
  total_energy_kwh: number;
  total_cost: number | null;
  drive_count: number;
  charge_count: number;
  costed_charge_count: number;
  // Savings vs gasoline/diesel: energy of the charges that have a cost, how many of them were in
  // France (fuel price source), and the kWh/100km turning that energy into real km
  costed_energy_kwh: number;
  costed_charges_in_france: number;
  savings_consumption_kwh_100km: number | null;
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

export interface LastCharge {
  start_date: string;
  end_date: string;
  charge_energy_added: number;
  charge_energy_used: number | null;
  start_battery_level: number;
  end_battery_level: number;
  duration_min: number;
  cost: number | null;
  start_rated_range_km: number;
  end_rated_range_km: number;
  address: string | null;
  country_code: string | null;
  geofence: string | null;
  max_power_kw: number | null;
  is_dc: boolean;
  consumption_30d_kwh_100km: string | null;
}

// French national average prices (EUR/L), null when unavailable
export interface FuelPrices {
  gasoline: number | null;
  diesel: number | null;
  updated_at: string | null;
}

export interface CurrentCharge {
  start_date: string;
  start_battery_level: number | null;
  address: string | null;
  geofence: string | null;
  is_dc: boolean | null;
  max_power_kw: number | null;
  charge_energy_added: number;
  charger_power: number;
  battery_level: number;
  ideal_battery_range_km: number;
  rated_battery_range_km: number;
  outside_temp: number | null;
  inside_temp: number | null;
}

// Fields are null while TeslaMate has no charge data for the car yet
export interface BatteryHealth {
  original_range_km: number | null;
  current_range_km: number | null;
  battery_health_pct: number | null;
  degradation_pct: number | null;
}

export interface TopDestination {
  address: string;
  visit_count: string;
  avg_distance_km: string;
}

export interface DriveActivity {
  day: string;
  drive_count: string;
  total_distance_km: string;
}

export interface ConsumptionPoint {
  day: string;
  avg_consumption: string | null;
  consumption_distance_km: string | null;
  total_distance_km: string;
  drive_count: string;
}

export interface CurrentWeather {
  temperature: number;
  weathercode: number;
  windspeed: number;
  winddirection: number;
  is_day: number;
  time: string;
}
