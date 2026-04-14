/**
 * Tests de verificación para proxy.ts
 * Validan los 8 criterios de aceptación del middleware de autenticación/autorización
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockRedirect, mockNext } = vi.hoisted(() => ({
  mockRedirect: vi.fn((url: URL) => ({ type: "redirect", url: url.toString() })),
  mockNext: vi.fn(() => ({ type: "next" })),
}));

vi.mock("next/server", () => ({
  NextResponse: { redirect: mockRedirect, next: mockNext },
}));

// Mock de auth: simplemente retorna el handler tal cual (sin envolver)
vi.mock("@/auth", () => ({
  auth: (handler: Function) => handler,
}));

// Mock del cliente Prisma con los valores del enum
vi.mock("@/lib/generated/prisma/client", () => ({
  UserRole: {
    ALUMNO: "ALUMNO",
    PROFESOR: "PROFESOR",
    ADMIN: "ADMIN",
    COORDINADOR: "COORDINADOR",
    PERSONAL_OPERATIVO: "PERSONAL_OPERATIVO",
    BIBLIOTECA: "BIBLIOTECA",
    SERVICIOS_ESCOLARES: "SERVICIOS_ESCOLARES",
    DIRECTOR: "DIRECTOR",
  },
}));


import { proxy, config } from "../proxy";



function createMockRequest(pathname: string, session: any = null) {
  const url = new URL(pathname, "http://localhost:3000");
  return {
    nextUrl: url,
    auth: session,
  };
}

function callProxy(pathname: string, session: any = null) {
  return (proxy as any)(createMockRequest(pathname, session));
}

//Tests para comprobacion de proxy.ts

describe("Proxy Middleware - Criterios de Aceptación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-1
  describe("AC-1: proxy.ts existe en la raíz", () => {
    it("el archivo proxy.ts existe en la raíz del proyecto", () => {
      const proxyPath = path.resolve(__dirname, "..", "proxy.ts");
      expect(fs.existsSync(proxyPath)).toBe(true);
    });
  });

  // AC-2
  describe("AC-2: Sin sesión → redirige a /login", () => {
    it("redirige a /login cuando no hay sesión y se accede a /admin", () => {
      callProxy("/admin");
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/login");
    });

    it("permite acceso a /login sin sesión", () => {
      callProxy("/login");
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  // AC-3
  describe("AC-3: Con sesión → /login redirige al dashboard", () => {
    it("ADMIN en /login → redirige a /admin", () => {
      callProxy("/login", { user: { role: "ADMIN" } });
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/admin");
    });

    it("BIBLIOTECA en /login → redirige a /biblioteca", () => {
      callProxy("/login", { user: { role: "BIBLIOTECA" } });
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/biblioteca");
    });

    it("SERVICIOS_ESCOLARES en /login → redirige a /servicios-escolares", () => {
      callProxy("/login", { user: { role: "SERVICIOS_ESCOLARES" } });
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/servicios-escolares");
    });
  });

  // AC-4
  describe("AC-4: /api/auth/ no interceptadas", () => {
    it("permite /api/auth/callback sin sesión", () => {
      callProxy("/api/auth/callback");
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("permite /api/auth/signin con sesión", () => {
      callProxy("/api/auth/signin", { user: { role: "ADMIN" } });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  // AC-5
  describe("AC-5: Matcher excluye archivos estáticos", () => {
    it("el matcher contiene exclusiones para archivos estáticos", () => {
      const matcher = config.matcher[0];

      // Verificar que el patrón excluye los recursos estáticos esperados
      expect(matcher).toContain("_next/static");
      expect(matcher).toContain("_next/image");
      expect(matcher).toContain("favicon.ico");
      expect(matcher).toContain("svg");
      expect(matcher).toContain("png");
      expect(matcher).toContain("jpg");
      expect(matcher).toContain("jpeg");
      expect(matcher).toContain("gif");
      expect(matcher).toContain("webp");
    });
  });

  // AC-6
  describe("AC-6: /admin → ADMIN y COORDINADOR", () => {
    it("ADMIN accede a /admin", () => {
      callProxy("/admin", { user: { role: "ADMIN" } });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("COORDINADOR accede a /admin", () => {
      callProxy("/admin", { user: { role: "COORDINADOR" } });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("ALUMNO NO accede a /admin", () => {
      callProxy("/admin", { user: { role: "ALUMNO" } });
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/alumno");
    });

    it("BIBLIOTECA NO accede a /admin", () => {
      callProxy("/admin", { user: { role: "BIBLIOTECA" } });
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  // AC-7
  describe("AC-7: /biblioteca → BIBLIOTECA", () => {
    it("BIBLIOTECA accede a /biblioteca", () => {
      callProxy("/biblioteca", { user: { role: "BIBLIOTECA" } });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("ADMIN NO accede a /biblioteca", () => {
      callProxy("/biblioteca", { user: { role: "ADMIN" } });
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/admin");
    });
  });

  // AC-8
  describe("AC-8: /servicios-escolares → SERVICIOS_ESCOLARES", () => {
    it("SERVICIOS_ESCOLARES accede a /servicios-escolares", () => {
      callProxy("/servicios-escolares", { user: { role: "SERVICIOS_ESCOLARES" } });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("ADMIN NO accede a /servicios-escolares", () => {
      callProxy("/servicios-escolares", { user: { role: "ADMIN" } });
      expect(mockRedirect).toHaveBeenCalled();
      const url: URL = mockRedirect.mock.calls[0][0];
      expect(url.pathname).toBe("/admin");
    });
  });
});
