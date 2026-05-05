"use client";

/**
 * SubjectCard.tsx
 * Muestra el promedio y detalle de calificaciones de una materia.
 * Presenta la tabla con assignmentTipo, titulo, valor, retroalimentacion.
 */

import { useState } from "react";
import type { SubjectGradesDTO } from "@/lib/dal/grades";

interface Props {
  materia: SubjectGradesDTO;
}

const TIPO_LABELS: Record<string, string> = {
  tarea: "Tarea",
  examen: "Examen",
  proyecto: "Proyecto",
};

const TIPO_CLASS: Record<string, string> = {
  tarea: "badge--tarea",
  examen: "badge--examen",
  proyecto: "badge--proyecto",
};

function promedioColor(val: number | null): string {
  if (val === null) return "promedio--null";
  if (val >= 9) return "promedio--excelente";
  if (val >= 7) return "promedio--bien";
  if (val >= 6) return "promedio--suficiente";
  return "promedio--reprobado";
}

export function SubjectCard({ materia }: Props) {
  const [expandida, setExpandida] = useState(false);

  return (
    <article className="subject-card">
      {/* Encabezado */}
      <div className="subject-card__header">
        <div className="subject-card__meta">
          <span className="subject-card__codigo">{materia.subjectCodigo}</span>
          <h2 className="subject-card__nombre">{materia.subjectNombre}</h2>
        </div>
        <div className={`subject-card__promedio ${promedioColor(materia.promedio)}`}>
          {materia.promedio !== null ? (
            <>
              <span className="promedio__valor">{materia.promedio.toFixed(1)}</span>
              <span className="promedio__label">promedio</span>
            </>
          ) : (
            <span className="promedio__null">—</span>
          )}
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="subject-card__summary">
        <span>{materia.grades.length} evaluacion{materia.grades.length !== 1 ? "es" : ""}</span>
        <button
          className="subject-card__toggle"
          onClick={() => setExpandida((v) => !v)}
          aria-expanded={expandida}
        >
          {expandida ? "Ocultar detalle ▲" : "Ver detalle ▼"}
        </button>
      </div>

      {/* Tabla de calificaciones — expandible */}
      {expandida && (
        <div className="subject-card__table-wrap">
          {materia.grades.length === 0 ? (
            <p className="subject-card__empty">Sin evaluaciones registradas aún.</p>
          ) : (
            <table className="grades-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Evaluación</th>
                  <th>Calificación</th>
                  <th>Retroalimentación</th>
                </tr>
              </thead>
              <tbody>
                {materia.grades.map((g) => (
                  <tr key={g.gradeId}>
                    <td>
                      <span className={`badge ${TIPO_CLASS[g.assignmentTipo]}`}>
                        {TIPO_LABELS[g.assignmentTipo] ?? g.assignmentTipo}
                      </span>
                    </td>
                    <td className="grades-table__titulo">{g.assignmentTitulo}</td>
                    <td>
                      <span className={`grade-val ${promedioColor(g.valor)}`}>
                        {g.valor.toFixed(1)}
                      </span>
                    </td>
                    <td className="grades-table__retro">
                      {g.retroalimentacion ?? (
                        <span className="text-muted">Sin retroalimentación</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </article>
  );
}
