export const ALUMNO = {
  email: "auvh050615@gs.utm.mx",
  password: "pugulso123&",
} as const;

// Alumno del seed que NO tiene submissions creadas.
// Usado por alumno-tareas-vacio.spec.ts. El spec lo inscribe a un grupo
// del periodo activo en beforeAll para que pase la guarda y caiga en la
// rama "Estas al dia".
export const ALUMNO_SIN_TAREAS = {
  email: "jesusmo03182005@gmail.com",
  password: "b1e2i3s4",
} as const;
