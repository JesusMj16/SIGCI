"use client";

import type { RegistrarCalificacionesResult } from "@/lib/dal/registrarCalificaciones";

//  ResultadoRegistro 

interface ResultadoProps {
  resultado: RegistrarCalificacionesResult;
  warnings: string[];
  onReiniciar: () => void;
}

export function ResultadoRegistro({ resultado, warnings, onReiniciar }: ResultadoProps) {
  const total = resultado.gradesCreadas + resultado.gradesActualizadas;
  const exito = total > 0;

  return (
    <div className="resultado-section">
      <div className={`resultado-card ${exito ? "resultado-card--ok" : "resultado-card--warn"}`}>
        <span className="resultado-card__icon">{exito ? "✅" : "⚠️"}</span>
        <h2 className="resultado-card__title">
          {exito ? "Calificaciones registradas" : "Sin cambios"}
        </h2>

        <div className="resultado-stats">
          <div className="rstat">
            <span className="rstat__val">{resultado.gradesCreadas}</span>
            <span className="rstat__label">Nuevas</span>
          </div>
          <div className="rstat">
            <span className="rstat__val">{resultado.gradesActualizadas}</span>
            <span className="rstat__label">Actualizadas</span>
          </div>
          <div className="rstat">
            <span className="rstat__val">{resultado.notificacionesEnviadas}</span>
            <span className="rstat__label">Notificados</span>
          </div>
          <div className="rstat">
            <span className="rstat__val">{resultado.auditoriaRegistrada ? "✓" : "✗"}</span>
            <span className="rstat__label">Auditoría</span>
          </div>
        </div>

        {/* Warnings — fallo de notificación no bloquea (Prueba 8) */}
        {warnings.length > 0 && (
          <div className="resultado-warnings">
            <p className="resultado-warnings__title">⚠️ Advertencias:</p>
            {warnings.map((w, i) => (
              <p key={i} className="resultado-warnings__item">{w}</p>
            ))}
          </div>
        )}

        <button className="btn-primary" onClick={onReiniciar}>
          Registrar más calificaciones
        </button>
      </div>
    </div>
  );
}

//  ErrorState 

interface ErrorProps {
  mensaje: string;
  onRetry?: () => void;
}

export function ErrorState({ mensaje, onRetry }: ErrorProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon">⚠️</span>
      <p className="error-state__mensaje">{mensaje}</p>
      {onRetry && (
        <button className="btn-primary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}