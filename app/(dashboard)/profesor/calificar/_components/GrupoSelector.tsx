"use client";

/**
 * Paso 1 CU-05: lista de grupos asignados al profesor.
 */

import { AcademicCapIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { GrupoDTO } from "@/lib/dal/registrarCalificaciones";

interface Props {
  grupos: GrupoDTO[];
  onSelect: (grupo: GrupoDTO) => void;
}

/**
 * Rotación cromática por índice — diversifica visualmente las cards.
 */
const TONES = [
  {
    bg: "bg-gradient-to-br from-primary/8 to-card",
    border: "border-primary/15 hover:border-primary/40",
    code: "text-primary/70",
    name: "text-primary",
    icon: "text-primary",
    shadow: "hover:shadow-primary/10",
  },
  {
    bg: "bg-gradient-to-br from-violet/8 to-card",
    border: "border-violet/15 hover:border-violet/40",
    code: "text-violet/80",
    name: "text-violet",
    icon: "text-violet",
    shadow: "hover:shadow-violet/10",
  },
  {
    bg: "bg-gradient-to-br from-success/8 to-card",
    border: "border-success/15 hover:border-success/40",
    code: "text-success/80",
    name: "text-success",
    icon: "text-success",
    shadow: "hover:shadow-success/10",
  },
  {
    bg: "bg-gradient-to-br from-secondary/8 to-card",
    border: "border-secondary/15 hover:border-secondary/40",
    code: "text-secondary/80",
    name: "text-secondary",
    icon: "text-secondary",
    shadow: "hover:shadow-secondary/10",
  },
] as const;

export function GrupoSelector({ grupos, onSelect }: Props) {
  if (grupos.length === 0) {
    return (
      <div
        data-testid="empty-grupos"
        role="status"
        className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-12 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <AcademicCapIcon aria-hidden className="h-7 w-7 text-primary" />
        </div>
        <p className="max-w-md text-base font-medium text-foreground">
          No tienes grupos asignados en el periodo actual.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Selecciona un grupo"
      className="flex flex-col gap-4 rounded-2xl bg-card p-5 sm:p-6"
    >
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
        Selecciona un grupo
      </h2>

      <ul
        data-testid="grupos-grid"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {grupos.map((g, idx) => {
          const t = TONES[idx % TONES.length];
          return (
            <li key={g.groupId}>
              <button
                type="button"
                data-testid="grupo-card"
                data-codigo={g.subjectCodigo}
                onClick={() => onSelect(g)}
                className={`group flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${t.bg} ${t.border} ${t.shadow}`}
              >
                <span
                  className={`text-[11px] font-medium uppercase tracking-[0.2em] ${t.code}`}
                >
                  {g.subjectCodigo}
                </span>
                <span className={`text-base font-semibold ${t.name}`}>
                  {g.subjectNombre}
                </span>
                <span className="text-xs text-neutral-foreground/70">
                  {g.periodNombre}
                </span>
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 text-sm ${t.icon}`}
                >
                  <UsersIcon aria-hidden className="h-4 w-4" />
                  {g.alumnosCount} alumno{g.alumnosCount !== 1 ? "s" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
