import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";

export type ProfesorStatsDTO = {
  grupos: number;
  porCalificar: number;
};

export const getProfesorStats = cache(async (): Promise<ProfesorStatsDTO> => {
  const { id: userId } = await getAuthenticatedUser(["PROFESOR"]);

  const [grupos, porCalificar] = await Promise.all([
    prisma.group.count({ where: { teacherId: userId } }),
    prisma.submission.count({
      where: {
        status: "ENTREGADO",
        assignment: { group: { teacherId: userId } },
      },
    }),
  ]);

  return { grupos, porCalificar };
});
