// prisma/seed-horarios.ts
import "dotenv/config";
import { PrismaClient, UserRole, UserStatus } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log("Iniciando la inserción de datos de prueba para Horarios...");

  // 1. Crear el Periodo Activo
  const periodo = await prisma.period.upsert({
    where: { id: "periodo-2026A" },
    update: {},
    create: {
      id: "periodo-2026A",
      nombre: "Semestre 2026-A",
      startDate: new Date("2026-02-01T00:00:00Z"),
      endDate: new Date("2026-07-30T00:00:00Z"),
      isActive: true,
    },
  });
  console.log("✅ Periodo creado:", periodo.nombre);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash("L1234567", saltRounds);

  // 1. Crear Profesor
  const profesor = await prisma.user.upsert({
    where: { email: "cmartinez@utm.mx" },
    update: { passwordHash: passwordHash }, // Actualizamos por si ya existe
    create: {
      id: "prof-carlos",
      matricula: "EMP-001",
      nombre: "Carlos Alberto",
      apellidos: "Martínez Sandoval",
      email: "cmartinez@utm.mx",
      passwordHash: passwordHash, // Guardamos el hash real
      carrera: "Ingeniería en Computación",
      role: "PROFESOR",
      status: "ACTIVO",
    },
  });

  // 2. Crear Alumno
  const alumno = await prisma.user.upsert({
    where: { email: "leonardo@utm.mx" },
    update: { passwordHash: passwordHash },
    create: {
      id: "alumno-leo",
      matricula: "20230001",
      nombre: "Leonardo",
      apellidos: "Bautista Cruz",
      email: "leonardo@utm.mx",
      passwordHash: passwordHash, // Guardamos el hash real
      carrera: "Ingeniería en Computación",
      role: "ALUMNO",
      status: "ACTIVO",
    },
  });

  console.log("✅ Alumno creado:", alumno.nombre);

  // 3. Crear Materias
  const materia1 = await prisma.subject.upsert({
    where: { codigo: "COMP-401" },
    update: {},
    create: {
      id: "subj-poo",
      nombre: "Desarrollo de Software Orientado a Objetos",
      codigo: "COMP-401",
      creditos: 8,
    },
  });

  const materia2 = await prisma.subject.upsert({
    where: { codigo: "COMP-302" },
    update: {},
    create: {
      id: "subj-bd",
      nombre: "Bases de Datos",
      codigo: "COMP-302",
      creditos: 8,
    },
  });
  console.log("✅ Materias creadas");

  // 4. Crear Grupos (Horarios)
  const grupo1 = await prisma.group.create({
    data: {
      id: "grupo-poo-lunes",
      nombre: "DSOO - Grupo A",
      cupo: 30,
      day: 1, // Lunes
      startTime: "07:00",
      endTime: "09:00",
      classroom: "Aula 101",
      subjectId: materia1.id,
      teacherId: profesor.id,
      periodId: periodo.id,
    },
  });

  const grupo2 = await prisma.group.create({
    data: {
      id: "grupo-poo-miercoles",
      nombre: "DSOO - Grupo A", // Mismo grupo, diferente día
      cupo: 30,
      day: 3, // Miércoles
      startTime: "07:00",
      endTime: "09:00",
      classroom: "Aula 101",
      subjectId: materia1.id,
      teacherId: profesor.id,
      periodId: periodo.id,
    },
  });

  const grupo3 = await prisma.group.create({
    data: {
      id: "grupo-bd-miercoles",
      nombre: "BD - Grupo B",
      cupo: 30,
      day: 3, // Miércoles
      startTime: "10:00",
      endTime: "12:00",
      classroom: "Lab Cómputo 3",
      subjectId: materia2.id,
      teacherId: profesor.id,
      periodId: periodo.id,
    },
  });
  console.log("✅ Grupos/Horarios creados");

  // 5. Inscribir al Alumno en los Grupos
  await prisma.enrollment.createMany({
    data: [
      { studentId: alumno.id, groupId: grupo1.id },
      { studentId: alumno.id, groupId: grupo2.id },
      { studentId: alumno.id, groupId: grupo3.id },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Alumno inscrito en los grupos");

  console.log("🎉 ¡Datos insertados correctamente!");
}

main()
  .catch((e) => {
    console.error("Error insertando datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });