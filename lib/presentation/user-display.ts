import type { UserRole } from "./generated/prisma/enums";

export const ROLE_LABEL: Record<UserRole, string> = {
  ALUMNO: "Alumno",
  PROFESOR: "Profesor",
  ADMIN: "Administración",
  COORDINADOR: "Coordinación",
  BIBLIOTECA: "Biblioteca",
  SERVICIOS_ESCOLARES: "Servicios Escolares",
  DIRECTOR: "Dirección",
  PERSONAL_OPERATIVO: "Operaciones",
};

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}
