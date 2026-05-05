"use client";

/**
 * CalificacionesContainer.tsx
 * Client Component principal de CU-04.
 * Maneja: filtro por materia (useState), selector de periodo (router.push),
 * y todos los estados de excepción documentados.
 */

import { useState, useMemo, useTransition } from "react";
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


// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  result: ActionResult<CalificacionesResultDTO>;
  periodos: PeriodSummaryDTO[];
  periodoSeleccionado?: string;
}

// ── Componente ─────────────────────────────────────────────────────────────

export function CalificacionesContainer({ result, periodos, periodoSeleccionado }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filtro por materia — Prueba 3: sin recarga completa
  const [materiaFilter, setMateriaFilter] = useState<string>("todas");

  // ── Excepciones: sin materias / error DB ──────────────────────────────────
  if (!result.ok) {
    if (result.errorCode === "NO_MATERIAS") {
      return (
        <EmptyState
          tipo="sin_materias"
          mensaje="No tienes materias inscritas en este periodo."
        />
      );
    }
    if (result.errorCode === "DB_ERROR") {
      return (
        <ErrorState
          mensaje={result.message}
          onRetry={() => router.refresh()}
        />
      );
    }
    if (result.errorCode === "AUTH_ERROR") {
      return <ErrorState mensaje="No autorizado." />;
    }
  }

  const { periodos: periodosData, alumnoNombre, alumnoMatricula } =
    (result as ActionResult<CalificacionesResultDTO> & { ok: true }).data;

  // Periodo actual a mostrar (activo o el seleccionado)
  const periodoActual = periodoSeleccionado
    ? periodosData.find((p) => p.periodId === periodoSeleccionado)
    : periodosData.find((p) => p.isActive) ?? periodosData[0];

  // ── Excepción: sin calificaciones aún ─────────────────────────────────────
  const todasLasGrades = periodoActual?.materias.flatMap((m) => m.grades) ?? [];
  const sinCalificaciones = periodoActual && todasLasGrades.length === 0;

  // Lista de materias únicas para el filtro
  const materiasDisponibles: string[] = useMemo(
    () => periodoActual?.materias.map((m) => m.subjectNombre) ?? [],
    [periodoActual]
  );

  // Materias filtradas — Prueba 3
  const materiasFiltradas: SubjectGradesDTO[] = useMemo(() => {
    if (!periodoActual) return [];
    if (materiaFilter === "todas") return periodoActual.materias;
    return periodoActual.materias.filter(
      (m) => m.subjectNombre === materiaFilter
    );
  }, [periodoActual, materiaFilter]);

  // Cambiar periodo — Flujo alternativo (searchParam)
  const handlePeriodoChange = (id: string) => {
    startTransition(() => {
      router.push(`/alumno/calificaciones?periodo=${id}`);
    });
  };

  return (
    <div className="calificaciones-page">
      {/* Header */}
      <header className="cal-header">
        <div className="cal-header__info">
          <h1 className="cal-header__title">Mis Calificaciones</h1>
          <p className="cal-header__sub">
            {alumnoNombre} · <span className="cal-header__mat">{alumnoMatricula}</span>
          </p>
        </div>
      </header>

      {/* Controles: selector de periodo + filtro materia */}
      <div className="cal-controls">
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

      {/* Periodo actual badge */}
      {periodoActual && (
        <div className="cal-periodo-badge">
          <span className="cal-periodo-badge__label">Periodo:</span>
          <span className="cal-periodo-badge__nombre">{periodoActual.periodNombre}</span>
          {periodoActual.isActive && (
            <span className="cal-periodo-badge__active">Activo</span>
          )}
        </div>
      )}

      {/* Estado: sin calificaciones aún — Prueba 5 */}
      {sinCalificaciones && (
        <EmptyState
          tipo="sin_calificaciones"
          mensaje="Aún no se han registrado calificaciones para este periodo."
        />
      )}

      {/* Grid de materias — Prueba 1 */}
      {!sinCalificaciones && (
        <div className={`cal-grid ${isPending ? "cal-grid--loading" : ""}`}>
          {materiasFiltradas.map((materia) => (
            <SubjectCard key={materia.groupId} materia={materia} />
          ))}
        </div>
      )}
    </div>
  );
}
