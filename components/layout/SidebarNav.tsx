"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { SheetClose } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/config/nav";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { ROLE_LABEL, initialsOf } from "@/lib/presentation/user-display";
import { NavIcon } from "./NavIcon";

export type SidebarUser = {
  name: string;
  email: string;
  role: UserRole;
};

type SidebarNavProps = {
  items: NavItem[];
  user: SidebarUser;
  variant?: "desktop" | "mobile";
};

export function SidebarNav({
  items,
  user,
  variant = "desktop",
}: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname?.startsWith(href + "/");

  const isDesktop = variant === "desktop";

  return (
    <nav
      aria-label="Navegación principal"
      className={clsx(
        "flex flex-col gap-8",
        isDesktop &&
          "sticky top-0 hidden h-screen w-64 shrink-0 bg-neutral p-6 md:flex",
        !isDesktop && "h-full p-4"
      )}
    >
      {isDesktop && (
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">
            UTM
          </h1>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-foreground/60">
            Académico
          </p>
        </div>
      )}

      <ul className="flex flex-1 flex-col gap-1">
        {items.map(({ label, href, iconKey }) => {
          const active = isActive(href);
          const link = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-foreground/80 hover:bg-primary/5 hover:text-primary"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                />
              )}
              <NavIcon
                iconKey={iconKey}
                className={clsx(
                  "h-5 w-5 shrink-0 transition",
                  active
                    ? "text-primary"
                    : "text-neutral-foreground/60 group-hover:text-primary"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
            </Link>
          );

          return (
            <li key={href}>
              {isDesktop ? link : <SheetClose asChild>{link}</SheetClose>}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <div className="flex items-center gap-3 rounded-lg bg-card/60 p-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary"
          >
            {initialsOf(user.name) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-primary">
              {user.name}
            </p>
            <p className="truncate text-xs text-neutral-foreground/60">
              {ROLE_LABEL[user.role]}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-foreground/80 transition hover:bg-secondary/10 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral"
        >
          <ArrowRightStartOnRectangleIcon
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

