import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface IngredientsListProps {
  ingredients: string[]
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  // Asegurarse de que ingredients es un array
  if (!Array.isArray(ingredients)) {
    console.error("IngredientsList: ingredients no es un array", ingredients)
    return <p className="text-muted-foreground text-sm">No se encontraron ingredientes</p>
  }

  if (!ingredients.length) {
    return <p className="text-muted-foreground text-sm">No se encontraron ingredientes</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ingredients.map((ingredient, index) => (
        <div key={index} className="transition-all duration-200">
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <Check className="h-3 w-3 text-green-500" />
            {ingredient}
          </Badge>
        </div>
      ))}
    </div>
  )
}
