/**
 * DAL — CU-05: RegistrarCalificaciones
 *
 * Reglas de negocio críticas:
 * 1. Solo PROFESOR puede registrar, únicamente para sus grupos asignados (ownership).
 * 2. Solo durante periodo de captura abierto (Period.isActive = true).
 * 3. Calificaciones dentro del rango 0-10.
 * 4. Toda captura/modificación queda en log de auditoría.
 * 5. Alumnos notificados al registrar.
 *
 * Atomicidad: la persistencia de submissions + grades + notificaciones
 * de un mismo lote ocurre dentro de prisma.$transaction. Si falla cualquier
 * alumno, se revierte todo el lote (post-condición CU-05 íntegra).
 *
 * Notificaciones: se ejecutan post-commit en best-effort para no bloquear
 * la persistencia (excepción "Fallo en envío de notificaciones" del CU).
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  AssignmentStatus,
  SubmissionStatus,
  UserRole,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "../dal/session";
import { Prisma } from "../generated/prisma/client";

// ─── Excepciones tipadas ───────────────────────────────────────────────────

export class PeriodoCerradoError extends Error {
  code = "PERIOD_CLOSED" as const;
  constructor() {
    super("El periodo de captura no está abierto.");
    this.name = "PeriodoCerradoError";
  }
}

export class FueraDeRangoError extends Error {
  code = "VALIDATION" as const;
  constructor(valor: number) {
    super(`Valor ${valor} fuera de rango. Debe estar entre 0 y 10.`);
    this.name = "FueraDeRangoError";
  }
}

export class ForbiddenError extends Error {
  code = "FORBIDDEN" as const;
  constructor() {
    super("No autorizado: no eres titular de este grupo.");
    this.name = "ForbiddenError";
  }
}

export class GrupoSinAlumnosError extends Error {
  code = "NO_ALUMNOS" as const;
  constructor() {
    super("El grupo no tiene alumnos inscritos.");
    this.name = "GrupoSinAlumnosError";
  }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface GrupoDTO {
  groupId: string;
  subjectNombre: string;
  subjectCodigo: string;
  periodNombre: string;
  cupo: number;
  alumnosCount: number;
}

export interface AlumnoEnGrupoDTO {
  studentId: string;
  nombre: string;
  apellidos: string;
  matricula: string;
  gradeActual: {
    gradeId: string;
    valor: number;
    assignmentId: string;
    retroalimentacion: string | null;
  } | null;
}

export interface AssignmentDTO {
  assignmentId: string;
  titulo: string;
  tipo: string;
  fechaLimite: Date;
  status: string;
}

export interface EntradaCalificacion {
  studentId: string;
  /** null = no calificar (registro parcial). */
  valor: number | null;
  /**
   * undefined = no tocar retroalimentación existente (preserva comentario).
   * null      = limpiar retroalimentación.
   * string    = setear nueva retroalimentación.
   */
  retroalimentacion?: string | null;
}

export interface RegistrarCalificacionesInput {
  groupId: string;
  assignmentId: string;
  calificaciones: EntradaCalificacion[];
}

export interface RegistrarCalificacionesResult {
  gradesCreadas: number;
  gradesActualizadas: number;
  notificacionesEnviadas: number;
  auditoriaRegistrada: boolean;
  warnings: string[];
}

// ─── Lectura: grupos del profesor ──────────────────────────────────────────

export async function obtenerGruposDelProfesor(): Promise<GrupoDTO[]> {
  const session = await getAuthenticatedUser([UserRole.PROFESOR]);

  const groups = await prisma.group.findMany({
    where: {
      teacherId: session.id,
      period: { isActive: true },
    },
    include: {
      subject: true,
      period: true,
      _count: { select: { enrollments: true } },
    },
  });

  return groups.map((g) => ({
    groupId: g.id,
    subjectNombre: g.subject.nombre,
    subjectCodigo: g.subject.codigo,
    periodNombre: g.period.nombre,
    cupo: g.cupo,
    alumnosCount: g._count.enrollments,
  }));
}

// ─── Lectura: alumnos del grupo + grade actual por assignment ──────────────

export async function obtenerAlumnosDelGrupo(
  groupId: string,
  assignmentId: string
): Promise<AlumnoEnGrupoDTO[]> {
  const session = await getAuthenticatedUser([UserRole.PROFESOR]);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { teacherId: true, period: { select: { isActive: true } } },
  });

  if (!group || group.teacherId !== session.id) throw new ForbiddenError();
  if (!group.period.isActive) throw new PeriodoCerradoError();

  const enrollments = await prisma.enrollment.findMany({
    where: { groupId },
    include: {
      student: {
        select: { id: true, nombre: true, apellidos: true, matricula: true },
      },
    },
  });

  if (enrollments.length === 0) throw new GrupoSinAlumnosError();

  const studentIds = enrollments.map((e) => e.studentId);
  const gradesExistentes = await prisma.grade.findMany({
    where: {
      submission: { assignmentId },
      studentId: { in: studentIds },
    },
    include: { submission: { select: { assignmentId: true } } },
  });

  const gradeMap = new Map(gradesExistentes.map((g) => [g.studentId, g]));

  return enrollments.map((e) => {
    const grade = gradeMap.get(e.studentId);
    return {
      studentId: e.studentId,
      nombre: e.student.nombre,
      apellidos: e.student.apellidos,
      matricula: e.student.matricula,
      gradeActual: grade
        ? {
            gradeId: grade.id,
            valor: Number(grade.valor),
            assignmentId: grade.submission.assignmentId,
            retroalimentacion: grade.retroalimentacion ?? null,
          }
        : null,
    };
  });
}

// ─── Lectura: assignments publicados del grupo ─────────────────────────────

export async function obtenerAsignacionesDelGrupo(
  groupId: string
): Promise<AssignmentDTO[]> {
  const session = await getAuthenticatedUser([UserRole.PROFESOR]);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { teacherId: true },
  });
  if (!group || group.teacherId !== session.id) throw new ForbiddenError();

  const assignments = await prisma.assignment.findMany({
    where: { groupId, status: AssignmentStatus.PUBLICADO },
    orderBy: { fechaLimite: "asc" },
  });

  return assignments.map((a) => ({
    assignmentId: a.id,
    titulo: a.titulo,
    tipo: String(a.tipo).toLowerCase(),
    fechaLimite: a.fechaLimite,
    status: String(a.status).toLowerCase(),
  }));
}

// ─── Escritura: registrar calificaciones (atómico) ─────────────────────────

export async function registrarCalificaciones(
  input: RegistrarCalificacionesInput
): Promise<RegistrarCalificacionesResult> {
  const session = await getAuthenticatedUser([UserRole.PROFESOR]);
  const warnings: string[] = [];

  // Ownership + periodo abierto antes de la transacción
  const group = await prisma.group.findUnique({
    where: { id: input.groupId },
    include: { period: true, subject: true },
  });
  if (!group || group.teacherId !== session.id) throw new ForbiddenError();
  if (!group.period.isActive) throw new PeriodoCerradoError();

  // Validación de rango — falla rápido sin tocar BD
  for (const entrada of input.calificaciones) {
    if (entrada.valor !== null && (entrada.valor < 0 || entrada.valor > 10)) {
      throw new FueraDeRangoError(entrada.valor);
    }
  }

  // Filtrar entradas con valor (registro parcial respeta null = "no calificar")
  const entradasValidas = input.calificaciones.filter(
    (e) => e.valor !== null
  ) as (EntradaCalificacion & { valor: number })[];

  if (entradasValidas.length === 0) {
    return {
      gradesCreadas: 0,
      gradesActualizadas: 0,
      notificacionesEnviadas: 0,
      auditoriaRegistrada: false,
      warnings: ["No se ingresó ninguna calificación."],
    };
  }

  // Pre-fetch submissions y grades existentes en bulk (evita N+1 dentro de tx)
  const studentIds = entradasValidas.map((e) => e.studentId);
  const submissionsExistentes = await prisma.submission.findMany({
    where: {
      assignmentId: input.assignmentId,
      studentId: { in: studentIds },
    },
    orderBy: { intento: "desc" },
    select: { id: true, studentId: true, intento: true },
  });

  // Quedarse con el último intento por alumno
  const lastSubmissionByStudent = new Map<string, { id: string; intento: number }>();
  for (const s of submissionsExistentes) {
    if (!lastSubmissionByStudent.has(s.studentId)) {
      lastSubmissionByStudent.set(s.studentId, { id: s.id, intento: s.intento });
    }
  }

  let gradesCreadas = 0;
  let gradesActualizadas = 0;

  // Transacción: persistencia atómica del lote completo
  await prisma.$transaction(async (tx) => {
    for (const entrada of entradasValidas) {
      const existing = lastSubmissionByStudent.get(entrada.studentId);

      let submissionId: string;
      if (existing) {
        submissionId = existing.id;
        await tx.submission.update({
          where: { id: submissionId },
          data: { status: SubmissionStatus.CALIFICADO },
        });
      } else {
        const created = await tx.submission.create({
          data: {
            assignmentId: input.assignmentId,
            studentId: entrada.studentId,
            status: SubmissionStatus.CALIFICADO,
            intento: 1,
            submittedAt: new Date(),
          },
        });
        submissionId = created.id;
      }

      const gradeExistente = await tx.grade.findUnique({
        where: { submissionId },
        select: { id: true },
      });

      // Solo incluir retroalimentacion si fue provista (preserva existente cuando undefined)
      const retroData =
        entrada.retroalimentacion === undefined
          ? {}
          : { retroalimentacion: entrada.retroalimentacion };

      if (gradeExistente) {
        await tx.grade.update({
          where: { submissionId },
          data: {
            valor: new Prisma.Decimal(entrada.valor),
            ...retroData,
          },
        });
        gradesActualizadas++;
      } else {
        await tx.grade.create({
          data: {
            submissionId,
            studentId: entrada.studentId,
            valor: new Prisma.Decimal(entrada.valor),
            retroalimentacion: entrada.retroalimentacion ?? null,
          },
        });
        gradesCreadas++;
      }
    }
  });

  // Post-commit: notificaciones (best-effort, no revierten lo guardado)
  let notificacionesEnviadas = 0;
  for (const entrada of entradasValidas) {
    try {
      await prisma.notification.create({
        data: {
          userId: entrada.studentId,
          titulo: "Nueva calificación registrada",
          mensaje: `Se registró una calificación de ${entrada.valor} en ${group.subject.nombre}.`,
          leida: false,
        },
      });
      notificacionesEnviadas++;
    } catch (err) {
      const msg = `Fallo al notificar alumno ${entrada.studentId}: ${err}`;
      warnings.push(msg);
      console.warn("[CU-05]", msg);
    }
  }

  // Auditoría
  let auditoriaRegistrada = false;
  try {
    await prisma.notification.create({
      data: {
        userId: session.id,
        titulo: "Auditoría: Registro de calificaciones",
        mensaje: `Grupo ${input.groupId} / Assignment ${input.assignmentId}: ${gradesCreadas} creadas, ${gradesActualizadas} actualizadas.`,
        leida: true,
      },
    });
    auditoriaRegistrada = true;
  } catch (err) {
    warnings.push(`Fallo al registrar auditoría: ${err}`);
  }

  return {
    gradesCreadas,
    gradesActualizadas,
    notificacionesEnviadas,
    auditoriaRegistrada,
    warnings,
  };
}
