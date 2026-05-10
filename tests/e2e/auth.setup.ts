// tests/e2e/auth.setup.ts
//
// Setup project: hace login con cada rol y persiste el storage state.
// Los proyectos `alumno` y `profesor` cargan esos JSON para arrancar
// ya autenticados, evitando pagar el costo del login en cada spec.

import { expect, test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { CREDS } from "./fixtures/credentials";
import { LoginPage } from "./pages/LoginPage";

function ensureDir(file: string) {
  mkdirSync(dirname(file), { recursive: true });
}

setup("autentica alumno", async ({ page }) => {
  const target = CREDS.ALUMNO.storageStateFile;
  ensureDir(target);

  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(CREDS.ALUMNO.email, CREDS.ALUMNO.password);
  // Sanity: la cookie de sesión debe existir antes de exportar storageState.
  await expect(page).toHaveURL(/\/(alumno|$)/);
  await page.context().storageState({ path: target });
});

setup("autentica profesor", async ({ page }) => {
  const target = CREDS.PROFESOR.storageStateFile;
  ensureDir(target);

  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(CREDS.PROFESOR.email, CREDS.PROFESOR.password);
  await expect(page).toHaveURL(/\/(profesor|$)/);
  await page.context().storageState({ path: target });
});
