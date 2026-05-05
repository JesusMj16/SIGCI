import "dotenv/config";
import {
  PrismaClient,
  UserRole,
  UserStatus,
  AssignmentType,
  AssignmentStatus,
  SubmissionStatus,
} from "../lib/generated/prisma/client";
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

  const carreraIC = await prisma.carrera.upsert({
    where: { codigo: "IC" },
    update: {},
    create: { nombre: "Ingenieria en Computacion", codigo: "IC" },
  });

  const carreraIE = await prisma.carrera.upsert({
    where: { codigo: "IE" },
    update: {},
    create: { nombre: "Ingenieria en Electronica", codigo: "IE" },
  });

  const carreraAdmin = await prisma.carrera.upsert({
    where: { codigo: "ADM" },
    update: {},
    create: { nombre: "Administracion", codigo: "ADM" },
  });

  await prisma.user.update({ where: { matricula: "2023020223" }, data: { carreraId: carreraIC.id } });
  await prisma.user.update({ where: { matricula: "2023020111" }, data: { carreraId: carreraIC.id } });
  await prisma.user.update({ where: { matricula: "2023020112" }, data: { carreraId: carreraIC.id } });
  await prisma.user.update({ where: { matricula: "admin" },      data: { carreraId: carreraAdmin.id } });
  await prisma.user.update({ where: { matricula: "profesor" },   data: { carreraId: carreraIC.id } });

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

  // CU-04 datos
  console.log("\nAgregando datos CU-04...");

  await prisma.user.upsert({
    where: { matricula: "sinmaterias" },
    update: {},
    create: {
      matricula: "sinmaterias",
      nombre: "Luis",
      apellidos: "Sin Materias",
      email: "sinmaterias@utm.mx",
      passwordHash: await bcrypt.hash("test123", 10),
      carrera: "Ingenieria en Computacion",
      carreraId: carreraIC.id,
      role: UserRole.ALUMNO,
      status: UserStatus.ACTIVO,
    },
  });

  const matCalculo = await prisma.subject.upsert({
    where: { codigo: "MAT101" },
    update: {},
    create: { nombre: "Calculo Diferencial", codigo: "MAT101", creditos: 5 },
  });

  const matFisica = await prisma.subject.upsert({
    where: { codigo: "FIS101" },
    update: {},
    create: { nombre: "Fisica General", codigo: "FIS101", creditos: 4 },
  });

  const matProg = await prisma.subject.upsert({
    where: { codigo: "PRG101" },
    update: {},
    create: { nombre: "Fundamentos de Programacion", codigo: "PRG101", creditos: 5 },
  });

  const periodoActual = await prisma.period.upsert({
    where: { id: "periodo-2024b" },
    update: { isActive: true },
    create: { id: "periodo-2024b", nombre: "Agosto-Diciembre 2024", startDate: new Date("2024-08-01"), endDate: new Date("2024-12-15"), isActive: true },
  });

  const periodoAnterior = await prisma.period.upsert({
    where: { id: "periodo-2024a" },
    update: { isActive: false },
    create: { id: "periodo-2024a", nombre: "Enero-Junio 2024", startDate: new Date("2024-01-15"), endDate: new Date("2024-06-30"), isActive: false },
  });

  const grupoCalculo = await prisma.group.upsert({
    where: { id: "group-2024b-MAT101" },
    update: {},
    create: { id: "group-2024b-MAT101", nombre: "Grupo A", subjectId: matCalculo.id, teacherId: profesor.id, periodId: periodoActual.id, cupo: 30 },
  });

  const grupoFisica = await prisma.group.upsert({
    where: { id: "group-2024b-FIS101" },
    update: {},
    create: { id: "group-2024b-FIS101", nombre: "Grupo A", subjectId: matFisica.id, teacherId: profesor.id, periodId: periodoActual.id, cupo: 30 },
  });

  const grupoProg = await prisma.group.upsert({
    where: { id: "group-2024b-PRG101" },
    update: {},
    create: { id: "group-2024b-PRG101", nombre: "Grupo A", subjectId: matProg.id, teacherId: profesor.id, periodId: periodoActual.id, cupo: 30 },
  });

  const grupoCalculoAnterior = await prisma.group.upsert({
    where: { id: "group-2024a-MAT101" },
    update: {},
    create: { id: "group-2024a-MAT101", nombre: "Grupo A", subjectId: matCalculo.id, teacherId: profesor.id, periodId: periodoAnterior.id, cupo: 30 },
  });

  for (const gId of [grupoCalculo.id, grupoFisica.id, grupoProg.id, grupoCalculoAnterior.id]) {
    await prisma.enrollment.upsert({
      where: { studentId_groupId: { studentId: jesus.id, groupId: gId } },
      update: {},
      create: { studentId: jesus.id, groupId: gId },
    });
  }

  // Calculo con grades
  for (const a of [
    { id: "asgn-MAT-p1",  titulo: "Parcial 1",      tipo: AssignmentType.EXAMEN,   valor: 9.5 },
    { id: "asgn-MAT-t1",  titulo: "Tarea Limites",  tipo: AssignmentType.TAREA,    valor: 8.0 },
    { id: "asgn-MAT-pf",  titulo: "Proyecto Final", tipo: AssignmentType.PROYECTO, valor: 9.0 },
  ]) {
    const asgn = await prisma.assignment.upsert({
      where: { id: a.id },
      update: {},
      create: { id: a.id, groupId: grupoCalculo.id, titulo: a.titulo, tipo: a.tipo, status: AssignmentStatus.PUBLICADO, fechaLimite: new Date("2024-11-30") },
    });
    const sub = await prisma.submission.upsert({
      where: { assignmentId_studentId_intento: { assignmentId: asgn.id, studentId: jesus.id, intento: 1 } },
      update: {},
      create: { assignmentId: asgn.id, studentId: jesus.id, status: SubmissionStatus.CALIFICADO, intento: 1, submittedAt: new Date("2024-11-10") },
    });
    await prisma.grade.upsert({
      where: { submissionId: sub.id },
      update: {},
      create: { submissionId: sub.id, studentId: jesus.id, valor: a.valor, retroalimentacion: "Bien hecho." },
    });
  }

  // Fisica con grades
  for (const a of [
    { id: "asgn-FIS-p1", titulo: "Parcial 1",    tipo: AssignmentType.EXAMEN, valor: 7.5 },
    { id: "asgn-FIS-t1", titulo: "Lab Vectores", tipo: AssignmentType.TAREA,  valor: 8.5 },
  ]) {
    const asgn = await prisma.assignment.upsert({
      where: { id: a.id },
      update: {},
      create: { id: a.id, groupId: grupoFisica.id, titulo: a.titulo, tipo: a.tipo, status: AssignmentStatus.PUBLICADO, fechaLimite: new Date("2024-11-30") },
    });
    const sub = await prisma.submission.upsert({
      where: { assignmentId_studentId_intento: { assignmentId: asgn.id, studentId: jesus.id, intento: 1 } },
      update: {},
      create: { assignmentId: asgn.id, studentId: jesus.id, status: SubmissionStatus.CALIFICADO, intento: 1, submittedAt: new Date("2024-11-10") },
    });
    await prisma.grade.upsert({
      where: { submissionId: sub.id },
      update: {},
      create: { submissionId: sub.id, studentId: jesus.id, valor: a.valor, retroalimentacion: "Bien hecho." },
    });
  }

  // PRG101 sin grade - Prueba 5
  await prisma.assignment.upsert({
    where: { id: "asgn-PRG-t1" },
    update: {},
    create: { id: "asgn-PRG-t1", groupId: grupoProg.id, titulo: "Tarea 1: Variables", tipo: AssignmentType.TAREA, status: AssignmentStatus.PUBLICADO, fechaLimite: new Date("2024-11-30") },
  });

  // Periodo anterior - Prueba 2
  const asgnAnt = await prisma.assignment.upsert({
    where: { id: "asgn-MAT-ant-final" },
    update: {},
    create: { id: "asgn-MAT-ant-final", groupId: grupoCalculoAnterior.id, titulo: "Final Calculo", tipo: AssignmentType.EXAMEN, status: AssignmentStatus.PUBLICADO, fechaLimite: new Date("2024-06-20") },
  });
  const subAnt = await prisma.submission.upsert({
    where: { assignmentId_studentId_intento: { assignmentId: asgnAnt.id, studentId: jesus.id, intento: 1 } },
    update: {},
    create: { assignmentId: asgnAnt.id, studentId: jesus.id, status: SubmissionStatus.CALIFICADO, intento: 1, submittedAt: new Date("2024-06-18") },
  });
  await prisma.grade.upsert({
    where: { submissionId: subAnt.id },
    update: {},
    create: { submissionId: subAnt.id, studentId: jesus.id, valor: 8.8, retroalimentacion: "Excelente desempeno." },
  });

  console.log("CU-04 listo.");
  console.log("  Prueba 1,3 -> 2023020223 / b1e2i3s4 -> /alumno/calificaciones");
  console.log("  Prueba 2   -> misma cuenta -> /alumno/calificaciones?periodo=periodo-2024a");
  console.log("  Prueba 4   -> sinmaterias  / test123 -> /alumno/calificaciones");
  console.log("  Prueba 5   -> 2023020223, abrir PRG101 (sin grades)");
  console.log("  Prueba 7   -> profesor / profesor123 -> /alumno/calificaciones -> redirect");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());