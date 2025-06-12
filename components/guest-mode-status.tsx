"use client"

import { useEffect, useState } from "react"
import { getGuestModeData } from "@/lib/guest-mode"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function GuestModeStatus() {
  const [remainingRequests, setRemainingRequests] = useState<number>(3)
  const router = useRouter()

  useEffect(() => {
    // Cargar el número de solicitudes restantes
    const guestData = getGuestModeData()
    setRemainingRequests(guestData.remainingRequests)
  }, [])

  const handleSignIn = () => {
    router.push("/sign-in")
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">Modo invitado</h3>
          <p className="text-sm text-amber-700 mt-1">
            Tienes <span className="font-bold">{remainingRequests}</span> análisis gratuitos restantes. Regístrate para
            obtener análisis ilimitados y guardar tus recetas favoritas.
          </p>
          <div className="mt-3">
            <Button size="sm" onClick={handleSignIn} className="bg-amber-600 hover:bg-amber-700">
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
