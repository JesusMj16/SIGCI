import { getAuthenticatedUser } from "@/lib/dal/session";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AcademicCapIcon,
    ChartBarIcon,
    BookOpenIcon
} from "@heroicons/react/24/outline";

// --- LÓGICA DE CÁLCULO (Promedio de Grades vía Submissions) ---
function calculateFinalGrade(enrollment: any) {
    const allSubmissions = enrollment.group.assignments.flatMap(
        (a: any) => a.submissions
    );

    const grades = allSubmissions
        .map((s: any) => s.grade?.valor)
        .filter((v: any) => v !== null && v !== undefined);

    if (grades.length === 0) return null;

    const sum = grades.reduce((acc: number, val: any) => acc + Number(val), 0);
    return Number((sum / grades.length).toFixed(1));
}

export default async function HistorialAcademicoPage() {
    // 1. Identificación y Autenticación
    const userSession = await getAuthenticatedUser(["ALUMNO", "ADMIN"]);

    // 2. Recuperación de datos (Incluimos carreraRel para los créditos totales)
    const data = await prisma.user.findUnique({
        where: { id: userSession.id },
        include: {
            carreraRel: true,
            enrollments: {
                include: {
                    group: {
                        include: {
                            subject: true,
                            period: true,
                            assignments: {
                                include: {
                                    submissions: {
                                        where: { studentId: userSession.id },
                                        include: { grade: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    group: {
                        period: { startDate: "desc" },
                    },
                },
            },
        },
    });

    // Manejo de error o carga
    if (!data || !data.enrollments || data.enrollments.length === 0) {
        return (
            <div className="p-6">
                <Alert>
                    <AlertDescription>
                        No se encontraron registros académicos para tu matrícula.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // 3. Procesamiento de datos para la UI
    let totalCreditsAccumulated = 0;
    const groupedByPeriod: Record<string, any[]> = {};

    data.enrollments.forEach((enr) => {
        const periodName = enr.group.period.nombre;
        const finalGrade = calculateFinalGrade(enr);

        // Regla: Sumar créditos solo si la materia está aprobada (>= 6.0)
        if (finalGrade !== null && finalGrade >= 6.0) {
            totalCreditsAccumulated += enr.group.subject.creditos;
        }

        if (!groupedByPeriod[periodName]) {
            groupedByPeriod[periodName] = [];
        }
        groupedByPeriod[periodName].push({ ...enr, finalGrade });
    });

    // Cálculo de Avance Curricular
    const creditosTotalesPlan = data.carreraRel?.creditosTotales;
    const porcentajeAvance = (creditosTotalesPlan && totalCreditsAccumulated > 0)
        ? ((totalCreditsAccumulated / creditosTotalesPlan) * 100).toFixed(1)
        : null;

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Historial Académico</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Visualiza tus calificaciones finales y avance de créditos por periodo.
                </p>
            </div>

            {/* Resumen de Estadísticas */}
            <div className="grid gap-6 md:grid-cols-2">
                <StatCard
                    titulo="Créditos Acumulados"
                    valor={totalCreditsAccumulated}
                    icon={AcademicCapIcon}
                    descripcion="Total de materias aprobadas"
                    variant="default"
                />

                <StatCard
                    titulo="Avance Curricular"
                    valor={porcentajeAvance ? `${porcentajeAvance}%` : ""}
                    icon={ChartBarIcon}
                    descripcion={creditosTotalesPlan 
                        ? `De un total de ${creditosTotalesPlan} créditos` 
                        : "Plan de estudios sin créditos definidos"}
                    variant="accent"
                />
            </div>

            {/* Listado por Periodos */}
            <div className="space-y-12">
                {Object.entries(groupedByPeriod).map(([periodName, items]) => (
                    <section key={periodName} className="relative">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h2 className="text-xl font-bold text-foreground">{periodName}</h2>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Asignatura</th>
                                        <th className="px-6 py-4 font-semibold text-center">Créditos</th>
                                        <th className="px-6 py-4 font-semibold text-center">Calificación</th>
                                        <th className="px-6 py-4 font-semibold text-right">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/5 rounded-lg">
                                                        <BookOpenIcon className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{item.group.subject.nombre}</p>
                                                        <p className="text-xs text-muted-foreground">{item.group.subject.codigo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-medium text-muted-foreground">
                                                {item.group.subject.creditos}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {item.finalGrade !== null ? (
                                                    <span className="text-lg font-bold text-foreground">{item.finalGrade}</span>
                                                ) : (
                                                    <span className="text-muted-foreground/60 italic text-xs">Pendiente</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-tighter ${
                                                    item.finalGrade !== null && item.finalGrade >= 6.0
                                                        ? "bg-primary/10 text-primary"
                                                        : item.finalGrade === null
                                                            ? "bg-muted text-muted-foreground"
                                                            : "bg-secondary/10 text-secondary"
                                                }`}>
                                                    {item.finalGrade === null
                                                        ? "En Curso"
                                                        : item.finalGrade >= 6.0
                                                            ? "Aprobada"
                                                            : "Reprobada"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}