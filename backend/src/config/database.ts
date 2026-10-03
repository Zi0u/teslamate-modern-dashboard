import { Pool, types } from "pg";
import { env } from "./env";

// TeslaMate stores dates in UTC in "timestamp without time zone" columns. By default the pg
// driver parses those as local time of the machine running the backend, which shifts every
// date by the server's UTC offset (e.g. -2h on a Mac in Paris, no shift in a UTC container).
// Parse them as UTC so dates are right wherever the backend runs.
types.setTypeParser(types.builtins.TIMESTAMP, (value) => new Date(value.replace(" ", "T") + "Z"));

export const pool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("Database connection established");
    return true;
  } catch (err) {
    console.error("Failed to connect to database:", err);
    return false;
  }
}
