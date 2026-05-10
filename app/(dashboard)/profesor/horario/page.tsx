// app/(dashboard)/profesor/horario/page.tsx
//
// CU-06 — Consultar Horario de Clases (Profesor).
// Sin auth() suelto: el guard rol+sesión lo hace la DAL.

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScheduleGrid } from "@/components/dashboard/ScheduleGrid";
import { getMyTeacherSchedule } from "@/lib/dal/horarios";

export const metadata = { title: "Mi Horario — UTM" };

export default async function HorarioProfesorPage() {
  const { schedule, period, isFallback } = await getMyTeacherSchedule();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Vista de profesor
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Mi Horario de Clases
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulta los grupos y aulas que tienes asignados
          {period ? ` en ${period.nombre}.` : "."}
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

      <ScheduleGrid schedule={schedule} period={period} role="PROFESOR" />
    </div>
  );
}
