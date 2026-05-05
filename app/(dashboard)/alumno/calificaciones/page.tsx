/**
 * app/(dashboard)/alumno/calificaciones/page.tsx
 * CU-04 — ConsultarCalificaciones
 *
 * Server Component: carga datos en servidor, pasa al client container.
 * Protección de rol: getAuthenticatedUser(["ALUMNO"]) dentro del DAL.
 */

import { Suspense } from "react";
import { getCalificacionesAction, getPeriodosAlumnoAction } from "@/lib/actions/calificaciones.actions";
import "./calificaciones.css";
import { CalificacionesSkeleton } from "./_components/CalificacionesSkeleton";
import { CalificacionesContainer } from "./_components/CalificacionesContaines";

interface PageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export const metadata = {
  title: "Mis Calificaciones | SIGCI",
  description: "Consulta tus calificaciones parciales y finales.",
};

export default async function CalificacionesPage({ searchParams }: PageProps) {
  const { periodo } = await searchParams;

  // Carga en paralelo: calificaciones + lista de periodos disponibles
  const [calificacionesResult, periodosResult] = await Promise.all([
    getCalificacionesAction(periodo),
    getPeriodosAlumnoAction(),
  ]);

  const periodos = periodosResult.ok ? periodosResult.data : [];

  return (
    <Suspense fallback={<CalificacionesSkeleton />}>
      <CalificacionesContainer
        result={calificacionesResult}
        periodos={periodos}
        periodoSeleccionado={periodo}
      />
    </Suspense>
  );
}
