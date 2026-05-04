import "server-only";

import { UserRole } from "@/lib/generated/prisma/enums";
import { CARRERAS_UTM, type CarreraUTM } from "@/lib/contracts/carreras";
import type { CrearUsuarioConCredencialInput } from "@/lib/dal/users.types";

/**
 * Validadores estrictos para CU-01
 *  - matricula: exactamente 10 dígitos.
 *  - nombre / apellidos: solo letras y espacios.
 *  - email: dominio institucional `@gs.utm.mx`.
 *  - password: mínimo `MIN_PASSWORD` y al menos una mayúscula.
 *  - carrera: pertenece al catálogo `CARRERAS_UTM`.
 *  - role: pertenece al enum `UserRole` generado por Prisma.
 */

export const MIN_PASSWORD = 8;

const REQUIRED_FIELDS: (keyof CrearUsuarioConCredencialInput)[] = [
  "matricula",
  "nombre",
  "apellidos",
  "email",
  "password",
  "carrera",
  "role",
];

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set(
  Object.values(UserRole) as UserRole[]
);

const MATRICULA_RE = /^\d{10}$/;
const NAME_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const PASSWORD_UPPER_RE = /[A-Z]/;
const EMAIL_DOMAIN = "@gs.utm.mx";

export type ValidacionError =
  | { ok: false; code: "VALIDATION"; campo: string; mensaje: string }
  | { ok: false; code: "INVALID_ROLE"; mensaje: string };

export type ValidacionResult = { ok: true } | ValidacionError;

function fail(campo: string, mensaje: string): ValidacionError {
  return { ok: false, code: "VALIDATION", campo, mensaje };
}

export function validarCampos(
  input: CrearUsuarioConCredencialInput
): ValidacionResult {
  // 1) Requeridos no vacíos.
  for (const campo of REQUIRED_FIELDS) {
    const v = input[campo];
    if (v === undefined || v === null || String(v).trim() === "") {
      return fail(String(campo), `Campo requerido faltante: ${String(campo)}`);
    }
  }

  // 2) Rol contra enum real generado por Prisma.
  if (!ALLOWED_ROLES.has(input.role)) {
    return {
      ok: false,
      code: "INVALID_ROLE",
      mensaje: `Rol no permitido: ${String(input.role)}`,
    };
  }

  // 3) Matrícula: exactamente 10 dígitos positivos.
  if (!MATRICULA_RE.test(input.matricula.trim())) {
    return fail(
      "matricula",
      "La matrícula debe contener exactamente 10 dígitos positivos"
    );
  }

  // 4) Nombre y apellidos: cero números, cero símbolos.
  if (!NAME_RE.test(input.nombre.trim())) {
    return fail("nombre", "El nombre no debe contener números ni símbolos");
  }
  if (!NAME_RE.test(input.apellidos.trim())) {
    return fail(
      "apellidos",
      "Los apellidos no deben contener números ni símbolos"
    );
  }

  // 5) Correo institucional: dominio exacto @gs.utm.mx.
  if (!input.email.trim().toLowerCase().endsWith(EMAIL_DOMAIN)) {
    return fail("email", "El correo debe ser institucional (@gs.utm.mx)");
  }

  // 6) Contraseña: longitud mínima + al menos una mayúscula.
  if (input.password.length < MIN_PASSWORD) {
    return fail(
      "password",
      `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`
    );
  }
  if (!PASSWORD_UPPER_RE.test(input.password)) {
    return fail(
      "password",
      "La contraseña debe incluir al menos una letra mayúscula"
    );
  }

  // 7) Carrera: pertenece al catálogo institucional.
  const carreraNormalizada = input.carrera.trim().toLowerCase() as CarreraUTM;
  if (!(CARRERAS_UTM as readonly string[]).includes(carreraNormalizada)) {
    return fail(
      "carrera",
      "La carrera ingresada no se imparte en la institución o es inválida"
    );
  }

  return { ok: true };
}
