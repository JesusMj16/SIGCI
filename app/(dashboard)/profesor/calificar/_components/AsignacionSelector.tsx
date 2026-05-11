"use client";

/**
 * Paso 2 CU-05: seleccionar evaluación a calificar.
 */

import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import type {
  AssignmentDTO,
  GrupoDTO,
} from "@/lib/dal/registrarCalificaciones";
import { tipoBadgeClass, tipoLabel } from "@/lib/assignment-types";

interface Props {
  grupo: GrupoDTO;
  asignaciones: AssignmentDTO[];
  onSelect: (a: AssignmentDTO) => void;
  onBack: () => void;
}

export function AsignacionSelector({
  grupo,
  asignaciones,
  onSelect,
  onBack,
}: Props) {
  return (
    <section
      aria-label="Selecciona evaluación"
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          data-testid="btn-back-asignacion"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeftIcon aria-hidden className="h-4 w-4" />
          Volver
        </button>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Paso 2 de 4
        </span>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/70">
          {grupo.subjectCodigo}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-primary">
          {grupo.subjectNombre}
        </h2>
        <p className="mt-1 text-sm text-neutral-foreground/70">
          Selecciona la evaluación que deseas calificar.
        </p>
      </div>

      {asignaciones.length === 0 ? (
        <div
          data-testid="empty-asignaciones"
          role="status"
          className="flex flex-col items-center gap-3 rounded-xl bg-neutral px-6 py-10 text-center"
        >
          <ClipboardDocumentListIcon
            aria-hidden
            className="h-10 w-10 text-muted-foreground"
          />
          <p className="text-sm font-medium text-foreground">
            No hay evaluaciones publicadas en este grupo.
          </p>
        </div>
      ) : (
        <ul data-testid="asignaciones-list" className="flex flex-col gap-2">
          {asignaciones.map((a) => (
            <li key={a.assignmentId}>
              <button
                type="button"
                data-testid="asignacion-card"
                data-tipo={a.tipo}
                onClick={() => onSelect(a)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-card px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:shadow-sm hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadgeClass(
                      a.tipo
                    )}`}
                  >
                    {tipoLabel(a.tipo)}
                  </span>
                  <span className="font-semibold text-primary">
                    {a.titulo}
                  </span>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-neutral-foreground/70">
                  <CalendarDaysIcon aria-hidden className="h-4 w-4" />
                  {new Date(a.fechaLimite).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
