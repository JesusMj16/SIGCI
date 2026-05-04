import {
  WrenchScrewdriverIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function TecnicoDashboard() {
  // Guard server-side: solo TECNICO accede (defensa en profundidad sobre proxy.ts)
  await getAuthenticatedUser(["TECNICO"]);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Técnico"
        title="Centro de operaciones"
        subtitle="Préstamos de material y control de inventario del laboratorio."
        meta={
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Técnico
          </span>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Préstamos activos"
          valor="—"
          icon={ArrowsRightLeftIcon}
          variant="accent"
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Material disponible"
          valor="—"
          icon={ClipboardDocumentListIcon}
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Mantenimientos pendientes"
          valor="—"
          icon={WrenchScrewdriverIcon}
          descripcion="Indicador pendiente de DAL."
        />
      </section>

      <SectionCard
        title="Préstamos recientes"
        description="Últimos movimientos de material registrados."
      >
        <p className="text-sm text-muted-foreground">
          El historial de préstamos estará disponible al conectar la DAL.
        </p>
      </SectionCard>

      <SectionCard
        title="Inventario"
        description="Estado actual del equipo y material del laboratorio."
      >
        <p className="text-sm text-muted-foreground">
          Próximamente: lista de equipos con estado y última revisión.
        </p>
      </SectionCard>
    </div>
  );
}
