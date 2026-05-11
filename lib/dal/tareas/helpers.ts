import type { TareaPendienteDTO } from "./alumno";

export type CriterioOrden = "fecha" | "materia" | "estado" | "tipo";

export function filtrarPorMateria(
  tareas: TareaPendienteDTO[],
  materiaId: string | null
): TareaPendienteDTO[] {
  if (!materiaId) return tareas;
  return tareas.filter((t) => t.materia.id === materiaId);
}

const ORDEN_ESTADO: Record<TareaPendienteDTO["estado"], number> = {
  VENCIDA: 0,
  PENDIENTE: 1,
  ENTREGADA: 2,
};

export function ordenarTareas(
  tareas: TareaPendienteDTO[],
  criterio: CriterioOrden
): TareaPendienteDTO[] {
  // Cachear epoch una sola vez por tarea para no re-parsear en cada comparacion.
  const conEpoch = tareas.map((t) => ({
    t,
    epoch: new Date(t.fechaLimite).getTime(),
  }));
  const byFecha = (a: { epoch: number }, b: { epoch: number }) =>
    a.epoch - b.epoch;

  switch (criterio) {
    case "fecha":
      conEpoch.sort(byFecha);
      break;
    case "materia":
      conEpoch.sort(
        (a, b) =>
          a.t.materia.nombre.localeCompare(b.t.materia.nombre, "es") ||
          byFecha(a, b)
      );
      break;
    case "estado":
      conEpoch.sort(
        (a, b) =>
          ORDEN_ESTADO[a.t.estado] - ORDEN_ESTADO[b.t.estado] || byFecha(a, b)
      );
      break;
    case "tipo":
      conEpoch.sort(
        (a, b) => a.t.tipo.localeCompare(b.t.tipo, "es") || byFecha(a, b)
      );
      break;
  }
  return conEpoch.map((x) => x.t);
}

export function hrefDetalle(tarea: TareaPendienteDTO): string {
  return `/alumno/tareas/${tarea.assignmentId}`;
}
