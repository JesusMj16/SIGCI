"use server";

/**
 * Wrappers delgados: toda la logica vive en lib/dal/groups.
 * Aqui solo se exponen las funciones como Server Actions.
 */
import {
  crearGrupo as crearGrupoDAL,
  obtenerGruposPorPeriodo as obtenerGruposPorPeriodoDAL,
  obtenerGruposDelProfesor as obtenerGruposDelProfesorDAL,
  type CrearGrupoInput,
} from "@/lib/dal/groups";

export async function crearGrupo(input: CrearGrupoInput) {
  return crearGrupoDAL(input);
}

export async function obtenerGruposPorPeriodo(periodId: string) {
  return obtenerGruposPorPeriodoDAL(periodId);
}

export async function obtenerGruposDelProfesor() {
  return obtenerGruposDelProfesorDAL();
}
