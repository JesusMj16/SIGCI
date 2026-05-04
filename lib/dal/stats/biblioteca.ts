import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";

export type BibliotecaStatsDTO = {
  activos: number;
  vencidos: number;
};

export const getBibliotecaStats = cache(async (): Promise<BibliotecaStatsDTO> => {
  await getAuthenticatedUser(["BIBLIOTECA"]);

  const [activos, vencidos] = await Promise.all([
    prisma.loan.count({ where: { status: "ACTIVO" } }),
    prisma.loan.count({ where: { status: "VENCIDO" } }),
  ]);

  return { activos, vencidos };
});
