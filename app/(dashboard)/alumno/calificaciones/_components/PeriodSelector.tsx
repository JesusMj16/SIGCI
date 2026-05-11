"use client";

/**
 * Selector de periodo (flujo alternativo "Ver periodos anteriores").
 * router.push controlado por el padre (useTransition para streaming UI).
 */

import type { PeriodSummaryDTO } from "@/lib/dal/grades";

interface Props {
  periodos: PeriodSummaryDTO[];
  periodoSeleccionado?: string;
  onChange: (id: string) => void;
  isPending: boolean;
}

export function PeriodSelector({
  periodos,
  periodoSeleccionado,
  onChange,
  isPending,
}: Props) {
  if (periodos.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="periodo-select"
        className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        Periodo
      </label>
      <div className="flex items-center gap-2">
        <select
          id="periodo-select"
          data-testid="periodo-select"
          value={periodoSeleccionado ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={isPending}
          className="h-10 min-w-[220px] rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.isActive ? "(Actual)" : ""}
            </option>
          ))}
        </select>
        {isPending && (
          <span
            data-testid="periodo-loading"
            className="text-xs text-muted-foreground"
            aria-live="polite"
          >
            Cargando…
          </span>
        )}
      </div>
    </div>
  );
}
