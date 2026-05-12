# CU-02 — Visualizar Credencial Digital Personal — Guía de Dibujo UML

Archivos reales del flujo:
- Página: `app/(dashboard)/credencial/page.tsx`
- Componente cliente: `components/credential/CredentialCard.tsx`
- DAL: `lib/dal/users.ts` (`obtenerCredencialPropia`)
- Guard: `lib/dal/session.ts` (`getAuthenticatedUser()`)
- Auth: `auth.ts` (NextAuth — `auth()`)
- Result: `lib/contracts/result.ts`
- Librerías cliente: `qrcode.react` (`QRCodeSVG`), `qrcode` (import dinámico para PNG)
- Layout HUD: `components/dashboard/DashboardHero.tsx`, `SectionCard.tsx`

---

## 1. Diagrama de Actividades

Convención: conexiones por defecto = línea continua con flecha al siguiente nodo. Solo se especifica el tipo cuando difiere.

- Círculo negro (inicio).
- Rectángulo redondeado: `Usuario navega a /credencial; page.tsx ejecuta await auth()`.
- Rombo `¿session?.user?.id?`:
  - `[no]` → rectángulo `redirect("/login")` → nodo final.
  - `[sí]` → siguiente.
- Rombo `¿session.user.status === "ACTIVO"?`:
  - `[no]` → rectángulo `Render DashboardHero "Credencial no disponible" + SectionCard "Estatus inactivo"` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `await obtenerCredencialPropia()` (DAL, server-only, cache()).
- Rombo `¿res.ok?`:
  - `[no]` → rectángulo `Render hero "No se pudo cargar" + error res.error` → nodo final.
  - `[sí]` → siguiente.
- Rombo `¿tieneCredencial?`:
  - `[no]` → rectángulo `Render "Aún no tienes una credencial"` → nodo final.
  - `[sí]` → siguiente.
- Rombo `¿credencialActiva && qrData?`:
  - `[no]` → rectángulo `Render "Credencial revocada"` → nodo final.
  - `[sí]` → siguiente.
- Rectángulo: `Render <CredentialCard qrData nombre matricula expiresAt /> → QRCodeSVG renderiza SVG → Usuario presenta QR en punto de validación`.

Flujo alternativo (descarga PNG) — región opcional desde "QRCodeSVG renderiza SVG":
- Barra gruesa (fork) → rectángulo `Click "Descargar PNG" → Dynamic import("qrcode") → QRCode.toDataURL(qrData) → dataURL`.
- Rombo `¿toDataURL ok?`:
  - `[no]` → rectángulo `Mostrar "Reintentar" (renderKey++)` → vuelta al rectángulo "Click Descargar PNG".
  - `[sí]` → rectángulo `<a download="credencial.png" href=dataURL>.click()`.
- Barra gruesa (join) → nodo final (círculo blanco con negro concéntrico).

Pistas (swimlanes verticales) para particionar el diagrama:
- Pista `Usuario (Alumno/Profesor/...)` contiene: nodo inicial, "Usuario navega a /credencial", "Usuario presenta QR en punto de validación", "Click Descargar PNG".
- Pista `Page (credencial/page.tsx)` (Server Component) contiene: `await auth()`, rombos `¿session?.user?.id?`, `¿status === "ACTIVO"?`, `¿res.ok?`, `¿tieneCredencial?`, `¿credencialActiva && qrData?`, render condicional de DashboardHero/SectionCard.
- Pista `DAL (lib/dal/users.ts)` contiene: `obtenerCredencialPropia()` (server-only, cache()).
- Pista `Guard (lib/dal/session.ts)` contiene: `getAuthenticatedUser()`.
- Pista `Prisma/PostgreSQL` contiene: `prisma.credential.findUnique({where:{userId:actor.id}})`.
- Pista `Cliente (CredentialCard.tsx)` contiene: `QRCodeSVG renderiza SVG`, `Dynamic import("qrcode")`, `QRCode.toDataURL(qrData)`, rombo `¿toDataURL ok?`, `<a download>.click()`, fallback `Reintentar (renderKey++)`.

---

## 2. Diagrama de Secuencia

Líneas de vida:
- `usuario:Alumno`
- `navegador:Browser`
- `page:credencial/page.tsx`
- `auth:auth.ts`
- `guard:session.ts`
- `dal:users.ts`
- `db:PostgreSQL`
- `card:CredentialCard.tsx`
- `qrSvg:QRCodeSVG (qrcode.react)`
- `qrcodeLib:qrcode (dynamic)`

Mensajes:

1. De `usuario:Alumno` a `navegador:Browser` — línea continua con flecha rellena; texto `GET /credencial`.
2. De `navegador:Browser` a `page:credencial/page.tsx` — línea continua con flecha rellena (diagonal, latencia red `{d<500ms}`); texto `render() server-side`.
3. De `page:credencial/page.tsx` a `auth:auth.ts` — línea continua con flecha rellena; texto `auth()`.
4. De `auth:auth.ts` a `page:credencial/page.tsx` — línea punteada con flecha abierta; texto `session{user:{id,name,matricula,status}}`.
5. Fragmento `alt` (rectángulo); etiqueta `[!session?.user?.id]`. Dentro: de `page` a `navegador` línea punteada con flecha abierta `redirect("/login")`. Cierre.
6. Fragmento `alt` etiqueta `[session.user.status ≠ "ACTIVO"]`. Dentro: de `page` a `navegador` línea punteada con flecha abierta `HTML "Credencial no disponible"`. Cierre.
7. De `page:credencial/page.tsx` a `dal:users.ts` — línea continua con flecha rellena; texto `obtenerCredencialPropia()`.
8. De `dal:users.ts` a `guard:session.ts` — línea continua con flecha rellena; texto `getAuthenticatedUser()`.
9. De `guard:session.ts` a `dal:users.ts` — línea punteada con flecha abierta; texto `{id, role}`.
10. De `dal:users.ts` a `db:PostgreSQL` — línea continua con flecha rellena (diagonal `{T<d+30ms}`); texto `prisma.credential.findUnique({where:{userId:actor.id}, select:{qrData,isActive,expiresAt}})`.
11. De `db:PostgreSQL` a `dal:users.ts` — línea punteada con flecha abierta; texto `cred | null`.
12. De `dal:users.ts` a `page:credencial/page.tsx` — línea punteada con flecha abierta; texto `ok({tieneCredencial, credencialActiva, qrData, expiresAt})`.
13. Fragmento `alt`:
    - `[!res.ok]` → de `page` a `navegador` línea punteada `HTML "No se pudo cargar"`.
    - `[!tieneCredencial]` → de `page` a `navegador` línea punteada `HTML "Aún no tienes credencial"`.
    - `[!credencialActiva || !qrData]` → de `page` a `navegador` línea punteada `HTML "Credencial revocada"`.
    - `[else]` → continúa abajo.
14. De `page:credencial/page.tsx` a `card:CredentialCard.tsx` — línea continua con flecha rellena; texto `props {qrData, nombre, matricula, expiresAt}`.
15. De `card:CredentialCard.tsx` a `qrSvg:QRCodeSVG (qrcode.react)` — línea continua con flecha rellena; texto `<QRCodeSVG value={qrData}/>`.
16. De `qrSvg:QRCodeSVG (qrcode.react)` a `navegador:Browser` — línea punteada con flecha abierta; texto `SVG renderizado en DOM`.
17. Fragmento `opt` etiqueta `[Usuario click "Descargar PNG"]`:
    - De `usuario:Alumno` a `card:CredentialCard.tsx` línea continua con flecha rellena `onClick(descargar)`.
    - De `card:CredentialCard.tsx` a `qrcodeLib:qrcode (dynamic)` línea continua con flecha rellena (diagonal `{d<2s}`) `await import("qrcode")`.
    - De `qrcodeLib:qrcode (dynamic)` a `card:CredentialCard.tsx` línea punteada con flecha abierta `QRCode`.
    - De `card:CredentialCard.tsx` a `qrcodeLib:qrcode (dynamic)` línea continua con flecha rellena `QRCode.toDataURL(qrData)`.
    - De `qrcodeLib:qrcode (dynamic)` a `card:CredentialCard.tsx` línea punteada con flecha abierta `dataURL`.
    - De `card:CredentialCard.tsx` a `navegador:Browser` línea continua con flecha rellena `<a download>.click()`.
    - Fragmento `alt` `[toDataURL throws]`: de `card` a sí misma flecha rellena que vuelve `setRenderKey(k+1)` (mensaje a sí mismo). Cierre.

Mensaje encontrado posible: si la sesión expira justo antes de `obtenerCredencialPropia`, el redirect en `guard:session.ts` interrumpe el flujo → marcar la flecha de retorno de `guard` como flecha rellena de retorno que termina en círculo relleno cuando aplica (mensaje perdido al `page`).

---

## 3. Diagrama de Paquetes

Paquetes (carpetas con solapa):
- `app/(dashboard)/credencial` con rectángulo `page.tsx`.
- `components/credential` con rectángulo `«component» CredentialCard.tsx` (estereotipo).
- `components/dashboard` con rectángulos `DashboardHero.tsx`, `SectionCard.tsx`.
- `lib/dal` con rectángulos `users.ts`, `session.ts`.
- `lib/contracts` con rectángulo `result.ts`.
- Paquete externo `next-auth` con rectángulo `auth()` (raíz `auth.ts`).
- Paquete externo `Prisma Client` con rectángulo `prisma.credential.findUnique`.
- Paquete externo `qrcode.react` con rectángulo `QRCodeSVG`.
- Paquete externo `qrcode` con rectángulo `toDataURL` (carga dinámica).
- Paquete externo `next/navigation` con rectángulos `redirect`, `notFound`.

Relaciones:
- De `page.tsx` a `auth.ts`: línea punteada con flecha abierta hacia `auth.ts`. Etiqueta `«import»`.
- De `page.tsx` a `users.ts`: línea punteada con flecha abierta. Etiqueta `«import obtenerCredencialPropia»`.
- De `page.tsx` a `next/navigation::redirect`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `page.tsx` a `CredentialCard.tsx`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `page.tsx` a `DashboardHero.tsx`, `SectionCard.tsx`: línea punteada con flecha abierta a cada uno. Etiqueta `«import»`.
- De `users.ts` a `session.ts`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `users.ts` a `Prisma Client`: línea punteada con flecha. Etiqueta `«use»` (Dependencia).
- De `users.ts` a `result.ts`: línea punteada con flecha abierta. Etiqueta `«import»`.
- De `CredentialCard.tsx` a `qrcode.react`: línea punteada con flecha. Etiqueta `«use»`.
- De `CredentialCard.tsx` a `qrcode`: línea punteada con flecha. Etiqueta `«use dinámico»`.
- Nota (rectángulo borde punteado): texto `"server-only" — qrData solo cruza Server→Client ya serializado`. Conectada con línea punteada a `users.ts`.
- Nota: texto `Aislamiento IDOR: userId proviene de la sesión, NO de la URL`. Conectada con línea punteada a `page.tsx`.
- Restricción (rombo) anexa a `CredentialCard.tsx`: texto `{no recibe userId; solo qrData firmado}`. Línea sólida del rombo al rectángulo.
