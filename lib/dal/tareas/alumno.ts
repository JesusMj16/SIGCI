import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { ok, type Result } from "@/lib/contracts/result";

export type EstadoTarea = "PENDIENTE" | "ENTREGADA" | "VENCIDA";
export type Urgencia = "alta" | "media" | "baja";
export type TipoTarea = "TAREA" | "EXAMEN" | "PROYECTO";

export type TareaPendienteDTO = {
  submissionId: string;
  assignmentId: string;
  titulo: string;
  tipo: TipoTarea;
  fechaLimite: string;
  diasRestantes: number;
  urgencia: Urgencia;
  estado: EstadoTarea;
  materia: { id: string; nombre: string; codigo: string };
  grupo: { id: string; nombre: string };
};

const MS_DAY = 24 * 60 * 60 * 1000;

function calcularUrgencia(diasRestantes: number): Urgencia {
  if (diasRestantes < 2) return "alta";
  if (diasRestantes < 7) return "media";
  return "baja";
}

/** ALUMNO: tareas pendientes propias del periodo activo, ordenadas por fechaLimite asc. */
export const getTareasPendientesAlumno = cache(
  async (): Promise<Result<TareaPendienteDTO[]>> => {
    const { id: userId } = await getAuthenticatedUser(["ALUMNO"]);

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: userId,
        status: "PENDIENTE",
        assignment: {
          status: "PUBLICADO",
          group: {
            period: { isActive: true },
            enrollments: { some: { studentId: userId } },
          },
        },
      },
      include: {
        assignment: {
          include: {
            group: { include: { subject: true } },
          },
        },
      },
      orderBy: { assignment: { fechaLimite: "asc" } },
    });

    const now = Date.now();

    const tareas: TareaPendienteDTO[] = submissions.map((s) => {
      const limite = s.assignment.fechaLimite;
      const diasRestantes = Math.ceil((limite.getTime() - now) / MS_DAY);
      const vencida = limite.getTime() < now;

      return {
        submissionId: s.id,
        assignmentId: s.assignment.id,
        titulo: s.assignment.titulo,
        tipo: s.assignment.tipo as TipoTarea,
        fechaLimite: limite.toISOString(),
        diasRestantes,
        urgencia: calcularUrgencia(diasRestantes),
        estado: vencida ? "VENCIDA" : "PENDIENTE",
        materia: {
          id: s.assignment.group.subject.id,
          nombre: s.assignment.group.subject.nombre,
          codigo: s.assignment.group.subject.codigo,
        },
        grupo: {
          id: s.assignment.group.id,
          nombre: s.assignment.group.nombre,
        },
      };
    });

    return ok(tareas);
  }
);

/** ALUMNO: true si tiene al menos una inscripcion en periodo activo. */
export const tieneInscripcionesActivas = cache(async (): Promise<boolean> => {
  const { id: userId } = await getAuthenticatedUser(["ALUMNO"]);
  const count = await prisma.enrollment.count({
    where: { studentId: userId, group: { period: { isActive: true } } },
  });
  return count > 0;
});
