import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define las rutas que serán accesibles públicamente
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk", // Webhook de Clerk
])

// Define las rutas que el middleware debe ignorar (ej. archivos estáticos)
const ignoredRoutes = createRouteMatcher(["/favicon.ico", "/api/analyze"])

export default clerkMiddleware((auth, req) => {
  // Si la ruta no es pública, la protegemos
  if (!isPublicRoute(req) && !ignoredRoutes(req)) {
    auth().protect()
  }
})

export const config = {
  // Matcher que se asegura que el middleware se ejecute en todas las rutas relevantes
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
