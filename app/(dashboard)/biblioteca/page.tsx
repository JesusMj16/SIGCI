import {
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { getBibliotecaStats } from "@/lib/dal/stats/biblioteca";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function BibliotecaDashboard() {
  const stats = await getBibliotecaStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard Biblioteca
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Préstamos activos"
          valor={stats.activos}
          icon={ArrowsRightLeftIcon}
        />
        <StatCard
          titulo="Préstamos vencidos"
          valor={stats.vencidos}
          icon={ExclamationTriangleIcon}
        />
      </div>
    </div>
  );
}
