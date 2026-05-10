/**
 * E2E — CU-04 Consultar Calificaciones (Alumno).
 *
 * Cubre flujo normal, flujos alternativos y excepciones del CU.
 * Storage state: alumno (Jesus Alfonso) con grades en MAT101 + FIS101 y
 * un periodo anterior (2024a) con grade en Calculo final.
 */

import { test, expect } from "@playwright/test";
import { StudentGradesPage } from "../pages/StudentGradesPage";
import { SEED_DATA, USERS } from "../helpers/credentials";

test.describe("CU-04 — Consultar Calificaciones", () => {
  test("Flujo normal: muestra calificaciones del periodo activo", async ({
    page,
  }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();
    await grades.expectLoaded();

    // Header con datos del alumno
    await expect(page.getByText(USERS.alumno.matricula)).toBeVisible();

    // Periodo activo en badge
    await expect(grades.periodoBadge()).toContainText(
      SEED_DATA.periodos.actual.nombre
    );
    await expect(grades.periodoBadge()).toContainText("Activo");

    // Materias del seed: MAT101 + FIS101 + PRG101
    await grades.expectMateriasCount(3);
    await expect(grades.card(SEED_DATA.materias.calculo.codigo)).toBeVisible();
    await expect(grades.card(SEED_DATA.materias.fisica.codigo)).toBeVisible();
    await expect(
      grades.card(SEED_DATA.materias.programacion.codigo)
    ).toBeVisible();
  });

  test("Flujo alternativo: filtrar por materia específica", async ({ page }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();

    await grades.filterByMateria(SEED_DATA.materias.calculo.nombre);
    await grades.expectMateriasCount(1);
    await expect(grades.card(SEED_DATA.materias.calculo.codigo)).toBeVisible();

    // Restablecer
    await grades.materiaFilter().selectOption("todas");
    await grades.expectMateriasCount(3);
  });

  test("Flujo alternativo: cambiar a periodo anterior", async ({ page }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();

    await grades.selectPeriodo(SEED_DATA.periodos.anterior.id);
    await expect(grades.periodoBadge()).toContainText(
      SEED_DATA.periodos.anterior.nombre
    );
    // Periodo anterior tiene solo Calculo en el seed
    await grades.expectMateriasCount(1);
    await expect(grades.card(SEED_DATA.materias.calculo.codigo)).toBeVisible();
  });

  test("Flujo normal: detalle expandible muestra evaluaciones con valores correctos", async ({
    page,
  }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();

    await grades.toggleCardDetail(SEED_DATA.materias.calculo.codigo);
    const detail = grades.card(SEED_DATA.materias.calculo.codigo).getByTestId("subject-detail");
    await expect(detail).toBeVisible();
    // 3 evaluaciones del seed: Parcial 1 (9.5) + Tarea Limites (8.0) + Proyecto Final (9.0)
    await expect(detail).toContainText("Parcial 1");
    await expect(detail).toContainText("Tarea Limites");
    await expect(detail).toContainText("Proyecto Final");
    await expect(detail).toContainText("9.5");
    await expect(detail).toContainText("8.0");
    await expect(detail).toContainText("9.0");
  });

  test("Caveman: ?periodo inexistente renderiza estado periodo_invalido (no NoMaterias)", async ({
    page,
  }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto("periodo-no-existe-xyz");
    await expect(grades.emptyPeriodoInvalido()).toBeVisible();
  });

  test("Excepción: PRG101 sin grades muestra evaluaciones vacías al expandir", async ({
    page,
  }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();

    const codigo = SEED_DATA.materias.programacion.codigo;
    await grades.toggleCardDetail(codigo);
    await expect(grades.card(codigo).getByTestId("subject-detail")).toContainText(
      /sin evaluaciones registradas/i
    );
  });

  test("Regla de negocio: promedio coincide con cálculo manual del seed", async ({
    page,
  }) => {
    const grades = new StudentGradesPage(page);
    await grades.goto();

    // Calculo: (9.5 + 8.0 + 9.0)/3 = 8.83 (redondeado a 2 decimales)
    await grades.expectPromedio(SEED_DATA.materias.calculo.codigo, "8.8");
    // Fisica: (7.5 + 8.5)/2 = 8.0
    await grades.expectPromedio(SEED_DATA.materias.fisica.codigo, "8.0");
  });
});
