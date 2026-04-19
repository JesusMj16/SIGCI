import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, err, type Result } from "@/lib/contracts/result";

export type CrearMateriaInput = {
  nombre: string;
  codigo: string;
  creditos: number;
};

export type EditarMateriaInput = Partial<CrearMateriaInput>;

/** Duck-type para Prisma P2002 sin depender del namespace generado. */
function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2002"
  );
}

/** ADMIN/COORDINADOR: crea materia. `codigo` es @unique en schema. */
export async function crearMateria(
  input: CrearMateriaInput
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const nombre = input.nombre?.trim();
  const codigo = input.codigo?.trim();
  const creditos = Number(input.creditos);

  if (!nombre || !codigo || !Number.isFinite(creditos) || creditos <= 0) {
    return err("Campos requeridos faltantes o invalidos", "VALIDATION");
  }

  try {
    const subject = await prisma.subject.create({
      data: { nombre, codigo, creditos },
      select: { id: true },
    });
    return ok({ id: subject.id });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return err(`Ya existe una materia con el codigo "${codigo}"`, "CONFLICT");
    }
    return err("No se pudo crear la materia", "DB_ERROR");
  }
}

/** ADMIN/COORDINADOR: actualiza nombre, codigo y/o creditos. */
export async function editarMateria(
  id: string,
  input: EditarMateriaInput
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!id) return err("id requerido", "VALIDATION");

  const data: { nombre?: string; codigo?: string; creditos?: number } = {};
  if (input.nombre !== undefined) {
    const nombre = input.nombre.trim();
    if (!nombre) return err("nombre invalido", "VALIDATION");
    data.nombre = nombre;
  }
  if (input.codigo !== undefined) {
    const codigo = input.codigo.trim();
    if (!codigo) return err("codigo invalido", "VALIDATION");
    data.codigo = codigo;
  }
  if (input.creditos !== undefined) {
    const creditos = Number(input.creditos);
    if (!Number.isFinite(creditos) || creditos <= 0) {
      return err("creditos invalidos", "VALIDATION");
    }
    data.creditos = creditos;
  }
  if (Object.keys(data).length === 0) {
    return err("Sin cambios", "VALIDATION");
  }

  try {
    const subject = await prisma.subject.update({
      where: { id },
      data,
      select: { id: true },
    });
    return ok({ id: subject.id });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return err(
        `Ya existe una materia con el codigo "${data.codigo}"`,
        "CONFLICT"
      );
    }
    // P2025: record not found
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: unknown }).code === "P2025"
    ) {
      return err("Materia no encontrada", "NOT_FOUND");
    }
    return err("No se pudo actualizar la materia", "DB_ERROR");
  }
}

/**
 * ADMIN/COORDINADOR: elimina materia.
 * Bloquea si existen grupos asociados e indica cuantos.
 */
export async function eliminarMateria(
  id: string
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!id) return err("id requerido", "VALIDATION");

  const gruposAsociados = await prisma.group.count({ where: { subjectId: id } });
  if (gruposAsociados > 0) {
    return err(
      `No se puede eliminar: la materia tiene ${gruposAsociados} grupo(s) asociado(s)`,
      "VALIDATION_ERROR"
    );
  }

  try {
    await prisma.subject.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: unknown }).code === "P2025"
    ) {
      return err("Materia no encontrada", "NOT_FOUND");
    }
    return err("No se pudo eliminar la materia", "DB_ERROR");
  }
}

/** ADMIN/COORDINADOR: lista todas las materias (sin paginacion). */
export const obtenerMaterias = cache(async () => {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const subjects = await prisma.subject.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { groups: true } } },
  });

  return ok(subjects);
});
