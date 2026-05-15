import "server-only";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, err, type Result } from "@/lib/contracts/result";
import { generarQrData } from "@/lib/services/credential/qr";
import { notifyUser } from "@/lib/services/audit/notify";
import { validarCampos } from "@/lib/dal/users.validators";
import type {
  CrearUsuarioConCredencialInput,
  CrearUsuarioConCredencialOutput,
  UsuarioListadoDTO,
  CredencialPropiaDTO,
} from "@/lib/dal/users.types";

export type {
  CrearUsuarioConCredencialInput,
  CrearUsuarioConCredencialOutput,
  UsuarioListadoDTO,
  CredencialPropiaDTO,
};


function mapPrismaError(e: unknown): Result<never> {

  const code =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const meta =
    typeof e === "object" && e !== null && "meta" in e
      ? (e as { meta?: { target?: string | string[] } }).meta
      : undefined;

  if (code === "P2002") {

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
 * Crea usuario con credencial en una misma transacción.
 */
export async function crearUsuarioConCredencial(
  input: CrearUsuarioConCredencialInput
): Promise<Result<CrearUsuarioConCredencialOutput>> {
  //doble check de sesión + rol.
  const actor = await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  // validación de datos completos y rol asignado.
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

    // generación del QR y persistencia atómica.
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
