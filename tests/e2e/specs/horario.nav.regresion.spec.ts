// tests/e2e/specs/horario.nav.regresion.spec.ts
//
// Regresión: el enlace de "Horario" en el menú del profesor apuntaba a
// /alumno/horario (bug previo en nav.ts). Verificamos que ahora navega
// a /profesor/horario.

import { expect, test } from "@playwright/test";

import { CREDS } from "../fixtures/credentials";
import { LoginPage } from "../pages/LoginPage";

// Este spec arranca SIN sesión y hace login como profesor en línea,
// porque queremos validar el nav del profesor, no reusar storageState
// del alumno.
test.use({ storageState: { cookies: [], origins: [] } });

test("nav profesor: 'Horario' apunta a /profesor/horario", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(CREDS.PROFESOR.email, CREDS.PROFESOR.password);

  // El enlace existe en sidebar desktop o mobile drawer. Tomamos el
  // primero visible.
  const link = page.getByRole("link", { name: /horario/i }).first();
  await link.click();
  await expect(page).toHaveURL(/\/profesor\/horario(\?|$)/);
});
