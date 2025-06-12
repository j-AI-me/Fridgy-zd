"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  // Solo cargar notificaciones si el usuario está autenticado
  const fetchNotifications = async () => {
    if (!isSignedIn || !isLoaded) {
      setNotifications([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Por ahora, usar datos de ejemplo hasta que implementemos las notificaciones reales
      const mockNotifications = [
        {
          id: "1",
          title: "Bienvenido a Fridgy",
          message: "¡Gracias por unirte! Empieza analizando tu nevera.",
          read: false,
          created_at: new Date().toISOString(),
          link: "/app",
        },
      ]

      setNotifications(mockNotifications)
    } catch (err) {
      console.error("Error al obtener notificaciones:", err)
      setNotifications([])
      setError("Error al cargar notificaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchNotifications()
    }
  }, [isSignedIn, isLoaded])

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
    }

    setOpen(false)
  }

  // Si el usuario no está autenticado, no mostrar el botón
  if (!isSignedIn || !isLoaded) {
    return null
  }

  // Filtrar notificaciones no leídas de forma segura
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer border-b p-3 hover:bg-muted ${!notification.read ? "bg-muted/50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Link
            href="/profile?tab=notifications"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
