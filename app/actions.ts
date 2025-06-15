"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { cookies } from "next/headers"
import crypto from "crypto"
import { getUserMetadata } from "@/lib/user-profile"
import { createNotification } from "@/lib/notifications"
import { auth } from "@clerk/nextjs/server"
import { registerAnalysis } from "@/lib/guest-mode"
import { createClient } from "@supabase/supabase-js"
import { secureStore } from "@/lib/secure-storage"

// Almacenamiento temporal en memoria para desarrollo
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

    // Use OpenAI to analyze the image
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
        if (isAuthenticated && userId) {
          console.log("💾 Guardando análisis en Supabase...")
          try {
            await saveAnalysisToSupabase(userId, data, dataURI, id)
            console.log("✅ Análisis guardado en Supabase correctamente")
          } catch (error) {
            console.error("❌ Error al guardar en Supabase:", error)
          }
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

// Función para guardar el análisis en Supabase
async function saveAnalysisToSupabase(clerkUserId: string, data: any, imageDataURI: string, analysisId: string) {
  try {
    console.log("💾 Iniciando guardado en Supabase para usuario:", clerkUserId)

    // Crear cliente de Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variables de entorno de Supabase no configuradas")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Primero, verificar o crear el perfil del usuario
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      // El perfil no existe, crearlo
      console.log("📝 Creando perfil para usuario:", clerkUserId)
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          clerk_id: clerkUserId,
          email: `user_${clerkUserId}@example.com`,
          full_name: `Usuario ${clerkUserId.slice(-4)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError) {
        console.error("❌ Error al crear perfil:", createError)
        throw createError
      }

      profile = newProfile
      console.log("✅ Perfil creado:", profile.id)
    } else if (profileError) {
      console.error("❌ Error al obtener perfil:", profileError)
      throw profileError
    }

    console.log("✅ Perfil obtenido:", profile.id)

    // Guardar la imagen en Supabase Storage (opcional)
    let imageUrl = null
    try {
      const imageData = imageDataURI.split(",")[1] // Eliminar el prefijo "data:image/jpeg;base64,"
      const imageName = `analysis_${analysisId}.jpg`

      const { data: uploadData, error: imageError } = await supabase.storage
        .from("analysis-images")
        .upload(imageName, Buffer.from(imageData, "base64"), {
          contentType: "image/jpeg",
        })

      if (!imageError) {
        const { data: urlData } = supabase.storage.from("analysis-images").getPublicUrl(imageName)
        imageUrl = urlData.publicUrl
        console.log("✅ Imagen guardada:", imageUrl)
      } else {
        console.log("⚠️ No se pudo guardar la imagen:", imageError.message)
      }
    } catch (imageError) {
      console.log("⚠️ Error al guardar imagen, continuando sin imagen:", imageError)
    }

    // Guardar el análisis en la base de datos
    console.log("💾 Guardando análisis en la tabla analyses...")
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        id: analysisId,
        user_id: profile.id,
        image_url: imageUrl,
        ingredients: data.ingredientes || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (analysisError) {
      console.error("❌ Error al guardar análisis:", analysisError)
      throw analysisError
    }

    console.log("✅ Análisis guardado:", analysis.id)

    // Guardar las recetas en la base de datos
    if (data.recetas && Array.isArray(data.recetas)) {
      console.log("💾 Guardando", data.recetas.length, "recetas...")

      for (let i = 0; i < data.recetas.length; i++) {
        const receta = data.recetas[i]
        try {
          const { data: recipe, error: recipeError } = await supabase
            .from("recipes")
            .insert({
              id: crypto.randomUUID(),
              analysis_id: analysisId,
              title: receta.titulo || `Receta ${i + 1}`,
              description: receta.descripcion || "",
              available_ingredients: receta.ingredientes?.disponibles || [],
              additional_ingredients: receta.ingredientes?.adicionales || [],
              preparation_steps: receta.preparacion || [],
              calories: receta.calorias || 0,
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (recipeError) {
            console.error(`❌ Error al guardar receta ${i + 1}:`, recipeError)
          } else {
            console.log(`✅ Receta ${i + 1} guardada:`, recipe.id)
          }
        } catch (error) {
          console.error(`❌ Error al procesar receta ${i + 1}:`, error)
        }
      }
    }

    console.log("✅ Análisis completo guardado en Supabase")
    return true
  } catch (error) {
    console.error("❌ Error completo al guardar en Supabase:", error)
    throw error
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
