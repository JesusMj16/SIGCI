"use client";

/**
 * Paso 4 CU-05 — resultado del registro + ErrorState compartido.
 */

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { RegistrarCalificacionesResult } from "@/lib/dal/registrarCalificaciones";

interface ResultadoProps {
  resultado: RegistrarCalificacionesResult;
  warnings: string[];
  onReiniciar: () => void;
}

export function ResultadoRegistro({
  resultado,
  warnings,
  onReiniciar,
}: ResultadoProps) {
  const total = resultado.gradesCreadas + resultado.gradesActualizadas;
  const exito = total > 0;

  return (
    <section
      data-testid="resultado-card"
      data-exito={exito || undefined}
      aria-label="Resultado del registro"
      className="rounded-2xl bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              exito ? "bg-primary/10" : "bg-amber-500/10"
            }`}
          >
            {exito ? (
              <CheckCircleIcon
                aria-hidden
                className="h-7 w-7 text-primary"
              />
            ) : (
              <ExclamationTriangleIcon
                aria-hidden
                className="h-7 w-7 text-amber-600"
              />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-primary">
              {exito ? "Calificaciones registradas" : "Sin cambios"}
            </h2>
            <p className="mt-1 text-sm text-neutral-foreground/80">
              {exito
                ? "Las calificaciones se guardaron correctamente y se notificó a los alumnos."
                : "No se aplicaron cambios en este lote."}
            </p>
          </div>
        </div>

        <dl
          data-testid="resultado-stats"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Stat
            value={resultado.gradesCreadas}
            label="Nuevas"
            tone="success"
            testid="stat-creadas"
          />
          <Stat
            value={resultado.gradesActualizadas}
            label="Actualizadas"
            tone="info"
            testid="stat-actualizadas"
          />
          <Stat
            value={resultado.notificacionesEnviadas}
            label="Notificados"
            tone="violet"
            testid="stat-notif"
          />
          <Stat
            value={resultado.auditoriaRegistrada ? "✓" : "✗"}
            label="Auditoría"
            tone="warning"
            testid="stat-audit"
          />
        </dl>

        {warnings.length > 0 && (
          <div
            data-testid="warnings"
            role="alert"
            className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-4"
          >
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Advertencias
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-800 dark:text-amber-200">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <button
            type="button"
            data-testid="btn-reiniciar"
            onClick={onReiniciar}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Registrar más calificaciones
          </button>
        </div>
      </div>
    </section>
  );
}

type StatTone = "primary" | "success" | "info" | "violet" | "warning" | "rose";

interface StatProps {
  value: number | string;
  label: string;
  tone?: StatTone;
  testid?: string;
}

const STAT_TONE_CLASSES: Record<StatTone, { bg: string; ring: string; value: string; label: string }> = {
  primary: {
    bg: "bg-gradient-to-br from-primary/10 to-primary/5",
    ring: "ring-primary/10",
    value: "text-primary",
    label: "text-primary/70",
  },
  success: {
    bg: "bg-gradient-to-br from-success/10 to-success/5",
    ring: "ring-success/15",
    value: "text-success",
    label: "text-success/70",
  },
  info: {
    bg: "bg-gradient-to-br from-info/10 to-info/5",
    ring: "ring-info/15",
    value: "text-info",
    label: "text-info/70",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet/10 to-violet/5",
    ring: "ring-violet/15",
    value: "text-violet",
    label: "text-violet/70",
  },
  warning: {
    bg: "bg-gradient-to-br from-warning/10 to-warning/5",
    ring: "ring-warning/15",
    value: "text-warning",
    label: "text-warning/70",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose/10 to-rose/5",
    ring: "ring-rose/15",
    value: "text-rose",
    label: "text-rose/70",
  },
};

function Stat({ value, label, tone = "primary", testid }: StatProps) {
  const t = STAT_TONE_CLASSES[tone];
  return (
    <div
      data-testid={testid}
      className={`flex flex-col gap-0.5 rounded-xl px-4 py-3 ring-1 ${t.bg} ${t.ring}`}
    >
      <span className={`text-2xl font-semibold tabular-nums ${t.value}`}>
        {value}
      </span>
      <span className={`text-[10px] uppercase tracking-wider ${t.label}`}>
        {label}
      </span>
    </div>
  );
}

interface ErrorProps {
  mensaje: string;
  onRetry?: () => void;
}

export function ErrorState({ mensaje, onRetry }: ErrorProps) {
  return (
    <div
      data-testid="error-state"
      role="alert"
      className="flex items-center gap-4 rounded-2xl bg-card p-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/5">
        <ExclamationTriangleIcon
          aria-hidden
          className="h-5 w-5 text-destructive"
        />
      </div>
      <p className="flex-1 text-sm font-medium text-primary">{mensaje}</p>
      {onRetry && (
        <button
          type="button"
          data-testid="error-retry"
          onClick={onRetry}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
