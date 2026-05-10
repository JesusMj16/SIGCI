"use client";

/**
 * Container CU-04 — orquesta filtros, selector de periodo y render.
 * - Filtro materia: useState (sin recarga).
 * - Cambio de periodo: router.push con useTransition (streaming).
 * - Hooks declarados antes de cualquier early-return (Rules of Hooks).
 * - UI tokenizada con paleta UTM (primary / secondary / neutral / card).
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions/calificaciones.actions";
import type {
  CalificacionesResultDTO,
  PeriodSummaryDTO,
  SubjectGradesDTO,
} from "@/lib/dal/grades";
import { GradesFilter } from "./GradesFilter";
import { PeriodSelector } from "./PeriodSelector";
import { SubjectCard } from "./SubjectCard";
import { EmptyState, ErrorState } from "./EmptyState";

interface Props {
  result: ActionResult<CalificacionesResultDTO>;
  periodos: PeriodSummaryDTO[];
  periodoSeleccionado?: string;
}

export function CalificacionesContainer({
  result,
  periodos,
  periodoSeleccionado,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [materiaFilter, setMateriaFilter] = useState<string>("todas");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // ─── Hooks ANTES de early-returns (Rules of Hooks) ──────────────────────
  const data = result.ok ? result.data : null;

  const periodoActual = useMemo(() => {
    if (!data) return undefined;
    return periodoSeleccionado
      ? data.periodos.find((p) => p.periodId === periodoSeleccionado)
      : data.periodos.find((p) => p.isActive) ?? data.periodos[0];
  }, [data, periodoSeleccionado]);

  const materiasDisponibles = periodoActual?.materias.map(
    (m) => m.subjectNombre
  ) ?? [];

  const materiasFiltradas: SubjectGradesDTO[] = (() => {
    if (!periodoActual) return [];
    if (materiaFilter === "todas") return periodoActual.materias;
    return periodoActual.materias.filter(
      (m) => m.subjectNombre === materiaFilter
    );
  })();

  // ─── Early returns por estado de error ──────────────────────────────────
  if (!result.ok) {
    if (result.errorCode === "NO_MATERIAS") {
      return (
        <Layout>
          <EmptyState
            tipo="sin_materias"
            mensaje="No tienes materias inscritas en este periodo."
          />
        </Layout>
      );
    }
    if (result.errorCode === "PERIODO_NO_ENCONTRADO") {
      return (
        <Layout>
          <EmptyState
            tipo="periodo_invalido"
            mensaje="El periodo solicitado no existe."
          />
        </Layout>
      );
    }
    if (result.errorCode === "AUTH_ERROR") {
      return (
        <Layout>
          <ErrorState mensaje="No autorizado." />
        </Layout>
      );
    }
    return (
      <Layout>
        <ErrorState
          mensaje={result.message}
          onRetry={() => router.refresh()}
        />
      </Layout>
    );
  }

  const { alumnoNombre, alumnoMatricula } = result.data;
  const todasLasGrades = periodoActual?.materias.flatMap((m) => m.grades) ?? [];
  const sinCalificaciones = !!periodoActual && todasLasGrades.length === 0;

  const handlePeriodoChange = (id: string) => {
    startTransition(() => {
      router.push(`/alumno/calificaciones?periodo=${id}`);
    });
  };

  return (
    <Layout hydrated={hydrated}>
      {/* Hero — gradiente primary → violet con halo rose */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/8 via-card to-violet/8 px-6 py-8 sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-rose/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 size-56 rounded-full bg-info/10 blur-3xl"
        />
        <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-violet">
          Académico · Alumno
        </p>
        <h1 className="relative mt-3 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Mis Calificaciones
        </h1>
        <p className="relative mt-2 text-sm text-neutral-foreground/80 sm:text-base">
          {alumnoNombre} ·{" "}
          <span className="rounded-md bg-rose/10 px-2 py-0.5 font-mono text-rose">
            {alumnoMatricula}
          </span>
        </p>
      </header>

      {/* Controles + badge periodo */}
      <section
        aria-label="Controles de calificaciones"
        className="flex flex-col gap-4 rounded-2xl bg-card p-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <PeriodSelector
            periodos={periodos}
            periodoSeleccionado={periodoSeleccionado ?? periodoActual?.periodId}
            onChange={handlePeriodoChange}
            isPending={isPending}
          />
          <GradesFilter
            materias={materiasDisponibles}
            selected={materiaFilter}
            onChange={setMateriaFilter}
          />
        </div>

        {periodoActual && (
          <div
            data-testid="periodo-badge"
            className="inline-flex flex-col items-center justify-center gap-2 self-start rounded-full px-3 py-1.5 text-sm text-secondary"
          > 
            {periodoActual.isActive && (
              <span className="rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                Activo
              </span>
            )}
          </div>
        )}
      </section>

      {/* Estado: sin calificaciones */}
      {sinCalificaciones && (
        <EmptyState
          tipo="sin_calificaciones"
          mensaje="Aún no se han registrado calificaciones para este periodo."
        />
      )}

      {/* Grid de materias */}
      {!sinCalificaciones && materiasFiltradas.length > 0 && (
        <div
          data-testid="materias-grid"
          data-filter={materiaFilter}
          data-count={materiasFiltradas.length}
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            isPending ? "opacity-60" : ""
          }`}
        >
          {materiasFiltradas.map((materia) => (
            <SubjectCard key={materia.groupId} materia={materia} />
          ))}
        </div>
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
    <div
      data-testid="cu04-root"
      data-hydrated={hydrated ? "true" : "false"}
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
    >
      {children}
    </div>
  );
}
