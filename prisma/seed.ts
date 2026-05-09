import "dotenv/config";
import { PrismaClient, UserRole, UserStatus } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const jesus = await prisma.user.upsert({
    where: { matricula: "2023020223" },
    update: {},
    create: {
      matricula: "2023020223",
      nombre: "Jesus Alfonso",
      apellidos: "Morales Jaimes",
      email: "jesusmo03182005@gmail.com",
      passwordHash: await bcrypt.hash("b1e2i3s4", 10),
      carrera: "Ingenieria en Computacion",
      role: UserRole.ALUMNO,
      status: UserStatus.ACTIVO,
    },
  });

  const hermes = await prisma.user.upsert({
    where: { matricula: "2023020111" },
    update: {},
    create: {
      matricula: "2023020111",
      nombre: "Hermes",
      apellidos: "Aguilar Villa",
      email: "auvh050615@gs.utm.mx",
      passwordHash: await bcrypt.hash("pugulso123&", 10),
      carrera: "Ingenieria en Computacion",
      role: UserRole.ALUMNO,
      status: UserStatus.ACTIVO,
    },
  });

  const esmeralda = await prisma.user.upsert({
    where: { matricula: "2023020112" },
    update: {},
    create: {
      matricula: "2023020112",
      nombre: "Esmeralda",
      apellidos: "Morales Martinez",
      email: "mome050402@gs.utm.mx",
      passwordHash: await bcrypt.hash("chivas123", 10),
      carrera: "Ingenieria en Computacion",
      role: UserRole.ALUMNO,
      status: UserStatus.ACTIVO,
    },
  });

  const admin = await prisma.user.upsert({
    where: { matricula: "admin" },
    update: {},
    create: {
      matricula: "admin",
      nombre: "Admin",
      apellidos: "Admin",
      email: "admin@utm.mx",
      passwordHash: await bcrypt.hash("admin123", 10),
      carrera: "Administracion",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVO,
    },
  });

  const profesor = await prisma.user.upsert({
    where: { matricula: "profesor" },
    update: {},
    create: {
      matricula: "profesor",
      nombre: "Profesor",
      apellidos: "Profesor",
      email: "profesor@utm.mx",
      passwordHash: await bcrypt.hash("profesor123", 10),
      carrera: "Ingenieria en Computacion",
      role: UserRole.PROFESOR,
      status: UserStatus.ACTIVO,
    },
  });

  // --- D2: Carreras como entidad relacional ---
  const carreraIC = await prisma.carrera.upsert({
    where: { codigo: "IC" },
    update: {},
    create: {
      nombre: "Ingenieria en Computacion",
      codigo: "IC",
    },
  });

  const carreraIE = await prisma.carrera.upsert({
    where: { codigo: "IE" },
    update: {},
    create: {
      nombre: "Ingenieria en Electronica",
      codigo: "IE",
    },
  });

  const carreraAdmin = await prisma.carrera.upsert({
    where: { codigo: "ADM" },
    update: {},
    create: {
      nombre: "Administracion",
      codigo: "ADM",
    },
  });

  // Enlazar usuarios existentes a su Carrera por FK
  await prisma.user.update({
    where: { matricula: "2023020223" },
    data: { carreraId: carreraIC.id },
  });
  await prisma.user.update({
    where: { matricula: "2023020111" },
    data: { carreraId: carreraIC.id },
  });
  await prisma.user.update({
    where: { matricula: "2023020112" },
    data: { carreraId: carreraIC.id },
  });
  await prisma.user.update({
    where: { matricula: "admin" },
    data: { carreraId: carreraAdmin.id },
  });
  await prisma.user.update({
    where: { matricula: "profesor" },
    data: { carreraId: carreraIC.id },
  });

  // --- D1: Usuarios de roles nuevos (TECNICO y JEFE_CARRERA) ---
  const tecnico = await prisma.user.upsert({
    where: { matricula: "tecnico" },
    update: {},
    create: {
      matricula: "tecnico",
      nombre: "Carlos",
      apellidos: "Lopez Hernandez",
      email: "tecnico@utm.mx",
      passwordHash: await bcrypt.hash("tecnico123", 10),
      carrera: "Ingenieria en Electronica",
      carreraId: carreraIE.id,
      role: UserRole.TECNICO,
      status: UserStatus.ACTIVO,
    },
  });

  const jefeCarrera = await prisma.user.upsert({
    where: { matricula: "jefecarrera" },
    update: {},
    create: {
      matricula: "jefecarrera",
      nombre: "Maria",
      apellidos: "Garcia Ruiz",
      email: "jefe.carrera@utm.mx",
      passwordHash: await bcrypt.hash("jefe123", 10),
      carrera: "Ingenieria en Computacion",
      carreraId: carreraIC.id,
      role: UserRole.JEFE_CARRERA,
      status: UserStatus.ACTIVO,
    },
  });

  console.log({ jesus, hermes, esmeralda, admin, profesor, tecnico, jefeCarrera });
  console.log("Carreras:", { carreraIC, carreraIE, carreraAdmin });

  // --- CU-10: datos academicos para Tareas Pendientes del alumno Hermes ---
  // Periodo activo (idempotente por nombre).
  const periodExisting = await prisma.period.findFirst({
    where: { nombre: "2026-1" },
  });
  const period = periodExisting
    ? periodExisting.isActive
      ? periodExisting
      : await prisma.period.update({
          where: { id: periodExisting.id },
          data: { isActive: true },
        })
    : await prisma.period.create({
        data: {
          nombre: "2026-1",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-06-30"),
          isActive: true,
        },
      });

  // Materias.
  const programacion = await prisma.subject.upsert({
    where: { codigo: "PRG-101" },
    update: {},
    create: { nombre: "Programacion", codigo: "PRG-101", creditos: 6 },
  });
  const baseDatos = await prisma.subject.upsert({
    where: { codigo: "BD-201" },
    update: {},
    create: { nombre: "Base de Datos", codigo: "BD-201", creditos: 6 },
  });

  // Grupos (idempotente por (subjectId, periodId, nombre)).
  async function upsertGroup(subjectId: string, nombre: string) {
    const existing = await prisma.group.findFirst({
      where: { subjectId, periodId: period.id, nombre },
    });
    if (existing) return existing;
    return prisma.group.create({
      data: {
        subjectId,
        periodId: period.id,
        teacherId: profesor.id,
        nombre,
      },
    });
  }
  const grupoPRG = await upsertGroup(programacion.id, "A");
  const grupoBD = await upsertGroup(baseDatos.id, "B");

  // Inscripciones de Hermes en ambos grupos.
  await prisma.enrollment.upsert({
    where: {
      studentId_groupId: { studentId: hermes.id, groupId: grupoPRG.id },
    },
    update: {},
    create: { studentId: hermes.id, groupId: grupoPRG.id },
  });
  await prisma.enrollment.upsert({
    where: {
      studentId_groupId: { studentId: hermes.id, groupId: grupoBD.id },
    },
    update: {},
    create: { studentId: hermes.id, groupId: grupoBD.id },
  });

  // Tareas con urgencias variadas (relativas a hoy).
  const dias = (n: number) =>
    new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  type TareaSeed = {
    groupId: string;
    titulo: string;
    tipo: "TAREA" | "EXAMEN" | "PROYECTO";
    fechaLimite: Date;
    instrucciones: string;
  };
  const tareasSeed: TareaSeed[] = [
    {
      groupId: grupoPRG.id,
      titulo: "Entrega 1 - Recursion",
      tipo: "TAREA",
      fechaLimite: dias(-2),
      instrucciones: "Implementar funciones recursivas basicas.",
    },
    {
      groupId: grupoPRG.id,
      titulo: "Examen parcial",
      tipo: "EXAMEN",
      fechaLimite: dias(1),
      instrucciones: "Examen sobre estructuras de datos.",
    },
    {
      groupId: grupoBD.id,
      titulo: "Modelo Entidad-Relacion",
      tipo: "PROYECTO",
      fechaLimite: dias(5),
      instrucciones: "Disenar el ER de un sistema academico.",
    },
    {
      groupId: grupoBD.id,
      titulo: "Consultas SQL",
      tipo: "TAREA",
      fechaLimite: dias(14),
      instrucciones: "Resolver 10 consultas SQL del laboratorio.",
    },
  ];

  for (const t of tareasSeed) {
    let assignment = await prisma.assignment.findFirst({
      where: { groupId: t.groupId, titulo: t.titulo },
    });
    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          groupId: t.groupId,
          titulo: t.titulo,
          tipo: t.tipo,
          status: "PUBLICADO",
          fechaLimite: t.fechaLimite,
          instrucciones: t.instrucciones,
        },
      });
    } else {
      assignment = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { fechaLimite: t.fechaLimite, status: "PUBLICADO" },
      });
    }

    await prisma.submission.upsert({
      where: {
        assignmentId_studentId_intento: {
          assignmentId: assignment.id,
          studentId: hermes.id,
          intento: 1,
        },
      },
      update: { status: "PENDIENTE" },
      create: {
        assignmentId: assignment.id,
        studentId: hermes.id,
        status: "PENDIENTE",
        intento: 1,
      },
    });
  }

  console.log("CU-10 seed: 1 periodo, 2 materias, 2 grupos, 2 inscripciones, 4 tareas pendientes para Hermes.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
