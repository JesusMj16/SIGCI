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

- Figura: círculo negro (inicio). Línea continua con flecha apuntando a la siguiente actividad.
- Figura: rectángulo redondeado; texto: `Alumno navega a /alumno/calificaciones[?periodo=ID]`. Línea continua con flecha.
- Figura: rectángulo redondeado; texto: `page.tsx: await searchParams → {periodo}`. Línea continua con flecha.
- Figura: barra gruesa horizontal (fork — Promise.all). Líneas continuas con flecha hacia:
  - Rectángulo redondeado: `getCalificacionesAction(periodo)`.
  - Rectángulo redondeado: `getPeriodosAlumnoAction()`.
- De ambos, línea continua con flecha a barra gruesa (join).
- Línea continua con flecha apuntando a rectángulo redondeado: `obtenerCalificacionesDelAlumno(periodoId?)`. Línea continua con flecha a rombo.
- Figura: rombo; texto: `¿getAuthenticatedUser([ALUMNO])?`.
  - `[no rol]` línea continua con flecha → `redirect("/")` → nodo final.
  - `[sí]` línea continua con flecha → siguiente actividad.
- Figura: rectángulo redondeado; texto: `prisma.user.findUniqueOrThrow({id, select:{nombre,apellidos,matricula}})`. Línea continua con flecha a rombo.
- Figura: rombo; texto: `¿periodoId provisto?`.
  - `[sí]` → rectángulo `prisma.period.findUnique({id:periodoId})` → rombo `¿exists?` → `[no]` → rectángulo `throw PeriodoNoEncontradoError` → flecha al final.
  - `[no]` → siguiente actividad.
- Figura: rectángulo redondeado; texto: `prisma.enrollment.findMany({studentId, group:{period: isActive | id}, include:{group.subject, group.period, group.assignments(PUBLICADO).submissions(studentId).grade}})`. Línea continua con flecha a rombo.
- Figura: rombo; texto: `¿enrollments.length === 0?`.
  - `[sí]` → rectángulo `throw NoMateriasInscritasError` → flecha al final.
  - `[no]` → siguiente actividad.
- Figura: región de expansión etiquetada `«iterative»` sobre `enrollments`. Dentro:
  - Rectángulo `Agrupar por period.id en periodMap`.
  - Rectángulo `Para cada assignment: tomar submissions[0].grade si existe`.
  - Rectángulo `Construir GradeDetailDTO`.
  - Rectángulo `Calcular promedio = sum(valor)/n, Math.round(*100)/100`.
- Saliendo de la región, línea continua con flecha apuntando a un rectángulo con lado saliente convexo (evento emitido): `prisma.notification.create({titulo:"Consulta de calificaciones", leida:true}) — auditoría`.
- Línea continua con flecha a rombo; texto: `¿try OK?`.
  - `[no]` línea continua con flecha → rectángulo `console.warn; consultaRegistrada=false` (no bloquea).
  - `[sí]` → rectángulo `consultaRegistrada=true`.
- Unen líneas continuas en rectángulo: `return CalificacionesResultDTO{ alumno, periodos ordenados desc, consultaRegistrada }`.
- Línea continua con flecha al Container cliente: `CalificacionesContainer recibe result + periodos`.
- Figura: rectángulo redondeado; texto: `Render PeriodSelector + GradesFilter + SubjectCard[] por materia`. Línea continua con flecha.
- Flujo alternativo (filtros): rombo `¿usuario filtra/cambia periodo?`.
  - `[sí]` línea continua → rectángulo `router.push("?periodo=ID")` → vuelta al inicio (línea continua con flecha hacia la primera actividad del page).
  - `[no]` → nodo final (círculo blanco con negro concéntrico).

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
