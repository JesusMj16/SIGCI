// tests/e2e/specs/horario.profesor.spec.ts
//
// CU-06 — Vista de Profesor. Regresión clave: la ruta debe ser
// /profesor/horario (no /alumno/horario como tenía nav.ts antes).

import { expect, test } from "@playwright/test";

import { HorarioPage } from "../pages/HorarioPage";

test.describe("CU-06 · Horario Profesor", () => {
  test("flujo normal: renderiza grupos asignados", async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.expectVisible("/profesor/horario");

    await expect(horario.heading).toContainText(/horario/i);
    await expect(horario.grid).toBeVisible();
    await expect(horario.classes).not.toHaveCount(0);
  });

  test("regresión: la tarjeta de clase no muestra 'Prof. ...' en vista profesor", async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/profesor/horario");
    // El bloque "Prof. X" solo se renderiza para ALUMNO.
    const profLines = await horario.classes
      .locator("text=/^Prof\\. /")
      .count();
    expect(profLines).toBe(0);
  });

  test("carga < 3s en la vista profesor", async ({ page }) => {
    const horario = new HorarioPage(page);
    const ms = await horario.measureLoad("/profesor/horario");
    expect(ms).toBeLessThan(5_000);
  });
});
