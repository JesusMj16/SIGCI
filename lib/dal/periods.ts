import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, err, type Result } from "@/lib/result";

export type CrearPeriodoInput = {
  nombre: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
};

export type EditarPeriodoInput = Partial<CrearPeriodoInput>;

function toDate(v: Date | string): Date | null {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ADMIN/COORDINADOR: crea periodo.
 * Si isActive=true, desactiva los demas en la misma transaccion (exclusividad).
 */
export async function crearPeriodo(
  input: CrearPeriodoInput
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const nombre = input.nombre?.trim();
  const startDate = toDate(input.startDate);
  const endDate = toDate(input.endDate);
  const isActive = Boolean(input.isActive);

  if (!nombre || !startDate || !endDate) {
    return err("Campos requeridos faltantes o invalidos", "VALIDATION");
  }
  if (startDate >= endDate) {
    return err("startDate debe ser anterior a endDate", "VALIDATION");
  }

  try {
    const period = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.period.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }
      return tx.period.create({
        data: { nombre, startDate, endDate, isActive },
        select: { id: true },
      });
    });
    return ok({ id: period.id });
  } catch {
    return err("No se pudo crear el periodo", "DB_ERROR");
  }
}

/**
 * ADMIN/COORDINADOR: actualiza periodo.
 * Si se activa uno, desactiva los demas en la misma transaccion.
 */
export async function editarPeriodo(
  id: string,
  input: EditarPeriodoInput
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!id) return err("id requerido", "VALIDATION");

  const data: {
    nombre?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  } = {};

  if (input.nombre !== undefined) {
    const n = input.nombre.trim();
    if (!n) return err("nombre invalido", "VALIDATION");
    data.nombre = n;
  }
  if (input.startDate !== undefined) {
    const d = toDate(input.startDate);
    if (!d) return err("startDate invalido", "VALIDATION");
    data.startDate = d;
  }
  if (input.endDate !== undefined) {
    const d = toDate(input.endDate);
    if (!d) return err("endDate invalido", "VALIDATION");
    data.endDate = d;
  }
  if (input.isActive !== undefined) {
    data.isActive = Boolean(input.isActive);
  }
  if (Object.keys(data).length === 0) {
    return err("Sin cambios", "VALIDATION");
  }

  // Si se definen ambas fechas en el update, validar orden.
  if (data.startDate && data.endDate && data.startDate >= data.endDate) {
    return err("startDate debe ser anterior a endDate", "VALIDATION");
  }

  try {
    const period = await prisma.$transaction(async (tx) => {
      if (data.isActive === true) {
        await tx.period.updateMany({
          where: { isActive: true, NOT: { id } },
          data: { isActive: false },
        });
      }
      return tx.period.update({
        where: { id },
        data,
        select: { id: true },
      });
    });
    return ok({ id: period.id });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: unknown }).code === "P2025"
    ) {
      return err("Periodo no encontrado", "NOT_FOUND");
    }
    return err("No se pudo actualizar el periodo", "DB_ERROR");
  }
}

/** ADMIN/COORDINADOR: lista periodos ordenados por startDate desc. */
export const obtenerPeriodos = cache(async () => {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const periods = await prisma.period.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { groups: true } } },
  });

  return ok(periods);
});

/**
 * ADMIN/COORDINADOR: retorna el unico periodo activo (isActive=true)
 * o null si no existe.
 */
export const obtenerPeriodoActivo = cache(async () => {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const period = await prisma.period.findFirst({
    where: { isActive: true },
  });

  return ok(period);
});
