# CU-04 — Consultar Calificaciones — Guía de Dibujo UML

Archivos reales:
- Página: `app/(dashboard)/alumno/calificaciones/page.tsx`
- Container cliente: `app/(dashboard)/alumno/calificaciones/_components/CalificacionesContainer.tsx`
- Filtros cliente: `GradesFilter.tsx`, `PeriodSelector.tsx`, `SubjectCard.tsx`, `EmptyState.tsx`
- Server Actions: `lib/actions/calificaciones.actions.ts` (`getCalificacionesAction`, `getPeriodosAlumnoAction`)
- DAL: `lib/dal/grades.ts` (`obtenerCalificacionesDelAlumno`, `obtenerPeriodosDelAlumno`)
- Excepciones tipadas: `NoMateriasInscritasError`, `SinCalificacionesError`, `PeriodoNoEncontradoError`
- Auditoría: `prisma.notification.create({titulo:"Consulta de calificaciones", leida:true})`
- Guard: `getAuthenticatedUser([UserRole.ALUMNO])`

---

## 1. Diagrama de Actividades

Convención: conexiones por defecto = línea continua con flecha al siguiente nodo. Solo se especifica el tipo cuando difiere.

- Círculo negro (inicio).
- Rectángulo redondeado: `Alumno navega a /alumno/calificaciones[?periodo=ID]; page.tsx ejecuta await searchParams → {periodo}`.
- Barra gruesa (fork — Promise.all) → dos actividades concurrentes:
  - Rectángulo: `getCalificacionesAction(periodo)`.
  - Rectángulo: `getPeriodosAlumnoAction()`.
- Barra gruesa (join) → rectángulo: `obtenerCalificacionesDelAlumno(periodoId?)`.
- Rombo `¿getAuthenticatedUser([ALUMNO])?`:
  - `[no rol]` → `redirect("/")` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `prisma.user.findUniqueOrThrow({id, select:{nombre,apellidos,matricula}})`.
- Rombo `¿periodoId provisto?`:
  - `[sí]` → rectángulo `prisma.period.findUnique({id:periodoId})` → rombo `¿exists?` → `[no]` → rectángulo `throw PeriodoNoEncontradoError` → final.
  - `[no]` → siguiente.
- Rectángulo: `prisma.enrollment.findMany({studentId, group.period: isActive | id, include:{group.subject, group.period, group.assignments(PUBLICADO).submissions(studentId).grade}})`.
- Rombo `¿enrollments.length === 0?`:
  - `[sí]` → rectángulo `throw NoMateriasInscritasError` → final.
  - `[no]` → siguiente.
- Región de expansión `«iterative»` sobre `enrollments`: rectángulo `Agrupar por period.id en periodMap; por assignment tomar submissions[0].grade; construir GradeDetailDTO; promedio = Math.round(sum(valor)/n *100)/100`.
- Rectángulo con lado saliente convexo (evento emitido): `prisma.notification.create({titulo:"Consulta de calificaciones", leida:true}) — auditoría best-effort`.
- Rombo `¿try OK?`:
  - `[no]` → rectángulo `console.warn; consultaRegistrada=false`.
  - `[sí]` → rectángulo `consultaRegistrada=true`.
- Rectángulo: `return CalificacionesResultDTO{alumno, periodos desc, consultaRegistrada} → CalificacionesContainer recibe result+periodos → Render PeriodSelector + GradesFilter + SubjectCard[]`.
- Rombo (flujo alternativo) `¿usuario filtra/cambia periodo?`:
  - `[sí]` → rectángulo `router.push("?periodo=ID")` → vuelta a la primera actividad del page.
  - `[no]` → nodo final (círculo blanco con negro concéntrico).

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Alumno` contiene: nodo inicial, navegar a `/alumno/calificaciones`, "usuario filtra/cambia periodo".
- Pista `Page (calificaciones/page.tsx)` (Server Component) contiene: `await searchParams`, barra fork/join de `Promise.all`, invocación a las dos Server Actions.
- Pista `Server Actions (lib/actions/calificaciones.actions.ts)` contiene: `getCalificacionesAction(periodo)`, `getPeriodosAlumnoAction()`, mapeo de excepciones tipadas → `errorCode`.
- Pista `DAL (lib/dal/grades.ts)` contiene: `obtenerCalificacionesDelAlumno`, validación de `periodoId`, agrupación por periodo, cálculo de promedio, auditoría `notification.create`.
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser([UserRole.ALUMNO])`.
- Pista `Prisma/PostgreSQL` contiene: `prisma.user.findUniqueOrThrow`, `prisma.period.findUnique`, `prisma.enrollment.findMany`, `prisma.notification.create`.
- Pista `Cliente (_components)` contiene: `CalificacionesContainer`, `PeriodSelector`, `GradesFilter`, `SubjectCard[]`, `router.push("?periodo=ID")`.

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `alumno:Alumno`
- `page:calificaciones/page.tsx`
- `accionGrades:calificaciones.actions.ts`
- `dal:grades.ts`
- `guard:session.ts`
- `db:PostgreSQL`
- `container:CalificacionesContainer.tsx`
- `filtro:GradesFilter.tsx`
- `periodSel:PeriodSelector.tsx`

Mensajes:

1. `alumno:Alumno` → `page:calificaciones/page.tsx` línea continua flecha rellena; `GET /alumno/calificaciones?periodo=ID`.
2. `page:calificaciones/page.tsx` → sí misma flecha rellena que vuelve; `const {periodo} = await searchParams`.
3. Fragmento `par` (paralelo, Promise.all):
   - `page` → `accionGrades` línea continua flecha rellena; `getCalificacionesAction(periodo)`.
   - `page` → `accionGrades` línea continua flecha rellena; `getPeriodosAlumnoAction()`.
4. `accionGrades:calificaciones.actions.ts` → `dal:grades.ts` línea continua flecha rellena; `obtenerCalificacionesDelAlumno(periodoId)`.
5. `dal:grades.ts` → `guard:session.ts` línea continua flecha rellena; `getAuthenticatedUser([UserRole.ALUMNO])`.
6. `guard:session.ts` → `dal:grades.ts` línea punteada flecha abierta; `{id:studentId}`.
7. `dal:grades.ts` → `db:PostgreSQL` línea continua flecha rellena (diagonal `{T<d+50ms}`); `prisma.user.findUniqueOrThrow({id})`.
8. `db:PostgreSQL` → `dal:grades.ts` línea punteada flecha abierta; `{nombre, apellidos, matricula}`.
9. Fragmento `opt` `[periodoId]`:
   - `dal` → `db` flecha rellena `prisma.period.findUnique({id:periodoId})`.
   - `db` → `dal` flecha abierta `period | null`.
   - Si null: `dal` → `accionGrades` flecha abierta `throw PeriodoNoEncontradoError`. Cierre.
10. `dal:grades.ts` → `db:PostgreSQL` línea continua flecha rellena (diagonal `{T<d+100ms}`); `prisma.enrollment.findMany({studentId, include:{group.subject, group.period, group.assignments(PUBLICADO).submissions(studentId).grade}})`.
11. `db:PostgreSQL` → `dal:grades.ts` línea punteada flecha abierta; `enrollments[]`.
12. Fragmento `alt` `[enrollments.length===0]`: `dal` → `accionGrades` flecha abierta `throw NoMateriasInscritasError`. `accionGrades` → `page` flecha abierta `{ok:false, errorCode:"NO_MATERIAS"}`. Cierre.
13. `dal:grades.ts` → sí misma flecha rellena que vuelve; `Loop sobre enrollments: agrupar por period + construir GradeDetailDTO + calcular promedio`.
14. `dal:grades.ts` → `db:PostgreSQL` línea continua flecha rellena; `prisma.notification.create({titulo:"Consulta de calificaciones", leida:true})` (auditoría best-effort).
15. `db:PostgreSQL` → `dal:grades.ts` línea punteada flecha abierta; `void | error`.
16. `dal:grades.ts` → `accionGrades:calificaciones.actions.ts` línea punteada flecha abierta; `CalificacionesResultDTO`.
17. `accionGrades:calificaciones.actions.ts` → `page:calificaciones/page.tsx` línea punteada flecha abierta; `{ok:true, data:CalificacionesResultDTO}`.
18. `accionGrades:calificaciones.actions.ts` → `page` línea punteada flecha abierta; `{ok:true, data:PeriodSummaryDTO[]}` (segunda promesa).
19. `page:calificaciones/page.tsx` → `container:CalificacionesContainer.tsx` línea continua flecha rellena; `props {result, periodos, periodoSeleccionado}`.
20. `container:CalificacionesContainer.tsx` → `filtro:GradesFilter.tsx`, `periodSel:PeriodSelector.tsx` línea continua flecha rellena (a cada uno); `render`.
21. Fragmento `opt` `[Usuario cambia periodo]`:
   - `alumno` → `periodSel:PeriodSelector.tsx` flecha rellena `onChange(periodId)`.
   - `periodSel:PeriodSelector.tsx` → `container:CalificacionesContainer.tsx` flecha rellena `setPeriodo` / `router.push("?periodo=ID")`.
   - Reentrada: `container` → `page` flecha rellena `re-fetch`. Repite ciclo desde paso 2.

Mensaje perdido: si auditoría falla, `dal:grades.ts` emite señal a `db:PostgreSQL` que no genera respuesta útil → línea continua con flecha y círculo relleno al final entre `dal` y `db` etiquetada `console.warn`.

---

## 3. Diagrama de Paquetes

Paquetes:
- `app/(dashboard)/alumno/calificaciones` con `page.tsx`.
- `app/(dashboard)/alumno/calificaciones/_components` con `«component» CalificacionesContainer.tsx`, `«component» GradesFilter.tsx`, `«component» PeriodSelector.tsx`, `«component» SubjectCard.tsx`, `«component» EmptyState.tsx`, `«component» CalificacionesSkeleton.tsx`.
- `lib/actions` con `calificaciones.actions.ts`.
- `lib/dal` con `grades.ts`, `session.ts`.
- `lib/generated/prisma/enums` con `UserRole`, `AssignmentStatus`.
- Paquete externo `Prisma Client` con `prisma.enrollment.findMany`, `prisma.notification.create`.
- Paquete externo `react` con rectángulo `cache()`.
- Paquete externo `next-auth` con `auth()`.

Relaciones:
- `page.tsx` —línea punteada flecha abierta `«import»`→ `calificaciones.actions.ts`.
- `page.tsx` —`«import»` línea punteada flecha abierta→ `CalificacionesContainer.tsx`.
- `CalificacionesContainer.tsx` —`«import»` línea punteada flecha abierta→ `GradesFilter.tsx`, `PeriodSelector.tsx`, `SubjectCard.tsx`, `EmptyState.tsx`.
- `calificaciones.actions.ts` —`«import»` línea punteada flecha abierta→ `grades.ts`.
- `grades.ts` —`«import»` línea punteada flecha abierta→ `session.ts`.
- `grades.ts` —`«use»` línea punteada flecha→ `Prisma Client`.
- `grades.ts` —`«use»` línea punteada flecha→ `react::cache()`.
- `grades.ts` —`«import»` línea punteada flecha abierta→ `lib/generated/prisma/enums`.
- `session.ts` —`«use»` línea punteada flecha→ `next-auth::auth()`.
- Nota: texto `Auditoría se registra en Notification (titulo="Consulta de calificaciones", leida=true)`. Línea punteada (sin flecha) a `grades.ts`.
- Restricción (rombo) sobre `grades.ts`: texto `{studentId siempre desde sesión, nunca desde params (IDOR-safe)}`. Línea sólida al rectángulo.
