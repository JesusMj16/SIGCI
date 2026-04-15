import type { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  UserCircleIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { UserRole } from "./generated/prisma/enums";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

const commonNavItems: NavItem[] = [
  { label: "Inicio", href: "/", icon: HomeIcon },
  { label: "Perfil", href: "/perfil", icon: UserCircleIcon },
  { label: "Credencial", href: "/credencial", icon: IdentificationIcon },
];

export const navByRole: Record<UserRole, NavItem[]> = {
  ALUMNO: [
    ...commonNavItems,
    { label: "Cursos", href: "/alumno/cursos", icon: BookOpenIcon },
    { label: "Calificaciones", href: "/alumno/calificaciones", icon: AcademicCapIcon },
  ],
  PROFESOR: [
    ...commonNavItems,
    { label: "Grupos", href: "/profesor/grupos", icon: UserGroupIcon },
    { label: "Calificar", href: "/profesor/calificar", icon: ClipboardDocumentCheckIcon },
  ],
  ADMIN: [
    ...commonNavItems,
    { label: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
    { label: "Grupos", href: "/admin/grupos", icon: UserGroupIcon },
    { label: "Trámites", href: "/admin/tramites", icon: DocumentTextIcon },
  ],
  COORDINADOR: [
    ...commonNavItems,
    { label: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
    { label: "Grupos", href: "/admin/grupos", icon: UserGroupIcon },
  ],
  BIBLIOTECA: [
    ...commonNavItems,
    { label: "Libros", href: "/biblioteca/libros", icon: BookOpenIcon },
    { label: "Préstamos", href: "/biblioteca/prestamos", icon: ArrowsRightLeftIcon },
  ],
  SERVICIOS_ESCOLARES: [
    ...commonNavItems,
    { label: "Trámites", href: "/servicios-escolares/tramites", icon: DocumentTextIcon },
    { label: "Horarios", href: "/servicios-escolares/horarios", icon: CalendarDaysIcon },
  ],
  DIRECTOR: [
    ...commonNavItems,
    { label: "Reportes", href: "/director/reportes", icon: ChartBarIcon },
  ],
  PERSONAL_OPERATIVO: [
    ...commonNavItems,
    { label: "Mantenimiento", href: "/personal-operativo/mantenimiento", icon: WrenchScrewdriverIcon },
  ],
};

export function getNavForRole(role: UserRole): NavItem[] {
  return navByRole[role] ?? [];
}
