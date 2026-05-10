/**
 * E2E — CU-04 Excepción: alumno sin materias inscritas.
 *
 * Storage state: sinmaterias (usuario `sinmaterias@utm.mx`) — sin enrollments.
 */

import { test, expect } from "@playwright/test";
import { StudentGradesPage } from "../pages/StudentGradesPage";

test.describe("CU-04 — Excepción sin materias", () => {
  test("Empty state correcto y CTA hacia Servicios Escolares", async ({
    page,
  }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();
    await expect(grades.emptySinMaterias()).toBeVisible();
    await expect(grades.emptySinMaterias()).toContainText(
      /no tienes materias inscritas/i
    );
    await expect(page.getByText(/servicios escolares/i)).toBeVisible();
  });
});
