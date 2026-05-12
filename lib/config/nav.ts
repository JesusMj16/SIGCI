import type { UserRole } from "@/lib/generated/prisma/enums";

// NavItem usa iconKey (string) en vez de un componente para ser serializable
// cross server/client boundary (React 19 prohibe pasar funciones/componentes).
// El mapeo iconKey -> componente se hace en el cliente (SidebarNav).
export type NavIconKey =
  | "home"
  | "user"
  | "id"
  | "book"
  | "academic"
  | "users"
  | "group"
  | "check"
  | "document"
  | "swap"
  | "calendar"
  | "chart"
  | "wrench";

export type NavItem = {
  label: string;
  href: string;
  iconKey: NavIconKey;
};

const commonNavItems: NavItem[] = [
  { label: "Inicio", href: "/", iconKey: "home" },
  { label: "Perfil", href: "/perfil", iconKey: "user" },
  { label: "Credencial", href: "/credencial", iconKey: "id" },
];

export const navByRole: Record<UserRole, NavItem[]> = {
  ALUMNO: [
    ...commonNavItems,
    { label: "Cursos", href: "/alumno/cursos", iconKey: "book" },
    { label: "Tareas", href: "/alumno/tareas", iconKey: "check" },
    { label: "Calificaciones", href: "/alumno/calificaciones", iconKey: "academic" },
    { label: "Horario", href: "/alumno/horario", iconKey: "calendar" },
    { label: "Historial", href: "/alumno/historial", iconKey: "chart" },
  ],
  PROFESOR: [
    ...commonNavItems,
    { label: "Grupos", href: "/profesor/grupos", iconKey: "group" },
    { label: "Asignaciones", href: "/profesor/asignaciones/nueva", iconKey: "document" },
    { label: "Calificar", href: "/profesor/calificar", iconKey: "check" },
    // why: antes apuntaba a /alumno/horario por copy-paste; cada rol
    // tiene su propia ruta y su propia DAL (privacidad CU-06).
    { label: "Horario", href: "/profesor/horario", iconKey: "calendar" },
  ],
  ADMIN: [
    ...commonNavItems,
    { label: "Usuarios", href: "/admin/usuarios", iconKey: "users" },
    { label: "Grupos", href: "/admin/grupos", iconKey: "group" },
    { label: "Trámites", href: "/admin/tramites", iconKey: "document" },
  ],
  COORDINADOR: [
    ...commonNavItems,
    { label: "Usuarios", href: "/admin/usuarios", iconKey: "users" },
    { label: "Grupos", href: "/admin/grupos", iconKey: "group" },
  ],
  BIBLIOTECA: [
    ...commonNavItems,
    { label: "Libros", href: "/biblioteca/libros", iconKey: "book" },
    { label: "Préstamos", href: "/biblioteca/prestamos", iconKey: "swap" },
  ],
  SERVICIOS_ESCOLARES: [
    ...commonNavItems,
    { label: "Trámites", href: "/servicios-escolares/tramites", iconKey: "document" },
    { label: "Horarios", href: "/servicios-escolares/horarios", iconKey: "calendar" },
  ],
  DIRECTOR: [
    ...commonNavItems,
    { label: "Reportes", href: "/director/reportes", iconKey: "chart" },
  ],
  PERSONAL_OPERATIVO: [
    ...commonNavItems,
    { label: "Mantenimiento", href: "/personal-operativo/mantenimiento", iconKey: "wrench" },
  ],
  TECNICO: [
    ...commonNavItems,
    { label: "Préstamos", href: "/tecnico/prestamos", iconKey: "swap" },
    { label: "Inventario", href: "/tecnico/inventario", iconKey: "wrench" },
  ],
  JEFE_CARRERA: [
    ...commonNavItems,
    { label: "Programa", href: "/jefe-carrera/programa", iconKey: "academic" },
    { label: "Docentes", href: "/jefe-carrera/docentes", iconKey: "users" },
    { label: "Indicadores", href: "/jefe-carrera/indicadores", iconKey: "chart" },
  ],
};

export function getNavForRole(role: UserRole): NavItem[] {
  return navByRole[role] ?? [];
}
