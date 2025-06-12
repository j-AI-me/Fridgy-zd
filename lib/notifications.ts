"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Tipos para las notificaciones
export type NotificationType = "system" | "recipe" | "analysis" | "shopping_list"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  link?: string
  read: boolean
  created_at: string
  user_id: string
}

// Función para crear una nueva notificación
export async function createNotification({
  title,
  message,
  type,
  link,
}: {
  title: string
  message: string
  type: NotificationType
  link?: string
}) {
  console.log("🔔 Creando notificación:", title)

  const { userId } = auth()

  if (!userId) {
    console.error("❌ Usuario no autenticado")
    throw new Error("Usuario no autenticado")
  }

  try {
    console.log("🔌 Creando cliente de Supabase")
    const supabase = createServerSupabaseClient()

    // Obtener el ID del perfil del usuario
    console.log("🔍 Obteniendo perfil del usuario:", userId)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error al obtener perfil:", profileError)
      throw profileError
    }

    console.log("✅ Perfil obtenido:", profile.id)

    // Crear la notificación
    console.log("➕ Creando notificación para usuario:", profile.id)
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: profile.id,
        title,
        message,
        type,
        link,
        read: false,
      })
      .select()
      .single()

    if (notificationError) {
      console.error("❌ Error al crear notificación:", notificationError)
      throw notificationError
    }

    console.log("✅ Notificación creada correctamente:", notification.id)

    revalidatePath("/app")
    revalidatePath("/profile")

    return { success: true, notification }
  } catch (error) {
    console.error("❌ Error al crear notificación:", error)
    return { success: false, error: "Error al crear notificación" }
  }
}

// Función para obtener las notificaciones del usuario
export async function getUserNotifications() {
  console.log("🔔 Obteniendo notificaciones del usuario")

  const { userId } = auth()

  if (!userId) {
    console.error("❌ Usuario no autenticado")
    throw new Error("Usuario no autenticado")
  }

  try {
    console.log("🔌 Creando cliente de Supabase")
    const supabase = createServerSupabaseClient()

    // Obtener el ID del perfil del usuario
    console.log("🔍 Obteniendo perfil del usuario:", userId)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error al obtener perfil:", profileError)
      return { success: false, error: "Perfil de usuario no encontrado" }
    }

    console.log("✅ Perfil obtenido:", profile.id)

    // Obtener las notificaciones del usuario ordenadas por fecha (más recientes primero)
    console.log("🔍 Obteniendo notificaciones para usuario:", profile.id)
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error al obtener notificaciones:", error)
      throw error
    }

    console.log("✅ Notificaciones obtenidas:", notifications.length)

    return { success: true, notifications }
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error)
    return { success: false, error: "Error al obtener notificaciones" }
  }
}

// Función para marcar una notificación como leída
export async function markNotificationAsRead(notificationId: string) {
  console.log("🔔 Marcando notificación como leída:", notificationId)

  const { userId } = auth()

  if (!userId) {
    console.error("❌ Usuario no autenticado")
    throw new Error("Usuario no autenticado")
  }

  try {
    console.log("🔌 Creando cliente de Supabase")
    const supabase = createServerSupabaseClient()

    // Marcar la notificación como leída
    console.log("✏️ Actualizando notificación:", notificationId)
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    if (error) {
      console.error("❌ Error al marcar notificación como leída:", error)
      throw error
    }

    console.log("✅ Notificación marcada como leída correctamente")

    revalidatePath("/app")
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    console.error("❌ Error al marcar notificación como leída:", error)
    return { success: false, error: "Error al marcar notificación como leída" }
  }
}

// Función para marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead() {
  console.log("🔔 Marcando todas las notificaciones como leídas")

  const { userId } = auth()

  if (!userId) {
    console.error("❌ Usuario no autenticado")
    throw new Error("Usuario no autenticado")
  }

  try {
    console.log("🔌 Creando cliente de Supabase")
    const supabase = createServerSupabaseClient()

    // Obtener el ID del perfil del usuario
    console.log("🔍 Obteniendo perfil del usuario:", userId)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error al obtener perfil:", profileError)
      throw profileError
    }

    console.log("✅ Perfil obtenido:", profile.id)

    // Marcar todas las notificaciones como leídas
    console.log("✏️ Actualizando notificaciones para usuario:", profile.id)
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", profile.id)
      .eq("read", false)

    if (error) {
      console.error("❌ Error al marcar notificaciones como leídas:", error)
      throw error
    }

    console.log("✅ Notificaciones marcadas como leídas correctamente")

    revalidatePath("/app")
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    console.error("❌ Error al marcar notificaciones como leídas:", error)
    return { success: false, error: "Error al marcar notificaciones como leídas" }
  }
}

// Función para eliminar una notificación
export async function deleteNotification(notificationId: string) {
  console.log("🔔 Eliminando notificación:", notificationId)

  const { userId } = auth()

  if (!userId) {
    console.error("❌ Usuario no autenticado")
    throw new Error("Usuario no autenticado")
  }

  try {
    console.log("🔌 Creando cliente de Supabase")
    const supabase = createServerSupabaseClient()

    // Eliminar la notificación
    console.log("🗑️ Eliminando notificación:", notificationId)
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("❌ Error al eliminar notificación:", error)
      throw error
    }

    console.log("✅ Notificación eliminada correctamente")

    revalidatePath("/app")
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    console.error("❌ Error al eliminar notificación:", error)
    return { success: false, error: "Error al eliminar notificación" }
  }
}
