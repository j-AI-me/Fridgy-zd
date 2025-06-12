"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Tipo para los metadatos del usuario
export type UserMetadata = {
  bio?: string
  dietaryPreferences?: string[]
  allergies?: string[]
  notificationPreferences?: {
    email: boolean
    push: boolean
  }
  theme?: "light" | "dark" | "system"
  saveHistory?: boolean
}

// Función para obtener los metadatos del usuario
export async function getUserMetadata(): Promise<UserMetadata> {
  const { userId } = auth()

  if (!userId) {
    return {}
  }

  try {
    const user = await clerkClient.users.getUser(userId)
    return (user.unsafeMetadata as UserMetadata) || {}
  } catch (error) {
    console.error("Error al obtener metadatos del usuario:", error)
    return {}
  }
}

// Función para actualizar los metadatos del usuario
export async function updateUserMetadata(metadata: Partial<UserMetadata>) {
  const { userId } = auth()

  if (!userId) {
    throw new Error("Usuario no autenticado")
  }

  try {
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = (user.unsafeMetadata as UserMetadata) || {}

    // Combinar los metadatos actuales con los nuevos
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
    }

    // Actualizar los metadatos en Clerk
    await clerkClient.users.updateUser(userId, {
      unsafeMetadata: updatedMetadata,
    })

    // Revalidar las rutas que podrían mostrar esta información
    revalidatePath("/profile")
    revalidatePath("/settings")
    revalidatePath("/app")

    return { success: true }
  } catch (error) {
    console.error("Error al actualizar metadatos del usuario:", error)
    return { success: false, error: "No se pudieron actualizar los metadatos" }
  }
}

// Función para actualizar el nombre del usuario
export async function updateUserName(firstName: string, lastName: string) {
  const { userId } = auth()

  if (!userId) {
    throw new Error("Usuario no autenticado")
  }

  try {
    await clerkClient.users.updateUser(userId, {
      firstName,
      lastName,
    })

    // Revalidar las rutas que podrían mostrar esta información
    revalidatePath("/profile")
    revalidatePath("/settings")
    revalidatePath("/app")

    return { success: true }
  } catch (error) {
    console.error("Error al actualizar nombre del usuario:", error)
    return { success: false, error: "No se pudo actualizar el nombre" }
  }
}

// Función para sincronizar los datos del usuario con Supabase
export async function syncUserWithSupabase() {
  const { userId } = auth()

  if (!userId) {
    throw new Error("Usuario no autenticado")
  }

  try {
    const user = await clerkClient.users.getUser(userId)
    const supabase = createServerSupabaseClient()

    // Verificar si el usuario ya existe en Supabase
    const { data: existingUser, error: queryError } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      throw queryError
    }

    const userData = {
      clerk_id: userId,
      email: user.emailAddresses[0]?.emailAddress,
      full_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      avatar_url: user.imageUrl,
      updated_at: new Date().toISOString(),
    }

    if (existingUser) {
      // Actualizar usuario existente
      await supabase.from("profiles").update(userData).eq("clerk_id", userId)
    } else {
      // Crear nuevo usuario
      await supabase.from("profiles").insert(userData)
    }

    return { success: true }
  } catch (error) {
    console.error("Error al sincronizar usuario con Supabase:", error)
    return { success: false, error: "No se pudo sincronizar el usuario" }
  }
}
