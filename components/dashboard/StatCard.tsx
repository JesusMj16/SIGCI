import type { ComponentType, SVGProps } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";

type Variant = "default" | "accent" | "alert";

type Trend = {
  value: number;
  direction: "up" | "down";
};

type StatCardProps = {
  titulo: string;
  valor: string | number;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  descripcion?: string;
  variant?: Variant;
  trend?: Trend;
  loading?: boolean;
};

const SURFACE: Record<Variant, string> = {
  default: "bg-card",
  accent: "bg-primary/10",
  alert: "bg-secondary/10",
};

const ICON_BUBBLE: Record<Variant, string> = {
  default: "bg-primary/10 text-primary",
  accent: "bg-primary/20 text-primary",
  alert: "bg-secondary/20 text-secondary",
};

const VALUE_COLOR: Record<Variant, string> = {
  default: "text-primary",
  accent: "text-primary",
  alert: "text-secondary",
};

export function StatCard({
  titulo,
  valor,
  icon: Icon,
  descripcion,
  variant = "default",
  trend,
  loading = false,
}: StatCardProps) {
  const isAlert = variant === "alert";
  const displayValue =
    loading || valor === "" || valor === null || valor === undefined
      ? "—"
      : valor;

  return (
    <div className={clsx("rounded-2xl p-6", SURFACE[variant])}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {titulo}
        </p>
        {Icon && (
          <span
            aria-hidden="true"
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              ICON_BUBBLE[variant]
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      <p
        className={clsx(
          "mt-6 font-heading text-4xl font-bold tracking-tight md:text-5xl",
          VALUE_COLOR[variant],
          loading && "animate-pulse"
        )}
      >
        {loading ? (
          <span className="inline-block h-10 w-20 rounded-md bg-foreground/10" />
        ) : (
          displayValue
        )}
      </p>

      {(descripcion || trend) && (
        <div className="mt-4 flex items-center gap-3">
          {trend && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                trend.direction === "up"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/10 text-secondary"
              )}
            >
              {trend.direction === "up" ? (
                <ChevronUpIcon className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              )}
              {trend.value}%
            </span>
          )}
          {descripcion && (
            <p
              className={clsx(
                "text-xs",
                isAlert ? "text-secondary/80" : "text-muted-foreground"
              )}
            >
              {descripcion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
