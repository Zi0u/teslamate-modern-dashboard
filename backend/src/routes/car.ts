import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { CarStatus } from "../types";

const router = Router();

router.get("/status", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<CarStatus>(`
      SELECT
        c.id,
        c.name,
        c.model,
        c.marketing_name,
        p.battery_level,
        p.ideal_battery_range_km,
        p.rated_battery_range_km,
        p.est_battery_range_km,
        p.odometer,
        p.latitude,
        p.longitude,
        p.date AS last_update,
        s.state::text,
        u.version AS firmware_version
      FROM cars c
      LEFT JOIN LATERAL (
        SELECT battery_level, ideal_battery_range_km, rated_battery_range_km,
               est_battery_range_km, odometer, latitude, longitude, date
        FROM positions
        WHERE car_id = c.id
        ORDER BY date DESC
        LIMIT 1
      ) p ON true
      LEFT JOIN LATERAL (
        SELECT state FROM states
        WHERE car_id = c.id
        ORDER BY start_date DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN LATERAL (
        SELECT version FROM updates
        WHERE car_id = c.id
        ORDER BY start_date DESC
        LIMIT 1
      ) u ON true
      ORDER BY c.id
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No car found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching car status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
