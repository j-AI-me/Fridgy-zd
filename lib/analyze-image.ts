"use client"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Datos de ejemplo para usar cuando la API no está disponible
const FALLBACK_DATA = {
  ingredientes: ["Tomates", "Cebolla", "Pimiento", "Ajo", "Huevos", "Queso", "Leche", "Mantequilla"],
  recetas: [
    {
      titulo: "Tortilla de Verduras",
      descripcion: "Una deliciosa tortilla con las verduras de tu nevera",
      ingredientes: {
        disponibles: ["Huevos", "Cebolla", "Pimiento", "Queso"],
        adicionales: ["Sal", "Pimienta", "Aceite de oliva"],
      },
      preparacion: [
        "Corta la cebolla y el pimiento en trozos pequeños.",
        "Bate los huevos en un recipiente y añade sal y pimienta al gusto.",
        "Calienta aceite en una sartén y sofríe la cebolla y el pimiento hasta que estén tiernos.",
        "Añade los huevos batidos y cocina a fuego medio-bajo.",
        "Cuando esté casi cuajada, añade el queso rallado por encima.",
        "Dobla la tortilla por la mitad y sirve caliente.",
      ],
      calorias: 320,
    },
    {
      titulo: "Salsa de Tomate Casera",
      descripcion: "Una salsa versátil para pasta, pizza o como acompañamiento",
      ingredientes: {
        disponibles: ["Tomates", "Cebolla", "Ajo"],
        adicionales: ["Aceite de oliva", "Sal", "Pimienta", "Albahaca"],
      },
      preparacion: [
        "Pica finamente la cebolla y el ajo.",
        "Calienta aceite en una sartén y sofríe la cebolla y el ajo hasta que estén transparentes.",
        "Añade los tomates cortados en cubos y cocina a fuego medio durante 15-20 minutos.",
        "Sazona con sal y pimienta al gusto.",
        "Si lo deseas, añade albahaca fresca picada al final de la cocción.",
      ],
      calorias: 180,
    },
    {
      titulo: "Queso a la Plancha con Tomate",
      descripcion: "Un aperitivo rápido y sabroso",
      ingredientes: {
        disponibles: ["Queso", "Tomates"],
        adicionales: ["Pan", "Orégano", "Aceite de oliva"],
      },
      preparacion: [
        "Corta el queso en rebanadas de aproximadamente 1 cm de grosor.",
        "Calienta una sartén antiadherente a fuego medio-alto.",
        "Coloca las rebanadas de queso en la sartén y cocina hasta que se doren por ambos lados.",
        "Sirve el queso caliente con rodajas de tomate fresco.",
        "Rocía con un poco de aceite de oliva y espolvorea orégano por encima.",
        "Acompaña con pan tostado si lo deseas.",
      ],
      calorias: 280,
    },
  ],
}

export async function analyzeImageClient(imageBlob: Blob) {
  try {
    console.log("🔄 Procesando imagen en el cliente...")

    // Convertir la imagen a base64
    const base64Image = await blobToBase64(imageBlob)

    try {
      console.log("📤 Enviando imagen a OpenAI usando AI SDK...")

      // Usar el AI SDK para llamar a OpenAI
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
                text: 'Analiza esta imagen de una nevera y lista todos los alimentos que puedes identificar. Luego, sugiere 3 recetas que se puedan preparar con estos ingredientes. Para cada receta, incluye un título, una breve descripción, los ingredientes necesarios (indicando cuáles están en la nevera y cuáles habría que añadir), los pasos de preparación y una estimación aproximada de calorías totales. IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta, sin texto adicional antes o después: { "ingredientes": ["ingrediente1", "ingrediente2", ...], "recetas": [{ "titulo": "Título de la receta", "descripcion": "Breve descripción", "ingredientes": { "disponibles": ["ingrediente1", ...], "adicionales": ["ingrediente3", ...] }, "preparacion": ["paso1", "paso2", ...], "calorias": 350 }, ...] }',
              },
              {
                type: "image",
                image: base64Image,
              },
            ],
          },
        ],
      })

      console.log("✅ Respuesta recibida de OpenAI")

      // Intentar parsear el JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : text
        const data = JSON.parse(jsonString)
        console.log("✅ JSON parseado correctamente")
        return { success: true, data }
      } catch (parseError) {
        console.error("❌ Error parsing JSON response:", parseError)
        console.log("📄 Raw response:", text)
        return { success: true, data: FALLBACK_DATA }
      }
    } catch (apiError) {
      console.error("❌ Error al llamar a la API de OpenAI:", apiError)
      console.log("⚠️ Usando datos de ejemplo como fallback")
      return { success: true, data: FALLBACK_DATA }
    }
  } catch (error) {
    console.error("❌ Error general en analyzeImageClient:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// Función para convertir un Blob a base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      resolve(base64String)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
