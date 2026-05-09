"use client";

/*
 selector de periodos flujo alternativo (Ver periodos anteriores).
 al cambiar hace router.push con ?periodo=id 
 */

import type { PeriodSummaryDTO } from "@/lib/dal/grades";

interface Props {
  periodos: PeriodSummaryDTO[];
  periodoSeleccionado?: string;
  onChange: (id: string) => void;
  isPending: boolean;
}

export function PeriodSelector({ periodos, periodoSeleccionado, onChange, isPending }: Props) {
  if (periodos.length === 0) return null;

  return (
    <div className="period-selector">
      <label className="period-selector__label" htmlFor="periodo-select">
        Periodo
      </label>
      <select
        id="periodo-select"
        className="period-selector__select"
        value={periodoSeleccionado ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
      >
        {periodos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.isActive ? "(Actual)" : ""}
          </option>
        ))}
      </select>
      {isPending && <span className="period-selector__loading">Cargando…</span>}
    </div>
  );
}
