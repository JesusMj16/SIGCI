import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { getServiciosEscolaresStats } from "@/lib/dal/stats/servicios-escolares";
import { StatCard } from "@/components/dashboard/StatCard";

const TIPO_LABEL: Record<string, string> = {
  CONSTANCIA: "Constancias",
  HISTORIAL: "Historiales",
  BAJA: "Bajas",
  REINSCRIPCION: "Reinscripciones",
  CERTIFICADO: "Certificados",
  OTRO: "Otros",
};

export default async function ServiciosEscolaresDashboard() {
  const stats = await getServiciosEscolaresStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard Servicios Escolares
      </h1>
      <p className="text-sm text-muted-foreground">
        Trámites pendientes por tipo
      </p>

      {stats.porTipo.length === 0 ? (
        <p className="text-muted-foreground">No hay trámites pendientes.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.porTipo.map(({ tipo, total }) => (
            <StatCard
              key={tipo}
              titulo={TIPO_LABEL[tipo] ?? tipo}
              valor={total}
              icon={DocumentTextIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
