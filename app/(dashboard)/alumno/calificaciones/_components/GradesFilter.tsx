"use client";

/**
 * Filtro por materia (flujo alternativo CU-04).
 * State controlled por padre, sin recarga de página.
 */

interface GradesFilterProps {
  materias: string[];
  selected: string;
  onChange: (val: string) => void;
}

export function GradesFilter({ materias, selected, onChange }: GradesFilterProps) {
  if (materias.length <= 1) return null;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="materia-filter"
        className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        Filtrar materia
      </label>
      <select
        id="materia-filter"
        data-testid="materia-filter"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-[180px] rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <option value="todas">Todas las materias</option>
        {materias.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
