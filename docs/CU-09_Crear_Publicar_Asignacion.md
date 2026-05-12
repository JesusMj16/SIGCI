# CU-09 — Crear y Publicar Asignación — Guía de Dibujo UML

Archivos reales:
- Página: `app/(dashboard)/profesor/asignaciones/nueva/page.tsx`
- Container cliente: `_components/CrearAsignacionContainer.tsx`
- Subcomponentes: `SelectorGrupos.tsx`, `FormularioAsignacion.tsx`, `ConfirmacionPublicacion.tsx`
- Hook: `useCrearAsignacionFlow.ts`
- Server Actions: `lib/actions/asignaciones.actions.ts` (`getGruposProfesorAction`, `crearAsignacionAction`)
- DAL: `lib/dal/asignaciones.ts` (`crearAsignacion`, `validarInput`, `notificarAlumnos`)
- DAL grupos: `lib/dal/groups.ts` (`obtenerGruposDelProfesor`)
- Excepciones tipadas: `ValidationError`, `ForbiddenError`, `PeriodoCerradoError`, `FechaInvalidaError`
- Enums: `AssignmentStatus (BORRADOR|PUBLICADO)`, `AssignmentType`, `SubmissionStatus (PENDIENTE)`
- Guard: `getAuthenticatedUser(["PROFESOR"])`

---

## 1. Diagrama de Actividades

- Círculo negro (inicio) → línea continua con flecha → siguiente.
- Rectángulo: `Profesor navega a /profesor/asignaciones/nueva`. Línea continua con flecha → siguiente.
- Rectángulo: `page.tsx: await getGruposProfesorAction()` → `dal.obtenerGruposDelProfesor()`. Línea continua con flecha → siguiente.
- Rectángulo: `Render CrearAsignacionContainer con GrupoOpcionDTO[]`. Línea continua con flecha → siguiente.
- Rectángulo: `Profesor abre SelectorGrupos y selecciona uno o varios grupos`. Línea continua con flecha → siguiente.
- Rectángulo: `Profesor llena FormularioAsignacion (tipo, título, instrucciones, fechaLimite, rúbrica?)`. Línea continua con flecha → rombo.
- Rombo: `¿modo?`.
  - `[BORRADOR]` → flecha hacia siguiente actividad con guarda `[BORRADOR]`.
  - `[PUBLICAR]` → flecha hacia siguiente actividad con guarda `[PUBLICAR]`.
- Rectángulo: `Click "Guardar" → crearAsignacionAction(input)`. Línea continua con flecha → rectángulo `validarInput(input)`.
- Rombo: `¿título?`.
  - `[vacío || >256]` → rectángulo `throw ValidationError` → nodo final.
- Rombo: `¿instrucciones vacías?`.
  - `[sí]` → `throw ValidationError` → final.
- Rombo: `¿groupIds.length===0?`.
  - `[sí]` → `throw ValidationError` → final.
- Rombo: `¿AssignmentType válido?`.
  - `[no]` → `throw ValidationError` → final.
- Rombo: `¿fechaLimite parsea?`.
  - `[NaN]` → `throw FechaInvalidaError("inválida")` → final.
- Rombo: `¿fechaLimite > Date.now()?`.
  - `[no]` → `throw FechaInvalidaError("debe ser futura")` → final.
- (Validación pasada) Línea continua con flecha → rectángulo: `prisma.group.findMany({id IN groupIds, include:{period, enrollments:{studentId}}})`. Línea continua con flecha → región de expansión `«iterative»` sobre `groups`:
  - Rombo: `¿groups.length === input.groupIds.length?`.
    - `[no]` → rectángulo `throw ForbiddenError`.
  - Rombo: `¿g.teacherId === session.id?`.
    - `[no]` → `throw ForbiddenError`.
  - Rombo: `¿g.period.isActive?`.
    - `[no]` → `throw PeriodoCerradoError`.
  - Rombo: `¿startDate ≤ fechaLimite ≤ endDate?`.
    - `[no]` → `throw FechaInvalidaError("dentro del periodo activo")`.
- Salida de la región → rectángulo: `status = modo==="PUBLICAR" ? PUBLICADO : BORRADOR`. Línea continua con flecha → rectángulo `prisma.$transaction inicio`.
- Región de expansión `«iterative»` sobre `groups`:
  - Rectángulo: `tx.assignment.create({groupId, titulo, instrucciones, tipo, status, fechaLimite, rubrica})` → `assignment.id`.
  - Rombo: `¿modo === "PUBLICAR" && enrollments.length > 0?`.
    - `[sí]` → rectángulo: `tx.submission.createMany({assignmentId, studentId, status:PENDIENTE, intento:1}) × enrollments`.
    - `[no]` → continuar.
- Salida → rectángulo `commit transacción`. Línea continua con flecha → rombo.
- Rombo: `¿modo === "PUBLICAR"?`.
  - `[no]` → ir a rectángulo `return result {asignacionesCreadas, submissionsCreadas:0, notificacionesEnviadas:0}`.
  - `[sí]` → barra gruesa (fork) → región `«concurrent»` sobre `notifPayloads`:
    - Rectángulo con lado saliente convexo (evento emitido): `notificarAlumnos({assignmentId, groupId, studentIds, titulo}) → console.log("[CU-09][notificacion]", payload)` (best-effort).
    - Rombo `¿fallo?`.
      - `[sí]` → rectángulo `console.error; +0 a contador`.
      - `[no]` → rectángulo `+studentIds.length`.
  - Salida → barra gruesa (join) → rectángulo: `return result {asignacionesCreadas, submissionsCreadas, notificacionesEnviadas}`.
- Línea continua con flecha → rectángulo: `Render ConfirmacionPublicacion (n asignaciones, n submissions, n notificaciones)`. Línea continua con flecha → nodo final (círculo blanco con negro concéntrico).

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Profesor` contiene: nodo inicial, navegar a `/profesor/asignaciones/nueva`, selección de grupos, llenado de formulario (tipo, título, instrucciones, fechaLimite, rúbrica), elección modo BORRADOR|PUBLICAR, click "Guardar".
- Pista `Page (profesor/asignaciones/nueva/page.tsx)` (Server Component) contiene: precarga vía `getGruposProfesorAction()`.
- Pista `Cliente (_components)` contiene: `CrearAsignacionContainer`, `SelectorGrupos`, `FormularioAsignacion`, `ConfirmacionPublicacion`, hook `useCrearAsignacionFlow.ts`.
- Pista `Server Actions (lib/actions/asignaciones.actions.ts)` contiene: `getGruposProfesorAction`, `crearAsignacionAction`, mapeo de excepciones tipadas → `errorCode (VALIDATION|DATE_INVALID|FORBIDDEN|PERIOD_CLOSED)`.
- Pista `DAL Asignaciones (lib/dal/asignaciones.ts)` contiene: `validarInput` (título/instrucciones/groupIds/tipo/fechaLimite), ownership y rango de periodo por grupo, lanzamiento de `$transaction`, `notificarAlumnos` best-effort.
- Pista `DAL Groups (lib/dal/groups.ts)` contiene: `obtenerGruposDelProfesor`.
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser(["PROFESOR"])`.
- Pista `Prisma $transaction` contiene: región `«iterative»` con `tx.assignment.create` por grupo + `tx.submission.createMany({status:PENDIENTE, intento:1})` cuando modo `PUBLICAR`, commit atómico.
- Pista `Prisma/PostgreSQL` contiene: `prisma.group.findMany` con `include:{period, enrollments}`, persistencia de `assignment` y `submission`.

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `profesor:Profesor`
- `page:profesor/asignaciones/nueva/page.tsx`
- `container:CrearAsignacionContainer.tsx`
- `selector:SelectorGrupos.tsx`
- `form:FormularioAsignacion.tsx`
- `hook:useCrearAsignacionFlow.ts`
- `accionAsig:asignaciones.actions.ts`
- `dalAsig:asignaciones.ts`
- `dalGroups:groups.ts`
- `guard:session.ts`
- `tx:prisma.$transaction`
- `db:PostgreSQL`
- `confirm:ConfirmacionPublicacion.tsx`

Mensajes:

1. `profesor:Profesor` → `page:profesor/asignaciones/nueva/page.tsx` flecha rellena; `GET /profesor/asignaciones/nueva`.
2. `page:profesor/asignaciones/nueva/page.tsx` → `accionAsig:asignaciones.actions.ts` flecha rellena; `getGruposProfesorAction()`.
3. `accionAsig:asignaciones.actions.ts` → `dalGroups:groups.ts` flecha rellena; `obtenerGruposDelProfesor()`.
4. `dalGroups:groups.ts` → `guard:session.ts` flecha rellena; `getAuthenticatedUser(["PROFESOR"])`.
5. `guard:session.ts` → `dalGroups:groups.ts` flecha abierta punteada; `{id, role}`.
6. `dalGroups:groups.ts` → `db:PostgreSQL` flecha rellena (diagonal `{T<d+80ms}`); `prisma.group.findMany({teacherId, include:{subject, _count.enrollments}})`.
7. `db:PostgreSQL` → `dalGroups:groups.ts` flecha abierta punteada; `groups[]`.
8. `dalGroups:groups.ts` → `accionAsig:asignaciones.actions.ts` → `page` cadena de flechas abiertas punteadas; `GrupoOpcionDTO[]`.
9. `page:profesor/asignaciones/nueva/page.tsx` → `container:CrearAsignacionContainer.tsx` flecha rellena; `props gruposResult`.
10. `profesor:Profesor` → `selector:SelectorGrupos.tsx` flecha rellena; `toggle(groupIds)`.
11. `profesor:Profesor` → `form:FormularioAsignacion.tsx` flecha rellena; `fill(tipo, titulo, instrucciones, fechaLimite, rubrica, modo)`.
12. `form:FormularioAsignacion.tsx` → `hook:useCrearAsignacionFlow.ts` flecha rellena; `submit(input)`.
13. `hook:useCrearAsignacionFlow.ts` → `accionAsig:asignaciones.actions.ts` flecha rellena (diagonal `{d<3s}`); `crearAsignacionAction(input)`.
14. `accionAsig:asignaciones.actions.ts` → `dalAsig:asignaciones.ts` flecha rellena; `crearAsignacion(input)`.
15. `dalAsig:asignaciones.ts` → `guard:session.ts` flecha rellena; `getAuthenticatedUser(["PROFESOR"])`.
16. `guard:session.ts` → `dalAsig:asignaciones.ts` flecha abierta punteada; `{id, role}`.
17. `dalAsig:asignaciones.ts` → sí mismo flecha rellena que vuelve; `validarInput(input) — checks título/instrucciones/groupIds/tipo/fechaLimite parse/fechaLimite>now`.
18. Fragmento `alt`:
   - `[título vacío|>256|instrucciones vacías|groupIds vacíos|tipo inválido]` → throw ValidationError → `dalAsig` → `accionAsig` flecha abierta punteada `{ok:false, errorCode:"VALIDATION"}`. Cierre.
   - `[fechaLimite NaN|≤now]` → throw FechaInvalidaError → `{ok:false, errorCode:"DATE_INVALID"}`. Cierre.
19. `dalAsig:asignaciones.ts` → `db:PostgreSQL` flecha rellena; `prisma.group.findMany({id IN groupIds, include:{period, enrollments:{studentId}}})`.
20. `db:PostgreSQL` → `dalAsig:asignaciones.ts` flecha abierta punteada; `groups[]`.
21. Fragmento `loop` `[por cada g]`:
   - `dalAsig` → sí mismo flecha rellena que vuelve; `verificar ownership + period.isActive + startDate ≤ fechaLimite ≤ endDate`.
   - Fragmento `alt` interno:
     - `[fail ownership]` → throw ForbiddenError → `{ok:false, errorCode:"FORBIDDEN"}`.
     - `[!period.isActive]` → throw PeriodoCerradoError → `{ok:false, errorCode:"PERIOD_CLOSED"}`.
     - `[fechaLimite fuera del periodo]` → throw FechaInvalidaError → `{ok:false, errorCode:"DATE_INVALID"}`.
22. `dalAsig:asignaciones.ts` → `tx:prisma.$transaction` flecha rellena; `$transaction(async tx ⇒ {...})`.
23. Fragmento `loop` `[por cada g]`:
   - `tx:prisma.$transaction` → `db:PostgreSQL` flecha rellena; `tx.assignment.create({groupId, titulo, instrucciones, tipo, status, fechaLimite, rubrica})`.
   - `db:PostgreSQL` → `tx:prisma.$transaction` flecha abierta punteada; `assignment{id}`.
   - Fragmento `opt` `[modo === "PUBLICAR" && enrollments.length > 0]`:
     - `tx:prisma.$transaction` → `db:PostgreSQL` flecha rellena (diagonal); `tx.submission.createMany({assignmentId, studentId, status:PENDIENTE, intento:1}) × enrollments`.
     - `db:PostgreSQL` → `tx:prisma.$transaction` flecha abierta punteada; `{count:n}`. Cierre.
   Cierre del loop.
24. `tx:prisma.$transaction` → `dalAsig:asignaciones.ts` flecha abierta punteada; `commit ok + {asignacionesCreadas, submissionsCreadas, notifPayloads}`.
25. Fragmento `opt` `[modo === "PUBLICAR"]`:
   - Loop `[por cada notifPayload]`:
     - `dalAsig:asignaciones.ts` → `dalAsig:asignaciones.ts` flecha rellena que vuelve; `notificarAlumnos({assignmentId, groupId, studentIds, titulo}) → console.log estructurado`.
     - Si excepción interna: línea continua con flecha y círculo relleno al final entre `dalAsig` y `dalAsig` (mensaje perdido, no revierte).
26. `dalAsig:asignaciones.ts` → `accionAsig:asignaciones.actions.ts` flecha abierta punteada; `{asignacionesCreadas, submissionsCreadas, notificacionesEnviadas}`.
27. `accionAsig:asignaciones.actions.ts` → `hook:useCrearAsignacionFlow.ts` flecha abierta punteada; `{ok:true, data}`.
28. `hook:useCrearAsignacionFlow.ts` → `confirm:ConfirmacionPublicacion.tsx` flecha rellena; `render contadores`.
29. `confirm:ConfirmacionPublicacion.tsx` → `profesor:Profesor` flecha abierta punteada; `vista confirmación`.

---

## 3. Diagrama de Paquetes

Paquetes:
- `app/(dashboard)/profesor/asignaciones/nueva` con `page.tsx`.
- `_components` con `«component» CrearAsignacionContainer.tsx`, `«component» SelectorGrupos.tsx`, `«component» FormularioAsignacion.tsx`, `«component» ConfirmacionPublicacion.tsx`, rectángulo `useCrearAsignacionFlow.ts`.
- `lib/actions` con `asignaciones.actions.ts`.
- `lib/dal` con `asignaciones.ts`, `groups.ts`, `session.ts`.
- `lib/generated/prisma/enums` con `AssignmentStatus`, `AssignmentType`, `SubmissionStatus`.
- `lib/contracts` con `result.ts`.
- Paquete externo `Prisma Client` con `prisma.$transaction`, `prisma.assignment`, `prisma.submission`, `prisma.group`.
- Paquete externo `next-auth` con `auth()`.

Relaciones:
- `page.tsx` —`«import»` línea punteada flecha abierta→ `asignaciones.actions.ts`, `CrearAsignacionContainer.tsx`.
- `CrearAsignacionContainer.tsx` —`«import»` línea punteada flecha abierta→ `SelectorGrupos.tsx`, `FormularioAsignacion.tsx`, `ConfirmacionPublicacion.tsx`, `useCrearAsignacionFlow.ts`.
- `useCrearAsignacionFlow.ts` —`«import»` línea punteada flecha abierta→ `asignaciones.actions.ts`.
- `asignaciones.actions.ts` —`«import»` línea punteada flecha abierta→ `asignaciones.ts (DAL)`, `groups.ts (DAL)`.
- `asignaciones.ts (DAL)` —`«import»` línea punteada flecha abierta→ `session.ts`, `lib/generated/prisma/enums`.
- `asignaciones.ts (DAL)` —`«use»` línea punteada flecha→ `Prisma Client`.
- `groups.ts (DAL)` —`«import»` línea punteada flecha abierta→ `session.ts`.
- `session.ts` —`«use»` línea punteada flecha→ `next-auth::auth()`.
- Nota (rectángulo borde punteado): texto `Multi-grupo atómico: N assignments + N×enrollments submissions en una sola $transaction`. Conectada con línea punteada a `asignaciones.ts`.
- Nota: texto `BORRADOR no crea Submissions ni envía notificaciones (regla CU-09 #7)`. Conectada con línea punteada a `asignaciones.ts`.
- Nota: texto `notificarAlumnos es best-effort: log estructurado; su fallo NO revierte la publicación`. Conectada con línea punteada a `asignaciones.ts`.
- Restricción (rombo) anexa a `asignaciones.ts`: texto `{period.startDate ≤ fechaLimite ≤ period.endDate} AND {fechaLimite > now()}`. Línea sólida al rectángulo.
