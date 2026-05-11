/**
 * Helper de BD para tests E2E.
 *
 * Usa `pg` directamente — el cliente Prisma generado es CJS y choca con el
 * loader ESM de Playwright (`exports is not defined in ES module scope`).
 * SQL crudo simple es suficiente para verificar persistencia.
 */

import "dotenv/config";
import { Client } from "pg";

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  client = c;
  return c;
}

export interface GradeRow {
  id: string;
  studentId: string;
  valor: string; // numeric → string en pg
  retroalimentacion: string | null;
  submissionId: string;
  assignmentId: string;
}

export async function fetchGrade(opts: {
  studentId: string;
  assignmentId: string;
}): Promise<GradeRow | null> {
  const c = await getClient();
  const { rows } = await c.query<{
    id: string;
    studentid: string;
    valor: string;
    retroalimentacion: string | null;
    submissionid: string;
    assignmentid: string;
  }>(
    `SELECT g.id, g."studentId" AS studentid, g.valor::text AS valor,
            g.retroalimentacion, g."submissionId" AS submissionid,
            s."assignmentId" AS assignmentid
     FROM "Grade" g
     INNER JOIN "Submission" s ON s.id = g."submissionId"
     WHERE g."studentId" = $1 AND s."assignmentId" = $2
     LIMIT 1`,
    [opts.studentId, opts.assignmentId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    studentId: r.studentid,
    valor: r.valor,
    retroalimentacion: r.retroalimentacion,
    submissionId: r.submissionid,
    assignmentId: r.assignmentid,
  };
}

export async function resetGradesFor(opts: {
  assignmentId: string;
  studentIds: string[];
}) {
  if (opts.studentIds.length === 0) return;
  const c = await getClient();
  await c.query(
    `DELETE FROM "Grade"
     WHERE "studentId" = ANY($1::text[])
       AND "submissionId" IN (
         SELECT id FROM "Submission"
         WHERE "assignmentId" = $2 AND "studentId" = ANY($1::text[])
       )`,
    [opts.studentIds, opts.assignmentId]
  );
  await c.query(
    `DELETE FROM "Submission"
     WHERE "assignmentId" = $1 AND "studentId" = ANY($2::text[])`,
    [opts.assignmentId, opts.studentIds]
  );
}

export async function studentIdsByMatricula(
  matriculas: string[]
): Promise<Record<string, string>> {
  const c = await getClient();
  const { rows } = await c.query<{ id: string; matricula: string }>(
    `SELECT id, matricula FROM "User" WHERE matricula = ANY($1::text[])`,
    [matriculas]
  );
  return Object.fromEntries(rows.map((r) => [r.matricula, r.id]));
}

/**
 * Activa o desactiva un periodo. Devuelve un undo() para restaurar.
 */
export async function togglePeriodActive(
  periodId: string,
  active: boolean
): Promise<() => Promise<void>> {
  const c = await getClient();
  const { rows } = await c.query<{ isActive: boolean }>(
    `SELECT "isActive" FROM "Period" WHERE id = $1`,
    [periodId]
  );
  if (rows.length === 0) {
    throw new Error(`Period ${periodId} no existe`);
  }
  const before = rows[0].isActive;
  if (before === active) {
    return async () => {
      /* noop */
    };
  }
  await c.query(`UPDATE "Period" SET "isActive" = $1 WHERE id = $2`, [
    active,
    periodId,
  ]);
  return async () => {
    await c.query(`UPDATE "Period" SET "isActive" = $1 WHERE id = $2`, [
      before,
      periodId,
    ]);
  };
}

export async function disconnect() {
  if (client) {
    await client.end();
    client = null;
  }
}
