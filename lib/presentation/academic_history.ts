// lib/presentation/academic-history.ts

export function getFinalGrade(enrollment: any): number | "Pendiente" {
    const assignments = enrollment.group.assignments;

    const grades = assignments
        .flatMap((a: any) => a.submissions)
        .map((s: any) => s.grade?.valor)
        .filter((v: any) => v !== undefined && v !== null);

    if (grades.length === 0) return "Pendiente";

    const sum = grades.reduce((acc: number, val: any) => acc + Number(val), 0);
    return Number((sum / grades.length).toFixed(1));
}
export function calculateAcademicSummary(enrollments: any[], totalPlanCredits: number | null) {
    let accumulatedCredits = 0;

    enrollments.forEach(e => {
        const grade = getFinalGrade(e);
        if (typeof grade === 'number' && grade >= 6.0) {
            accumulatedCredits += e.group.subject.credits;
        }
    });

    return {
        accumulatedCredits,
        progressPercentage: totalPlanCredits
            ? ((accumulatedCredits / totalPlanCredits) * 100).toFixed(2)
            : "—"
    };
}