import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/services/db/schema.ts",
  out: "./src/services/db/migrations",
});
