import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "ALUMNO":
      redirect("/alumno");
    case "PROFESOR":
      redirect("/profesor");
    case "ADMIN":
    case "COORDINADOR":
      redirect("/admin");
    case "BIBLIOTECA":
      redirect("/biblioteca");
    case "SERVICIOS_ESCOLARES":
      redirect("/servicios-escolares");
    case "DIRECTOR":
      redirect("/director");
    case "PERSONAL_OPERATIVO":
      redirect("/personal-operativo");
    default:
      redirect("/login");
  }
}
