import Link from "next/link";
import {
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { getBibliotecaStats } from "@/lib/dal/stats/biblioteca";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function BibliotecaDashboard() {
  const stats = await getBibliotecaStats();

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Biblioteca"
        title="Gestión de préstamos"
        subtitle="Monitorea la actividad diaria y registra movimientos."
        aside={
          <Link
            href="/biblioteca/prestamos/nuevo"
            className="flex items-center justify-between gap-4 rounded-2xl bg-secondary p-6 text-secondary-foreground transition hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                Acción rápida
              </p>
              <p className="mt-2 font-heading text-lg font-semibold">
                Registrar préstamo
              </p>
            </div>
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2">
        <StatCard
          titulo="Préstamos activos"
          valor={stats.activos}
          icon={ArrowsRightLeftIcon}
          variant="accent"
        />
        <StatCard
          titulo="Préstamos vencidos"
          valor={stats.vencidos}
          icon={ExclamationTriangleIcon}
          variant={stats.vencidos > 0 ? "alert" : "default"}
          descripcion={
            stats.vencidos > 0
              ? "Requieren seguimiento inmediato."
              : "Sin atrasos registrados."
          }
        />
      </section>

      <SectionCard
        title="Vencidos esta semana"
        description="Préstamos que superaron su fecha de devolución."
      >
        <p className="text-sm text-muted-foreground">
          El detalle por usuario estará disponible próximamente.
        </p>
      </SectionCard>
    </div>
  );
}
