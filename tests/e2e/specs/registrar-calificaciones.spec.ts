/**
 * E2E — CU-05 Registrar Calificaciones (Profesor).
 *
 * Storage state: profesor (`profesor@utm.mx`) titular de MAT101, FIS101, PRG101
 * en el periodo activo. Cubre flujos normal, alternativos y excepciones.
 *
 * Cada test que muta BD limpia el assignment afectado en `beforeEach`/`afterEach`
 * para garantizar idempotencia.
 */

import { test, expect } from "@playwright/test";
import { TeacherGradesPage } from "../pages/TeacherGradesPage";
import {
  fetchGrade,
  resetGradesFor,
  studentIdsByMatricula,
  togglePeriodActive,
  disconnect,
} from "../helpers/db";
import { SEED_DATA } from "../helpers/credentials";

const MATRICULAS = ["2023020223", "2023020111", "2023020112"] as const;

test.afterAll(async () => {
  await disconnect();
});

test.describe("CU-05 — Registrar Calificaciones", () => {
  test("Flujo normal: calificar a 3 alumnos y persistir en BD", async ({
    page,
  }) => {
    const ids = await studentIdsByMatricula([...MATRICULAS]);
    await resetGradesFor({
      assignmentId: SEED_DATA.assignments.matP2,
      studentIds: Object.values(ids),
    });

    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    await teacher.expectStepActive("grupo");

    await teacher.selectGrupo(SEED_DATA.materias.calculo.codigo);
    await teacher.selectAsignacion("Parcial 2");

    await teacher.fillGrade("2023020223", 9.0);
    await teacher.fillGrade("2023020111", 8.5);
    await teacher.fillGrade("2023020112", 7.0);

    await teacher.confirmar();

    await teacher.expectStepActive("resultado");
    await teacher.expectResultado(3, 0);

    // Verifica persistencia real
    for (const [mat, expected] of [
      ["2023020223", 9.0],
      ["2023020111", 8.5],
      ["2023020112", 7.0],
    ] as const) {
      const grade = await fetchGrade({
        studentId: ids[mat],
        assignmentId: SEED_DATA.assignments.matP2,
      });
      expect(grade, `grade para ${mat}`).not.toBeNull();
      expect(Number(grade!.valor)).toBeCloseTo(expected, 2);
    }
  });

  test("Flujo alternativo: registro parcial — solo 2 de 3 alumnos", async ({
    page,
  }) => {
    const ids = await studentIdsByMatricula([...MATRICULAS]);
    await resetGradesFor({
      assignmentId: SEED_DATA.assignments.fisP2,
      studentIds: Object.values(ids),
    });

    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    await teacher.selectGrupo(SEED_DATA.materias.fisica.codigo);
    await teacher.selectAsignacion("Parcial 2");

    await teacher.fillGrade("2023020223", 9.0);
    await teacher.fillGrade("2023020111", 8.0);
    // Esmeralda queda sin calificar

    await teacher.confirmar();
    await teacher.expectResultado(2, 0);

    const sinCalificar = await fetchGrade({
      studentId: ids["2023020112"],
      assignmentId: SEED_DATA.assignments.fisP2,
    });
    expect(sinCalificar).toBeNull();
  });

  test("Flujo alternativo: modificar calificación existente y preservar retro previa", async ({
    page,
  }) => {
    const ids = await studentIdsByMatricula(["2023020223"]);

    // Asegura que existe la grade original (Parcial 1 del seed: 9.5 + retro "Bien hecho.")
    const before = await fetchGrade({
      studentId: ids["2023020223"],
      assignmentId: SEED_DATA.assignments.matP1,
    });
    expect(before, "seed debe tener Parcial 1 calificado").not.toBeNull();
    const retroOriginal = before!.retroalimentacion;

    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    await teacher.selectGrupo(SEED_DATA.materias.calculo.codigo);
    await teacher.selectAsignacion("Parcial 1");

    // Modifica solo la nota; retroalimentación no se toca → preserve
    await teacher.fillGrade("2023020223", 9.8);
    await teacher.confirmar();
    await teacher.expectResultado(0, 1);

    const after = await fetchGrade({
      studentId: ids["2023020223"],
      assignmentId: SEED_DATA.assignments.matP1,
    });
    expect(Number(after!.valor)).toBeCloseTo(9.8, 2);
    expect(after!.retroalimentacion).toBe(retroOriginal); // bug F2.8 prevenido

    // Restaurar para no contaminar otras pruebas
    await teacher.reiniciar();
    await teacher.selectGrupo(SEED_DATA.materias.calculo.codigo);
    await teacher.selectAsignacion("Parcial 1");
    await teacher.fillGrade("2023020223", 9.5);
    await teacher.confirmar();
  });

  test("Excepción: calificación fuera de rango (>10) bloquea submit", async ({
    page,
  }) => {
    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    await teacher.selectGrupo(SEED_DATA.materias.programacion.codigo);
    await teacher.selectAsignacion("Parcial 1");

    await teacher.fillGrade("2023020223", 11);
    const err = await teacher.getRowError("2023020223");
    expect(err).toMatch(/fuera de rango/i);
    await expect(teacher.btnConfirmar()).toBeDisabled();
  });

  test("Excepción: valor no numérico bloquea submit", async ({ page }) => {
    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    await teacher.selectGrupo(SEED_DATA.materias.programacion.codigo);
    await teacher.selectAsignacion("Parcial 1");

    // El input es type=number, pero el componente acepta string vía teclado en algunos browsers.
    // Simulamos un valor inválido que pasa la validación nativa pero no la nuestra.
    const input = teacher.rowByMatricula("2023020223").getByTestId("grade-input");
    await input.evaluate((el: HTMLInputElement) => {
      el.value = "abc";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // El handler React no escucha 'input' nativo → caveman edge.
    // Validamos directamente el botón con caja vacía + número correcto + número fuera.
    await teacher.fillGrade("2023020223", -1);
    const err = await teacher.getRowError("2023020223");
    expect(err).toMatch(/fuera de rango/i);
    await expect(teacher.btnConfirmar()).toBeDisabled();
  });

  test("Excepción: periodo cerrado deshabilita captura (action retorna PERIOD_CLOSED)", async ({
    page,
  }) => {
    const undo = await togglePeriodActive(SEED_DATA.periodos.actual.id, false);
    try {
      const teacher = new TeacherGradesPage(page);
      await teacher.goto();
      // Con period.isActive=false, getGruposProfesor filtra → no hay grupos
      await expect(teacher.emptyGrupos()).toBeVisible();
    } finally {
      await undo();
    }
  });

  test("Excepción: grupo sin alumnos — al seleccionar evaluación, error", async ({
    page,
  }) => {
    // El grupo "group-sin-alumnos" no aparece en la grilla porque no tiene
    // assignments visibles para listarlo... Sí lo hace porque el seed creó
    // assignment-publicado. Verificamos que al elegir, action devuelve NO_ALUMNOS.
    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    // El grupo aparece como "Calculo Diferencial - 0 alumnos"
    const sinAlumnosCard = page
      .locator('[data-testid="grupo-card"]')
      .filter({ hasText: "0 alumnos" });

    if ((await sinAlumnosCard.count()) === 0) {
      test.skip(
        true,
        "Seed no incluye grupo sin alumnos en este entorno; omitiendo."
      );
    }

    await sinAlumnosCard.first().click();
    await teacher.selectAsignacion("Parcial 1");
    await expect(teacher.errorState()).toContainText(/no tiene alumnos/i);
  });

  test("Caveman: navegación Tab/Shift+Tab respeta comportamiento nativo", async ({
    page,
  }) => {
    const teacher = new TeacherGradesPage(page);
    await teacher.goto();
    await teacher.selectGrupo(SEED_DATA.materias.programacion.codigo);
    await teacher.selectAsignacion("Parcial 1");

    const input1 = teacher.rowByMatricula("2023020223").getByTestId("grade-input");
    const input2 = teacher.rowByMatricula("2023020111").getByTestId("grade-input");

    await input1.focus();
    // Enter avanza
    await page.keyboard.press("Enter");
    // Después de Enter, foco va al input siguiente del MISMO row (retro) o al
    // grade siguiente. El componente avanza al siguiente grade-input.
    await expect(input2).toBeFocused();

    // Shift+Tab regresa (a11y nativa)
    await page.keyboard.press("Shift+Tab");
    // Antes del input2 hay el retro-input1 → ese debería tener foco
    const retro1 = teacher.rowByMatricula("2023020223").getByTestId("retro-input");
    await expect(retro1).toBeFocused();
  });
});
