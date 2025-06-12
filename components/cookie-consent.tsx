"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { secureStore, secureRetrieve } from "@/lib/secure-storage"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya ha dado su consentimiento
    const hasConsented = secureRetrieve("cookie_consent")

    // Mostrar el banner si no ha dado consentimiento
    if (!hasConsented) {
      // Pequeño retraso para no mostrar inmediatamente al cargar la página
      const timer = setTimeout(() => {
        setShowConsent(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  const acceptCookies = () => {
    secureStore("cookie_consent", { accepted: true, date: new Date().toISOString() })
    setShowConsent(false)
  }

  const declineCookies = () => {
    secureStore("cookie_consent", { accepted: false, date: new Date().toISOString() })
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto">
        <h3 className="font-medium mb-2">🍪 Uso de Cookies</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Utilizamos cookies para mejorar tu experiencia en nuestra aplicación. Estas nos permiten recordar tus
          preferencias y analizar cómo utilizas nuestra app.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={declineCookies}>
            Rechazar
          </Button>
          <Button size="sm" onClick={acceptCookies}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  )
}
