"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js" // Usar createClient directamente para Supabase
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

// Función para crear cliente de Supabase para el servidor (usada internamente)
function createServerSupabaseClientInternal() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Usar SERVICE_ROLE_KEY para operaciones de admin

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Variables de entorno de Supabase (URL o SERVICE_ROLE_KEY) no configuradas para createServerSupabaseClientInternal",
    )
    throw new Error("Variables de entorno de Supabase no configuradas para operaciones de servidor.")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// Función para obtener los metadatos del usuario desde Clerk
export async function getUserMetadata(): Promise<UserMetadata> {
  console.log("[USER_PROFILE] Obteniendo metadatos del usuario desde Clerk...")
  try {
    const { userId } = auth()

    if (!userId) {
      console.log("[USER_PROFILE] Usuario no autenticado, devolviendo metadatos vacíos.")
      return {
        dietaryPreferences: [],
        allergies: [],
        notificationPreferences: { email: true, push: true },
        theme: "system",
        saveHistory: true,
      }
    }

    const user = await clerkClient.users.getUser(userId)
    const metadata = (user.publicMetadata as UserMetadata) || {} // Usar publicMetadata para datos no sensibles

    console.log("[USER_PROFILE] Metadatos obtenidos de Clerk:", metadata)
    // Asegurar que siempre devolvemos arrays y valores por defecto
    return {
      bio: metadata.bio || "",
      dietaryPreferences: metadata.dietaryPreferences || [],
      allergies: metadata.allergies || [],
      notificationPreferences: metadata.notificationPreferences || { email: true, push: true },
      theme: metadata.theme || "system",
      saveHistory: typeof metadata.saveHistory === "boolean" ? metadata.saveHistory : true,
    }
  } catch (error) {
    console.error("[USER_PROFILE] Error al obtener metadatos del usuario de Clerk:", error)
    return {
      // Devolver valores por defecto en caso de error
      dietaryPreferences: [],
      allergies: [],
      notificationPreferences: { email: true, push: true },
      theme: "system",
      saveHistory: true,
    }
  }
}

// Función para actualizar los metadatos del usuario en Clerk
export async function updateUserMetadata(metadata: Partial<UserMetadata>) {
  console.log("[USER_PROFILE] Actualizando metadatos del usuario en Clerk...", metadata)
  try {
    const { userId } = auth()

    if (!userId) {
      console.error("[USER_PROFILE] Usuario no autenticado, no se pueden actualizar metadatos.")
      throw new Error("Usuario no autenticado")
    }

    // Obtener metadatos actuales para fusionar, en lugar de sobrescribir completamente
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = (user.publicMetadata as UserMetadata) || {}

    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata, // Usar publicMetadata
    })

    console.log("[USER_PROFILE] Metadatos actualizados en Clerk exitosamente.")
    revalidatePath("/profile")
    revalidatePath("/settings")
    revalidatePath("/app") // Para que la app refleje cambios como el tema

    return { success: true }
  } catch (error) {
    console.error("[USER_PROFILE] Error al actualizar metadatos del usuario en Clerk:", error)
    return { success: false, error: "No se pudieron actualizar los metadatos del usuario." }
  }
}

// Función para actualizar el nombre del usuario en Clerk
export async function updateUserName(firstName: string, lastName: string) {
  console.log(`[USER_PROFILE] Actualizando nombre del usuario en Clerk: ${firstName} ${lastName}`)
  try {
    const { userId } = auth()

    if (!userId) {
      console.error("[USER_PROFILE] Usuario no autenticado, no se puede actualizar el nombre.")
      throw new Error("Usuario no autenticado")
    }

    await clerkClient.users.updateUser(userId, {
      firstName,
      lastName,
    })

    console.log("[USER_PROFILE] Nombre del usuario actualizado en Clerk exitosamente.")
    // Sincronizar con Supabase después de actualizar en Clerk
    await syncUserWithSupabase(userId)

    revalidatePath("/profile")
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("[USER_PROFILE] Error al actualizar nombre del usuario en Clerk:", error)
    return { success: false, error: "No se pudo actualizar el nombre del usuario." }
  }
}

// Función principal para sincronizar los datos del usuario de Clerk con Supabase
export async function syncUserWithSupabase(clerkUserId?: string) {
  console.log("[USER_PROFILE] Sincronizando perfil de usuario de Clerk con Supabase...")
  try {
    const authResult = await auth()
    const userIdToSync = clerkUserId || authResult?.userId

    if (!userIdToSync) {
      console.log("[USER_PROFILE] Usuario no autenticado o ID no proporcionado, no se puede sincronizar.")
      return { success: false, error: "Usuario no autenticado o ID no proporcionado." }
    }

    const supabase = createServerSupabaseClientInternal()

    // Obtener información del usuario de Clerk
    const user = await clerkClient.users.getUser(userIdToSync)
    if (!user) {
      console.error(`[USER_PROFILE] No se pudo obtener el usuario de Clerk con ID: ${userIdToSync}`)
      return { success: false, error: "No se pudo obtener el usuario de Clerk." }
    }

    const userData = {
      clerk_id: userIdToSync,
      email:
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        `user_${userIdToSync}@example.com`,
      full_name:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || `Usuario ${userIdToSync.slice(-4)}`,
      avatar_url: user.imageUrl,
      updated_at: new Date().toISOString(),
    }

    // Verificar si el usuario ya existe en Supabase (upsert)
    const { data: profileData, error: upsertError } = await supabase
      .from("profiles")
      .upsert(userData, { onConflict: "clerk_id" }) // Upsert basado en clerk_id
      .select("id")
      .single()

    if (upsertError) {
      console.error("[USER_PROFILE] Error al hacer upsert del perfil de usuario en Supabase:", upsertError)
      throw upsertError
    }

    const profileId = profileData?.id

    if (profileId) {
      console.log(
        "[USER_PROFILE] Perfil de usuario sincronizado (creado/actualizado) en Supabase. Profile ID:",
        profileId,
      )
    } else {
      console.error("[USER_PROFILE] Upsert en Supabase no devolvió un ID de perfil.")
      // Esto no debería ocurrir con un upsert exitoso que devuelve 'id'
    }

    return { success: true, profileId }
  } catch (error) {
    console.error("[USER_PROFILE] Error al sincronizar usuario con Supabase:", error)
    return { success: false, error: "No se pudo sincronizar el usuario con Supabase." }
  }
}

// Alias para compatibilidad con código existente que espera 'syncUserProfile'
export async function syncUserProfile(clerkUserId?: string) {
  console.log("[USER_PROFILE] Llamando a syncUserProfile (alias de syncUserWithSupabase)...")
  return syncUserWithSupabase(clerkUserId)
}
