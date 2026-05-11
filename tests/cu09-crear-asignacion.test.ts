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

// ── Estado del fake Prisma ─────────────────────────────────────────────────

type GroupRow = {
  id: string;
  teacherId: string;
  period: { isActive: boolean; startDate: Date; endDate: Date };
  enrollments: { studentId: string }[];
};

type AssignmentRow = {
  id: string;
  groupId: string;
  titulo: string;
  instrucciones: string;
  tipo: string;
  status: string;
  fechaLimite: Date;
  rubrica: string | null;
};

type SubmissionRow = {
  assignmentId: string;
  studentId: string;
  status: string;
  intento: number;
};

const state = {
  groups: [] as GroupRow[],
  assignments: [] as AssignmentRow[],
  submissions: [] as SubmissionRow[],
  /** Si true, fuerza fallo de createMany para probar rollback. */
  failCreateManyOnGroup: null as string | null,
  assignmentCounter: 0,
};

const prismaMock = {
  group: {
    findMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
      const ids = new Set(args.where.id.in);
      return state.groups.filter((g) => ids.has(g.id));
    }),
  },
  $transaction: vi.fn(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => {
    // Snapshot para rollback simulado.
    const snapAssign = [...state.assignments];
    const snapSubs = [...state.submissions];
    try {
      return await fn(prismaMock);
    } catch (e) {
      state.assignments = snapAssign;
      state.submissions = snapSubs;
      throw e;
    }
  }),
  assignment: {
    create: vi.fn(async (args: { data: Omit<AssignmentRow, "id"> }) => {
      const id = `asg_${++state.assignmentCounter}`;
      const row: AssignmentRow = { id, ...args.data };
      state.assignments.push(row);
      return { id };
    }),
  },
  submission: {
    createMany: vi.fn(async (args: { data: SubmissionRow[] }) => {
      const groupIdOfFirst = state.assignments.find(
        (a) => a.id === args.data[0]?.assignmentId
      )?.groupId;
      if (
        state.failCreateManyOnGroup &&
        groupIdOfFirst === state.failCreateManyOnGroup
      ) {
        throw new Error("DB simulated failure");
      }
      state.submissions.push(...args.data);
      return { count: args.data.length };
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

// ── Helpers ────────────────────────────────────────────────────────────────

function reset() {
  state.groups = [];
  state.assignments = [];
  state.submissions = [];
  state.failCreateManyOnGroup = null;
  state.assignmentCounter = 0;
  authMock.mockReset();
  prismaMock.group.findMany.mockClear();
  prismaMock.$transaction.mockClear();
  prismaMock.assignment.create.mockClear();
  prismaMock.submission.createMany.mockClear();
}

function daysFromNow(d: number): Date {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000);
}

function makeGroup(
  id: string,
  teacherId: string,
  opts: {
    enrollments?: string[];
    periodActive?: boolean;
    periodStart?: Date;
    periodEnd?: Date;
  } = {}
): GroupRow {
  return {
    id,
    teacherId,
    period: {
      isActive: opts.periodActive ?? true,
      startDate: opts.periodStart ?? daysFromNow(-30),
      endDate: opts.periodEnd ?? daysFromNow(60),
    },
    enrollments: (opts.enrollments ?? []).map((studentId) => ({ studentId })),
  };
}

const VALID_INPUT_BASE = {
  tipo: "TAREA" as const,
  titulo: "Práctica 3",
  instrucciones: "Resuelve los ejercicios del capítulo 4.",
  fechaLimite: daysFromNow(7).toISOString(),
  rubrica: null as string | null,
};

describe("CU-09 — Crear y Publicar Asignación", () => {
  beforeEach(() => {
    reset();
    authMock.mockResolvedValue({ id: "prof_1", role: "PROFESOR" });
    // Silenciamos el console.log de la notificación durante los tests.
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  // ── Validación de input ─────────────────────────────────────────────────

  it("Prueba 1: rechaza título vacío con ValidationError", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: ["a1"] })];
    const { crearAsignacion, ValidationError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        titulo: "   ",
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("Prueba 2: rechaza instrucciones vacías", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: ["a1"] })];
    const { crearAsignacion, ValidationError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        instrucciones: "",
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("Prueba 3: rechaza groupIds vacío", async () => {
    const { crearAsignacion, ValidationError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({ ...VALID_INPUT_BASE, groupIds: [], modo: "PUBLICAR" })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // ── Fechas ──────────────────────────────────────────────────────────────

  it("Prueba 4: rechaza fecha pasada con FechaInvalidaError", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: ["a1"] })];
    const { crearAsignacion, FechaInvalidaError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        fechaLimite: daysFromNow(-1).toISOString(),
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(FechaInvalidaError);
  });

  it("Prueba 5: rechaza fecha NaN", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: ["a1"] })];
    const { crearAsignacion, FechaInvalidaError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        fechaLimite: "no-es-fecha",
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(FechaInvalidaError);
  });

  it("Prueba 6: rechaza fecha fuera del rango del periodo", async () => {
    state.groups = [
      makeGroup("g1", "prof_1", {
        enrollments: ["a1"],
        periodEnd: daysFromNow(5),
      }),
    ];
    const { crearAsignacion, FechaInvalidaError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        fechaLimite: daysFromNow(30).toISOString(),
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(FechaInvalidaError);
  });

  // ── Autorización / ownership ────────────────────────────────────────────

  it("Prueba 7: rechaza grupo ajeno con ForbiddenError", async () => {
    state.groups = [makeGroup("g1", "prof_OTRO", { enrollments: ["a1"] })];
    const { crearAsignacion, ForbiddenError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("Prueba 8: rechaza groupIds inexistentes con ForbiddenError", async () => {
    state.groups = [];
    const { crearAsignacion, ForbiddenError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        groupIds: ["g_fantasma"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("Prueba 9: rechaza periodo inactivo con PeriodoCerradoError", async () => {
    state.groups = [
      makeGroup("g1", "prof_1", {
        enrollments: ["a1"],
        periodActive: false,
      }),
    ];
    const { crearAsignacion, PeriodoCerradoError } = await import(
      "@/lib/dal/asignaciones"
    );
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        groupIds: ["g1"],
        modo: "PUBLICAR",
      })
    ).rejects.toBeInstanceOf(PeriodoCerradoError);
  });

  // ── Modo BORRADOR ───────────────────────────────────────────────────────

  it("Prueba 10: BORRADOR crea Assignment con status BORRADOR sin Submissions ni notificaciones", async () => {
    state.groups = [
      makeGroup("g1", "prof_1", { enrollments: ["a1", "a2", "a3"] }),
    ];
    const logSpy = vi.spyOn(console, "log");
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    const res = await crearAsignacion({
      ...VALID_INPUT_BASE,
      groupIds: ["g1"],
      modo: "BORRADOR",
    });

    expect(res.asignacionesCreadas).toHaveLength(1);
    expect(res.submissionsCreadas).toBe(0);
    expect(res.notificacionesEnviadas).toBe(0);
    expect(state.assignments[0].status).toBe("BORRADOR");
    expect(state.submissions).toHaveLength(0);
    expect(prismaMock.submission.createMany).not.toHaveBeenCalled();
    expect(
      logSpy.mock.calls.some((c) => String(c[0]).includes("[CU-09][notificacion]"))
    ).toBe(false);
  });

  // ── Modo PUBLICAR ───────────────────────────────────────────────────────

  it("Prueba 11: PUBLICAR crea Assignment + Submissions PENDIENTE y notifica a cada alumno", async () => {
    state.groups = [
      makeGroup("g1", "prof_1", { enrollments: ["a1", "a2"] }),
    ];
    const logSpy = vi.spyOn(console, "log");
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    const res = await crearAsignacion({
      ...VALID_INPUT_BASE,
      groupIds: ["g1"],
      modo: "PUBLICAR",
    });

    expect(res.asignacionesCreadas).toHaveLength(1);
    expect(res.submissionsCreadas).toBe(2);
    expect(res.notificacionesEnviadas).toBe(2);
    expect(state.assignments[0].status).toBe("PUBLICADO");
    expect(state.submissions).toHaveLength(2);
    expect(state.submissions.every((s) => s.status === "PENDIENTE")).toBe(true);
    expect(state.submissions.every((s) => s.intento === 1)).toBe(true);
    expect(
      logSpy.mock.calls.some((c) => String(c[0]).includes("[CU-09][notificacion]"))
    ).toBe(true);
  });

  it("Prueba 12: PUBLICAR multi-grupo crea N Assignments y Σ Submissions", async () => {
    state.groups = [
      makeGroup("g1", "prof_1", { enrollments: ["a1", "a2"] }),
      makeGroup("g2", "prof_1", { enrollments: ["b1"] }),
    ];
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    const res = await crearAsignacion({
      ...VALID_INPUT_BASE,
      groupIds: ["g1", "g2"],
      modo: "PUBLICAR",
    });

    expect(res.asignacionesCreadas).toHaveLength(2);
    expect(res.submissionsCreadas).toBe(3);
    expect(res.notificacionesEnviadas).toBe(3);
    expect(state.assignments).toHaveLength(2);
    expect(state.submissions).toHaveLength(3);
  });

  it("Prueba 13: multi-grupo es atómico — fallo en uno revierte todos", async () => {
    state.groups = [
      makeGroup("g1", "prof_1", { enrollments: ["a1"] }),
      makeGroup("g2", "prof_1", { enrollments: ["b1"] }),
    ];
    state.failCreateManyOnGroup = "g2";
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    await expect(
      crearAsignacion({
        ...VALID_INPUT_BASE,
        groupIds: ["g1", "g2"],
        modo: "PUBLICAR",
      })
    ).rejects.toThrow("DB simulated failure");

    // Tras rollback simulado, ningún Assignment ni Submission persistido.
    expect(state.assignments).toHaveLength(0);
    expect(state.submissions).toHaveLength(0);
  });

  it("Prueba 14: PUBLICAR grupo sin enrollments no crea Submissions pero sí Assignment", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: [] })];
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    const res = await crearAsignacion({
      ...VALID_INPUT_BASE,
      groupIds: ["g1"],
      modo: "PUBLICAR",
    });

    expect(res.asignacionesCreadas).toHaveLength(1);
    expect(res.submissionsCreadas).toBe(0);
    expect(res.notificacionesEnviadas).toBe(0);
    expect(state.assignments[0].status).toBe("PUBLICADO");
  });

  // ── Higiene de entrada ──────────────────────────────────────────────────

  it("Prueba 15: trimea título, instrucciones y rúbrica antes de persistir", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: ["a1"] })];
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    await crearAsignacion({
      ...VALID_INPUT_BASE,
      titulo: "   Tarea X  ",
      instrucciones: "  Hagan lo siguiente.   ",
      rubrica: "  Criterios A, B.   ",
      groupIds: ["g1"],
      modo: "BORRADOR",
    });

    expect(state.assignments[0].titulo).toBe("Tarea X");
    expect(state.assignments[0].instrucciones).toBe("Hagan lo siguiente.");
    expect(state.assignments[0].rubrica).toBe("Criterios A, B.");
  });

  it("Prueba 16: rúbrica vacía/whitespace se persiste como null", async () => {
    state.groups = [makeGroup("g1", "prof_1", { enrollments: ["a1"] })];
    const { crearAsignacion } = await import("@/lib/dal/asignaciones");
    await crearAsignacion({
      ...VALID_INPUT_BASE,
      rubrica: "   ",
      groupIds: ["g1"],
      modo: "BORRADOR",
    });

    expect(state.assignments[0].rubrica).toBeNull();
  });
});
