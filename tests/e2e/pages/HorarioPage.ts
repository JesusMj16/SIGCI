// tests/e2e/pages/HorarioPage.ts
//
// Page Object Model — vista de horario (CU-06) compartida por
// /alumno/horario y /profesor/horario. Locators resilientes vía
// data-testid expuestos por ScheduleGrid.

import { expect, type Download, type Locator, type Page } from "@playwright/test";

export type HorarioRoute = "/alumno/horario" | "/profesor/horario";

export class HorarioPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly fallbackAlert: Locator;
  readonly emptyState: Locator;
  readonly grid: Locator;
  readonly filterDay: Locator;
  readonly exportBtn: Locator;
  readonly icsError: Locator;
  readonly classes: Locator;

  constructor(page: Page) {
    this.page = page;
    // why: el shell tiene un h1 "UTM" en sidebar. Acotamos al heading
    // de la página por nombre accesible.
    this.heading = page.getByRole("heading", { level: 1, name: /horario/i });
    this.fallbackAlert = page.getByTestId("alert-fallback-period");
    this.emptyState = page.getByTestId("schedule-empty");
    this.grid = page.getByTestId("schedule-grid");
    this.filterDay = page.getByTestId("filter-day");
    this.exportBtn = page.getByTestId("btn-export-ics");
    this.icsError = page.getByTestId("ics-error");
    this.classes = page.getByTestId("schedule-class");
  }

  async goto(route: HorarioRoute) {
    await this.page.goto(route);
  }

  /**
   * Mide el tiempo total entre `goto` y que la grilla aparezca,
   * usado para verificar el requerimiento "carga < 3s" del CU-06.
   */
  async measureLoad(route: HorarioRoute): Promise<number> {
    const t0 = Date.now();
    await this.page.goto(route);
    await Promise.race([
      this.grid.waitFor({ state: "visible", timeout: 5_000 }),
      this.emptyState.waitFor({ state: "visible", timeout: 5_000 }),
    ]);
    return Date.now() - t0;
  }

  dayColumn(dayId: 1 | 2 | 3 | 4 | 5 | 6): Locator {
    return this.page.getByTestId(`schedule-day-${dayId}`);
  }

  async filterByDay(dayId: "ALL" | 1 | 2 | 3 | 4 | 5 | 6) {
    const testid = dayId === "ALL" ? "filter-all" : `filter-day-${dayId}`;
    await this.page.getByTestId(testid).click();
  }

  async expectVisible(route: HorarioRoute) {
    await this.goto(route);
    await expect(this.grid.or(this.emptyState)).toBeVisible({ timeout: 5_000 });
  }

  async downloadIcs(): Promise<Download> {
    // why: pattern recomendado por Playwright — registrar listener y
    // disparar el click en el mismo Promise.all evita carreras.
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportBtn.click(),
    ]);
    return download;
  }
}
