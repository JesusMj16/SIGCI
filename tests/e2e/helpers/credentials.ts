/**
 * Credenciales y rutas de storageState.
 * Single source of truth — los specs y POMs los importan desde aquí.
 */

import path from "node:path";

const ROOT = path.resolve(__dirname, "..", ".auth");

export const AUTH_FILES = {
  alumno: path.join(ROOT, "alumno.json"),
  profesor: path.join(ROOT, "profesor.json"),
  sinmaterias: path.join(ROOT, "sinmaterias.json"),
} as const;

export interface Credenciales {
  email: string;
  password: string;
}

export const CREDENCIALES: Record<keyof typeof AUTH_FILES, Credenciales> = {
  alumno: {
    email: "jesusmo03182005@gmail.com",
    password: "b1e2i3s4",
  },
  profesor: {
    email: "profesor@utm.mx",
    password: "profesor123",
  },
  sinmaterias: {
    email: "sinmaterias@utm.mx",
    password: "test123",
  },
};

/** Datos del seed útiles para asserts (matrícula, nombres, codes). */
export const USERS = {
  alumno: {
    email: CREDENCIALES.alumno.email,
    matricula: "2023020223",
    nombre: "Jesus Alfonso Morales Jaimes",
  },
  profesor: {
    email: CREDENCIALES.profesor.email,
    matricula: "profesor",
    nombre: "Profesor Profesor",
  },
  sinmaterias: {
    email: CREDENCIALES.sinmaterias.email,
    matricula: "sinmaterias",
  },
} as const;

export const SEED_DATA = {
  periodos: {
    actual: { id: "periodo-2024b", nombre: "Agosto-Diciembre 2024" },
    anterior: { id: "periodo-2024a", nombre: "Enero-Junio 2024" },
  },
  materias: {
    calculo: { codigo: "MAT101", nombre: "Calculo Diferencial" },
    fisica: { codigo: "FIS101", nombre: "Fisica General" },
    programacion: { codigo: "PRG101", nombre: "Fundamentos de Programacion" },
  },
  groups: {
    calculoActual: "group-2024b-MAT101",
    fisicaActual: "group-2024b-FIS101",
    progActual: "group-2024b-PRG101",
    sinAlumnos: "group-sin-alumnos",
  },
  assignments: {
    matP1: "asgn-MAT-p1", // ya tiene grade
    matP2: "asgn-MAT-p2", // sin grades — captura nueva
    fisP2: "asgn-FIS-p2",
    progP1: "asgn-PRG-p1",
  },
} as const;
