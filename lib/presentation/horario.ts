// lib/presentation/horario.ts
//
// Capa de presentación para CU-06 (Consultar Horario de Clases).
// - DTO planos: viajan seguros del Server al Client (React 19 prohíbe
//   pasar funciones/componentes/Decimal/Date a Client Components).
// - Helpers puros: sin acceso a Prisma ni a window. Reutilizables en
//   build de .ics (server o client) y en pruebas unitarias.
//
// Decisión: el color por materia se computa en cliente con un hash
// determinista sobre subject.id; así dos cargas devuelven el mismo
// color sin sincronizar paletas con la base de datos. Inline HSL en
// vez de clases de Tailwind para no depender de qué tonos quedaron
// purgados por el motor de Tailwind v4 (CSS-first).

export type DayId = 1 | 2 | 3 | 4 | 5 | 6;

export type DayMeta = { id: DayId; name: string; short: string };

export const DAYS: readonly DayMeta[] = [
  { id: 1, name: "Lunes", short: "Lun" },
  { id: 2, name: "Martes", short: "Mar" },
  { id: 3, name: "Miércoles", short: "Mié" },
  { id: 4, name: "Jueves", short: "Jue" },
  { id: 5, name: "Viernes", short: "Vie" },
  { id: 6, name: "Sábado", short: "Sáb" },
] as const;

export type ScheduleSubjectDTO = {
  id: string;
  codigo: string;
  nombre: string;
};

export type ScheduleTeacherDTO = {
  nombre: string;
  apellidos: string;
};

export type ScheduleClassDTO = {
  id: string;
  subject: ScheduleSubjectDTO;
  teacher: ScheduleTeacherDTO | null; // null en vista profesor
  classroom: string;
  day: DayId;
  startTime: string; // "HH:mm" 24h
  endTime: string;   // "HH:mm" 24h
  groupName: string;
};

export type SchedulePeriodDTO = {
  id: string;
  nombre: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  isActive: boolean;
};

export type ScheduleDTO = {
  schedule: ScheduleClassDTO[];
  period: SchedulePeriodDTO | null;
  isFallback: boolean;
};

// ---------- helpers de tiempo ----------

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(hhmm: string): boolean {
  return typeof hhmm === "string" && TIME_RE.test(hhmm);
}

export function timeToMinutes(hhmm: string): number {
  if (!isValidTime(hhmm)) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isValidDay(d: unknown): d is DayId {
  return typeof d === "number" && Number.isInteger(d) && d >= 1 && d <= 6;
}

// ---------- color determinista por materia ----------
//
// hash djb2 sobre subject.id. Devolvemos {h,s,l} en HSL — render con
// alpha 0.10/0.30/1.0 para fondo/borde/texto. Mantiene contraste AA
// porque l queda entre 35 y 55.

export type SubjectColor = { h: number; s: number; l: number };

function djb2(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 10 hues bien espaciados — evita choques visuales con primary (#0B5471 ~205°)
// y secondary (#D14F33 ~10°).
const HUES = [200, 160, 35, 270, 340, 245, 175, 25, 190, 295] as const;

export function colorForSubject(subjectId: string): SubjectColor {
  const h = HUES[djb2(subjectId) % HUES.length];
  return { h, s: 65, l: 42 };
}
