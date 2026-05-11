import Link from "next/link";
import { clsx } from "clsx";
import type { TareaPendienteDTO } from "@/lib/dal/tareas/alumno";
import { hrefDetalle } from "@/lib/dal/tareas/helpers";

const FECHA_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

const URGENCIA_BADGE: Record<TareaPendienteDTO["urgencia"], string> = {
  alta: "bg-red-500/10 text-red-600 ring-red-500/30",
  media: "bg-amber-500/10 text-amber-600 ring-amber-500/30",
  baja: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
};

const URGENCIA_LABEL: Record<TareaPendienteDTO["urgencia"], string> = {
  alta: "Urgente",
  media: "Próxima",
  baja: "A tiempo",
};

const ESTADO_BADGE: Record<TareaPendienteDTO["estado"], string> = {
  PENDIENTE: "bg-primary/10 text-primary ring-primary/20",
  ENTREGADA: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
  VENCIDA: "bg-secondary/10 text-secondary ring-secondary/30",
};

export function TareaCard({ tarea }: { tarea: TareaPendienteDTO }) {
  const fecha = FECHA_FMT.format(new Date(tarea.fechaLimite));
  const subtitulo =
    tarea.estado === "VENCIDA"
      ? `Venció el ${fecha}`
      : tarea.diasRestantes <= 0
        ? `Vence hoy · ${fecha}`
        : `Vence en ${tarea.diasRestantes} día${tarea.diasRestantes === 1 ? "" : "s"} · ${fecha}`;

  return (
    <Link
      href={hrefDetalle(tarea)}
      data-testid="tarea-card"
      data-materia-id={tarea.materia.id}
      data-estado={tarea.estado}
      data-urgencia={tarea.urgencia}
      className="group flex flex-col gap-3 rounded-2xl border border-neutral-foreground/10 bg-card p-5 transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-foreground/60">
            {tarea.materia.codigo} · {tarea.materia.nombre}
          </p>
          <h3 className="mt-1 font-heading text-lg font-semibold text-primary group-hover:underline">
            {tarea.titulo}
          </h3>
        </div>
        <Badge className={ESTADO_BADGE[tarea.estado]}>{tarea.estado}</Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-foreground/70">{subtitulo}</p>
        <div className="flex items-center gap-2">
          <Badge className="bg-neutral-foreground/10 text-neutral-foreground/70 ring-neutral-foreground/15">
            {tarea.tipo}
          </Badge>
          <Badge className={URGENCIA_BADGE[tarea.urgencia]}>
            {URGENCIA_LABEL[tarea.urgencia]}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}
