// tests/e2e/auth.setup.ts
//
// Setup project unificado: persiste storageState para todos los roles
// usados por CU-04/05 (calificaciones), CU-06/07 (horarios) y CU-10 (tareas).
// Las credenciales del seed difieren entre regímenes, así que importamos
// ambos módulos. Si un seed no está cargado, su setup correspondiente
// fallará en login — los demás siguen funcionando independientemente.

import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

import { LoginPage } from "./pages/LoginPage";
import { CREDENCIALES, AUTH_FILES, USERS } from "./helpers/credentials";
import { CREDS } from "./fixtures/credentials";

setup.beforeAll(() => {
  mkdirSync(path.dirname(AUTH_FILES.alumno), { recursive: true });
});

setup("autenticar alumno (calificaciones)", async ({ page }) => {
  await new LoginPage(page).login(CREDENCIALES.alumno);
  await expect(page).toHaveURL(/\/alumno(\/.*)?$/);
  await page.context().storageState({ path: AUTH_FILES.alumno });
});

setup("autenticar profesor (calificaciones)", async ({ page }) => {
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
  expect(USERS.alumno.email).toBeTruthy();
  expect(USERS.profesor.email).toBeTruthy();
});

// Horarios: storage states viven en rutas explícitas declaradas en CREDS.
setup("autenticar alumno (horarios)", async ({ page }) => {
  const target = CREDS.ALUMNO.storageStateFile;
  mkdirSync(path.dirname(target), { recursive: true });
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(CREDS.ALUMNO.email, CREDS.ALUMNO.password);
  await expect(page).toHaveURL(/\/(alumno|$)/);
  await page.context().storageState({ path: target });
});

setup("autenticar profesor (horarios)", async ({ page }) => {
  const target = CREDS.PROFESOR.storageStateFile;
  mkdirSync(path.dirname(target), { recursive: true });
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(CREDS.PROFESOR.email, CREDS.PROFESOR.password);
  await expect(page).toHaveURL(/\/(profesor|$)/);
  await page.context().storageState({ path: target });
});
