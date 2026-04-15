"use server";

/**
 * Wrappers delgados: toda la logica vive en lib/dal/periods.
 * Aqui solo se exponen las funciones como Server Actions.
 */
import {
  crearPeriodo as crearPeriodoDAL,
  editarPeriodo as editarPeriodoDAL,
  obtenerPeriodos as obtenerPeriodosDAL,
  obtenerPeriodoActivo as obtenerPeriodoActivoDAL,
  type CrearPeriodoInput,
  type EditarPeriodoInput,
} from "@/lib/dal/periods";

export async function crearPeriodo(input: CrearPeriodoInput) {
  return crearPeriodoDAL(input);
}

export async function editarPeriodo(id: string, input: EditarPeriodoInput) {
  return editarPeriodoDAL(id, input);
}

export async function obtenerPeriodos() {
  return obtenerPeriodosDAL();
}

export async function obtenerPeriodoActivo() {
  return obtenerPeriodoActivoDAL();
}
