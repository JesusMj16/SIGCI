import { navByRole } from "./nav";

export type Crumb = {
  href: string;
  label: string;
};

const NAV_LABEL_BY_HREF: Record<string, string> = Object.values(navByRole)
  .flat()
  .reduce<Record<string, string>>((acc, item) => {
    acc[item.href] = item.label;
    return acc;
  }, {});

const SLUG_FALLBACK: Record<string, string> = {
  alumno: "Alumno",
  profesor: "Profesor",
  admin: "Administración",
  biblioteca: "Biblioteca",
  "servicios-escolares": "Servicios Escolares",
  director: "Dirección",
  "personal-operativo": "Operaciones",
};

function capitalize(slug: string): string {
  const clean = slug.replace(/-/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function labelForHref(href: string, segment: string): string {
  return (
    NAV_LABEL_BY_HREF[href] ?? SLUG_FALLBACK[segment] ?? capitalize(segment)
  );
}

export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { href, label: labelForHref(href, segment) };
  });
}
