/**
 * Print the most recent quote requests straight from the database.
 * Read-only helper used to verify the enquiry flow end to end.
 *
 *   node --conditions=react-server --import tsx scripts/latest-requests.ts
 */
import { existsSync } from "node:fs";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

import * as schema from "../src/lib/db/schema";

if (!process.env.DATABASE_URL) {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool, schema });

  const rows = await db
    .select()
    .from(schema.quoteRequests)
    .orderBy(desc(schema.quoteRequests.createdAt))
    .limit(5);

  console.log(`\nQuote requests in Neon: ${rows.length}\n`);

  for (const row of rows) {
    console.log(`  ${row.reference}   [${row.status}]`);
    console.log(`    client    : ${row.fullName} — ${row.phone}${row.email ? ` — ${row.email}` : ""}`);
    console.log(`    service   : ${row.serviceType}`);
    console.log(`    journey   : ${row.pickupAddress} -> ${row.destinationAddress}`);
    console.log(`    departure : ${row.departureAt.toISOString()}  (UTC)`);
    console.log(`    return    : ${row.returnAt ? row.returnAt.toISOString() : "—"}`);
    console.log(`    pax       : ${row.passengers}   locale: ${row.locale}`);
    console.log(`    consent   : ${row.consentGivenAt.toISOString()}`);
    console.log(`    notes     : ${row.adminNotes ?? "(none)"}`);
    console.log("");
  }

  const logs = await db
    .select()
    .from(schema.notificationLogs)
    .limit(5);

  console.log(`Notification attempts recorded: ${logs.length}\n`);
  for (const log of logs) {
    console.log(
      `  ${log.channel}/${log.target} -> ${log.status}` +
        (log.errorDetail ? ` (${log.errorDetail})` : ""),
    );
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});