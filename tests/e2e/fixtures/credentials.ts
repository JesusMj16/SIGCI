// tests/e2e/fixtures/credentials.ts
//
// Credenciales de los usuarios sembrados por `prisma/seed_horarios.ts`.
// Si cambia el seed, actualizar este archivo.

export const CREDS = {
  ALUMNO: {
    email: "leonardo@utm.mx",
    password: "L1234567",
    nombre: "Leonardo",
    matricula: "20230001",
    storageStateFile: "tests/e2e/.auth/alumno.json",
  },
  PROFESOR: {
    email: "cmartinez@utm.mx",
    password: "L1234567",
    nombre: "Carlos Alberto",
    matricula: "EMP-001",
    storageStateFile: "tests/e2e/.auth/profesor.json",
  },
} as const;

export type RoleKey = keyof typeof CREDS;
