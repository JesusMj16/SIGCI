import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { getProfesorStats } from "@/lib/dal/stats/profesor";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function ProfesorDashboard() {
  const stats = await getProfesorStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard Profesor
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Grupos activos"
          valor={stats.grupos}
          icon={UserGroupIcon}
        />
        <StatCard
          titulo="Entregas por calificar"
          valor={stats.porCalificar}
          icon={ClipboardDocumentCheckIcon}
        />
      </div>
    </div>
  );
}
