// components/dashboard/ScheduleGrid.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const DAYS = [
  { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, 
  { id: 3, name: 'Miércoles' }, { id: 4, name: 'Jueves' }, 
  { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' }
];

export default function ScheduleGrid({ schedule, role }: { schedule: any[], role: 'ALUMNO' | 'PROFESOR' }) {
  const [filterDay, setFilterDay] = useState<number | null>(null);

  if (schedule.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {role === 'ALUMNO' 
            ? "No tienes materias inscritas en este periodo." 
            : "No tienes grupos asignados en este periodo."}
        </p>
      </div>
    );
  }

  const downloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SIGCI//Horario//ES\n";
    schedule.forEach(clase => {
      icsContent += `BEGIN:VEVENT\nSUMMARY:${clase.subject.nombre}\nLOCATION:Aula ${clase.classroom}\n`;
      icsContent += `DESCRIPTION:Clase de ${clase.startTime} a ${clase.endTime}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'horario_clases.ics';
    link.click();
  };

  const daysToRender = filterDay ? DAYS.filter(d => d.id === filterDay) : DAYS;

  return (
    <div className="space-y-6">
      {/* Controles: Filtros y Exportación */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button 
            variant={filterDay === null ? "default" : "outline"} 
            onClick={() => setFilterDay(null)}
          >
            Todos
          </Button>
          <Button 
            variant={filterDay === 3 ? "default" : "outline"} 
            onClick={() => setFilterDay(3)}
          >
            Miércoles
          </Button>
        </div>
        <Button onClick={downloadICS} variant="secondary">
          Exportar a Calendario (.ics)
        </Button>
      </div>

      {/* Grilla Semanal */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {daysToRender.map(day => {
          const classesToday = schedule.filter(c => c.day === day.id);
          return (
            <div key={day.id} className="min-w-[150px]">
              <h3 className="text-center font-bold border-b pb-2 mb-3 dark:border-gray-700">
                {day.name}
              </h3>
              <div className="space-y-3">
                {classesToday.length > 0 ? (
                  classesToday.map(c => (
                    <div 
                      key={c.id} 
                      className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg shadow-sm dark:bg-blue-950/20 dark:border-blue-900"
                    >
                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 leading-tight">
                        {c.subject.nombre}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {c.startTime} - {c.endTime}
                      </p>
                      <p className="text-xs font-medium italic mt-1 text-gray-600 dark:text-gray-400">
                        Aula: {c.classroom}
                      </p>
                      {role === 'ALUMNO' && c.teacher && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 truncate border-t border-blue-100 dark:border-blue-900 pt-1">
                          Prof. {c.teacher.nombre}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/30 dark:border-gray-700">
                    <p className="text-xs text-center text-gray-400 italic">Libre</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}