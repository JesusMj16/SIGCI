import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Servicio de QR firmado para CU-01/CU-02/CU-03.
 *
 * Convención D4 (docs/Plan-Convergencia/GUIA-IMPLEMENTACION-CU-DETALLADA.md §CU-01 paso 5):
 *   qrData = `<userId>.<hmac>`
 *   hmac   = HMAC-SHA256(userId, QR_SECRET) en hex
 *
 * Seguridad:
 *  - server-only: el secreto NUNCA debe cruzar al cliente.
 *  - Si QR_SECRET no está configurado, falla cerrado (no se genera QR degradado).
 */

function getSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "QR_SECRET no configurado o demasiado corto. Configurar en .env.local (ver .env.example)."
    );
  }
  return secret;
}

/** Genera la cadena firmada que se almacena en Credential.qrData. */
export function generarQrData(userId: string): string {
  if (!userId) throw new Error("userId requerido para generar QR");
  const hmac = createHmac("sha256", getSecret()).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

/** Verificación en tiempo constante de un qrData firmado. Usada por CU-03. */
export function verificarQrData(
  qrData: string
): { ok: true; userId: string } | { ok: false; reason: "FORMAT" | "SIGNATURE" } {
  if (!qrData || typeof qrData !== "string") return { ok: false, reason: "FORMAT" };
  const idx = qrData.lastIndexOf(".");
  if (idx <= 0 || idx === qrData.length - 1) return { ok: false, reason: "FORMAT" };

  const userId = qrData.slice(0, idx);
  const providedHex = qrData.slice(idx + 1);

  const expectedHex = createHmac("sha256", getSecret())
    .update(userId)
    .digest("hex");

  if (providedHex.length !== expectedHex.length) {
    return { ok: false, reason: "SIGNATURE" };
  }

  const a = Buffer.from(providedHex, "hex");
  const b = Buffer.from(expectedHex, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "SIGNATURE" };
  }
  return { ok: true, userId };
}
