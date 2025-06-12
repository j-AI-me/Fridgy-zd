"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera, ChefHat, RefrigeratorIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { PrivacyPolicy } from "@/components/privacy-policy"

export function WelcomePage() {
  console.log("🔍 Renderizando WelcomePage")
  const router = useRouter()
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      title: "Bienvenido a Fridgy",
      description: "Descubre recetas deliciosas con los ingredientes que ya tienes en tu nevera",
      icon: <RefrigeratorIcon className="h-16 w-16 text-primary mb-4" />,
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
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-white to-green-50">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <RefrigeratorIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold">Fridgy</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogin}>
          Iniciar sesión
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md mx-auto">
          {/* Carousel */}
          <div className="mb-8">
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

          {/* CTA */}
          <div className="space-y-4">
            <Button className="w-full relative overflow-hidden group" size="lg" onClick={handleGetStarted}>
              <span className="relative z-10 flex items-center">
                Comenzar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <button className="text-primary cursor-pointer hover:underline" onClick={handleLogin}>
                Iniciar sesión
              </button>
            </p>
            <div className="pt-2">
              <Button variant="ghost" className="w-full" onClick={handleGuestMode}>
                Continuar como invitado
                <span className="text-xs ml-2 text-muted-foreground">(3 análisis gratis)</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Fridgy. Todos los derechos reservados.</p>
        <div className="mt-2">
          <PrivacyPolicy />
        </div>
      </footer>
    </div>
  )
}
