"use client";

import { useMemo, useState } from "react";
import type { TareaPendienteDTO } from "@/lib/dal/tareas/alumno";
import {
  filtrarPorMateria,
  ordenarTareas,
  type CriterioOrden,
} from "@/lib/dal/tareas/helpers";
import { TareaCard } from "./TareaCard";

type Props = { tareas: TareaPendienteDTO[] };

export function TareasPendientesList({ tareas }: Props) {
  const [materiaId, setMateriaId] = useState<string | null>(null);
  const [criterio, setCriterio] = useState<CriterioOrden>("fecha");

  const materias = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; codigo: string }>();
    for (const t of tareas) map.set(t.materia.id, t.materia);
    return [...map.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
  }, [tareas]);

  const visibles = useMemo(
    () => ordenarTareas(filtrarPorMateria(tareas, materiaId), criterio),
    [tareas, materiaId, criterio]
  );

  if (tareas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-foreground/20 bg-card/40 p-12 text-center">
        <h2 className="font-heading text-xl font-semibold text-primary">
          No tienes tareas pendientes en este momento.
        </h2>
        <p className="text-sm text-neutral-foreground/70">¡Estás al día!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Filtro
          label="Filtrar por materia"
          value={materiaId ?? ""}
          onChange={(v) => setMateriaId(v === "" ? null : v)}
          options={[
            { value: "", label: "Todas" },
            ...materias.map((m) => ({
              value: m.id,
              label: `${m.codigo} · ${m.nombre}`,
            })),
          ]}
        />
        <Filtro
          label="Ordenar por"
          value={criterio}
          onChange={(v) => setCriterio(v as CriterioOrden)}
          options={[
            { value: "fecha", label: "Fecha de entrega" },
            { value: "materia", label: "Materia" },
            { value: "estado", label: "Estado" },
            { value: "tipo", label: "Tipo" },
          ]}
        />
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-foreground/20 bg-card/40 p-8 text-center text-sm text-neutral-foreground/70">
          No hay tareas que coincidan con el filtro.
        </p>
      ) : (
        <ul className="grid gap-3">
          {visibles.map((t) => (
            <li key={t.submissionId}>
              <TareaCard tarea={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtro({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-foreground/60">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-foreground/15 bg-card px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
