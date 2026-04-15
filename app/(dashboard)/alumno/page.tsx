import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { getAlumnoStats } from "@/lib/dal/stats/alumno";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

const DATE_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function AlumnoDashboard() {
  const [session, stats] = await Promise.all([auth(), getAlumnoStats()]);
  const nombre = session?.user?.name?.split(" ")[0] ?? "Alumno";
  const matricula = session?.user?.matricula ?? "—";
  const hoy = DATE_FMT.format(new Date());

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Panel académico"
        title={`Hola, ${nombre}`}
        subtitle="Tu progreso del ciclo en un solo vistazo."
        meta={
          <>
            <span>Matrícula · {matricula}</span>
            <span>Hoy · {hoy}</span>
          </>
        }
        aside={
          <div className="rounded-2xl bg-primary/10 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Promedio general
            </p>
            <p className="mt-3 font-heading text-5xl font-bold tracking-tight text-primary">
              {stats.promedio}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Calculado sobre calificaciones registradas.
            </p>
          </div>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Materias inscritas"
          valor={stats.materias}
          icon={BookOpenIcon}
          descripcion="Ciclo en curso"
        />
        <StatCard
          titulo="Tareas pendientes"
          valor={stats.pendientes}
          icon={ClipboardDocumentListIcon}
          variant={stats.pendientes > 0 ? "alert" : "default"}
          descripcion={
            stats.pendientes > 0
              ? "Revisa tus entregas próximas."
              : "Sin pendientes."
          }
        />
        <StatCard
          titulo="Promedio"
          valor={stats.promedio}
          icon={AcademicCapIcon}
          variant="accent"
          descripcion="Escala 0–10"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Próximas entregas"
          description="Lo que vence esta semana."
        >
          <p className="text-sm text-muted-foreground">
            Aún no hay entregas programadas visibles.
          </p>
        </SectionCard>

        <SectionCard
          title="Mis materias"
          description="Ciclo académico actual."
        >
          <p className="text-sm text-muted-foreground">
            Listado detallado disponible próximamente.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
