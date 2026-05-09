"use client";
//Paso 1: lista de grupos del profesor

import type { GrupoDTO } from "@/lib/dal/registrarCalificaciones";

interface Props {
  grupos: GrupoDTO[];
  onSelect: (grupo: GrupoDTO) => void;
}

export function GrupoSelector({ grupos, onSelect }: Props) {
  if (grupos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">📋</span>
        <p className="empty-state__mensaje">No tienes grupos asignados en el periodo actual.</p>
      </div>
    );
  }

  return (
    <div className="selector-section">
      <h2 className="selector-section__title">Selecciona un grupo</h2>
      <div className="grupos-grid">
        {grupos.map((g) => (
          <button
            key={g.groupId}
            className="grupo-card"
            onClick={() => onSelect(g)}
          >
            <span className="grupo-card__codigo">{g.subjectCodigo}</span>
            <span className="grupo-card__nombre">{g.subjectNombre}</span>
            <span className="grupo-card__periodo">{g.periodNombre}</span>
            <span className="grupo-card__alumnos">{g.alumnosCount} alumnos</span>
          </button>
        ))}
      </div>
    </div>
  );
}