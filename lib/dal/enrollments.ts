import "server-only";

import { cache } from "react";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, err, type Result } from "@/lib/contracts/result";

/** ADMIN/COORDINADOR: inscribe un ALUMNO en un grupo existente. */
export async function inscribirAlumno(input: {
  studentId: string;
  groupId: string;
}): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!input.studentId || !input.groupId)
    return err("Campos requeridos faltantes", "VALIDATION");

  const [student, group] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.studentId },
      select: { id: true, role: true },
    }),
    prisma.group.findUnique({
      where: { id: input.groupId },
      select: { id: true },
    }),
  ]);

  if (!student) return err("Alumno no encontrado", "STUDENT_NOT_FOUND");
  if (student.role !== "ALUMNO")
    return err("El usuario no es ALUMNO", "STUDENT_INVALID_ROLE");
  if (!group) return err("Grupo no encontrado", "GROUP_NOT_FOUND");

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId: input.studentId, groupId: input.groupId },
      select: { id: true },
    });
    return ok({ id: enrollment.id });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return err("El alumno ya esta inscrito en este grupo", "DUPLICATE");
    }
    throw e;
  }
}

/** ALUMNO: solo self. ADMIN/COORDINADOR: cualquier alumno. Periodo activo. */
export const obtenerInscripcionesDelAlumno = cache(async (studentId: string) => {
  const user = await getAuthenticatedUser();

  if (user.role === "ALUMNO") {
    if (user.id !== studentId) return err("No autorizado", "FORBIDDEN");
  } else if (user.role !== "ADMIN" && user.role !== "COORDINADOR") {
    return err("No autorizado", "FORBIDDEN");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, group: { period: { isActive: true } } },
    include: {
      group: {
        include: {
          subject: true,
          period: true,
          teacher: {
            select: { id: true, nombre: true, apellidos: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(enrollments);
});

/** ADMIN/COORDINADOR: elimina inscripcion por id. */
export async function desinscribirAlumno(
  enrollmentId: string
): Promise<Result<{ id: string }>> {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  if (!enrollmentId) return err("enrollmentId requerido", "VALIDATION");

  try {
    const deleted = await prisma.enrollment.delete({
      where: { id: enrollmentId },
      select: { id: true },
    });
    return ok({ id: deleted.id });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return err("Inscripcion no encontrada", "NOT_FOUND");
    }
    throw e;
  }
}
