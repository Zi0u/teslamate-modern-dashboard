import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/history", async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.query.car_id as string) || 1;
    const days = Math.min(parseInt(req.query.days as string) || 7, 90);

    const result = await pool.query(
      `
      SELECT
        date_trunc('hour', p.date) AS date,
        ROUND(AVG(p.battery_level)::numeric, 0) AS battery_level,
        ROUND(AVG(p.ideal_battery_range_km)::numeric, 1) AS ideal_range_km
      FROM positions p
      WHERE p.car_id = $1
        AND p.date >= NOW() - ($2 || ' days')::interval
        AND p.battery_level IS NOT NULL
      GROUP BY date_trunc('hour', p.date)
      ORDER BY date ASC
      `,
      [carId, days]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching battery history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
