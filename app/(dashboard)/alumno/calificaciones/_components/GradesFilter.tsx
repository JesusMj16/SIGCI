"use client";

/*
 Filtro por materia flujo alternativo 
Usa React useState en el padre; NO hace recarga de página.
 */

interface GradesFilterProps {
  materias: string[];
  selected: string;
  onChange: (val: string) => void;
}

export function GradesFilter({ materias, selected, onChange }: GradesFilterProps) {
  if (materias.length <= 1) return null; // sin sentido filtrar con 0/1 materia

  return (
    <div className="grades-filter">
      <label className="grades-filter__label" htmlFor="materia-filter">
        Filtrar materia
      </label>
      <select
        id="materia-filter"
        className="grades-filter__select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
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
