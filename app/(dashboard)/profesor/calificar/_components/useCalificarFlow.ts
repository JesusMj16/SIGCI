"use client";

/**
 * Hook que encapsula la máquina de estados del flujo CU-05.
 * Razón (SRP): el Container ya solo orquesta render; toda la lógica de paso/error/transición vive aquí.
 */

import { useCallback, useState, useTransition } from "react";
import {
  getAlumnosGrupoAction,
  getAsignacionesGrupoAction,
  registrarCalificacionesAction,
} from "@/lib/actions/registrarCalificaciones.actions";
import type {
  AlumnoEnGrupoDTO,
  AssignmentDTO,
  EntradaCalificacion,
  GrupoDTO,
  RegistrarCalificacionesResult,
} from "@/lib/dal/registrarCalificaciones";

export type Paso = "grupo" | "asignacion" | "captura" | "resultado";

export const PASOS: readonly Paso[] = [
  "grupo",
  "asignacion",
  "captura",
  "resultado",
] as const;

export interface CalificarFlowState {
  paso: Paso;
  isPending: boolean;
  error: string | null;
  warnings: string[];
  grupoSeleccionado: GrupoDTO | null;
  asignaciones: AssignmentDTO[];
  asignacionSeleccionada: AssignmentDTO | null;
  alumnos: AlumnoEnGrupoDTO[];
  resultado: RegistrarCalificacionesResult | null;
}

export interface CalificarFlowActions {
  selectGrupo: (g: GrupoDTO) => void;
  selectAsignacion: (a: AssignmentDTO) => void;
  confirmar: (entradas: EntradaCalificacion[]) => void;
  back: (target: Paso) => void;
  reset: () => void;
  clearError: () => void;
}

export function useCalificarFlow(): CalificarFlowState & CalificarFlowActions {
  const [paso, setPaso] = useState<Paso>("grupo");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoDTO | null>(null);
  const [asignaciones, setAsignaciones] = useState<AssignmentDTO[]>([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] =
    useState<AssignmentDTO | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoEnGrupoDTO[]>([]);
  const [resultado, setResultado] =
    useState<RegistrarCalificacionesResult | null>(null);

  const selectGrupo = useCallback((grupo: GrupoDTO) => {
    setError(null);
    startTransition(async () => {
      const result = await getAsignacionesGrupoAction(grupo.groupId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setGrupoSeleccionado(grupo);
      setAsignaciones(result.data);
      setPaso("asignacion");
    });
  }, []);

  const selectAsignacion = useCallback(
    (asignacion: AssignmentDTO) => {
      if (!grupoSeleccionado) return;
      setError(null);
      startTransition(async () => {
        const result = await getAlumnosGrupoAction(
          grupoSeleccionado.groupId,
          asignacion.assignmentId
        );
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setAsignacionSeleccionada(asignacion);
        setAlumnos(result.data);
        setPaso("captura");
      });
    },
    [grupoSeleccionado]
  );

  const confirmar = useCallback(
    (entradas: EntradaCalificacion[]) => {
      if (!grupoSeleccionado || !asignacionSeleccionada) return;
      setError(null);
      startTransition(async () => {
        const result = await registrarCalificacionesAction({
          groupId: grupoSeleccionado.groupId,
          assignmentId: asignacionSeleccionada.assignmentId,
          calificaciones: entradas,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setResultado(result.data);
        setWarnings(result.warnings ?? []);
        setPaso("resultado");
      });
    },
    [grupoSeleccionado, asignacionSeleccionada]
  );

  const back = useCallback((target: Paso) => {
    setError(null);
    setPaso(target);
  }, []);

  const reset = useCallback(() => {
    setPaso("grupo");
    setGrupoSeleccionado(null);
    setAsignaciones([]);
    setAsignacionSeleccionada(null);
    setAlumnos([]);
    setResultado(null);
    setError(null);
    setWarnings([]);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    paso,
    isPending,
    error,
    warnings,
    grupoSeleccionado,
    asignaciones,
    asignacionSeleccionada,
    alumnos,
    resultado,
    selectGrupo,
    selectAsignacion,
    confirmar,
    back,
    reset,
    clearError,
  };
}
