// app/(dashboard)/alumno/horario/page.tsx
//
// CU-06 — Consultar Horario de Clases (Alumno).
// El guard de sesión + rol vive dentro de getMyStudentSchedule:
// si la sesión no existe o el rol no es ALUMNO, la DAL redirige.

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScheduleGrid } from "@/components/dashboard/ScheduleGrid";
import { getMyStudentSchedule } from "@/lib/dal/horarios";

export const metadata = { title: "Horario de Clases — UTM" };

export default async function HorarioAlumnoPage() {
  const { schedule, period, isFallback } = await getMyStudentSchedule();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Vista de alumno
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Horario de Clases
        </h1>
        <p className="text-sm text-muted-foreground">
          {period ? `Periodo: ${period.nombre}` : "Sin periodo académico registrado."}
        </p>
      </header>

      {isFallback && period && (
        <Alert variant="destructive" data-testid="alert-fallback-period">
          <AlertTitle>Periodo inactivo</AlertTitle>
          <AlertDescription>
            El periodo escolar actual no está activo. Mostrando el último periodo registrado:{" "}
            <strong>{period.nombre}</strong>.
          </AlertDescription>
        </Alert>
      )}

      <ScheduleGrid schedule={schedule} period={period} role="ALUMNO" />
    </div>
  );
}
