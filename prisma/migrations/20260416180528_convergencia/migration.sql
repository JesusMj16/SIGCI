-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "user_role" ADD VALUE 'tecnico';
ALTER TYPE "user_role" ADD VALUE 'jefe_carrera';

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "cupo" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "carrera_id" TEXT;

-- CreateTable
CREATE TABLE "carreras" (
    "carrera_id" TEXT NOT NULL,
    "nombre" VARCHAR(256) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("carrera_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carreras_nombre_key" ON "carreras"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "carreras_codigo_key" ON "carreras"("codigo");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("carrera_id") ON DELETE SET NULL ON UPDATE CASCADE;
