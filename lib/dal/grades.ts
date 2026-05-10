/**
 * DAL — CU-04: ConsultarCalificaciones
 *
 * Reglas de negocio críticas:
 * 1. studentId proviene SIEMPRE de la sesión autenticada (aislamiento IDOR-safe).
 * 2. Calificaciones de periodos anteriores siguen accesibles.
 * 3. Cada consulta queda registrada para auditoría.
 *
 * Contrato:
 * - Excepciones tipadas → traducidas a errorCode por la capa de actions.
 * - DTOs planos (primitivos) seguros para Client Components.
 */

import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { AssignmentStatus, UserRole } from "@/lib/generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { getAuthenticatedUser } from "./session";

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface GradeDetailDTO {
  gradeId: string;
  assignmentId: string;
  assignmentTitulo: string;
  /** lowercase, default "tarea" si llega un tipo nuevo del schema */
  assignmentTipo: string;
  valor: number;
  retroalimentacion: string | null;
  submittedAt: Date | null;
}

export interface SubjectGradesDTO {
  groupId: string;
  subjectId: string;
  subjectNombre: string;
  subjectCodigo: string;
  promedio: number | null;
  grades: GradeDetailDTO[];
}

export interface PeriodCalificacionesDTO {
  periodId: string;
  periodNombre: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  materias: SubjectGradesDTO[];
}

export interface CalificacionesResultDTO {
  alumnoId: string;
  alumnoNombre: string;
  alumnoMatricula: string;
  periodos: PeriodCalificacionesDTO[];
  consultaRegistrada: boolean;
}

export interface PeriodSummaryDTO {
  id: string;
  nombre: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// ─── Excepciones tipadas ───────────────────────────────────────────────────

export class NoMateriasInscritasError extends Error {
  constructor() {
    super("No tienes materias inscritas en este periodo.");
    this.name = "NoMateriasInscritasError";
  }
}

export class SinCalificacionesError extends Error {
  constructor() {
    super("Aún no se han registrado calificaciones para este periodo.");
    this.name = "SinCalificacionesError";
  }
}

export class PeriodoNoEncontradoError extends Error {
  constructor() {
    super("El periodo solicitado no existe.");
    this.name = "PeriodoNoEncontradoError";
  }
}

// ─── Query principal ───────────────────────────────────────────────────────

/**
 * Recupera calificaciones del alumno autenticado.
 * @param periodoId  Si se omite, usa el periodo activo. Si se pasa, valida existencia.
 */
export const obtenerCalificacionesDelAlumno = cache(
  async (periodoId?: string): Promise<CalificacionesResultDTO> => {
    const session = await getAuthenticatedUser([UserRole.ALUMNO]);
    const studentId = session.id;

    // Perfil del alumno
    const userProfile = await prisma.user.findUniqueOrThrow({
      where: { id: studentId },
      select: { nombre: true, apellidos: true, matricula: true },
    });

    // Si llega periodoId, valida que exista (mensaje claro al alumno)
    if (periodoId) {
      const exists = await prisma.period.findUnique({
        where: { id: periodoId },
        select: { id: true },
      });
      if (!exists) throw new PeriodoNoEncontradoError();
    }

    const periodoWhere: Prisma.PeriodWhereInput = periodoId
      ? { id: periodoId }
      : { isActive: true };

    // Inscripciones + cadena de datos
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        group: { period: periodoWhere },
      },
      include: {
        group: {
          include: {
            subject: true,
            period: true,
            assignments: {
              where: { status: AssignmentStatus.PUBLICADO },
              include: {
                submissions: {
                  where: { studentId },
                  include: { grade: true },
                  orderBy: { intento: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new NoMateriasInscritasError();
    }

    // Agrupar por periodo
    const periodMap = new Map<string, PeriodCalificacionesDTO>();

    for (const enrollment of enrollments) {
      const { group } = enrollment;
      const { period, subject, assignments } = group;

      if (!periodMap.has(period.id)) {
        periodMap.set(period.id, {
          periodId: period.id,
          periodNombre: period.nombre,
          startDate: period.startDate,
          endDate: period.endDate,
          isActive: period.isActive,
          materias: [],
        });
      }

      const periodoDTO = periodMap.get(period.id)!;
      const gradeDetails: GradeDetailDTO[] = [];

      for (const assignment of assignments) {
        const submission = assignment.submissions[0];
        if (submission?.grade) {
          gradeDetails.push({
            gradeId: submission.grade.id,
            assignmentId: assignment.id,
            assignmentTitulo: assignment.titulo,
            assignmentTipo: String(assignment.tipo).toLowerCase(),
            valor: Number(submission.grade.valor),
            retroalimentacion: submission.grade.retroalimentacion ?? null,
            submittedAt: submission.submittedAt ?? null,
          });
        }
      }

      const promedio =
        gradeDetails.length > 0
          ? gradeDetails.reduce((acc, g) => acc + g.valor, 0) / gradeDetails.length
          : null;

      periodoDTO.materias.push({
        groupId: group.id,
        subjectId: subject.id,
        subjectNombre: subject.nombre,
        subjectCodigo: subject.codigo,
        promedio: promedio !== null ? Math.round(promedio * 100) / 100 : null,
        grades: gradeDetails,
      });
    }

    // Auditoría — fallo no bloquea
    let consultaRegistrada = false;
    try {
      await prisma.notification.create({
        data: {
          userId: studentId,
          titulo: "Consulta de calificaciones",
          mensaje: `El alumno consultó sus calificaciones${
            periodoId ? ` del periodo ${periodoId}` : " del periodo actual"
          }.`,
          leida: true, // log interno, no es alerta
        },
      });
      consultaRegistrada = true;
    } catch {
      console.warn("[CU-04] No se pudo registrar la consulta en el log.");
    }

    return {
      alumnoId: studentId,
      alumnoNombre: `${userProfile.nombre} ${userProfile.apellidos}`,
      alumnoMatricula: userProfile.matricula,
      periodos: Array.from(periodMap.values()).sort(
        (a, b) => b.startDate.getTime() - a.startDate.getTime()
      ),
      consultaRegistrada,
    };
  }
);

// ─── Periodos disponibles (selector "Ver periodos anteriores") ─────────────

export const obtenerPeriodosDelAlumno = cache(
  async (): Promise<PeriodSummaryDTO[]> => {
    const session = await getAuthenticatedUser([UserRole.ALUMNO]);

    const periods = await prisma.period.findMany({
      where: {
        groups: {
          some: {
            enrollments: { some: { studentId: session.id } },
          },
        },
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        nombre: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });

    return periods;
  }
);
