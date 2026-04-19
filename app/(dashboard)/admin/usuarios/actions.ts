"use server";

/**
 * Wrappers delgados CU-01.
 * La lógica vive en lib/dal/users.ts; aquí solo se expone como Server Actions
 * y se añade el revalidate del listado tras mutaciones exitosas.
 */
import { revalidatePath } from "next/cache";

import {
  crearUsuarioConCredencial as crearUsuarioConCredencialDAL,
  reactivarUsuarioYGenerarCredencial as reactivarUsuarioYGenerarCredencialDAL,
  obtenerUsuariosAdmin as obtenerUsuariosAdminDAL,
  type CrearUsuarioConCredencialInput,
} from "@/lib/dal/users";

export async function crearUsuarioConCredencial(
  input: CrearUsuarioConCredencialInput
) {
  const result = await crearUsuarioConCredencialDAL(input);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

export async function reactivarUsuarioYGenerarCredencial(userId: string) {
  const result = await reactivarUsuarioYGenerarCredencialDAL(userId);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

export async function obtenerUsuariosAdmin() {
  return obtenerUsuariosAdminDAL();
}
