/**
 * DAL — CU-09: Crear y Publicar Asignación
 *
 * Reglas de negocio críticas:
 * 1. Solo PROFESOR puede crear/publicar, y solo para sus grupos asignados (ownership).
 * 2. La fecha límite debe ser futura y caer dentro del periodo activo del grupo.
 * 3. Al PUBLICAR se crea automáticamente un Submission(PENDIENTE) por cada
 *    Enrollment del grupo (postcondición CU-09 #3). El BORRADOR NO crea Submissions.
 * 4. Multi-grupo: la operación es atómica — si falla un grupo, no se crea ninguno.
 * 5. Notificación a alumnos es best-effort (post-commit, no bloqueante). Su fallo
 *    NO revierte la publicación (excepción "Fallo en envío de notificaciones").
 *
 * Adjuntos: v1 NO persiste archivos (sin storage). Rúbrica es texto plano.
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  AssignmentStatus,
  AssignmentType,
  SubmissionStatus,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/dal/session";

// ─── Excepciones tipadas ───────────────────────────────────────────────────

export class ValidationError extends Error {
  code = "VALIDATION" as const;
  constructor(msg: string) {
    super(msg);
    this.name = "ValidationError";
  }
}

export class ForbiddenError extends Error {
  code = "FORBIDDEN" as const;
  constructor(msg = "No autorizado: no eres titular de uno o más grupos.") {
    super(msg);
    this.name = "ForbiddenError";
  }
}

export class PeriodoCerradoError extends Error {
  code = "PERIOD_CLOSED" as const;
  constructor() {
    super("El periodo académico no está activo para uno o más grupos.");
    this.name = "PeriodoCerradoError";
  }
}

export class FechaInvalidaError extends Error {
  code = "DATE_INVALID" as const;
  constructor(msg: string) {
    super(msg);
    this.name = "FechaInvalidaError";
  }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────

export type ModoCreacion = "BORRADOR" | "PUBLICAR";

export interface CrearAsignacionInput {
  groupIds: string[];          // multi-grupo soportado
  tipo: AssignmentType;
  titulo: string;
  instrucciones: string;
  /** ISO 8601. La capa server convierte a Date y revalida. */
  fechaLimite: string;
  rubrica?: string | null;
  modo: ModoCreacion;
}

export interface CrearAsignacionResult {
  asignacionesCreadas: string[];   // ids de los Assignment creados
  submissionsCreadas: number;      // 0 si modo=BORRADOR
  notificacionesEnviadas: number;  // 0 si modo=BORRADOR
}

// ─── Helpers privados ──────────────────────────────────────────────────────

function validarInput(input: CrearAsignacionInput): Date {
  const titulo = input.titulo?.trim() ?? "";
  const instrucciones = input.instrucciones?.trim() ?? "";

  if (!titulo) throw new ValidationError("El título es obligatorio.");
  if (titulo.length > 256)
    throw new ValidationError("El título no puede exceder 256 caracteres.");
  if (!instrucciones)
    throw new ValidationError("Las instrucciones son obligatorias.");
  if (!input.groupIds || input.groupIds.length === 0)
    throw new ValidationError("Debes seleccionar al menos un grupo.");
  if (!Object.values(AssignmentType).includes(input.tipo))
    throw new ValidationError("Tipo de asignación inválido.");

  const fecha = new Date(input.fechaLimite);
  if (Number.isNaN(fecha.getTime()))
    throw new FechaInvalidaError("La fecha de entrega es inválida.");
  if (fecha.getTime() <= Date.now())
    throw new FechaInvalidaError("La fecha de entrega debe ser futura.");

  return fecha;
}

/**
 * Notificación best-effort. Sin infra real: log estructurado.
 * No revierte la publicación si falla.
 */
function notificarAlumnos(payload: {
  assignmentId: string;
  groupId: string;
  studentIds: string[];
  titulo: string;
}): number {
  try {
    console.log("[CU-09][notificacion]", JSON.stringify(payload));
    return payload.studentIds.length;
  } catch (e) {
    console.error("[CU-09][notificacion-fallo]", e);
    return 0;
  }
}

// ─── API pública ───────────────────────────────────────────────────────────

/**
 * PROFESOR: crea una asignación (o varias, una por grupo) en modo BORRADOR
 * o PUBLICAR. Multi-grupo es atómico.
 */
export async function crearAsignacion(
  input: CrearAsignacionInput
): Promise<CrearAsignacionResult> {
  const session = await getAuthenticatedUser(["PROFESOR"]);

  const fechaLimite = validarInput(input);

  // Carga los grupos en bulk con periodo y enrollments. Una sola query.
  const groups = await prisma.group.findMany({
    where: { id: { in: input.groupIds } },
    include: {
      period: true,
      enrollments: { select: { studentId: true } },
    },
  });

  // Ownership: cada groupId solicitado debe existir y pertenecer al profesor.
  // Además todos los periodos deben estar activos y la fecha caer dentro.
  if (groups.length !== input.groupIds.length) throw new ForbiddenError();
  for (const g of groups) {
    if (g.teacherId !== session.id) throw new ForbiddenError();
    if (!g.period.isActive) throw new PeriodoCerradoError();
    if (
      fechaLimite.getTime() < g.period.startDate.getTime() ||
      fechaLimite.getTime() > g.period.endDate.getTime()
    ) {
      throw new FechaInvalidaError(
        "La fecha de entrega debe estar dentro del periodo activo."
      );
    }
  }

  const status =
    input.modo === "PUBLICAR"
      ? AssignmentStatus.PUBLICADO
      : AssignmentStatus.BORRADOR;

  const rubrica = input.rubrica?.trim() || null;
  const tituloLimpio = input.titulo.trim();
  const instruccionesLimpias = input.instrucciones.trim();

  // Transacción: N assignments + (N×enrollments) submissions atómicamente.
  const result = await prisma.$transaction(async (tx) => {
    const asignacionesCreadas: string[] = [];
    let submissionsCreadas = 0;
    const notifPayloads: Array<{
      assignmentId: string;
      groupId: string;
      studentIds: string[];
    }> = [];

    for (const g of groups) {
      const assignment = await tx.assignment.create({
        data: {
          groupId: g.id,
          titulo: tituloLimpio,
          instrucciones: instruccionesLimpias,
          tipo: input.tipo,
          status,
          fechaLimite,
          rubrica,
        },
        select: { id: true },
      });

      asignacionesCreadas.push(assignment.id);

      if (input.modo === "PUBLICAR" && g.enrollments.length > 0) {
        // createMany evita N inserts; postcondición CU-09 #3.
        await tx.submission.createMany({
          data: g.enrollments.map((e) => ({
            assignmentId: assignment.id,
            studentId: e.studentId,
            status: SubmissionStatus.PENDIENTE,
            intento: 1,
          })),
        });
        submissionsCreadas += g.enrollments.length;
        notifPayloads.push({
          assignmentId: assignment.id,
          groupId: g.id,
          studentIds: g.enrollments.map((e) => e.studentId),
        });
      }
    }

    return { asignacionesCreadas, submissionsCreadas, notifPayloads };
  });

  // Notificaciones post-commit (best-effort, no bloquea ni revierte).
  let notificacionesEnviadas = 0;
  if (input.modo === "PUBLICAR") {
    for (const p of result.notifPayloads) {
      notificacionesEnviadas += notificarAlumnos({
        ...p,
        titulo: tituloLimpio,
      });
    }
  }

  return {
    asignacionesCreadas: result.asignacionesCreadas,
    submissionsCreadas: result.submissionsCreadas,
    notificacionesEnviadas,
  };
}
