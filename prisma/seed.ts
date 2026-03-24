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

  console.log({ jesus, hermes, esmeralda, admin, profesor });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
