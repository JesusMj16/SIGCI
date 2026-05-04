"use server";

/**
 * Wrappers delgados: toda la logica vive en lib/dal/enrollments.
 */
import {
  inscribirAlumno as inscribirAlumnoDAL,
  obtenerInscripcionesDelAlumno as obtenerInscripcionesDelAlumnoDAL,
  desinscribirAlumno as desinscribirAlumnoDAL,
} from "@/lib/dal/enrollments";

export async function inscribirAlumno(input: {
  studentId: string;
  groupId: string;
}) {
  return inscribirAlumnoDAL(input);
}

export async function obtenerInscripcionesDelAlumno(studentId: string) {
  return obtenerInscripcionesDelAlumnoDAL(studentId);
}

export async function desinscribirAlumno(enrollmentId: string) {
  return desinscribirAlumnoDAL(enrollmentId);
}
