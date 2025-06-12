"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase" // Importar desde lib/supabase
import { mockAnalyses, mockFavorites } from "./mock-data"
import { revalidatePath } from "next/cache"
import { syncUserProfile } from "./user-profile" // Asegúrate que esta importación sea correcta

// Tipo para los resultados del análisis
export interface Recipe {
  id?: string
  titulo: string
  descripcion: string
  ingredientes: {
    disponibles: string[]
    adicionales: string[]
  }
  preparacion: string[]
  calorias: number
  tiempo_preparacion: number
  dificultad: "fácil" | "media" | "difícil"
  porciones: number
  consejos: string
}

interface AnalysisDataToSave {
  userId: string
  ingredients: string[]
  recipes: Recipe[]
  imageUrl?: string // Opcional, si se sube una imagen
}

// Función para guardar un análisis en la base de datos
export async function saveAnalysis(data: AnalysisDataToSave) {
  console.log("[SUPABASE] Iniciando guardado de análisis...")

  try {
    const supabase = createServerSupabaseClient()

    // 1. Obtener el ID del perfil del usuario
    const { data: profileData, error: profileError } = await supabase // Renombrado para evitar conflicto
      .from("profiles")
      .select("id")
      .eq("clerk_id", data.userId)
      .single()

    let userProfileId: string // Variable para almacenar el ID del perfil

    if (profileError) {
      console.error("[SUPABASE] Error al obtener perfil:", profileError)
      // Intentar crear el perfil si no existe (esto debería ser manejado por syncUserProfile en el login)
      const syncResult = await syncUserProfile(data.userId) // Llamar a la función importada
      if (!syncResult.success || !syncResult.profileId) {
        // Verificar profileId también
        console.error("[SUPABASE] No se pudo crear el perfil de usuario:", syncResult.error)
        return { success: false, error: "No se pudo encontrar o crear el perfil de usuario." }
      }
      // Reintentar obtener el perfil
      const { data: newProfile, error: newProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", data.userId)
        .single()
      if (newProfileError || !newProfile) {
        console.error("[SUPABASE] Error al obtener el nuevo perfil:", newProfileError)
        return { success: false, error: "Error al obtener el nuevo perfil de usuario." }
      }
      userProfileId = newProfile.id // Usar el ID del nuevo perfil
    } else if (profileData) {
      userProfileId = profileData.id
    } else {
      console.error("[SUPABASE] Perfil no encontrado y no se pudo crear.")
      return { success: false, error: "Perfil no encontrado y no se pudo crear." }
    }

    console.log("[SUPABASE] Perfil de usuario encontrado/creado:", userProfileId)

    let imageUrl = data.imageUrl
    // 2. Subir la imagen a Supabase Storage si se proporciona
    if (data.imageUrl && data.imageUrl.startsWith("data:image")) {
      try {
        const base64Data = data.imageUrl.split(",")[1]
        const buffer = Buffer.from(base64Data, "base64")
        const imageName = `analysis_${Date.now()}.jpeg` // Usar .jpeg para consistencia

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("analysis-images")
          .upload(imageName, buffer, {
            contentType: "image/jpeg",
            upsert: true, // Sobrescribir si ya existe (útil para reintentos)
          })

        if (uploadError) {
          console.error("[SUPABASE] Error al subir imagen a Storage:", uploadError)
          imageUrl = "/error-uploading.png" // Fallback
        } else {
          const { data: publicUrlData } = supabase.storage.from("analysis-images").getPublicUrl(imageName)
          imageUrl = publicUrlData.publicUrl
          console.log("[SUPABASE] Imagen subida a Storage:", imageUrl)
        }
      } catch (storageError) {
        console.error("[SUPABASE] Error inesperado al procesar imagen para Storage:", storageError)
        imageUrl = "/unexpected-image-error.png" // Fallback
      }
    } else if (data.imageUrl) {
      // Si ya es una URL válida (ej. de un fallback)
      imageUrl = data.imageUrl
    } else {
      imageUrl = "/colorful-abstract.png" // Fallback si no hay imagen
    }

    // 3. Guardar el análisis principal
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        user_id: userProfileId, // Usar userProfileId
        ingredients: data.ingredients,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (analysisError || !analysis) {
      console.error("[SUPABASE] Error al guardar análisis principal:", analysisError)
      return { success: false, error: "Error al guardar el análisis principal." }
    }
    console.log("[SUPABASE] Análisis principal guardado con ID:", analysis.id)

    // 4. Guardar las recetas asociadas al análisis
    const recipesToInsert = data.recipes.map((recipe) => ({
      analysis_id: analysis.id,
      title: recipe.titulo,
      description: recipe.descripcion,
      available_ingredients: recipe.ingredientes.disponibles,
      additional_ingredients: recipe.ingredientes.adicionales,
      preparation_steps: recipe.preparacion,
      calories: recipe.calorias,
      tiempo_preparacion: recipe.tiempo_preparacion,
      dificultad: recipe.dificultad,
      porciones: recipe.porciones,
      consejos: recipe.consejos,
      created_at: new Date().toISOString(),
    }))

    const { error: recipesError } = await supabase.from("recipes").insert(recipesToInsert)

    if (recipesError) {
      console.error("[SUPABASE] Error al guardar recetas:", recipesError)
      // No devolvemos error fatal aquí, ya que el análisis principal ya se guardó
    } else {
      console.log(`[SUPABASE] ${recipesToInsert.length} recetas guardadas correctamente.`)
    }

    revalidatePath("/profile") // Revalidar la página de perfil para mostrar el nuevo análisis
    console.log("🎉 [SUPABASE] Guardado completo exitoso.")
    return { success: true, analysisId: analysis.id } // Devolver analysisId
  } catch (error) {
    console.error("[SUPABASE] Error inesperado en saveAnalysis:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al guardar análisis." }
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

    if (profileError || !profile) {
      console.error("Error al obtener perfil:", profileError)
      // Podrías intentar sincronizar el perfil aquí si no existe
      // const syncResult = await syncUserProfile(userId);
      // if (!syncResult.success || !syncResult.profileId) {
      //   return { success: true, analyses: mockAnalyses, error: "Perfil no encontrado y no se pudo crear." };
      // }
      // profile = { id: syncResult.profileId }; // Usar el ID del perfil recién creado/sincronizado
      return { success: true, analyses: mockAnalyses, error: "Perfil no encontrado." } // Simplificado por ahora
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
         calories,
         tiempo_preparacion,
         dificultad,
         porciones,
         consejos
       )
     `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (analysesError) {
      console.error("Error al obtener análisis:", analysesError)
      return { success: true, analyses: mockAnalyses, error: "Error al obtener análisis." } // Devolver mock en caso de error
    }

    console.log("✅ Análisis obtenidos:", analyses?.length || 0)

    return { success: true, analyses: analyses || [] }
  } catch (error) {
    console.error("Error al obtener análisis:", error)
    return {
      success: true,
      analyses: mockAnalyses,
      error: error instanceof Error ? error.message : "Error desconocido.",
    } // Devolver mock
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

    if (profileError || !profile) {
      console.error("Error al obtener perfil:", profileError)
      return { success: true, favorites: mockFavorites, error: "Perfil no encontrado." }
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
         calories,
         tiempo_preparacion,
         dificultad,
         porciones,
         consejos
       )
     `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (favoritesError) {
      console.error("Error al obtener favoritos:", favoritesError)
      return { success: true, favorites: mockFavorites, error: "Error al obtener favoritos." }
    }

    console.log("Favoritos obtenidos:", favorites?.length || 0)
    return { success: true, favorites: favorites || [] }
  } catch (error) {
    console.error("Error al obtener favoritos:", error)
    return {
      success: true,
      favorites: mockFavorites,
      error: error instanceof Error ? error.message : "Error desconocido.",
    }
  }
}

// Función para verificar si una receta es favorita
export async function isRecipeFavorite(recipeId: string) {
  console.log("🔍 Verificando si la receta es favorita:", recipeId)

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      return { success: true, isFavorite: false, error: "Usuario no autenticado." }
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el perfil existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError || !profile) {
      console.error("Error al obtener perfil:", profileError)
      return { success: false, isFavorite: false, error: "Perfil no encontrado." }
    }

    // Verificar si la receta es favorita
    const { data, error } = await supabase
      .from("favorite_recipes")
      .select("id")
      .eq("user_id", profile.id)
      .eq("recipe_id", recipeId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116: No rows found, not an error in this case
      console.error("Error al verificar favorito:", error)
      return { success: false, isFavorite: false, error: "Error al verificar favorito." }
    }

    return { success: true, isFavorite: !!data }
  } catch (error) {
    console.error("Error al verificar favorito:", error)
    return { success: false, isFavorite: false, error: error instanceof Error ? error.message : "Error desconocido." }
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

    if (profileError || !profile) {
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
      revalidatePath("/app/recipe/[id]", "layout") // Revalidar página de receta específica
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
      revalidatePath("/app/recipe/[id]", "layout") // Revalidar página de receta específica
      return { success: true, isFavorite: true }
    }
  } catch (error) {
    console.error("Error al actualizar favorito:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error al actualizar favoritos" }
  }
}
