import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/lib/generated/prisma/enums";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
};

export const getAuthenticatedUser = cache(
  async (allowedRoles?: UserRole[]): Promise<AuthenticatedUser> => {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (allowedRoles && !allowedRoles.includes(session.user.role)) redirect("/");
    return { id: session.user.id, role: session.user.role };
  }
);
