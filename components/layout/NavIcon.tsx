"use client";

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
import type { NavIconKey } from "@/lib/config/nav";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Mapa iconKey -> componente; se resuelve en cliente para evitar pasar
// componentes a traves del boundary server/client (React 19).
const ICONS: Record<NavIconKey, IconComponent> = {
  home: HomeIcon,
  user: UserCircleIcon,
  id: IdentificationIcon,
  book: BookOpenIcon,
  academic: AcademicCapIcon,
  users: UsersIcon,
  group: UserGroupIcon,
  check: ClipboardDocumentCheckIcon,
  document: DocumentTextIcon,
  swap: ArrowsRightLeftIcon,
  calendar: CalendarDaysIcon,
  chart: ChartBarIcon,
  wrench: WrenchScrewdriverIcon,
};

type NavIconProps = SVGProps<SVGSVGElement> & {
  iconKey: NavIconKey;
};

export function NavIcon({ iconKey, ...svgProps }: NavIconProps) {
  const Icon = ICONS[iconKey] ?? HomeIcon;
  return <Icon {...svgProps} />;
}
