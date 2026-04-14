"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import type { NavItem } from "@/lib/nav";

type MobileSidebarProps = {
  items: NavItem[];
};
export function MobileSidebar({ items }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Abrir menú de navegación"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 bg-neutral p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="font-heading text-2xl font-bold text-primary">
            UTM
          </SheetTitle>
          <p className="text-sm text-neutral-foreground/70">
            Universidad Tecnológica de la Mixteca
          </p>
        </SheetHeader>

        <SidebarNav items={items} variant="mobile" />
      </SheetContent>
    </Sheet>
  );
}
