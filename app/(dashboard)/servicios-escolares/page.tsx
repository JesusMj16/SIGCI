import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { getServiciosEscolaresStats } from "@/lib/dal/stats/servicios-escolares";
import { labelForProcedureType } from "@/lib/procedure-labels";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function ServiciosEscolaresDashboard() {
  const stats = await getServiciosEscolaresStats();

  const ordenados = [...stats.porTipo].sort((a, b) => b.total - a.total);
  const totalPendientes = ordenados.reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Servicios Escolares"
        title="Bandeja de trámites"
        subtitle="Todos los trámites pendientes agrupados por tipo."
        aside={
          <div className="rounded-2xl bg-primary/10 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pendientes totales
            </p>
            <p className="mt-3 font-heading text-5xl font-bold tracking-tight text-primary">
              {totalPendientes}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              En todas las categorías.
            </p>
          </div>
        }
      />

      <SectionCard
        title="Trámites por tipo"
        description="Ordenados por volumen pendiente."
      >
        {ordenados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay trámites pendientes por ahora.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordenados.map(({ tipo, total }) => (
              <li key={tipo}>
                <div className="flex items-center gap-4 rounded-xl bg-neutral p-5">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {labelForProcedureType(tipo)}
                  </span>
                  <p className="font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl">
                    {total}
                  </p>
                  <Link
                    href={`/servicios-escolares/tramites?tipo=${tipo}`}
                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-card px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral"
                  >
                    Revisar
                    <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
