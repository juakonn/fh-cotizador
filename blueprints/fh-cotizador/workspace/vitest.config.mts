import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "blueprints/**"],
    environment: "node",
    testTimeout: 20000,
    env: {
      ACCESS_KEY: "clave-de-test-1234567890",
    },
  },
});
