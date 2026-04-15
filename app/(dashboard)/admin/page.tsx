import {
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { getAdminStats } from "@/lib/dal/stats/admin";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard Administración
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Total de usuarios"
          valor={stats.usuarios}
          icon={UsersIcon}
        />
        <StatCard
          titulo="Grupos activos"
          valor={stats.gruposActivos}
          icon={UserGroupIcon}
        />
        <StatCard
          titulo="Trámites pendientes"
          valor={stats.tramitesPendientes}
          icon={DocumentTextIcon}
        />
      </div>
    </div>
  );
}
