import { expect, type Locator, type Page } from "@playwright/test";

/**
 * POM — CU-04 Consultar Calificaciones (Alumno).
 * Encapsula selectores `data-testid` y acciones del flujo.
 */
export class StudentGradesPage {
  constructor(private readonly page: Page) {}

  // ── Locators raíz ────────────────────────────────────────────────────────
  readonly periodoSelect = () => this.page.getByTestId("periodo-select");
  readonly periodoLoading = () => this.page.getByTestId("periodo-loading");
  readonly periodoBadge = () => this.page.getByTestId("periodo-badge");
  readonly materiaFilter = () => this.page.getByTestId("materia-filter");
  readonly grid = () => this.page.getByTestId("materias-grid");
  readonly errorState = () => this.page.getByTestId("error-state");

  // Empty states
  readonly emptySinMaterias = () => this.page.getByTestId("empty-sin_materias");
  readonly emptySinCalificaciones = () =>
    this.page.getByTestId("empty-sin_calificaciones");
  readonly emptyPeriodoInvalido = () =>
    this.page.getByTestId("empty-periodo_invalido");

  // ── Acciones ─────────────────────────────────────────────────────────────
  async goto(periodoId?: string) {
    const url = periodoId
      ? `/alumno/calificaciones?periodo=${periodoId}`
      : "/alumno/calificaciones";
    await this.page.goto(url);
    await this.waitHydrated();
  }

  /** Espera a que el container monte (useEffect → data-hydrated="true"). */
  async waitHydrated() {
    await this.page
      .locator('[data-testid="cu04-root"][data-hydrated="true"]')
      .waitFor({ state: "attached", timeout: 15_000 });
  }

  async selectPeriodo(periodoId: string) {
    await this.periodoSelect().evaluate((el: HTMLSelectElement, value: string) => {
      const proto = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, periodoId);
    await this.page.waitForURL(
      (u) => u.toString().includes(`periodo=${periodoId}`),
      { timeout: 10_000 }
    );
  }

  async filterByMateria(nombre: string) {
    // React 19 controlled <select>: el value tracker interno (`_valueTracker`)
    // suprime el evento si se asigna `el.value` directamente. Hay que usar el
    // prototype setter para invalidar el tracker antes de despachar `change`.
    await this.materiaFilter().evaluate((el: HTMLSelectElement, value: string) => {
      const proto = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, nombre);
  }

  // ── Materias ─────────────────────────────────────────────────────────────
  card(codigo: string): Locator {
    return this.page.locator(`[data-testid="subject-card"][data-subject-codigo="${codigo}"]`);
  }

  async cards(): Promise<Locator[]> {
    return this.page.getByTestId("subject-card").all();
  }

  async toggleCardDetail(codigo: string) {
    await this.card(codigo).getByTestId("subject-toggle").click();
  }

  // ── Aserciones de alto nivel ─────────────────────────────────────────────
  async expectLoaded() {
    // Hero presente
    await expect(this.page.getByRole("heading", { name: "Mis Calificaciones" })).toBeVisible();
  }

  async expectMateriasCount(n: number) {
    await expect(this.grid()).toBeVisible();
    const cards = this.page.getByTestId("subject-card");
    await expect(cards).toHaveCount(n);
  }

  async expectPromedio(codigo: string, valor: string) {
    await expect(
      this.card(codigo).getByTestId("subject-promedio")
    ).toContainText(valor);
  }
}
