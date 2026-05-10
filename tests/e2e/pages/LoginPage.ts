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
}
