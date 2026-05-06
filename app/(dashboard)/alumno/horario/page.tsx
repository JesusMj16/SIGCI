// app/(dashboard)/alumno/horario/page.tsx
import { auth } from "@/auth";
import ScheduleGrid from "@/components/dashboard/ScheduleGrid";
import { Alert } from "@/components/ui/alert";
import { getStudentSchedule } from "@/lib/dal/horarios";

export default async function HorarioAlumnoPage() {
  const session = await auth();
  const { schedule, isFallback, period } = await getStudentSchedule(session?.user?.id!);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Horario de Clases</h1>
      {isFallback && (
        <Alert variant="destructive">
          <p>El periodo escolar actual no está activo. Mostrando el último periodo registrado: <strong>{period?.nombre}</strong></p>
        </Alert>
      )}
      <ScheduleGrid schedule={schedule} role="ALUMNO" />
    </div>
  );
}