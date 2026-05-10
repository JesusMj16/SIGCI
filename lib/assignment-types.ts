/**
 * Centraliza labels y estilos de tipos de evaluación.
 * Razón: eliminar duplicación entre SubjectCard y AsignacionSelector (OCP).
 */

export type AssignmentTipoLower = "tarea" | "examen" | "proyecto";

export const TIPO_LABELS: Record<string, string> = {
  tarea: "Tarea",
  examen: "Examen",
  proyecto: "Proyecto",
};

/**
 * Clases Tailwind para badges por tipo. Cada tipo usa un acento distinto
 * de la paleta extendida para diferenciar sin saturar de azul.
 */
export const TIPO_BADGE_CLASSES: Record<string, string> = {
  tarea: "bg-rose/10 text-rose",
  examen: "bg-secondary/10 text-secondary",
  proyecto: "bg-violet/10 text-violet",
};

export function tipoLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo;
}

export function tipoBadgeClass(tipo: string): string {
  return TIPO_BADGE_CLASSES[tipo] ?? "bg-muted text-muted-foreground";
}

/**
 * Color semántico de promedio (rangos UTM) usando paleta extendida.
 */
export function promedioToneClass(val: number | null): string {
  if (val === null) return "text-muted-foreground";
  if (val >= 9) return "text-success";
  if (val >= 7) return "text-info";
  if (val >= 6) return "text-warning";
  return "text-destructive";
}
