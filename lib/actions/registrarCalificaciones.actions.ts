"use server";

/*Server Actions — CU-05: RegistrarCalificaciones*/

import {
  obtenerGruposDelProfesor,
  obtenerAlumnosDelGrupo,
  obtenerAsignacionesDelGrupo,
  registrarCalificaciones,
  PeriodoCerradoError,
  FueraDeRangoError,
  ForbiddenError,
  GrupoSinAlumnosError,
  type GrupoDTO,
  type AlumnoEnGrupoDTO,
  type AssignmentDTO,
  type RegistrarCalificacionesInput,
  type RegistrarCalificacionesResult,
} from "@/lib/dal/registrarCalificaciones";

export type ActionResult<T> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; errorCode: "PERIOD_CLOSED" | "VALIDATION" | "FORBIDDEN" | "NO_ALUMNOS" | "DB_ERROR" | "AUTH_ERROR"; message: string };

export async function getGruposProfesorAction(): Promise<ActionResult<GrupoDTO[]>> {
  try {
    const data = await obtenerGruposDelProfesor();
    return { ok: true, data };
  } catch (err) {
    return handleError(err);
  }
}

export async function getAlumnosGrupoAction(
  groupId: string,
  assignmentId: string
): Promise<ActionResult<AlumnoEnGrupoDTO[]>> {
  try {
    const data = await obtenerAlumnosDelGrupo(groupId, assignmentId);
    return { ok: true, data };
  } catch (err) {
    return handleError(err);
  }
}

export async function getAsignacionesGrupoAction(
  groupId: string
): Promise<ActionResult<AssignmentDTO[]>> {
  try {
    const data = await obtenerAsignacionesDelGrupo(groupId);
    return { ok: true, data };
  } catch (err) {
    return handleError(err);
  }
}

export async function registrarCalificacionesAction(
  input: RegistrarCalificacionesInput
): Promise<ActionResult<RegistrarCalificacionesResult>> {
  try {
    const data = await registrarCalificaciones(input);
    return { ok: true, data, warnings: data.warnings };
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown): ActionResult<never> {
  if (err instanceof PeriodoCerradoError)
    return { ok: false, errorCode: "PERIOD_CLOSED", message: err.message };
  if (err instanceof FueraDeRangoError)
    return { ok: false, errorCode: "VALIDATION", message: err.message };
  if (err instanceof ForbiddenError)
    return { ok: false, errorCode: "FORBIDDEN", message: err.message };
  if (err instanceof GrupoSinAlumnosError)
    return { ok: false, errorCode: "NO_ALUMNOS", message: err.message };
  if (err instanceof Error && err.message.includes("Unauthorized"))
    return { ok: false, errorCode: "AUTH_ERROR", message: "No autorizado." };
  console.error("[CU-05]", err);
  return { ok: false, errorCode: "DB_ERROR", message: "Error al guardar. Intenta de nuevo." };
}