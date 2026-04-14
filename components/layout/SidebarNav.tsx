"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { NavItem } from "@/lib/nav";

type SidebarNavProps = {
  items: NavItem[];
  variant?: "desktop" | "mobile";
};

export function SidebarNav({ items, variant = "desktop" }: SidebarNavProps) {
  const pathname = usePathname();

  // href === "/" se trata aparte para evitar que "Inicio" quede activo en todas las rutas
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const isDesktop = variant === "desktop";

  return (
    <nav
      aria-label="Navegación principal"
      className={clsx(
        "flex flex-col gap-6",
        isDesktop &&
          "hidden md:flex md:w-64 md:shrink-0 md:h-full md:border-r md:border-border md:bg-neutral md:p-4",
        !isDesktop && "p-4"
      )}
    >
      {isDesktop && (
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold text-primary">UTM</h1>
          <p className="text-sm text-neutral-foreground/70">
            Universidad Tecnológica de la Mixteca
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-neutral-foreground hover:bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
