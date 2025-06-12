"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// Función para analizar una imagen y detectar ingredientes
export async function analyzeImage(imageBase64: string) {
  console.log("🔍 Analizando imagen...")

  try {
    // Aquí iría la lógica para analizar la imagen con un servicio de IA
    // Por ahora, simulamos una respuesta

    // Simulamos un tiempo de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Ingredientes de ejemplo que "detectamos" en la imagen
    const detectedIngredients = [
      { name: "Tomate", quantity: "2", unit: "unidades" },
      { name: "Cebolla", quantity: "1", unit: "unidad" },
      { name: "Pimiento", quantity: "1", unit: "unidad" },
      { name: "Ajo", quantity: "2", unit: "dientes" },
      { name: "Aceite de oliva", quantity: "2", unit: "cucharadas" },
    ]

    // Guardamos el análisis en la base de datos
    const analysisId = await saveAnalysisToDatabase(imageBase64, detectedIngredients)

    return {
      success: true,
      ingredients: detectedIngredients,
      analysisId,
    }
  } catch (error) {
    console.error("❌ Error al analizar la imagen:", error)
    return {
      success: false,
      error: "No se pudo analizar la imagen. Por favor, inténtalo de nuevo.",
    }
  }
}

// Función auxiliar para guardar el análisis en la base de datos
async function saveAnalysisToDatabase(imageBase64: string, ingredients: any[]) {
  const { userId } = auth()

  if (!userId) {
    throw new Error("Usuario no autenticado")
  }

  // Crear cliente de Supabase
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Obtener el ID del perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .single()

  if (profileError) {
    throw profileError
  }

  // Guardar la imagen en Supabase Storage
  const imageData = imageBase64.split(",")[1] // Eliminar el prefijo "data:image/jpeg;base64,"
  const imageName = `analysis_${Date.now()}.jpg`

  const { data: imageData2, error: imageError } = await supabase.storage
    .from("analysis-images")
    .upload(imageName, Buffer.from(imageData, "base64"), {
      contentType: "image/jpeg",
    })

  if (imageError) {
    throw imageError
  }

  // Obtener la URL pública de la imagen
  const { data: imageUrl } = supabase.storage.from("analysis-images").getPublicUrl(imageName)

  // Guardar el análisis en la base de datos
  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      user_id: profile.id,
      image_url: imageUrl.publicUrl,
      ingredients: ingredients,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (analysisError) {
    throw analysisError
  }

  // Revalidar la ruta para actualizar la UI
  revalidatePath("/profile")

  return analysis.id
}
