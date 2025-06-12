"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, ChefHat, FolderIcon as Fridge } from "lucide-react"
import { useRouter } from "next/navigation"
import { PrivacyPolicy } from "@/components/privacy-policy"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export function WelcomePage() {
  console.log("🔍 Renderizando WelcomePage")
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      title: "Bienvenido a Fridgy",
      description: "Descubre recetas deliciosas con los ingredientes que ya tienes en tu nevera",
      icon: <Fridge className="h-16 w-16 text-primary mb-4" />,
    },
    {
      title: "Toma una foto",
      description: "Simplemente fotografía el interior de tu nevera y deja que la IA haga el resto",
      icon: <Camera className="h-16 w-16 text-primary mb-4" />,
    },
    {
      title: "Recetas personalizadas",
      description: "Recibe recetas adaptadas a los ingredientes que tienes disponibles",
      icon: <ChefHat className="h-16 w-16 text-primary mb-4" />,
    },
  ]

  const nextSlide = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1)
    }
  }

  const prevSlide = () => {
    if (activeSlide > 0) {
      setActiveSlide(activeSlide - 1)
    }
  }

  const handleLogin = () => {
    console.log("🔑 Botón Iniciar sesión clickeado")
    router.push("/sign-in")
  }

  const handleGetStarted = () => {
    console.log("📝 Botón Comenzar clickeado")
    router.push("/sign-up")
  }

  const handleGuestMode = () => {
    console.log("👤 Botón Modo invitado clickeado")
    router.push("/app")
  }

  console.log("🎨 Renderizando WelcomePage con slide:", activeSlide)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="absolute top-4 right-4">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center">
        <div className="bg-green-100 p-4 rounded-full mb-6">{slides[activeSlide].icon}</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{slides[activeSlide].title}</h1>
        <p className="text-lg text-gray-600 max-w-md mb-8">{slides[activeSlide].description}</p>

        <div className="space-y-4 w-full max-w-xs">
          <SignedIn>
            <Button asChild className="w-full text-lg py-6">
              <Link href="/app">Ir a la aplicación</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <Button asChild className="w-full text-lg py-6" onClick={handleLogin}>
              <Link href="/sign-in">Iniciar Sesión</Link>
            </Button>
            <Button asChild variant="outline" className="w-full text-lg py-6" onClick={handleGetStarted}>
              <Link href="/sign-up">Registrarse</Link>
            </Button>
          </SignedOut>
        </div>

        {/* Carousel */}
        <div className="mb-8 mt-16">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-30 scale-150"></div>
            {slides[activeSlide].icon}
          </div>
          <h2 className="text-2xl font-bold mb-3">{slides[activeSlide].title}</h2>
          <p className="text-muted-foreground mb-6">{slides[activeSlide].description}</p>

          {/* Dots */}
          <div className="flex justify-center space-x-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === activeSlide ? "w-6 bg-primary" : "w-2 bg-gray-300"
                }`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                console.log("⬅️ Botón Anterior clickeado")
                prevSlide()
              }}
              disabled={activeSlide === 0}
              className={activeSlide === 0 ? "invisible" : ""}
            >
              Anterior
            </Button>
            <Button
              onClick={() => {
                console.log("➡️ Botón Siguiente clickeado")
                nextSlide()
              }}
              disabled={activeSlide === slides.length - 1}
              className={activeSlide === slides.length - 1 ? "invisible" : ""}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Fridgy. Todos los derechos reservados.</p>
        <div className="mt-2">
          <PrivacyPolicy />
        </div>
      </footer>
    </div>
  )
}
