"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

/**
 * CU-02 — Tarjeta de credencial digital (Client Component).
 *
 * Responsabilidades:
 *  - Renderizar el QR a partir del `qrData` firmado por CU-01.
 *  - Descargar el QR como PNG (flujo alternativo §CU-02 paso 5).
 *  - Manejar error de render/descarga con opcion de reintento
 *    (§CU-02 paso 6: "try/catch alrededor de la lectura del data URL;
 *    fallback con boton 'Reintentar'").
 *
 * Seguridad:
 *  - No conoce el `userId`, no tiene acceso a la BD: recibe solo
 *    primitivos serializables desde el Server Component.
 *  - Todas las operaciones de descarga ocurren en el navegador sin
 *    llamadas adicionales al servidor (el QR ya esta en el DOM).
 *
 * Diseno:
 *  - Layout editorial en dos paneles (identidad + QR) en `md+` para reforzar
 *    la idea de "credencial" (tipografia jerarquica + chip "Activa").
 *  - En mobile se apila naturalmente (grid col-1).
 *
 * Performance (react-best-practices aplicado):
 *  - `qrcode` (libreria de descarga, ~40 KB) se importa dinamicamente dentro
 *    del handler, no en el top-level. Asi no infla el bundle inicial de
 *    `/credencial` — solo se carga al presionar "Descargar PNG".
 *  - `DATE_FMT` vive a nivel de modulo para no recrear el formatter por render.
 *  - Estado minimo y localizado; `renderKey` fuerza re-mount solo del QR,
 *    sin afectar al panel de identidad.
 */

const DATE_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type CredentialCardProps = {
  qrData: string;
  nombre: string;
  matricula: string;
  expiresAt: string | null;
};

export function CredentialCard({
  qrData,
  nombre,
  matricula,
  expiresAt,
}: CredentialCardProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  // `renderKey` fuerza el re-render del QR al hacer "Reintentar".
  const [renderKey, setRenderKey] = useState(0);

  async function descargarPng() {
    setDownloadError(null);
    setDownloading(true);
    try {
      // Carga diferida: evita incluir `qrcode` en el bundle inicial.
      const QRCode = (await import("qrcode")).default;
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, qrData, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `credencial-utm-${matricula || "usuario"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      setDownloadError(
        e instanceof Error
          ? e.message
          : "No fue posible generar el PNG de la credencial."
      );
    } finally {
      setDownloading(false);
    }
  }

  function reintentar() {
    setDownloadError(null);
    setRenderKey((k) => k + 1);
  }

  return (
    <section
      aria-label="Credencial digital del usuario"
      className="overflow-hidden rounded-3xl bg-card"
    >
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {/* Panel identidad institucional */}
        <div className="flex flex-col justify-between gap-10 bg-primary p-8 text-primary-foreground md:p-10">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              Universidad Tecnologica de la Mixteca
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
              Credencial digital
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {nombre}
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Matricula &middot;{" "}
              <span className="font-semibold text-primary-foreground">
                {matricula}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary-foreground">
              <CheckBadgeIcon className="size-3.5" aria-hidden />
              Activa
            </span>
            {expiresAt && (
              <p className="text-xs text-primary-foreground/70">
                Vence &middot; {DATE_FMT.format(new Date(expiresAt))}
              </p>
            )}
          </div>
        </div>

        {/* Panel QR + acciones */}
        <div className="flex flex-col items-center justify-center gap-6 p-8 md:p-10">
          <div
            className="flex w-full max-w-[18rem] items-center justify-center rounded-2xl bg-neutral p-5"
            role="img"
            aria-label="Codigo QR de la credencial"
          >
            <QRCodeSVG
              key={renderKey}
              value={qrData}
              // `size` como numero bruto lo renderiza en px; aqui forzamos
              // escalado fluido al contenedor con style 100%.
              size={256}
              style={{ width: "100%", height: "auto" }}
              bgColor="#ffffff"
              fgColor="#0B5471"
              level="M"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Presenta este QR en los puntos de validacion autorizados.
          </p>

          <div className="flex w-full flex-col items-center gap-3">
            <Button
              onClick={descargarPng}
              disabled={downloading}
              size="lg"
              className="w-full max-w-[18rem]"
              aria-busy={downloading}
            >
              <ArrowDownTrayIcon className="size-4" aria-hidden />
              {downloading ? "Generando..." : "Descargar PNG"}
            </Button>

            {downloadError && (
              <div
                role="alert"
                className="flex w-full max-w-[18rem] flex-col items-center gap-2 rounded-lg bg-destructive/10 px-3 py-3 text-center"
              >
                <p className="text-sm text-destructive">{downloadError}</p>
                <Button variant="outline" size="sm" onClick={reintentar}>
                  <ArrowPathIcon className="size-4" aria-hidden />
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
