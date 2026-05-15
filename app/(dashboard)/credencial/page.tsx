import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { obtenerCredencialPropia } from "@/lib/dal/users";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { CredentialCard } from "@/components/credential/CredentialCard";

const DATE_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function CredencialPage() {

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const nombreCompleto = session.user.name ?? "Usuario";
  const matricula = session.user.matricula ?? "—";

  if (session.user.status !== "ACTIVO") {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHero
          eyebrow="Credencial digital"
          title="Credencial no disponible"
          subtitle="Tu cuenta no tiene estatus activo. No es posible mostrar el QR."
          meta={
            <>
              <span>Usuario · {nombreCompleto}</span>
              <span>Estatus · {String(session.user.status)}</span>
            </>
          }
        />
        <SectionCard
          title="Estatus inactivo"
          description="Contacta al administrador para reactivar tu cuenta."
        >
          <p className="text-sm text-muted-foreground">
            Cuando tu estatus regrese a ACTIVO podrás visualizar y descargar tu
            credencial digital desde esta pantalla.
          </p>
        </SectionCard>
      </div>
    );
  }

  // Paso 4: recuperar credencial propia 
  const res = await obtenerCredencialPropia();

  if (!res.ok) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHero
          eyebrow="Credencial digital"
          title="No se pudo cargar tu credencial"
          subtitle={res.error}
          meta={<span>Matrícula · {matricula}</span>}
        />
        <SectionCard
          title="Error al consultar la credencial"
          description="Intenta recargar la página en unos minutos."
        >
          <p className="text-sm text-muted-foreground">
            Si el problema persiste, contacta al administrador del sistema.
          </p>
        </SectionCard>
      </div>
    );
  }

  const { tieneCredencial, credencialActiva, qrData, expiresAt } = res.data;

  // Excepción oficial: credencial aún no generada por CU-01.
  if (!tieneCredencial) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHero
          eyebrow="Credencial digital"
          title="Aún no tienes una credencial"
          subtitle="La credencial aún no ha sido generada para tu cuenta."
          meta={<span>Matrícula · {matricula}</span>}
        />
        <SectionCard
          title="Credencial no encontrada"
          description="Contacta al administrador para que genere tu credencial."
        >
          <p className="text-sm text-muted-foreground">
            Una vez generada la verás automáticamente en esta misma pantalla.
          </p>
        </SectionCard>
      </div>
    );
  }

  // Excepción: credencial revocada 
  if (!credencialActiva || !qrData) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHero
          eyebrow="Credencial digital"
          title="Credencial revocada"
          subtitle="Tu credencial no está activa en este momento."
          meta={<span>Matrícula · {matricula}</span>}
        />
        <SectionCard
          title="Credencial inactiva"
          description="Contacta al administrador para regenerarla."
        >
          <p className="text-sm text-muted-foreground">
            Por seguridad no se muestra el QR cuando la credencial está
            inactiva.
          </p>
        </SectionCard>
      </div>
    );
  }

  // Paso 5: mostrar QR. Flujo alternativo (descarga) vive en el cliente.
  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Credencial digital"
        title="Mi credencial"
        subtitle="Presenta este QR en los puntos de validación autorizados."
        meta={
          <>
            <span>Matrícula · {matricula}</span>
            {expiresAt && (
              <span>Vence · {DATE_FMT.format(new Date(expiresAt))}</span>
            )}
          </>
        }
      />

      <CredentialCard
        qrData={qrData}
        nombre={nombreCompleto}
        matricula={matricula}
        expiresAt={expiresAt}
      />
    </div>
  );
}
