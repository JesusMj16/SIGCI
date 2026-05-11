import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getTareaDetalleAlumno } from "@/lib/dal/tareas/alumno";
import { DashboardHero } from "@/components/dashboard/DashboardHero";

const FECHA_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export default async function TareaDetallePage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const result = await getTareaDetalleAlumno(assignmentId);

  if (!result.ok) {
    if (result.code === "NOT_FOUND") notFound();
    return (
      <div className="flex flex-col gap-6">
        <DashboardHero
          eyebrow="Tarea"
          title="Error al cargar la tarea"
          subtitle="Intenta recargar la página en unos segundos."
        />
      </div>
    );
  }

  const t = result.data;
  const fecha = FECHA_FMT.format(new Date(t.fechaLimite));
  const subtitulo =
    t.estado === "VENCIDA"
      ? `Venció el ${fecha}`
      : t.diasRestantes <= 0
        ? `Vence hoy · ${fecha}`
        : `Vence en ${t.diasRestantes} día${t.diasRestantes === 1 ? "" : "s"} · ${fecha}`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/alumno/tareas"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Volver a tareas pendientes
      </Link>

      <DashboardHero
        eyebrow={`${t.materia.codigo} · ${t.materia.nombre}`}
        title={t.titulo}
        subtitle={subtitulo}
        meta={
          <>
            <span data-testid="detalle-tipo">Tipo · {t.tipo}</span>
            <span data-testid="detalle-estado">Estado · {t.estado}</span>
            <span>Grupo · {t.grupo.nombre}</span>
          </>
        }
      />

      <section
        className="rounded-2xl border border-neutral-foreground/10 bg-card p-6"
        aria-labelledby="instrucciones-heading"
      >
        <h2
          id="instrucciones-heading"
          className="font-heading text-lg font-semibold text-primary"
        >
          Instrucciones
        </h2>
        <div className="mt-3 whitespace-pre-wrap text-sm text-neutral-foreground/80">
          {t.instrucciones?.trim()
            ? t.instrucciones
            : "El profesor no agregó instrucciones."}
        </div>
      </section>

      <section
        className="rounded-2xl border border-neutral-foreground/10 bg-card p-6"
        aria-labelledby="rubrica-heading"
      >
        <h2
          id="rubrica-heading"
          className="font-heading text-lg font-semibold text-primary"
        >
          Rúbrica de evaluación
        </h2>
        <div className="mt-3 whitespace-pre-wrap text-sm text-neutral-foreground/80">
          {t.rubrica?.trim() ? t.rubrica : "Sin rúbrica registrada."}
        </div>
      </section>
    </div>
  );
}
