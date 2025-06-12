"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { secureRetrieve } from "@/lib/secure-storage"

export function GuestModeBanner() {
  const [remainingRequests, setRemainingRequests] = useState<number>(3)
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Cargar el número de solicitudes restantes
    const guestData = secureRetrieve("guest_mode") || { remainingRequests: 3 }
    setRemainingRequests(guestData.remainingRequests)
  }, [])

  const handleSignIn = () => {
    router.push("/sign-in")
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">Modo invitado</h3>
          <p className="text-sm text-amber-700 mt-1">
            Tienes <span className="font-bold">{remainingRequests}</span> análisis gratuitos restantes. Regístrate para
            obtener análisis ilimitados y guardar tus recetas favoritas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={handleSignIn} className="bg-amber-600 hover:bg-amber-700">
              Iniciar sesión
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss} className="border-amber-300 text-amber-700">
              Continuar como invitado
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
