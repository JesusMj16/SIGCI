import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { AlumnoTareasPage } from "../pages/AlumnoTareasPage";
import { AlumnoTareaDetallePage } from "../pages/AlumnoTareaDetallePage";
import { ALUMNO } from "../fixtures";

test.describe("CU-10 — Tareas pendientes (detalle)", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(ALUMNO.email, ALUMNO.password);
    await expect(page).toHaveURL(/\/alumno(\/|$)/);
  });

  test("Click en card navega al detalle y muestra instrucciones + rubrica", async ({
    page,
  }) => {
    const tareas = new AlumnoTareasPage(page);
    await tareas.goto();
    await expect(tareas.cards().first()).toBeVisible();

    await tareas.clickPrimerCard();

    const detalle = new AlumnoTareaDetallePage(page);
    await detalle.esperarCargada();

    await expect(page.getByTestId("detalle-tipo")).toBeVisible();
    await expect(page.getByTestId("detalle-estado")).toBeVisible();
  });

  test("Boton 'Volver' regresa al listado", async ({ page }) => {
    const tareas = new AlumnoTareasPage(page);
    await tareas.goto();
    await tareas.clickPrimerCard();

    const detalle = new AlumnoTareaDetallePage(page);
    await detalle.esperarCargada();
    await detalle.volverAListado();

    await expect(tareas.listado).toBeVisible();
  });

  test("ID inexistente devuelve 404", async ({ page }) => {
    const resp = await page.goto("/alumno/tareas/inexistente-id-xyz");
    expect(resp?.status()).toBe(404);
  });
});
