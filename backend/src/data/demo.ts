// Demo data for showcase purposes
// Simulates a Tesla Model 3 SR+ with realistic French data

export const demoCar = {
  id: 1,
  name: "My Tesla's name",
  model: "3",
  marketing_name: "SR+",
  battery_level: 72,
  ideal_battery_range_km: 310,
  rated_battery_range_km: 295,
  est_battery_range_km: 285,
  odometer: 45230,
  state: "online",
  latitude: 48.8566,
  longitude: 2.3522,
  last_update: new Date().toISOString(),
  firmware_version: "2026.2.3",
};

export const demoStats = {
  week: {
    total_distance_km: "187.45",
    drive_count: "12",
    total_energy_kwh: "28.50",
    avg_consumption_kwh_per_100km: "15.2",
    total_cost: "7.12",
    charge_count: "2",
  },
  month: {
    total_distance_km: "842.30",
    drive_count: "47",
    total_energy_kwh: "134.80",
    avg_consumption_kwh_per_100km: "16.0",
    total_cost: "33.70",
    charge_count: "8",
  },
  last_month: {
    total_distance_km: "1124.60",
    drive_count: "62",
    total_energy_kwh: "176.40",
    avg_consumption_kwh_per_100km: "15.7",
    total_cost: "44.10",
    charge_count: "11",
  },
};

// Capacity-based health (matching Grafana approach)
// MaxCapacity ~60.5 kWh, CurrentCapacity ~59.3 kWh → 98.0%
// Range derived from capacity / efficiency (0.1373 kWh/km)
export const demoBatteryHealth = {
  original_range_km: "440.6",
  current_range_km: "431.8",
  battery_health_pct: "98.0",
  degradation_pct: "2.0",
};

export const demoLastCharge = {
  start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
  charge_energy_added: "38.20",
  charge_energy_used: "39.50",
  start_battery_level: 22,
  end_battery_level: 90,
  duration_min: 298,
  cost: "9.55",
  start_rated_range_km: "96.80",
  end_rated_range_km: "395.10",
  address: "Superchargeur Tesla, Paris, France",
};

const generateDrives = () => {
  const addresses = [
    { name: "Avenue des Champs-\u00c9lys\u00e9es", city: "Paris" },
    { name: "Place de la Concorde", city: "Paris" },
    { name: "Rue de Rivoli", city: "Paris" },
    { name: "Boulevard Saint-Germain", city: "Paris" },
    { name: "Avenue Montaigne", city: "Paris" },
    { name: "Rue de la Paix", city: "Paris" },
    { name: "Boulevard Haussmann", city: "Paris" },
    { name: "Place de la R\u00e9publique", city: "Paris" },
    { name: "Rue du Faubourg Saint-Honor\u00e9", city: "Paris" },
    { name: "Avenue de la Grande Arm\u00e9e", city: "Paris" },
    { name: "Place de la Bastille", city: "Paris" },
    { name: "Avenue Charles de Gaulle", city: "Neuilly-sur-Seine" },
  ];

  const drives = [];
  let currentDate = new Date();
  let batteryLevel = 72;

  for (let i = 0; i < 12; i++) {
    const distance = 5 + Math.random() * 25;
    const duration = Math.round(distance * 2 + Math.random() * 10);
    const consumption = 14 + Math.random() * 4;
    const batteryUsed = Math.round(distance * consumption / 100 / 4.3);

    const startAddr = addresses[Math.floor(Math.random() * addresses.length)];
    const endAddr = addresses[Math.floor(Math.random() * addresses.length)];

    const endDate = new Date(currentDate);
    const startDate = new Date(currentDate.getTime() - duration * 60 * 1000);

    drives.push({
      id: 2500 + i,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      distance_km: distance.toFixed(2),
      duration_min: duration,
      avg_speed_kmh: ((distance / duration) * 60).toFixed(1),
      start_address: `${startAddr.name}, ${startAddr.city}, \u00cele-de-France, France`,
      end_address: `${endAddr.name}, ${endAddr.city}, \u00cele-de-France, France`,
      start_battery_level: batteryLevel + batteryUsed,
      end_battery_level: batteryLevel,
      consumption_kwh: (distance * consumption / 100).toFixed(2),
      consumption_kwh_per_100km: consumption.toFixed(1),
    });

    // Move to earlier in the day or previous day
    currentDate = new Date(currentDate.getTime() - (2 + Math.random() * 6) * 60 * 60 * 1000);
    if (currentDate.getHours() < 7) {
      currentDate.setDate(currentDate.getDate() - 1);
      currentDate.setHours(18 + Math.floor(Math.random() * 4));
    }
    batteryLevel = Math.min(95, batteryLevel + Math.floor(Math.random() * 15));
  }

  return drives;
};

export const demoDrives = generateDrives();

const generateBatteryHistory = () => {
  const history = [];
  const now = new Date();

  // Hand-crafted realistic 7-day curve (6 points/day = every 4h)
  // Pattern: daily commutes drain ~10-15%, overnight/supercharger charges bump back up
  // Hours:    00h  04h  08h  12h  16h  20h
  const levels = [
    // Day 1 (6 days ago): woke up at 82%, commute + errands, charge overnight
    82,  82,  78,  71,  65,  63,
    // Day 2: overnight charge to 90%, busy day driving
    78,  90,  90,  83,  74,  68,
    // Day 3: no charge, light use
    68,  67,  65,  60,  58,  57,
    // Day 4: plugged in overnight, long drive, supercharger
    72,  85,  85,  76,  45,  80,
    // Day 5: charged well, moderate use
    80,  80,  77,  72,  66,  64,
    // Day 6: no charge, short trips
    64,  63,  61,  57,  54,  52,
    // Day 7 (today): overnight charge, drove this morning, now at 72%
    68,  82,  82,  76,  72, demoCar.battery_level,
  ];

  for (let i = 0; i < levels.length; i++) {
    const day = Math.floor(i / 6);
    const hour = (i % 6) * 4;
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - day));
    date.setHours(hour, 0, 0, 0);

    history.push({
      date: date.toISOString(),
      battery_level: levels[i],
      ideal_range_km: (levels[i] * 4.3).toFixed(1),
    });
  }

  return history;
};

export const demoBatteryHistory = generateBatteryHistory();

// Top destinations
export const demoTopDestinations = [
  { address: "Avenue des Champs-\u00c9lys\u00e9es, Paris, \u00cele-de-France, France", visit_count: "23", avg_distance_km: "8.4" },
  { address: "Avenue Charles de Gaulle, Neuilly-sur-Seine, \u00cele-de-France, France", visit_count: "15", avg_distance_km: "12.7" },
  { address: "Boulevard Saint-Germain, Paris, \u00cele-de-France, France", visit_count: "11", avg_distance_km: "5.2" },
];

// Drive activity heatmap (last 15 days)
const generateDriveActivity = () => {
  const activity = [];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split("T")[0];
    if (Math.random() > 0.25) {
      const count = 1 + Math.floor(Math.random() * 5);
      activity.push({
        day: dayStr,
        drive_count: String(count),
        total_distance_km: (count * (5 + Math.random() * 15)).toFixed(1),
      });
    }
  }
  return activity;
};

export const demoDriveActivity = generateDriveActivity();

// Consumption history (last 7 days)
const generateConsumptionHistory = () => {
  const history = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split("T")[0];
    if (Math.random() > 0.15) {
      history.push({
        day: dayStr,
        avg_consumption: (13 + Math.random() * 6).toFixed(1),
        total_distance_km: (10 + Math.random() * 40).toFixed(1),
        drive_count: String(1 + Math.floor(Math.random() * 4)),
      });
    }
  }
  return history;
};

export const demoConsumptionHistory = generateConsumptionHistory();
