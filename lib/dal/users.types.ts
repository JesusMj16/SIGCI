import type { UserRole } from "@/lib/generated/prisma/enums";


export type CrearUsuarioConCredencialInput = {
  matricula: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  carrera: string;
  role: UserRole;
};

export type CrearUsuarioConCredencialOutput = {
  userId: string;
  credentialId: string;
  qrData: string;
};

export type UsuarioListadoDTO = {
  id: string;
  matricula: string;
  nombre: string;
  apellidos: string;
  email: string;
  role: UserRole;
  status: string;
  tieneCredencial: boolean;
  credencialActiva: boolean;
};

export type CredencialPropiaDTO = {
  tieneCredencial: boolean;
  credencialActiva: boolean;
  qrData: string | null;
  expiresAt: string | null;
};
