import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock "server-only" para poder importar el módulo desde el entorno de test.
vi.mock("server-only", () => ({}));

const ORIGINAL_SECRET = process.env.QR_SECRET;

async function importQr() {
  // re-import limpio tras cada mutación de env.
  vi.resetModules();
  return await import("@/lib/services/credential/qr");
}

describe("lib/services/qr", () => {
  beforeEach(() => {
    process.env.QR_SECRET = "test-secret-suficientemente-largo-0000";
  });
  afterEach(() => {
    process.env.QR_SECRET = ORIGINAL_SECRET;
  });

  it("generarQrData produce formato '<userId>.<hmacHex>' y es determinista", async () => {
    const { generarQrData } = await importQr();
    const a = generarQrData("user_abc");
    const b = generarQrData("user_abc");
    expect(a).toBe(b); // mismo secreto + mismo input -> misma firma
    const parts = a.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBe("user_abc");
    expect(parts[1]).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
  });

  it("dos userIds distintos producen firmas distintas", async () => {
    const { generarQrData } = await importQr();
    const a = generarQrData("user_a");
    const b = generarQrData("user_b");
    expect(a).not.toBe(b);
  });

  it("verificarQrData acepta firmas válidas", async () => {
    const { generarQrData, verificarQrData } = await importQr();
    const qr = generarQrData("user_xyz");
    const res = verificarQrData(qr);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.userId).toBe("user_xyz");
  });

  it("verificarQrData rechaza formato inválido", async () => {
    const { verificarQrData } = await importQr();
    expect(verificarQrData("").ok).toBe(false);
    expect(verificarQrData("sinPunto").ok).toBe(false);
    expect(verificarQrData("user.").ok).toBe(false);
    expect(verificarQrData(".hmac").ok).toBe(false);
    const r = verificarQrData("user.algo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(["FORMAT", "SIGNATURE"]).toContain(r.reason);
  });

  it("verificarQrData rechaza firma alterada", async () => {
    const { generarQrData, verificarQrData } = await importQr();
    const qr = generarQrData("user_x");
    // Alteramos el último caracter del hex
    const tampered = qr.slice(0, -1) + (qr.slice(-1) === "a" ? "b" : "a");
    const r = verificarQrData(tampered);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("SIGNATURE");
  });

  it("cambiar QR_SECRET invalida QRs previos (rotación)", async () => {
    const mod1 = await importQr();
    const qr = mod1.generarQrData("user_rot");

    process.env.QR_SECRET = "otro-secreto-distinto-suficiente-0000";
    const mod2 = await importQr();
    const r = mod2.verificarQrData(qr);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("SIGNATURE");
  });

  it("falla cerrado si QR_SECRET no está definido", async () => {
    delete process.env.QR_SECRET;
    const { generarQrData } = await importQr();
    expect(() => generarQrData("user_sin_secret")).toThrow(/QR_SECRET/);
  });

  it("falla cerrado si QR_SECRET es demasiado corto", async () => {
    process.env.QR_SECRET = "corto";
    const { generarQrData } = await importQr();
    expect(() => generarQrData("user_corto")).toThrow(/QR_SECRET/);
  });

  it("generarQrData requiere userId no vacío", async () => {
    const { generarQrData } = await importQr();
    expect(() => generarQrData("")).toThrow(/userId requerido/);
  });
});
