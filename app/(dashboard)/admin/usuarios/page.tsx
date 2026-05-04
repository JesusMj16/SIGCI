import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/button";
import { obtenerUsuariosAdmin } from "@/lib/dal/users";
import { ROLE_LABEL } from "@/lib/presentation/user-display";
import { ReactivarUsuarioButton } from "./reactivar-button";

export default async function AdminUsuariosPage() {
  // Guard doble (DAL + proxy). La DAL ya fuerza ADMIN|COORDINADOR.
  const result = await obtenerUsuariosAdmin();

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Gestión de usuarios"
        title="Usuarios del sistema"
        subtitle="Alta de usuarios con generación automática de credencial digital (QR firmado)."
        aside={
          <Link
            href="/admin/usuarios/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nuevo usuario
          </Link>
        }
      />

      <SectionCard
        title="Listado"
        description="Últimos 100 usuarios registrados."
      >
        {!result.ok ? (
          <p className="text-sm text-destructive">
            Error al cargar usuarios: {result.error}
          </p>
        ) : result.data.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Aún no hay usuarios registrados.
            </p>
            <Link href="/admin/usuarios/nuevo">
              <Button>Crear primer usuario</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/40">
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3">Credencial</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{u.matricula}</td>
                    <td className="px-4 py-3">
                      {u.nombre} {u.apellidos}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider " +
                          (u.status === "ACTIVO"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/10 text-secondary")
                        }
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.credencialActiva ? (
                        <span className="text-xs text-primary">Activa</span>
                      ) : u.tieneCredencial ? (
                        <span className="text-xs text-muted-foreground">
                          Inactiva
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin credencial
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!u.credencialActiva && (
                        <ReactivarUsuarioButton userId={u.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
