import "server-only";

/**
 * Contrato uniforme de salida para DAL/actions.
 * Discriminado por `ok` para narrow sin castear.
 */
export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: string; code?: string };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });

export const err = (error: string, code?: string): Err =>
  code ? { ok: false, error, code } : { ok: false, error };
