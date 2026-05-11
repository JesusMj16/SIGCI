// lib/presentation/horario_ics.ts
//
// Generador de archivos .ics conforme a RFC 5545.
// Cubre la excepción CU-06 "Fallo al generar archivo de calendario":
// lanza errores explícitos que el caller envuelve en try/catch.
//
// Implementación nota:
// - Cada grupo (clase) se modela como un VEVENT semanal recurrente
//   (FREQ=WEEKLY;BYDAY=XX) acotado por UNTIL al endDate del periodo.
// - Se incluye un VTIMEZONE básico para America/Mexico_City (CST -06:00)
//   para que Outlook/Google/Apple respeten la hora local sin convertir.
// - Texto escapado según RFC 5545 §3.3.11 (\, ; \n).
// - Líneas se "doblan" a 75 octetos como pide §3.1.

import {
  DAYS,
  isValidDay,
  isValidTime,
  type ScheduleClassDTO,
  type SchedulePeriodDTO,
} from "./horario";

const TZID = "America/Mexico_City";

// BYDAY index 0..5 == DayId 1..6 (Lun..Sáb)
const BYDAY: readonly string[] = ["MO", "TU", "WE", "TH", "FR", "SA"];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function escapeText(value: string): string {
  // Orden importa: backslash primero.
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  // RFC5545: máx 75 octetos por línea, CRLF + espacio para continuación.
  // Aproximación por caracteres (ASCII en su mayoría).
  const max = 75;
  if (line.length <= max) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = i === 0 ? line.slice(0, max) : " " + line.slice(i, i + max - 1);
    out.push(chunk);
    i += i === 0 ? max : max - 1;
  }
  return out.join("\r\n");
}

function fmtLocal(date: Date, hhmm: string): string {
  // YYYYMMDDTHHmm00 — hora local (sin Z) acoplada a TZID via DTSTART;TZID=
  const [hh, mm] = hhmm.split(":").map(Number);
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `T${pad2(hh)}${pad2(mm)}00`
  );
}

function fmtUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

// Primer día del semestre que cae en el weekday solicitado (1=Lun .. 6=Sáb).
// JS Date.getDay() = 0=Dom, 1=Lun .. 6=Sáb → coincide para 1..6.
function firstWeekdayOnOrAfter(start: Date, day: 1 | 2 | 3 | 4 | 5 | 6): Date {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diff = (day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export type IcsBuildInput = {
  classes: ScheduleClassDTO[];
  period: SchedulePeriodDTO;
  ownerLabel?: string;
};

export class IcsBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IcsBuildError";
  }
}

export function buildHorarioICS({ classes, period, ownerLabel }: IcsBuildInput): string {
  if (!period?.startDate || !period?.endDate) {
    throw new IcsBuildError("El periodo no tiene fechas válidas.");
  }

  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    throw new IcsBuildError("Fechas del periodo no parseables.");
  }
  if (periodEnd < periodStart) {
    throw new IcsBuildError("La fecha de fin del periodo es anterior al inicio.");
  }

  const dtstamp = fmtUtc(new Date());

  // UNTIL incluye el día final completo (23:59:59 UTC del endDate).
  const untilDate = new Date(Date.UTC(
    periodEnd.getUTCFullYear(),
    periodEnd.getUTCMonth(),
    periodEnd.getUTCDate(),
    23, 59, 59
  ));
  const until = fmtUtc(untilDate);

  const calName = ownerLabel
    ? `Horario UTM · ${period.nombre} · ${ownerLabel}`
    : `Horario UTM · ${period.nombre}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SIGCI UTM//Horario//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
    `X-WR-TIMEZONE:${TZID}`,
    "BEGIN:VTIMEZONE",
    `TZID:${TZID}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T020000",
    "TZOFFSETFROM:-0600",
    "TZOFFSETTO:-0600",
    "TZNAME:CST",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  let written = 0;
  for (const c of classes) {
    // Descarte defensivo de filas inconsistentes — el alumno no necesita
    // un .ics roto sólo porque la BD tenga un campo malformado.
    if (!isValidDay(c.day) || !isValidTime(c.startTime) || !isValidTime(c.endTime)) {
      continue;
    }
    if (c.startTime >= c.endTime) continue;

    const first = firstWeekdayOnOrAfter(periodStart, c.day);
    const dayLabel = DAYS.find((d) => d.id === c.day)?.name ?? "";
    const uid = `${c.id}@sigci.utm.mx`;

    const description = escapeText(
      [
        `Materia: ${c.subject.codigo} — ${c.subject.nombre}`,
        c.teacher ? `Profesor: ${c.teacher.nombre} ${c.teacher.apellidos}` : null,
        `Grupo: ${c.groupName}`,
        `Día regular: ${dayLabel}`,
      ].filter(Boolean).join("\n")
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=${TZID}:${fmtLocal(first, c.startTime)}`,
      `DTEND;TZID=${TZID}:${fmtLocal(first, c.endTime)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[c.day - 1]};UNTIL=${until}`,
      `SUMMARY:${escapeText(c.subject.nombre)}`,
      `LOCATION:${escapeText(`Aula ${c.classroom}`)}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
    );
    written++;
  }

  if (written === 0) {
    throw new IcsBuildError("No hay clases con datos válidos para exportar.");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}
