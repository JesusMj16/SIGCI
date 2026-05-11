/**
 * CU-09 — Crear y Publicar Asignación (Profesor)
 * Server Component: precarga los grupos del profesor para evitar un round-trip
 * cliente→servidor al montar el Container.
 */

import { getGruposProfesorAction } from "@/lib/actions/asignaciones.actions";
import { CrearAsignacionContainer } from "./_components/CrearAsignacionContainer";

export const metadata = {
  title: "Crear Asignación | SIGCI",
  description:
    "Crea y publica asignaciones para tus grupos asignados en el periodo activo.",
};

export default async function CrearAsignacionPage() {
  const gruposResult = await getGruposProfesorAction();
  return <CrearAsignacionContainer gruposResult={gruposResult} />;
}
