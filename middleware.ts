import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Middleware simplificado que solo añade encabezados de seguridad
export function middleware(request: NextRequest) {
  // Añadir encabezados de seguridad a todas las respuestas
  const response = NextResponse.next()

  // Prevenir clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevenir MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Política de referrer
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

// Configuración de rutas públicas
const publicRoutes = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/analyze",
  "/api/clerk",
  "/results",
  "/recipe/(.*)",
  "/app",
  "/guest(.*)",
])

// Configuración de rutas ignoradas
const ignoredRoutes = createRouteMatcher(["/(api|trpc)(.*)", "/api/analyze", "/api/clerk"])

// Aplicar el middleware de Clerk
export default clerkMiddleware({
  publicRoutes,
  ignoredRoutes,
  debug: true,
})

export const config = {
  // Matcher que excluye archivos estáticos
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
