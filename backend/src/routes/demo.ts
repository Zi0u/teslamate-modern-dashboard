import { Router, Request, Response } from "express";
import {
  demoCar,
  demoCar2,
  demoCars,
  demoStats,
  demoCar2Stats,
  demoBatteryHealth,
  demoCar2BatteryHealth,
  demoLastCharge,
  demoCar2LastCharge,
  demoDrives,
  demoCar2Drives,
  demoBatteryHistory,
  demoCar2BatteryHistory,
  demoTopDestinations,
  demoCar2TopDestinations,
  demoDriveActivity,
  demoCar2DriveActivity,
  demoConsumptionHistory,
  demoCar2ConsumptionHistory,
} from "../data/demo";

const router = Router();

function carId(req: Request): number {
  return parseInt(req.query.car_id as string) || 1;
}

// Cars list
router.get("/car/list", (_req: Request, res: Response) => {
  res.json(demoCars);
});

// Car status
router.get("/car/status", (req: Request, res: Response) => {
  const car = carId(req) === 2 ? demoCar2 : demoCar;
  res.json({
    ...car,
    last_update: carId(req) === 2 ? car.last_update : new Date().toISOString(),
    demo_mode: true,
  });
});

// Stats
router.get("/stats/period", (req: Request, res: Response) => {
  const p = req.query.period as string;
  const period = p === "week" ? "week" : p === "last_month" ? "last_month" : "month";
  const stats = carId(req) === 2 ? demoCar2Stats : demoStats;
  res.json(stats[period]);
});

// Drives
router.get("/drives/recent", (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 5, 50);
  const drives = carId(req) === 2 ? demoCar2Drives : demoDrives;
  res.json(drives.slice(0, limit));
});

// Battery history
router.get("/battery/history", (req: Request, res: Response) => {
  res.json(carId(req) === 2 ? demoCar2BatteryHistory : demoBatteryHistory);
});

// Last charge
router.get("/charges/last", (req: Request, res: Response) => {
  res.json(carId(req) === 2 ? demoCar2LastCharge : demoLastCharge);
});

// Battery health
router.get("/charges/battery-health", (req: Request, res: Response) => {
  res.json(carId(req) === 2 ? demoCar2BatteryHealth : demoBatteryHealth);
});

// Top destinations
router.get("/drives/top-destinations", (req: Request, res: Response) => {
  res.json(carId(req) === 2 ? demoCar2TopDestinations : demoTopDestinations);
});

// Drive activity
router.get("/drives/activity", (req: Request, res: Response) => {
  res.json(carId(req) === 2 ? demoCar2DriveActivity : demoDriveActivity);
});

// Consumption history
router.get("/drives/consumption-history", (req: Request, res: Response) => {
  res.json(carId(req) === 2 ? demoCar2ConsumptionHistory : demoConsumptionHistory);
});

// Grafana URL (demo)
router.get("/settings/grafana-url", (_req: Request, res: Response) => {
  res.json({ grafana_url: "http://localhost:3000", base_url: "http://localhost:4000" });
});

// Weather proxy (Open-Meteo)
router.get("/weather", async (_req: Request, res: Response) => {
  res.json({
    temperature: 12.5,
    weathercode: 2,
    windspeed: 14.2,
    winddirection: 210,
    is_day: 1,
    time: new Date().toISOString(),
  });
});

// Health check
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", database: true, demo: true });
});

export default router;
