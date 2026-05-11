"use client";

/**
 * Hook que encapsula la máquina de estados del flujo CU-09.
 * Razón (SRP): el Container solo orquesta render; toda la lógica de paso,
 * autoguardado y submit vive aquí.
 *
 * Autoguardado: persistimos el formulario (no la selección de grupos) en
 * localStorage bajo una key estable, con debounce ligero para no escribir
 * en cada keystroke. Restauramos al montar si existe snapshot válido.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { crearAsignacionAction } from "@/lib/actions/asignaciones.actions";
import type { AssignmentType } from "@/lib/generated/prisma/enums";
import type {
  CrearAsignacionResult,
  ModoCreacion,
} from "@/lib/dal/asignaciones";

export type Paso = "grupos" | "formulario" | "confirmacion" | "resultado";

export const PASOS: readonly Paso[] = [
  "grupos",
  "formulario",
  "confirmacion",
  "resultado",
] as const;

export interface FormularioData {
  tipo: AssignmentType;
  titulo: string;
  instrucciones: string;
  /** Formato "YYYY-MM-DDTHH:mm" — compatible con <input type="datetime-local">. */
  fechaLimite: string;
  rubrica: string;
}

const FORM_INICIAL: FormularioData = {
  tipo: "TAREA",
  titulo: "",
  instrucciones: "",
  fechaLimite: "",
  rubrica: "",
};

const STORAGE_KEY = "sigci.cu09.borrador-form.v1";
const AUTOGUARDADO_DEBOUNCE_MS = 600;

function isFormularioData(v: unknown): v is FormularioData {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.tipo === "string" &&
    typeof o.titulo === "string" &&
    typeof o.instrucciones === "string" &&
    typeof o.fechaLimite === "string" &&
    typeof o.rubrica === "string"
  );
}

export interface CrearAsignacionState {
  paso: Paso;
  grupoIds: string[];
  form: FormularioData;
  error: string | null;
  isPending: boolean;
  resultado: CrearAsignacionResult | null;
  /** True una vez se hidrató desde localStorage; útil para flag visual. */
  borradorRestaurado: boolean;
}

export interface CrearAsignacionActions {
  toggleGrupo: (id: string) => void;
  setGrupos: (ids: string[]) => void;
  continuarAFormulario: () => void;
  updateForm: <K extends keyof FormularioData>(
    key: K,
    value: FormularioData[K]
  ) => void;
  continuarAConfirmacion: () => void;
  volverA: (paso: Paso) => void;
  submit: (modo: ModoCreacion) => void;
  reset: () => void;
  clearError: () => void;
  descartarBorrador: () => void;
}

export function useCrearAsignacionFlow(): CrearAsignacionState &
  CrearAsignacionActions {
  const [paso, setPaso] = useState<Paso>("grupos");
  const [grupoIds, setGrupoIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormularioData>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CrearAsignacionResult | null>(null);
  const [borradorRestaurado, setBorradorRestaurado] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Hidratación: restaurar borrador local (solo formulario, no grupos).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (isFormularioData(parsed)) {
        setForm(parsed);
        setBorradorRestaurado(true);
      }
    } catch {
      // Snapshot corrupto: ignorar silenciosamente.
    }
  }, []);

  // Autoguardado debounced. Limpia el timer si el form cambia rápido.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {
        // QuotaExceeded / privacy mode: degradamos a sin autoguardado.
      }
    }, AUTOGUARDADO_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form]);

  const toggleGrupo = useCallback((id: string) => {
    setGrupoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const setGrupos = useCallback((ids: string[]) => {
    setGrupoIds(ids);
  }, []);

  const continuarAFormulario = useCallback(() => {
    if (grupoIds.length === 0) {
      setError("Selecciona al menos un grupo.");
      return;
    }
    setError(null);
    setPaso("formulario");
  }, [grupoIds.length]);

  const updateForm = useCallback(
    <K extends keyof FormularioData>(key: K, value: FormularioData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const continuarAConfirmacion = useCallback(() => {
    // Validación cliente espejo del DAL — fail fast antes de tocar red.
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!form.instrucciones.trim()) {
      setError("Las instrucciones son obligatorias.");
      return;
    }
    if (!form.fechaLimite) {
      setError("La fecha de entrega es obligatoria.");
      return;
    }
    const fecha = new Date(form.fechaLimite);
    if (Number.isNaN(fecha.getTime()) || fecha.getTime() <= Date.now()) {
      setError("La fecha de entrega debe ser futura.");
      return;
    }
    setError(null);
    setPaso("confirmacion");
  }, [form.titulo, form.instrucciones, form.fechaLimite]);

  const volverA = useCallback((target: Paso) => {
    setError(null);
    setPaso(target);
  }, []);

  const submit = useCallback(
    (modo: ModoCreacion) => {
      const fechaISO = new Date(form.fechaLimite).toISOString();
      startTransition(async () => {
        const res = await crearAsignacionAction({
          groupIds: grupoIds,
          tipo: form.tipo,
          titulo: form.titulo.trim(),
          instrucciones: form.instrucciones.trim(),
          fechaLimite: fechaISO,
          rubrica: form.rubrica.trim() || null,
          modo,
        });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setResultado(res.data);
        setPaso("resultado");
        // Tras publicar/guardar con éxito, descartamos el borrador local.
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            /* ignore */
          }
        }
      });
    },
    [form, grupoIds]
  );

  const reset = useCallback(() => {
    setPaso("grupos");
    setGrupoIds([]);
    setForm(FORM_INICIAL);
    setError(null);
    setResultado(null);
    setBorradorRestaurado(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const descartarBorrador = useCallback(() => {
    setForm(FORM_INICIAL);
    setBorradorRestaurado(false);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return {
    paso,
    grupoIds,
    form,
    error,
    isPending,
    resultado,
    borradorRestaurado,
    toggleGrupo,
    setGrupos,
    continuarAFormulario,
    updateForm,
    continuarAConfirmacion,
    volverA,
    submit,
    reset,
    clearError,
    descartarBorrador,
  };
}
