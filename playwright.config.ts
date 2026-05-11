import { defineConfig, devices } from "@playwright/test";
import { config as loadDotenv } from "dotenv";

// Carga .env.local primero (overrides), luego .env. Tolera espacios en torno a `=`.
loadDotenv({ path: ".env.local", override: true });
loadDotenv({ path: ".env" });

/**
 * Playwright config — CU-04 + CU-05 E2E.
 *
 * Estrategia:
 *  - Login una sola vez por rol via "auth.setup.ts" → guarda storageState.
 *  - Cada project consume su storageState para evitar repetir login en cada test.
 *  - webServer levanta `next dev` (mismo entorno que el seed actual).
 */

const PORT = Number(process.env.PORT ?? 3000);
// Usamos `localhost` (no 127.0.0.1) porque NextAuth normaliza la URL del callback
// y los cookies se setean para el host del request inicial; cambiar de host
// rompe el flujo de sesión.
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Las pruebas mutan BD compartida (CU-05) → secuencial.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Setup: hace login y persiste storageState para cada rol.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "alumno",
      testMatch: /specs\/consultar-calificaciones\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/alumno.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "alumno-sinmaterias",
      testMatch: /specs\/consultar-calificaciones\.sinmaterias\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/sinmaterias.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "profesor",
      testMatch: /specs\/registrar-calificaciones\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/profesor.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        // Producción: el dev server (HMR websocket) no hidrataba bajo Playwright,
        // así que arrancamos `next start`. Ejecuta `npm run build` antes.
        command: "npm run start",
        url: BASE_URL,
        env: {
          AUTH_TRUST_HOST: "true",
          NEXTAUTH_URL: BASE_URL,
          AUTH_SECRET: (process.env.AUTH_SECRET ?? "").trim().replace(/^"|"$/g, ""),
          DATABASE_URL: (process.env.DATABASE_URL ?? "").trim().replace(/^"|"$/g, ""),
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
