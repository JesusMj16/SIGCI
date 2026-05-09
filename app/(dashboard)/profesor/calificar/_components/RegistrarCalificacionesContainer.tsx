"use client";

/*
  CU-05 — Orquesta los 4 pasos del flujo:
  1. Seleccionar grupo
  2. Seleccionar evaluación (assignment)
  3. Ingresar calificaciones
  4. Confirmar y ver resultado
 */

import { useState, useTransition } from "react";
import {
  getAsignacionesGrupoAction,
  getAlumnosGrupoAction,
  registrarCalificacionesAction,
} from "@/lib/actions/registrarCalificaciones.actions";
import type { ActionResult } from "@/lib/actions/registrarCalificaciones.actions";
import type {
  GrupoDTO,
  AlumnoEnGrupoDTO,
  AssignmentDTO,
  RegistrarCalificacionesResult,
} from "@/lib/dal/registrarCalificaciones";
import { GrupoSelector } from "./GrupoSelector";
import { AsignacionSelector } from "./AsignacionSelector";
import { TablaCaptura } from "./TablaCaptura";
import { ErrorState, ResultadoRegistro } from "./ResultadoRegistro";


type Paso = "grupo" | "asignacion" | "captura" | "resultado";

interface Props {
  gruposResult: ActionResult<GrupoDTO[]>;
}

export function RegistrarCalificacionesContainer({ gruposResult }: Props) {
  const [paso, setPaso] = useState<Paso>("grupo");
  const [isPending, startTransition] = useTransition();

  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoDTO | null>(null);
  const [asignaciones, setAsignaciones] = useState<AssignmentDTO[]>([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<AssignmentDTO | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoEnGrupoDTO[]>([]);
  const [resultado, setResultado] = useState<RegistrarCalificacionesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  //  Paso 1: seleccionar grupo 
  const handleSelectGrupo = (grupo: GrupoDTO) => {
    startTransition(async () => {
      setError(null);
      const result = await getAsignacionesGrupoAction(grupo.groupId);
      if (!result.ok) { setError(result.message); return; }
      setGrupoSeleccionado(grupo);
      setAsignaciones(result.data);
      setPaso("asignacion");
    });
  };

  //  Paso 2: seleccionar evaluación 
  const handleSelectAsignacion = (asignacion: AssignmentDTO) => {
    startTransition(async () => {
      setError(null);
      const result = await getAlumnosGrupoAction(
        grupoSeleccionado!.groupId,
        asignacion.assignmentId
      );
      if (!result.ok) { setError(result.message); return; }
      setAsignacionSeleccionada(asignacion);
      setAlumnos(result.data);
      setPaso("captura");
    });
  };

  //  Paso 3: confirmar registro 
  const handleConfirmar = (calificaciones: { studentId: string; valor: number | null }[]) => {
    startTransition(async () => {
      setError(null);
      const result = await registrarCalificacionesAction({
        groupId: grupoSeleccionado!.groupId,
        assignmentId: asignacionSeleccionada!.assignmentId,
        calificaciones,
      });
      if (!result.ok) { setError(result.message); return; }
      setResultado(result.data);
      setWarnings(result.warnings ?? []);
      setPaso("resultado");
    });
  };

  //  Reiniciar 
  const handleReiniciar = () => {
    setPaso("grupo");
    setGrupoSeleccionado(null);
    setAsignacionSeleccionada(null);
    setAlumnos([]);
    setResultado(null);
    setError(null);
    setWarnings([]);
  };

  if (!gruposResult.ok) {
    return <ErrorState mensaje={gruposResult.message} />;
  }

  return (
    <div className="calificar-page">
      {/* Header */}
      <header className="calificar-header">
        <h1 className="calificar-header__title">Registrar Calificaciones</h1>
        {/* Breadcrumb de pasos */}
        <div className="calificar-steps">
          {(["grupo", "asignacion", "captura", "resultado"] as Paso[]).map((p, i) => (
            <div key={p} className={`step ${paso === p ? "step--active" : ""} ${["grupo","asignacion","captura","resultado"].indexOf(paso) > i ? "step--done" : ""}`}>
              <span className="step__num">{i + 1}</span>
              <span className="step__label">
                {p === "grupo" ? "Grupo" : p === "asignacion" ? "Evaluación" : p === "captura" ? "Captura" : "Resultado"}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Error global */}
      {error && <ErrorState mensaje={error} onRetry={() => setError(null)} />}

      {/* Loading */}
      {isPending && <div className="calificar-loading">Cargando…</div>}

      {/* Paso 1 */}
      {paso === "grupo" && !isPending && (
        <GrupoSelector
          grupos={gruposResult.data}
          onSelect={handleSelectGrupo}
        />
      )}

      {/* Paso 2 */}
      {paso === "asignacion" && !isPending && (
        <AsignacionSelector
          grupo={grupoSeleccionado!}
          asignaciones={asignaciones}
          onSelect={handleSelectAsignacion}
          onBack={() => setPaso("grupo")}
        />
      )}

      {/* Paso 3 */}
      {paso === "captura" && !isPending && (
        <TablaCaptura
          grupo={grupoSeleccionado!}
          asignacion={asignacionSeleccionada!}
          alumnos={alumnos}
          onConfirmar={handleConfirmar}
          onBack={() => setPaso("asignacion")}
          isPending={isPending}
        />
      )}

      {/* Paso 4 */}
      {paso === "resultado" && resultado && (
        <ResultadoRegistro
          resultado={resultado}
          warnings={warnings}
          onReiniciar={handleReiniciar}
        />
      )}
    </div>
  );
}