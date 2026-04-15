"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";

//  Tipos 
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface CrearMateriaInput {
  nombre: string;
  codigo: string;
  creditos: number;
}

export interface EditarMateriaInput {
  nombre?: string;
  codigo?: string;
  creditos?: number;
}

// Guard de autorización 
const ROLES_PERMITIDOS: UserRole[] = [UserRole.ADMIN, UserRole.COORDINADOR];

async function verificarAutorizacion(): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { ok: false, error: "No autenticado. Inicia sesión para continuar." };
  }

  if (!ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
    return {
      ok: false,
      error: `Acceso denegado. Solo ADMIN y COORDINADOR pueden gestionar materias. Tu rol actual es: ${session.user.role}`,
    };
  }

  return { ok: true, data: null };
}

//  crearMateria 
export async function crearMateria(
  data: CrearMateriaInput
): Promise<ActionResult<{ id: string; nombre: string; codigo: string; creditos: number }>> {
  const auth = await verificarAutorizacion();
  if (!auth.ok) return auth;

  // Validaciones básicas de entrada
  if (!data.nombre?.trim()) {
    return { ok: false, error: "El nombre de la materia es obligatorio." };
  }
  if (!data.codigo?.trim()) {
    return { ok: false, error: "El código de la materia es obligatorio." };
  }
  if (!data.creditos || data.creditos < 1) {
    return { ok: false, error: "Los créditos deben ser un número mayor a 0." };
  }

  try {
    const materia = await prisma.subject.create({
      data: {
        nombre: data.nombre.trim(),
        codigo: data.codigo.trim().toUpperCase(),
        creditos: data.creditos,
      },
      select: { id: true, nombre: true, codigo: true, creditos: true },
    });

    return { ok: true, data: materia };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: `Ya existe una materia con el código "${data.codigo.toUpperCase()}". Usa un código diferente.`,
      };
    }

    console.error("[crearMateria]", error);
    return { ok: false, error: "Error interno al crear la materia. Intenta de nuevo." };
  }
}

//  editarMateria 
export async function editarMateria(
  id: string,
  data: EditarMateriaInput
): Promise<ActionResult<{ id: string; nombre: string; codigo: string; creditos: number }>> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  if (!id) {
    return { ok: false, error: "El ID de la materia es requerido." };
  }

  const existe = await prisma.subject.findUnique({ where: { id } });
  if (!existe) {
    return { ok: false, error: `No se encontró ninguna materia con ID "${id}".` };
  }

  // Construir payload limpio 
  const payload: Prisma.SubjectUpdateInput = {};
  if (data.nombre !== undefined) {
    if (!data.nombre.trim()) {
      return { ok: false, error: "El nombre no puede quedar vacío." };
    }
    payload.nombre = data.nombre.trim();
  }
  if (data.codigo !== undefined) {
    if (!data.codigo.trim()) {
      return { ok: false, error: "El código no puede quedar vacío." };
    }
    payload.codigo = data.codigo.trim().toUpperCase();
  }
  if (data.creditos !== undefined) {
    if (data.creditos < 1) {
      return { ok: false, error: "Los créditos deben ser un número mayor a 0." };
    }
    payload.creditos = data.creditos;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "No se proporcionaron campos para actualizar." };
  }

  try {
    const materia = await prisma.subject.update({
      where: { id },
      data: payload,
      select: { id: true, nombre: true, codigo: true, creditos: true },
    });

    return { ok: true, data: materia };
  } catch (error) {
    
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: `El código "${data.codigo?.toUpperCase()}" ya está en uso por otra materia.`,
      };
    }

    console.error("[editarMateria]", error);
    return { ok: false, error: "Error interno al actualizar la materia. Intenta de nuevo." };
  }
}

//  eliminarMateria 
export async function eliminarMateria(id: string): Promise<ActionResult> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  if (!id) {
    return { ok: false, error: "El ID de la materia es requerido." };
  }

  const materia = await prisma.subject.findUnique({
    where: { id },
    select: { id: true, nombre: true, codigo: true },
  });

  if (!materia) {
    return { ok: false, error: `No se encontró ninguna materia con ID "${id}".` };
  }

  const totalGrupos = await prisma.group.count({
    where: { subjectId: id },
  });

  if (totalGrupos > 0) {
    return {
      ok: false,
      error: `No se puede eliminar la materia "${materia.nombre} (${materia.codigo})" porque tiene ${totalGrupos} grupo${totalGrupos === 1 ? "" : "s"} asociado${totalGrupos === 1 ? "" : "s"}. Elimina o reasigna los grupos primero.`,
    };
  }

  try {
    await prisma.subject.delete({ where: { id } });
    return { ok: true, data: null };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        ok: false,
        error: "No se puede eliminar la materia porque tiene registros dependientes en la base de datos.",
      };
    }

    console.error("[eliminarMateria]", error);
    return { ok: false, error: "Error interno al eliminar la materia. Intenta de nuevo." };
  }
}

// obtenerMaterias 

export async function obtenerMaterias(): Promise<
  ActionResult<{ id: string; nombre: string; codigo: string; creditos: number }[]>
> {
  const authResult = await verificarAutorizacion();
  if (!authResult.ok) return authResult;

  try {
    const materias = await prisma.subject.findMany({
      select: { id: true, nombre: true, codigo: true, creditos: true },
      orderBy: { nombre: "asc" },
    });

    return { ok: true, data: materias };
  } catch (error) {
    console.error("[obtenerMaterias]", error);
    return { ok: false, error: "Error interno al obtener las materias. Intenta de nuevo." };
  }
}