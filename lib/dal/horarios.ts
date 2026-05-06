// lib/dal/groups.ts
import { prisma } from "@/lib/db";

async function getActiveOrLastPeriod() {
  let period = await prisma.period.findFirst({ where: { isActive: true } });
  let isFallback = false;
  
  if (!period) {
    period = await prisma.period.findFirst({ orderBy: { endDate: 'desc' } });
    isFallback = true;
  }
  return { period, isFallback };
}

export async function getStudentSchedule(studentId: string) {
  const { period, isFallback } = await getActiveOrLastPeriod();
  if (!period) return { schedule: [], isFallback: false, period: null };

  const schedule = await prisma.group.findMany({
    where: {
      periodId: period.id,
      enrollments: { some: { studentId: studentId } } 
    },
    include: {
      subject: true,
      teacher: { select: { nombre: true, apellidos: true } }
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
  });

  return { schedule, isFallback, period };
}

export async function getTeacherSchedule(teacherId: string) {
  const { period, isFallback } = await getActiveOrLastPeriod();
  if (!period) return { schedule: [], isFallback: false, period: null };

  const schedule = await prisma.group.findMany({
    where: {
      periodId: period.id,
      teacherId: teacherId
    },
    include: { subject: true },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
  });

  return { schedule, isFallback, period };
}