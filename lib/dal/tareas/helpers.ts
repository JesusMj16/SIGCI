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
  const copia = [...tareas];
  switch (criterio) {
    case "fecha":
      return copia.sort(
        (a, b) =>
          new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
      );
    case "materia":
      return copia.sort((a, b) =>
        a.materia.nombre.localeCompare(b.materia.nombre, "es")
      );
    case "estado":
      return copia.sort(
        (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado]
      );
    case "tipo":
      return copia.sort((a, b) => a.tipo.localeCompare(b.tipo, "es"));
  }
}

export function hrefDetalle(tarea: TareaPendienteDTO): string {
  return `/alumno/tareas/${tarea.assignmentId}`;
}
