import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import {
  getTareasPendientesAlumno,
  tieneInscripcionesActivas,
} from "@/lib/dal/tareas/alumno";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { TareasPendientesList } from "@/components/dashboard/tareas/TareasPendientesList";

export default async function AlumnoTareasPage() {
  const inscrito = await tieneInscripcionesActivas();

  if (!inscrito) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHero
          eyebrow="Panel académico"
          title="Tareas pendientes"
          subtitle="Tus entregas próximas en un solo lugar."
        />
        <EmptyState
          titulo="No estás inscrito en materias del periodo en curso"
          mensaje="Acude a Servicios Escolares para regularizar tu inscripción."
        />
      </div>
    );
  }

  const result = await getTareasPendientesAlumno();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHero
          eyebrow="Panel académico"
          title="Tareas pendientes"
          subtitle="Tus entregas próximas en un solo lugar."
        />
        <EmptyState
          titulo="Ocurrió un error al cargar tus tareas"
          mensaje="Intenta recargar la página en unos segundos."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Panel académico"
        title="Tareas pendientes"
        subtitle="Tus entregas próximas en un solo lugar."
        meta={<span>Total · {result.data.length}</span>}
      />
      <TareasPendientesList tareas={result.data} />
    </div>
  );
}

function EmptyState({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-foreground/20 bg-card/40 p-12 text-center">
      <ClipboardDocumentListIcon
        aria-hidden="true"
        className="h-12 w-12 text-neutral-foreground/40"
      />
      <h2 className="font-heading text-xl font-semibold text-primary">
        {titulo}
      </h2>
      <p className="max-w-md text-sm text-neutral-foreground/70">{mensaje}</p>
    </div>
  );
}
