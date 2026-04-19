import {
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function JefeCarreraDashboard() {
  // Guard server-side: solo JEFE_CARRERA accede (defensa en profundidad sobre proxy.ts)
  await getAuthenticatedUser(["JEFE_CARRERA"]);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Jefatura de carrera"
        title="Gestión de programa académico"
        subtitle="Indicadores del programa, docentes y avance curricular."
        meta={
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Jefe de Carrera
          </span>
        }
        aside={
          <div className="rounded-2xl bg-primary/10 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
              Programa
            </p>
            <p className="mt-2 font-heading text-lg font-semibold text-primary">
              Panel de indicadores
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Matrícula, aprobación y eficiencia terminal.
            </p>
          </div>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          titulo="Alumnos inscritos"
          valor="—"
          icon={AcademicCapIcon}
          variant="accent"
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Docentes asignados"
          valor="—"
          icon={UserGroupIcon}
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Grupos activos"
          valor="—"
          icon={ChartBarIcon}
          descripcion="Indicador pendiente de DAL."
        />
        <StatCard
          titulo="Trámites de carrera"
          valor="—"
          icon={DocumentTextIcon}
          descripcion="Indicador pendiente de DAL."
        />
      </section>

      <SectionCard
        title="Docentes del programa"
        description="Profesores asignados al programa académico."
      >
        <p className="text-sm text-muted-foreground">
          La lista de docentes estará disponible al conectar la DAL.
        </p>
      </SectionCard>

      <SectionCard
        title="Indicadores de rendimiento"
        description="Tasa de aprobación, promedio general y eficiencia terminal."
      >
        <p className="text-sm text-muted-foreground">
          Próximamente: gráficas comparativas por periodo.
        </p>
      </SectionCard>
    </div>
  );
}
