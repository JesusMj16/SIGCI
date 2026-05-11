// tests/e2e/specs/horario.filtro-dia.spec.ts
//
// CU-06 · Flujo alternativo "Consultar horario de un día específico".

import { expect, test } from "@playwright/test";

import { HorarioPage } from "../pages/HorarioPage";

test.describe("CU-06 · Filtro por día", () => {
  test("filtrar por Miércoles muestra solo esa columna", async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/alumno/horario");
    // why: esperar hidratación + render inicial antes de manipular el select
    // controlado; si filtramos demasiado temprano React aún no monta el handler.
    await expect(horario.grid).toBeVisible();
    await expect(horario.classes.first()).toBeVisible();

    await horario.filterByDay(3);
    await expect(page.getByTestId("filter-day-3")).toHaveAttribute("aria-pressed", "true");

    await expect(horario.dayColumn(3)).toBeVisible();
    // Las otras columnas no deben estar montadas.
    await expect(horario.dayColumn(1)).toHaveCount(0);
    await expect(horario.dayColumn(2)).toHaveCount(0);
    await expect(horario.dayColumn(4)).toHaveCount(0);
    await expect(horario.dayColumn(5)).toHaveCount(0);
    await expect(horario.dayColumn(6)).toHaveCount(0);

    // El seed coloca 2 clases del alumno el miércoles.
    const items = horario.dayColumn(3).getByTestId("schedule-class");
    await expect(items).toHaveCount(2);
  });

  test("volver a 'Toda la semana' restaura las 6 columnas", async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/alumno/horario");
    await expect(horario.grid).toBeVisible();
    await expect(horario.classes.first()).toBeVisible();
    await horario.filterByDay(3);
    await horario.filterByDay("ALL");

    for (const d of [1, 2, 3, 4, 5, 6] as const) {
      await expect(horario.dayColumn(d)).toBeVisible();
    }
  });
});
