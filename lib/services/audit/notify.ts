import "server-only";

import { prisma } from "@/lib/db";

/**
 * Helper de auditoría mínima (CU-01 paso 6).
 * Crea una Notification asociada a un usuario. Reutilizable por otros CUs.
 *
 * Falla silenciosa: un error al auditar NO debe romper el flujo principal de
 * la DAL (la credencial ya se persistió transaccionalmente). Se loggea para
 * diagnóstico y se retorna `{ ok: false }` para que el caller decida.
 */
export async function notifyUser(
  userId: string,
  titulo: string,
  mensaje: string,
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<{ ok: true; id: string } | { ok: false }> {
  if (!userId || !titulo || !mensaje) return { ok: false };
  const client = tx ?? prisma;
  try {
    const notif = await client.notification.create({
      data: { userId, titulo, mensaje },
      select: { id: true },
    });
    return { ok: true, id: notif.id };
  } catch (e) {
    // Log controlado; no se lanza al caller para no corromper la transacción principal.
    console.error("[notifyUser] fallo de auditoría", {
      userId,
      titulo,
      err: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }
}
