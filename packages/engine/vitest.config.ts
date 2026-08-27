import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@syncra/shared": fileURLToPath(
        new URL("../shared/src/index.ts", import.meta.url),
      ),
    },
  },
});
