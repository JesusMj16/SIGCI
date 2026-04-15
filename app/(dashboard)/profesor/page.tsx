import Link from "next/link";
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { getProfesorStats } from "@/lib/dal/stats/profesor";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function ProfesorDashboard() {
  const [session, stats] = await Promise.all([auth(), getProfesorStats()]);
  const nombre = session?.user?.name?.split(" ")[0] ?? "Profesor";

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Panel docente"
        title={`Bienvenido, ${nombre}`}
        subtitle="Tus grupos y entregas por calificar de un vistazo."
        meta={<span>Rol · Profesor</span>}
        aside={
          <Link
            href="/profesor/calificar"
            className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/10 p-6 transition hover:bg-secondary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acción rápida
              </p>
              <p className="mt-2 font-heading text-lg font-semibold text-secondary">
                Calificar pendientes
              </p>
            </div>
            <ArrowRightIcon
              className="h-5 w-5 text-secondary"
              aria-hidden="true"
            />
          </Link>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2">
        <StatCard
          titulo="Grupos activos"
          valor={stats.grupos}
          icon={UserGroupIcon}
          variant="accent"
        />
        <StatCard
          titulo="Entregas por calificar"
          valor={stats.porCalificar}
          icon={ClipboardDocumentCheckIcon}
          variant={stats.porCalificar > 0 ? "alert" : "default"}
          descripcion={
            stats.porCalificar > 0
              ? "Tienes trabajo pendiente de revisión."
              : "Todo al día."
          }
        />
      </section>

      <SectionCard
        title="Mis grupos"
        description="Listado de grupos asignados al ciclo vigente."
      >
        <p className="text-sm text-muted-foreground">
          El desglose por grupo estará disponible próximamente.
        </p>
      </SectionCard>
    </div>
  );
}
