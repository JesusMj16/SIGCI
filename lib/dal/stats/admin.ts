import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";

export type AdminStatsDTO = {
  usuarios: number;
  gruposActivos: number;
  tramitesPendientes: number;
};

export const getAdminStats = cache(async (): Promise<AdminStatsDTO> => {
  await getAuthenticatedUser(["ADMIN", "COORDINADOR"]);

  const [usuarios, gruposActivos, tramitesPendientes] = await Promise.all([
    prisma.user.count(),
    prisma.group.count({ where: { period: { isActive: true } } }),
    prisma.procedure.count({ where: { status: "PENDIENTE" } }),
  ]);

  return { usuarios, gruposActivos, tramitesPendientes };
});
