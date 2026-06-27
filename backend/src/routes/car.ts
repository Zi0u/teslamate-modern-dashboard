import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { CarStatus } from "../types";

const router = Router();

router.get("/list", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, model, marketing_name FROM cars ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  const carId = parseInt(req.query.car_id as string) || null;
  try {
    const whereClause = carId ? "WHERE c.id = $1" : "";
    const params = carId ? [carId] : [];
    const result = await pool.query<CarStatus>(
      `
      SELECT
        c.id,
        c.name,
        c.model,
        c.marketing_name,
        -- During an active charge, the freshest battery level/range lives in
        -- the charges table (positions lags while the car sits still charging).
        COALESCE(CASE WHEN cp.charger_power > 0 THEN cp.battery_level END, p.battery_level) AS battery_level,
        COALESCE(CASE WHEN cp.charger_power > 0 THEN cp.ideal_battery_range_km END, p.ideal_battery_range_km) AS ideal_battery_range_km,
        p.rated_battery_range_km,
        p.est_battery_range_km,
        p.odometer,
        p.latitude,
        p.longitude,
        p.date AS last_update,
        -- TeslaMate keeps state "online" while charging; derive "charging"
        -- from an open charging_process that is actually drawing power.
        CASE WHEN cp.charger_power > 0 THEN 'charging' ELSE s.state::text END AS state,
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
      LEFT JOIN LATERAL (
        SELECT ch.charger_power, ch.battery_level, ch.ideal_battery_range_km
        FROM charging_processes cpr
        LEFT JOIN LATERAL (
          SELECT charger_power, battery_level, ideal_battery_range_km FROM charges
          WHERE charging_process_id = cpr.id
          ORDER BY date DESC
          LIMIT 1
        ) ch ON true
        WHERE cpr.car_id = c.id AND cpr.end_date IS NULL
        ORDER BY cpr.start_date DESC
        LIMIT 1
      ) cp ON true
      ${whereClause}
      ORDER BY c.id
      LIMIT 1
    `,
      params
    );

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
