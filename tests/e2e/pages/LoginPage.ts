// tests/e2e/pages/LoginPage.ts
//
// POM unificado de la pantalla de login. Expone tres APIs para soportar
// los specs heredados de cada rama:
//   - signIn(email, password) → tareas (CU-10)
//   - login({email, password}) → calificaciones (CU-04/05)
//   - loginAs(email, password) → horarios (CU-06/07)
//
// Locators por #id porque el toggle "Mostrar contrasena" tiene aria-label
// que choca con regex sobre getByRole/getByLabel.

import { expect, type Page } from "@playwright/test";

export interface Credenciales {
  email: string;
  password: string;
}

export class LoginPage {
  constructor(private readonly page: Page) {}

  readonly email = () => this.page.locator("#email");
  readonly password = () => this.page.locator("#password");
  readonly submit = () =>
    this.page.getByRole("button", { name: /iniciar sesion/i });
  readonly alert = () => this.page.getByRole("alert");

  async goto() {
    await this.page.goto("/login");
    await expect(this.page).toHaveURL(/\/login$/);
  }

  async signIn(email: string, password: string) {
    await this.email().fill(email);
    await this.password().fill(password);
    await this.submit().click();
  }

  async login(creds: Credenciales) {
    await this.goto();
    await this.email().fill(creds.email);
    await this.password().fill(creds.password);
    await Promise.all([
      this.page.waitForURL((url) => !/\/login$/.test(url.toString()), {
        timeout: 15_000,
      }),
      this.submit().click(),
    ]);
  }

  async loginAs(email: string, password: string) {
    await this.email().fill(email);
    await this.password().fill(password);
    await Promise.all([
      this.page.waitForURL((url) => !/\/login(\?|$)/.test(url.pathname), {
        timeout: 15_000,
      }),
      this.submit().click(),
    ]);
  }

  async expectError(re: RegExp) {
    await expect(this.alert()).toBeVisible();
    await expect(this.alert()).toContainText(re);
  }
}
