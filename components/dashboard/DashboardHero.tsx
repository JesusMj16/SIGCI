import type { ReactNode } from "react";

type DashboardHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  aside?: ReactNode;
};

export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  meta,
  aside,
}: DashboardHeroProps) {
  return (
    <section className="flex flex-col gap-8 rounded-3xl bg-card p-6 md:flex-col md:items-stretch md:justify-between md:gap-10 md:p-10">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {eyebrow && (
          <p className="text-xs bg-amber-100 max-w-40 p-2 text-center rounded-2xl font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
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
