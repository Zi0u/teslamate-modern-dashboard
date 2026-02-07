export const translations = {
  fr: {
    // Header
    "header.title": "TeslaMate Dashboard",
    "header.range": "km",

    // Car states
    "state.online": "En ligne",
    "state.asleep": "En veille",
    "state.driving": "En conduite",
    "state.charging": "En charge",
    "state.suspended": "Suspendu",
    "state.offline": "Hors ligne",

    // Car
    "car.loadError": "Impossible de charger l'\u00e9tat du v\u00e9hicule",

    // Map
    "map.title": "Localisation",
    "map.lastUpdate": "Derni\u00e8re mise \u00e0 jour",

    // Stats
    "stats.title": "Statistiques",
    "stats.week": "Semaine",
    "stats.month": "Mois",
    "stats.lastMonth": "M-1",
    "stats.distance": "Distance",
    "stats.avgConsumption": "Conso. moy.",
    "stats.totalEnergy": "\u00c9nergie",
    "stats.energyCost": "Co\u00fbt",
    "stats.trips": "trajets",
    "stats.charges": "charges",
    "stats.thisPeriod": "cette p\u00e9riode",
    "stats.loadError": "Impossible de charger les statistiques",

    // Battery health
    "health.title": "Sant\u00e9 de la batterie",
    "health.degradation": "D\u00e9gradation",
    "health.original": "Autonomie neuve",
    "health.current": "Autonomie actuelle",
    "health.loadError": "Donn\u00e9es indisponibles",

    // Last charge
    "charge.title": "Derni\u00e8re charge",
    "charge.ago": "il y a",
    "charge.daysAgo": "j",
    "charge.hoursAgo": "h",
    "charge.minutesAgo": "min",
    "charge.justNow": "\u00e0 l'instant",
    "charge.added": "\u00c9nergie ajout\u00e9e",
    "charge.duration": "Dur\u00e9e",
    "charge.cost": "Co\u00fbt",
    "charge.range": "Autonomie gagn\u00e9e",
    "charge.loadError": "Donn\u00e9es indisponibles",

    // RecentDrives
    "drives.title": "Les 10 derniers trajets",
    "drives.noData": "Aucun trajet",
    "drives.loadError": "Impossible de charger les trajets",

    // Top destinations
    "destinations.title": "Top destinations",
    "destinations.visits": "visites",
    "destinations.avgDist": "moy.",

    // BatteryChart
    "battery.title": "Batterie",
    "battery.tabBattery": "Batterie",
    "battery.tabConsumption": "Consommation",
    "battery.noData": "Pas de donn\u00e9es disponibles",
    "battery.loadError": "Impossible de charger l'historique",
    "battery.tooltipBattery": "Batterie",
    "battery.tooltipRange": "Autonomie",
    "battery.tooltipConsumption": "Consommation",
    "battery.tooltipDistance": "Distance",

    // Heatmap
    "heatmap.title": "Activit\u00e9 (15 jours)",
    "heatmap.drives": "trajets",
    "heatmap.noActivity": "Aucune activit\u00e9",

    // Weather
    "weather.title": "M\u00e9t\u00e9o",
    "weather.wind": "Vent",
    "weather.feelsLike": "Ressenti",

    // Header tooltips
    "tooltip.language": "Changer la langue",
    "tooltip.geofences": "Geo-fences",
    "tooltip.settings": "R\u00e9glages",
    "tooltip.help": "Aide",
  },
  en: {
    // Header
    "header.title": "TeslaMate Dashboard",
    "header.range": "km",

    // Car states
    "state.online": "Online",
    "state.asleep": "Asleep",
    "state.driving": "Driving",
    "state.charging": "Charging",
    "state.suspended": "Suspended",
    "state.offline": "Offline",

    // Car
    "car.loadError": "Unable to load vehicle status",

    // Map
    "map.title": "Location",
    "map.lastUpdate": "Last update",

    // Stats
    "stats.title": "Statistics",
    "stats.week": "Week",
    "stats.month": "Month",
    "stats.lastMonth": "M-1",
    "stats.distance": "Distance",
    "stats.avgConsumption": "Avg. cons.",
    "stats.totalEnergy": "Energy",
    "stats.energyCost": "Cost",
    "stats.trips": "trips",
    "stats.charges": "charges",
    "stats.thisPeriod": "this period",
    "stats.loadError": "Unable to load statistics",

    // Battery health
    "health.title": "Battery health",
    "health.degradation": "Degradation",
    "health.original": "Original range",
    "health.current": "Current range",
    "health.loadError": "Data unavailable",

    // Last charge
    "charge.title": "Last charge",
    "charge.ago": "",
    "charge.daysAgo": "d ago",
    "charge.hoursAgo": "h ago",
    "charge.minutesAgo": "min ago",
    "charge.justNow": "just now",
    "charge.added": "Energy added",
    "charge.duration": "Duration",
    "charge.cost": "Cost",
    "charge.range": "Range gained",
    "charge.loadError": "Data unavailable",

    // RecentDrives
    "drives.title": "Last 10 drives",
    "drives.noData": "No drives",
    "drives.loadError": "Unable to load drives",

    // Top destinations
    "destinations.title": "Top destinations",
    "destinations.visits": "visits",
    "destinations.avgDist": "avg.",

    // BatteryChart
    "battery.title": "Battery",
    "battery.tabBattery": "Battery",
    "battery.tabConsumption": "Consumption",
    "battery.noData": "No data available",
    "battery.loadError": "Unable to load history",
    "battery.tooltipBattery": "Battery",
    "battery.tooltipRange": "Range",
    "battery.tooltipConsumption": "Consumption",
    "battery.tooltipDistance": "Distance",

    // Heatmap
    "heatmap.title": "Activity (15 days)",
    "heatmap.drives": "drives",
    "heatmap.noActivity": "No activity",

    // Weather
    "weather.title": "Weather",
    "weather.wind": "Wind",
    "weather.feelsLike": "Feels like",

    // Header tooltips
    "tooltip.language": "Change language",
    "tooltip.geofences": "Geo-fences",
    "tooltip.settings": "Settings",
    "tooltip.help": "Help",
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.fr;
