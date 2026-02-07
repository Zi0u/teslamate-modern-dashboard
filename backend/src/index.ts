import "./config/env";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { testConnection } from "./config/database";
import carRoutes from "./routes/car";
import drivesRoutes from "./routes/drives";
import statsRoutes from "./routes/stats";
import batteryRoutes from "./routes/battery";
import chargesRoutes from "./routes/charges";
import demoRoutes from "./routes/demo";

const app = express();
const PORT = env.PORT;

app.use(cors());
app.use(express.json());

if (env.DEMO_MODE) {
  // Demo mode: use mock data
  console.log("🎭 Running in DEMO MODE - using mock data");
  app.use("/api", demoRoutes);
} else {
  // Production mode: use real database
  app.use("/api/car", carRoutes);
  app.use("/api/drives", drivesRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/battery", batteryRoutes);
  app.use("/api/charges", chargesRoutes);

  // Grafana URL from TeslaMate settings
  app.get("/api/settings/grafana-url", async (_req, res) => {
    try {
      const { pool } = await import("./config/database");
      const result = await pool.query("SELECT grafana_url, base_url FROM settings LIMIT 1");
      const row = result.rows[0];
      res.json({ grafana_url: row?.grafana_url || null, base_url: row?.base_url || null });
    } catch (err) {
      console.error("Error fetching grafana URL:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Weather proxy (Open-Meteo, free, no API key)
  app.get("/api/weather", async (req, res) => {
    try {
      const lat = req.query.lat as string;
      const lon = req.query.lon as string;
      if (!lat || !lon) {
        res.status(400).json({ error: "lat and lon required" });
        return;
      }
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data.current_weather);
    } catch (err) {
      console.error("Error fetching weather:", err);
      res.status(500).json({ error: "Weather unavailable" });
    }
  });

  // Health check
  app.get("/api/health", async (_req, res) => {
    const dbOk = await testConnection();
    res.json({ status: dbOk ? "ok" : "degraded", database: dbOk });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!env.DEMO_MODE) {
    testConnection();
  }
});
