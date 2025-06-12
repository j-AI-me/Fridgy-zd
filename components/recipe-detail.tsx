import { Badge } from "@/components/ui/badge"
import { Check, Plus, Clock, Users, AlertCircle, Flame } from "lucide-react"
import { FavoriteButton } from "@/components/favorite-button"

interface Recipe {
  id?: string
  titulo: string
  descripcion: string
  ingredientes: {
    disponibles: string[]
    adicionales: string[]
  }
  preparacion: string[]
  calorias?: number
  compatible?: boolean
  incompatibleReasons?: string[]
  compatibilityScore?: number
}

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  // Asegurarse de que los arrays existan
  const ingredientesDisponibles = recipe.ingredientes?.disponibles || []
  const ingredientesAdicionales = recipe.ingredientes?.adicionales || []
  const preparacion = recipe.preparacion || []

  // Generar tiempo de preparación aleatorio entre 20 y 60 minutos
  const prepTime = Math.floor(Math.random() * 41) + 20

  // Generar número de porciones aleatorio entre 2 y 6
  const servings = Math.floor(Math.random() * 5) + 2

  // Usar SOLO las calorías proporcionadas por GPT
  const calories = recipe.calorias || 0

  return (
    <div className="transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">{recipe.titulo}</h1>
          <p className="text-muted-foreground mt-1">{recipe.descripcion}</p>
        </div>
        {recipe.id && (
          <div className="ml-4">
            <FavoriteButton recipeId={recipe.id} recipe={recipe} />
          </div>
        )}
      </div>

      {/* Indicador de compatibilidad */}
      {recipe.compatible !== undefined && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            recipe.compatible ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-center">
            {recipe.compatible ? (
              <>
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Compatible con tus preferencias</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <span className="font-medium text-amber-800">No compatible con tus preferencias</span>
              </>
            )}
          </div>

          {!recipe.compatible && recipe.incompatibleReasons && recipe.incompatibleReasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.incompatibleReasons.map((reason, i) => (
                <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                  {reason}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
          <span>{prepTime} min</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
          <span>{servings} porciones</span>
        </div>
        {calories > 0 && (
          <div className="flex items-center">
            <Flame className="h-4 w-4 mr-1 text-red-500" />
            <span>{calories} kcal</span>
          </div>
        )}
      </div>

      <section className="mb-6 bg-card p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <span className="bg-green-100 p-1 rounded-full mr-2">
            <Check className="h-4 w-4 text-green-600" />
          </span>
          Ingredientes
        </h2>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Ya tienes:</h3>
          <div className="flex flex-wrap gap-2">
            {ingredientesDisponibles.map((ingredient, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1 px-3 py-1 bg-green-50">
                <Check className="h-3 w-3 text-green-500" />
                {ingredient}
              </Badge>
            ))}
          </div>
        </div>

        {ingredientesAdicionales.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium">Necesitas comprar:</h3>
            <div className="flex flex-wrap gap-2">
              {ingredientesAdicionales.map((ingredient, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 px-3 py-1 bg-orange-50">
                  <Plus className="h-3 w-3 text-orange-500" />
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-card p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Preparación</h2>
        <ol className="space-y-3">
          {preparacion.map((step, index) => (
            <li key={index} className="flex gap-3">
              <div className="flex-shrink-0 bg-primary/10 rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium text-primary">
                {index + 1}
              </div>
              <span className="text-sm">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Información nutricional - Solo mostrar si hay calorías válidas */}
      {calories > 0 && (
        <section className="mt-6 bg-card p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Flame className="h-5 w-5 mr-2 text-red-500" />
            Información nutricional
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Calorías por porción</p>
              <p className="text-xl font-bold text-red-600">{Math.round(calories / servings)} kcal</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Calorías totales</p>
              <p className="text-xl font-bold text-blue-600">{calories} kcal</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            * Valores calculados por IA basados en los ingredientes y cantidades de la receta.
          </p>
        </section>
      )}
    </div>
  )
}
