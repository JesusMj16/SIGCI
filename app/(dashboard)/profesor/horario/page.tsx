// app/(dashboard)/profesor/horario/page.tsx
import { auth } from "@/auth";
import ScheduleGrid from "@/components/dashboard/ScheduleGrid";
import { getTeacherSchedule } from "@/lib/dal/horarios";

export default async function HorarioProfesorPage() {
  const session = await auth();
    const { schedule, isFallback, period } = await getTeacherSchedule(session?.user?.id!);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mi Horario de Clases
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Consulta los grupos y aulas que tienes asignados en este periodo.
        </p>
      </div>

      {isFallback && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md dark:bg-red-950/30 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>Atención:</strong> El periodo escolar actual no está activo. Mostrando el último periodo registrado: <strong>{period?.nombre}</strong>
          </p>
        </div>
      )}

      <ScheduleGrid schedule={schedule} role="PROFESOR" />
    </div>
  );
}