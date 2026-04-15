import { auth } from "@/auth";
import { getNavForRole } from "@/lib/nav";
import { SidebarNav } from "./SidebarNav";

export async function Sidebar() {
  const session = await auth();
  if (!session?.user?.role) return null;

  const items = getNavForRole(session.user.role);
  const user = {
    name: session.user.name ?? "Usuario",
    email: session.user.email ?? "",
    role: session.user.role,
  };

  return <SidebarNav items={items} user={user} />;
}
