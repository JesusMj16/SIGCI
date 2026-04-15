import {
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function PersonalOperativoDashboard() {
  // Guard server-side: solo PERSONAL_OPERATIVO accede
  await getAuthenticatedUser(["PERSONAL_OPERATIVO"]);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Personal operativo"
        title="Tareas del día"
        subtitle="Seguimiento de mantenimiento y apoyo logístico del campus."
        meta={
          <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary">
            Operaciones
          </span>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Tareas asignadas"
          valor="—"
          icon={ClipboardDocumentListIcon}
          variant="accent"
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="En progreso"
          valor="—"
          icon={ClockIcon}
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Completadas hoy"
          valor="—"
          icon={CheckCircleIcon}
          descripcion="Indicador pendiente de DAL."
        />
      </section>

      <SectionCard
        title="Órdenes de mantenimiento"
        description="Solicitudes abiertas que requieren atención."
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <WrenchScrewdriverIcon className="h-4 w-4" aria-hidden="true" />
            Mantenimiento
          </span>
        }
      >
        <p className="text-sm text-muted-foreground">
          Aún no hay órdenes de mantenimiento registradas.
        </p>
      </SectionCard>

      <SectionCard
        title="Historial reciente"
        description="Últimas tareas cerradas por el equipo operativo."
      >
        <p className="text-sm text-muted-foreground">
          El historial detallado estará disponible al conectar la DAL.
        </p>
      </SectionCard>
    </div>
  );
}
