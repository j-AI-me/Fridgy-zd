"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Bell, Moon, Shield, Trash2, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { getUserMetadata, updateUserMetadata } from "@/lib/user-profile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [saveHistory, setSaveHistory] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }

    // Cargar preferencias del usuario
    const loadUserPreferences = async () => {
      try {
        const metadata = await getUserMetadata()

        if (metadata.notificationPreferences) {
          setNotifications(metadata.notificationPreferences.push || true)
          setEmailNotifications(metadata.notificationPreferences.email || false)
        }

        setSaveHistory(metadata.saveHistory !== false) // Por defecto true
        setIsLoading(false)
      } catch (error) {
        console.error("Error al cargar preferencias:", error)
        setIsLoading(false)
      }
    }

    if (user) {
      loadUserPreferences()
    }
  }, [user, isLoaded, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // En una implementación real, eliminarías la cuenta del usuario
      // await user.delete()

      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada correctamente.",
      })

      // Redirigir al usuario a la página de inicio
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const updateNotificationPreferences = async (type: "push" | "email", value: boolean) => {
    try {
      if (type === "push") {
        setNotifications(value)
      } else {
        setEmailNotifications(value)
      }

      await updateUserMetadata({
        notificationPreferences: {
          push: type === "push" ? value : notifications,
          email: type === "email" ? value : emailNotifications,
        },
      })

      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias de notificación se han actualizado.",
      })
    } catch (error) {
      console.error("Error al actualizar preferencias:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las preferencias.",
        variant: "destructive",
      })
    }
  }

  const updateSaveHistory = async (value: boolean) => {
    try {
      setSaveHistory(value)

      await updateUserMetadata({
        saveHistory: value,
      })

      toast({
        title: "Preferencias actualizadas",
        description: "Tu preferencia de historial se ha actualizado.",
      })
    } catch (error) {
      console.error("Error al actualizar preferencia de historial:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la preferencia de historial.",
        variant: "destructive",
      })
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-2 text-sm text-muted-foreground">Cargando configuración...</p>
      </div>
    )
  }

  // Si no hay usuario, redirigir a la página de inicio de sesión
  if (!user) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-background to-muted/50">
      <header className="sticky top-0 z-10 bg-background border-b border-border h-14 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/app")}
            className="mr-2 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Configuración</h1>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Sección de notificaciones */}
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Notificaciones
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="font-medium">
                    Notificaciones push
                  </Label>
                  <p className="text-sm text-muted-foreground">Recibe alertas sobre nuevas recetas</p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={(value) => updateNotificationPreferences("push", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">
                    Notificaciones por email
                  </Label>
                  <p className="text-sm text-muted-foreground">Recibe un resumen semanal de recetas</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(value) => updateNotificationPreferences("email", value)}
                />
              </div>
            </div>
          </div>

          {/* Sección de apariencia */}
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Moon className="h-5 w-5 mr-2 text-primary" />
              Apariencia
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">
                    Tema
                  </Label>
                  <p className="text-sm text-muted-foreground">Cambia la apariencia de la aplicación</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Sección de privacidad */}
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Privacidad
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="save-history" className="font-medium">
                    Guardar historial
                  </Label>
                  <p className="text-sm text-muted-foreground">Almacenar análisis de nevera y recetas</p>
                </div>
                <Switch id="save-history" checked={saveHistory} onCheckedChange={updateSaveHistory} />
              </div>
            </div>
          </div>

          {/* Sección de cuenta */}
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <h2 className="text-lg font-medium mb-4">Cuenta</h2>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar cuenta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta y todos tus datos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>Eliminar cuenta</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
