"use server"

import { getUserMetadata } from "@/lib/user-profile"

// Tipo para las recetas
type Recipe = {
  id?: string
  titulo: string
  descripcion: string
  ingredientes: {
    disponibles: string[]
    adicionales: string[]
  }
  preparacion: string[]
}

// Palabras clave para identificar ingredientes relacionados con preferencias dietéticas
const DIETARY_KEYWORDS: Record<string, string[]> = {
  Vegetariano: ["carne", "pollo", "cerdo", "res", "ternera", "jamón", "tocino", "salchicha", "chorizo"],
  Vegano: [
    "carne",
    "pollo",
    "cerdo",
    "res",
    "ternera",
    "jamón",
    "tocino",
    "salchicha",
    "chorizo",
    "leche",
    "queso",
    "yogur",
    "crema",
    "mantequilla",
    "huevo",
    "miel",
  ],
  "Sin gluten": ["trigo", "harina", "pan", "pasta", "cebada", "centeno", "avena", "galletas"],
  "Sin lactosa": ["leche", "queso", "yogur", "crema", "mantequilla", "helado", "lácteo"],
  Keto: ["azúcar", "harina", "pan", "pasta", "arroz", "patata", "papa", "maíz", "frijol"],
  Paleo: ["lácteo", "legumbre", "cereal", "azúcar", "procesado"],
  "Bajo en carbohidratos": ["azúcar", "harina", "pan", "pasta", "arroz", "patata", "papa", "maíz", "frijol"],
  "Bajo en sodio": ["sal", "salado", "embutido", "conserva", "salsa de soja", "salsa soja"],
  "Bajo en azúcar": ["azúcar", "miel", "jarabe", "dulce", "caramelo", "chocolate"],
  Mediterránea: [], // La dieta mediterránea es inclusiva, no excluye ingredientes específicos
}

// Función para verificar si una receta es compatible con las preferencias dietéticas
export async function isRecipeCompatibleWithPreferences(recipe: Recipe): Promise<{
  compatible: boolean
  incompatibleReasons: string[]
  compatibilityScore: number
}> {
  try {
    // Obtener las preferencias del usuario
    const userMetadata = await getUserMetadata()
    const dietaryPreferences = userMetadata.dietaryPreferences || []
    const allergies = userMetadata.allergies || []

    // Si no hay preferencias ni alergias, todas las recetas son compatibles
    if (dietaryPreferences.length === 0 && allergies.length === 0) {
      return { compatible: true, incompatibleReasons: [], compatibilityScore: 1 }
    }

    // Combinar todos los ingredientes de la receta
    const allIngredients = [...recipe.ingredientes.disponibles, ...recipe.ingredientes.adicionales].map((ingredient) =>
      ingredient.toLowerCase(),
    )

    // Verificar alergias (prioridad alta)
    const allergyConflicts = allergies.filter((allergy) => {
      const allergyLower = allergy.toLowerCase()
      return allIngredients.some((ingredient) => ingredient.includes(allergyLower))
    })

    // Si hay conflictos de alergias, la receta no es compatible
    if (allergyConflicts.length > 0) {
      return {
        compatible: false,
        incompatibleReasons: allergyConflicts.map((allergy) => `Contiene ${allergy}`),
        compatibilityScore: 0,
      }
    }

    // Verificar preferencias dietéticas
    const dietaryConflicts: string[] = []

    for (const preference of dietaryPreferences) {
      const keywords = DIETARY_KEYWORDS[preference] || []

      for (const keyword of keywords) {
        if (allIngredients.some((ingredient) => ingredient.includes(keyword))) {
          dietaryConflicts.push(`No compatible con ${preference}`)
          break
        }
      }
    }

    // Calcular puntuación de compatibilidad (0-1)
    const totalPreferences = dietaryPreferences.length
    const compatiblePreferences = totalPreferences - dietaryConflicts.length
    const compatibilityScore = totalPreferences > 0 ? compatiblePreferences / totalPreferences : 1

    return {
      compatible: dietaryConflicts.length === 0,
      incompatibleReasons: dietaryConflicts,
      compatibilityScore,
    }
  } catch (error) {
    console.error("Error al verificar compatibilidad de receta:", error)
    // En caso de error, asumimos que la receta es compatible
    return { compatible: true, incompatibleReasons: [], compatibilityScore: 1 }
  }
}

// Función para filtrar y ordenar recetas según preferencias
export async function filterAndSortRecipesByPreference(recipes: Recipe[]): Promise<{
  compatibleRecipes: Recipe[]
  incompatibleRecipes: Recipe[]
}> {
  try {
    const results = await Promise.all(
      recipes.map(async (recipe) => {
        const compatibility = await isRecipeCompatibleWithPreferences(recipe)
        return {
          recipe,
          ...compatibility,
        }
      }),
    )

    // Separar recetas compatibles e incompatibles
    const compatibleRecipes = results
      .filter((result) => result.compatible)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore) // Ordenar por puntuación de compatibilidad
      .map((result) => result.recipe)

    const incompatibleRecipes = results
      .filter((result) => !result.compatible)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .map((result) => result.recipe)

    return {
      compatibleRecipes,
      incompatibleRecipes,
    }
  } catch (error) {
    console.error("Error al filtrar y ordenar recetas:", error)
    // En caso de error, devolvemos las recetas sin filtrar
    return {
      compatibleRecipes: recipes,
      incompatibleRecipes: [],
    }
  }
}

// Función para enriquecer recetas con información de compatibilidad
export async function enrichRecipesWithCompatibility(recipes: Recipe[]): Promise<
  (Recipe & {
    compatible?: boolean
    incompatibleReasons?: string[]
    compatibilityScore?: number
  })[]
> {
  try {
    return await Promise.all(
      recipes.map(async (recipe) => {
        const compatibility = await isRecipeCompatibleWithPreferences(recipe)
        return {
          ...recipe,
          ...compatibility,
        }
      }),
    )
  } catch (error) {
    console.error("Error al enriquecer recetas con compatibilidad:", error)
    // En caso de error, devolvemos las recetas sin información de compatibilidad
    return recipes
  }
}
