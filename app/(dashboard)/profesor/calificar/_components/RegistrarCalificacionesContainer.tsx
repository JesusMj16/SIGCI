"use client";

/**
 * Container CU-05 — orquesta render por paso.
 * State machine extraída a useCalificarFlow (SRP).
 * UI tokenizada con paleta UTM.
 */

import { useEffect, useState } from "react";
import type { ActionResult } from "@/lib/actions/registrarCalificaciones.actions";
import type { GrupoDTO } from "@/lib/dal/registrarCalificaciones";
import { AsignacionSelector } from "./AsignacionSelector";
import { ErrorState, ResultadoRegistro } from "./ResultadoRegistro";
import { GrupoSelector } from "./GrupoSelector";
import { TablaCaptura } from "./TablaCaptura";
import { PASOS, useCalificarFlow, type Paso } from "./useCalificarFlow";

const PASO_LABELS: Record<Paso, string> = {
  grupo: "Grupo",
  asignacion: "Evaluación",
  captura: "Captura",
  resultado: "Resultado",
};

/**
 * Cada paso usa un color distinto cuando está activo — rompe la monotonía azul.
 * `done` mantiene el tono más claro del propio acento.
 */
const PASO_TONES: Record<Paso, { active: string; done: string }> = {
  grupo: {
    active: "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
    done: "bg-primary/15 text-primary",
  },
  asignacion: {
    active: "bg-violet text-violet-foreground shadow-sm shadow-violet/30",
    done: "bg-violet/15 text-violet",
  },
  captura: {
    active: "bg-warning text-warning-foreground shadow-sm shadow-warning/30",
    done: "bg-warning/15 text-warning",
  },
  resultado: {
    active: "bg-success text-success-foreground shadow-sm shadow-success/30",
    done: "bg-success/15 text-success",
  },
};

interface Props {
  gruposResult: ActionResult<GrupoDTO[]>;
}

export function RegistrarCalificacionesContainer({ gruposResult }: Props) {
  const flow = useCalificarFlow();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!gruposResult.ok) {
    return (
      <Layout>
        <ErrorState mensaje={gruposResult.message} />
      </Layout>
    );
  }

  const pasoIdx = PASOS.indexOf(flow.paso);

  return (
    <Layout hydrated={hydrated}>
      {/* Hero — gradiente success → secondary con halo amber */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-success/8 via-card to-secondary/8 px-6 py-8 sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-warning/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 size-56 rounded-full bg-violet/10 blur-3xl"
        />
        <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-success">
          Académico · Profesor
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Registrar Calificaciones
        </h1>

        <ol
          aria-label="Pasos del registro"
          className="mt-6 flex flex-wrap gap-2"
          data-testid="steps"
        >
          {PASOS.map((p, i) => {
            const active = flow.paso === p;
            const done = i < pasoIdx;
            const tone = PASO_TONES[p];
            return (
              <li
                key={p}
                data-testid={`step-${p}`}
                data-state={active ? "active" : done ? "done" : "pending"}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? tone.active
                    : done
                    ? tone.done
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/40 text-[11px] font-semibold">
                  {i + 1}
                </span>
                <span className="font-medium">{PASO_LABELS[p]}</span>
              </li>
            );
          })}
        </ol>
      </header>

      {/* Error global */}
      {flow.error && (
        <ErrorState mensaje={flow.error} onRetry={flow.clearError} />
      )}

      {/* Loading */}
      {flow.isPending && (
        <div
          data-testid="loading"
          className="rounded-2xl bg-card px-5 py-6 text-sm text-muted-foreground"
          aria-live="polite"
        >
          Cargando…
        </div>
      )}

      {/* Pasos */}
      {flow.paso === "grupo" && !flow.isPending && (
        <GrupoSelector grupos={gruposResult.data} onSelect={flow.selectGrupo} />
      )}

      {flow.paso === "asignacion" &&
        !flow.isPending &&
        flow.grupoSeleccionado && (
          <AsignacionSelector
            grupo={flow.grupoSeleccionado}
            asignaciones={flow.asignaciones}
            onSelect={flow.selectAsignacion}
            onBack={() => flow.back("grupo")}
          />
        )}

      {flow.paso === "captura" &&
        !flow.isPending &&
        flow.grupoSeleccionado &&
        flow.asignacionSeleccionada && (
          <TablaCaptura
            grupo={flow.grupoSeleccionado}
            asignacion={flow.asignacionSeleccionada}
            alumnos={flow.alumnos}
            onConfirmar={flow.confirmar}
            onBack={() => flow.back("asignacion")}
            isPending={flow.isPending}
          />
        )}

      {flow.paso === "resultado" && flow.resultado && (
        <ResultadoRegistro
          resultado={flow.resultado}
          warnings={flow.warnings}
          onReiniciar={flow.reset}
        />
      )}
    </Layout>
  );
}

function Layout({
  children,
  hydrated = true,
}: {
  children: React.ReactNode;
  hydrated?: boolean;
}) {
  return (
    <main
      data-testid="cu05-root"
      data-hydrated={hydrated ? "true" : "false"}
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
    >
      {children}
    </main>
  );
}
