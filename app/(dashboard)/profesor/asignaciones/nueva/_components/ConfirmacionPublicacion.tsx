"use client";

/**
 * Paso 3 CU-09: review final + acciones BORRADOR / PUBLICAR.
 */

import type { GrupoOpcionDTO } from "@/lib/actions/asignaciones.actions";
import type { FormularioData } from "./useCrearAsignacionFlow";

interface Props {
  form: FormularioData;
  gruposSeleccionados: GrupoOpcionDTO[];
  isPending: boolean;
  onGuardarBorrador: () => void;
  onPublicar: () => void;
  onBack: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  TAREA: "Tarea",
  EXAMEN: "Examen",
  PROYECTO: "Proyecto",
};

function fechaHumana(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function ConfirmacionPublicacion({
  form,
  gruposSeleccionados,
  isPending,
  onGuardarBorrador,
  onPublicar,
  onBack,
}: Props) {
  const totalAlumnos = gruposSeleccionados.reduce(
    (sum, g) => sum + g.alumnosCount,
    0
  );

  return (
    <section
      aria-label="Revisar y publicar"
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6"
      data-testid="paso-confirmacion"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-warning">
          3 · Revisar y publicar
        </h2>
        <p className="text-sm text-muted-foreground">
          Confirma la información antes de publicar o guarda como borrador.
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Fila label="Tipo" value={TIPO_LABEL[form.tipo] ?? form.tipo} />
        <Fila label="Fecha límite" value={fechaHumana(form.fechaLimite)} testId="resumen-fecha" />
        <Fila label="Título" value={form.titulo} full testId="resumen-titulo" />
        <Fila
          label="Instrucciones"
          value={form.instrucciones}
          full
          multiline
          testId="resumen-instrucciones"
        />
        {form.rubrica.trim() && (
          <Fila
            label="Rúbrica"
            value={form.rubrica}
            full
            multiline
            testId="resumen-rubrica"
          />
        )}
      </dl>

      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
        <p className="text-sm font-medium text-warning">
          Grupos destino ({gruposSeleccionados.length})
        </p>
        <ul
          data-testid="resumen-grupos"
          className="mt-2 flex flex-wrap gap-2"
        >
          {gruposSeleccionados.map((g) => (
            <li
              key={g.id}
              className="rounded-full bg-warning/10 px-3 py-1 text-xs text-warning"
            >
              {g.subjectCodigo} · {g.nombre} ({g.alumnosCount})
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Al publicar se creará un registro de entrega pendiente para{" "}
          <strong data-testid="resumen-total-alumnos">{totalAlumnos}</strong>{" "}
          alumno{totalAlumnos !== 1 ? "s" : ""}.
        </p>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <button
          type="button"
          data-testid="btn-volver-formulario"
          onClick={onBack}
          disabled={isPending}
          className="rounded-lg border border-muted-foreground/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Volver
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="btn-guardar-borrador"
            onClick={onGuardarBorrador}
            disabled={isPending}
            className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar como borrador"}
          </button>
          <button
            type="button"
            data-testid="btn-publicar"
            onClick={onPublicar}
            disabled={isPending}
            className="rounded-lg bg-success px-5 py-2.5 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </footer>
    </section>
  );
}

function Fila({
  label,
  value,
  full = false,
  multiline = false,
  testId,
}: {
  label: string;
  value: string;
  full?: boolean;
  multiline?: boolean;
  testId?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        data-testid={testId}
        className={`mt-1 text-sm text-foreground ${
          multiline ? "whitespace-pre-wrap" : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
