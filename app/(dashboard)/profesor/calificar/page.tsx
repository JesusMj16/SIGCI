import { getGruposProfesorAction } from "@/lib/actions/registrarCalificaciones.actions";
import { RegistrarCalificacionesContainer } from "./_components/RegistrarCalificacionesContainer";
import "./calificar.css";

export const metadata = {
  title: "Registrar Calificaciones | SIGCI",
  description: "Registra calificaciones para tus grupos asignados.",
};

export default async function CalificarPage() {
  const gruposResult = await getGruposProfesorAction();

  return (
    <main>
      <RegistrarCalificacionesContainer gruposResult={gruposResult} />
    </main>
  );
}