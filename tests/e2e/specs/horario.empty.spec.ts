// tests/e2e/specs/horario.empty.alumno.spec.ts
//
// CU-06 · Excepción "No hay materias inscritas".
// El seed actual no incluye un alumno SIN materias. Este test queda
// marcado con `fixme` para que un mantenedor lo habilite tras agregar
// un alumno vacío al seed (p.ej. matrícula 20230999) o tras conectar
// un helper de BD que aísle una transacción.

import { expect, test } from "@playwright/test";

import { HorarioPage } from "../pages/HorarioPage";

test.fixme(
  "muestra mensaje cuando el alumno no tiene materias en el periodo",
  async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/alumno/horario");
    await expect(horario.emptyState).toBeVisible();
    await expect(horario.emptyState).toContainText(
      /no se encontraron materias para el periodo actual/i,
    );
  },
);
