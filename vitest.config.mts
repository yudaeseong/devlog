import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    environment: "node",
    passWithNoTests: true,
    env: { DATABASE_URL: "file:data/unit.db" },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
