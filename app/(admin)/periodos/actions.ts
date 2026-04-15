"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";

// Tipos 
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface PeriodoData {
  id: string;
  nombre: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface CrearPeriodoInput {
  nombre: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
}

export interface EditarPeriodoInput {
  nombre?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
}

//  Guard de autorización 
const ROLES_PERMITIDOS: UserRole[] = [UserRole.ADMIN, UserRole.COORDINADOR];

async function verificarAutorizacion(): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { ok: false, error: "No autenticado. Inicia sesión para continuar." };
  }

  if (!ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
    return {
      ok: false,
      error: `Acceso denegado. Solo ADMIN y COORDINADOR pueden gestionar periodos. Tu rol actual es: ${session.user.role}`,
    };
  }

  return { ok: true, data: null };
}

//Helpers de validación 
function parseDate(value: Date | string, campo: string): Date | { error: string } {
  const fecha = value instanceof Date ? value : new Date(value);
  if (isNaN(fecha.getTime())) {
    return { error: `La fecha "${campo}" no tiene un formato válido.` };
  }
  return fecha;
}

function validarRangoFechas(startDate: Date, endDate: Date): string | null {
  if (endDate <= startDate) {
    return "La fecha de fin debe ser posterior a la fecha de inicio.";
  }
  return null;
}

//  crearPeriodo 
export async function crearPeriodo(
  data: CrearPeriodoInput
): Promise<ActionResult<PeriodoData>> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  // Validaciones de entrada
  if (!data.nombre?.trim()) {
    return { ok: false, error: "El nombre del periodo es obligatorio." };
  }
  if (!data.startDate) {
    return { ok: false, error: "La fecha de inicio es obligatoria." };
  }
  if (!data.endDate) {
    return { ok: false, error: "La fecha de fin es obligatoria." };
  }

  const startDate = parseDate(data.startDate, "startDate");
  if ("error" in startDate) return { ok: false, error: startDate.error };

  const endDate = parseDate(data.endDate, "endDate");
  if ("error" in endDate) return { ok: false, error: endDate.error };

  const rangoError = validarRangoFechas(startDate, endDate);
  if (rangoError) return { ok: false, error: rangoError };

  const isActive = data.isActive ?? false;

  try {
    const periodo = await prisma.$transaction(async (tx) => {
      if (isActive) {
        // Desactivar todos los periodos que actualmente estén activos
        await tx.period.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      // Crear el nuevo periodo (activo o inactivo según se solicitó)
      return tx.period.create({
        data: {
          nombre: data.nombre.trim(),
          startDate,
          endDate,
          isActive,
        },
        select: {
          id: true,
          nombre: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      });
    });

    return { ok: true, data: periodo };
  } catch (error) {
    console.error("[crearPeriodo]", error);
    return { ok: false, error: "Error interno al crear el periodo. Intenta de nuevo." };
  }
}

// editarPeriodo 

export async function editarPeriodo(
  id: string,
  data: EditarPeriodoInput
): Promise<ActionResult<PeriodoData>> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  if (!id) {
    return { ok: false, error: "El ID del periodo es requerido." };
  }

  // Verificar que el periodo exista
  const periodoActual = await prisma.period.findUnique({ where: { id } });
  if (!periodoActual) {
    return { ok: false, error: `No se encontró ningún periodo con ID "${id}".` };
  }

  // Construir payload de actualización
  const payload: Prisma.PeriodUpdateInput = {};

  if (data.nombre !== undefined) {
    if (!data.nombre.trim()) {
      return { ok: false, error: "El nombre no puede quedar vacío." };
    }
    payload.nombre = data.nombre.trim();
  }

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (data.startDate !== undefined) {
    const parsed = parseDate(data.startDate, "startDate");
    if ("error" in parsed) return { ok: false, error: parsed.error };
    startDate = parsed;
    payload.startDate = startDate;
  }

  if (data.endDate !== undefined) {
    const parsed = parseDate(data.endDate, "endDate");
    if ("error" in parsed) return { ok: false, error: parsed.error };
    endDate = parsed;
    payload.endDate = endDate;
  }

  const fechaInicio = startDate ?? periodoActual.startDate;
  const fechaFin = endDate ?? periodoActual.endDate;
  const rangoError = validarRangoFechas(fechaInicio, fechaFin);
  if (rangoError) return { ok: false, error: rangoError };

  if (data.isActive !== undefined) {
    payload.isActive = data.isActive;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "No se proporcionaron campos para actualizar." };
  }

  try {
    /*
     * Si se está activando este periodo, usamos transacción para desactivar
     * todos los demás de forma atómica antes de actualizar este.
     */
    const periodo = await prisma.$transaction(async (tx) => {
      if (data.isActive === true) {
        // Desactivar todos los periodos activos excepto el que se está editando
        await tx.period.updateMany({
          where: {
            isActive: true,
            id: { not: id },
          },
          data: { isActive: false },
        });
      }

      return tx.period.update({
        where: { id },
        data: payload,
        select: {
          id: true,
          nombre: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      });
    });

    return { ok: true, data: periodo };
  } catch (error) {
    console.error("[editarPeriodo]", error);
    return { ok: false, error: "Error interno al actualizar el periodo. Intenta de nuevo." };
  }
}

// obtenerPeriodos

export async function obtenerPeriodos(): Promise<ActionResult<PeriodoData[]>> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  try {
    const periodos = await prisma.period.findMany({
      select: {
        id: true,
        nombre: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
      orderBy: { startDate: "desc" },
    });

    return { ok: true, data: periodos };
  } catch (error) {
    console.error("[obtenerPeriodos]", error);
    return { ok: false, error: "Error interno al obtener los periodos. Intenta de nuevo." };
  }
}

//obtenerPeriodoActivo 

export async function obtenerPeriodoActivo(): Promise<ActionResult<PeriodoData | null>> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  try {
    const periodo = await prisma.period.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        nombre: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });

    return { ok: true, data: periodo };
  } catch (error) {
    console.error("[obtenerPeriodoActivo]", error);
    return { ok: false, error: "Error interno al obtener el periodo activo. Intenta de nuevo." };
  }
}