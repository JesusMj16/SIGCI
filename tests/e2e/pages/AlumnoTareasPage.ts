import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class AlumnoTareasPage {
  readonly listado: Locator;
  readonly filtroMateria: Locator;
  readonly ordenarPor: Locator;

  constructor(private readonly page: Page) {
    this.listado = page.getByTestId("tareas-list");
    this.filtroMateria = page.getByTestId("filtro-materia");
    this.ordenarPor = page.getByTestId("ordenar-por");
  }

  async goto() {
    await this.page.goto("/alumno/tareas");
    await expect(
      this.page.getByRole("heading", { name: /tareas pendientes/i })
    ).toBeVisible();
  }

  cards(): Locator {
    return this.page.getByTestId("tarea-card");
  }

  async cardCount(): Promise<number> {
    return this.cards().count();
  }

  async materiaIdsEnOrden(): Promise<string[]> {
    return this.cards().evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-materia-id") ?? "")
    );
  }

  async tiposEnOrden(): Promise<string[]> {
    return this.cards().evaluateAll((nodes) =>
      // Tipo aparece como una "pill" dentro del card; lo extraemos via dataset alternativo:
      // el TareaCard expone urgencia/estado/materia-id, no tipo. Usamos texto del badge.
      nodes.map((n) => {
        const pills = n.querySelectorAll("span");
        for (const p of Array.from(pills)) {
          const txt = p.textContent?.trim() ?? "";
          if (["TAREA", "EXAMEN", "PROYECTO"].includes(txt)) return txt;
        }
        return "";
      })
    );
  }

  async clickPrimerCard() {
    await this.cards().first().click();
  }
}
