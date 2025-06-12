import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define las rutas que serán accesibles públicamente
// NOTA IMPORTANTE: "/app" NO está aquí, lo que significa que estará protegida por defecto.
const isPublicRoute = createRouteMatcher([
  "/", // Página de inicio (landing page)
  "/sign-in(.*)", // Páginas de inicio de sesión de Clerk
  "/sign-up(.*)", // Páginas de registro de Clerk
  "/api/clerk", // Webhook de Clerk (necesario para que Clerk funcione)
  "/results", // Asumiendo que los resultados pueden ser vistos por invitados si tienen un ID de análisis
  "/recipe/(.*)", // Asumiendo que las recetas pueden ser vistas por invitados
  "/guest(.*)", // Rutas relacionadas con el modo invitado
  "/api/analyze", // Esta API necesita ser pública para el análisis de imágenes en modo invitado
])

// Exporta el middleware de Clerk como la exportación por defecto.
// Esta es la ÚNICA exportación de middleware que debe haber en este archivo.
export default clerkMiddleware(
  (auth, req: NextRequest) => {
    // Aplica encabezados de seguridad a TODAS las respuestas.
    // Esta lógica se ejecuta para CADA solicitud que pasa por el middleware.
    const response = NextResponse.next()
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

    // Protege las rutas que no son explícitamente públicas.
    // Si la ruta NO es pública (ej. "/app"), requiere autenticación.
    if (!isPublicRoute(req)) {
      auth().protect()
    }

    return response // ¡Importante! Asegúrate de devolver la respuesta con los encabezados.
  },
  {
    // Opciones específicas de Clerk
    debug: true, // Útil para depuración, puedes quitarlo en producción.
  },
)

export const config = {
  // Matcher que se asegura que el middleware se ejecute en todas las rutas relevantes.
  // Excluye archivos estáticos y directorios internos de Next.js.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
