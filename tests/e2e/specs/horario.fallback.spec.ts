// tests/e2e/specs/horario.fallback.spec.ts
//
// CU-06 · Excepción "Periodo académico inactivo": cuando no hay
// periodo activo, la DAL devuelve el último por endDate y la page
// muestra una alerta. Necesita un helper de BD para apagar
// Period.isActive temporalmente — por eso queda como `fixme`.

import { expect, test } from "@playwright/test";

import { HorarioPage } from "../pages/HorarioPage";

test.fixme(
  "muestra alerta cuando no hay periodo activo (fallback al último)",
  async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/alumno/horario");
    await expect(horario.fallbackAlert).toBeVisible();
    await expect(horario.fallbackAlert).toContainText(/periodo escolar actual no está activo/i);
  },
);
