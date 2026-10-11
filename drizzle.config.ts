import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

/**
 * Load local env files before Drizzle reads credentials.
 *
 * `drizzle-kit` does not load `.env.local` on its own, and Next.js only does
 * so for `next dev` / `next build`. Without this, `npm run db:migrate` fails
 * with an empty URL.
 *
 * An already-set `DATABASE_URL` always wins, so CI and production environments
 * are never overridden by a developer's local file.
 */
if (!process.env.DATABASE_URL) {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});