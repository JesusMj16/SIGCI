/**
 estados vacíos 
  Prueba 4: sin materias inscritas
 Prueba 5: sin calificaciones registradas
 */

interface EmptyStateProps {
  tipo: "sin_materias" | "sin_calificaciones";
  mensaje: string;
}

export function EmptyState({ tipo, mensaje }: EmptyStateProps) {
  const icon = tipo === "sin_materias" ? "📋" : "📊";
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <span className="empty-state__icon">{icon}</span>
      <p className="empty-state__mensaje">{mensaje}</p>
      {tipo === "sin_materias" && (
        <p className="empty-state__hint">
          Contacta a Servicios Escolares si crees que hay un error en tu inscripción.
        </p>
      )}
    </div>
  );
}

/*
  excepción de conexión DB
  Prueba de excepción error de conexión con la base de datos
 */
interface ErrorStateProps {
  mensaje: string;
  onRetry?: () => void;
}

export function ErrorState({ mensaje, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon">⚠️</span>
      <p className="error-state__mensaje">{mensaje}</p>
      {onRetry && (
        <button className="error-state__retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
