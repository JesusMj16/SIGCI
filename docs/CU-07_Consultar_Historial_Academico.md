# CU-07 — Consultar Historial Académico — Guía de Dibujo UML

Implementación en rama `origin/historial_academico` (no fusionada a main al momento de redactar).

Archivos reales (rama `historial_academico`):
- Página: `app/(dashboard)/alumno/historial/page.tsx`
- DAL: `lib/dal/academic_history.ts` (`getAcademicHistory(targetStudentId)`)
- Presentación: `lib/presentation/academic_history.ts`
- Helper inline en page: `calculateFinalGrade(enrollment)` (promedio sobre `submissions[].grade.valor`)
- Guard: `getAuthenticatedUser(["ALUMNO","ADMIN"])`
- Schema relevante: `User.carreraRel` (Carrera, créditos totales), `Enrollment → Group → Subject + Period + Assignment → Submission → Grade`

---

## 1. Diagrama de Actividades

Convención: conexiones por defecto = línea continua con flecha al siguiente nodo. Solo se especifica el tipo cuando difiere.

- Círculo negro (inicio).
- Rectángulo redondeado: `Alumno navega a /alumno/historial; getAuthenticatedUser(["ALUMNO","ADMIN"]) → userSession`.
- Rombo `¿targetStudentId === userSession.id OR rol ∈ {ADMIN, SERVICIOS_ESCOLARES}?` (DAL check):
  - `[no]` → rectángulo `throw Error("No tienes permiso para ver este historial.") → render error` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `prisma.user.findUnique({id, include:{carreraRel, enrollments:{include:{group:{subject, period, assignments:{include:{submissions(studentId).grade}}}}}, orderBy: group.period.startDate desc}})`.
- Rombo `¿user.enrollments.length === 0?`:
  - `[sí]` → rectángulo `Render "Aún no cuentas con historial académico registrado."` → nodo final.
  - `[no]` → siguiente.
- Región de expansión `«iterative»` sobre `enrollments`:
  - Rectángulo: `allSubmissions = enrollment.group.assignments.flatMap(a ⇒ a.submissions); grades = allSubmissions.map(s ⇒ s.grade?.valor).filter(v !== null)`.
  - Rombo `¿grades.length === 0?`:
    - `[sí]` → `finalGrade = null → "Calificación pendiente"`.
    - `[no]` → `finalGrade = Number((sum/grades.length).toFixed(1))`.
  - Rectángulo: `Estatus: aprobada (≥7) | reprobada (<7) | en curso (finalGrade==null && period.isActive)`.
- Rectángulo: `acumular créditos sólo con materias aprobadas`.
- Rombo `¿user.carreraRel disponible?`:
  - `[no]` → `avance = N/A (mensaje "Plan de estudios no encontrado")`.
  - `[sí]` → `avance = (créditosAcumulados / carreraRel.creditosTotales) * 100`.
- Rectángulo: `Agrupar por period.startDate desc → Render <StatCard AcademicCapIcon créditos>, <StatCard ChartBarIcon avance>, tabla por semestre BookOpenIcon, diferenciación visual aprobada/reprobada`.
- Rombo (flujo alternativo) `¿usuario filtra por semestre?`:
  - `[sí]` → `Filtrar enrollments por period.id en cliente` → vuelta a render.
  - `[no]` → siguiente.
- Rombo (flujo alternativo) `¿usuario "Descargar Historial"?` — NO implementado:
  - `[sí]` → rectángulo borde discontinuo `«future» Generar PDF` → nodo final.
  - `[no]` → nodo final (círculo blanco con negro concéntrico).

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Alumno` contiene: nodo inicial, navegar a `/alumno/historial`, filtrar por semestre, click "Descargar Historial".
- Pista `Page (alumno/historial/page.tsx)` (Server Component) contiene: invocación de `getAuthenticatedUser`, query Prisma con `include` profundo, `calculateFinalGrade`, acumulación de créditos, cálculo de avance, render de `StatCard` y tabla por semestre.
- Pista `DAL (lib/dal/academic_history.ts)` contiene: `getAcademicHistory(targetStudentId)`, ownership check (`isOwner || isStaff`).
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser(["ALUMNO","ADMIN"])`.
- Pista `Prisma/PostgreSQL` contiene: `prisma.user.findUnique` con `include` (`carreraRel`, `enrollments`, `group`, `subject`, `period`, `assignments`, `submissions`, `grade`), `orderBy: group.period.startDate desc`.
- Pista `Presentación (lib/presentation/academic_history.ts)` contiene: helpers de presentación (estatus aprobada/reprobada/en curso, formato de promedio).
- Pista `Cliente (componentes UI)` contiene: `StatCard` (AcademicCapIcon, ChartBarIcon), tabla por semestre con `BookOpenIcon`, `Alert` "Plan de estudios no encontrado", filtrado en cliente por `period.id`, rectángulo `«future»` "Generar PDF".

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `alumno:Alumno`
- `page:alumno/historial/page.tsx`
- `dal:academic_history.ts`
- `guard:session.ts`
- `db:PostgreSQL`
- `statCard:StatCard.tsx`

Mensajes:

1. `alumno:Alumno` → `page:alumno/historial/page.tsx` flecha rellena; `GET /alumno/historial`.
2. `page:alumno/historial/page.tsx` → `guard:session.ts` flecha rellena; `getAuthenticatedUser(["ALUMNO","ADMIN"])`.
3. `guard:session.ts` → `page:alumno/historial/page.tsx` flecha abierta punteada; `userSession {id, role}`.
4. (Variante DAL standalone) `page:alumno/historial/page.tsx` → `dal:academic_history.ts` flecha rellena; `getAcademicHistory(userSession.id)`.
5. `dal:academic_history.ts` → `guard:session.ts` flecha rellena; `getAuthenticatedUser()`.
6. `guard:session.ts` → `dal:academic_history.ts` flecha abierta punteada; `currentUser`.
7. Fragmento `alt` `[!isOwner && !isStaff]`:
   - `dal:academic_history.ts` → `page:alumno/historial/page.tsx` flecha abierta punteada; `throw Error("No tienes permiso...")`. Cierre.
8. `dal:academic_history.ts | page` → `db:PostgreSQL` flecha rellena (diagonal `{T<d+200ms}` por joins profundos); `prisma.user.findUnique({id, include:{carreraRel, enrollments:{include:{group:{subject, period, assignments:{include:{submissions(studentId).grade}}}}}}, orderBy: group.period.startDate desc})`.
9. `db:PostgreSQL` → `dal | page` flecha abierta punteada; `user + enrollments[]`.
10. Loop fragment `[por cada enrollment]`:
    - `page:alumno/historial/page.tsx` → sí mismo flecha rellena que vuelve; `calculateFinalGrade(enrollment): flatMap(submissions).map(grade.valor).filter notNull.avg.toFixed(1)`.
    - Cierre.
11. `page:alumno/historial/page.tsx` → sí mismo flecha rellena que vuelve; `Sum créditos aprobados; calcular avance = créditos/carreraRel.creditosTotales*100`.
12. `page:alumno/historial/page.tsx` → `statCard:StatCard.tsx` flecha rellena; `render({icon:AcademicCapIcon, valor:créditos})`, `render({icon:ChartBarIcon, valor:avance%})`, `render tabla por semestre`.
13. `statCard:StatCard.tsx` → `alumno:Alumno` flecha abierta punteada; `vista del historial`.
14. Fragmento `opt` `[!user.carreraRel]`:
    - `page:alumno/historial/page.tsx` → `alumno:Alumno` flecha abierta punteada; `Alert "Plan de estudios no encontrado" (historial sin %avance)`. Cierre.
15. Mensaje encontrado posible: si `prisma` lanza P2025 (registro no encontrado) por race con baja de usuario, `db` → `page` línea continua con flecha y círculo relleno al final → `Render error técnico`.

---

## 3. Diagrama de Paquetes

Paquetes:
- `app/(dashboard)/alumno/historial` con `page.tsx`.
- `lib/dal` con `academic_history.ts`, `session.ts`.
- `lib/presentation` con `academic_history.ts` (helpers de presentación).
- `components/dashboard` con `«component» StatCard.tsx`.
- `components/ui` con `«component» Alert.tsx`.
- `@heroicons/react/24/outline` (paquete externo) con rectángulos `AcademicCapIcon`, `ChartBarIcon`, `BookOpenIcon`.
- Paquete externo `Prisma Client` con `prisma.user.findUnique`, `prisma.enrollment`.
- Paquete externo `next-auth` con `auth()`.

Relaciones:
- `page.tsx` —`«import»` línea punteada flecha abierta→ `session.ts`, `academic_history.ts (DAL)`, `presentation/academic_history.ts`, `StatCard.tsx`, `Alert.tsx`, iconos heroicons.
- `academic_history.ts (DAL)` —`«import»` línea punteada flecha abierta→ `session.ts`.
- `academic_history.ts (DAL)` —`«use»` línea punteada flecha→ `Prisma Client`.
- Nota (rectángulo borde punteado): texto `Reglas CU-07: créditos sólo cuentan materias aprobadas; avance = acumulado / carreraRel.creditosTotales`. Conectada con línea punteada a `page.tsx`.
- Nota: texto `DAL getAcademicHistory(targetStudentId) aplica ownership: isOwner || isStaff (ADMIN | SERVICIOS_ESCOLARES)`. Conectada con línea punteada a `academic_history.ts`.
- Restricción (rombo) anexa a `page.tsx`: texto `{historial debe incluir aprobadas Y reprobadas Y en curso}`. Línea sólida al rectángulo.
- Comentario externo: texto `Descarga PDF NO implementada en rama actual («future»)`. Rectángulo de borde punteado, sin flecha, anexo al paquete `app/(dashboard)/alumno/historial`.
