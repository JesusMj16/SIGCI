/**
 * CU-04 — Consultar Calificaciones (Alumno)
 * Server Component: carga datos en servidor y entrega al Client Container.
 * Protección de rol delegada a la DAL (getAuthenticatedUser).
 */

import { getCalificacionesAction, getPeriodosAlumnoAction } from "@/lib/actions/calificaciones.actions";
import { CalificacionesContainer } from "./_components/CalificacionesContainer";

interface PageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export const metadata = {
  title: "Mis Calificaciones | SIGCI",
  description: "Consulta tus calificaciones parciales y finales.",
};

export default async function CalificacionesPage({ searchParams }: PageProps) {
  const { periodo } = await searchParams;

  const [calificacionesResult, periodosResult] = await Promise.all([
    getCalificacionesAction(periodo),
    getPeriodosAlumnoAction(),
  ]);

  const periodos = periodosResult.ok ? periodosResult.data : [];

  return (
    <CalificacionesContainer
      result={calificacionesResult}
      periodos={periodos}
      periodoSeleccionado={periodo}
    />
  );
}
