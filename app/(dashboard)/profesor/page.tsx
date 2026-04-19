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
          <div className="flex gap-10 justify-center">
          <Link
            href="/profesor/calificar"
            className="flex max-w-40 max-h-15 text-center items-center rounded-2xl p-4 bg-secondary/10  transition hover:bg-secondary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
              <p className="font-heading text-lg font-semibold text-secondary">
                Calificar pendientes
              </p>
          </Link>
          <Link
            href="/profesor/perfil"
            className="flex w-40 max-w-40 max-h-15 text-center justify-center items-center rounded-2xl bg-primary p-4 transition hover:bg-primary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
              <p className=" font-heading text-lg font-semibold text-white">
                Ver Perfil
              </p>
          </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
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
