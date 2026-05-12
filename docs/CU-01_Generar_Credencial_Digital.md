# CU-01 — Generar Credencial Digital — Guía de Dibujo UML

Archivos reales del flujo (repo):
- Vista: `app/(dashboard)/admin/usuarios/nuevo/page.tsx`
- Form cliente: `app/(dashboard)/admin/usuarios/nuevo/form.tsx`
- Server Action: `app/(dashboard)/admin/usuarios/actions.ts` (`crearUsuarioConCredencial`)
- DAL: `lib/dal/users.ts` (`crearUsuarioConCredencial`, `mapPrismaError`)
- Validador: `lib/dal/users.validators.ts` (`validarCampos`)
- Servicio QR: `lib/services/credential/qr.ts` (`generarQrData`)
- Auditoría: `lib/services/audit/notify.ts` (`notifyUser`)
- Guard: `lib/dal/session.ts` (`getAuthenticatedUser(["ADMIN","COORDINADOR"])`)
- ORM: Prisma `tx.user.create`, `tx.credential.create` (en `$transaction`)
- Revalidate: `revalidatePath("/admin/usuarios")`

---

## 1. Diagrama de Actividades

Convención: conexiones por defecto = línea continua con flecha al siguiente nodo. Solo se especifica el tipo cuando difiere.

- Círculo negro (inicio).
- Rectángulo redondeado: `Admin abre /admin/usuarios/nuevo y captura matrícula, nombre, apellidos, email, password, carrera, rol`.
- Rectángulo redondeado: `Sanitizar en cliente (onlyDigits, onlyLetters, onlyEmailLocal) y click "Registrar y generar QR" → Server Action crearUsuarioConCredencial`.
- Rombo `¿Sesión y rol ∈ {ADMIN, COORDINADOR}?`:
  - `[no]` → rectángulo `redirect("/login" | "/")` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `validarCampos(input) — datos completos + rol asignado`.
- Rombo `¿val.ok?`:
  - `[no]` → rectángulo `return err(val.mensaje, val.code) + feedback "error" en form` → nodo final.
  - `[sí]` → siguiente.
- Barra gruesa (fork) → dos actividades concurrentes:
  - Rectángulo: `bcrypt.hash(password, 10)`.
  - Rectángulo: `trim + email.toLowerCase`.
- Barra gruesa (join) → rectángulo: `prisma.$transaction inicio`.
- Rectángulo: `tx.user.create({matricula, nombre, apellidos, email, passwordHash, carrera, role}) → user.id`.
- Rectángulo: `generarQrData(user.id) → "<userId>.<hmac SHA-256>"`.
- Rectángulo: `tx.credential.create({userId, qrData, isActive:true})`.
- Rombo `¿catch P2002 unique?`:
  - `[target=email]` → rectángulo `err("Email duplicado","DUPLICATE_EMAIL")` → final.
  - `[target=matricula]` → rectángulo `err("Matrícula duplicada","DUPLICATE_MATRICULA")` → final.
  - `[target=userId]` → rectángulo `err("Credencial activa existente","DUPLICATE_CREDENTIAL")` → final.
  - `[no]` → siguiente.
- Rectángulo: `notifyUser(actor.id, "Credencial generada", mensaje)` (auditoría, no bloquea).
- Rectángulo con lado saliente convexo (evento emitido): `revalidatePath("/admin/usuarios")`.
- Rectángulo: `return ok({userId, credentialId, qrData}) + setFeedback success + router.push("/admin/usuarios")`.
- Nodo final (círculo blanco con negro concéntrico).

Pistas (swimlanes verticales) opcionales para particionar:
- Pista `Administrador` contiene: nodo inicial, capturar datos, click registrar.
- Pista `Cliente (form.tsx)` contiene: sanitizar, startTransition.
- Pista `Server Action (actions.ts)` contiene: invocación DAL, revalidatePath.
- Pista `DAL (lib/dal/users.ts)` contiene: guard, validarCampos, transacción, mapPrismaError.
- Pista `Servicio QR (qr.ts)` contiene: generarQrData (HMAC-SHA256).
- Pista `Prisma/PostgreSQL` contiene: tx.user.create, tx.credential.create.

---

## 2. Diagrama de Secuencia

Líneas de vida (rectángulos verticales arriba, texto exacto):
- `admin:Administrador`
- `vista:form.tsx`
- `accion:actions.ts`
- `dal:users.ts`
- `guard:session.ts`
- `validador:users.validators.ts`
- `qrSvc:qr.ts`
- `tx:prisma.$transaction`
- `db:PostgreSQL`
- `audit:notify.ts`

Mensajes (de arriba hacia abajo):

1. De `admin:Administrador` a `vista:form.tsx` — línea continua con flecha rellena; texto `onSubmit(state)`.
2. De `vista:form.tsx` a sí misma — línea continua con flecha rellena que vuelve; texto `sanitize (onlyDigits, onlyLetters, onlyEmailLocal)`.
3. De `vista:form.tsx` a `accion:actions.ts` — línea continua con flecha rellena; texto `crearUsuarioConCredencial(input)`. (Diagonal con duración `{d<5s}` por requerimiento "≤5s" del CU.)
4. De `accion:actions.ts` a `dal:users.ts` — línea continua con flecha rellena; texto `crearUsuarioConCredencialDAL(input)`.
5. De `dal:users.ts` a `guard:session.ts` — línea continua con flecha rellena; texto `getAuthenticatedUser(["ADMIN","COORDINADOR"])`.
6. De `guard:session.ts` a `dal:users.ts` — línea punteada con flecha abierta (retorno); texto `actor:{id, role}`.
7. De `dal:users.ts` a `validador:users.validators.ts` — línea continua con flecha rellena; texto `validarCampos(input)`.
8. De `validador:users.validators.ts` a `dal:users.ts` — línea punteada con flecha abierta; texto `{ok:true} | {ok:false, mensaje, code}`.
9. Fragmento `alt` (rectángulo etiquetado): condición `[!val.ok]`. Dentro: de `dal:users.ts` a `accion:actions.ts` línea punteada con flecha abierta `err(mensaje, code)`. De `accion:actions.ts` a `vista:form.tsx` línea punteada con flecha abierta `Result.err`. Fin del fragmento.
10. De `dal:users.ts` a sí misma — flecha rellena que vuelve; texto `bcrypt.hash(password, 10) → passwordHash`.
11. De `dal:users.ts` a `tx:prisma.$transaction` — línea continua con flecha rellena; texto `$transaction(async tx ⇒ {...})`.
12. De `tx:prisma.$transaction` a `db:PostgreSQL` — línea continua con flecha rellena (diagonal, latencia DB `{T<d+50ms}`); texto `tx.user.create({...}) → user.id`.
13. De `db:PostgreSQL` a `tx:prisma.$transaction` — línea punteada con flecha abierta; texto `user{id}`.
14. De `tx:prisma.$transaction` a `qrSvc:qr.ts` — línea continua con flecha rellena; texto `generarQrData(user.id)`.
15. De `qrSvc:qr.ts` a `tx:prisma.$transaction` — línea punteada con flecha abierta; texto `"<userId>.<hmac>"`.
16. De `tx:prisma.$transaction` a `db:PostgreSQL` — línea continua con flecha rellena (diagonal); texto `tx.credential.create({userId, qrData, isActive:true})`.
17. De `db:PostgreSQL` a `tx:prisma.$transaction` — línea punteada con flecha abierta; texto `credential{id}`.
18. Fragmento `alt` etiquetado `[Excepción P2002]`. De `db:PostgreSQL` a `tx:prisma.$transaction` línea punteada con flecha abierta `throw PrismaClientKnownRequestError(code:P2002)`. De `tx:prisma.$transaction` a `dal:users.ts` línea punteada con flecha abierta. De `dal:users.ts` a `accion:actions.ts` línea punteada con flecha abierta `err("Email|Matrícula|Credencial duplicada", code)`. Fin del fragmento.
19. De `tx:prisma.$transaction` a `dal:users.ts` — línea punteada con flecha abierta; texto `{userId, credentialId, qrData}`.
20. De `dal:users.ts` a `audit:notify.ts` — línea continua con flecha rellena; texto `notifyUser(actor.id, "Credencial generada", ...)` (best-effort).
21. De `audit:notify.ts` a `dal:users.ts` — línea punteada con flecha abierta; texto `void`.
22. De `dal:users.ts` a `accion:actions.ts` — línea punteada con flecha abierta; texto `ok({userId, credentialId, qrData})`.
23. De `accion:actions.ts` a sí misma — flecha rellena que vuelve; texto `revalidatePath("/admin/usuarios")`.
24. De `accion:actions.ts` a `vista:form.tsx` — línea punteada con flecha abierta; texto `Result.ok`.
25. De `vista:form.tsx` a `admin:Administrador` — línea punteada con flecha abierta; texto `feedback "Credencial generada" + router.push("/admin/usuarios")`.

Si `notifyUser` falla: mensaje perdido — línea continua con flecha y círculo relleno al final desde `dal:users.ts` (NO se revierte la transacción; queda solo en log).

---

## 3. Diagrama de Paquetes

Carpetas/rectángulos (paquetes):
- Paquete `app/(dashboard)/admin/usuarios/nuevo` (carpeta con solapa). Dentro:
  - Rectángulo `page.tsx` (Server Component).
  - Rectángulo `form.tsx` con estereotipo `«component»` arriba (Client Component).
- Paquete `app/(dashboard)/admin/usuarios`. Dentro:
  - Rectángulo `actions.ts` (Server Actions).
- Paquete `lib/dal`. Dentro:
  - Rectángulo `users.ts`.
  - Rectángulo `session.ts`.
  - Rectángulo `users.validators.ts`.
- Paquete `lib/services`. Dentro:
  - Rectángulo `credential/qr.ts`.
  - Rectángulo `audit/notify.ts`.
- Paquete `lib/contracts` con rectángulo `result.ts` (`Result<T>`).
- Paquete externo `next-auth` con rectángulo `auth()`.
- Paquete externo `Prisma Client` (carpeta con solapa) con rectángulo `prisma.$transaction`.
- Paquete externo `bcryptjs` con rectángulo `bcrypt.hash`.
- Paquete externo `Next.js 16` (carpeta con solapa) con rectángulo `revalidatePath`.

Relaciones (especificación exacta):
- De `form.tsx` a `actions.ts`: línea punteada con flecha abierta apuntando a `actions.ts`. Etiqueta `«import»`. (Importación.)
- De `actions.ts` a `users.ts`: línea punteada con flecha abierta apuntando a `users.ts`. Etiqueta `«import»`.
- De `actions.ts` a `Next.js 16::revalidatePath`: línea punteada con flecha apuntando a `revalidatePath`. Etiqueta `«use»` (Dependencia).
- De `users.ts` a `session.ts`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `users.ts` a `users.validators.ts`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `users.ts` a `qr.ts`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `users.ts` a `notify.ts`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `users.ts` a `result.ts`: línea punteada con flecha abierta. Etiqueta `«import»` (usa `Result<T>`).
- De `users.ts` a `Prisma Client`: línea punteada con flecha (dependencia). Etiqueta `«use»`.
- De `qr.ts` a `bcryptjs`: NO existe (no usar). En su lugar: de `qr.ts` a paquete externo `node:crypto` (rectángulo) con línea punteada y flecha, etiqueta `«use»`.
- De `users.ts` a `bcryptjs`: línea punteada con flecha. Etiqueta `«use»`.
- De `session.ts` a `next-auth::auth()`: línea punteada con flecha. Etiqueta `«use»`.
- Nota (rectángulo de borde punteado) sobre `users.ts`: texto `server-only: build rompe si se importa desde Client Component`. Conectada al rectángulo `users.ts` con línea punteada (sin flecha).
- Nota (rectángulo de borde punteado) sobre `qr.ts`: texto `Requiere process.env.QR_SECRET (≥16 chars). Falla cerrado.`. Conectada con línea punteada al rectángulo `qr.ts`.
- Restricción (rombo) anexada a `users.ts`: texto `{transacción atómica: user + credential}`. Línea sólida desde el rombo al rectángulo `users.ts`.
