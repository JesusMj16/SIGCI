import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNavForRole } from "@/lib/config/nav";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.role) redirect("/login");

  const items = getNavForRole(session.user.role);
  const user = {
    name: session.user.name ?? "Usuario",
    email: session.user.email ?? "",
    role: session.user.role,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav items={items} user={user} />

      <div className="flex flex-1 flex-col bg-neutral">
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-neutral/80 px-4 py-3 backdrop-blur-sm md:hidden">
          <MobileSidebar items={items} user={user} />
          <span className="font-heading text-lg font-bold text-primary">
            UTM
          </span>
        </header>

        <Navbar user={user} />

        <main className="flex-1 px-4 pb-10 pt-2 md:px-10 md:pb-12 md:pt-4">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
