import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, err, type Result } from "@/lib/result";

export type CrearGrupoInput = {
  subjectId: string;
  teacherId: string;
  periodId: string;
  nombre: string;
};

/** ADMIN/COORDINADOR: crea grupo validando teacher PROFESOR + subject + period. */
export async function crearGrupo(
  input: CrearGrupoInput
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const nombre = input.nombre?.trim();
  if (!input.subjectId || !input.teacherId || !input.periodId || !nombre) {
    return err("Campos requeridos faltantes", "VALIDATION");
  }

  const [teacher, subject, period] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.teacherId },
      select: { id: true, role: true },
    }),
    prisma.subject.findUnique({
      where: { id: input.subjectId },
      select: { id: true },
    }),
    prisma.period.findUnique({
      where: { id: input.periodId },
      select: { id: true },
    }),
  ]);

  if (!teacher) return err("Profesor no encontrado", "TEACHER_NOT_FOUND");
  if (teacher.role !== "PROFESOR")
    return err("El usuario no es PROFESOR", "TEACHER_INVALID_ROLE");
  if (!subject) return err("Materia no encontrada", "SUBJECT_NOT_FOUND");
  if (!period) return err("Periodo no encontrado", "PERIOD_NOT_FOUND");

  const group = await prisma.group.create({
    data: {
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      periodId: input.periodId,
      nombre,
    },
    select: { id: true },
  });

  return ok({ id: group.id });
}

/** PROFESOR: grupos del profesor autenticado en el periodo activo. */
export const obtenerGruposDelProfesor = cache(async () => {
  const user = await getAuthenticatedUser(["PROFESOR"]);

  const groups = await prisma.group.findMany({
    where: { teacherId: user.id, period: { isActive: true } },
    include: {
      subject: true,
      period: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return ok(groups);
});

/** ADMIN/COORDINADOR: grupos de un periodo con materia + profesor + conteo. */
export const obtenerGruposPorPeriodo = cache(async (periodId: string) => {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!periodId) return err("periodId requerido", "VALIDATION");

  const groups = await prisma.group.findMany({
    where: { periodId },
    include: {
      subject: true,
      teacher: {
        select: { id: true, nombre: true, apellidos: true, email: true },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return ok(groups);
});
