"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

/**
 * CU-02 — Tarjeta de credencial digital (Client Component).
 *
 * Responsabilidades:
 *  - Renderizar el QR a partir del `qrData` firmado por CU-01.
 *  - Descargar el QR como PNG (flujo alternativo §CU-02 paso 5).
 *  - Manejar error de render/descarga con opción de reintento
 *    (§CU-02 paso 6: "try/catch alrededor de la lectura del data URL;
 *    fallback con botón 'Reintentar'").
 *
 * Seguridad:
 *  - No conoce el `userId`, no tiene acceso a la BD: recibe solo
 *    primitivos serializables desde el Server Component.
 *  - Todas las operaciones de descarga ocurren en el navegador sin
 *    llamadas adicionales al servidor (el QR ya está en el DOM).
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
      // Render offscreen en un canvas alto (1024px) para un PNG nítido
      // escaneable desde una impresión A4.
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
    // Forzamos nueva clave para que QRCodeSVG se re-monte.
    setRenderKey((k) => k + 1);
  }

  return (
    <section
      aria-label="Credencial digital del usuario"
      className="rounded-3xl bg-card p-6 md:p-10"
    >
      <div className="flex flex-col items-center gap-6">
        <header className="flex flex-col items-center text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Universidad Tecnológica de la Mixteca
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-primary">
            {nombre}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Matrícula · {matricula}
          </p>
        </header>

        {/* Contenedor responsivo: ancho fluido hasta 22rem. */}
        <div className="flex w-full max-w-[22rem] items-center justify-center rounded-2xl bg-neutral p-6">
          <QRCodeSVG
            key={renderKey}
            value={qrData}
            // `size` como número bruto lo renderiza en px; aquí forzamos
            // escalado fluido al contenedor con style 100%.
            size={256}
            style={{ width: "100%", height: "auto" }}
            bgColor="#ffffff"
            fgColor="#0B5471"
            level="M"
            aria-label="Código QR de la credencial"
          />
        </div>

        {expiresAt && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Vence · {DATE_FMT.format(new Date(expiresAt))}
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={descargarPng}
            disabled={downloading}
            size="lg"
            aria-busy={downloading}
          >
            <ArrowDownTrayIcon className="size-4" aria-hidden />
            {downloading ? "Generando…" : "Descargar PNG"}
          </Button>

          {downloadError && (
            <div
              role="alert"
              className="flex flex-col items-center gap-2 text-center"
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
    </section>
  );
}
