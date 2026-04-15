"use server";

/**
 * Wrappers delgados: toda la logica vive en lib/dal/subjects.
 * Aqui solo se exponen las funciones como Server Actions.
 */
import {
  crearMateria as crearMateriaDAL,
  editarMateria as editarMateriaDAL,
  eliminarMateria as eliminarMateriaDAL,
  obtenerMaterias as obtenerMateriasDAL,
  type CrearMateriaInput,
  type EditarMateriaInput,
} from "@/lib/dal/subjects";

export async function crearMateria(input: CrearMateriaInput) {
  return crearMateriaDAL(input);
}

export async function editarMateria(id: string, input: EditarMateriaInput) {
  return editarMateriaDAL(id, input);
}

export async function eliminarMateria(id: string) {
  return eliminarMateriaDAL(id);
}

export async function obtenerMaterias() {
  return obtenerMateriasDAL();
}
