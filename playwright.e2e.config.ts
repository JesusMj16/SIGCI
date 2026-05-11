// playwright.e2e.config.ts
//
// Config dedicada a los tests E2E de SIGCI.
// El archivo `playwright.config.ts` original sigue intacto para la
// captura de baseline visual (scripts/e2e/...). Esta config aísla la
// suite CU por feature en tests/e2e/.
//
// Uso:
//   pnpm test:e2e             → corre toda la suite (Chromium)
//   pnpm test:e2e:headed      → abre navegador
//   PLAYWRIGHT_BASE_URL=...   → apunta a otra instancia
//
// El proyecto "setup" hace login con Credentials y persiste storageState
// por rol bajo tests/e2e/.auth/*.json (ignorado por git).

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "alumno",
      testMatch: /specs\/.*\.alumno\.spec\.ts$/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/alumno.json",
      },
    },
    {
      name: "profesor",
      testMatch: /specs\/.*\.profesor\.spec\.ts$/,
      // CU-09 (crear-asignacion) tiene su propio project autónomo.
      testIgnore: /crear-asignacion\.profesor\.spec\.ts$/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/profesor.json",
      },
    },
    {
      // CU-09: spec autónomo — hace login inline para no depender del
      // shared auth.setup.ts (que tiene desajustes pendientes en el merge).
      name: "cu09",
      testMatch: /specs\/crear-asignacion\.profesor\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      // Specs neutrales (filtro día, descarga ICS, regresión nav, etc.)
      // por defecto se ejecutan autenticados como ALUMNO.
      // Lista explícita para evitar overlap con los proyectos alumno/profesor.
      name: "shared",
      testMatch: [
        /specs\/horario\.filtro-dia\.spec\.ts$/,
        /specs\/horario\.ics\.spec\.ts$/,
        /specs\/horario\.nav\.regresion\.spec\.ts$/,
        /specs\/horario\.fallback\.spec\.ts$/,
        /specs\/horario\.empty\.spec\.ts$/,
      ],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/alumno.json",
      },
    },
  ],
});
