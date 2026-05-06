/*
  Warnings:

  - Added the required column `classroom` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `groups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "classroom" TEXT NOT NULL,
ADD COLUMN     "day" INTEGER NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;
