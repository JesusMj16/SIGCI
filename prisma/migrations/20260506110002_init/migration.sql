-- CU-06: campos de horario en groups.
--
-- Defaults seguros para que `prisma migrate dev` no falle si la tabla
-- "groups" tiene filas previas (regresión observada en entornos con
-- datos sembrados antes del 2026-05-06).
--   day=1        → Lunes
--   startTime    → "08:00" (HH:mm 24h)
--   endTime      → "10:00"
--   classroom    → "POR ASIGNAR" (sentinel intencional)

-- AlterTable
ALTER TABLE "groups"
  ADD COLUMN "classroom" VARCHAR(64) NOT NULL DEFAULT 'POR ASIGNAR',
  ADD COLUMN "day"       INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN "endTime"   VARCHAR(5)  NOT NULL DEFAULT '10:00',
  ADD COLUMN "startTime" VARCHAR(5)  NOT NULL DEFAULT '08:00';
