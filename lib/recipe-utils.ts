/**
 * Genera un ID único y válido para una receta
 */
export function generateRecipeId(recipe: any, index: number, fridgeId?: string): string {
  // Si la receta ya tiene un ID válido, usarlo
  if (recipe.id && typeof recipe.id === "string" && recipe.id.length > 0) {
    return recipe.id
  }

  // Generar un ID basado en el contenido de la receta
  const baseId = fridgeId || "default"
  const timestamp = Date.now()
  const recipeHash = recipe.titulo ? recipe.titulo.toLowerCase().replace(/\s+/g, "-") : "recipe"

  const generatedId = `${baseId}_${recipeHash}_${index}_${timestamp}`

  console.log("🆔 ID generado para receta:", {
    recipe: recipe.titulo || "Sin título",
    index,
    fridgeId,
    generatedId,
  })

  return generatedId
}

/**
 * Valida si un ID de receta es válido
 */
export function isValidRecipeId(id: any): boolean {
  return typeof id === "string" && id.length > 0 && id !== "undefined" && id !== "null"
}

/**
 * Valida si un fridgeId es válido
 */
export function isValidFridgeId(id: any): boolean {
  return typeof id === "string" && id.length > 0 && id !== "undefined" && id !== "null"
}
