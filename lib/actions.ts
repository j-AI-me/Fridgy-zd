"use server"

import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { mockAnalyses, mockFavorites } from "./mock-data"
import { revalidatePath } from "next/cache"

// Función para crear cliente de Supabase
function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Tipo para los resultados del análisis
type AnalysisResult = {
  ingredients: string[]
  recetas: Array<{
    id?: string
    titulo: string
    descripcion: string
    ingredientes: {
      disponibles: string[]
      adicionales: string[]
    }
    preparacion: string[]
    calorias?: number
  }>
}

// Función para sincronizar el perfil del usuario con Supabase
export async function syncUserProfile() {
  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      console.log("Usuario no autenticado, no se puede sincronizar")
      return { success: false, error: "Usuario no autenticado" }
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el perfil ya existe
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (existingProfile) {
      console.log("Perfil ya existe:", existingProfile.id)
      return { success: true, profileId: existingProfile.id }
    }

    // Si no existe, crear uno nuevo
    if (checkError && checkError.code === "PGRST116") {
      console.log("Creando nuevo perfil para usuario:", userId)

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          clerk_id: userId,
          email: `user_${userId}@example.com`,
          full_name: `Usuario ${userId.slice(-4)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError) {
        console.error("Error al crear perfil:", createError)
        return { success: false, error: createError.message }
      }

      console.log("Perfil creado exitosamente:", newProfile.id)
      return { success: true, profileId: newProfile.id }
    }

    console.error("Error al verificar perfil:", checkError)
    return { success: false, error: checkError?.message || "Error desconocido" }
  } catch (error) {
    console.error("Error en syncUserProfile:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

// Función para guardar un análisis en la base de datos
// Esta función ya no es necesaria porque el guardado se hace directamente en app/actions.ts
export async function saveAnalysis(analysisData: any) {
  console.log("💾 Guardando análisis desde lib/actions")
  return { success: true }
}

// Función para obtener los análisis del usuario
export async function getUserAnalyses() {
  console.log("🔍 Obteniendo análisis del usuario")

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      console.log("Usuario no autenticado, usando datos mock")
      return { success: true, analyses: mockAnalyses }
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el perfil existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return { success: true, analyses: mockAnalyses }
    }

    console.log("✅ Perfil encontrado:", profile.id)

    // Obtener análisis con sus recetas
    const { data: analyses, error: analysesError } = await supabase
      .from("analyses")
      .select(`
        id,
        created_at,
        ingredients,
        image_url,
        recipes (
          id,
          title,
          description,
          available_ingredients,
          additional_ingredients,
          preparation_steps,
          calories
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (analysesError) {
      console.error("Error al obtener análisis:", analysesError)
      return { success: true, analyses: mockAnalyses }
    }

    console.log("✅ Análisis obtenidos:", analyses?.length || 0)

    // Log para debug
    if (analyses && analyses.length > 0) {
      console.log("📊 Primer análisis:", JSON.stringify(analyses[0], null, 2))
    }

    return { success: true, analyses: analyses || [] }
  } catch (error) {
    console.error("Error al obtener análisis:", error)
    return { success: true, analyses: mockAnalyses }
  }
}

// Función para obtener las recetas favoritas del usuario
export async function getFavoriteRecipes() {
  console.log("❤️ Obteniendo recetas favoritas")

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      console.log("Usuario no autenticado, usando datos mock")
      return { success: true, favorites: mockFavorites }
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el perfil existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return { success: true, favorites: mockFavorites }
    }

    // Obtener favoritos
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorite_recipes")
      .select(`
        id,
        created_at,
        recipe_id,
        recipes:recipe_id (
          id,
          title,
          description,
          available_ingredients,
          additional_ingredients,
          preparation_steps,
          calories
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (favoritesError) {
      console.error("Error al obtener favoritos:", favoritesError)
      return { success: true, favorites: mockFavorites }
    }

    console.log("Favoritos obtenidos:", favorites?.length || 0)
    return { success: true, favorites: favorites || [] }
  } catch (error) {
    console.error("Error al obtener favoritos:", error)
    return { success: true, favorites: mockFavorites }
  }
}

// Función para verificar si una receta es favorita
export async function isRecipeFavorite(recipeId: string) {
  console.log("🔍 Verificando si la receta es favorita:", recipeId)

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      return { success: true, isFavorite: false }
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el perfil existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return { success: true, isFavorite: false }
    }

    // Verificar si la receta es favorita
    const { data, error } = await supabase
      .from("favorite_recipes")
      .select("id")
      .eq("user_id", profile.id)
      .eq("recipe_id", recipeId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error al verificar favorito:", error)
      return { success: true, isFavorite: false }
    }

    return { success: true, isFavorite: !!data }
  } catch (error) {
    console.error("Error al verificar favorito:", error)
    return { success: true, isFavorite: false }
  }
}

// Función para marcar/desmarcar una receta como favorita
export async function toggleFavoriteRecipe(recipeId: string) {
  console.log("❤️ Marcando/desmarcando receta como favorita:", recipeId)

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      return { success: false, error: "Usuario no autenticado" }
    }

    const supabase = createServerSupabaseClient()

    // Obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return { success: false, error: "Perfil no encontrado" }
    }

    // Verificar si ya es favorito
    const { data: existing, error: checkError } = await supabase
      .from("favorite_recipes")
      .select("id")
      .eq("user_id", profile.id)
      .eq("recipe_id", recipeId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error al verificar favorito:", checkError)
      return { success: false, error: "Error al verificar favorito" }
    }

    if (existing) {
      // Eliminar de favoritos
      const { error: deleteError } = await supabase.from("favorite_recipes").delete().eq("id", existing.id)

      if (deleteError) {
        console.error("Error al eliminar favorito:", deleteError)
        return { success: false, error: "Error al eliminar favorito" }
      }

      revalidatePath("/profile")
      return { success: true, isFavorite: false }
    } else {
      // Añadir a favoritos
      const { error: insertError } = await supabase.from("favorite_recipes").insert({
        user_id: profile.id,
        recipe_id: recipeId,
      })

      if (insertError) {
        console.error("Error al añadir favorito:", insertError)
        return { success: false, error: "Error al añadir favorito" }
      }

      revalidatePath("/profile")
      return { success: true, isFavorite: true }
    }
  } catch (error) {
    console.error("Error al actualizar favorito:", error)
    return { success: false, error: "Error al actualizar favoritos" }
  }
}
