import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/dal/session";

export async function getAcademicHistory(targetStudentId: string) {
    const currentUser = await getAuthenticatedUser();
    const isStaff = currentUser.role === "ADMIN" || currentUser.role === "SERVICIOS_ESCOLARES";
    const isOwner = currentUser.id === targetStudentId;

    if (!isOwner && !isStaff) {
        throw new Error("No tienes permiso para ver este historial.");
    }

    return await prisma.enrollment.findMany({
        where: { studentId: targetStudentId },
        include: {
            group: {
                include: {
                    subject: true,
                    period: true,
                    assignments: {
                        include: {
                            submissions: {
                                where: { studentId: targetStudentId },
                                include: {
                                    grade: true
                                }
                            }
                        }
                    }
                },
            },
        },
        orderBy: {
            group: {
                period: { startDate: 'desc' }
            }
        }
    });
}