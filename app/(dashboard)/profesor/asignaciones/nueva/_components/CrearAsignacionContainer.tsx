"use client";

/**
 * Container CU-09 — orquesta render por paso.
 * State machine extraída a useCrearAsignacionFlow (SRP).
 * Patrón espejo de RegistrarCalificacionesContainer (CU-05).
 */

import { useEffect, useMemo, useState } from "react";
import type {
  ActionResult,
  GrupoOpcionDTO,
} from "@/lib/actions/asignaciones.actions";
import { SelectorGrupos } from "./SelectorGrupos";
import { FormularioAsignacion } from "./FormularioAsignacion";
import { ConfirmacionPublicacion } from "./ConfirmacionPublicacion";
import {
  PASOS,
  useCrearAsignacionFlow,
  type Paso,
} from "./useCrearAsignacionFlow";

const PASO_LABELS: Record<Paso, string> = {
  grupos: "Grupos",
  formulario: "Detalles",
  confirmacion: "Revisar",
  resultado: "Resultado",
};

const PASO_TONES: Record<Paso, { active: string; done: string }> = {
  grupos: {
    active: "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
    done: "bg-primary/15 text-primary",
  },
  formulario: {
    active: "bg-violet text-violet-foreground shadow-sm shadow-violet/30",
    done: "bg-violet/15 text-violet",
  },
  confirmacion: {
    active: "bg-warning text-warning-foreground shadow-sm shadow-warning/30",
    done: "bg-warning/15 text-warning",
  },
  resultado: {
    active: "bg-success text-success-foreground shadow-sm shadow-success/30",
    done: "bg-success/15 text-success",
  },
};

interface Props {
  gruposResult: ActionResult<GrupoOpcionDTO[]>;
}

export function CrearAsignacionContainer({ gruposResult }: Props) {
  const flow = useCrearAsignacionFlow();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Hooks antes de cualquier early return (Rules of Hooks).
  const grupos = gruposResult.ok ? gruposResult.data : [];
  const seleccionados = useMemo(
    () => grupos.filter((g) => flow.grupoIds.includes(g.id)),
    [grupos, flow.grupoIds]
  );

  if (!gruposResult.ok) {
    return (
      <Layout>
        <ErrorBanner mensaje={gruposResult.message} />
      </Layout>
    );
  }

  const pasoIdx = PASOS.indexOf(flow.paso);

  return (
    <Layout hydrated={hydrated}>
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/8 via-card to-violet/8 px-6 py-8 sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-warning/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 size-56 rounded-full bg-success/10 blur-3xl"
        />
        <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Académico · Profesor
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Crear asignación
        </h1>
        <p className="relative mt-2 max-w-2xl text-sm text-muted-foreground">
          Diseña una tarea, examen o proyecto para tus grupos. Guárdala como
          borrador o publícala para notificar a tus alumnos.
        </p>

        <ol
          aria-label="Pasos del flujo"
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

      {flow.error && (
        <ErrorBanner mensaje={flow.error} onClose={flow.clearError} />
      )}

      {flow.paso === "grupos" && (
        <SelectorGrupos
          grupos={grupos}
          seleccionados={flow.grupoIds}
          onToggle={flow.toggleGrupo}
          onContinuar={flow.continuarAFormulario}
        />
      )}

      {flow.paso === "formulario" && (
        <FormularioAsignacion
          form={flow.form}
          onChange={flow.updateForm}
          onContinuar={flow.continuarAConfirmacion}
          onBack={() => flow.volverA("grupos")}
          borradorRestaurado={flow.borradorRestaurado}
          onDescartarBorrador={flow.descartarBorrador}
        />
      )}

      {flow.paso === "confirmacion" && (
        <ConfirmacionPublicacion
          form={flow.form}
          gruposSeleccionados={seleccionados}
          isPending={flow.isPending}
          onGuardarBorrador={() => flow.submit("BORRADOR")}
          onPublicar={() => flow.submit("PUBLICAR")}
          onBack={() => flow.volverA("formulario")}
        />
      )}

      {flow.paso === "resultado" && flow.resultado && (
        <ResultadoExito
          asignaciones={flow.resultado.asignacionesCreadas.length}
          submissions={flow.resultado.submissionsCreadas}
          notificaciones={flow.resultado.notificacionesEnviadas}
          onReiniciar={flow.reset}
        />
      )}
    </Layout>
  );
}

function ResultadoExito({
  asignaciones,
  submissions,
  notificaciones,
  onReiniciar,
}: {
  asignaciones: number;
  submissions: number;
  notificaciones: number;
  onReiniciar: () => void;
}) {
  const publicado = submissions > 0;
  return (
    <section
      data-testid="paso-resultado"
      role="status"
      className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
        ✓
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        {publicado ? "Asignación publicada" : "Borrador guardado"}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Se {asignaciones === 1 ? "creó" : "crearon"}{" "}
        <strong>{asignaciones}</strong> asignaci
        {asignaciones === 1 ? "ón" : "ones"}
        {publicado && (
          <>
            {" "}
            con <strong>{submissions}</strong> entrega
            {submissions !== 1 ? "s" : ""} pendiente
            {submissions !== 1 ? "s" : ""} y se notificó a{" "}
            <strong>{notificaciones}</strong> alumno
            {notificaciones !== 1 ? "s" : ""}
          </>
        )}
        .
      </p>
      <button
        type="button"
        data-testid="btn-crear-otra"
        onClick={onReiniciar}
        className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Crear otra asignación
      </button>
    </section>
  );
}

function ErrorBanner({
  mensaje,
  onClose,
}: {
  mensaje: string;
  onClose?: () => void;
}) {
  return (
    <div
      data-testid="error-banner"
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <span>{mensaje}</span>
      {onClose && (
        <button
          type="button"
          data-testid="btn-cerrar-error"
          onClick={onClose}
          className="rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium hover:bg-destructive/10"
        >
          Cerrar
        </button>
      )}
    </div>
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
      data-testid="cu09-root"
      data-hydrated={hydrated ? "true" : "false"}
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
    >
      {children}
    </main>
  );
}
