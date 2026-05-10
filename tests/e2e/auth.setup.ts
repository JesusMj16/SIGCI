/**
 * Setup project — hace login real para cada rol y guarda storageState.
 * Las credenciales provienen del seed de Prisma (`prisma/seed.ts`).
 *
 * Cada storageState se reutiliza en los projects "alumno", "profesor", etc.
 */

import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { CREDENCIALES, AUTH_FILES, USERS } from "./helpers/credentials";
import { mkdirSync } from "node:fs";
import path from "node:path";

setup.beforeAll(() => {
  mkdirSync(path.dirname(AUTH_FILES.alumno), { recursive: true });
});

setup("autenticar alumno", async ({ page }) => {
  await new LoginPage(page).login(CREDENCIALES.alumno);
  await expect(page).toHaveURL(/\/alumno(\/.*)?$/);
  await page.context().storageState({ path: AUTH_FILES.alumno });
});

setup("autenticar profesor", async ({ page }) => {
  await new LoginPage(page).login(CREDENCIALES.profesor);
  await expect(page).toHaveURL(/\/profesor(\/.*)?$/);
  await page.context().storageState({ path: AUTH_FILES.profesor });
});

setup("autenticar alumno-sinmaterias", async ({ page }) => {
  await new LoginPage(page).login(CREDENCIALES.sinmaterias);
  await expect(page).toHaveURL(/\/alumno(\/.*)?$/);
  await page.context().storageState({ path: AUTH_FILES.sinmaterias });
});

setup("verifica usuarios del seed presentes", () => {
  // Soft check (informativo): si el seed no se corrió, los logins fallarán arriba.
  expect(USERS.alumno.email).toBeTruthy();
  expect(USERS.profesor.email).toBeTruthy();
});
