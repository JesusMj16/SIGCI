import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🚀 Iniciando seed detallado para Historial Académico...");

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("L1234567", saltRounds);

    // 0. Crear Carrera con CREDITOS TOTALES (Para que el Avance Curricular muestre un %)
    const carreraSistemas = await prisma.carrera.upsert({
        where: { codigo: "ING-SIS-2024" },
        update: { creditosTotales: 350 }, // Actualizamos por si ya existía
        create: {
            nombre: "Ingeniería en Sistemas Computacionales",
            codigo: "ING-SIS-2024",
            activa: true,
            creditosTotales: 350 // Valor total del plan
        }
    });

    // 1. Alumno
    const alumno = await prisma.user.upsert({
        where: { email: "alumno.prueba@test.com" },
        update: {},
        create: {
            matricula: "ALU2026001",
            nombre: "Leonardo",
            apellidos: "Prueba Historial",
            email: "alumno.prueba@test.com",
            passwordHash: passwordHash,
            role: "ALUMNO",
            status: "ACTIVO",
            carrera: "Ingeniería en Sistemas Computacionales",
            carreraId: carreraSistemas.id,
        },
    });

    // 2. Profesor
    const profesor = await prisma.user.upsert({
        where: { email: "profesor.test@test.com" },
        update: {},
        create: {
            matricula: "PROF2026",
            nombre: "Dr. Roberto",
            apellidos: "García",
            email: "profesor.test@test.com",
            passwordHash: passwordHash,
            role: "PROFESOR",
            status: "ACTIVO",
            carrera: "Ingeniería en Sistemas Computacionales",
            carreraId: carreraSistemas.id,
        },
    });

    // 3. Periodo
    const periodo = await prisma.period.create({
        data: {
            nombre: "2026-1 (Primavera)",
            startDate: new Date("2026-01-15"),
            endDate: new Date("2026-06-15"),
            isActive: true,
        },
    });

    // 4. Materias
    const materia1 = await prisma.subject.create({
        data: { nombre: "Programación Avanzada", codigo: "PROG402", creditos: 8 }
    });
    const materia2 = await prisma.subject.create({
        data: { nombre: "Bases de Datos II", codigo: "BD201", creditos: 7 }
    });

    // 5. Grupos
    const grupo1 = await prisma.group.create({
        data: {
            nombre: "G-401",
            subjectId: materia1.id,
            teacherId: profesor.id,
            periodId: periodo.id,
            cupo: 35,
            day: 1,
            startTime: "07:00",
            endTime: "09:00",
            classroom: "Lab A",
        }
    });

    const grupo2 = await prisma.group.create({
        data: {
            nombre: "G-202",
            subjectId: materia2.id,
            teacherId: profesor.id,
            periodId: periodo.id,
            cupo: 30,
            day: 3,
            startTime: "09:00",
            endTime: "11:00",
            classroom: "Aula 102",
        }
    });

    // 6. Inscripciones
    await prisma.enrollment.createMany({
        data: [
            { studentId: alumno.id, groupId: grupo1.id },
            { studentId: alumno.id, groupId: grupo2.id }
        ]
    });

    // 7. Calificar Materia 1 (8 Créditos)
    const tarea1 = await prisma.assignment.create({
        data: {
            groupId: grupo1.id,
            titulo: "Proyecto Final",
            tipo: "PROYECTO",
            status: "CERRADO",
            fechaLimite: new Date(),
        }
    });

    const entrega1 = await prisma.submission.create({
        data: {
            assignmentId: tarea1.id,
            studentId: alumno.id,
            status: "CALIFICADO",
            submittedAt: new Date(),
        }
    });

    await prisma.grade.create({
        data: {
            submissionId: entrega1.id,
            studentId: alumno.id,
            valor: 9.50,
        }
    });

    // 8. Calificar Materia 2 (7 Créditos) - PARA QUE SUME AL AVANCE
    const tarea2 = await prisma.assignment.create({
        data: {
            groupId: grupo2.id,
            titulo: "Examen de Base de Datos",
            tipo: "EXAMEN",
            status: "CERRADO",
            fechaLimite: new Date(),
        }
    });

    const entrega2 = await prisma.submission.create({
        data: {
            assignmentId: tarea2.id,
            studentId: alumno.id,
            status: "CALIFICADO",
            submittedAt: new Date(),
        }
    });

    await prisma.grade.create({
        data: {
            submissionId: entrega2.id,
            studentId: alumno.id,
            valor: 8.0,
        }
    });

    console.log("---");
    console.log("✅ Seed actualizado con éxito.");
    console.log(`📊 Avance esperado: ${(15 / 350 * 100).toFixed(1)}% (15 créditos de 350)`);
    console.log("---");
}

main()
    .catch((e) => {
        console.error("❌ Error en el seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
        await prisma.$disconnect();
    });