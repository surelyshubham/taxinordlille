import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Read from the environment so the value never has to live in source control.
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});