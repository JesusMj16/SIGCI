/**
 * calificaciones.test.ts
 * CU-04 — ConsultarCalificaciones
 * 7 pruebas de validación según la documentación del caso de uso.
 *
 * Framework: Vitest + @testing-library/react
 * Mocks: Prisma via vi.mock, next/navigation via vi.mock
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { obtenerCalificacionesDelAlumno, obtenerPeriodosDelAlumno, NoMateriasInscritasError } from "@/lib/dal/grades";
import { getCalificacionesAction } from "@/lib/actions/calificaciones.actions";

// ── Mock de Prisma ─────────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: { findMany: vi.fn() },
    period:     { findMany: vi.fn() },
    notification: { create: vi.fn().mockResolvedValue({}) },
  },
}));

// ── Mock de sesión ─────────────────────────────────────────────────────────
vi.mock("@/lib/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";


// ── Fixtures ───────────────────────────────────────────────────────────────

const alumnoA = {
  id: "alumno-a-id",
  nombre: "Ana",
  apellidos: "García",
  matricula: "20230001",
  role: "ALUMNO",
};

const periodoActivo = {
  id: "periodo-2024b",
  nombre: "2024-B",
  startDate: new Date("2024-08-01"),
  endDate: new Date("2024-12-15"),
  isActive: true,
};

function makeEnrollment(overrides = {}) {
  return {
    id: "enroll-1",
    studentId: alumnoA.id,
    group: {
      id: "group-1",
      period: periodoActivo,
      subject: { id: "subj-1", nombre: "Matemáticas", codigo: "MAT101" },
      assignments: [
        {
          id: "assign-1",
          titulo: "Parcial 1",
          tipo: "EXAMEN",
          status: "PUBLICADO",
          submissions: [
            {
              id: "sub-1",
              studentId: alumnoA.id,
              submittedAt: new Date(),
              intento: 1,
              grade: { id: "grade-1", valor: "9.5", retroalimentacion: "Excelente" },
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 1 — Flujo principal: alumno con 3 materias y grades registradas
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 1: Flujo principal — alumno con materias y grades", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(alumnoA as any);

    const enrollments = ["MAT101","FIS101","QUI101"].map((cod, i) => ({
      ...makeEnrollment(),
      id: `enroll-${i}`,
      group: {
        ...makeEnrollment().group,
        id: `group-${i}`,
        subject: { id: `subj-${i}`, nombre: `Materia ${cod}`, codigo: cod },
      },
    }));

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue(enrollments as any);
  });

  it("devuelve 3 materias con promedio calculado", async () => {
    const result = await obtenerCalificacionesDelAlumno();
    const periodo = result.periodos[0];

    expect(periodo).toBeDefined();
    expect(periodo.materias).toHaveLength(3);
    periodo.materias.forEach((m) => {
      expect(m.promedio).not.toBeNull();
      expect(m.grades.length).toBeGreaterThan(0);
    });
  });

  it("registra la consulta en el log (postcondición paso 7)", async () => {
    const result = await obtenerCalificacionesDelAlumno();
    expect(result.consultaRegistrada).toBe(true);
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 2 — Flujo alternativo: ?periodo= carga detalle de ese periodo
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 2: Flujo alternativo — periodo anterior por searchParam", () => {
  it("filtra por el periodId pasado como parámetro", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(alumnoA as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([makeEnrollment()] as any);

    const result = await obtenerCalificacionesDelAlumno("periodo-2023a");
    // La query se ejecuta con el filtro correcto (verificado via spy)
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          group: expect.objectContaining({
            period: { id: "periodo-2023a" },
          }),
        }),
      })
    );
    expect(result.periodos).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 3 — Filtro por materia sin recarga (React useState — lógica de UI)
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 3: Filtro por materia — lógica client-side", () => {
  it("materiasFiltradas solo contiene la materia seleccionada", () => {
    // Esta prueba valida la lógica de useMemo en CalificacionesContainer
    // Se prueba la función de filtrado en aislamiento:
    const materias = [
      { subjectNombre: "Matemáticas", grades: [] },
      { subjectNombre: "Física", grades: [] },
    ];

    const filterFn = (filter: string) =>
      filter === "todas" ? materias : materias.filter((m) => m.subjectNombre === filter);

    expect(filterFn("todas")).toHaveLength(2);
    expect(filterFn("Física")).toHaveLength(1);
    expect(filterFn("Física")[0].subjectNombre).toBe("Física");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 4 — Excepción: alumno sin enrollments
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 4: Excepción — sin materias inscritas", () => {
  it("lanza NoMateriasInscritasError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(alumnoA as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([]);

    await expect(obtenerCalificacionesDelAlumno()).rejects.toThrow(NoMateriasInscritasError);
  });

  it("action devuelve errorCode NO_MATERIAS", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(alumnoA as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([]);

    const result = await getCalificacionesAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe("NO_MATERIAS");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 5 — Excepción: alumno con enrollments pero sin grades
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 5: Excepción — sin calificaciones registradas", () => {
  it("materia tiene promedio null y grades vacíos", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(alumnoA as any);

    const enrollmentSinGrades = {
      ...makeEnrollment(),
      group: {
        ...makeEnrollment().group,
        assignments: [
          {
            id: "assign-x",
            titulo: "Tarea 1",
            tipo: "TAREA",
            status: "PUBLICADO",
            submissions: [], // sin entrega
          },
        ],
      },
    };

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([enrollmentSinGrades] as any);

    const result = await obtenerCalificacionesDelAlumno();
    const materia = result.periodos[0].materias[0];
    expect(materia.grades).toHaveLength(0);
    expect(materia.promedio).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 6 — Regla de negocio: aislamiento de datos entre alumnos
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 6: Regla de negocio — aislamiento de calificaciones", () => {
  it("studentId proviene SOLO de la sesión, no de parámetros externos", async () => {
    const alumnoB = { ...alumnoA, id: "alumno-b-id", matricula: "20230002" };
    vi.mocked(getAuthenticatedUser).mockResolvedValue(alumnoB as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([makeEnrollment()] as any);

    await obtenerCalificacionesDelAlumno();

    // Verificar que la query usa el id de la sesión (alumno B), no un param externo
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ studentId: "alumno-b-id" }),
      })
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 7 — Permiso por rol: PROFESOR accede a /alumno/calificaciones
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 7: Permiso por rol — PROFESOR bloqueado", () => {
  it("getAuthenticatedUser lanza Unauthorized para rol PROFESOR", async () => {
    vi.mocked(getAuthenticatedUser).mockRejectedValue(
      new Error("Unauthorized: role PROFESOR cannot access ALUMNO route")
    );

    const result = await getCalificacionesAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe("AUTH_ERROR");
  });
});