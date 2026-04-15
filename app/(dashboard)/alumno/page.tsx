import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { getAlumnoStats } from "@/lib/dal/stats/alumno";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function AlumnoDashboard() {
  const stats = await getAlumnoStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard Alumno
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Materias inscritas"
          valor={stats.materias}
          icon={BookOpenIcon}
        />
        <StatCard
          titulo="Tareas pendientes"
          valor={stats.pendientes}
          icon={ClipboardDocumentListIcon}
        />
        <StatCard
          titulo="Promedio"
          valor={stats.promedio}
          icon={AcademicCapIcon}
        />
      </div>
    </div>
  );
}
