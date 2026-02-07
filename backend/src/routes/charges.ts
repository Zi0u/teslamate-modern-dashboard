import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/last", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;

    const result = await pool.query(
      `
      SELECT
        cp.start_date,
        cp.end_date,
        cp.charge_energy_added,
        cp.charge_energy_used,
        cp.start_battery_level,
        cp.end_battery_level,
        cp.duration_min,
        cp.cost,
        cp.start_rated_range_km,
        cp.end_rated_range_km,
        a.display_name AS address
      FROM charging_processes cp
      LEFT JOIN addresses a ON a.id = cp.address_id
      WHERE cp.car_id = $1
      ORDER BY cp.start_date DESC
      LIMIT 1
      `,
      [carId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No charge found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching last charge:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/battery-health", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;

    // Matches Grafana battery-health dashboard exactly:
    // 1. Efficiency = mode of (energy_added / range_change) across charges, fallback to cars.efficiency
    // 2. MaxCapacity = MAX(rated_range * efficiency / usable_soc) from last reading per charge session
    // 3. CurrentCapacity = AVG of same formula over 100 most recent readings
    // 4. Health = LEAST(100, CurrentCapacity / MaxCapacity * 100)
    const result = await pool.query(
      `
      WITH aux AS (
        SELECT
          COALESCE(
            NULLIF(
              ROUND(
                (SELECT mode() WITHIN GROUP (ORDER BY
                  charge_energy_added / NULLIF(end_rated_range_km - start_rated_range_km, 0)
                ) FROM charging_processes WHERE car_id = $1 AND charge_energy_added > 0)::numeric, 3
              ) * 100, 0
            ),
            (SELECT efficiency * 100 FROM cars WHERE id = $1)
          ) AS efficiency
      ),
      max_cap AS (
        SELECT MAX(lr.rated_battery_range_km * a.efficiency / NULLIF(lr.usable_battery_level, 0)) AS val
        FROM (
          SELECT DISTINCT ON (c.charging_process_id)
            c.rated_battery_range_km,
            c.usable_battery_level
          FROM charges c
          JOIN charging_processes cp ON cp.id = c.charging_process_id
          WHERE cp.car_id = $1
            AND c.rated_battery_range_km IS NOT NULL
            AND c.usable_battery_level > 0
          ORDER BY c.charging_process_id, c.date DESC
        ) lr
        CROSS JOIN aux a
      ),
      current_cap AS (
        SELECT AVG(sub.rated_battery_range_km * a.efficiency / NULLIF(sub.usable_battery_level, 0)) AS val
        FROM (
          SELECT c.rated_battery_range_km, c.usable_battery_level
          FROM charges c
          JOIN charging_processes cp ON cp.id = c.charging_process_id
          WHERE cp.car_id = $1
            AND c.rated_battery_range_km IS NOT NULL
            AND c.usable_battery_level > 0
          ORDER BY c.date DESC
          LIMIT 100
        ) sub
        CROSS JOIN aux a
      ),
      car_eff AS (
        SELECT efficiency FROM cars WHERE id = $1
      )
      SELECT
        ROUND((mc.val / ce.efficiency)::numeric, 1) AS original_range_km,
        ROUND((cc.val / ce.efficiency)::numeric, 1) AS current_range_km,
        LEAST(100, ROUND((cc.val / mc.val * 100)::numeric, 1)) AS battery_health_pct,
        GREATEST(0, ROUND((100 - cc.val / mc.val * 100)::numeric, 1)) AS degradation_pct
      FROM max_cap mc, current_cap cc, car_eff ce
      `,
      [carId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No charge data found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching battery health:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
