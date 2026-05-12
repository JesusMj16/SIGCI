# CU-10 — Visualizar Tareas Pendientes — Guía de Dibujo UML

Archivos reales:
- Página: `app/(dashboard)/alumno/tareas/page.tsx`
- Detalle: `app/(dashboard)/alumno/tareas/[assignmentId]/page.tsx`
- DAL: `lib/dal/tareas/alumno.ts` (`getTareasPendientesAlumno`, `getTareaDetalleAlumno`, `tieneInscripcionesActivas`, `calcularUrgencia`)
- Helpers cliente/server: `lib/dal/tareas/helpers.ts` (`filtrarPorMateria`, `ordenarTareas`, `CriterioOrden`)
- Componentes: `components/dashboard/tareas/TareasPendientesList.tsx`, `TareaCard.tsx`
- Layout: `components/dashboard/DashboardHero.tsx`
- Result: `lib/contracts/result.ts`
- Guard: `getAuthenticatedUser(["ALUMNO"])`

---

## 1. Diagrama de Actividades

- Círculo negro (inicio) → línea continua con flecha → siguiente.
- Rectángulo: `Alumno navega a /alumno/tareas`. Línea continua con flecha → siguiente.
- Rectángulo: `page.tsx: await tieneInscripcionesActivas()`. Línea continua con flecha → rombo.
- Rombo: `¿inscrito en periodo activo?`.
  - `[no]` → rectángulo `Render EmptyState "No estás inscrito en materias del periodo en curso"` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `await getTareasPendientesAlumno()` (DAL, cache(), server-only). Línea continua con flecha → rombo.
- Rombo: `¿result.ok?`.
  - `[no]` → rectángulo `Render EmptyState "Ocurrió un error al cargar tus tareas"` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `prisma.submission.findMany({studentId:userId, status:"PENDIENTE", assignment:{status:"PUBLICADO", group:{period.isActive:true, enrollments.some(studentId)}}, include:{assignment.group.subject}, orderBy:{assignment.fechaLimite:asc}})`. Línea continua con flecha → siguiente.
- Región de expansión `«iterative»` sobre `submissions`:
  - Rectángulo: `limite = s.assignment.fechaLimite; now=Date.now()`.
  - Rectángulo: `diasRestantes = ceil((limite-now)/MS_DAY)`.
  - Rectángulo: `vencida = limite < now`.
  - Rombo: `¿diasRestantes < 2?`.
    - `[sí]` → rectángulo `urgencia="alta"`.
    - `[no]` → siguiente rombo.
  - Rombo: `¿diasRestantes < 7?`.
    - `[sí]` → rectángulo `urgencia="media"`.
    - `[no]` → rectángulo `urgencia="baja"`.
  - Rombo: `¿vencida?`.
    - `[sí]` → rectángulo `estado="VENCIDA"`.
    - `[no]` → rectángulo `estado="PENDIENTE"`.
  - Rectángulo: `Construir TareaPendienteDTO{submissionId, assignmentId, titulo, tipo, fechaLimite ISO, diasRestantes, urgencia, estado, materia, grupo}`.
- Salida de región → rectángulo: `return ok(tareas[])`. Línea continua con flecha → siguiente.
- Rectángulo: `Render DashboardHero "Tareas pendientes" + TareasPendientesList`. Línea continua con flecha → siguiente.
- Región de expansión `«iterative»` sobre `tareas`:
  - Rectángulo: `Render TareaCard con badge urgencia (rojo/amarillo/verde) + chip estado`.
- Salida → rombo (flujos alternativos cliente).
- Rombo: `¿usuario filtra/ordena?`.
  - `[filtra materia]` → rectángulo `filtrarPorMateria(tareas, materiaId)` (lib/dal/tareas/helpers.ts) → de vuelta a render lista.
  - `[ordena]` → rectángulo `ordenarTareas(tareas, "fecha"|"materia"|"estado"|"tipo")` → de vuelta a render lista.
  - `[selecciona tarea]` → rectángulo con lado saliente convexo (evento emitido): `Link /alumno/tareas/[assignmentId]`.
    - Línea continua con flecha → rectángulo: `getTareaDetalleAlumno(assignmentId)` → rombo `¿result.ok?` con guarda `[NOT_FOUND]` → rectángulo `notFound()`, `[ok]` → rectángulo `Render detalle: instrucciones + rubrica + fecha`. Línea continua con flecha → nodo final.
  - `[no acción]` → nodo final.
- Nodo final (círculo blanco con negro concéntrico).

Excepción "Tareas vencidas no se ocultan": observación gráfica — la rama `[vencida]` no elimina la tarea de la lista; se renderiza con chip estado "VENCIDA". Anotar como comentario (rectángulo de borde punteado) sobre el rectángulo `estado="VENCIDA"` con texto: `"No ocultar; permanecen visibles (regla CU-10 #4)"`.

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Alumno` contiene: nodo inicial, navegar a `/alumno/tareas`, filtrar por materia, cambiar orden, click sobre `TareaCard`, navegar a `/alumno/tareas/[assignmentId]`.
- Pista `Page lista (alumno/tareas/page.tsx)` (Server Component) contiene: `await tieneInscripcionesActivas()`, `await getTareasPendientesAlumno()`, render `EmptyState` o `TareasPendientesList`.
- Pista `Page detalle (alumno/tareas/[assignmentId]/page.tsx)` contiene: `await getTareaDetalleAlumno(assignmentId)`, `notFound()` cuando `code === "NOT_FOUND"`.
- Pista `DAL (lib/dal/tareas/alumno.ts)` contiene: `tieneInscripcionesActivas`, `getTareasPendientesAlumno` (calcula `diasRestantes`, `calcularUrgencia`, estado `VENCIDA|PENDIENTE`, construcción de `TareaPendienteDTO`), `getTareaDetalleAlumno`.
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser(["ALUMNO"])` (memoizado con `cache()`).
- Pista `Prisma/PostgreSQL` contiene: `prisma.enrollment.findFirst`, `prisma.submission.findMany` (filtros `PENDIENTE` + `PUBLICADO` + `period.isActive` + `enrollments.some(studentId)` + `orderBy:fechaLimite asc`), `prisma.submission.findFirst` para detalle.
- Pista `Helpers (lib/dal/tareas/helpers.ts)` contiene: `filtrarPorMateria(tareas, materiaId)`, `ordenarTareas(tareas, criterio)` con criterios `fecha|materia|estado|tipo`.
- Pista `Cliente (componentes)` contiene: `DashboardHero`, `TareasPendientesList` (estado de filtro/orden sin recargar), `TareaCard` (badge urgencia rojo/amarillo/verde + chip estado), `Link` a detalle.

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `alumno:Alumno`
- `page:alumno/tareas/page.tsx`
- `dal:tareas/alumno.ts`
- `guard:session.ts`
- `db:PostgreSQL`
- `hero:DashboardHero.tsx`
- `lista:TareasPendientesList.tsx`
- `card:TareaCard.tsx`
- `helpers:tareas/helpers.ts`
- `detail:alumno/tareas/[assignmentId]/page.tsx`

Mensajes:

1. `alumno:Alumno` → `page:alumno/tareas/page.tsx` flecha rellena; `GET /alumno/tareas`.
2. `page:alumno/tareas/page.tsx` → `dal:tareas/alumno.ts` flecha rellena; `tieneInscripcionesActivas()`.
3. `dal:tareas/alumno.ts` → `guard:session.ts` flecha rellena; `getAuthenticatedUser(["ALUMNO"])`.
4. `guard:session.ts` → `dal:tareas/alumno.ts` flecha abierta punteada; `{id:userId, role:ALUMNO}`.
5. `dal:tareas/alumno.ts` → `db:PostgreSQL` flecha rellena (diagonal `{T<d+30ms}`); `prisma.enrollment.findFirst({studentId, group.period.isActive:true})`.
6. `db:PostgreSQL` → `dal:tareas/alumno.ts` flecha abierta punteada; `enrollment | null`.
7. `dal:tareas/alumno.ts` → `page:alumno/tareas/page.tsx` flecha abierta punteada; `boolean`.
8. Fragmento `alt` `[!inscrito]`:
   - `page:alumno/tareas/page.tsx` → `hero:DashboardHero.tsx` flecha rellena; `render EmptyState`.
   - Cierre.
9. `page:alumno/tareas/page.tsx` → `dal:tareas/alumno.ts` flecha rellena; `getTareasPendientesAlumno()`.
10. `dal:tareas/alumno.ts` → `guard:session.ts` flecha rellena; `getAuthenticatedUser(["ALUMNO"])` (cache react).
11. `guard:session.ts` → `dal:tareas/alumno.ts` flecha abierta punteada; `{id:userId}`.
12. `dal:tareas/alumno.ts` → `db:PostgreSQL` flecha rellena (diagonal `{T<d+100ms}`); `prisma.submission.findMany({studentId:userId, status:"PENDIENTE", assignment:{status:"PUBLICADO", group:{period.isActive:true, enrollments.some(studentId)}}, include:{assignment.group.subject}, orderBy:{assignment.fechaLimite:asc}})`.
13. `db:PostgreSQL` → `dal:tareas/alumno.ts` flecha abierta punteada; `submissions[] (con assignment, group, subject)`.
14. `dal:tareas/alumno.ts` → sí mismo flecha rellena que vuelve; `map → TareaPendienteDTO: calcularUrgencia(diasRestantes), estado VENCIDA|PENDIENTE`.
15. `dal:tareas/alumno.ts` → `page:alumno/tareas/page.tsx` flecha abierta punteada; `ok(TareaPendienteDTO[])`.
16. `page:alumno/tareas/page.tsx` → `hero:DashboardHero.tsx` flecha rellena; `render "Tareas pendientes" + meta Total`.
17. `page:alumno/tareas/page.tsx` → `lista:TareasPendientesList.tsx` flecha rellena; `props {tareas}`.
18. Loop `[por cada tarea]`:
   - `lista:TareasPendientesList.tsx` → `card:TareaCard.tsx` flecha rellena; `render con badge urgencia + chip estado`.
19. `card:TareaCard.tsx` → `alumno:Alumno` flecha abierta punteada; `vista de la tarjeta`.
20. Fragmento `opt` `[Usuario filtra por materia]`:
   - `alumno:Alumno` → `lista:TareasPendientesList.tsx` flecha rellena; `onFilter(materiaId)`.
   - `lista:TareasPendientesList.tsx` → `helpers:tareas/helpers.ts` flecha rellena; `filtrarPorMateria(tareas, materiaId)`.
   - `helpers:tareas/helpers.ts` → `lista:TareasPendientesList.tsx` flecha abierta punteada; `TareaPendienteDTO[] filtradas`.
   Cierre.
21. Fragmento `opt` `[Usuario cambia orden]`:
   - `alumno:Alumno` → `lista:TareasPendientesList.tsx` flecha rellena; `onSort(criterio)`.
   - `lista:TareasPendientesList.tsx` → `helpers:tareas/helpers.ts` flecha rellena; `ordenarTareas(tareas, "fecha"|"materia"|"estado"|"tipo")`.
   - `helpers:tareas/helpers.ts` → `lista:TareasPendientesList.tsx` flecha abierta punteada; `TareaPendienteDTO[] ordenadas`.
   Cierre.
22. Fragmento `opt` `[Usuario click TareaCard]`:
   - `alumno:Alumno` → `card:TareaCard.tsx` flecha rellena; `click Link /alumno/tareas/[assignmentId]`.
   - `card:TareaCard.tsx` → `detail:alumno/tareas/[assignmentId]/page.tsx` flecha rellena (mensaje encontrado si la sesión expira: línea continua con flecha y círculo relleno al final); `navegación`.
   - `detail:alumno/tareas/[assignmentId]/page.tsx` → `dal:tareas/alumno.ts` flecha rellena; `getTareaDetalleAlumno(assignmentId)`.
   - `dal:tareas/alumno.ts` → `db:PostgreSQL` flecha rellena; `prisma.submission.findFirst({studentId, assignmentId, assignment.status:"PUBLICADO", group.enrollments.some(studentId)}, include:{assignment.group.subject})`.
   - `db:PostgreSQL` → `dal:tareas/alumno.ts` flecha abierta punteada; `submission | null`.
   - Fragmento `alt` `[!submission]`: `dal` → `detail` flecha abierta punteada `err("Tarea no encontrada","NOT_FOUND")`. `detail` → `alumno` flecha abierta punteada `notFound()` (404). Cierre.
   - `dal:tareas/alumno.ts` → `detail:alumno/tareas/[assignmentId]/page.tsx` flecha abierta punteada; `ok(TareaDetalleDTO{...instrucciones, rubrica})`.
   - `detail:alumno/tareas/[assignmentId]/page.tsx` → `alumno:Alumno` flecha abierta punteada; `render hero + instrucciones + rubrica + fecha`.

---

## 3. Diagrama de Paquetes

Paquetes:
- `app/(dashboard)/alumno/tareas` con `page.tsx` y subcarpeta `[assignmentId]` con `page.tsx`.
- `lib/dal/tareas` con `alumno.ts`, `helpers.ts`.
- `lib/dal` con `session.ts`.
- `lib/contracts` con `result.ts`.
- `components/dashboard/tareas` con `«component» TareasPendientesList.tsx`, `«component» TareaCard.tsx`.
- `components/dashboard` con `«component» DashboardHero.tsx`.
- `@heroicons/react/24/outline` (paquete externo) con `ClipboardDocumentListIcon`.
- Paquete externo `Prisma Client` con `prisma.submission.findMany`, `prisma.submission.findFirst`, `prisma.enrollment.findFirst`.
- Paquete externo `react` con `cache()`.
- Paquete externo `next-auth` con `auth()`.
- Paquete externo `next/navigation` con `notFound`.

Relaciones:
- `alumno/tareas/page.tsx` —`«import»` línea punteada flecha abierta→ `tareas/alumno.ts (getTareasPendientesAlumno, tieneInscripcionesActivas)`, `TareasPendientesList.tsx`, `DashboardHero.tsx`, `ClipboardDocumentListIcon`.
- `alumno/tareas/[assignmentId]/page.tsx` —`«import»` línea punteada flecha abierta→ `tareas/alumno.ts (getTareaDetalleAlumno)`, `DashboardHero.tsx`, `next/navigation::notFound`.
- `TareasPendientesList.tsx` —`«import»` línea punteada flecha abierta→ `TareaCard.tsx`, `helpers.ts`.
- `tareas/alumno.ts` —`«import»` línea punteada flecha abierta→ `session.ts`, `result.ts`.
- `tareas/alumno.ts` —`«use»` línea punteada flecha→ `Prisma Client`.
- `tareas/alumno.ts` —`«use»` línea punteada flecha→ `react::cache()`.
- `helpers.ts` —`«import»` línea punteada flecha abierta→ `tareas/alumno.ts` (sólo tipos `TareaPendienteDTO`).
- Nota (rectángulo borde punteado): texto `Urgencia: <2d alta (rojo), <7d media (amarillo), ≥7d baja (verde) — calcularUrgencia()`. Conectada con línea punteada a `tareas/alumno.ts`.
- Nota: texto `Tareas VENCIDAS permanecen visibles (regla CU-10 #4); no se filtran del listado`. Conectada con línea punteada a `tareas/alumno.ts`.
- Restricción (rombo) anexa a `tareas/alumno.ts`: texto `{studentId desde sesión; submission.status=PENDIENTE; assignment.status=PUBLICADO; group.period.isActive}`. Línea sólida al rectángulo.
- Comentario externo: texto `Filtrado/ordenamiento ocurre en cliente sin recargar (requerimiento especial CU-10 #4)`. Conectada con línea punteada a `TareasPendientesList.tsx`.
