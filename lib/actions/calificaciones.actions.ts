/**
 * Server Actions — CU-04: ConsultarCalificaciones
 * Capa intermedia entre la UI y el DAL.
 * Maneja errores y serializa para el cliente.
 */

"use server";

import {
  obtenerCalificacionesDelAlumno,
  obtenerPeriodosDelAlumno,
  NoMateriasInscritasError,
  SinCalificacionesError,
  PeriodoNoEncontradoError,
  type CalificacionesResultDTO,
  type PeriodSummaryDTO,
} from "@/lib/dal/grades";

export type CalificacionesErrorCode =
  | "NO_MATERIAS"
  | "SIN_CALIFICACIONES"
  | "PERIODO_NO_ENCONTRADO"
  | "DB_ERROR"
  | "AUTH_ERROR";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorCode: CalificacionesErrorCode; message: string };

export async function getCalificacionesAction(
  periodoId?: string
): Promise<ActionResult<CalificacionesResultDTO>> {
  try {
    const data = await obtenerCalificacionesDelAlumno(periodoId);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof NoMateriasInscritasError) {
      return { ok: false, errorCode: "NO_MATERIAS", message: err.message };
    }
    if (err instanceof SinCalificacionesError) {
      return { ok: false, errorCode: "SIN_CALIFICACIONES", message: err.message };
    }
    if (err instanceof PeriodoNoEncontradoError) {
      return { ok: false, errorCode: "PERIODO_NO_ENCONTRADO", message: err.message };
    }
    if (err instanceof Error && err.message.includes("Unauthorized")) {
      return { ok: false, errorCode: "AUTH_ERROR", message: "No autorizado." };
    }
    console.error("[CU-04] getCalificacionesAction error:", err);
    return {
      ok: false,
      errorCode: "DB_ERROR",
      message: "Error al conectar con la base de datos. Intenta de nuevo.",
    };
  }
}

export async function getPeriodosAlumnoAction(): Promise<
  ActionResult<PeriodSummaryDTO[]>
> {
  try {
    const data = await obtenerPeriodosDelAlumno();
    return { ok: true, data };
  } catch (err) {
    console.error("[CU-04] getPeriodosAlumnoAction error:", err);
    return {
      ok: false,
      errorCode: "DB_ERROR",
      message: "No se pudieron cargar los periodos.",
    };
  }
}
