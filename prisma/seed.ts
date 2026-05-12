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

async function cleanDatabase() {
  console.log("Limpiando base de datos...");
  // Eliminar en orden inverso a las dependencias
  await prisma.accessLog.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.procedure.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.period.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.carrera.deleteMany({});
  console.log("Base de datos limpia.");
}

async function main() {
  await cleanDatabase();

  console.log("\nGenerando datos iniciales aleatorios congruentes...");

  const nombres = ["Carlos", "Ana", "Luis", "Maria", "Jorge", "Laura", "Pedro", "Sofia", "Diego", "Lucia", "Fernando", "Valeria"];
  const apellidos = ["Garcia", "Martinez", "Lopez", "Gonzalez", "Perez", "Rodriguez", "Sanchez", "Ramirez", "Cruz", "Flores", "Hernandez", "Gomez"];
  
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  
  let matriculaCounter = 1000000000;
  let emailCounter = 1;

  const defaultPassword = await bcrypt.hash("Password123", 10);

  // 1. Carreras
  console.log("Creando carreras...");
  const carreraIC = await prisma.carrera.create({ data: { nombre: "Ingenieria en Computacion", codigo: "IC" } });
  const carreraIE = await prisma.carrera.create({ data: { nombre: "Ingenieria en Electronica", codigo: "IE" } });
  const carreraMec = await prisma.carrera.create({ data: { nombre: "Ingenieria Mecatronica", codigo: "IM" } });
  const carreras = [carreraIC, carreraIE, carreraMec];

  // 2. Administrador de prueba
  console.log("Creando administrador...");
  const admin = await prisma.user.create({
    data: {
      matricula: "0000000000",
      nombre: "Admin",
      apellidos: "Sistema",
      email: "admin@utm.mx",
      passwordHash: defaultPassword,
      carrera: "Administracion",
      carreraId: carreraIC.id,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVO,
    }
  });

  // 3. Profesores
  console.log("Creando profesores...");
  const profesores = [];
  // Profesor conocido para pruebas
  profesores.push(await prisma.user.create({
    data: {
      matricula: "1111111111",
      nombre: "Profesor",
      apellidos: "Prueba",
      email: "profesor@utm.mx",
      passwordHash: defaultPassword,
      carrera: "Ingenieria en Computacion",
      carreraId: carreraIC.id,
      role: UserRole.PROFESOR,
      status: UserStatus.ACTIVO,
    }
  }));

  for(let i=0; i<9; i++) { // 10 profesores en total
    const nombre = randomElement(nombres);
    const apellido = randomElement(apellidos);
    const matricula = (matriculaCounter++).toString();
    const prof = await prisma.user.create({
      data: {
        matricula,
        nombre,
        apellidos: apellido,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${emailCounter++}@utm.mx`,
        passwordHash: defaultPassword,
        carrera: "Ingenieria en Computacion",
        carreraId: randomElement(carreras).id,
        role: UserRole.PROFESOR,
        status: UserStatus.ACTIVO,
      }
    });
    profesores.push(prof);
  }

  // 4. Alumnos
  console.log("Creando alumnos...");
  const alumnos = [];
  // Alumno conocido para pruebas
  alumnos.push(await prisma.user.create({
    data: {
      matricula: "2222222222",
      nombre: "Alumno",
      apellidos: "Prueba",
      email: "alumno@gs.utm.mx",
      passwordHash: defaultPassword,
      carrera: "Ingenieria en Computacion",
      carreraId: carreraIC.id,
      role: UserRole.ALUMNO,
      status: UserStatus.ACTIVO,
    }
  }));

  for(let i=0; i<49; i++) { // 50 alumnos en total
    const nombre = randomElement(nombres);
    const apellido = randomElement(apellidos);
    const matricula = (matriculaCounter++).toString();
    const alumno = await prisma.user.create({
      data: {
        matricula,
        nombre,
        apellidos: apellido,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${emailCounter++}@gs.utm.mx`,
        passwordHash: defaultPassword,
        carrera: "Ingenieria en Computacion",
        carreraId: randomElement(carreras).id,
        role: UserRole.ALUMNO,
        status: UserStatus.ACTIVO,
      }
    });
    alumnos.push(alumno);
  }

  // 5. Materias
  console.log("Creando materias...");
  const materias = [];
  const subjectNames = [
    "Redes de Computadoras", "Sistemas Operativos II", "Inteligencia Artificial",
    "Compiladores", "Estructuras de Datos", "Arquitectura de Computadoras",
    "Ingenieria de Software", "Bases de Datos", "Programacion Web", "Calculo Diferencial"
  ];
  for (let i=0; i<subjectNames.length; i++) {
    const cod = `MAT${randomInt(100, 999)}`;
    const mat = await prisma.subject.create({
      data: {
        nombre: subjectNames[i],
        codigo: cod,
        creditos: randomInt(4, 8)
      }
    });
    materias.push(mat);
  }

  // 6. Periodo
  console.log("Creando periodo actual...");
  const periodoActual = await prisma.period.create({
    data: {
      nombre: "Semestre 2026-A",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-07-15"),
      isActive: true,
    }
  });

  // 7. Grupos y Horarios
  console.log("Creando grupos y horarios...");
  const grupos = [];
  const days = [1, 2, 3, 4, 5]; // Lunes a Viernes
  for(let i=0; i<20; i++) {
    const mat = randomElement(materias);
    const prof = randomElement(profesores);
    const startH = randomInt(7, 16);
    const endH = startH + randomInt(1, 2);
    
    const g = await prisma.group.create({
      data: {
        subjectId: mat.id,
        teacherId: prof.id,
        periodId: periodoActual.id,
        nombre: `Grupo ${String.fromCharCode(65 + randomInt(0, 3))}`, // Grupo A, B, C, D
        cupo: randomInt(25, 40),
        day: randomElement(days),
        startTime: `${startH.toString().padStart(2, '0')}:00`,
        endTime: `${endH.toString().padStart(2, '0')}:00`,
        classroom: `Aula ${randomInt(10, 50)}`
      }
    });
    grupos.push(g);
  }

  // 8. Inscripciones (Enrollments)
  console.log("Inscribiendo alumnos...");
  for (const alumno of alumnos) {
    // Inscribir a cada alumno en 3-6 materias (grupos) asegurando que no se repita el subject
    const numGrupos = randomInt(3, 6);
    const gruposAleatorios = [...grupos].sort(() => 0.5 - Math.random());
    let inscritos = 0;
    const materiasInscritas = new Set<string>();

    for (const g of gruposAleatorios) {
      if (inscritos >= numGrupos) break;
      if (!materiasInscritas.has(g.subjectId)) {
        await prisma.enrollment.create({
          data: {
            studentId: alumno.id,
            groupId: g.id,
          }
        });
        materiasInscritas.add(g.subjectId);
        inscritos++;
      }
    }
  }

  // 9. Tareas, Entregas y Calificaciones
  console.log("Generando tareas y calificaciones...");
  for (const g of grupos) {
    const enrollments = await prisma.enrollment.findMany({ where: { groupId: g.id }});
    if (enrollments.length === 0) continue;
    
    // Crear 3 a 5 tareas/examenes por grupo
    const numTareas = randomInt(3, 5);
    for(let t=0; t<numTareas; t++) {
      const tipoRand = Math.random();
      const tipo = tipoRand > 0.6 ? AssignmentType.EXAMEN : (tipoRand > 0.3 ? AssignmentType.TAREA : AssignmentType.PROYECTO);
      
      const asgn = await prisma.assignment.create({
        data: {
          groupId: g.id,
          titulo: `${tipo === AssignmentType.EXAMEN ? 'Examen Parcial' : (tipo === AssignmentType.TAREA ? 'Practica' : 'Proyecto')} ${t+1}`,
          tipo: tipo,
          status: AssignmentStatus.PUBLICADO,
          fechaLimite: new Date(Date.now() + randomInt(-20, 15) * 86400000), // Limite entre -20 dias y +15 dias
          instrucciones: `Instrucciones generadas aleatoriamente para esta actividad.\n\nEl objetivo principal es aplicar los conocimientos adquiridos en el ${g.nombre}. Por favor, revise el formato requerido antes de enviar.`
        }
      });

      // Crear entregas y calificaciones para los alumnos inscritos
      for (const enr of enrollments) {
        const isPastDue = asgn.fechaLimite < new Date();
        // Probabilidad de entregar: 90% si ya venció, 60% si no ha vencido
        const probEntrega = isPastDue ? 0.90 : 0.60;
        
        if (Math.random() < probEntrega) {
          const isGraded = isPastDue ? Math.random() < 0.9 : Math.random() < 0.3; // Calificado depende si ya pasó
          const subStatus = isGraded ? SubmissionStatus.CALIFICADO : SubmissionStatus.ENTREGADO;
          
          const submittedDate = new Date(asgn.fechaLimite.getTime() - randomInt(1, 3) * 86400000); // 1-3 días antes
          const sub = await prisma.submission.create({
            data: {
              assignmentId: asgn.id,
              studentId: enr.studentId,
              status: subStatus,
              intento: 1,
              submittedAt: submittedDate > new Date() ? new Date() : submittedDate, // No poner fechas futuras de entrega
            }
          });
          
          if (isGraded) {
            await prisma.grade.create({
              data: {
                submissionId: sub.id,
                studentId: enr.studentId,
                valor: (randomInt(50, 100) / 10).toString(), // Decimal 5.0 a 10.0
                retroalimentacion: "Revisado. " + (Math.random() > 0.5 ? "Buen trabajo en esta entrega." : "Falta mejorar algunos aspectos técnicos.")
              }
            });
          }
        } else if (isPastDue) {
          // Si no entregó y ya venció, se queda pendiente sin calificar o calificado con 0
          if (Math.random() < 0.4) { // 40% de los profesores le ponen 0 si no entregan
            const sub = await prisma.submission.create({
              data: {
                assignmentId: asgn.id,
                studentId: enr.studentId,
                status: SubmissionStatus.CALIFICADO,
                intento: 1,
              }
            });
            await prisma.grade.create({
              data: {
                submissionId: sub.id,
                studentId: enr.studentId,
                valor: "0",
                retroalimentacion: "No se recibió entrega en la fecha estipulada."
              }
            });
          }
        }
      }
    }
  }

  console.log("\n==========================================================");
  console.log("¡Base de datos sembrada correctamente con datos congruentes!");
  console.log("==========================================================");
  console.log("Cuentas de prueba estáticas:");
  console.log("----------------------------------------------------------");
  console.log(`ADMINISTRADOR : Email: admin@utm.mx       | Contraseña: Password123`);
  console.log(`PROFESOR      : Email: profesor@utm.mx    | Contraseña: Password123`);
  console.log(`ALUMNO        : Email: alumno@gs.utm.mx   | Contraseña: Password123`);
  console.log(`(Todas las cuentas aleatorias generadas usan Password123)`);
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });