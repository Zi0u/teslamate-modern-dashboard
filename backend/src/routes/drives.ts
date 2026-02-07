import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/recent", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 50);
    const carId = parseInt(req.query.car_id as string) || 1;

    const result = await pool.query(
      `
      SELECT
        d.id,
        d.start_date,
        d.end_date,
        ROUND(d.distance::numeric, 2) AS distance_km,
        d.duration_min,
        CASE
          WHEN d.duration_min > 0
          THEN ROUND((d.distance / (d.duration_min / 60.0))::numeric, 1)
          ELSE 0
        END AS avg_speed_kmh,
        sa.display_name AS start_address,
        ea.display_name AS end_address,
        sp.battery_level AS start_battery_level,
        ep.battery_level AS end_battery_level,
        CASE
          WHEN d.distance > 0 AND d.start_ideal_range_km > d.end_ideal_range_km
          THEN ROUND(
            ((d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency)::numeric,
            2
          )
          ELSE NULL
        END AS consumption_kwh,
        CASE
          WHEN d.distance > 0 AND d.start_ideal_range_km > d.end_ideal_range_km
          THEN ROUND(
            (((d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency)
              / d.distance * 100)::numeric,
            1
          )
          ELSE NULL
        END AS consumption_kwh_per_100km
      FROM drives d
      JOIN cars c ON c.id = d.car_id
      LEFT JOIN addresses sa ON sa.id = d.start_address_id
      LEFT JOIN addresses ea ON ea.id = d.end_address_id
      LEFT JOIN positions sp ON sp.id = d.start_position_id
      LEFT JOIN positions ep ON ep.id = d.end_position_id
      WHERE d.car_id = $1
        AND d.distance > 0
      ORDER BY d.start_date DESC
      LIMIT $2
      `,
      [carId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching recent drives:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Top destinations
router.get("/top-destinations", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 3, 10);

    const result = await pool.query(
      `
      SELECT
        a.display_name AS address,
        COUNT(*) AS visit_count,
        ROUND(AVG(d.distance)::numeric, 1) AS avg_distance_km
      FROM drives d
      JOIN addresses a ON a.id = d.end_address_id
      WHERE d.car_id = $1
        AND d.distance > 0
      GROUP BY a.id, a.display_name
      ORDER BY visit_count DESC
      LIMIT $2
      `,
      [carId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching top destinations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Drive activity heatmap (last N days)
router.get("/activity", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;
    const days = Math.min(parseInt(req.query.days as string) || 15, 60);

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(d.start_date::date, 'YYYY-MM-DD') AS day,
        COUNT(*) AS drive_count,
        ROUND(SUM(d.distance)::numeric, 1) AS total_distance_km
      FROM drives d
      WHERE d.car_id = $1
        AND d.start_date >= CURRENT_DATE - ($2 || ' days')::interval
        AND d.distance > 0
      GROUP BY d.start_date::date
      ORDER BY day
      `,
      [carId, days]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching drive activity:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Consumption history (last N days, daily average)
router.get("/consumption-history", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(d.start_date::date, 'YYYY-MM-DD') AS day,
        ROUND(
          AVG(
            CASE
              WHEN d.start_ideal_range_km > d.end_ideal_range_km AND d.distance > 0
              THEN ((d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency) / d.distance * 100
              ELSE NULL
            END
          )::numeric, 1
        ) AS avg_consumption,
        ROUND(SUM(d.distance)::numeric, 1) AS total_distance_km,
        COUNT(*) AS drive_count
      FROM drives d
      JOIN cars c ON c.id = d.car_id
      WHERE d.car_id = $1
        AND d.start_date >= CURRENT_DATE - ($2 || ' days')::interval
        AND d.distance > 0
      GROUP BY d.start_date::date
      ORDER BY day
      `,
      [carId, days]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching consumption history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
