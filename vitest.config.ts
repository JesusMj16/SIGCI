import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    // scripts/e2e/** corre con @playwright/test (otra runtime); excluirlo de Vitest.
    exclude: ["**/node_modules/**", "**/dist/**", "scripts/e2e/**"],
  },
});
