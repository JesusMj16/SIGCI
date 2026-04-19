import "server-only";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, err, type Result } from "@/lib/contracts/result";
import { generarQrData } from "@/lib/services/credential/qr";
import { notifyUser } from "@/lib/services/audit/notify";
import { UserRole } from "@/lib/generated/prisma/enums";

/**
 * CU-01 — Generar Credencial Digital (DAL).
 *
 * Flujo oficial (GUIA-IMPLEMENTACION-CU-DETALLADA.md §CU-01):
 *  1. ADMIN/COORDINADOR captura datos personales completos.
 *  2. Asigna rol.
 *  3. Confirma alta con estatus ACTIVO.
 *  4. Sistema valida datos completos + rol + estatus.
 *  5. Sistema genera QR único asociado al userId.
 *  6. Sistema persiste el QR en BD vinculado al perfil (transacción atómica).
 *  7. Sistema confirma al administrador.
 *  8. El QR queda disponible en el perfil.
 *
 * Reglas:
 *  - Guard doble: getAuthenticatedUser(["ADMIN","COORDINADOR"]) al inicio.
 *  - Atomicidad: prisma.$transaction([user.create, credential.create]).
 *  - Unicidad 1:1: Credential.userId @unique evita duplicados concurrentes.
 *  - Contrato: Result<T> (nunca se lanza un error crudo a la UI).
 */

export type CrearUsuarioConCredencialInput = {
  matricula: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  carrera: string;
  role: UserRole;
};

export type CrearUsuarioConCredencialOutput = {
  userId: string;
  credentialId: string;
  qrData: string;
};

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
// RFC 5322 simplificado: suficiente para rechazar entradas obviamente inválidas
// a nivel servidor. La unicidad sigue validada por BD.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type ValidacionError =
  | { ok: false; code: "VALIDATION"; campo: string; mensaje: string }
  | { ok: false; code: "INVALID_ROLE"; mensaje: string };

function validarCampos(
  input: CrearUsuarioConCredencialInput
): { ok: true } | ValidacionError {
  for (const campo of REQUIRED_FIELDS) {
    const v = input[campo];
    if (v === undefined || v === null || String(v).trim() === "") {
      return {
        ok: false,
        code: "VALIDATION",
        campo: String(campo),
        mensaje: `Campo requerido faltante: ${String(campo)}`,
      };
    }
  }

  // Rol contra enum real generado por Prisma.
  if (!ALLOWED_ROLES.has(input.role)) {
    return {
      ok: false,
      code: "INVALID_ROLE",
      mensaje: `Rol no permitido: ${String(input.role)}`,
    };
  }

  // Email con forma mínima válida.
  if (!EMAIL_RE.test(input.email.trim())) {
    return {
      ok: false,
      code: "VALIDATION",
      campo: "email",
      mensaje: "Email con formato inválido",
    };
  }

  // Contraseña: no confiar en required del cliente.
  if (input.password.length < MIN_PASSWORD) {
    return {
      ok: false,
      code: "VALIDATION",
      campo: "password",
      mensaje: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`,
    };
  }

  return { ok: true };
}

function mapPrismaError(e: unknown): Result<never> {
  // Prisma known errors llegan como objetos con `code`.
  const code =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const meta =
    typeof e === "object" && e !== null && "meta" in e
      ? (e as { meta?: { target?: string | string[] } }).meta
      : undefined;

  if (code === "P2002") {
    // Unique constraint
    const target = Array.isArray(meta?.target)
      ? meta?.target.join(",")
      : meta?.target ?? "";
    if (String(target).includes("email"))
      return err("Email duplicado", "DUPLICATE_EMAIL");
    if (String(target).includes("matricula"))
      return err("Matrícula duplicada", "DUPLICATE_MATRICULA");
    if (String(target).includes("user_id") || String(target).includes("userId"))
      return err("Credencial activa existente", "DUPLICATE_CREDENTIAL");
    return err("Registro duplicado", "DUPLICATE");
  }
  return err(
    e instanceof Error ? e.message : "Fallo al guardar en BD",
    "DB_ERROR"
  );
}

/**
 * Paso 1-7 del flujo principal. Crea User + Credential en una misma
 * transacción; si cualquiera falla, ambos se revierten.
 */
export async function crearUsuarioConCredencial(
  input: CrearUsuarioConCredencialInput
): Promise<Result<CrearUsuarioConCredencialOutput>> {
  // Guard doble — doble check de sesión + rol.
  const actor = await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  // Paso 4: validación de datos completos y rol asignado.
  const val = validarCampos(input);
  if (!val.ok) {
    return err(val.mensaje, val.code);
  }

  // Normalización segura.
  const data = {
    matricula: input.matricula.trim(),
    nombre: input.nombre.trim(),
    apellidos: input.apellidos.trim(),
    email: input.email.trim().toLowerCase(),
    carrera: input.carrera.trim(),
    role: input.role,
  };

  try {
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Paso 5 + 6: generación del QR y persistencia atómica.
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          matricula: data.matricula,
          nombre: data.nombre,
          apellidos: data.apellidos,
          email: data.email,
          passwordHash,
          carrera: data.carrera,
          role: data.role,
          // status default = ACTIVO (schema.prisma)
        },
        select: { id: true },
      });

      // Paso 5: QR firmado dependiente del userId recién creado.
      const qrData = generarQrData(user.id);

      const credential = await tx.credential.create({
        data: {
          userId: user.id,
          qrData,
          isActive: true,
        },
        select: { id: true },
      });

      return { userId: user.id, credentialId: credential.id, qrData };
    });

    // Paso 7: auditoría mínima (no rompe el flujo si falla).
    await notifyUser(
      actor.id,
      "Credencial generada",
      `Se generó credencial digital para el usuario ${result.userId} (rol ${data.role}).`
    );

    return ok(result);
  } catch (e) {
    return mapPrismaError(e);
  }
}

/**
 * Flujo alternativo: reactivación de usuario previamente dado de baja sin
 * credencial vigente. Retoma desde el paso 4 del flujo oficial.
 */
export async function reactivarUsuarioYGenerarCredencial(
  userId: string
): Promise<Result<CrearUsuarioConCredencialOutput>> {
  const actor = await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!userId || typeof userId !== "string") {
    return err("userId requerido", "VALIDATION");
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        credential: { select: { id: true, isActive: true } },
      },
    });

    if (!existing) return err("Usuario no encontrado", "NOT_FOUND");

    // Regla de negocio: no se puede reactivar si ya hay credencial activa.
    if (existing.credential?.isActive) {
      return err(
        "El usuario ya tiene una credencial activa",
        "DUPLICATE_CREDENTIAL"
      );
    }

    const qrData = generarQrData(existing.id);

    // Paso 6: atomicidad — activa usuario + upsert de credencial.
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.id },
        data: { status: "ACTIVO" },
      });

      const credential = await tx.credential.upsert({
        where: { userId: existing.id },
        create: { userId: existing.id, qrData, isActive: true },
        update: { qrData, isActive: true, expiresAt: null },
        select: { id: true },
      });

      return { userId: existing.id, credentialId: credential.id, qrData };
    });

    await notifyUser(
      actor.id,
      "Usuario reactivado",
      `Se reactivó el usuario ${result.userId} y se regeneró su credencial.`
    );

    return ok(result);
  } catch (e) {
    return mapPrismaError(e);
  }
}

/**
 * Lectura auxiliar para la lista de /admin/usuarios (solo ADMIN/COORDINADOR).
 * DTO plano, serializable.
 */
export type UsuarioListadoDTO = {
  id: string;
  matricula: string;
  nombre: string;
  apellidos: string;
  email: string;
  role: UserRole;
  status: string;
  tieneCredencial: boolean;
  credencialActiva: boolean;
};

export async function obtenerUsuariosAdmin(): Promise<
  Result<UsuarioListadoDTO[]>
> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  try {
    const rows = await prisma.user.findMany({
      select: {
        id: true,
        matricula: true,
        nombre: true,
        apellidos: true,
        email: true,
        role: true,
        status: true,
        credential: { select: { isActive: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });

    const dto: UsuarioListadoDTO[] = rows.map((u) => ({
      id: u.id,
      matricula: u.matricula,
      nombre: u.nombre,
      apellidos: u.apellidos,
      email: u.email,
      role: u.role,
      status: String(u.status),
      tieneCredencial: u.credential !== null,
      credencialActiva: u.credential?.isActive === true,
    }));

    return ok(dto);
  } catch (e) {
    return mapPrismaError(e);
  }
}

/**
 * Evidencia CU-01 paso 8: el QR quedó disponible vinculado al perfil.
 * Lectura restringida al propio usuario (sesión actual). Pensada para ser
 * consumida por la superficie futura /credencial (CU-02) sin implementarla
 * aquí. DTO plano, safe-for-client.
 */
export type CredencialPropiaDTO = {
  tieneCredencial: boolean;
  credencialActiva: boolean;
  qrData: string | null;
  expiresAt: string | null;
};

export async function obtenerCredencialPropia(): Promise<
  Result<CredencialPropiaDTO>
> {
  const actor = await getAuthenticatedUser();

  try {
    const cred = await prisma.credential.findUnique({
      where: { userId: actor.id },
      select: { qrData: true, isActive: true, expiresAt: true },
    });

    if (!cred) {
      return ok({
        tieneCredencial: false,
        credencialActiva: false,
        qrData: null,
        expiresAt: null,
      });
    }

    return ok({
      tieneCredencial: true,
      credencialActiva: cred.isActive,
      qrData: cred.isActive ? cred.qrData : null,
      expiresAt: cred.expiresAt ? cred.expiresAt.toISOString() : null,
    });
  } catch (e) {
    return mapPrismaError(e);
  }
}
