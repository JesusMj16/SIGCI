import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNavForRole } from "@/lib/nav";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.role) redirect("/login");

  const items = getNavForRole(session.user.role);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav items={items} />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-neutral px-4 py-2 md:hidden">
          <MobileSidebar items={items} />
          <span className="font-heading text-lg font-bold text-primary">UTM</span>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
