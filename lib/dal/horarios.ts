// lib/dal/horarios.ts
//
// Data Access Layer para CU-06 (Consultar Horario de Clases).
//
// Reglas que esta capa garantiza:
//   1. server-only        → build rompe si se importa desde Client.
//   2. cache() de React   → la query se memoiza por request; el
//                           layout y la page pueden pedirla sin que
//                           Prisma se ejecute dos veces.
//   3. DTO plano          → seguro de pasar como prop a un Client
//                           Component (React 19 rechaza Date/Decimal).
//   4. Autenticación in-DAL → el ID del usuario JAMÁS se acepta como
//                           parámetro: lo obtiene de la sesión. Así
//                           se cumple la regla de privacidad CU-06:
//                           "cada usuario solo puede ver su propio
//                           horario".
//
// Cualquier consumidor server-side llama:
//   const horario = await getMyStudentSchedule();   // ALUMNO
//   const horario = await getMyTeacherSchedule();   // PROFESOR

import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import {
  isValidDay,
  isValidTime,
  type DayId,
  type ScheduleClassDTO,
  type ScheduleDTO,
  type SchedulePeriodDTO,
} from "@/lib/presentation/horario";

const EMPTY: ScheduleDTO = { schedule: [], period: null, isFallback: false };

// Resuelve el periodo activo; si no hay activo, devuelve el último
// registrado por endDate (excepción CU-06 "Periodo académico inactivo").
const resolvePeriod = cache(async () => {
  const active = await prisma.period.findFirst({ where: { isActive: true } });
  if (active) return { period: active, isFallback: false as const };
  const last = await prisma.period.findFirst({ orderBy: { endDate: "desc" } });
  return { period: last, isFallback: true as const };
});

function toPeriodDTO(p: {
  id: string;
  nombre: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}): SchedulePeriodDTO {
  return {
    id: p.id,
    nombre: p.nombre,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    isActive: p.isActive,
  };
}

type GroupRow = {
  id: string;
  nombre: string;
  classroom: string;
  day: number;
  startTime: string;
  endTime: string;
  subject: { id: string; codigo: string; nombre: string };
  teacher?: { nombre: string; apellidos: string } | null;
};

// Filtramos filas con datos inconsistentes para no romper la grilla.
function toClassDTOs(rows: GroupRow[], includeTeacher: boolean): ScheduleClassDTO[] {
  const out: ScheduleClassDTO[] = [];
  for (const g of rows) {
    if (!isValidDay(g.day)) continue;
    if (!isValidTime(g.startTime) || !isValidTime(g.endTime)) continue;
    out.push({
      id: g.id,
      subject: { id: g.subject.id, codigo: g.subject.codigo, nombre: g.subject.nombre },
      teacher:
        includeTeacher && g.teacher
          ? { nombre: g.teacher.nombre, apellidos: g.teacher.apellidos }
          : null,
      classroom: g.classroom,
      day: g.day as DayId,
      startTime: g.startTime,
      endTime: g.endTime,
      groupName: g.nombre,
    });
  }
  return out;
}

/**
 * Horario del ALUMNO autenticado para el periodo activo (o el último).
 * Lanza redirect si no hay sesión o el rol no corresponde.
 */
export const getMyStudentSchedule = cache(async (): Promise<ScheduleDTO> => {
  const me = await getAuthenticatedUser(["ALUMNO"]);
  const { period, isFallback } = await resolvePeriod();
  if (!period) return EMPTY;

  const rows = await prisma.group.findMany({
    where: {
      periodId: period.id,
      enrollments: { some: { studentId: me.id } },
    },
    select: {
      id: true,
      nombre: true,
      classroom: true,
      day: true,
      startTime: true,
      endTime: true,
      subject: { select: { id: true, codigo: true, nombre: true } },
      teacher: { select: { nombre: true, apellidos: true } },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return {
    schedule: toClassDTOs(rows, /* includeTeacher */ true),
    period: toPeriodDTO(period),
    isFallback,
  };
});

/**
 * Horario del PROFESOR autenticado para el periodo activo (o el último).
 */
export const getMyTeacherSchedule = cache(async (): Promise<ScheduleDTO> => {
  const me = await getAuthenticatedUser(["PROFESOR"]);
  const { period, isFallback } = await resolvePeriod();
  if (!period) return EMPTY;

  const rows = await prisma.group.findMany({
    where: { periodId: period.id, teacherId: me.id },
    select: {
      id: true,
      nombre: true,
      classroom: true,
      day: true,
      startTime: true,
      endTime: true,
      subject: { select: { id: true, codigo: true, nombre: true } },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return {
    schedule: toClassDTOs(rows, /* includeTeacher */ false),
    period: toPeriodDTO(period),
    isFallback,
  };
});
