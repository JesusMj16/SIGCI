import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { LoginPage } from "../pages/LoginPage";
import { ALUMNO_SIN_TAREAS } from "../fixtures";

// Setup SQL: inscribe a Jesus en un grupo del periodo activo para que pase la
// guarda "tieneInscripcionesActivas" y caiga en el estado vacio de tareas.
// El alumno NO tiene submissions, asi que la rama esperada es "Estas al dia".
function psql(sql: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", "sigci-postgres", "psql", "-U", "postgres", "-d", "utm", "-t", "-A", "-c", sql],
    { encoding: "utf-8" }
  ).trim();
}

let jesusId = "";
let groupId = "";
let enrollmentCreated = false;

test.describe("CU-10 — Tareas pendientes (estado vacio)", () => {
  test.beforeAll(() => {
    jesusId = psql(
      `SELECT user_id FROM users WHERE email = '${ALUMNO_SIN_TAREAS.email}' LIMIT 1;`
    );
    groupId = psql(
      `SELECT g.group_id FROM groups g JOIN periods p ON p.period_id = g.period_id WHERE p.is_active = true LIMIT 1;`
    );
    if (!jesusId || !groupId) {
      throw new Error(
        `Setup fallo: jesusId='${jesusId}' groupId='${groupId}'`
      );
    }

    // Crear inscripcion solo si no existe. Si crea, marcar para limpiar.
    const existed = psql(
      `SELECT enrollment_id FROM enrollments WHERE student_id='${jesusId}' AND group_id='${groupId}' LIMIT 1;`
    );
    if (!existed) {
      psql(
        `INSERT INTO enrollments (enrollment_id, student_id, group_id, created_at) VALUES ('e2e_jesus_${Date.now()}', '${jesusId}', '${groupId}', NOW());`
      );
      enrollmentCreated = true;
    }
  });

  test.afterAll(() => {
    if (enrollmentCreated && jesusId && groupId) {
      psql(
        `DELETE FROM enrollments WHERE student_id='${jesusId}' AND group_id='${groupId}' AND enrollment_id LIKE 'e2e_jesus_%';`
      );
    }
  });

  test("Alumno inscrito sin tareas pendientes ve '¡Estas al dia!'", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(ALUMNO_SIN_TAREAS.email, ALUMNO_SIN_TAREAS.password);
    await expect(page).toHaveURL(/\/alumno(\/|$)/);

    await page.goto("/alumno/tareas");

    await expect(
      page.getByRole("heading", { name: /tareas pendientes/i })
    ).toBeVisible();
    await expect(
      page.getByText(/no tienes tareas pendientes/i)
    ).toBeVisible();
    await expect(page.getByText(/est.s al d.a/i)).toBeVisible();

    // No deben renderizarse cards.
    await expect(page.getByTestId("tarea-card")).toHaveCount(0);
  });
});
