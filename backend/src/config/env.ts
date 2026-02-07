import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const env = {
  DATABASE_HOST: process.env.DATABASE_HOST || "localhost",
  DATABASE_PORT: parseInt(process.env.DATABASE_PORT || "5432"),
  DATABASE_NAME: process.env.DATABASE_NAME || "teslamate",
  DATABASE_USER: process.env.DATABASE_USER || "teslamate",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || "",
  PORT: parseInt(process.env.PORT || "3001"),
  DEMO_MODE: process.env.DEMO_MODE === "true",
};
