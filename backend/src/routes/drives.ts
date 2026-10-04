import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { getTimeZone, toLocal, localToUtc, localNow } from "../utils/timezone";

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

    // Last N days including today, from local midnight
    const since = localToUtc(`date_trunc('day', ${localNow("$3")}) - make_interval(days => $2::int - 1)`, "$3");
    // Drives and charges per local day (a day can have only one of them)
    const result = await pool.query(
      `
      WITH daily_drives AS (
        SELECT
          TO_CHAR(${toLocal("d.start_date", "$3")}::date, 'YYYY-MM-DD') AS day,
          COUNT(*) AS drive_count,
          ROUND(SUM(d.distance)::numeric, 1) AS total_distance_km
        FROM drives d
        WHERE d.car_id = $1
          AND d.start_date >= ${since}
          AND d.distance > 0
        GROUP BY day
      ),
      daily_charges AS (
        SELECT
          TO_CHAR(${toLocal("cp.start_date", "$3")}::date, 'YYYY-MM-DD') AS day,
          COUNT(*) AS charge_count,
          -- TeslaMate leaves cost NULL when no price is set for the location
          COUNT(cp.cost) AS costed_charge_count,
          ROUND(SUM(cp.cost)::numeric, 2) AS charge_cost,
          ROUND(SUM(cp.charge_energy_added)::numeric, 1) AS charge_energy_kwh
        FROM charging_processes cp
        WHERE cp.car_id = $1
          AND cp.start_date >= ${since}
          AND cp.end_date IS NOT NULL
        GROUP BY day
      )
      SELECT
        COALESCE(dd.day, dc.day) AS day,
        COALESCE(dd.drive_count, 0) AS drive_count,
        COALESCE(dd.total_distance_km, 0) AS total_distance_km,
        COALESCE(dc.charge_count, 0) AS charge_count,
        COALESCE(dc.costed_charge_count, 0) AS costed_charge_count,
        dc.charge_cost,
        dc.charge_energy_kwh
      FROM daily_drives dd
      FULL OUTER JOIN daily_charges dc ON dc.day = dd.day
      ORDER BY day
      `,
      [carId, days, getTimeZone(req)]
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
        TO_CHAR(${toLocal("d.start_date", "$3")}::date, 'YYYY-MM-DD') AS day,
        -- Total energy / total distance (distance-weighted), so a short trip
        -- doesn't weigh as much as a long one. Drives that gained range are excluded.
        ROUND(
          (
            SUM((d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency)
              FILTER (WHERE d.start_ideal_range_km > d.end_ideal_range_km)
            / NULLIF(SUM(d.distance) FILTER (WHERE d.start_ideal_range_km > d.end_ideal_range_km), 0)
            * 100
          )::numeric, 1
        ) AS avg_consumption,
        ROUND((SUM(d.distance) FILTER (WHERE d.start_ideal_range_km > d.end_ideal_range_km))::numeric, 1) AS consumption_distance_km,
        ROUND(SUM(d.distance)::numeric, 1) AS total_distance_km,
        COUNT(*) AS drive_count
      FROM drives d
      JOIN cars c ON c.id = d.car_id
      WHERE d.car_id = $1
        -- Last N days including today, from local midnight
        AND d.start_date >= ${localToUtc(`date_trunc('day', ${localNow("$3")}) - make_interval(days => $2::int - 1)`, "$3")}
        AND d.distance > 0
      GROUP BY day
      ORDER BY day
      `,
      [carId, days, getTimeZone(req)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching consumption history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
