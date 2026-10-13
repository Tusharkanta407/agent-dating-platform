import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error(
      "SUPABASE_DB_URL is not set. Add the Postgres connection string from Supabase (Project Settings > Database > Connection string), or paste supabase/schema.sql into the Supabase SQL editor.",
    );
    process.exit(1);
  }

  const sql = await readFile(path.join(process.cwd(), "supabase", "schema.sql"), "utf8");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Schema applied.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
