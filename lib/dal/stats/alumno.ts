import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";

export type AlumnoStatsDTO = {
  materias: number;
  pendientes: number;
  promedio: string;
};

export const getAlumnoStats = cache(async (): Promise<AlumnoStatsDTO> => {
  const { id: userId } = await getAuthenticatedUser(["ALUMNO"]);

  const [materias, pendientes, promedio] = await Promise.all([
    prisma.enrollment.count({ where: { studentId: userId } }),
    prisma.submission.count({
      where: { studentId: userId, status: "PENDIENTE" },
    }),
    prisma.grade.aggregate({
      where: { studentId: userId },
      _avg: { valor: true },
    }),
  ]);

  return {
    materias,
    pendientes,
    promedio: promedio._avg.valor?.toFixed(2) ?? "—",
  };
});
