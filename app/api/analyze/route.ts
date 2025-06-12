import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { auth } from "@clerk/nextjs/server"
import { saveAnalysis } from "@/lib/actions"
import { getUserMetadata } from "@/lib/user-profile"

// Esquema de validación para la imagen
const imageSchema = z.object({
  size: z
    .number()
    .min(1, "El archivo no puede estar vacío.")
    .max(10 * 1024 * 1024, "La imagen no puede superar los 10MB."), // Máximo 10MB
  type: z.string().refine((type) => type.startsWith("image/"), { message: "El archivo debe ser una imagen." }),
})

// Datos de ejemplo para cuando no funcione GPT
const EXAMPLE_DATA = {
  ingredientes: ["Tomates (Ejemplo)", "Cebolla (Ejemplo)", "Pimiento (Ejemplo)"],
  recetas: [
    {
      titulo: "Receta de Ejemplo (IA no disponible)",
      descripcion: "Esta es una receta de ejemplo porque la IA no pudo procesar tu imagen o hubo un error.",
      ingredientes: {
        disponibles: ["Tomates (Ejemplo)", "Cebolla (Ejemplo)"],
        adicionales: ["Sal", "Pimienta"],
      },
      preparacion: ["Paso 1 de ejemplo", "Paso 2 de ejemplo"],
      calorias: 250,
      tiempo_preparacion: 15,
      dificultad: "fácil",
      porciones: 1,
      consejos: "Este es un consejo de ejemplo.",
    },
  ],
}

// Datos de ejemplo mínimal para pruebas
const EXAMPLE_DATA_MINIMAL = {
  ingredientes: ["Ingrediente de prueba 1", "Ingrediente de prueba 2"],
  recetas: [
    {
      titulo: "Receta de Prueba Mínima",
      descripcion: "Esto es solo para probar que la ruta funciona.",
      ingredientes: { disponibles: ["Ingrediente de prueba 1"], adicionales: ["Sal"] },
      preparacion: ["Mezclar y servir."],
      calorias: 100,
      tiempo_preparacion: 5,
      dificultad: "fácil",
      porciones: 1,
      consejos: "Ninguno por ahora.",
    },
  ],
}

// Función para sanitizar el texto (eliminar posibles scripts)
function sanitizeText(text: string): string {
  if (typeof text !== "string") return ""
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
}

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  // Generar un ID único para esta solicitud para facilitar el rastreo en los logs
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  let analysisDatabaseId = requestId // ID que se usará para la base de datos, puede cambiar si se guarda en Supabase

  console.log(`[${requestId}] 🔍 API /analyze iniciada.`)

  try {
    // 1. Aplicar Rate Limiting
    console.log(`[${requestId}] 🚦 Aplicando rate limiting...`)
    const rateLimitResult = await rateLimit(request)
    if (rateLimitResult instanceof NextResponse) {
      console.warn(`[${requestId}] 🚦 Rate limit excedido.`)
      return rateLimitResult // Esto ya es una NextResponse
    }
    const headers = rateLimitResult.headers // Headers para la respuesta final
    console.log(`[${requestId}] ✅ Rate limit pasado.`)

    // 2. Obtener y validar la imagen del FormData
    console.log(`[${requestId}] 📄 Procesando FormData...`)
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      console.error(`[${requestId}] ❌ No se proporcionó imagen.`)
      return NextResponse.json(
        {
          success: false,
          error: "No se proporcionó imagen.",
          data: EXAMPLE_DATA,
          isExample: true,
          message: "No se proporcionó ninguna imagen. Mostrando datos de ejemplo.",
          analysisId: analysisDatabaseId,
        },
        { status: 400, headers },
      )
    }
    console.log(
      `[${requestId}] 📸 Imagen recibida: ${imageFile.name}, Tamaño: ${imageFile.size} bytes, Tipo: ${imageFile.type}`,
    )

    try {
      imageSchema.parse({ size: imageFile.size, type: imageFile.type })
      console.log(`[${requestId}] ✅ Validación de imagen exitosa.`)
    } catch (validationError) {
      const errorMessage =
        validationError instanceof z.ZodError
          ? validationError.errors.map((e) => e.message).join(", ")
          : "Error de validación desconocido"
      console.error(`[${requestId}] ❌ Error de validación de imagen: ${errorMessage}`)
      return NextResponse.json(
        {
          success: false,
          error: `Imagen no válida: ${errorMessage}`,
          data: EXAMPLE_DATA,
          isExample: true,
          message: `La imagen proporcionada no es válida (${errorMessage}). Mostrando datos de ejemplo.`,
          analysisId: analysisDatabaseId,
        },
        { status: 400, headers },
      )
    }

    // 3. Convertir imagen a base64
    console.log(`[${requestId}] 🔄 Convirtiendo imagen a base64...`)
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const dataURI = `data:${imageFile.type};base64,${base64Image}`
    console.log(`[${requestId}] ✅ Imagen convertida a base64. Longitud del Data URI: ${dataURI.length}`)
    if (dataURI.length > 15 * 1024 * 1024) {
      // ~20MB base64 es el límite de OpenAI, 15MB es un umbral conservador
      console.warn(
        `[${requestId}] ⚠️ Data URI (${(dataURI.length / (1024 * 1024)).toFixed(2)}MB) podría ser muy grande.`,
      )
    }

    let analysisDataToReturn: any = null
    let isExampleResponse = false
    let responseMessage = ""

    // 4. Obtener preferencias del usuario (si está logueado)
    const authResult = await auth()
    const userId = authResult?.userId
    let userPreferencesPromptText = ""
    if (userId) {
      try {
        console.log(`[${requestId}] 👤 Obteniendo preferencias para usuario ${userId}...`)
        const prefs = await getUserMetadata() // Asume que esta función es para el usuario autenticado actual
        if (prefs.dietaryPreferences && prefs.dietaryPreferences.length > 0) {
          userPreferencesPromptText += `\n\nPreferencias dietéticas del usuario: ${prefs.dietaryPreferences.join(", ")}. Adapta las recetas a estas.`
        }
        if (prefs.allergies && prefs.allergies.length > 0) {
          userPreferencesPromptText += `\n\nAlergias del usuario: ${prefs.allergies.join(", ")}. EVITA ESTRICTAMENTE estos ingredientes.`
        }
        console.log(
          `[${requestId}] 📋 Preferencias obtenidas para ${userId}: ${userPreferencesPromptText || "Ninguna"}`,
        )
      } catch (error) {
        console.error(`[${requestId}] ❌ Error al obtener preferencias del usuario ${userId}:`, error)
      }
    }

    // 5. Llamar a la IA (OpenAI)
    if (!process.env.OPENAI_API_KEY) {
      console.warn(`[${requestId}] 🔑 No hay API key de OpenAI. Usando datos de ejemplo.`)
      analysisDataToReturn = EXAMPLE_DATA
      isExampleResponse = true
      responseMessage = "Servicio de IA no disponible en este momento. Mostrando datos de ejemplo."
    } else {
      console.log(`[${requestId}] 🤖 Llamando a OpenAI GPT-4o...`)
      try {
        const gptStartTime = Date.now()
        const { text, finishReason, usage } = await generateText({
          model: openai("gpt-4o"),
          messages: [
            {
              role: "system",
              content: `Eres un chef experto y nutricionista. Analiza la imagen de comida y sugiere recetas.
              Responde SIEMPRE con un objeto JSON válido, sin texto adicional antes o después.
              La estructura JSON DEBE SER:
              {
                "ingredientes": ["ingrediente1", "ingrediente2", ...],
                "recetas": [{
                  "titulo": "Nombre de la receta",
                  "descripcion": "Descripción breve y apetitosa.",
                  "ingredientes": {
                    "disponibles": ["ingrediente_detectado_1", ...],
                    "adicionales": ["ingrediente_necesario_1", ...]
                  },
                  "preparacion": ["Paso 1 detallado.", "Paso 2 detallado.", ...],
                  "calorias": 350,
                  "tiempo_preparacion": 25,
                  "dificultad": "media",
                  "porciones": 2,
                  "consejos": "Un consejo útil o variación."
                }, ...]
              }
              Sé preciso con los ingredientes y las estimaciones. Considera las preferencias y alergias del usuario si se proporcionan.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analiza esta imagen y devuelve el JSON con la estructura especificada. ${userPreferencesPromptText}`,
                },
                { type: "image", image: dataURI },
              ],
            },
          ],
          maxTokens: 3000, // Aumentar por si las recetas son largas
        })
        const gptEndTime = Date.now()
        console.log(
          `[${requestId}] ✅ Respuesta de GPT recibida en ${gptEndTime - gptStartTime}ms. Razón: ${finishReason}. Uso: ${JSON.stringify(usage)}`,
        )
        console.log(`[${requestId}] 📝 Respuesta GPT (primeros 300 chars): ${text.substring(0, 300)}...`)

        try {
          const parsed = JSON.parse(text)
          // Validación más estricta de la estructura
          if (
            parsed.ingredientes &&
            Array.isArray(parsed.ingredientes) &&
            parsed.recetas &&
            Array.isArray(parsed.recetas) &&
            parsed.recetas.length > 0 && // Al menos una receta
            parsed.recetas.every(
              (r: any) =>
                typeof r.titulo === "string" &&
                typeof r.descripcion === "string" &&
                r.ingredientes &&
                typeof r.ingredientes.disponibles === "object" &&
                Array.isArray(r.ingredientes.disponibles) &&
                typeof r.ingredientes.adicionales === "object" &&
                Array.isArray(r.ingredientes.adicionales) &&
                Array.isArray(r.preparacion) &&
                r.preparacion.length > 0 &&
                typeof r.calorias === "number" &&
                typeof r.tiempo_preparacion === "number" &&
                ["fácil", "media", "difícil"].includes(r.dificultad) &&
                typeof r.porciones === "number",
            )
          ) {
            // Sanitizar y asegurar tipos correctos
            analysisDataToReturn = {
              ingredientes: parsed.ingredientes.map((ing: any) => sanitizeText(String(ing))),
              recetas: parsed.recetas.map((r: any) => ({
                titulo: sanitizeText(String(r.titulo)),
                descripcion: sanitizeText(String(r.descripcion)),
                ingredientes: {
                  disponibles: (r.ingredientes.disponibles || []).map((i: any) => sanitizeText(String(i))),
                  adicionales: (r.ingredientes.adicionales || []).map((i: any) => sanitizeText(String(i))),
                },
                preparacion: (r.preparacion || []).map((p: any) => sanitizeText(String(p))),
                calorias: Number(r.calorias) || 0,
                tiempo_preparacion: Number(r.tiempo_preparacion) || 0,
                dificultad: sanitizeText(String(r.dificultad)) as "fácil" | "media" | "difícil",
                porciones: Number(r.porciones) || 0,
                consejos: sanitizeText(String(r.consejos || "")),
              })),
            }
            responseMessage = "Recetas generadas por IA."
            console.log(`[${requestId}] ✅ JSON de GPT parseado y validado correctamente.`)
          } else {
            throw new Error("JSON de GPT no tiene la estructura esperada o está incompleto.")
          }
        } catch (parseError: any) {
          console.error(`[${requestId}] ❌ Error parseando JSON de GPT: ${parseError.message}`)
          console.log(`[${requestId}] 📄 Texto completo de GPT (para depuración):`, text)
          analysisDataToReturn = EXAMPLE_DATA
          isExampleResponse = true
          responseMessage = "La IA respondió pero el formato no era el esperado. Mostrando datos de ejemplo."
        }
      } catch (gptError: any) {
        console.error(`[${requestId}] ❌ Error llamando a GPT: ${gptError.name} - ${gptError.message}`)
        if (gptError.cause) console.error(`[${requestId}] Causa del error GPT:`, gptError.cause)
        analysisDataToReturn = EXAMPLE_DATA
        isExampleResponse = true
        responseMessage = `Error conectando con la IA (${gptError.name || "Error"}). Mostrando datos de ejemplo.`
      }
    }

    // 6. Guardar en base de datos (si aplica)
    if (userId && !isExampleResponse && analysisDataToReturn?.ingredientes && analysisDataToReturn?.recetas) {
      try {
        console.log(`[${requestId}] 💾 Intentando guardar análisis en Supabase para usuario ${userId}...`)
        const saveResult = await saveAnalysis({
          userId: userId,
          ingredients: analysisDataToReturn.ingredientes,
          recipes: analysisDataToReturn.recetas,
          imageUrl: dataURI, // Considerar subir a Supabase Storage y guardar URL en lugar de dataURI si es muy grande
        })

        if (saveResult.success && saveResult.analysis?.id) {
          analysisDatabaseId = saveResult.analysis.id // Usar el ID de la DB
          console.log(`[${requestId}] ✅ Análisis guardado en Supabase con ID: ${analysisDatabaseId}`)
        } else {
          console.error(`[${requestId}] ❌ Error al guardar en Supabase:`, saveResult.error)
          responseMessage += " (No se pudo guardar el análisis en tu historial)."
        }
      } catch (dbError: any) {
        console.error(`[${requestId}] ❌ Error inesperado al guardar en DB: ${dbError.message}`)
        responseMessage += " (Error inesperado al guardar el historial)."
      }
    } else if (!userId && !isExampleResponse) {
      console.log(`[${requestId}] ⚠️ Usuario no autenticado, no se guarda en Supabase.`)
      responseMessage += " (Regístrate para guardar tu historial)."
    }

    // Asegurar que siempre haya datos para retornar
    if (!analysisDataToReturn) {
      console.warn(`[${requestId}] ‼️ analysisDataToReturn es nulo. Usando datos de ejemplo como fallback final.`)
      analysisDataToReturn = EXAMPLE_DATA
      isExampleResponse = true
      responseMessage = responseMessage || "Ocurrió un error inesperado. Mostrando datos de ejemplo."
    }

    const requestEndTime = Date.now()
    console.log(`[${requestId}] 🎉 Análisis completado. Duración total: ${requestEndTime - requestStartTime}ms.`)
    return NextResponse.json(
      {
        success: true,
        analysisId: analysisDatabaseId,
        data: analysisDataToReturn,
        isExample: isExampleResponse,
        message: responseMessage,
      },
      { headers },
    )
  } catch (error: any) {
    const requestEndTime = Date.now()
    console.error(
      `[${requestId}] 💥 ERROR FATAL en API /analyze (Duración: ${requestEndTime - requestStartTime}ms):`,
      error.message,
    )
    if (error.stack) console.error(`[${requestId}] Stack trace:`, error.stack)

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor.",
        data: EXAMPLE_DATA,
        isExample: true,
        message: `Ocurrió un error grave en el servidor. Por favor, inténtalo de nuevo más tarde. Mostrando datos de ejemplo. (Error: ${error.message})`,
        analysisId: analysisDatabaseId, // Enviar el ID generado incluso en error fatal
      },
      { status: 500 }, // No olvidar los headers si los tienes definidos antes del catch
    )
  }
}

export async function GET(request: NextRequest) {
  // Mantener el GET por si acaso
  return NextResponse.json({ message: "Endpoint /api/analyze solo acepta POST (prueba GET)" }, { status: 405 })
}
