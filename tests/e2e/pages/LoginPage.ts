<<<<<<< HEAD
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
=======
// tests/e2e/pages/LoginPage.ts
//
// Page Object Model — pantalla de login (NextAuth Credentials).
// Locators resilientes: `getByLabel` y `getByRole` antes que selectores
// CSS frágiles. El formulario expone <Label htmlFor="email|password"> y
// un único submit, por lo que el POM se mantiene compacto.

import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    // why: getByLabel también matchea aria-label de botones; usamos role
    // textbox para anclar al input concreto y exact:true para no chocar
    // con "Mostrar contrasena" / "Ocultar contrasena" del toggle.
    this.email = page.getByRole("textbox", { name: /correo/i });
    this.password = page.getByRole("textbox", { name: "Contrasena", exact: true });
    this.submit = page.getByRole("button", { name: /iniciar sesi/i });
    this.errorAlert = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async loginAs(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await Promise.all([
      this.page.waitForURL((url) => !/\/login(\?|$)/.test(url.pathname), {
        timeout: 15_000,
      }),
      this.submit.click(),
    ]);
  }
>>>>>>> horarios
}
