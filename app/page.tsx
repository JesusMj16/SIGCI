import { redirect } from "next/navigation";

// Delegamos el destino al proxy: sin sesion -> permanece en /login;
// con sesion -> proxy.ts redirige al dashboard segun rol via getDashboardUrl.
export default function Home() {
  redirect("/login");
}
