import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class AlumnoTareaDetallePage {
  constructor(private readonly page: Page) {}

  async esperarCargada() {
    await expect(this.page).toHaveURL(/\/alumno\/tareas\/[^/]+$/);
    await expect(
      this.page.getByRole("heading", { name: /instrucciones/i })
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /r.brica/i })
    ).toBeVisible();
  }

  async volverAListado() {
    await this.page.getByRole("link", { name: /volver a tareas pendientes/i }).click();
    await expect(this.page).toHaveURL(/\/alumno\/tareas$/);
  }
}
