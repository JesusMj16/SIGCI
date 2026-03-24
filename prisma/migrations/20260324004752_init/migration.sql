-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('alumno', 'profesor', 'admin', 'coordinador', 'personal_operativo', 'biblioteca', 'servicios_escolares', 'director');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('activo', 'inactivo', 'suspendido');

-- CreateEnum
CREATE TYPE "assignment_type" AS ENUM ('tarea', 'examen', 'proyecto');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('borrador', 'publicado', 'cerrado');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('pendiente', 'entregado', 'calificado');

-- CreateEnum
CREATE TYPE "announcement_status" AS ENUM ('activo', 'expirado');

-- CreateEnum
CREATE TYPE "access_log_type" AS ENUM ('entrada', 'salida');

-- CreateEnum
CREATE TYPE "loan_status" AS ENUM ('activo', 'devuelto', 'vencido');

-- CreateEnum
CREATE TYPE "procedure_type" AS ENUM ('constancia', 'historial', 'baja', 'reinscripcion', 'certificado', 'otro');

-- CreateEnum
CREATE TYPE "procedure_status" AS ENUM ('pendiente', 'en_proceso', 'aprobado', 'rechazado', 'completado');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "matricula" VARCHAR(25) NOT NULL,
    "nombre" VARCHAR(256) NOT NULL,
    "apellidos" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "carrera" VARCHAR(256) NOT NULL,
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "credential_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "qr_data" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("credential_id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "subject_id" TEXT NOT NULL,
    "nombre" VARCHAR(256) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "creditos" INTEGER NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "periods" (
    "period_id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("period_id")
);

-- CreateTable
CREATE TABLE "groups" (
    "group_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "assignment_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "titulo" VARCHAR(256) NOT NULL,
    "instrucciones" TEXT,
    "tipo" "assignment_type" NOT NULL,
    "status" "assignment_status" NOT NULL DEFAULT 'borrador',
    "fecha_limite" TIMESTAMP(3) NOT NULL,
    "rubrica" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "submission_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'pendiente',
    "file_url" VARCHAR(1024),
    "intento" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "grades" (
    "grade_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "valor" DECIMAL(5,2) NOT NULL,
    "retroalimentacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("grade_id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "announcement_id" TEXT NOT NULL,
    "titulo" VARCHAR(256) NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "status" "announcement_status" NOT NULL DEFAULT 'activo',
    "segmento" "user_role",
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "titulo" VARCHAR(256) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "access_log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "tipo" "access_log_type" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("access_log_id")
);

-- CreateTable
CREATE TABLE "loans" (
    "loan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "descripcion" VARCHAR(512) NOT NULL,
    "status" "loan_status" NOT NULL DEFAULT 'activo',
    "prestado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "devolucion_at" TIMESTAMP(3),
    "multa" DECIMAL(8,2),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("loan_id")
);

-- CreateTable
CREATE TABLE "procedures" (
    "procedure_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipo" "procedure_type" NOT NULL,
    "status" "procedure_status" NOT NULL DEFAULT 'pendiente',
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("procedure_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_matricula_key" ON "users"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_user_id_key" ON "credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_codigo_key" ON "subjects"("codigo");

-- CreateIndex
CREATE INDEX "groups_period_id_subject_id_idx" ON "groups"("period_id", "subject_id");

-- CreateIndex
CREATE INDEX "groups_teacher_id_idx" ON "groups"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_group_id_key" ON "enrollments"("student_id", "group_id");

-- CreateIndex
CREATE INDEX "assignments_group_id_status_idx" ON "assignments"("group_id", "status");

-- CreateIndex
CREATE INDEX "assignments_fecha_limite_idx" ON "assignments"("fecha_limite");

-- CreateIndex
CREATE INDEX "submissions_student_id_idx" ON "submissions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignment_id_student_id_intento_key" ON "submissions"("assignment_id", "student_id", "intento");

-- CreateIndex
CREATE UNIQUE INDEX "grades_submission_id_key" ON "grades"("submission_id");

-- CreateIndex
CREATE INDEX "grades_student_id_idx" ON "grades"("student_id");

-- CreateIndex
CREATE INDEX "announcements_status_created_at_idx" ON "announcements"("status", "created_at");

-- CreateIndex
CREATE INDEX "announcements_segmento_idx" ON "announcements"("segmento");

-- CreateIndex
CREATE INDEX "notifications_user_id_leida_idx" ON "notifications"("user_id", "leida");

-- CreateIndex
CREATE INDEX "access_logs_user_id_timestamp_idx" ON "access_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "loans_user_id_status_idx" ON "loans"("user_id", "status");

-- CreateIndex
CREATE INDEX "procedures_user_id_status_idx" ON "procedures"("user_id", "status");

-- CreateIndex
CREATE INDEX "procedures_tipo_status_idx" ON "procedures"("tipo", "status");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("submission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials"("credential_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
