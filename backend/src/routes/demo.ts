import { Router, Request, Response } from "express";
import {
  demoCar,
  demoStats,
  demoBatteryHealth,
  demoLastCharge,
  demoDrives,
  demoBatteryHistory,
  demoTopDestinations,
  demoDriveActivity,
  demoConsumptionHistory,
} from "../data/demo";

const router = Router();

// Car status
router.get("/car/status", (_req: Request, res: Response) => {
  // Update last_update to current time
  res.json({
    ...demoCar,
    last_update: new Date().toISOString(),
    demo_mode: true,
  });
});

// Stats
router.get("/stats/period", (req: Request, res: Response) => {
  const p = req.query.period as string;
  const period = p === "week" ? "week" : p === "last_month" ? "last_month" : "month";
  res.json(demoStats[period]);
});

// Drives
router.get("/drives/recent", (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 5, 50);
  res.json(demoDrives.slice(0, limit));
});

// Battery history
router.get("/battery/history", (_req: Request, res: Response) => {
  res.json(demoBatteryHistory);
});

// Last charge
router.get("/charges/last", (_req: Request, res: Response) => {
  res.json(demoLastCharge);
});

// Battery health
router.get("/charges/battery-health", (_req: Request, res: Response) => {
  res.json(demoBatteryHealth);
});

// Top destinations
router.get("/drives/top-destinations", (_req: Request, res: Response) => {
  res.json(demoTopDestinations);
});

// Drive activity
router.get("/drives/activity", (_req: Request, res: Response) => {
  res.json(demoDriveActivity);
});

// Consumption history
router.get("/drives/consumption-history", (_req: Request, res: Response) => {
  res.json(demoConsumptionHistory);
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
