"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { mockAnalyses, mockFavorites } from "./mock-data"
import { revalidatePath } from "next/cache"

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
export async function saveAnalysis(analysisData: any) {
  console.log("💾 Guardando análisis")

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      console.log("Usuario no autenticado, no se puede guardar análisis")
      return { success: false, error: "Usuario no autenticado" }
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

      // Crear perfil si no existe
      if (profileError.code === "PGRST116") {
        const syncResult = await syncUserProfile()

        if (!syncResult.success) {
          console.error("No se pudo crear el perfil de usuario:", syncResult.error)
          return { success: false, error: "No se pudo crear el perfil de usuario" }
        }

        // Obtener el perfil recién creado
        const { data: newProfile, error: newProfileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_id", userId)
          .single()

        if (newProfileError) {
          console.error("Error al obtener nuevo perfil:", newProfileError)
          return { success: false, error: "Error al obtener nuevo perfil" }
        }

        // Guardar análisis con el nuevo perfil
        const { data: analysis, error: analysisError } = await supabase
          .from("analyses")
          .insert({
            user_id: newProfile.id,
            ingredients: analysisData.ingredientes || analysisData.ingredients || [],
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (analysisError) {
          console.error("Error al guardar análisis:", analysisError)
          return { success: false, error: "Error al guardar análisis" }
        }

        console.log("Análisis guardado correctamente:", analysis.id)

        // Guardar recetas
        const recetas = analysisData.recetas || analysisData.recipes || []
        for (const receta of recetas) {
          const { error: recipeError } = await supabase.from("recipes").insert({
            analysis_id: analysis.id,
            title: receta.titulo || receta.title || "Sin título",
            description: receta.descripcion || receta.description || "",
            available_ingredients: receta.ingredientes?.disponibles || receta.ingredients?.available || [],
            additional_ingredients: receta.ingredientes?.adicionales || receta.ingredients?.additional || [],
            preparation_steps: receta.preparacion || receta.steps || [],
            calories: receta.calorias || receta.calories || 0,
            created_at: new Date().toISOString(),
          })

          if (recipeError) {
            console.error("Error al guardar receta:", recipeError)
            // Continuar con las siguientes recetas
          }
        }

        revalidatePath("/profile")
        return { success: true, analysis }
      }

      return { success: false, error: "Error al obtener perfil de usuario" }
    }

    // Guardar análisis con el perfil existente
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        user_id: profile.id,
        ingredients: analysisData.ingredientes || analysisData.ingredients || [],
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (analysisError) {
      console.error("Error al guardar análisis:", analysisError)
      return { success: false, error: "Error al guardar análisis" }
    }

    console.log("Análisis guardado correctamente:", analysis.id)

    // Guardar recetas
    const recetas = analysisData.recetas || analysisData.recipes || []
    for (const receta of recetas) {
      const { error: recipeError } = await supabase.from("recipes").insert({
        analysis_id: analysis.id,
        title: receta.titulo || receta.title || "Sin título",
        description: receta.descripcion || receta.description || "",
        available_ingredients: receta.ingredientes?.disponibles || receta.ingredients?.available || [],
        additional_ingredients: receta.ingredientes?.adicionales || receta.ingredients?.additional || [],
        preparation_steps: receta.preparacion || receta.steps || [],
        calories: receta.calorias || receta.calories || 0,
        created_at: new Date().toISOString(),
      })

      if (recipeError) {
        console.error("Error al guardar receta:", recipeError)
        // Continuar con las siguientes recetas
      }
    }

    revalidatePath("/profile")
    return { success: true, analysis }
  } catch (error) {
    console.error("Error al guardar análisis:", error)
    return { success: false, error: "Error al guardar análisis" }
  }
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

    // Obtener análisis
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

    console.log("Análisis obtenidos:", analyses?.length || 0)
    return { success: true, analyses: analyses || mockAnalyses }
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
    return { success: true, favorites: favorites || mockFavorites }
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
      console.log("Usuario no autenticado, usando datos mock")
      return { success: true, isFavorite: mockFavorites.some((fav) => fav.recipe.id === recipeId) }
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
      console.log("Usuario no autenticado, no se puede marcar/desmarcar favorito")
      return { success: false, error: "Usuario no autenticado" }
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

      // Crear perfil si no existe
      if (profileError.code === "PGRST116") {
        const syncResult = await syncUserProfile()

        if (!syncResult.success) {
          console.error("No se pudo crear el perfil de usuario:", syncResult.error)
          return { success: false, error: "No se pudo crear el perfil de usuario" }
        }

        // Obtener el perfil recién creado
        const { data: newProfile, error: newProfileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_id", userId)
          .single()

        if (newProfileError) {
          console.error("Error al obtener nuevo perfil:", newProfileError)
          return { success: false, error: "Error al obtener nuevo perfil" }
        }

        // Marcar como favorito
        const { error: insertError } = await supabase.from("favorite_recipes").insert({
          user_id: newProfile.id,
          recipe_id: recipeId,
        })

        if (insertError) {
          console.error("Error al añadir favorito:", insertError)
          return { success: false, error: "Error al añadir favorito" }
        }

        console.log("Receta añadida a favoritos")
        revalidatePath("/profile")
        return { success: true, isFavorite: true }
      }

      return { success: false, error: "Error al obtener perfil de usuario" }
    }

    // Verificar si la receta ya es favorita
    const { data: existingFavorite, error: favoriteError } = await supabase
      .from("favorite_recipes")
      .select("id")
      .eq("user_id", profile.id)
      .eq("recipe_id", recipeId)
      .single()

    if (favoriteError && favoriteError.code !== "PGRST116") {
      console.error("Error al verificar favorito:", favoriteError)
      return { success: false, error: "Error al verificar favorito" }
    }

    if (existingFavorite) {
      // Si ya existe, eliminarla (toggle off)
      const { error: deleteError } = await supabase.from("favorite_recipes").delete().eq("id", existingFavorite.id)

      if (deleteError) {
        console.error("Error al eliminar favorito:", deleteError)
        return { success: false, error: "Error al eliminar favorito" }
      }

      console.log("Receta eliminada de favoritos")
      revalidatePath("/profile")
      return { success: true, isFavorite: false }
    } else {
      // Si no existe, agregarla (toggle on)
      const { error: insertError } = await supabase.from("favorite_recipes").insert({
        user_id: profile.id,
        recipe_id: recipeId,
      })

      if (insertError) {
        console.error("Error al añadir favorito:", insertError)
        return { success: false, error: "Error al añadir favorito" }
      }

      console.log("Receta añadida a favoritos")
      revalidatePath("/profile")
      return { success: true, isFavorite: true }
    }
  } catch (error) {
    console.error("Error al marcar/desmarcar favorito:", error)
    return { success: false, error: "Error al actualizar favoritos" }
  }
}
