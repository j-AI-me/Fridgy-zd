"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/notifications"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Check, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationsList() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const result = await getUserNotifications()
        if (result.success) {
          setNotifications(result.notifications)
          setFilteredNotifications(result.notifications)
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  useEffect(() => {
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = notifications.filter(
        (notification) =>
          notification.title.toLowerCase().includes(term) || notification.message.toLowerCase().includes(term),
      )
      setFilteredNotifications(filtered)
    } else {
      setFilteredNotifications(notifications)
    }
  }, [searchTerm, notifications])

  const handleNotificationClick = async (notification: any) => {
    try {
      // Marcar como leída
      await markNotificationAsRead(notification.id)

      // Actualizar estado local
      setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      setFilteredNotifications(filteredNotifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))

      // Navegar al enlace si existe
      if (notification.link) {
        router.push(notification.link)
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()

      // Actualizar estado local
      const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))
      setNotifications(updatedNotifications)
      setFilteredNotifications(updatedNotifications)

      toast({
        title: "Notificaciones leídas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      })
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)

      // Actualizar estado local
      const updatedNotifications = notifications.filter((n) => n.id !== notificationId)
      setNotifications(updatedNotifications)
      setFilteredNotifications(filteredNotifications.filter((n) => n.id !== notificationId))

      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "recipe":
        return "🍳"
      case "analysis":
        return "📸"
      case "shopping_list":
        return "🛒"
      default:
        return "ℹ️"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
  }

  const hasUnreadNotifications = notifications.some((n) => !n.read)

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar notificaciones..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasUnreadNotifications && (
          <Button variant="outline" size="sm" className="ml-2" onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-4xl mb-4">📬</div>
            <p className="text-muted-foreground">No tienes notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-sm transition-shadow ${
                !notification.read ? "border-l-4 border-l-primary" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className={`text-base ${!notification.read ? "font-semibold" : ""}`}>
                        {notification.title}
                      </CardTitle>
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
