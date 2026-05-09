"use client";
// Paso 2: seleccionar evaluación

import type { GrupoDTO, AssignmentDTO } from "@/lib/dal/registrarCalificaciones";

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

interface Props {
  grupo: GrupoDTO;
  asignaciones: AssignmentDTO[];
  onSelect: (a: AssignmentDTO) => void;
  onBack: () => void;
}

export function AsignacionSelector({ grupo, asignaciones, onSelect, onBack }: Props) {
  return (
    <div className="selector-section">
      <button className="btn-back" onClick={onBack}>← Volver</button>
      <h2 className="selector-section__title">
        {grupo.subjectNombre} — Selecciona evaluación
      </h2>

      {asignaciones.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📝</span>
          <p className="empty-state__mensaje">No hay evaluaciones publicadas en este grupo.</p>
        </div>
      ) : (
        <div className="asignaciones-list">
          {asignaciones.map((a) => (
            <button
              key={a.assignmentId}
              className="asignacion-card"
              onClick={() => onSelect(a)}
            >
              <span className={`badge ${TIPO_CLASS[a.tipo]}`}>
                {TIPO_LABELS[a.tipo] ?? a.tipo}
              </span>
              <span className="asignacion-card__titulo">{a.titulo}</span>
              <span className="asignacion-card__fecha">
                Fecha límite: {new Date(a.fechaLimite).toLocaleDateString("es-MX")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}