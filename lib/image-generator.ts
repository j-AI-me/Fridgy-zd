import { experimental_generateImage } from "ai"
import { openai } from "@ai-sdk/openai"

// Función simplificada para generar imágenes de recetas con OpenAI
export async function generateRecipeImage(recipeName: string): Promise<string | null> {
  try {
    console.log(`🎨 Generando imagen para: ${recipeName}`)

    // Verificar que tenemos API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ No se encontró OPENAI_API_KEY")
      return null
    }

    // Crear un prompt simple y efectivo
    const prompt = `Una fotografía profesional de ${recipeName}, estilo fotografía culinaria, plato bien presentado, sin texto.`

    // Generar la imagen con OpenAI
    const { images } = await experimental_generateImage({
      model: openai("dall-e-3"),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    })

    if (images && images.length > 0) {
      console.log(`✅ Imagen generada para: ${recipeName}`)
      return images[0].url
    }

    return null
  } catch (error) {
    console.error(`❌ Error al generar imagen:`, error)
    return null
  }
}

// Función principal para obtener imagen de receta
export async function getRecipeImage(recipeName: string): Promise<string> {
  try {
    // 1. Intentar generar con OpenAI
    const generatedImage = await generateRecipeImage(recipeName)
    if (generatedImage) return generatedImage

    // 2. Fallback a placeholder
    return `/placeholder.svg?height=300&width=400&query=food+${encodeURIComponent(recipeName)}`
  } catch (error) {
    console.error("❌ Error al obtener imagen:", error)
    return `/placeholder.svg?height=300&width=400&query=food+${encodeURIComponent(recipeName)}`
  }
}
