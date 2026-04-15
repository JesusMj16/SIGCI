"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { firstName } from "@/lib/user-display";
import type { SidebarUser } from "./SidebarNav";

type NavbarProps = {
  user: SidebarUser;
};

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname() ?? "/";
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <div className="hidden items-center justify-between gap-4 px-10 pt-8 md:flex">
      <nav aria-label="Ruta de navegación" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <li>
            <Link
              href="/"
              className="font-medium text-neutral-foreground/60 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral"
            >
              Inicio
            </Link>
          </li>
          {crumbs.map(({ href, label }, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={href} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="text-neutral-foreground/30"
                >
                  /
                </span>
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-primary"
                  >
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="font-medium text-neutral-foreground/60 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificaciones"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral"
        >
          <BellAlertIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="hidden items-center gap-3 rounded-full bg-card px-4 py-2 lg:flex">
          <span className="text-sm font-semibold text-primary">
            {firstName(user.name)}
          </span>
        </div>
      </div>
    </div>
  );
}
