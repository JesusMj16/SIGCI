/**
 * Estados vacíos / error (CU-04).
 * Iconos con heroicons (antes eran strings vacíos).
 */

import {
  AcademicCapIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type EmptyTipo = "sin_materias" | "sin_calificaciones" | "periodo_invalido";

interface EmptyStateProps {
  tipo: EmptyTipo;
  mensaje: string;
}

const ICON_BY_TIPO = {
  sin_materias: AcademicCapIcon,
  sin_calificaciones: DocumentMagnifyingGlassIcon,
  periodo_invalido: ClockIcon,
} as const;

export function EmptyState({ tipo, mensaje }: EmptyStateProps) {
  const Icon = ICON_BY_TIPO[tipo];
  return (
    <div
      data-testid={`empty-${tipo}`}
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
        <Icon aria-hidden className="h-7 w-7 text-primary" />
      </div>
      <p className="max-w-md text-base font-medium text-primary">{mensaje}</p>
      {tipo === "sin_materias" && (
        <p className="max-w-md text-sm text-neutral-foreground/70">
          Contacta a Servicios Escolares si crees que hay un error en tu inscripción.
        </p>
      )}
    </div>
  );
}

interface ErrorStateProps {
  mensaje: string;
  onRetry?: () => void;
}

export function ErrorState({ mensaje, onRetry }: ErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/15 bg-gradient-to-br from-destructive/5 via-card to-card px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
        <ExclamationTriangleIcon aria-hidden className="h-7 w-7 text-destructive" />
      </div>
      <p className="max-w-md text-base font-medium text-primary">{mensaje}</p>
      {onRetry && (
        <button
          type="button"
          data-testid="error-retry"
          onClick={onRetry}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
