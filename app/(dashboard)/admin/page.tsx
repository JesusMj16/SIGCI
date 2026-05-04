import Link from "next/link";
import {
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { getAdminStats } from "@/lib/dal/stats/admin";
import { ADMIN_QUICK_LINKS } from "@/lib/config/admin-links";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";

export default async function AdminDashboard() {
  const [session, stats] = await Promise.all([auth(), getAdminStats()]);
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const roleLabel = isAdmin ? "Administración" : "Coordinación";
  const roleHint = isAdmin
    ? "Acceso completo a la plataforma."
    : "Alcance limitado a tu coordinación.";

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Panel de control"
        title={roleLabel}
        subtitle={roleHint}
        meta={
          <>
            <span
              className={
                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider " +
                (isAdmin
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/10 text-secondary")
              }
            >
              {isAdmin ? "Administrador" : "Coordinador"}
            </span>
          </>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Usuarios totales"
          valor={stats.usuarios}
          icon={UsersIcon}
          variant="accent"
        />
        <StatCard
          titulo="Grupos activos"
          valor={stats.gruposActivos}
          icon={UserGroupIcon}
          descripcion="Ciclo en curso"
        />
        <StatCard
          titulo="Trámites pendientes"
          valor={stats.tramitesPendientes}
          icon={DocumentTextIcon}
          variant={stats.tramitesPendientes > 0 ? "alert" : "default"}
        />
      </section>

      <SectionCard
        title="Accesos rápidos"
        description="Operaciones frecuentes del panel."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {ADMIN_QUICK_LINKS.map(({ href, label, hint, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl bg-neutral p-5 transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-primary">
                  {label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {hint}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
