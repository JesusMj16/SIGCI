import type { ComponentType, SVGProps } from "react";
import {
  UsersIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export type QuickLink = {
  href: string;
  label: string;
  hint: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const ADMIN_QUICK_LINKS: QuickLink[] = [
  {
    href: "/admin/usuarios",
    label: "Gestión de usuarios",
    hint: "Altas, bajas y roles",
    icon: UsersIcon,
  },
  {
    href: "/admin/periodos",
    label: "Periodos",
    hint: "Ciclos académicos",
    icon: CalendarDaysIcon,
  },
  {
    href: "/admin/catalogo",
    label: "Catálogo",
    hint: "Materias y planes",
    icon: BookOpenIcon,
  },
  {
    href: "/admin/reportes",
    label: "Reportes",
    hint: "Métricas y exportaciones",
    icon: ChartBarIcon,
  },
];
