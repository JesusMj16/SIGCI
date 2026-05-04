export const PROCEDURE_TYPE_LABEL: Record<string, string> = {
  CONSTANCIA: "Constancias",
  HISTORIAL: "Historiales",
  BAJA: "Bajas",
  REINSCRIPCION: "Reinscripciones",
  CERTIFICADO: "Certificados",
  OTRO: "Otros",
};

export function labelForProcedureType(tipo: string): string {
  return PROCEDURE_TYPE_LABEL[tipo] ?? tipo;
}
