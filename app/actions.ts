"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { cookies } from "next/headers"
import crypto from "crypto"
import { getUserMetadata } from "@/lib/user-profile"
import { createNotification } from "@/lib/notifications"
import { auth } from "@clerk/nextjs/server"
import { registerAnalysis } from "@/lib/guest-mode"
import { createServerSupabaseClient } from "@/lib/supabase"
import { secureStore } from "@/lib/secure-storage"
import { saveAnalysis } from "@/lib/actions"

// Almacenamiento temporal en memoria para desarrollo
// Nota: En producción, considera usar una base de datos real
const tempStorage = new Map<string, any>()

export async function analyzeImage(formData: FormData) {
  try {
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      console.error("No se proporcionó ninguna imagen")
      return { success: false, error: "No se proporcionó ninguna imagen" }
    }

    // Verificar si el usuario está autenticado
    const { userId } = auth()
    const isAuthenticated = !!userId

    // Si no está autenticado, verificar si puede realizar análisis
    if (!isAuthenticated) {
      // Registrar el análisis y verificar si se pudo realizar
      const analysisId = crypto.randomUUID()
      const canAnalyze = registerAnalysis(analysisId)

      if (!canAnalyze) {
        return {
          success: false,
          error: "Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.",
          limitReached: true,
        }
      }
    }

    console.log("📸 Imagen recibida:", imageFile.name, "Tamaño:", (imageFile.size / 1024).toFixed(2), "KB")

    // Convert the image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const dataURI = `data:${imageFile.type};base64,${base64Image}`

    // Obtener preferencias dietéticas y alergias del usuario
    let dietaryPreferences: string[] = []
    let allergies: string[] = []

    if (isAuthenticated) {
      try {
        const userMetadata = await getUserMetadata()
        dietaryPreferences = userMetadata.dietaryPreferences || []
        allergies = userMetadata.allergies || []
      } catch (error) {
        console.error("Error al obtener metadatos del usuario:", error)
      }
    }

    // Construir un prompt personalizado basado en las preferencias del usuario
    let customPrompt =
      "Analiza esta imagen de una nevera y lista todos los alimentos que puedes identificar. Luego, sugiere 3 recetas que se puedan preparar con estos ingredientes."

    if (dietaryPreferences.length > 0 || allergies.length > 0) {
      customPrompt += " Ten en cuenta las siguientes preferencias del usuario:"

      if (dietaryPreferences.length > 0) {
        customPrompt += ` Preferencias dietéticas: ${dietaryPreferences.join(", ")}.`
      }

      if (allergies.length > 0) {
        customPrompt += ` Alergias: ${allergies.join(", ")}.`
      }
    }

    customPrompt +=
      " Para cada receta, incluye un título, una breve descripción, los ingredientes necesarios (indicando cuáles están en la nevera y cuáles habría que añadir), los pasos de preparación y una estimación aproximada de calorías totales."

    customPrompt +=
      ' IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta, sin texto adicional antes o después: { "ingredientes": ["ingrediente1", "ingrediente2", ...], "recetas": [{ "titulo": "Título de la receta", "descripcion": "Breve descripción", "ingredientes": { "disponibles": ["ingrediente1", ...], "adicionales": ["ingrediente3", ...] }, "preparacion": ["paso1", "paso2", ...], "calorias": 350 }, ...] }'

    // Use OpenAI to analyze the image with a more explicit prompt for JSON formatting
    console.log("🔍 Iniciando análisis de imagen con OpenAI...")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en analizar imágenes de alimentos y generar recetas. Siempre respondes con JSON válido según la estructura solicitada, sin texto adicional antes o después del JSON.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: customPrompt,
              },
              {
                type: "image",
                image: dataURI,
              },
            ],
          },
        ],
      })

      console.log("✅ Respuesta recibida de OpenAI")

      // Attempt to parse the JSON response
      let data
      try {
        // Trim any potential text before or after the JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : text
        data = JSON.parse(jsonString)

        // Generate a unique ID for this analysis
        const id = crypto.randomUUID()
        console.log("🔑 ID generado:", id)

        // Añadir IDs únicos a las recetas si no los tienen
        if (data.recetas && Array.isArray(data.recetas)) {
          data.recetas = data.recetas.map((receta: any, index: number) => ({
            ...receta,
            id: receta.id || `recipe_${id}_${index}`,
          }))
        }

        console.log("✅ JSON parseado correctamente")

        // Guardar en Supabase si el usuario está autenticado
        if (isAuthenticated) {
          // Guardar la imagen en Supabase Storage
          const supabase = createServerSupabaseClient()
          const imageData = dataURI.split(",")[1]
          const { data: uploadResult } = await supabase.storage
            .from("analysis-images")
            .upload(`analysis_${id}.jpg`, Buffer.from(imageData, "base64"), {
              contentType: "image/jpeg",
            })

          // Obtener la URL pública de la imagen
          const { data: publicUrlData } = supabase.storage
            .from("analysis-images")
            .getPublicUrl(uploadResult?.path || `analysis_${id}.jpg`)

          // Añadir la URL de la imagen a los datos
          data.image_url = publicUrlData?.publicUrl

          // Guardar el análisis en la base de datos
          const saveResult = await saveAnalysis({
            ...data,
            id,
          })

          console.log("💾 Resultado de guardar análisis:", saveResult)
        }

        // Store the data in our temporary storage
        tempStorage.set(id, data)
        console.log("💾 Datos almacenados en memoria temporal")

        // Almacenar en secure storage para acceso posterior
        secureStore(`data_${id}`, data)

        // Set an expiration (24 hours) by scheduling deletion
        setTimeout(
          () => {
            tempStorage.delete(id)
            console.log("🗑️ Datos eliminados de memoria temporal:", id)
          },
          24 * 60 * 60 * 1000,
        )

        // Almacenar solo el ID en una cookie para referencia
        cookies().set("fridgy_last_id", id, {
          maxAge: 24 * 60 * 60, // 24 horas
          path: "/",
        })

        // Crear una notificación para el usuario si está autenticado
        if (isAuthenticated) {
          try {
            await createNotification(
              "Análisis completado",
              `Se han encontrado ${data.ingredientes.length} ingredientes y generado ${data.recetas.length} recetas.`,
              "success",
              `/results?id=${id}`,
            )
          } catch (error) {
            console.error("Error al crear notificación:", error)
          }
        }

        // Devolver los datos junto con el ID para que el cliente los almacene
        return {
          success: true,
          id,
          data, // Incluir los datos para almacenamiento del lado del cliente
        }
      } catch (parseError) {
        console.error("❌ Error parsing JSON response:", parseError)
        console.log("📄 Raw response:", text)

        // Fallback data if parsing fails
        data = {
          ingredientes: ["No se pudieron identificar ingredientes"],
          recetas: [
            {
              titulo: "No se pudieron generar recetas",
              descripcion: "Lo sentimos, no pudimos analizar correctamente la imagen",
              ingredientes: {
                disponibles: [],
                adicionales: ["Intenta con otra imagen"],
              },
              preparacion: ["Intenta tomar una foto más clara de tu nevera"],
              calorias: 0,
            },
          ],
        }

        return {
          success: false,
          error: "No se pudo analizar la imagen correctamente. Intenta con otra imagen.",
        }
      }
    } catch (openaiError) {
      console.error("❌ Error en la llamada a OpenAI:", openaiError)
      throw openaiError
    }
  } catch (error) {
    console.error("❌ Error general en analyzeImage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function getAnalysisResults(id: string) {
  try {
    console.log("🔍 Buscando resultados para ID:", id)

    // Intentar obtener los datos de la memoria temporal
    const data = tempStorage.get(id)

    if (data) {
      console.log("✅ Resultados encontrados en memoria temporal para ID:", id)
      return { success: true, data }
    }

    // Si no se encuentran datos, devolver error
    console.error("❌ No se encontraron resultados para ID:", id)
    return {
      success: false,
      error: "No se encontraron resultados. Por favor, vuelve a analizar la imagen.",
    }
  } catch (error) {
    console.error("❌ Error getting analysis results:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// Función para obtener los análisis del usuario desde Supabase
export async function getUserAnalyses() {
  try {
    console.log("🔍 Obteniendo análisis del usuario...")

    const { userId } = auth()

    if (!userId) {
      console.error("❌ Usuario no autenticado")
      return { success: false, error: "Usuario no autenticado" }
    }

    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Obtener el ID del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error al obtener perfil:", profileError)
      throw profileError
    }

    // Obtener los análisis del usuario
    const { data: analyses, error: analysesError } = await supabase
      .from("analyses")
      .select("*, recipes(*)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (analysesError) {
      console.error("❌ Error al obtener análisis:", analysesError)
      throw analysesError
    }

    console.log(`✅ Se encontraron ${analyses.length} análisis`)
    return { success: true, analyses }
  } catch (error) {
    console.error("❌ Error al obtener análisis del usuario:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}
