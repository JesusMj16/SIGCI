import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  aside?: ReactNode;
};

/**
 * Hero editorial reutilizable.
 *
 * - Sin `aside`: layout en columna (texto ocupa ancho completo).
 * - Con `aside`: layout asimetrico en `md+` (texto a la izquierda, slot
 *   lateral a la derecha con `min-w-[18rem]`).
 * - Eyebrow estilizado como chip tokenizado (`bg-primary/10 text-primary`),
 *   evitando colores ajenos al sistema (antes: `bg-amber-100`).
 */
export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  meta,
  aside,
}: DashboardHeroProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-8 rounded-3xl bg-card p-6 md:p-10",
        aside && "md:flex-row md:items-stretch md:justify-between md:gap-10"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {eyebrow && (
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-prose text-sm text-muted-foreground md:text-base">
            {subtitle}
          </p>
        )}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {meta}
          </div>
        )}
      </div>

      {aside && (
        <div className="w-full min-w-fit shrink-0 md:w-auto md:min-w-[18rem]">
          {aside}
        </div>
      )}
    </section>
  );
}
