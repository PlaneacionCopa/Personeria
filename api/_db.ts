import { Pool } from "pg";

let pool: Pool | null = null;

export function db() {
  if (!pool) {
    const connectionString = process.env.SUPABASE_DB_URL;

    if (!connectionString) {
      throw new Error("Falta variable de entorno: SUPABASE_DB_URL");
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  return pool;
}