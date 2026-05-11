"use client";

/**
 * Paso 2 CU-09: formulario de creación de asignación.
 * v1: instrucciones y rúbrica son <textarea> (RTF queda como ticket futuro).
 * v1: sin adjuntos (decisión de scope explícita).
 */

import { useMemo } from "react";
import type { AssignmentType } from "@/lib/generated/prisma/enums";
import type { FormularioData } from "./useCrearAsignacionFlow";

interface Props {
  form: FormularioData;
  onChange: <K extends keyof FormularioData>(
    key: K,
    value: FormularioData[K]
  ) => void;
  onContinuar: () => void;
  onBack: () => void;
  borradorRestaurado: boolean;
  onDescartarBorrador: () => void;
}

const TIPO_OPCIONES: { value: AssignmentType; label: string }[] = [
  { value: "TAREA", label: "Tarea" },
  { value: "EXAMEN", label: "Examen" },
  { value: "PROYECTO", label: "Proyecto" },
];

/**
 * Devuelve "YYYY-MM-DDTHH:mm" en hora local — formato esperado por
 * <input type="datetime-local">. Lo usamos como `min` para evitar fechas
 * pasadas desde la UI (defensa en cliente; el server revalida).
 */
function nowLocalIso(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  const local = new Date(now.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export function FormularioAsignacion({
  form,
  onChange,
  onContinuar,
  onBack,
  borradorRestaurado,
  onDescartarBorrador,
}: Props) {
  const minFecha = useMemo(() => nowLocalIso(), []);

  return (
    <section
      aria-label="Detalles de la asignación"
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-violet">
          2 · Detalles de la asignación
        </h2>
        <p className="text-sm text-muted-foreground">
          Tu progreso se guarda automáticamente en este dispositivo.
        </p>
      </header>

      {borradorRestaurado && (
        <div
          data-testid="banner-borrador-restaurado"
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-info/10 px-4 py-3 text-sm text-info"
        >
          <span>Se restauró un borrador previo de este formulario.</span>
          <button
            type="button"
            data-testid="btn-descartar-borrador"
            onClick={onDescartarBorrador}
            className="rounded-md border border-info/30 px-3 py-1 text-xs font-medium hover:bg-info/15"
          >
            Descartar
          </button>
        </div>
      )}

      <form
        data-testid="form-asignacion"
        onSubmit={(e) => {
          e.preventDefault();
          onContinuar();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Tipo</span>
            <select
              data-testid="input-tipo"
              value={form.tipo}
              onChange={(e) =>
                onChange("tipo", e.target.value as AssignmentType)
              }
              className="rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {TIPO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">
              Fecha y hora límite
            </span>
            <input
              type="datetime-local"
              data-testid="input-fecha-limite"
              value={form.fechaLimite}
              min={minFecha}
              onChange={(e) => onChange("fechaLimite", e.target.value)}
              required
              className="rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Título</span>
          <input
            type="text"
            data-testid="input-titulo"
            value={form.titulo}
            maxLength={256}
            onChange={(e) => onChange("titulo", e.target.value)}
            required
            placeholder="Ej. Práctica 3 — Algoritmos de ordenamiento"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Instrucciones</span>
          <textarea
            data-testid="input-instrucciones"
            value={form.instrucciones}
            rows={6}
            onChange={(e) => onChange("instrucciones", e.target.value)}
            required
            placeholder="Describe qué deben entregar, formato, entregables, criterios de aceptación…"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">
            Rúbrica{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </span>
          <textarea
            data-testid="input-rubrica"
            value={form.rubrica}
            rows={4}
            onChange={(e) => onChange("rubrica", e.target.value)}
            placeholder="Criterios de evaluación, ponderación, niveles de desempeño…"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <button
            type="button"
            data-testid="btn-volver-grupos"
            onClick={onBack}
            className="rounded-lg border border-muted-foreground/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Volver
          </button>
          <button
            type="submit"
            data-testid="btn-continuar-confirmacion"
            className="rounded-lg bg-violet px-5 py-2.5 text-sm font-medium text-violet-foreground transition-colors hover:bg-violet/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
          >
            Revisar
          </button>
        </footer>
      </form>
    </section>
  );
}
