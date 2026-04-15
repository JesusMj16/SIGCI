"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav, type SidebarUser } from "./SidebarNav";
import type { NavItem } from "@/lib/nav";

type MobileSidebarProps = {
  items: NavItem[];
  user: SidebarUser;
};

export function MobileSidebar({ items, user }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Abrir menú de navegación"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 bg-neutral p-0">
        <SheetHeader className="px-6 pb-2 pt-6">
          <SheetTitle className="font-heading text-3xl font-bold tracking-tight text-primary">
            UTM
          </SheetTitle>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-foreground/60">
            Académico
          </p>
        </SheetHeader>

        <SidebarNav items={items} user={user} variant="mobile" />
      </SheetContent>
    </Sheet>
  );
}
