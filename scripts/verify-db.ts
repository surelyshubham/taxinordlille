/**
 * Verify the live database: lists the tables that exist and their row counts.
 * Read-only — safe to run at any time.
 *
 *   npm run db:verify
 */
import { existsSync } from "node:fs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

const EXPECTED = [
  "admin_users",
  "admin_sessions",
  "rate_limits",
  "quote_requests",
  "contact_messages",
  "blog_categories",
  "blog_posts",
  "site_settings",
  "notification_logs",
  "admin_activity",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle({ client: pool });

  console.log("\nConnectivity: OK\n");

  const tables = await db.execute<{ table_name: string }>(
    sql`select table_name from information_schema.tables
        where table_schema = 'public' order by table_name`,
  );

  const names = tables.rows.map((row) => row.table_name);
  console.log(`Tables found: ${names.length}\n`);

  for (const expected of EXPECTED) {
    const present = names.includes(expected);
    let count = "-";
    if (present) {
      const result = await db.execute(
        sql.raw(`select count(*)::int as count from "${expected}"`),
      );
      count = String(result.rows[0]?.count ?? 0);
    }
    console.log(
      `  ${present ? "OK  " : "MISS"}  ${expected.padEnd(20)} rows: ${count}`,
    );
  }

  const missing = EXPECTED.filter((name) => !names.includes(name));
  const extra = names.filter((name) => !EXPECTED.includes(name));

  console.log("");
  if (missing.length) console.log(`Missing tables: ${missing.join(", ")}`);
  if (extra.length) console.log(`Additional tables: ${extra.join(", ")}`);
  if (!missing.length && !extra.length) {
    console.log("Schema matches the application exactly.");
  }

  await pool.end();
  process.exit(missing.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});