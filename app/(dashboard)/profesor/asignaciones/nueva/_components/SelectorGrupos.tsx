"use client";

/**
 * Paso 1 CU-09: multi-select de grupos asignados al profesor.
 * Soporta el flujo alternativo "publicar para múltiples grupos".
 */

import { AcademicCapIcon, UsersIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { GrupoOpcionDTO } from "@/lib/actions/asignaciones.actions";

interface Props {
  grupos: GrupoOpcionDTO[];
  seleccionados: string[];
  onToggle: (id: string) => void;
  onContinuar: () => void;
}

const TONES = [
  {
    bg: "bg-gradient-to-br from-primary/8 to-card",
    border: "border-primary/15 hover:border-primary/40",
    selected: "border-primary ring-2 ring-primary/40",
    code: "text-primary/70",
    name: "text-primary",
    icon: "text-primary",
  },
  {
    bg: "bg-gradient-to-br from-violet/8 to-card",
    border: "border-violet/15 hover:border-violet/40",
    selected: "border-violet ring-2 ring-violet/40",
    code: "text-violet/80",
    name: "text-violet",
    icon: "text-violet",
  },
  {
    bg: "bg-gradient-to-br from-success/8 to-card",
    border: "border-success/15 hover:border-success/40",
    selected: "border-success ring-2 ring-success/40",
    code: "text-success/80",
    name: "text-success",
    icon: "text-success",
  },
  {
    bg: "bg-gradient-to-br from-secondary/8 to-card",
    border: "border-secondary/15 hover:border-secondary/40",
    selected: "border-secondary ring-2 ring-secondary/40",
    code: "text-secondary/80",
    name: "text-secondary",
    icon: "text-secondary",
  },
] as const;

export function SelectorGrupos({
  grupos,
  seleccionados,
  onToggle,
  onContinuar,
}: Props) {
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

  const hayAlguno = seleccionados.length > 0;

  return (
    <section
      aria-label="Selecciona uno o más grupos"
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          1 · Selecciona uno o más grupos
        </h2>
        <p className="text-sm text-muted-foreground">
          Puedes publicar la misma asignación para varios grupos a la vez.
        </p>
      </header>

      <ul
        data-testid="grupos-grid"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {grupos.map((g, idx) => {
          const selected = seleccionados.includes(g.id);
          const t = TONES[idx % TONES.length];
          return (
            <li key={g.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={selected}
                data-testid="grupo-card"
                data-codigo={g.subjectCodigo}
                data-selected={selected ? "true" : "false"}
                onClick={() => onToggle(g.id)}
                className={`group relative flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${t.bg} ${
                  selected ? t.selected : t.border
                }`}
              >
                {selected && (
                  <span
                    aria-hidden
                    className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full ${t.icon} bg-background/80`}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </span>
                )}
                <span
                  className={`text-[11px] font-medium uppercase tracking-[0.2em] ${t.code}`}
                >
                  {g.subjectCodigo}
                </span>
                <span className={`text-base font-semibold ${t.name}`}>
                  {g.subjectNombre}
                </span>
                <span className="text-xs text-neutral-foreground/70">
                  {g.nombre}
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

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground" data-testid="contador-grupos">
          {seleccionados.length} grupo{seleccionados.length !== 1 ? "s" : ""}{" "}
          seleccionado{seleccionados.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          data-testid="btn-continuar-formulario"
          disabled={!hayAlguno}
          onClick={onContinuar}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
        </button>
      </footer>
    </section>
  );
}
