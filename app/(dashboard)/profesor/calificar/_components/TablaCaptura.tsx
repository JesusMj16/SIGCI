"use client";

/**
 * Paso 3 CU-05 — Captura de calificaciones.
 *
 * Cambios vs versión original:
 * - Enter avanza al siguiente input. Tab y Shift+Tab se respetan (a11y nativa).
 * - Retroalimentación pre-rellenada con la existente; semántica:
 *     vacía idéntica a la previa  → `undefined` (no toca BD).
 *     vacía limpiando la previa   → `null`.
 *     texto nuevo                 → `string`.
 * - Estado se reinicia con `key={alumnos.length}` desde el padre cuando cambian props
 *   (no se hace state derivado anti-patrón).
 * - Validación de rango con feedback visual y bloqueo de submit.
 */

import { useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type {
  AlumnoEnGrupoDTO,
  AssignmentDTO,
  EntradaCalificacion,
  GrupoDTO,
} from "@/lib/dal/registrarCalificaciones";
import { tipoBadgeClass, tipoLabel } from "@/lib/assignment-types";

interface Props {
  grupo: GrupoDTO;
  asignacion: AssignmentDTO;
  alumnos: AlumnoEnGrupoDTO[];
  onConfirmar: (entradas: EntradaCalificacion[]) => void;
  onBack: () => void;
  isPending: boolean;
}

interface FilaCalificacion {
  studentId: string;
  valor: string;
  retroalimentacion: string;
  retroOriginal: string;
  error: string | null;
}

const VALOR_RE = /^-?\d+(\.\d+)?$/;

function validarValor(val: string): string | null {
  if (val === "") return null;
  if (!VALOR_RE.test(val.trim())) return "Debe ser un número";
  const num = Number(val);
  if (Number.isNaN(num)) return "Debe ser un número";
  if (num < 0 || num > 10) return "Fuera de rango (0-10)";
  return null;
}

function buildInitialRows(alumnos: AlumnoEnGrupoDTO[]): FilaCalificacion[] {
  return alumnos.map((a) => ({
    studentId: a.studentId,
    valor: a.gradeActual ? String(a.gradeActual.valor) : "",
    retroalimentacion: a.gradeActual?.retroalimentacion ?? "",
    retroOriginal: a.gradeActual?.retroalimentacion ?? "",
    error: null,
  }));
}

export function TablaCaptura({
  grupo,
  asignacion,
  alumnos,
  onConfirmar,
  onBack,
  isPending,
}: Props) {
  const [filas, setFilas] = useState<FilaCalificacion[]>(() =>
    buildInitialRows(alumnos)
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleValorChange = (index: number, valor: string) => {
    const error = validarValor(valor);
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, valor, error } : f))
    );
  };

  const handleRetroChange = (index: number, retroalimentacion: string) => {
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, retroalimentacion } : f))
    );
  };

  /**
   * Enter avanza al siguiente input. Tab/Shift+Tab quedan en comportamiento nativo.
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = inputRefs.current[index + 1];
      if (next) next.focus();
    }
  };

  const tieneErrores = useMemo(
    () => filas.some((f) => f.error !== null),
    [filas]
  );

  const calificadasCount = useMemo(
    () => filas.filter((f) => f.valor !== "").length,
    [filas]
  );

  const handleConfirmar = () => {
    if (tieneErrores) return;
    const entradas: EntradaCalificacion[] = filas.map((f) => {
      const valor = f.valor === "" ? null : Number(f.valor);
      const retroTrim = f.retroalimentacion.trim();
      const retroOrig = f.retroOriginal;

      // Si no calificará a este alumno, se ignora retroalimentación
      if (valor === null) {
        return { studentId: f.studentId, valor: null };
      }

      // Si la retro no cambió, no se manda → preserva existente (undefined)
      if (retroTrim === retroOrig) {
        return { studentId: f.studentId, valor };
      }

      // Si profesor borró todo el contenido → null (limpiar)
      if (retroTrim === "") {
        return {
          studentId: f.studentId,
          valor,
          retroalimentacion: null,
        };
      }

      return {
        studentId: f.studentId,
        valor,
        retroalimentacion: retroTrim,
      };
    });

    onConfirmar(entradas);
  };

  return (
    <section
      aria-label="Captura de calificaciones"
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          data-testid="btn-back-captura"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeftIcon aria-hidden className="h-4 w-4" />
          Volver
        </button>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Paso 3 de 4
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/70">
            {grupo.subjectCodigo}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-primary">
            {grupo.subjectNombre}
          </h2>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-neutral-foreground/80">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadgeClass(
                asignacion.tipo
              )}`}
            >
              {tipoLabel(asignacion.tipo)}
            </span>
            <strong className="font-semibold text-primary">
              {asignacion.titulo}
            </strong>
          </p>
        </div>

        <div className="flex gap-3 text-center" data-testid="captura-stats">
          <Stat
            value={calificadasCount}
            label="A registrar"
            tone="primary"
            testid="stat-registrar"
          />
          <Stat
            value={alumnos.length - calificadasCount}
            label="Sin calificar"
            tone="muted"
            testid="stat-sin"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary/10">
        <table
          data-testid="captura-table"
          className="w-full border-collapse text-sm"
        >
          <thead>
            <tr className="border-b border-primary/10 bg-primary/5 text-xs uppercase tracking-wider text-primary/70">
              <th className="px-3 py-2.5 text-left font-medium">#</th>
              <th className="px-3 py-2.5 text-left font-medium">Matrícula</th>
              <th className="px-3 py-2.5 text-left font-medium">Nombre</th>
              <th className="px-3 py-2.5 text-right font-medium">Anterior</th>
              <th className="px-3 py-2.5 text-left font-medium">Calificación</th>
              <th className="px-3 py-2.5 text-left font-medium">
                Retroalimentación
              </th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno, index) => {
              const fila = filas[index];
              if (!fila) return null;
              return (
                <tr
                  key={alumno.studentId}
                  data-testid="captura-row"
                  data-matricula={alumno.matricula}
                  data-error={fila.error ? "true" : undefined}
                  className={`border-b border-primary/10 last:border-b-0 transition-colors hover:bg-primary/5 ${
                    fila.error ? "bg-destructive/5" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-primary/60">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-primary">
                    {alumno.matricula}
                  </td>
                  <td className="px-3 py-2.5 text-neutral-foreground">
                    {alumno.nombre} {alumno.apellidos}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {alumno.gradeActual ? (
                      <span className="text-primary/70">
                        {alumno.gradeActual.valor}
                      </span>
                    ) : (
                      <span className="text-primary/30">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={10}
                      step={0.1}
                      value={fila.valor}
                      onChange={(e) =>
                        handleValorChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      data-testid="grade-input"
                      data-matricula={alumno.matricula}
                      aria-invalid={fila.error ? true : undefined}
                      aria-describedby={
                        fila.error ? `err-${alumno.studentId}` : undefined
                      }
                      placeholder="0-10"
                      className={`h-9 w-24 rounded-md border bg-background px-2 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                        fila.error
                          ? "border-destructive text-destructive focus-visible:ring-destructive/40"
                          : "border-border focus-visible:border-primary focus-visible:ring-primary/30"
                      }`}
                    />
                    {fila.error && (
                      <p
                        id={`err-${alumno.studentId}`}
                        data-testid="grade-error"
                        className="mt-1 text-xs text-destructive"
                      >
                        {fila.error}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <input
                      type="text"
                      value={fila.retroalimentacion}
                      onChange={(e) =>
                        handleRetroChange(index, e.target.value)
                      }
                      placeholder="Comentario opcional…"
                      data-testid="retro-input"
                      className="h-9 w-full min-w-[180px] rounded-md border border-border bg-background px-2 text-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Deja en blanco para omitir (registro parcial). Enter avanza al
          siguiente alumno.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="btn-cancelar"
            onClick={onBack}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirmar"
            onClick={handleConfirmar}
            disabled={tieneErrores || isPending || calificadasCount === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Guardando…"
              : `Confirmar ${calificadasCount} calificación${
                  calificadasCount !== 1 ? "es" : ""
                }`}
          </button>
        </div>
      </div>
    </section>
  );
}

interface StatProps {
  value: number;
  label: string;
  tone: "primary" | "muted";
  testid?: string;
}

function Stat({ value, label, tone, testid }: StatProps) {
  return (
    <div
      data-testid={testid}
      className={`flex flex-col gap-0.5 rounded-xl px-4 py-2.5 ${
        tone === "primary"
          ? "bg-primary/10 ring-1 ring-primary/15"
          : "bg-primary/5"
      }`}
    >
      <span
        className={`text-2xl font-semibold tabular-nums ${
          tone === "primary" ? "text-primary" : "text-primary/50"
        }`}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-primary/70">
        {label}
      </span>
    </div>
  );
}
