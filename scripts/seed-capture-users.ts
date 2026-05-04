import "dotenv/config";
import { PrismaClient, UserRole, UserStatus } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const users = [
  {
    matricula: "biblioteca",
    nombre: "Ana",
    apellidos: "Lopez",
    email: "biblioteca@utm.mx",
    password: "biblioteca123",
    carrera: "Administracion",
    role: UserRole.BIBLIOTECA,
  },
  {
    matricula: "servicios",
    nombre: "Rosa",
    apellidos: "Martinez",
    email: "servicios.escolares@utm.mx",
    password: "servicios123",
    carrera: "Administracion",
    role: UserRole.SERVICIOS_ESCOLARES,
  },
  {
    matricula: "director",
    nombre: "Luis",
    apellidos: "Mendoza",
    email: "director@utm.mx",
    password: "director123",
    carrera: "Administracion",
    role: UserRole.DIRECTOR,
  },
  {
    matricula: "operativo",
    nombre: "Jorge",
    apellidos: "Ramirez",
    email: "operativo@utm.mx",
    password: "operativo123",
    carrera: "Administracion",
    role: UserRole.PERSONAL_OPERATIVO,
  },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        status: UserStatus.ACTIVO,
      },
      create: {
        matricula: user.matricula,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        carrera: user.carrera,
        role: user.role,
        status: UserStatus.ACTIVO,
      },
    });
  }

  console.log("Capture users seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
