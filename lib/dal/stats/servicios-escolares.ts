import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
import type { ProcedureType } from "@/lib/generated/prisma/enums";

export type ServiciosEscolaresStatsDTO = {
  porTipo: Array<{ tipo: ProcedureType; total: number }>;
};

export const getServiciosEscolaresStats = cache(
  async (): Promise<ServiciosEscolaresStatsDTO> => {
    await getAuthenticatedUser(["SERVICIOS_ESCOLARES"]);

    const rows = await prisma.procedure.groupBy({
      by: ["tipo"],
      where: { status: "PENDIENTE" },
      _count: { _all: true },
    });

    return {
      porTipo: rows.map((row) => ({ tipo: row.tipo, total: row._count._all })),
    };
  }
);
