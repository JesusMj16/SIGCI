"use server";

/**
 * Server Actions — CU-09: Crear y Publicar Asignación
 *
 * Mapea las excepciones tipadas del DAL a un ActionResult discriminado por
 * `errorCode`, listo para consumir desde Client Components sin filtrar
 * stacks ni detalles internos.
 */

import {
  crearAsignacion,
  ValidationError,
  ForbiddenError,
  PeriodoCerradoError,
  FechaInvalidaError,
  type CrearAsignacionInput,
  type CrearAsignacionResult,
} from "@/lib/dal/asignaciones";
import {
  obtenerGruposDelProfesor,
} from "@/lib/dal/groups";

export type ActionErrorCode =
  | "VALIDATION"
  | "FORBIDDEN"
  | "PERIOD_CLOSED"
  | "DATE_INVALID"
  | "AUTH_ERROR"
  | "DB_ERROR";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorCode: ActionErrorCode; message: string };

/** DTO mínimo de grupo para el selector. Aplana el include del DAL. */
export interface GrupoOpcionDTO {
  id: string;
  nombre: string;
  subjectNombre: string;
  subjectCodigo: string;
  alumnosCount: number;
}

export async function getGruposProfesorAction(): Promise<
  ActionResult<GrupoOpcionDTO[]>
> {
  try {
    const result = await obtenerGruposDelProfesor();
    // El DAL siempre retorna ok; mantenemos try/catch para fallas de auth/DB.
    const data: GrupoOpcionDTO[] = result.data.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      subjectNombre: g.subject.nombre,
      subjectCodigo: g.subject.codigo,
      alumnosCount: g._count.enrollments,
    }));
    return { ok: true, data };
  } catch (err) {
    return handleError(err);
  }
}

export async function crearAsignacionAction(
  input: CrearAsignacionInput
): Promise<ActionResult<CrearAsignacionResult>> {
  try {
    const data = await crearAsignacion(input);
    return { ok: true, data };
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown): ActionResult<never> {
  if (err instanceof ValidationError)
    return { ok: false, errorCode: "VALIDATION", message: err.message };
  if (err instanceof FechaInvalidaError)
    return { ok: false, errorCode: "DATE_INVALID", message: err.message };
  if (err instanceof PeriodoCerradoError)
    return { ok: false, errorCode: "PERIOD_CLOSED", message: err.message };
  if (err instanceof ForbiddenError)
    return { ok: false, errorCode: "FORBIDDEN", message: err.message };
  // getAuthenticatedUser redirige, así que un error explícito de auth llega
  // solo si Next no pudo redirigir (caso borde en streaming).
  if (err instanceof Error && /unauthorized|auth/i.test(err.message))
    return { ok: false, errorCode: "AUTH_ERROR", message: "No autorizado." };

  console.error("[CU-09][action]", err);
  return {
    ok: false,
    errorCode: "DB_ERROR",
    message: "Error al guardar la asignación. Intenta de nuevo.",
  };
}
