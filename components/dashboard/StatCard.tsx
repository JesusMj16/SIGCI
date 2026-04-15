import type { ComponentType, SVGProps } from "react";

type StatCardProps = {
  titulo: string;
  valor: string | number;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  descripcion?: string;
};

export function StatCard({ titulo, valor, icon: Icon, descripcion }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        {Icon && <Icon className="h-5 w-5 text-primary" aria-hidden="true" />}
      </div>
      <p className="mt-2 font-heading text-3xl font-bold text-primary">{valor}</p>
      {descripcion && (
        <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>
      )}
    </div>
  );
}
