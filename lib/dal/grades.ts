/**
 * DAL — Calificaciones del Alumno
 * CU-04: ConsultarCalificaciones
 *
 * Regla de negocio crítica: studentId siempre proviene de la sesión
 * autenticada (getAuthenticatedUser). Nunca se expone como param externo
 * para evitar que un alumno consulte calificaciones ajenas.
 */

import { prisma } from "@/lib/db";
//import { getAuthenticatedUser } from "@/lib/session";
import { AssignmentStatus, UserRole } from "@/lib/generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { getAuthenticatedUser } from "./session";
//import type { Prisma } from "@/lib/generated/prisma";

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface GradeDetailDTO {
  gradeId: string;
  assignmentId: string;
  assignmentTitulo: string;
  assignmentTipo: "tarea" | "examen" | "proyecto";
  valor: number;          // Decimal → number
  retroalimentacion: string | null;
  submittedAt: Date | null;
}

export interface SubjectGradesDTO {
  groupId: string;
  subjectId: string;
  subjectNombre: string;
  subjectCodigo: string;
  promedio: number | null; // null si no hay grades aún
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
  /** Consulta registrada correctamente en access_log / estadísticas */
  consultaRegistrada: boolean;
}

// ─── Excepciones tipadas ────────────────────────────────────────────────────

export class NoMateriasInscritasError extends Error {
  constructor() {
    super("El alumno no tiene materias inscritas en ningún periodo.");
    this.name = "NoMateriasInscritasError";
  }
}

export class SinCalificacionesError extends Error {
  constructor() {
    super("Aún no se han registrado calificaciones para este periodo.");
    this.name = "SinCalificacionesError";
  }
}

// ─── Función principal ──────────────────────────────────────────────────────

/**
 * Recupera las calificaciones del alumno autenticado.
 *
 * @param periodoId  Opcional. Si se omite devuelve el periodo activo.
 *                   Si se pasa, devuelve ese periodo (flujo alternativo).
 */
export async function obtenerCalificacionesDelAlumno(
  periodoId?: string
): Promise<CalificacionesResultDTO> {
  // ── 1. Identificar al alumno desde la sesión (Regla de negocio: aislamiento) ──
  const session = await getAuthenticatedUser([UserRole.ALUMNO]);
  const studentId = session.id;

  // getAuthenticatedUser solo devuelve { id, role } — buscamos el perfil completo
  const userProfile = await prisma.user.findUniqueOrThrow({
    where: { id: studentId },
    select: { nombre: true, apellidos: true, matricula: true },
  });

  // ── 2. Determinar periodo(s) a consultar ──────────────────────────────────
  const periodoWhere: Prisma.PeriodWhereInput = periodoId
    ? { id: periodoId }
    : { isActive: true };

  // ── 3. Traer inscripciones del alumno con toda la cadena de datos ─────────
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      group: {
        period: periodoWhere,
      },
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
                include: {
                  grade: true,
                },
                orderBy: { intento: "desc" },
                take: 1, // último intento por assignment
              },
            },
          },
        },
      },
    },
  });

  // ── 4. Sin materias inscritas → excepción controlada ─────────────────────
  if (enrollments.length === 0) {
    throw new NoMateriasInscritasError();
  }

  // ── 5. Agrupar por periodo ────────────────────────────────────────────────
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

    // ── 6. Construir detalle de grades por materia ──────────────────────────
    const gradeDetails: GradeDetailDTO[] = [];

    for (const assignment of assignments) {
      const submission = assignment.submissions[0]; // último intento
      if (submission?.grade) {
        gradeDetails.push({
          gradeId: submission.grade.id,
          assignmentId: assignment.id,
          assignmentTitulo: assignment.titulo,
          assignmentTipo: assignment.tipo.toLowerCase() as GradeDetailDTO["assignmentTipo"],
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

  // ── 7. Registrar consulta en log (postcondición CU-04 paso 7) ─────────────
  let consultaRegistrada = false;
  try {
    await prisma.notification.create({
      data: {
        userId: studentId,
        titulo: "Consulta de calificaciones",
        mensaje: `El alumno consultó sus calificaciones${periodoId ? ` del periodo ${periodoId}` : " del periodo actual"}.`,
        leida: true, // interna/estadística, no debe aparecer como alerta
      },
    });
    consultaRegistrada = true;
  } catch {
    // Log no bloquea el flujo principal
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

// ─── Lista de periodos disponibles (flujo alternativo) ──────────────────────

export interface PeriodSummaryDTO {
  id: string;
  nombre: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

/**
 * Devuelve los periodos en los que el alumno autenticado tuvo inscripciones.
 * Usado para el selector "Ver periodos anteriores".
 */
export async function obtenerPeriodosDelAlumno(): Promise<PeriodSummaryDTO[]> {
  const session = await getAuthenticatedUser([UserRole.ALUMNO]);

  const periods = await prisma.period.findMany({
    where: {
      groups: {
        some: {
          enrollments: {
            some: { studentId: session.id },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return periods.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    startDate: p.startDate,
    endDate: p.endDate,
    isActive: p.isActive,
  }));
}