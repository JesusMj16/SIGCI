import {
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function DirectorDashboard() {
  // Guard server-side: solo DIRECTOR accede (defensa en profundidad sobre proxy.ts)
  await getAuthenticatedUser(["DIRECTOR"]);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Dirección"
        title="Panorama institucional"
        subtitle="Indicadores agregados de la comunidad académica."
        meta={
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Director
          </span>
        }
        aside={
          <div className="rounded-2xl bg-primary/10 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
              Reportes
            </p>
            <p className="mt-2 font-heading text-lg font-semibold text-primary">
              Centro de reportes
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Consulta indicadores detallados y exporta informes.
            </p>
          </div>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          titulo="Matrícula total"
          valor="—"
          icon={AcademicCapIcon}
          variant="accent"
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Docentes activos"
          valor="—"
          icon={UserGroupIcon}
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Grupos en curso"
          valor="—"
          icon={ChartBarIcon}
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Trámites abiertos"
          valor="—"
          icon={DocumentTextIcon}
          descripcion="Indicador pendiente de DAL."
        />
      </section>

      <SectionCard
        title="Indicadores por programa"
        description="Vista comparativa por licenciatura y posgrado."
      >
        <p className="text-sm text-muted-foreground">
          Próximamente: matrícula por programa, promedio global y tasa de
          aprobación por periodo.
        </p>
      </SectionCard>

      <SectionCard
        title="Reportes recientes"
        description="Documentos generados por el equipo directivo."
      >
        <p className="text-sm text-muted-foreground">
          Aún no hay reportes disponibles.
        </p>
      </SectionCard>
    </div>
  );
}
