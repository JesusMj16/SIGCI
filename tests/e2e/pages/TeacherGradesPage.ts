import { expect, type Locator, type Page } from "@playwright/test";

/**
 * POM — CU-05 Registrar Calificaciones (Profesor).
 * Cubre los 4 pasos: grupo → asignación → captura → resultado.
 */
export class TeacherGradesPage {
  constructor(private readonly page: Page) {}

  // ── Steps breadcrumb ─────────────────────────────────────────────────────
  readonly steps = () => this.page.getByTestId("steps");
  step(name: "grupo" | "asignacion" | "captura" | "resultado") {
    return this.page.getByTestId(`step-${name}`);
  }

  // ── Locators raíz ────────────────────────────────────────────────────────
  readonly gruposGrid = () => this.page.getByTestId("grupos-grid");
  readonly emptyGrupos = () => this.page.getByTestId("empty-grupos");
  readonly emptyAsignaciones = () => this.page.getByTestId("empty-asignaciones");
  readonly asignacionesList = () => this.page.getByTestId("asignaciones-list");
  readonly capturaTable = () => this.page.getByTestId("captura-table");
  readonly errorState = () => this.page.getByTestId("error-state");
  readonly resultadoCard = () => this.page.getByTestId("resultado-card");
  readonly warnings = () => this.page.getByTestId("warnings");
  readonly btnConfirmar = () => this.page.getByTestId("btn-confirmar");
  readonly btnReiniciar = () => this.page.getByTestId("btn-reiniciar");

  // ── Acciones ─────────────────────────────────────────────────────────────
  async goto() {
    await this.page.goto("/profesor/calificar");
    await this.waitHydrated();
  }

  /** Espera a que el container monte (useEffect → data-hydrated="true"). */
  async waitHydrated() {
    await this.page
      .locator('[data-testid="cu05-root"][data-hydrated="true"]')
      .waitFor({ state: "attached", timeout: 15_000 });
  }

  grupoCard(codigo: string): Locator {
    return this.page.locator(
      `[data-testid="grupo-card"][data-codigo="${codigo}"]`
    );
  }

  async selectGrupo(codigo: string) {
    await this.grupoCard(codigo).click();
    await expect(this.step("asignacion")).toHaveAttribute("data-state", "active");
  }

  asignacionCardByTitulo(titulo: string): Locator {
    return this.page.locator(
      `[data-testid="asignacion-card"]:has-text("${titulo}")`
    );
  }

  async selectAsignacion(titulo: string) {
    await this.asignacionCardByTitulo(titulo).click();
    await expect(this.step("captura")).toHaveAttribute("data-state", "active");
    await expect(this.capturaTable()).toBeVisible();
  }

  rowByMatricula(matricula: string): Locator {
    return this.page.locator(
      `[data-testid="captura-row"][data-matricula="${matricula}"]`
    );
  }

  async fillGrade(matricula: string, valor: string | number) {
    const input = this.rowByMatricula(matricula).getByTestId("grade-input");
    // React 19 controlled input: fill() puede no propagar onChange si el
    // value tracker queda sincronizado. Forzamos via prototype setter.
    await input.evaluate((el: HTMLInputElement, v: string) => {
      const proto = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, v);
      else el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, String(valor));
    await input.blur();
  }

  async fillRetro(matricula: string, texto: string) {
    await this.rowByMatricula(matricula).getByTestId("retro-input").fill(texto);
  }

  async getRowError(matricula: string): Promise<string | null> {
    const err = this.rowByMatricula(matricula).getByTestId("grade-error");
    if (await err.count()) return (await err.textContent())?.trim() ?? null;
    return null;
  }

  async confirmar() {
    await this.btnConfirmar().click();
  }

  async reiniciar() {
    await this.btnReiniciar().click();
    await expect(this.step("grupo")).toHaveAttribute("data-state", "active");
  }

  // ── Aserciones de alto nivel ─────────────────────────────────────────────
  async expectStepActive(name: "grupo" | "asignacion" | "captura" | "resultado") {
    await expect(this.step(name)).toHaveAttribute("data-state", "active");
  }

  async expectResultado(creadas: number, actualizadas: number) {
    await expect(this.resultadoCard()).toBeVisible();
    await expect(this.page.getByTestId("stat-creadas")).toContainText(
      String(creadas)
    );
    await expect(this.page.getByTestId("stat-actualizadas")).toContainText(
      String(actualizadas)
    );
  }
}
