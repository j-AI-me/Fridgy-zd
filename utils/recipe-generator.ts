"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// Tipo para las recetas
export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  image_url: string
  preparation_time: number
  difficulty: "easy" | "medium" | "hard"
  calories: number
  tags: string[]
}

// Función para generar recetas basadas en ingredientes
export async function generateRecipes(ingredients: string[]) {
  console.log("👨‍🍳 Generando recetas con ingredientes:", ingredients)

  try {
    // Aquí iría la lógica para generar recetas con un servicio de IA
    // Por ahora, simulamos una respuesta

    // Simulamos un tiempo de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Recetas de ejemplo que "generamos" con los ingredientes
    const generatedRecipes: Recipe[] = [
      {
        id: "rec_" + Date.now(),
        title: "Ensalada mediterránea",
        description: "Una refrescante ensalada con ingredientes mediterráneos",
        ingredients: [
          "2 tomates",
          "1 cebolla",
          "1 pimiento",
          "100g de queso feta",
          "Aceitunas negras",
          "2 cucharadas de aceite de oliva",
          "Sal y pimienta al gusto",
        ],
        instructions: [
          "Cortar los tomates, la cebolla y el pimiento en trozos pequeños",
          "Desmigar el queso feta",
          "Mezclar todos los ingredientes en un bol",
          "Aliñar con aceite de oliva, sal y pimienta",
        ],
        image_url: "/placeholder-m4j7z.png",
        preparation_time: 15,
        difficulty: "easy",
        calories: 320,
        tags: ["vegetariano", "saludable", "rápido"],
      },
      {
        id: "rec_" + (Date.now() + 1),
        title: "Pasta con salsa de tomate casera",
        description: "Una deliciosa pasta con salsa de tomate casera",
        ingredients: [
          "250g de pasta",
          "4 tomates",
          "1 cebolla",
          "2 dientes de ajo",
          "2 cucharadas de aceite de oliva",
          "Albahaca fresca",
          "Sal y pimienta al gusto",
        ],
        instructions: [
          "Cocer la pasta según las instrucciones del paquete",
          "Mientras tanto, sofreír la cebolla y el ajo en aceite de oliva",
          "Añadir los tomates cortados y cocinar a fuego lento durante 15 minutos",
          "Triturar la salsa y añadir la albahaca",
          "Mezclar la pasta con la salsa",
        ],
        image_url: "/placeholder.svg?height=300&width=400&query=pasta+con+salsa+de+tomate",
        preparation_time: 30,
        difficulty: "medium",
        calories: 450,
        tags: ["vegetariano", "italiano"],
      },
    ]

    // Guardamos las recetas en la base de datos
    await saveRecipesToDatabase(generatedRecipes)

    return {
      success: true,
      recipes: generatedRecipes,
    }
  } catch (error) {
    console.error("❌ Error al generar recetas:", error)
    return {
      success: false,
      error: "No se pudieron generar recetas. Por favor, inténtalo de nuevo.",
    }
  }
}

// Función auxiliar para guardar las recetas en la base de datos
async function saveRecipesToDatabase(recipes: Recipe[]) {
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

  // Guardar cada receta en la base de datos
  for (const recipe of recipes) {
    const { error } = await supabase.from("recipes").upsert({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image_url: recipe.image_url,
      preparation_time: recipe.preparation_time,
      difficulty: recipe.difficulty,
      calories: recipe.calories,
      tags: recipe.tags,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error al guardar receta:", error)
    }
  }

  // Revalidar la ruta para actualizar la UI
  revalidatePath("/results")
}
