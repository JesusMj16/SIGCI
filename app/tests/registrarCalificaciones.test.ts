/**
 * registrarCalificaciones.test.ts
 * CU-05 — RegistrarCalificaciones — 8 pruebas de validación
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  registrarCalificaciones,
  obtenerGruposDelProfesor,
  obtenerAlumnosDelGrupo,
  PeriodoCerradoError,
  FueraDeRangoError,
  ForbiddenError,
  GrupoSinAlumnosError,
} from "@/lib/dal/registrarCalificaciones";
import { registrarCalificacionesAction } from "@/lib/actions/registrarCalificaciones.actions";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    group:        { findMany: vi.fn(), findUnique: vi.fn() },
    enrollment:   { findMany: vi.fn() },
    assignment:   { findMany: vi.fn() },
    submission:   { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    grade:        { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    notification: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock("@/lib/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";
//import { getAuthenticatedUser } from "@/lib/session";

const profesor = { id: "prof-1", role: "PROFESOR" };
const grupoActivo = {
  id: "group-1",
  teacherId: "prof-1",
  period: { isActive: true, nombre: "2024-B" },
  subject: { nombre: "Matemáticas", codigo: "MAT101" },
};

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 1 — Flujo principal: 20 grades válidas
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 1: Flujo principal — 20 grades válidas", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue(grupoActivo as any);
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: "sub-new" } as any);
    vi.mocked(prisma.grade.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.grade.create).mockResolvedValue({} as any);
  });

  it("crea 20 grades y envía 20 notificaciones", async () => {
    const calificaciones = Array.from({ length: 20 }, (_, i) => ({
      studentId: `student-${i}`,
      valor: 8.5,
    }));

    const result = await registrarCalificaciones({
      groupId: "group-1",
      assignmentId: "assign-1",
      calificaciones,
    });

    expect(result.gradesCreadas).toBe(20);
    expect(result.notificacionesEnviadas).toBe(20);
    expect(result.auditoriaRegistrada).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 2 — Flujo alternativo: registro parcial (10 de 20)
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 2: Registro parcial — 10 de 20 alumnos", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue(grupoActivo as any);
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: "sub-new" } as any);
    vi.mocked(prisma.grade.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.grade.create).mockResolvedValue({} as any);
  });

  it("solo persiste las 10 entradas con valor, los otros 10 quedan intactos", async () => {
    const calificaciones = [
      ...Array.from({ length: 10 }, (_, i) => ({ studentId: `student-${i}`, valor: 9.0 })),
      ...Array.from({ length: 10 }, (_, i) => ({ studentId: `student-${i + 10}`, valor: null })),
    ];

    const result = await registrarCalificaciones({
      groupId: "group-1",
      assignmentId: "assign-1",
      calificaciones,
    });

    expect(result.gradesCreadas).toBe(10);
    expect(result.notificacionesEnviadas).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 3 — Flujo alternativo: modificar grade existente
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 3: Modificar grade existente", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue(grupoActivo as any);
    vi.mocked(prisma.submission.findFirst).mockResolvedValue({ id: "sub-exist" } as any);
    vi.mocked(prisma.submission.update).mockResolvedValue({} as any);
    vi.mocked(prisma.grade.findUnique).mockResolvedValue({ id: "grade-exist", valor: 7 } as any);
    vi.mocked(prisma.grade.update).mockResolvedValue({} as any);
  });

  it("actualiza el grade existente en lugar de crear uno nuevo", async () => {
    const result = await registrarCalificaciones({
      groupId: "group-1",
      assignmentId: "assign-1",
      calificaciones: [{ studentId: "student-1", valor: 9.5 }],
    });

    expect(result.gradesActualizadas).toBe(1);
    expect(result.gradesCreadas).toBe(0);
    expect(prisma.grade.update).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 4 — Excepción: valor fuera de rango (valor = 11)
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 4: Excepción — valor fuera de rango", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue(grupoActivo as any);
  });

  it("lanza FueraDeRangoError sin escribir nada", async () => {
    await expect(
      registrarCalificaciones({
        groupId: "group-1",
        assignmentId: "assign-1",
        calificaciones: [{ studentId: "student-1", valor: 11 }],
      })
    ).rejects.toThrow(FueraDeRangoError);

    expect(prisma.grade.create).not.toHaveBeenCalled();
  });

  it("action devuelve errorCode VALIDATION", async () => {
    const result = await registrarCalificacionesAction({
      groupId: "group-1",
      assignmentId: "assign-1",
      calificaciones: [{ studentId: "student-1", valor: 11 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe("VALIDATION");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 5 — Excepción: periodo cerrado
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 5: Excepción — periodo cerrado", () => {
  it("lanza PeriodoCerradoError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      ...grupoActivo,
      period: { isActive: false },
    } as any);

    await expect(
      registrarCalificaciones({
        groupId: "group-1",
        assignmentId: "assign-1",
        calificaciones: [{ studentId: "student-1", valor: 8 }],
      })
    ).rejects.toThrow(PeriodoCerradoError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 6 — Excepción: grupo sin alumnos
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 6: Excepción — grupo sin alumnos", () => {
  it("lanza GrupoSinAlumnosError y no ejecuta mutaciones", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue(grupoActivo as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.grade.findMany).mockResolvedValue([]);

    const { obtenerAlumnosDelGrupo } = await import("@/lib/dal/registrarCalificaciones");

    await expect(
      obtenerAlumnosDelGrupo("group-1", "assign-1")
    ).rejects.toThrow(GrupoSinAlumnosError);

    expect(prisma.grade.create).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 7 — Permiso por rol: PROFESOR sin relación al grupo
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 7: Permiso — PROFESOR ajeno al grupo", () => {
  it("lanza ForbiddenError", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "otro-prof", role: "PROFESOR" } as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      ...grupoActivo,
      teacherId: "prof-1", // dueño es prof-1, no otro-prof
    } as any);

    await expect(
      registrarCalificaciones({
        groupId: "group-1",
        assignmentId: "assign-1",
        calificaciones: [{ studentId: "student-1", valor: 8 }],
      })
    ).rejects.toThrow(ForbiddenError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRUEBA 8 — Fallo de notificación no bloquea el flujo
// ══════════════════════════════════════════════════════════════════════════════
describe("Prueba 8: Fallo de notificación — grade persiste con warning", () => {
  it("grade creada, resultado ok, warning en array", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(profesor as any);
    vi.mocked(prisma.group.findUnique).mockResolvedValue(grupoActivo as any);
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: "sub-new" } as any);
    vi.mocked(prisma.grade.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.grade.create).mockResolvedValue({} as any);

    // Simular fallo en notificación
    vi.mocked(prisma.notification.create)
      .mockRejectedValueOnce(new Error("Notification service down"))
      .mockResolvedValue({} as any); // auditoría sí pasa

    const result = await registrarCalificaciones({
      groupId: "group-1",
      assignmentId: "assign-1",
      calificaciones: [{ studentId: "student-1", valor: 8 }],
    });

    expect(result.gradesCreadas).toBe(1);
    expect(result.notificacionesEnviadas).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("Fallo al notificar");
  });
});