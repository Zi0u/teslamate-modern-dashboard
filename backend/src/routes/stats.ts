import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { getTimeZone, localToUtc, localNow } from "../utils/timezone";

const router = Router();

router.get("/period", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;
    const period = req.query.period as string;

    // Compute SQL date boundaries based on period
    let startExpr: string;
    let endConditionDrives = "";
    let endConditionCharges = "";

    // Boundaries at local midnight in the viewer's time zone ($2), converted to UTC
    const now = localNow("$2");
    if (period === "week") {
      startExpr = localToUtc(`date_trunc('week', ${now})`, "$2");
    } else if (period === "last_month") {
      startExpr = localToUtc(`date_trunc('month', ${now} - interval '1 month')`, "$2");
      const endExpr = localToUtc(`date_trunc('month', ${now})`, "$2");
      endConditionDrives = `AND d.start_date < ${endExpr}`;
      endConditionCharges = `AND cp.end_date < ${endExpr}`;
    } else if (period === "year") {
      // Since January 1st
      startExpr = localToUtc(`date_trunc('year', ${now})`, "$2");
    } else {
      // Default: current month
      startExpr = localToUtc(`date_trunc('month', ${now})`, "$2");
    }

    const result = await pool.query(
      `
      WITH period_drives AS (
        SELECT
          COALESCE(SUM(d.distance), 0) AS total_distance,
          -- Distance of drives that consumed range (same basis as the consumption chart)
          COALESCE(SUM(d.distance) FILTER (WHERE d.start_ideal_range_km > d.end_ideal_range_km), 0) AS consumption_distance,
          COUNT(d.id) AS drive_count,
          COALESCE(SUM(
            CASE
              WHEN d.start_ideal_range_km > d.end_ideal_range_km
              THEN (d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency
              ELSE 0
            END
          ), 0) AS total_consumption_kwh
        FROM drives d
        JOIN cars c ON c.id = d.car_id
        WHERE d.car_id = $1
          AND d.start_date >= ${startExpr}
          ${endConditionDrives}
          AND d.distance > 0
      ),
      period_charges AS (
        SELECT
          COALESCE(SUM(cp.charge_energy_added), 0) AS total_energy,
          COALESCE(SUM(cp.cost), 0) AS total_cost,
          COUNT(cp.id) AS charge_count,
          -- TeslaMate leaves cost NULL when no price is set for the location
          COUNT(cp.cost) AS costed_charge_count,
          -- For the savings vs gasoline/diesel: only charges with a cost (so a missing cost
          -- never inflates the savings), and how many of them were in France (fuel price source)
          COALESCE(SUM(cp.charge_energy_added) FILTER (WHERE cp.cost IS NOT NULL), 0) AS costed_energy,
          COUNT(cp.id) FILTER (
            WHERE cp.cost IS NOT NULL AND LOWER(a.raw->'address'->>'country_code') = 'fr'
          ) AS costed_charges_in_france
        FROM charging_processes cp
        LEFT JOIN addresses a ON a.id = cp.address_id
        WHERE cp.car_id = $1
          AND cp.end_date >= ${startExpr}
          ${endConditionCharges}
      ),
      -- Consumption over the last 90 days: turns the energy charged into real km for the
      -- savings when the period itself has no drives (e.g. a week with a charge but no drive)
      recent_consumption AS (
        SELECT
          SUM((d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency)
            FILTER (WHERE d.start_ideal_range_km > d.end_ideal_range_km)
          / NULLIF(SUM(d.distance) FILTER (WHERE d.start_ideal_range_km > d.end_ideal_range_km), 0)
          * 100 AS value
        FROM drives d
        JOIN cars c ON c.id = d.car_id
        WHERE d.car_id = $1
          AND d.start_date >= (NOW() AT TIME ZONE 'UTC') - interval '90 days'
          AND d.distance > 0
      )
      SELECT
        ROUND(pd.total_distance::numeric, 2) AS total_distance_km,
        pd.drive_count,
        ROUND(pc.total_energy::numeric, 2) AS total_energy_kwh,
        CASE
          -- TeslaMate computes the car's efficiency only after a few charges: unknown until then
          WHEN (SELECT efficiency FROM cars WHERE id = $1) IS NULL THEN NULL
          WHEN pd.consumption_distance > 0
          THEN ROUND((pd.total_consumption_kwh / pd.consumption_distance * 100)::numeric, 1)
          ELSE 0
        END AS avg_consumption_kwh_per_100km,
        ROUND(pc.total_cost::numeric, 2) AS total_cost,
        pc.charge_count,
        pc.costed_charge_count,
        ROUND(pc.costed_energy::numeric, 2) AS costed_energy_kwh,
        pc.costed_charges_in_france,
        -- kWh/100km used to convert the energy charged into real km (period first, else 90 days)
        ROUND(COALESCE(
          CASE WHEN pd.consumption_distance > 0 THEN pd.total_consumption_kwh / pd.consumption_distance * 100 END,
          rc.value
        )::numeric, 1) AS savings_consumption_kwh_100km
      FROM period_drives pd, period_charges pc, recent_consumption rc
      `,
      [carId, getTimeZone(req)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
