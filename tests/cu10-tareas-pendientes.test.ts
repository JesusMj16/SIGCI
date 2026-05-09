import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__REDIRECT__:${url}`);
  },
}));

const authMock = vi.fn();
vi.mock("@/lib/dal/session", () => ({
  getAuthenticatedUser: (...args: unknown[]) =>
    (authMock as (...a: unknown[]) => unknown)(...args),
}));

type FakeSubmissionRow = {
  id: string;
  studentId: string;
  status: "PENDIENTE" | "ENTREGADO" | "CALIFICADO";
  assignment: {
    id: string;
    titulo: string;
    tipo: "TAREA" | "EXAMEN" | "PROYECTO";
    status: "BORRADOR" | "PUBLICADO" | "CERRADO";
    fechaLimite: Date;
    group: {
      id: string;
      nombre: string;
      period: { isActive: boolean };
      enrollments: { studentId: string }[];
      subject: { id: string; nombre: string; codigo: string };
    };
  };
};

const state: {
  submissions: FakeSubmissionRow[];
  enrollments: { studentId: string; periodActive: boolean }[];
  lastFindManyArgs: unknown;
} = { submissions: [], enrollments: [], lastFindManyArgs: undefined };

const prismaMock = {
  submission: {
    findMany: vi.fn(async (args: { where: Record<string, unknown> }) => {
      state.lastFindManyArgs = args;
      const rows = state.submissions.filter((r) => {
        if (r.studentId !== args.where.studentId) return false;
        if (r.status !== "PENDIENTE") return false;
        if (r.assignment.status !== "PUBLICADO") return false;
        if (!r.assignment.group.period.isActive) return false;
        const enrolled = r.assignment.group.enrollments.some(
          (e) => e.studentId === args.where.studentId
        );
        if (!enrolled) return false;
        return true;
      });
      return rows.sort(
        (a, b) =>
          a.assignment.fechaLimite.getTime() -
          b.assignment.fechaLimite.getTime()
      );
    }),
  },
  enrollment: {
    count: vi.fn(async (args: { where: { studentId: string } }) => {
      return state.enrollments.filter(
        (e) => e.studentId === args.where.studentId && e.periodActive
      ).length;
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

function reset() {
  state.submissions = [];
  state.enrollments = [];
  state.lastFindManyArgs = undefined;
  authMock.mockReset();
  prismaMock.submission.findMany.mockClear();
  prismaMock.enrollment.count.mockClear();
}

function fechaEnDias(dias: number): Date {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
}

function makeSubmission(
  id: string,
  studentId: string,
  diasParaVencer: number,
  override: Partial<FakeSubmissionRow["assignment"]> & {
    materiaId?: string;
    materiaNombre?: string;
    materiaCodigo?: string;
  } = {}
): FakeSubmissionRow {
  return {
    id,
    studentId,
    status: "PENDIENTE",
    assignment: {
      id: `a_${id}`,
      titulo: override.titulo ?? `Tarea ${id}`,
      tipo: override.tipo ?? "TAREA",
      status: override.status ?? "PUBLICADO",
      fechaLimite: override.fechaLimite ?? fechaEnDias(diasParaVencer),
      group: {
        id: "g1",
        nombre: "Grupo A",
        period: { isActive: true },
        enrollments: [{ studentId }],
        subject: {
          id: override.materiaId ?? "subj_1",
          nombre: override.materiaNombre ?? "Programación",
          codigo: override.materiaCodigo ?? "PRG-101",
        },
      },
    },
  };
}

describe("CU-10 — Tareas Pendientes del Alumno", () => {
  beforeEach(() => {
    reset();
    authMock.mockResolvedValue({ id: "alumno_1", role: "ALUMNO" });
  });

  it("Prueba 1: alumno con submissions PENDIENTE ve lista ordenada por fechaLimite asc", async () => {
    state.submissions = [
      makeSubmission("s2", "alumno_1", 10),
      makeSubmission("s1", "alumno_1", 1),
      makeSubmission("s3", "alumno_1", 5),
    ];

    const { getTareasPendientesAlumno } = await import(
      "@/lib/dal/tareas/alumno"
    );
    const res = await getTareasPendientesAlumno();

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.map((t) => t.submissionId)).toEqual(["s1", "s3", "s2"]);
    expect(res.data[0].urgencia).toBe("alta");
    expect(res.data[1].urgencia).toBe("media");
    expect(res.data[2].urgencia).toBe("baja");
    expect(res.data.every((t) => t.estado === "PENDIENTE")).toBe(true);
  });

  it("Prueba 2: filtro por materia funciona", async () => {
    const { filtrarPorMateria } = await import("@/lib/dal/tareas/helpers");
    const tareas = [
      { ...makeFakeDTO("t1"), materia: { id: "m1", nombre: "A", codigo: "A" } },
      { ...makeFakeDTO("t2"), materia: { id: "m2", nombre: "B", codigo: "B" } },
      { ...makeFakeDTO("t3"), materia: { id: "m1", nombre: "A", codigo: "A" } },
    ];

    expect(filtrarPorMateria(tareas, null)).toHaveLength(3);
    const soloM1 = filtrarPorMateria(tareas, "m1");
    expect(soloM1).toHaveLength(2);
    expect(soloM1.every((t) => t.materia.id === "m1")).toBe(true);
  });

  it("Prueba 3: cambio de criterio de orden actualiza la lista (sin recarga)", async () => {
    const { ordenarTareas } = await import("@/lib/dal/tareas/helpers");
    const tareas = [
      {
        ...makeFakeDTO("t1"),
        fechaLimite: fechaEnDias(10).toISOString(),
        materia: { id: "m1", nombre: "Zoología", codigo: "Z" },
        tipo: "EXAMEN" as const,
        estado: "PENDIENTE" as const,
      },
      {
        ...makeFakeDTO("t2"),
        fechaLimite: fechaEnDias(1).toISOString(),
        materia: { id: "m2", nombre: "Algoritmos", codigo: "A" },
        tipo: "TAREA" as const,
        estado: "VENCIDA" as const,
      },
    ];

    expect(ordenarTareas(tareas, "fecha").map((t) => t.submissionId)).toEqual([
      "t2",
      "t1",
    ]);
    expect(ordenarTareas(tareas, "materia").map((t) => t.submissionId)).toEqual(
      ["t2", "t1"]
    );
    expect(ordenarTareas(tareas, "estado").map((t) => t.submissionId)).toEqual([
      "t2",
      "t1",
    ]);
    expect(ordenarTareas(tareas, "tipo").map((t) => t.submissionId)).toEqual([
      "t1",
      "t2",
    ]);
  });

  it("Prueba 4: click en tarea navega al detalle", async () => {
    const { hrefDetalle } = await import("@/lib/dal/tareas/helpers");
    const tarea = { ...makeFakeDTO("s1"), assignmentId: "a_42" };
    expect(hrefDetalle(tarea)).toBe("/alumno/tareas/a_42");
  });

  it("Prueba 5: alumno sin tareas → DAL devuelve lista vacía (UI muestra '¡Estás al día!')", async () => {
    state.submissions = [];

    const { getTareasPendientesAlumno } = await import(
      "@/lib/dal/tareas/alumno"
    );
    const res = await getTareasPendientesAlumno();

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toEqual([]);
  });

  it("Prueba 6: alumno sin inscripciones → tieneInscripcionesActivas devuelve false", async () => {
    state.enrollments = [];

    const { tieneInscripcionesActivas } = await import(
      "@/lib/dal/tareas/alumno"
    );
    const tiene = await tieneInscripcionesActivas();

    expect(tiene).toBe(false);

    state.enrollments = [{ studentId: "alumno_1", periodActive: true }];
    const tiene2 = await tieneInscripcionesActivas();
    expect(tiene2).toBe(true);
  });

  it("Prueba 7: aislamiento — alumno NO ve submissions de otros alumnos", async () => {
    state.submissions = [
      makeSubmission("mia", "alumno_1", 3),
      makeSubmission("ajena", "alumno_2", 1),
    ];

    const { getTareasPendientesAlumno } = await import(
      "@/lib/dal/tareas/alumno"
    );
    const res = await getTareasPendientesAlumno();

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toHaveLength(1);
    expect(res.data[0].submissionId).toBe("mia");

    const args = state.lastFindManyArgs as {
      where: { studentId: string };
    };
    expect(args.where.studentId).toBe("alumno_1");
  });
});

function makeFakeDTO(id: string) {
  return {
    submissionId: id,
    assignmentId: `a_${id}`,
    titulo: `Tarea ${id}`,
    tipo: "TAREA" as const,
    fechaLimite: fechaEnDias(5).toISOString(),
    diasRestantes: 5,
    urgencia: "media" as const,
    estado: "PENDIENTE" as const,
    materia: { id: "m1", nombre: "Mat", codigo: "M" },
    grupo: { id: "g1", nombre: "G" },
  };
}
