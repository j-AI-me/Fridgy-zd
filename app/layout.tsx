import type React from "react"
import { ThemeProvider } from "@/contexts/theme-context"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { CookieConsent } from "@/components/cookie-consent"
import { ClerkProvider } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-config"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Fridgy - Recetas con lo que tienes",
  description: "Toma una foto de tu nevera y descubre recetas personalizadas",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("🔍 Renderizando RootLayout")

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ClerkProvider appearance={clerkAppearance}>
          <ThemeProvider defaultTheme="light">
            <main className="flex flex-col min-h-[100dvh] max-w-md mx-auto bg-background relative">{children}</main>
            <Toaster />
            <CookieConsent />
          </ThemeProvider>
        </ClerkProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log("🌐 Documento cargado completamente");
              console.log("📱 Dimensiones de la ventana:", window.innerWidth, "x", window.innerHeight);
              console.log("🔍 User Agent:", navigator.userAgent);
            `,
          }}
        />
      </body>
    </html>
  )
}
