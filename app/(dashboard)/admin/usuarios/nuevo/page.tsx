import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { getAuthenticatedUser } from "@/lib/dal/session";
import { NuevoUsuarioForm } from "./form";

export default async function NuevoUsuarioPage() {
  // Guard doble: además del proxy (/admin/**), la DAL volverá a verificar.
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Nuevo usuario"
        title="Alta con credencial digital"
        subtitle="Al confirmar, el sistema genera un QR único firmado (HMAC) y lo almacena en el perfil del usuario."
        aside={
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-2 rounded-full bg-neutral px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Volver al listado
          </Link>
        }
      />

      <SectionCard
        title="Datos del usuario"
        description="Todos los campos son obligatorios. El estatus inicial es ACTIVO."
      >
        <NuevoUsuarioForm />
      </SectionCard>
    </div>
  );
}
