/**
 * CU-05 — Registrar Calificaciones (Profesor)
 * Server Component: precarga grupos del profesor.
 */

import { getGruposProfesorAction } from "@/lib/actions/registrarCalificaciones.actions";
import { RegistrarCalificacionesContainer } from "./_components/RegistrarCalificacionesContainer";

export const metadata = {
  title: "Registrar Calificaciones | SIGCI",
  description: "Registra calificaciones para tus grupos asignados.",
};

export default async function CalificarPage() {
  const gruposResult = await getGruposProfesorAction();

  return <RegistrarCalificacionesContainer gruposResult={gruposResult} />;
}
