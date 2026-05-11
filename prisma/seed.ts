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

  // ══════════════════════════════════════════════════════════════════════════
  // CU-04 — ConsultarCalificaciones
  // ══════════════════════════════════════════════════════════════════════════

  console.log("\nAgregando datos CU-04...");

  // Alumno sin materias — Prueba 4 CU-04
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

  // Materias
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

  // Periodos
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

  // Grupos
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

  // Sin grades — Prueba 5 CU-04
  const grupoProg = await prisma.group.upsert({
    where: { id: "group-2024b-PRG101" },
    update: {},
    create: { id: "group-2024b-PRG101", nombre: "Grupo A", subjectId: matProg.id, teacherId: profesor.id, periodId: periodoActual.id, cupo: 30 },
  });

  // Periodo anterior — Prueba 2 CU-04
  const grupoCalculoAnterior = await prisma.group.upsert({
    where: { id: "group-2024a-MAT101" },
    update: {},
    create: { id: "group-2024a-MAT101", nombre: "Grupo A", subjectId: matCalculo.id, teacherId: profesor.id, periodId: periodoAnterior.id, cupo: 30 },
  });

  // Inscripciones de Jesus en todos los grupos
  for (const gId of [grupoCalculo.id, grupoFisica.id, grupoProg.id, grupoCalculoAnterior.id]) {
    await prisma.enrollment.upsert({
      where: { studentId_groupId: { studentId: jesus.id, groupId: gId } },
      update: {},
      create: { studentId: jesus.id, groupId: gId },
    });
  }

  // Inscripciones de Hermes y Esmeralda — para CU-05 Prueba 1 (20 alumnos)
  for (const gId of [grupoCalculo.id, grupoFisica.id, grupoProg.id]) {
    await prisma.enrollment.upsert({
      where: { studentId_groupId: { studentId: hermes.id, groupId: gId } },
      update: {},
      create: { studentId: hermes.id, groupId: gId },
    });
    await prisma.enrollment.upsert({
      where: { studentId_groupId: { studentId: esmeralda.id, groupId: gId } },
      update: {},
      create: { studentId: esmeralda.id, groupId: gId },
    });
  }

  // Assignments + Grades para Calculo (CU-04 Pruebas 1 y 3)
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

  // Assignments + Grades para Fisica (CU-04)
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

  // PRG101 sin grade — Prueba 5 CU-04
  await prisma.assignment.upsert({
    where: { id: "asgn-PRG-t1" },
    update: {},
    create: { id: "asgn-PRG-t1", groupId: grupoProg.id, titulo: "Tarea 1: Variables", tipo: AssignmentType.TAREA, status: AssignmentStatus.PUBLICADO, fechaLimite: new Date("2024-11-30") },
  });

  // Periodo anterior — Prueba 2 CU-04
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

  // ══════════════════════════════════════════════════════════════════════════
  // CU-05 — RegistrarCalificaciones
  // ══════════════════════════════════════════════════════════════════════════

  console.log("\nAgregando datos CU-05...");

  // Assignment sin grades para que el profesor registre — Prueba 1 CU-05
  await prisma.assignment.upsert({
    where: { id: "asgn-MAT-p2" },
    update: {},
    create: {
      id: "asgn-MAT-p2",
      groupId: grupoCalculo.id,
      titulo: "Parcial 2",
      tipo: AssignmentType.EXAMEN,
      status: AssignmentStatus.PUBLICADO,
      fechaLimite: new Date("2024-12-01"),
    },
  });

  await prisma.assignment.upsert({
    where: { id: "asgn-FIS-p2" },
    update: {},
    create: {
      id: "asgn-FIS-p2",
      groupId: grupoFisica.id,
      titulo: "Parcial 2",
      tipo: AssignmentType.EXAMEN,
      status: AssignmentStatus.PUBLICADO,
      fechaLimite: new Date("2024-12-01"),
    },
  });

  await prisma.assignment.upsert({
    where: { id: "asgn-PRG-p1" },
    update: {},
    create: {
      id: "asgn-PRG-p1",
      groupId: grupoProg.id,
      titulo: "Parcial 1",
      tipo: AssignmentType.EXAMEN,
      status: AssignmentStatus.PUBLICADO,
      fechaLimite: new Date("2024-12-01"),
    },
  });

  // Grupo sin alumnos — Prueba 6 CU-05
  const matCalculoRef = await prisma.subject.findUnique({ 
    where: { codigo: "MAT101" } 
  });
  
  const grupoSinAlumnos = await prisma.group.upsert({
    where: { id: "group-sin-alumnos" },
    update: {},
    create: {
      id: "group-sin-alumnos",
      nombre: "Grupo Sin Alumnos",
      subjectId: matCalculoRef!.id,
      teacherId: profesor.id,      // ya existe en el scope de main()
      periodId:  periodoActual.id, // ya existe en el scope de main()
      cupo: 30,
    },
  });

  await prisma.assignment.upsert({
    where: { id: "asgn-sin-alumnos-p1" },
    update: {},
    create: {
      id:          "asgn-sin-alumnos-p1",
      groupId:     grupoSinAlumnos.id,
      titulo:      "Parcial 1",
      tipo:        AssignmentType.EXAMEN,
      status:      AssignmentStatus.PUBLICADO,
      fechaLimite: new Date("2024-12-01"),
    },
  });

  // aquí va el console.log("CU-05 listo.")

  console.log("CU-05 listo.");
  console.log("  Prueba 1   -> profesor / profesor123 -> /profesor/calificar -> MAT101 -> Parcial 2 -> calificar a los 3 alumnos");
  console.log("  Prueba 2   -> mismo flujo, dejar a Hermes sin calificar (registro parcial)");
  console.log("  Prueba 3   -> seleccionar Parcial 1 (ya tiene grades) -> modificar valor");
  console.log("  Prueba 4   -> ingresar valor 11 -> error rojo en el input");
  console.log("  Prueba 5   -> cambiar isActive=false en BD -> mensaje periodo cerrado");
  console.log("  Prueba 6   -> crear grupo sin enrollments en BD -> mensaje sin alumnos");
  console.log("  Prueba 7   -> login hermes / pugulso123 -> /profesor/calificar -> redirect");
  console.log("  Prueba 8   -> desconectar BD despues de guardar -> grade persiste, warning en resultado");

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