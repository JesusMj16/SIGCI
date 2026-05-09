"use client";

/**
 * TablaCaptura.tsx
 * CU-05 — Captura de calificaciones con:
 * - Navegación por tabulador (req. especial)
 * - Validación rango 0-10 en tiempo real
 * - Registro parcial (dejar vacío = no calificar)
 * - Modificación de grade existente
 * - Retroalimentación por alumno
 */

import { useState, useRef } from "react";
import type { GrupoDTO, AlumnoEnGrupoDTO, AssignmentDTO } from "@/lib/dal/registrarCalificaciones";

interface Props {
  grupo: GrupoDTO;
  asignacion: AssignmentDTO;
  alumnos: AlumnoEnGrupoDTO[];
  onConfirmar: (calificaciones: { studentId: string; valor: number | null; retroalimentacion: string | null }[]) => void;
  onBack: () => void;
  isPending: boolean;
}

interface FilaCalificacion {
  studentId: string;
  valor: string;
  retroalimentacion: string;
  error: string | null;
}

export function TablaCaptura({ grupo, asignacion, alumnos, onConfirmar, onBack, isPending }: Props) {
  const [filas, setFilas] = useState<FilaCalificacion[]>(
    alumnos.map((a) => ({
      studentId: a.studentId,
      valor: a.gradeActual ? String(a.gradeActual.valor) : "",
      retroalimentacion: "",
      error: null,
    }))
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validarValor = (val: string): string | null => {
    if (val === "") return null;
    const num = Number(val);
    if (isNaN(num)) return "Debe ser un número";
    if (num < 0 || num > 10) return "Fuera de rango (0-10)";
    return null;
  };

  const handleValorChange = (index: number, valor: string) => {
    const error = validarValor(valor);
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, valor, error } : f))
    );
  };

  const handleRetroChange = (index: number, retroalimentacion: string) => {
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, retroalimentacion } : f))
    );
  };

  // Navegación por tabulador — req. especial CU-05
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const next = inputRefs.current[index + 1];
      if (next) next.focus();
    }
  };

  const tieneErrores = filas.some((f) => f.error !== null);
  const calificadasCount = filas.filter((f) => f.valor !== "").length;

  const handleConfirmar = () => {
    if (tieneErrores) return;
    const calificaciones = filas.map((f) => ({
      studentId: f.studentId,
      valor: f.valor === "" ? null : Number(f.valor),
      retroalimentacion: f.retroalimentacion.trim() === "" ? null : f.retroalimentacion.trim(),
    }));
    onConfirmar(calificaciones);
  };

  return (
    <div className="captura-section">
      <button className="btn-back" onClick={onBack}>← Volver</button>

      <div className="captura-header">
        <div>
          <h2 className="captura-header__title">{grupo.subjectNombre}</h2>
          <p className="captura-header__sub">
            Evaluación: <strong>{asignacion.titulo}</strong> ·
            <span className={`badge badge--${asignacion.tipo}`}>{asignacion.tipo}</span>
          </p>
        </div>
        <div className="captura-header__stats">
          <span className="stat">
            <span className="stat__val">{calificadasCount}</span>
            <span className="stat__label">a registrar</span>
          </span>
          <span className="stat">
            <span className="stat__val">{alumnos.length - calificadasCount}</span>
            <span className="stat__label">sin calificar</span>
          </span>
        </div>
      </div>

      {/* Tabla de captura */}
      <div className="captura-table-wrap">
        <table className="captura-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Matrícula</th>
              <th>Nombre</th>
              <th>Anterior</th>
              <th>Calificación</th>
              <th>Retroalimentación</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno, index) => {
              const fila = filas[index];
              return (
                <tr key={alumno.studentId} className={fila.error ? "row--error" : ""}>
                  <td className="captura-table__num">{index + 1}</td>
                  <td className="captura-table__mat">{alumno.matricula}</td>
                  <td className="captura-table__nombre">
                    {alumno.nombre} {alumno.apellidos}
                  </td>
                  <td>
                    {alumno.gradeActual ? (
                      <span className="grade-prev">{alumno.gradeActual.valor}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="captura-table__input">
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={fila.valor}
                      onChange={(e) => handleValorChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className={`grade-input ${fila.error ? "grade-input--error" : ""}`}
                      placeholder="0-10"
                    />
                    {fila.error && (
                      <span className="input-error">{fila.error}</span>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={fila.retroalimentacion}
                      onChange={(e) => handleRetroChange(index, e.target.value)}
                      className="retro-input"
                      placeholder="Comentario opcional..."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="captura-footer">
        <p className="captura-footer__hint">
          Deja en blanco para omitir (registro parcial). Navega con Tab o Enter.
        </p>
        <div className="captura-footer__actions">
          <button className="btn-secondary" onClick={onBack}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirmar}
            disabled={tieneErrores || isPending || calificadasCount === 0}
          >
            {isPending ? "Guardando…" : `Confirmar ${calificadasCount} calificación${calificadasCount !== 1 ? "es" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}