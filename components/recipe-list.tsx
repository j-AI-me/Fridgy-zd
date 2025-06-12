"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "./favorite-button"
import { secureStore } from "@/lib/secure-storage"

interface RecipeListProps {
  recipes: any[]
  fridgeId: string
}

export function RecipeList({ recipes, fridgeId }: RecipeListProps) {
  const router = useRouter()
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)

  const handleViewRecipe = (recipe: any) => {
    // Guardar la receta seleccionada en el almacenamiento seguro
    secureStore(`recipe_${recipe.id}`, recipe)

    // Navegar a la página de detalle de la receta
    router.push(`/recipe/${recipe.id}?fridge=${fridgeId}`)
  }

  if (!recipes || recipes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No se encontraron recetas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <Card key={recipe.id || recipe.titulo} className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 h-48 md:h-auto relative">
              <Image
                src={`/abstract-geometric-shapes.png?height=300&width=400&query=${encodeURIComponent(recipe.titulo)}`}
                alt={recipe.titulo}
                fill
                className="object-cover"
              />
            </div>
            <div className="md:w-2/3 p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold mb-2">{recipe.titulo}</h3>
                <FavoriteButton recipeId={recipe.id || recipe.titulo} recipe={recipe} />
              </div>

              <p className="text-sm text-muted-foreground mb-3">{recipe.descripcion}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.compatibilidad && (
                  <Badge
                    variant={
                      recipe.compatibilidad >= 80 ? "success" : recipe.compatibilidad >= 50 ? "warning" : "outline"
                    }
                  >
                    {recipe.compatibilidad}% compatible
                  </Badge>
                )}
                {recipe.calorias && <Badge variant="outline">{recipe.calorias} calorías</Badge>}
              </div>

              <Button onClick={() => handleViewRecipe(recipe)} className="w-full md:w-auto">
                Ver receta
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
