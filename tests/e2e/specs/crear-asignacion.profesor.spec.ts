// tests/e2e/specs/crear-asignacion.profesor.spec.ts
//
// CU-09 — Crear y Publicar Asignación. Cubre el camino feliz hacia un
// borrador (sin mutar Submissions de alumnos reales del seed) y la
// validación cliente de fecha pasada.
//
// Autónomo: hace login inline para no depender de auth.setup.ts (que
// tiene desajustes heredados del merge upstream).

import { expect, test } from "@playwright/test";
import { CrearAsignacionPage } from "../pages/CrearAsignacionPage";
import { CREDENCIALES } from "../helpers/credentials";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill(CREDENCIALES.profesor.email);
  await page.locator("#password").fill(CREDENCIALES.profesor.password);
  await page.getByRole("button", { name: /iniciar sesion/i }).click();
  // El server action chain (signIn → redirectTo /login → proxy redirect por
  // rol) deja el shell del dashboard renderizado; esperamos a que la URL
  // ya no contenga "login" puro o a que aparezca el contenedor del CU-09.
  await page.waitForLoadState("networkidle");
});

test.describe("CU-09 · Crear Asignación · Profesor", () => {
  test("renderiza el stepper hidratado con el primer paso activo", async ({
    page,
  }) => {
    const pom = new CrearAsignacionPage(page);
    await pom.goto();

    await expect(pom.root).toBeVisible();
    await expect(page.getByTestId("step-grupos")).toHaveAttribute(
      "data-state",
      "active"
    );
    await expect(pom.grupoCards.first()).toBeVisible();
  });

  test("el botón 'Continuar' está deshabilitado sin grupo seleccionado", async ({
    page,
  }) => {
    const pom = new CrearAsignacionPage(page);
    await pom.goto();
    await expect(pom.btnContinuarFormulario).toBeDisabled();
  });

  test("seleccionar grupo habilita continuar y actualiza el contador", async ({
    page,
  }) => {
    const pom = new CrearAsignacionPage(page);
    await pom.goto();

    await pom.seleccionarPrimerGrupo();

    await expect(pom.contadorGrupos).toContainText(/1 grupo/i);
    await expect(pom.btnContinuarFormulario).toBeEnabled();
  });

  test("validación cliente: fecha pasada no avanza a confirmación", async ({
    page,
  }) => {
    const pom = new CrearAsignacionPage(page);
    await pom.goto();

    await pom.seleccionarPrimerGrupo();
    await pom.btnContinuarFormulario.click();

    await expect(pom.inputTitulo).toBeVisible();
    await pom.inputTitulo.fill("Tarea de prueba (no debe crearse)");
    await pom.inputInstrucciones.fill("Instrucciones de prueba.");
    // El input tiene `min={ahora}`, así que el browser bloquea el submit
    // del form ante una fecha pasada (HTML5 validity). Verificamos el
    // efecto visible: el form no avanza.
    await pom.inputFechaLimite.fill("2000-01-01T08:00");
    await pom.btnContinuarConfirmacion.click();

    await expect(pom.pasoConfirmacion).toHaveCount(0);
    await expect(pom.inputTitulo).toBeVisible(); // sigue en el paso 2
  });

  test("camino feliz: guardar como borrador llega al paso de resultado", async ({
    page,
  }) => {
    const pom = new CrearAsignacionPage(page);
    await pom.goto();

    await pom.seleccionarPrimerGrupo();
    await pom.btnContinuarFormulario.click();

    await pom.llenarFormularioValido({
      titulo: `E2E Borrador ${Date.now()}`,
      instrucciones: "Esta asignación fue creada por la suite E2E (borrador).",
      diasDesdeHoy: 7,
    });
    await pom.btnContinuarConfirmacion.click();

    await expect(pom.pasoConfirmacion).toBeVisible();
    await expect(pom.resumenTitulo).toContainText(/E2E Borrador/);

    await pom.btnGuardarBorrador.click();

    await expect(pom.pasoResultado).toBeVisible({ timeout: 10_000 });
    await expect(pom.pasoResultado).toContainText(/borrador guardado/i);
    await expect(pom.btnCrearOtra).toBeVisible();
  });

  test("autoguardado: al recargar mid-formulario se restaura el borrador local", async ({
    page,
  }) => {
    const pom = new CrearAsignacionPage(page);
    await pom.goto();

    await pom.seleccionarPrimerGrupo();
    await pom.btnContinuarFormulario.click();

    const tituloUnico = `Restaurable ${Date.now()}`;
    await pom.inputTitulo.fill(tituloUnico);
    await pom.inputInstrucciones.fill("Texto en proceso, no he terminado.");

    // Esperamos a que el debounce (600ms) escriba a localStorage.
    await page.waitForTimeout(900);

    await page.reload();
    await expect(pom.root).toHaveAttribute("data-hydrated", "true");

    // El paso vuelve a "grupos" (no persistimos la selección), pero al
    // avanzar al formulario el texto restaurado debe estar presente.
    await pom.seleccionarPrimerGrupo();
    await pom.btnContinuarFormulario.click();

    await expect(pom.bannerBorradorRestaurado).toBeVisible();
    await expect(pom.inputTitulo).toHaveValue(tituloUnico);

    // Limpieza: descartar el borrador para no contaminar otros tests.
    await pom.btnDescartarBorrador.click();
    await expect(pom.inputTitulo).toHaveValue("");
  });
});
