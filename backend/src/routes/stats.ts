import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/period", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;
    const period = req.query.period as string;

    // Compute SQL date boundaries based on period
    let startExpr: string;
    let endConditionDrives = "";
    let endConditionCharges = "";

    if (period === "week") {
      startExpr = "date_trunc('week', CURRENT_DATE)";
    } else if (period === "last_month") {
      startExpr = "date_trunc('month', CURRENT_DATE - interval '1 month')";
      endConditionDrives = "AND d.start_date < date_trunc('month', CURRENT_DATE)";
      endConditionCharges = "AND cp.end_date < date_trunc('month', CURRENT_DATE)";
    } else {
      // Default: current month
      startExpr = "date_trunc('month', CURRENT_DATE)";
    }

    const result = await pool.query(
      `
      WITH period_drives AS (
        SELECT
          COALESCE(SUM(d.distance), 0) AS total_distance,
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
          COUNT(cp.id) AS charge_count
        FROM charging_processes cp
        WHERE cp.car_id = $1
          AND cp.end_date >= ${startExpr}
          ${endConditionCharges}
      )
      SELECT
        ROUND(pd.total_distance::numeric, 2) AS total_distance_km,
        pd.drive_count,
        ROUND(pc.total_energy::numeric, 2) AS total_energy_kwh,
        CASE
          WHEN pd.total_distance > 0
          THEN ROUND((pd.total_consumption_kwh / pd.total_distance * 100)::numeric, 1)
          ELSE 0
        END AS avg_consumption_kwh_per_100km,
        ROUND(pc.total_cost::numeric, 2) AS total_cost,
        pc.charge_count
      FROM period_drives pd, period_charges pc
      `,
      [carId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
