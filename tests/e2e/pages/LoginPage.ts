import { expect, type Page } from "@playwright/test";
import type { Credenciales } from "../helpers/credentials";

/**
 * POM — Pantalla de login (CU-00).
 * Aísla locators de email/password/submit y la verificación de error.
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  // Locators por id — más estables que getByLabel cuando hay aria-label collisions
  // (el toggle de "Mostrar contraseña" es un button con aria-label que choca con regex).
  readonly email = () => this.page.locator("#email");
  readonly password = () => this.page.locator("#password");
  readonly submit = () =>
    this.page.getByRole("button", { name: /iniciar sesion/i });
  readonly alert = () => this.page.getByRole("alert");

  async goto() {
    await this.page.goto("/login");
    await expect(this.page).toHaveURL(/\/login$/);
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

  async expectError(re: RegExp) {
    await expect(this.alert()).toBeVisible();
    await expect(this.alert()).toContainText(re);
  }
}
