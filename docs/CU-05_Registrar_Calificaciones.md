# CU-05 — Registrar Calificaciones — Guía de Dibujo UML

Archivos reales:
- Página: `app/(dashboard)/profesor/calificar/page.tsx`
- Container: `_components/RegistrarCalificacionesContainer.tsx`
- Selectores: `GrupoSelector.tsx`, `AsignacionSelector.tsx`
- Vista de captura: `TablaCaptura.tsx`
- Resultado: `ResultadoRegistro.tsx`
- Hook: `useCalificarFlow.ts`
- Server Actions: `lib/actions/registrarCalificaciones.actions.ts` (`getGruposProfesorAction`, `getAlumnosGrupoAction`, `getAsignacionesGrupoAction`, `registrarCalificacionesAction`)
- DAL: `lib/dal/registrarCalificaciones.ts` (`obtenerGruposDelProfesor`, `obtenerAlumnosDelGrupo`, `obtenerAsignacionesDelGrupo`, `registrarCalificaciones`)
- Excepciones tipadas: `PeriodoCerradoError`, `FueraDeRangoError`, `ForbiddenError`, `GrupoSinAlumnosError`
- Guard: `getAuthenticatedUser([UserRole.PROFESOR])`

---

## 1. Diagrama de Actividades

Convención: conexiones por defecto = línea continua con flecha al siguiente nodo. Solo se especifica el tipo cuando difiere.

- Círculo negro (inicio).
- Rectángulo redondeado: `Profesor navega a /profesor/calificar; page.tsx ejecuta getGruposProfesorAction() → dal.obtenerGruposDelProfesor()`.
- Rombo `¿rol === PROFESOR?`:
  - `[no]` → `redirect("/")` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `prisma.group.findMany({teacherId, period.isActive:true, include:{subject, period, _count.enrollments}}) → Render Container con GrupoDTO[]`.
- Rectángulo: `Profesor elige grupo (GrupoSelector) → getAsignacionesGrupoAction(groupId) → DAL obtenerAsignacionesDelGrupo`.
- Rectángulo: `Profesor elige assignment (AsignacionSelector) → getAlumnosGrupoAction(groupId, assignmentId) → DAL obtenerAlumnosDelGrupo`.
- Rombo `¿group.teacherId === session.id?`:
  - `[no]` → `throw ForbiddenError` → final.
  - `[sí]` → siguiente.
- Rombo `¿group.period.isActive?`:
  - `[no]` → `throw PeriodoCerradoError` → final.
  - `[sí]` → siguiente.
- Rombo `¿enrollments.length > 0?`:
  - `[no]` → `throw GrupoSinAlumnosError` → final.
  - `[sí]` → siguiente.
- Rectángulo: `Render TablaCaptura con AlumnoEnGrupoDTO[] (incluye gradeActual); profesor captura valores 0..10 + retroalimentación; click "Guardar" → registrarCalificacionesAction(input)`.
- Rombo `¿todas valor ∈ [0,10] || null?`:
  - `[no]` → `throw FueraDeRangoError(valor)` → final.
  - `[sí]` → siguiente.
- Barra gruesa (fork) — preparación bulk → dos actividades concurrentes:
  - Rectángulo: `prisma.submission.findMany por (assignmentId, studentIds) — último intento`.
  - Rectángulo: `Filtrar entradasValidas con valor !== null` (registro parcial: respeta null = "no calificar").
- Barra gruesa (join) → rectángulo: `prisma.$transaction inicio`.
- Región de expansión `«iterative»` sobre `entradasValidas`:
  - Rombo `¿submission existente?`:
    - `[sí]` → `tx.submission.update({status:CALIFICADO})`.
    - `[no]` → `tx.submission.create({assignmentId, studentId, status:CALIFICADO, intento:1})`.
  - Rombo `¿grade existente por submissionId?`:
    - `[sí]` → `tx.grade.update({valor:Prisma.Decimal, retroalimentacion?})` → `gradesActualizadas++`.
    - `[no]` → `tx.grade.create({submissionId, studentId, valor, retroalimentacion})` → `gradesCreadas++`.
- Rectángulo: `commit transacción`.
- Rectángulo con lado saliente convexo (evento emitido): `Por cada entrada: prisma.notification.create({userId:studentId, titulo:"Nueva calificación registrada", leida:false})` — best-effort.
- Rectángulo con lado saliente convexo: `prisma.notification.create({userId:session.id, titulo:"Auditoría: Registro de calificaciones", leida:true})`.
- Rectángulo: `return {gradesCreadas, gradesActualizadas, notificacionesEnviadas, auditoriaRegistrada, warnings} → Render ResultadoRegistro`.
- Nodo final (círculo blanco con negro concéntrico).

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Profesor` contiene: nodo inicial, navegar a `/profesor/calificar`, selección de grupo, selección de assignment, captura de valores 0..10, click "Guardar".
- Pista `Page (profesor/calificar/page.tsx)` (Server Component) contiene: precarga vía `getGruposProfesorAction()`.
- Pista `Cliente (_components)` contiene: `RegistrarCalificacionesContainer`, `GrupoSelector`, `AsignacionSelector`, `TablaCaptura`, `ResultadoRegistro`, hook `useCalificarFlow.ts`.
- Pista `Server Actions (lib/actions/registrarCalificaciones.actions.ts)` contiene: `getGruposProfesorAction`, `getAsignacionesGrupoAction`, `getAlumnosGrupoAction`, `registrarCalificacionesAction`, mapeo de excepciones tipadas → `errorCode`.
- Pista `DAL (lib/dal/registrarCalificaciones.ts)` contiene: `obtenerGruposDelProfesor`, `obtenerAsignacionesDelGrupo`, `obtenerAlumnosDelGrupo`, ownership check, validación de rango `[0,10]`, pre-fetch bulk de submissions, lanzamiento de `$transaction`, notificaciones best-effort, auditoría.
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser([UserRole.PROFESOR])`.
- Pista `Prisma $transaction` contiene: región de expansión `«iterative»` con `tx.submission.update | create`, `tx.grade.findUnique`, `tx.grade.update | create`, commit.
- Pista `Prisma/PostgreSQL` contiene: `prisma.group.findMany/findUnique`, `prisma.enrollment.findMany`, `prisma.grade.findMany`, `prisma.assignment.findMany`, `prisma.submission.findMany`, `prisma.notification.create`.

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `profesor:Profesor`
- `page:profesor/calificar/page.tsx`
- `container:RegistrarCalificacionesContainer.tsx`
- `grupoSel:GrupoSelector.tsx`
- `asigSel:AsignacionSelector.tsx`
- `tabla:TablaCaptura.tsx`
- `hook:useCalificarFlow.ts`
- `accionReg:registrarCalificaciones.actions.ts`
- `dal:registrarCalificaciones.ts`
- `guard:session.ts`
- `tx:prisma.$transaction`
- `db:PostgreSQL`
- `resultado:ResultadoRegistro.tsx`

Mensajes:

1. `profesor` → `page` flecha rellena; `GET /profesor/calificar`.
2. `page` → `accionReg` flecha rellena; `getGruposProfesorAction()`.
3. `accionReg` → `dal` flecha rellena; `obtenerGruposDelProfesor()`.
4. `dal` → `guard` flecha rellena; `getAuthenticatedUser([PROFESOR])`.
5. `guard` → `dal` flecha abierta punteada; `{id, role:PROFESOR}`.
6. `dal` → `db` flecha rellena (diagonal `{T<d+80ms}`); `prisma.group.findMany({teacherId, period.isActive:true, include:{subject, period, _count.enrollments}})`.
7. `db` → `dal` flecha abierta punteada; `groups[]`.
8. `dal` → `accionReg` flecha abierta punteada; `GrupoDTO[]`.
9. `accionReg` → `page` flecha abierta punteada; `{ok:true, data:GrupoDTO[]}`.
10. `page` → `container` flecha rellena; `props {gruposResult}`.
11. `profesor` → `grupoSel` flecha rellena; `selecciona grupo`.
12. `grupoSel` → `hook` flecha rellena; `setGroupId(id)`.
13. `hook` → `accionReg` flecha rellena; `getAsignacionesGrupoAction(groupId)`.
14. `accionReg` → `dal` flecha rellena; `obtenerAsignacionesDelGrupo(groupId)`.
15. `dal` → `db` flecha rellena (diagonal); `prisma.assignment.findMany({groupId, status:PUBLICADO})`.
16. `db` → `dal` → `accionReg` → `hook` flechas abiertas punteadas en cadena; `AssignmentDTO[]`.
17. `profesor` → `asigSel` flecha rellena; `selecciona assignment`.
18. `hook` → `accionReg` flecha rellena; `getAlumnosGrupoAction(groupId, assignmentId)`.
19. `accionReg` → `dal` flecha rellena; `obtenerAlumnosDelGrupo(...)`.
20. `dal` → `db` flecha rellena; `prisma.enrollment.findMany({groupId, include:student})` + `prisma.grade.findMany({submission.assignmentId, studentId IN ...})`.
21. `db` → `dal` flecha abierta punteada; `enrollments[], grades[]`.
22. Fragmento `alt`:
   - `[!group || group.teacherId ≠ session.id]` → `dal` → `accionReg` flecha abierta punteada `throw ForbiddenError`; `accionReg` → `hook` `{ok:false, errorCode:"FORBIDDEN"}`. Cierre.
   - `[!group.period.isActive]` → `throw PeriodoCerradoError` → `{ok:false, errorCode:"PERIOD_CLOSED"}`. Cierre.
   - `[enrollments.length===0]` → `throw GrupoSinAlumnosError` → `{ok:false, errorCode:"NO_ALUMNOS"}`. Cierre.
23. `dal` → `hook` flecha abierta punteada; `AlumnoEnGrupoDTO[]`.
24. `hook` → `tabla:TablaCaptura.tsx` flecha rellena; `render rows + gradeActual`.
25. `profesor` → `tabla:TablaCaptura.tsx` flecha rellena; `captura valor[studentId]`.
26. `tabla:TablaCaptura.tsx` → `hook` flecha rellena; `onSubmit(calificaciones[])`.
27. `hook` → `accionReg` flecha rellena (diagonal `{d<3s}`); `registrarCalificacionesAction({groupId, assignmentId, calificaciones})`.
28. `accionReg` → `dal` flecha rellena; `registrarCalificaciones(input)`.
29. `dal` → `guard` flecha rellena; `getAuthenticatedUser([PROFESOR])`.
30. `guard` → `dal` flecha abierta punteada; `{id, role}`.
31. `dal` → `db` flecha rellena; `prisma.group.findUnique({id, include:{period, subject}})` (re-check ownership).
32. `db` → `dal` flecha abierta punteada; `group | null`.
33. Validación de rango: `dal` → sí mismo flecha rellena que vuelve; `if (valor<0 || valor>10) throw FueraDeRangoError`.
34. `dal` → `db` flecha rellena; `prisma.submission.findMany({assignmentId, studentId IN, orderBy:intento desc})`.
35. `db` → `dal` flecha abierta punteada; `submissions[]` (último intento por alumno).
36. `dal` → `tx:prisma.$transaction` flecha rellena; `$transaction(async tx ⇒ {...})`.
37. Fragmento `loop` etiqueta `[por cada entrada]` (bucle):
   - `tx` → `db` flecha rellena; `tx.submission.update | tx.submission.create`.
   - `db` → `tx` flecha abierta punteada; `{id:submissionId}`.
   - `tx` → `db` flecha rellena; `tx.grade.findUnique({submissionId})`.
   - `db` → `tx` flecha abierta punteada; `grade | null`.
   - `tx` → `db` flecha rellena; `tx.grade.update | tx.grade.create({valor:Prisma.Decimal})`.
   - `db` → `tx` flecha abierta punteada; `grade{id}`.
   Cierre del fragmento.
38. `tx` → `dal` flecha abierta punteada; `commit ok`.
39. Fragmento `loop` `[notificaciones best-effort, por cada entrada]`:
   - `dal` → `db` flecha rellena; `prisma.notification.create({userId:studentId, titulo:"Nueva calificación registrada"})`.
   - Si falla: línea continua con flecha y círculo relleno al final entre `dal` y `db` (mensaje perdido) → `warnings.push(...)`. Cierre.
40. `dal` → `db` flecha rellena; `prisma.notification.create({userId:session.id, titulo:"Auditoría: Registro de calificaciones", leida:true})`.
41. `dal` → `accionReg` flecha abierta punteada; `{gradesCreadas, gradesActualizadas, notificacionesEnviadas, auditoriaRegistrada, warnings}`.
42. `accionReg` → `hook` flecha abierta punteada; `{ok:true, data, warnings}`.
43. `hook` → `resultado:ResultadoRegistro.tsx` flecha rellena; `render contadores + warnings`.
44. `resultado:ResultadoRegistro.tsx` → `profesor` flecha abierta punteada; `vista confirmación`.

---

## 3. Diagrama de Paquetes

Paquetes:
- `app/(dashboard)/profesor/calificar` con `page.tsx`.
- `app/(dashboard)/profesor/calificar/_components` con `«component» RegistrarCalificacionesContainer.tsx`, `«component» GrupoSelector.tsx`, `«component» AsignacionSelector.tsx`, `«component» TablaCaptura.tsx`, `«component» ResultadoRegistro.tsx`, y rectángulo `useCalificarFlow.ts` (hook).
- `lib/actions` con `registrarCalificaciones.actions.ts`.
- `lib/dal` con `registrarCalificaciones.ts`, `session.ts`.
- `lib/generated/prisma` con rectángulos `Prisma`, `enums (UserRole, AssignmentStatus, SubmissionStatus)`.
- Paquete externo `Prisma Client` (carpeta) con `prisma.$transaction`, `prisma.group`, `prisma.submission`, `prisma.grade`, `prisma.notification`.
- Paquete externo `next-auth` con `auth()`.

Relaciones:
- `page.tsx` —`«import»` línea punteada flecha abierta→ `registrarCalificaciones.actions.ts`, `RegistrarCalificacionesContainer.tsx`.
- `RegistrarCalificacionesContainer.tsx` —`«import»` línea punteada flecha abierta→ `GrupoSelector.tsx`, `AsignacionSelector.tsx`, `TablaCaptura.tsx`, `ResultadoRegistro.tsx`, `useCalificarFlow.ts`.
- `useCalificarFlow.ts` —`«import»` línea punteada flecha abierta→ `registrarCalificaciones.actions.ts`.
- `registrarCalificaciones.actions.ts` —`«import»` línea punteada flecha abierta→ `registrarCalificaciones.ts (DAL)`.
- `registrarCalificaciones.ts` —`«import»` línea punteada flecha abierta→ `session.ts`, `lib/generated/prisma/enums`, `lib/generated/prisma/client (Prisma.Decimal)`.
- `registrarCalificaciones.ts` —`«use»` línea punteada flecha→ `Prisma Client`.
- Nota (rectángulo borde punteado): texto `Atomicidad: submissions+grades en $transaction; notificaciones post-commit best-effort`. Conectada con línea punteada a `registrarCalificaciones.ts`.
- Restricción (rombo) anexa a `registrarCalificaciones.ts`: texto `{ownership: group.teacherId === session.id} AND {period.isActive} AND {0 ≤ valor ≤ 10}`. Línea sólida al rectángulo.
