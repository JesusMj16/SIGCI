"use client";

// components/dashboard/ScheduleGrid.tsx
//
// CU-06 — Grilla semanal de horario.
// Único Client Component del flujo: render + filtro por día + exportar .ics.
// Lógica de datos vive en lib/dal/horarios.ts; helpers puros en
// lib/presentation/horario.ts; builder .ics en lib/presentation/horario_ics.ts.
//
// Decisiones de diseño:
//  - Composición SOLID: Toolbar, WeekGrid, ClassCard como subcomponentes
//    de archivo único. Cohesión alta, sin sobre-ingeniería de carpetas.
//  - useMemo de classesByDay convierte el render de O(D·N) a O(N).
//  - useCallback en handleExport para que el botón no recree handler
//    en cada cambio de filtro.
//  - Color por materia con HSL inline (hash determinista) para no
//    depender del purgado de Tailwind v4 — se renderiza siempre igual.
//
// Importante: la directiva "use client" debe ser la PRIMERA línea
// (Next 16 + Turbopack la ignoran si va después de un bloque de
// comentarios — síntoma: onClick nunca dispara React state).

import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  DAYS,
  colorForSubject,
  timeToMinutes,
  type DayId,
  type DayMeta,
  type ScheduleClassDTO,
  type SchedulePeriodDTO,
} from "@/lib/presentation/horario";
import { buildHorarioICS, IcsBuildError } from "@/lib/presentation/horario_ics";

type Role = "ALUMNO" | "PROFESOR";

type Props = {
  schedule: ScheduleClassDTO[];
  period: SchedulePeriodDTO | null;
  role: Role;
};

type DayFilter = DayId | "ALL";

export function ScheduleGrid({ schedule, period, role }: Props) {
  const [filterDay, setFilterDay] = useState<DayFilter>("ALL");
  const [icsError, setIcsError] = useState<string | null>(null);

  // why: pre-agrupar evita recorrer schedule completo en cada columna.
  const classesByDay = useMemo(() => {
    const map = new Map<DayId, ScheduleClassDTO[]>();
    for (const c of schedule) {
      const arr = map.get(c.day) ?? [];
      arr.push(c);
      map.set(c.day, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return map;
  }, [schedule]);

  const visibleDays = useMemo<DayMeta[]>(
    () => (filterDay === "ALL" ? [...DAYS] : DAYS.filter((d) => d.id === filterDay)),
    [filterDay],
  );

  const handleExport = useCallback(() => {
    setIcsError(null);
    try {
      if (!period) {
        throw new IcsBuildError("No hay un periodo disponible para exportar.");
      }
      const ics = buildHorarioICS({ classes: schedule, period, ownerLabel: role });
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horario_${slugify(period.nombre)}.ics`;
      // why: si removemos el <a> antes de que el navegador inicie la
      // descarga, Chromium puede cancelarla (lo vio Playwright timeout
      // de waitForEvent("download")). Diferimos cleanup ~1s.
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No fue posible generar el archivo .ics.";
      setIcsError(msg);
    }
  }, [period, role, schedule]);

  if (schedule.length === 0) {
    return (
      <div
        data-testid="schedule-empty"
        className="rounded-2xl border border-border bg-neutral p-8 text-center"
      >
        <p className="font-medium text-muted-foreground">
          {role === "ALUMNO"
            ? "No se encontraron materias para el periodo actual."
            : "No se encontraron grupos asignados para el periodo actual."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="schedule-grid">
      <Toolbar
        filterDay={filterDay}
        onChangeDay={setFilterDay}
        onExport={handleExport}
        canExport={!!period}
      />

      {icsError && (
        <div
          role="alert"
          data-testid="ics-error"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{icsError}</span>
        </div>
      )}

      <WeekGrid days={visibleDays} classesByDay={classesByDay} role={role} />
    </div>
  );
}

export default ScheduleGrid;

// ---------- subcomponentes ----------

function Toolbar({
  filterDay,
  onChangeDay,
  onExport,
  canExport,
}: {
  filterDay: DayFilter;
  onChangeDay: (next: DayFilter) => void;
  onExport: () => void;
  canExport: boolean;
}) {
  // why: button-group (tabs) en vez de <select> controlado — más
  // accesible (aria-pressed por opción) y elimina la fragilidad de
  // selectOption con controlled selects en React 19.
  const options: { value: DayFilter; label: string; testid: string }[] = [
    { value: "ALL", label: "Toda la semana", testid: "filter-all" },
    ...DAYS.map((d) => ({
      value: d.id as DayFilter,
      label: d.name,
      testid: `filter-day-${d.id}`,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Filtrar por día"
        data-testid="filter-day"
        className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1"
      >
        {options.map((opt) => {
          const active = filterDay === opt.value;
          return (
            <button
              key={opt.testid}
              type="button"
              data-testid={opt.testid}
              data-active={active ? "true" : "false"}
              aria-pressed={active}
              onClick={() => onChangeDay(opt.value)}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 " +
                (active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <Button
        data-testid="btn-export-ics"
        onClick={onExport}
        variant="secondary"
        disabled={!canExport}
        title={canExport ? "Exportar a .ics" : "Sin periodo disponible"}
      >
        <ArrowDownTrayIcon className="size-4" aria-hidden />
        Exportar (.ics)
      </Button>
    </div>
  );
}

function WeekGrid({
  days,
  classesByDay,
  role,
}: {
  days: DayMeta[];
  classesByDay: Map<DayId, ScheduleClassDTO[]>;
  role: Role;
}) {
  // why: cuando filtramos un único día queremos enfoque (una sola columna,
  // ancho cómodo); con varios días reactivamos el grid responsivo.
  const isSingleDay = days.length === 1;

  return (
    <ol
      aria-label="Horario semanal"
      className={
        "grid gap-4 " +
        (isSingleDay ? "max-w-md grid-cols-1" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-6")
      }
    >
      {days.map((day) => {
        const classes = classesByDay.get(day.id) ?? [];
        return (
          <li key={day.id} data-testid={`schedule-day-${day.id}`}>
            <h3 className="mb-3 border-b border-border pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {day.name}
            </h3>
            <div className="space-y-3">
              {classes.length > 0 ? (
                classes.map((c) => <ClassCard key={c.id} c={c} role={role} />)
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-neutral/50 p-3">
                  <p className="text-center text-xs italic text-muted-foreground">Libre</p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ClassCard({ c, role }: { c: ScheduleClassDTO; role: Role }) {
  const color = colorForSubject(c.subject.id);
  // why: estilos inline para garantizar render de color aún si Tailwind
  // purga clases dinámicas. Mantenemos tokens de proyecto en el resto.
  const style: CSSProperties = {
    backgroundColor: `hsl(${color.h} ${color.s}% ${color.l}% / 0.10)`,
    borderColor: `hsl(${color.h} ${color.s}% ${color.l}% / 0.35)`,
    color: `hsl(${color.h} ${color.s}% ${color.l}%)`,
  };

  return (
    <article
      data-testid="schedule-class"
      data-subject-id={c.subject.id}
      style={style}
      className="rounded-lg border p-3 shadow-sm transition-colors"
      aria-label={`${c.subject.nombre}, ${c.startTime} a ${c.endTime}, aula ${c.classroom}`}
    >
      <p className="text-sm font-semibold leading-tight">{c.subject.nombre}</p>
      <p className="mt-1 text-xs opacity-80">
        <time dateTime={c.startTime}>{c.startTime}</time>
        {" — "}
        <time dateTime={c.endTime}>{c.endTime}</time>
      </p>
      <p className="mt-1 text-xs opacity-80">Aula {c.classroom}</p>
      <p className="mt-2 truncate text-[10px] opacity-70">Grupo: {c.groupName}</p>
      {role === "ALUMNO" && c.teacher && (
        <p className="mt-1 truncate border-t border-current/20 pt-1 text-[10px] opacity-70">
          Prof. {c.teacher.nombre} {c.teacher.apellidos}
        </p>
      )}
    </article>
  );
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}
