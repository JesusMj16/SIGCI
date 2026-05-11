"use client";

/**
 * Tarjeta de materia con promedio y desplegable de evaluaciones.
 * UI tokenizada (bg-card, primary/secondary). Sin custom CSS.
 */

import { useState } from "react";
import type { SubjectGradesDTO } from "@/lib/dal/grades";
import {
  promedioToneClass,
  tipoBadgeClass,
  tipoLabel,
} from "@/lib/assignment-types";

interface Props {
  materia: SubjectGradesDTO;
}

export function SubjectCard({ materia }: Props) {
  const [expandida, setExpandida] = useState(false);
  const evaluaciones = materia.grades.length;

  return (
    <article
      data-testid="subject-card"
      data-subject-codigo={materia.subjectCodigo}
      className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/70">
            {materia.subjectCodigo}
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-primary">
            {materia.subjectNombre}
          </h2>
        </div>

        <div
          data-testid="subject-promedio"
          className="flex flex-col items-end leading-none"
        >
          {materia.promedio !== null ? (
            <>
              <span
                className={`text-3xl font-semibold tracking-tight ${promedioToneClass(
                  materia.promedio
                )}`}
              >
                {materia.promedio.toFixed(1)}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Promedio
              </span>
            </>
          ) : (
            <span className="text-3xl font-light text-muted-foreground">—</span>
          )}
        </div>
      </header>

      <footer className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {evaluaciones} evaluación{evaluaciones !== 1 ? "es" : ""}
        </span>
        <button
          type="button"
          data-testid="subject-toggle"
          onClick={() => setExpandida((v) => !v)}
          aria-expanded={expandida}
          className="rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {expandida ? "Ocultar detalle ▲" : "Ver detalle ▼"}
        </button>
      </footer>

      {expandida && (
        <div data-testid="subject-detail" className="-mx-5 -mb-5">
          {evaluaciones === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Sin evaluaciones registradas aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-primary/10 bg-primary/5 text-xs uppercase tracking-wider text-primary/70">
                    <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2.5 text-left font-medium">
                      Evaluación
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      Calificación
                    </th>
                    <th className="px-5 py-2.5 text-left font-medium">
                      Retroalimentación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materia.grades.map((g) => (
                    <tr
                      key={g.gradeId}
                      className="border-b border-primary/10 last:border-b-0 hover:bg-primary/5"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadgeClass(
                            g.assignmentTipo
                          )}`}
                        >
                          {tipoLabel(g.assignmentTipo)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-neutral-foreground">
                        {g.assignmentTitulo}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold tabular-nums ${promedioToneClass(
                          g.valor
                        )}`}
                      >
                        {g.valor.toFixed(1)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {g.retroalimentacion ?? (
                          <span className="italic">Sin retroalimentación</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
