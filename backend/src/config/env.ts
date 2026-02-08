import dotenv from "dotenv";

// Try multiple paths: dotenv silently ignores missing files
// and never overrides already-set env vars (Docker, CI, etc.)
dotenv.config({ path: "../.env" });  // dev: CWD = backend/
dotenv.config({ path: ".env" });     // Docker or root CWD

export const env = {
  DATABASE_HOST: process.env.DATABASE_HOST || "localhost",
  DATABASE_PORT: parseInt(process.env.DATABASE_PORT || "5432"),
  DATABASE_NAME: process.env.DATABASE_NAME || process.env.TM_DB_NAME || "teslamate",
  DATABASE_USER: process.env.DATABASE_USER || process.env.TM_DB_USER || "teslamate",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || process.env.TM_DB_PASS || "",
  PORT: parseInt(process.env.PORT || "3001"),
  DEMO_MODE: process.env.DEMO_MODE === "true",
  AUTH_USERNAME: process.env.AUTH_USERNAME || "",
  AUTH_PASSWORD: process.env.AUTH_PASSWORD || "",
};
