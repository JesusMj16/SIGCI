/**
 * DAL — Registrar Calificaciones
 * CU-05: RegistrarCalificaciones
 *
 * Reglas de negocio críticas:
 * 1. Solo PROFESOR puede registrar, únicamente para sus grupos asignados
 * 2. Solo durante periodo de captura abierto (Period.isActive = true)
 * 3. Calificaciones dentro del rango 0-10
 * 4. Toda captura queda en log de auditoría
 * 5. Alumnos notificados al registrar
 */

import { prisma } from "@/lib/db";
import { AssignmentStatus, AssignmentType, SubmissionStatus, UserRole } from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "../dal/session";
import { Prisma } from "../generated/prisma/client";

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

//  DTOs 

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
  } | null;
}

export interface EntradaCalificacion {
  studentId: string;
  valor: number | null; // null = no calificar (registro parcial)
  retroalimentacion?: string | null;  
}

export interface RegistrarCalificacionesInput {
  groupId: string;
  assignmentId: string; // evaluación a calificar
  calificaciones: EntradaCalificacion[];
}

export interface RegistrarCalificacionesResult {
  gradesCreadas: number;
  gradesActualizadas: number;
  notificacionesEnviadas: number;
  auditoriaRegistrada: boolean;
  warnings: string[]; // fallo notificación no bloquea
}

// obtenerGruposDelProfesor 
// Paso 3 del flujo: lista de grupos asignados al profesor

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

// obtenerAlumnosDelGrupo 
// Paso 5 del flujo: lista de alumnos con su grade actual si existe

export async function obtenerAlumnosDelGrupo(
  groupId: string,
  assignmentId: string
): Promise<AlumnoEnGrupoDTO[]> {
  const session = await getAuthenticatedUser([UserRole.PROFESOR]);

  // Regla de negocio: solo el titular del grupo puede ver sus alumnos
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

  // Traer grades existentes para este assignment
  const gradesExistentes = await prisma.grade.findMany({
    where: {
      submission: { assignmentId },
      studentId: { in: enrollments.map((e) => e.studentId) },
    },
    include: { submission: true },
  });

  const gradeMap = new Map(
    gradesExistentes.map((g) => [g.studentId, g])
  );

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
          }
        : null,
    };
  });
}

//  registrarCalificaciones 
// Pasos 9-13 del flujo: validar, guardar, actualizar promedio, notificar, auditar

export async function registrarCalificaciones(
  input: RegistrarCalificacionesInput
): Promise<RegistrarCalificacionesResult> {
  const session = await getAuthenticatedUser([UserRole.PROFESOR]);
  const warnings: string[] = [];

  // Validar que el grupo pertenece al profesor 
  const group = await prisma.group.findUnique({
    where: { id: input.groupId },
    include: { period: true, subject: true },
  });

  if (!group || group.teacherId !== session.id) throw new ForbiddenError();

  //  Excepción: periodo cerrado 
  if (!group.period.isActive) throw new PeriodoCerradoError();

  // ── Excepción: rango de calificaciones 
  for (const entrada of input.calificaciones) {
    if (entrada.valor !== null && (entrada.valor < 0 || entrada.valor > 10)) {
      throw new FueraDeRangoError(entrada.valor);
    }
  }

  //  Filtrar solo entradas con valor (registro parcial)
  const entradasValidas = input.calificaciones.filter(
    (e) => e.valor !== null
  ) as (EntradaCalificacion & { valor: number })[];

  let gradesCreadas = 0;
  let gradesActualizadas = 0;
  let notificacionesEnviadas = 0;

  // Guardar grades por alumno 
  for (const entrada of entradasValidas) {
    // Buscar o crear Submission
    const submissionExistente = await prisma.submission.findFirst({
      where: {
        assignmentId: input.assignmentId,
        studentId: entrada.studentId,
      },
      orderBy: { intento: "desc" },
    });

    let submissionId: string;

    if (submissionExistente) {
      submissionId = submissionExistente.id;
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.CALIFICADO },
      });
    } else {
      const nuevaSubmission = await prisma.submission.create({
        data: {
          assignmentId: input.assignmentId,
          studentId: entrada.studentId,
          status: SubmissionStatus.CALIFICADO,
          intento: 1,
          submittedAt: new Date(),
        },
      });
      submissionId = nuevaSubmission.id;
    }

    // Upsert Grade
    const gradeExistente = await prisma.grade.findUnique({
      where: { submissionId },
    });

    if (gradeExistente) {
      await prisma.grade.update({
        where: { submissionId },
        data: { valor: new Prisma.Decimal(entrada.valor),
            retroalimentacion: entrada.retroalimentacion ?? null, 
         },
      });
      gradesActualizadas++;
    } else {
      await prisma.grade.create({
        data: {
          submissionId,
          studentId: entrada.studentId,
          valor: new Prisma.Decimal(entrada.valor),
          retroalimentacion: entrada.retroalimentacion ?? null, 
        },
      });
      gradesCreadas++;
    }

    // Notificar al alumno (fallo no bloquea) 
    try {
      await notificarAlumno(
        entrada.studentId,
        group.subject.nombre,
        entrada.valor
      );
      notificacionesEnviadas++;
    } catch (err) {
      const msg = `Fallo al notificar alumno ${entrada.studentId}: ${err}`;
      warnings.push(msg);
      console.warn("[CU-05]", msg);
    }
  }

  // Registrar auditoría 
  let auditoriaRegistrada = false;
  try {
    await registrarAuditoria(
      session.id,
      input.groupId,
      input.assignmentId,
      gradesCreadas,
      gradesActualizadas
    );
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

// Helpers internos 

async function notificarAlumno(
  studentId: string,
  subjectNombre: string,
  valor: number
) {
  await prisma.notification.create({
    data: {
      userId: studentId,
      titulo: "Nueva calificación registrada",
      mensaje: `Se registró una calificación de ${valor} en ${subjectNombre}.`,
      leida: false,
    },
  });
}

async function registrarAuditoria(
  profesorId: string,
  groupId: string,
  assignmentId: string,
  creadas: number,
  actualizadas: number
) {
  await prisma.notification.create({
    data: {
      userId: profesorId,
      titulo: "Auditoría: Registro de calificaciones",
      mensaje: `Grupo ${groupId} / Assignment ${assignmentId}: ${creadas} creadas, ${actualizadas} actualizadas.`,
      leida: true,
    },
  });
}

// obtenerAsignacionesDelGrupo 
// Para el selector de tipo de evaluación (paso 6)

export interface AssignmentDTO {
  assignmentId: string;
  titulo: string;
  tipo: string;
  fechaLimite: Date;
  status: string;
}

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
    tipo: a.tipo.toLowerCase(),
    fechaLimite: a.fechaLimite,
    status: a.status.toLowerCase(),
  }));
}


export function getId(entity: { id: string }) {
  return entity.id;
}

export function getNombre(entity: { nombre: string }) {
  return entity.nombre;
}

export function getMatricula(user: { matricula: string }) {
  return user.matricula;
}

export function setValor(entrada: EntradaCalificacion, nuevoValor: number) {
  return { ...entrada, valor: nuevoValor };
}

export function setPromedio(grades: { valor: number }[]): number | null {
  if (grades.length === 0) return null;
  return grades.reduce((acc, g) => acc + g.valor, 0) / grades.length;
}

export function getAlumnos(enrollments: { studentId: string }[]) {
  return enrollments.map((e) => e.studentId);
}

export function enviar(notification: { userId: string; mensaje: string }) {
  return prisma.notification.create({ data: { ...notification, titulo: "Notificación", leida: false } });
}

export function registrarAccion(profesorId: string, accion: string, fechaHora: Date) {
  return prisma.notification.create({
    data: {
      userId: profesorId,
      titulo: `Auditoría: ${accion}`,
      mensaje: `Acción registrada el ${fechaHora.toISOString()}`,
      leida: true,
    },
  });
}

export async function generarAviso(studentId: string, subjectNombre: string, valor: number) {
  return notificarAlumno(studentId, subjectNombre, valor);
}