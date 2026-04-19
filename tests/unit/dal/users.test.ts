import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// "server-only" y "next/navigation" no pueden ejecutarse en entorno Node puro.
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__REDIRECT__:${url}`);
  },
}));

// Control del actor autenticado por test.
const authMock = vi.fn();
vi.mock("@/lib/dal/session", () => ({
  getAuthenticatedUser: (...args: unknown[]) =>
    (authMock as (...a: unknown[]) => unknown)(...args),
}));

// Notify no debe afectar el resultado principal.
const notifyMock = vi.fn(async () => ({ ok: true, id: "n_1" }));
vi.mock("@/lib/services/audit/notify", () => ({
  notifyUser: (...args: unknown[]) =>
    (notifyMock as (...a: unknown[]) => unknown)(...args),
}));

// QR determinista para los tests.
vi.mock("@/lib/services/credential/qr", () => ({
  generarQrData: (userId: string) => `${userId}.SIGN`,
}));

// Mock de Prisma: fluent, por-operación.
type FakeUser = {
  id: string;
  status: "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
  credential: { id: string; isActive: boolean } | null;
};

const state: {
  users: Map<string, FakeUser>;
  credentials: Map<string, { id: string; userId: string; isActive: boolean; qrData: string }>;
  // Contadores de llamadas para probar atomicidad.
  credentialCreateCalls: number;
  createNextThrows?: { code: string; meta?: { target?: string } };
  updateNextThrows?: boolean;
} = {
  users: new Map(),
  credentials: new Map(),
  credentialCreateCalls: 0,
};

const fakeTx = {
  user: {
    create: vi.fn(async ({ data, select }: { data: FakeUser & { email?: string }; select?: { id: boolean } }) => {
      if (state.createNextThrows) {
        const e: Error & { code?: string; meta?: unknown } = new Error("unique");
        e.code = state.createNextThrows.code;
        e.meta = state.createNextThrows.meta;
        state.createNextThrows = undefined;
        throw e;
      }
      const id = `user_${state.users.size + 1}`;
      const u: FakeUser = { id, status: "ACTIVO", credential: null };
      state.users.set(id, u);
      return select?.id ? { id } : u;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeUser> }) => {
      if (state.updateNextThrows) {
        state.updateNextThrows = false;
        throw new Error("update boom");
      }
      const u = state.users.get(where.id);
      if (!u) throw new Error("no user");
      Object.assign(u, data);
      return u;
    }),
  },
  credential: {
    create: vi.fn(async ({ data, select }: { data: { userId: string; qrData: string; isActive: boolean }; select?: { id: boolean } }) => {
      state.credentialCreateCalls++;
      const id = `cred_${state.credentials.size + 1}`;
      state.credentials.set(data.userId, { id, userId: data.userId, isActive: true, qrData: data.qrData });
      const u = state.users.get(data.userId);
      if (u) u.credential = { id, isActive: true };
      return select?.id ? { id } : { id, ...data };
    }),
    upsert: vi.fn(async ({ where, create, update, select }: { where: { userId: string }; create: { userId: string; qrData: string; isActive: boolean }; update: { qrData: string; isActive: boolean }; select?: { id: boolean } }) => {
      const existing = state.credentials.get(where.userId);
      const id = existing?.id ?? `cred_${state.credentials.size + 1}`;
      const next = { id, userId: where.userId, isActive: true, qrData: (existing ? update.qrData : create.qrData) };
      state.credentials.set(where.userId, next);
      const u = state.users.get(where.userId);
      if (u) u.credential = { id, isActive: true };
      return select?.id ? { id } : next;
    }),
  },
} as const;

const prismaMock = {
  $transaction: vi.fn(async (fn: (tx: typeof fakeTx) => unknown) => {
    // Aislamiento mínimo: si el callback arroja, se revierte lo creado en ESTA
    // transacción (suficiente para probar que el user no sobrevive al fallo).
    const snapshotUsers = new Map(state.users);
    const snapshotCreds = new Map(state.credentials);
    try {
      return await fn(fakeTx);
    } catch (e) {
      state.users = snapshotUsers;
      state.credentials = snapshotCreds;
      throw e;
    }
  }),
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      const u = state.users.get(where.id);
      if (!u) return null;
      return { id: u.id, status: u.status, credential: u.credential };
    }),
    findMany: vi.fn(async () => []),
  },
  credential: {
    findUnique: vi.fn(async ({ where }: { where: { userId: string } }) => {
      const c = state.credentials.get(where.userId);
      return c ? { qrData: c.qrData, isActive: c.isActive, expiresAt: null } : null;
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

// bcryptjs: hash rápido para tests.
vi.mock("bcryptjs", () => ({
  default: {
    hash: async (p: string) => `hashed:${p}`,
  },
  hash: async (p: string) => `hashed:${p}`,
}));

function resetState() {
  state.users.clear();
  state.credentials.clear();
  state.credentialCreateCalls = 0;
  state.createNextThrows = undefined;
  state.updateNextThrows = false;
  authMock.mockReset();
  notifyMock.mockClear();
  prismaMock.$transaction.mockClear();
  fakeTx.user.create.mockClear();
  fakeTx.user.update.mockClear();
  fakeTx.credential.create.mockClear();
  fakeTx.credential.upsert.mockClear();
  prismaMock.user.findUnique.mockClear();
  prismaMock.credential.findUnique.mockClear();
}

describe("lib/dal/users — CU-01", () => {
  beforeEach(() => {
    resetState();
    authMock.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
  });
  afterEach(() => {
    vi.resetModules();
  });

  const baseInput = {
    matricula: "20210001",
    nombre: "Ana",
    apellidos: "Ramírez",
    email: "ana@utm.edu.mx",
    password: "secreto1234",
    carrera: "ISC",
    role: "ALUMNO" as const,
  };

  it("flujo principal: crea user + credential atómicamente y retorna ok", async () => {
    const { crearUsuarioConCredencial } = await import("@/lib/dal/users");
    const res = await crearUsuarioConCredencial(baseInput);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.userId).toBeTruthy();
      expect(res.data.credentialId).toBeTruthy();
      expect(res.data.qrData).toBe(`${res.data.userId}.SIGN`);
    }
    // Atomicidad: ambos dentro del mismo $transaction.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(fakeTx.user.create).toHaveBeenCalledTimes(1);
    expect(fakeTx.credential.create).toHaveBeenCalledTimes(1);
    // Auditoría disparada.
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("VALIDATION: falta un campo requerido", async () => {
    const { crearUsuarioConCredencial } = await import("@/lib/dal/users");
    const res = await crearUsuarioConCredencial({ ...baseInput, nombre: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.error).toMatch(/nombre/);
    }
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("INVALID_ROLE: role fuera del enum es rechazado en servidor", async () => {
    const { crearUsuarioConCredencial } = await import("@/lib/dal/users");
    const res = await crearUsuarioConCredencial({
      ...baseInput,
      // @ts-expect-error simulando envío malicioso desde cliente.
      role: "SUPERUSER",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("INVALID_ROLE");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("VALIDATION: email inválido", async () => {
    const { crearUsuarioConCredencial } = await import("@/lib/dal/users");
    const res = await crearUsuarioConCredencial({ ...baseInput, email: "no-es-email" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.error).toMatch(/email/i);
    }
  });

  it("VALIDATION: password corta (<8)", async () => {
    const { crearUsuarioConCredencial } = await import("@/lib/dal/users");
    const res = await crearUsuarioConCredencial({ ...baseInput, password: "1234" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("VALIDATION");
  });

  it("DUPLICATE_EMAIL: mapea P2002 sobre email y revierte la transacción", async () => {
    state.createNextThrows = { code: "P2002", meta: { target: "email" } };
    const { crearUsuarioConCredencial } = await import("@/lib/dal/users");
    const res = await crearUsuarioConCredencial(baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("DUPLICATE_EMAIL");
    // No debe haberse creado credencial.
    expect(fakeTx.credential.create).not.toHaveBeenCalled();
    expect(state.credentials.size).toBe(0);
  });

  it("reactivación: falla si ya hay credencial activa", async () => {
    // Seed: usuario con credencial activa.
    state.users.set("u1", { id: "u1", status: "INACTIVO", credential: { id: "c1", isActive: true } });
    state.credentials.set("u1", { id: "c1", userId: "u1", isActive: true, qrData: "u1.OLD" });

    const { reactivarUsuarioYGenerarCredencial } = await import("@/lib/dal/users");
    const res = await reactivarUsuarioYGenerarCredencial("u1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("DUPLICATE_CREDENTIAL");
  });

  it("reactivación: NOT_FOUND si userId no existe", async () => {
    const { reactivarUsuarioYGenerarCredencial } = await import("@/lib/dal/users");
    const res = await reactivarUsuarioYGenerarCredencial("inexistente");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("NOT_FOUND");
  });

  it("reactivación: VALIDATION si userId vacío", async () => {
    const { reactivarUsuarioYGenerarCredencial } = await import("@/lib/dal/users");
    const res = await reactivarUsuarioYGenerarCredencial("");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("VALIDATION");
  });

  it("reactivación: exitosa — upsert + status=ACTIVO dentro de transacción", async () => {
    state.users.set("u2", { id: "u2", status: "INACTIVO", credential: { id: "c2", isActive: false } });
    state.credentials.set("u2", { id: "c2", userId: "u2", isActive: false, qrData: "u2.OLD" });

    const { reactivarUsuarioYGenerarCredencial } = await import("@/lib/dal/users");
    const res = await reactivarUsuarioYGenerarCredencial("u2");

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.userId).toBe("u2");
      expect(res.data.qrData).toBe("u2.SIGN");
    }
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(fakeTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ACTIVO" } })
    );
    expect(fakeTx.credential.upsert).toHaveBeenCalledTimes(1);
    // La credencial quedó con el nuevo qrData.
    expect(state.credentials.get("u2")?.qrData).toBe("u2.SIGN");
  });

  it("obtenerCredencialPropia: sin credencial → DTO vacío", async () => {
    authMock.mockResolvedValue({ id: "u_nc", role: "ALUMNO" });
    const { obtenerCredencialPropia } = await import("@/lib/dal/users");
    const res = await obtenerCredencialPropia();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.tieneCredencial).toBe(false);
      expect(res.data.qrData).toBeNull();
    }
  });

  it("obtenerCredencialPropia: con credencial activa devuelve qrData", async () => {
    state.credentials.set("u_ok", { id: "c_ok", userId: "u_ok", isActive: true, qrData: "u_ok.SIGN" });
    authMock.mockResolvedValue({ id: "u_ok", role: "ALUMNO" });

    const { obtenerCredencialPropia } = await import("@/lib/dal/users");
    const res = await obtenerCredencialPropia();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.tieneCredencial).toBe(true);
      expect(res.data.credencialActiva).toBe(true);
      expect(res.data.qrData).toBe("u_ok.SIGN");
    }
  });
});
