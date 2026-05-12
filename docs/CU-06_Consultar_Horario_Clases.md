# CU-06 — Consultar Horario de Clases — Guía de Dibujo UML

Archivos reales:
- Páginas: `app/(dashboard)/alumno/horario/page.tsx`, `app/(dashboard)/profesor/horario/page.tsx`
- DAL: `lib/dal/horarios.ts` (`getMyStudentSchedule`, `getMyTeacherSchedule`, `resolvePeriod`, `toClassDTOs`)
- Presentación: `lib/presentation/horario.ts` (DTOs, `DAYS`, `isValidDay`, `isValidTime`)
- Exportación ICS: `lib/presentation/horario_ics.ts` (`buildIcsForSchedule` RFC 5545 + VTIMEZONE America/Mexico_City)
- Componente cliente: `components/dashboard/ScheduleGrid.tsx`
- Guard: `getAuthenticatedUser`

---

## 1. Diagrama de Actividades

- Círculo negro (inicio) → línea continua con flecha → siguiente.
- Rectángulo redondeado: `Usuario navega a /alumno/horario | /profesor/horario`. Línea continua con flecha → siguiente.
- Rombo: `¿rol?`.
  - `[ALUMNO]` → rectángulo `getMyStudentSchedule()`.
  - `[PROFESOR]` → rectángulo `getMyTeacherSchedule()`.
  - `[else]` → rectángulo `redirect("/")` → nodo final.
- (Ambos converger en) rectángulo: `getAuthenticatedUser(["ALUMNO"|"PROFESOR"])`. Línea continua con flecha → siguiente.
- Rectángulo: `resolvePeriod() → {period: Period.findFirst({isActive:true}), isFallback:false}`. Línea continua con flecha → rombo.
- Rombo: `¿period activo encontrado?`.
  - `[no]` → rectángulo `prisma.period.findFirst({orderBy:{endDate:desc}}) → fallback (isFallback=true)`.
  - `[sí]` → siguiente.
- Rombo: `¿period === null?`.
  - `[sí]` → rectángulo `return EMPTY {schedule:[], period:null, isFallback:false}` → render hero + alert vacío → nodo final.
  - `[no]` → siguiente rombo (split por rol).
- Rombo: `¿rol?`.
  - `[ALUMNO]` → rectángulo: `prisma.enrollment.findMany({studentId, group.periodId, include:{group:{subject, teacher, schedule:{day, startTime, endTime, classroom, groupName}}}})`.
  - `[PROFESOR]` → rectángulo: `prisma.group.findMany({teacherId, periodId, include:{subject, day, startTime, endTime, classroom}})`.
- (Convergen) Línea continua con flecha → región de expansión `«iterative»` sobre `groups/enrollments`:
  - Rombo: `¿isValidDay(day) && isValidTime(start) && isValidTime(end)?`.
    - `[no]` → rectángulo `descartar fila (continue)`.
    - `[sí]` → rectángulo `Construir ScheduleClassDTO{id, subject, teacher?, classroom, day, startTime, endTime, groupName}`.
- Salida de región → rectángulo: `return ScheduleDTO {schedule, period, isFallback}`. Línea continua con flecha → siguiente.
- Rectángulo: `<ScheduleGrid schedule period role/>` (Client Component) renderiza tabla semanal (Lun..Sáb). Línea continua con flecha → siguiente.
- Rombo: `¿isFallback?`.
  - `[sí]` → rectángulo con lado entrante de ángulo cóncavo (evento exterior): `Alert "Periodo inactivo, mostrando último"`.
  - `[no]` → siguiente.
- (Convergen) → rombo: `¿usuario elige "Agregar a calendario"?`.
  - `[no]` → nodo final.
  - `[sí]` → barra gruesa (fork) → rectángulo: `buildIcsForSchedule(schedule, period)` (lib/presentation/horario_ics.ts).
- Rectángulo: `Generar VTIMEZONE America/Mexico_City + VEVENT por clase con RRULE FREQ=WEEKLY;BYDAY=BYDAY[day-1];UNTIL=period.endDate`. Línea continua con flecha → siguiente.
- Rectángulo: `escapeText + line folding 75 octetos (RFC 5545 §3.1, §3.3.11)`. Línea continua con flecha → rombo.
- Rombo: `¿generación OK?`.
  - `[no]` → rectángulo `Alert "Fallo al generar archivo de calendario"` → nodo final.
  - `[sí]` → rectángulo con lado saliente convexo (evento emitido): `Descargar horario.ics`. Línea continua con flecha → barra gruesa (join) → nodo final (círculo blanco con negro concéntrico).

Flujo alternativo "día específico": rombo `¿filtroDía aplicado?` después de render ScheduleGrid → `[sí]` → rectángulo `ScheduleGrid filtra DTO por DayId` → de vuelta a render.

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Usuario (Alumno/Profesor)` contiene: nodo inicial, navegar a `/alumno/horario | /profesor/horario`, "Agregar a calendario", filtrar por día específico.
- Pista `Page (horario/page.tsx)` (Server Component, una por rol) contiene: invocación de `getMyStudentSchedule()` o `getMyTeacherSchedule()`, render de `<ScheduleGrid>`, `Alert` de fallback.
- Pista `DAL (lib/dal/horarios.ts)` contiene: `resolvePeriod`, branching ALUMNO/PROFESOR, `toClassDTOs`, `EMPTY` return cuando no hay periodo.
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser(["ALUMNO"|"PROFESOR"])`.
- Pista `Presentación (lib/presentation/horario.ts)` contiene: `isValidDay`, `isValidTime`, construcción de `ScheduleClassDTO`, constante `DAYS`.
- Pista `Prisma/PostgreSQL` contiene: `prisma.period.findFirst`, `prisma.enrollment.findMany` (alumno), `prisma.group.findMany` (profesor).
- Pista `Cliente (ScheduleGrid.tsx)` contiene: render tabla semanal Lun..Sáb, filtro por día, botón "Agregar a calendario", descarga del Blob.
- Pista `ICS (lib/presentation/horario_ics.ts)` contiene: `buildIcsForSchedule`, generación VTIMEZONE `America/Mexico_City`, VEVENT `FREQ=WEEKLY;BYDAY=...;UNTIL=endDate`, `escapeText`, line folding 75 octetos.

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `usuario:Usuario` (Alumno|Profesor)
- `pageA:alumno/horario/page.tsx`
- `pageP:profesor/horario/page.tsx`
- `dal:horarios.ts`
- `guard:session.ts`
- `db:PostgreSQL`
- `pres:horario.ts`
- `ics:horario_ics.ts`
- `grid:ScheduleGrid.tsx`

(Para el diagrama usar `page:horario/page.tsx` representando la página activa según rol.)

Mensajes:

1. `usuario:Usuario` → `page:horario/page.tsx` flecha rellena; `GET /alumno/horario | /profesor/horario`.
2. `page:horario/page.tsx` → `dal:horarios.ts` flecha rellena; `getMyStudentSchedule() | getMyTeacherSchedule()`.
3. `dal:horarios.ts` → `guard:session.ts` flecha rellena; `getAuthenticatedUser(["ALUMNO"|"PROFESOR"])`.
4. `guard:session.ts` → `dal:horarios.ts` flecha abierta punteada; `{id, role}`.
5. `dal:horarios.ts` → `db:PostgreSQL` flecha rellena (diagonal `{T<d+50ms}`); `prisma.period.findFirst({isActive:true})`.
6. `db:PostgreSQL` → `dal:horarios.ts` flecha abierta punteada; `Period | null`.
7. Fragmento `alt` `[!active]`:
   - `dal` → `db` flecha rellena; `prisma.period.findFirst({orderBy:{endDate:desc}})`.
   - `db` → `dal` flecha abierta punteada; `Period(last) | null`. Cierre.
8. Fragmento `alt` `[period === null]`:
   - `dal` → `page` flecha abierta punteada; `EMPTY {schedule:[], period:null, isFallback:false}`. Cierre.
9. `dal:horarios.ts` → `db:PostgreSQL` flecha rellena (diagonal `{T<d+100ms}`); `prisma.enrollment.findMany | prisma.group.findMany` según rol.
10. `db:PostgreSQL` → `dal:horarios.ts` flecha abierta punteada; `rows[]`.
11. `dal:horarios.ts` → `pres:horario.ts` flecha rellena; `toClassDTOs(rows, includeTeacher)` (usa `isValidDay`, `isValidTime`).
12. `pres:horario.ts` → `dal:horarios.ts` flecha abierta punteada; `ScheduleClassDTO[]`.
13. `dal:horarios.ts` → `page:horario/page.tsx` flecha abierta punteada; `{schedule, period:SchedulePeriodDTO, isFallback}`.
14. `page:horario/page.tsx` → `grid:ScheduleGrid.tsx` flecha rellena; `props {schedule, period, role}`.
15. `grid:ScheduleGrid.tsx` → `usuario:Usuario` flecha abierta punteada; `Tabla semanal renderizada (DAYS Lun..Sáb)`.
16. Fragmento `opt` `[Usuario selecciona "Agregar a calendario"]`:
   - `usuario:Usuario` → `grid:ScheduleGrid.tsx` flecha rellena; `onClickExportICS()`.
   - `grid:ScheduleGrid.tsx` → `ics:horario_ics.ts` flecha rellena (diagonal `{d<1s}`); `buildIcsForSchedule(schedule, period)`.
   - `ics:horario_ics.ts` → sí mismo flecha rellena que vuelve; `VTIMEZONE America/Mexico_City + VEVENT(FREQ=WEEKLY;BYDAY=...;UNTIL=endDate) + escapeText + line folding`.
   - Fragmento `alt`:
     - `[error]` → `ics` → `grid` flecha abierta punteada `throw Error("Fallo al generar")`. `grid` → `usuario` flecha abierta punteada `Alert error`. Cierre.
     - `[ok]` → `ics` → `grid` flecha abierta punteada `string ICS`. `grid` → `usuario` flecha rellena `Blob download horario.ics` (mensaje encontrado si el usuario cancela el guardado: dibujar con círculo relleno al final entre `grid` y `usuario`). Cierre.

---

## 3. Diagrama de Paquetes

Paquetes:
- `app/(dashboard)/alumno/horario` con `page.tsx`.
- `app/(dashboard)/profesor/horario` con `page.tsx`.
- `lib/dal` con `horarios.ts`, `session.ts`.
- `lib/presentation` con `horario.ts`, `horario_ics.ts`.
- `components/dashboard` con `«component» ScheduleGrid.tsx`, `«component» DashboardHero.tsx`.
- Paquete externo `Prisma Client` con `prisma.period`, `prisma.enrollment`, `prisma.group`.
- Paquete externo `react` con `cache()`.
- Paquete externo `next-auth` con `auth()`.

Relaciones:
- `alumno/horario/page.tsx` —`«import»` línea punteada flecha abierta→ `horarios.ts (getMyStudentSchedule)`, `ScheduleGrid.tsx`.
- `profesor/horario/page.tsx` —`«import»` línea punteada flecha abierta→ `horarios.ts (getMyTeacherSchedule)`, `ScheduleGrid.tsx`.
- `horarios.ts` —`«import»` línea punteada flecha abierta→ `presentation/horario.ts` (DTOs + validadores).
- `horarios.ts` —`«import»` línea punteada flecha abierta→ `session.ts`.
- `horarios.ts` —`«use»` línea punteada flecha→ `Prisma Client`.
- `horarios.ts` —`«use»` línea punteada flecha→ `react::cache()`.
- `ScheduleGrid.tsx` —`«use»` línea punteada flecha→ `presentation/horario_ics.ts` (export ICS).
- `presentation/horario_ics.ts` —`«import»` línea punteada flecha abierta→ `presentation/horario.ts` (DAYS, isValidDay, isValidTime).
- Nota (rectángulo borde punteado): texto `RFC 5545: VTIMEZONE America/Mexico_City; FREQ=WEEKLY;BYDAY=MO|TU|WE|TH|FR|SA;UNTIL=period.endDate; line folding 75 octetos`. Conectada con línea punteada a `horario_ics.ts`.
- Nota: texto `Privacidad CU-06: las funciones NO aceptan userId; lo toman de la sesión`. Conectada con línea punteada a `horarios.ts`.
- Restricción (rombo) sobre `horarios.ts`: texto `{isValidDay(day) ∧ isValidTime(start) ∧ isValidTime(end)}`. Línea sólida al rectángulo.
