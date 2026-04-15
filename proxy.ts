import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { UserRole } from "./lib/generated/prisma/client";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  // Se extrae el estado de la sesión, inyectado automáticamente por la envoltura "auth"
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // 1. EXCEPCIÓN DE RUTAS DE AUTENTICACIÓN
  // Se excluyen explícitamente las rutas de /api/auth/ para que nunca sean interceptadas
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 2. MANEJO DEL FLUJO SIN SESIÓN
  // Si no existe un usuario logueado y se intenta acceder a una ruta protegida (cualquiera que no sea /login)
  if (!isLoggedIn) {
    if (pathname !== "/login") {
      const loginUrl = new URL("/login", nextUrl);
      return NextResponse.redirect(loginUrl);
    }
    // Si no hay sesión pero se está accediendo a /login, se permite el flujo
    return NextResponse.next();
  }

  // determinar la ruta del dashboard correspondiente al rol del usuario
  const getDashboardUrl = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.COORDINADOR:
        return "/admin";
      case UserRole.BIBLIOTECA:
        return "/biblioteca";
      case UserRole.SERVICIOS_ESCOLARES:
        return "/servicios-escolares";
      case UserRole.PROFESOR:
        return "/profesor";
      case UserRole.ALUMNO:
        return "/alumno";
      case UserRole.DIRECTOR:
        return "/director";
      case UserRole.PERSONAL_OPERATIVO:
        return "/personal-operativo";
      default:
        return "/";
    }
  };

  // 3. MANEJO DEL FLUJO CON SESIÓN
  // Si el usuario ya está autenticado e intenta acceder nuevamente a la vista de login
  if (pathname === "/login") {
    const dashboardUrl = new URL(getDashboardUrl(userRole), nextUrl);
    return NextResponse.redirect(dashboardUrl);
  }

  // 4. PROTECCIÓN DE RUTAS POR ROL (AUTORIZACIÓN)
  
  // Se restringe el acceso a las rutas /admin/** exclusivamente para administradores y coordinadores
  if (pathname.startsWith("/admin")) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.COORDINADOR) {
      return NextResponse.redirect(new URL(getDashboardUrl(userRole), nextUrl));
    }
  }

  // Se restringe el acceso a las rutas /biblioteca/** exclusivamente para personal de biblioteca
  if (pathname.startsWith("/biblioteca")) {
    if (userRole !== UserRole.BIBLIOTECA) {
      return NextResponse.redirect(new URL(getDashboardUrl(userRole), nextUrl));
    }
  }

  // Se restringe el acceso a las rutas /servicios-escolares/** exclusivamente para servicios escolares
  if (pathname.startsWith("/servicios-escolares")) {
    if (userRole !== UserRole.SERVICIOS_ESCOLARES) {
      return NextResponse.redirect(new URL(getDashboardUrl(userRole), nextUrl));
    }
  }

  // Se restringe el acceso a las rutas /director/** exclusivamente para dirección
  if (pathname.startsWith("/director")) {
    if (userRole !== UserRole.DIRECTOR) {
      return NextResponse.redirect(new URL(getDashboardUrl(userRole), nextUrl));
    }
  }

  // Se restringe el acceso a las rutas /personal-operativo/** exclusivamente para personal operativo
  if (pathname.startsWith("/personal-operativo")) {
    if (userRole !== UserRole.PERSONAL_OPERATIVO) {
      return NextResponse.redirect(new URL(getDashboardUrl(userRole), nextUrl));
    }
  }

  // Si todas las validaciones son exitosas y el rol corresponde con la ruta, se continúa la petición original
  return NextResponse.next();
});

// 5. CONFIGURACIÓN DEL MATCHER
// Se excluyen los archivos estáticos y recursos visuales para que nunca pasen por la capa del proxy
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};