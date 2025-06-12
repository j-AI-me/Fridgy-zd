"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFavoriteRecipes } from "@/lib/actions"
import { Loader2, Search, ChefHat, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"

interface FavoritesListProps {
  limit?: number
  showSearch?: boolean
  showFilters?: boolean
  onRecipeSelect?: (recipe: any) => void
}

export function FavoritesList({ limit, showSearch = false, showFilters = false, onRecipeSelect }: FavoritesListProps) {
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true)
        const result = await getFavoriteRecipes()
        if (result.success) {
          setFavorites(result.favorites)
          setFilteredFavorites(result.favorites)
        }
      } catch (error) {
        console.error("Error al obtener favoritos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  useEffect(() => {
    // Aplicar filtros
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = favorites.filter((favorite) => {
        const recipe = favorite.recipe
        if (!recipe) return false

        return (
          recipe.title?.toLowerCase().includes(term) ||
          recipe.description?.toLowerCase().includes(term) ||
          recipe.available_ingredients?.some((ingredient: string) => ingredient.toLowerCase().includes(term)) ||
          recipe.additional_ingredients?.some((ingredient: string) => ingredient.toLowerCase().includes(term))
        )
      })
      setFilteredFavorites(filtered)
    } else {
      setFilteredFavorites(favorites)
    }
  }, [searchTerm, favorites])

  const handleRecipeClick = (favorite: any) => {
    if (onRecipeSelect) {
      onRecipeSelect(favorite.recipe)
    } else {
      // Navegar a la página de detalle de receta
      router.push(`/recipe/${favorite.recipe.id}`)
    }
  }

  const handleRemoveFavorite = (recipeId: string) => {
    // Actualizar la lista local
    setFavorites(favorites.filter((favorite) => favorite.recipe.id !== recipeId))
    setFilteredFavorites(filteredFavorites.filter((favorite) => favorite.recipe.id !== recipeId))
  }

  const displayedFavorites = limit ? filteredFavorites.slice(0, limit) : filteredFavorites

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tienes recetas favoritas</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/app")}>
          <ChefHat className="h-4 w-4 mr-2" />
          Descubrir recetas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar recetas o ingredientes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {displayedFavorites.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No se encontraron resultados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedFavorites.map((favorite) => {
            const recipe = favorite.recipe
            if (!recipe) return null

            // Generar calorías si no existen
            const calories = recipe.calories || Math.floor(Math.random() * 400) + 200

            return (
              <Card
                key={favorite.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRecipeClick(favorite)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <FavoriteButton
                      recipeId={recipe.id}
                      initialIsFavorite={true}
                      onToggle={(isFavorite) => {
                        if (!isFavorite) handleRemoveFavorite(recipe.id)
                      }}
                    />
                  </div>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-sm text-muted-foreground">
                      {recipe.available_ingredients?.length || 0} ingredientes disponibles
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {recipe.additional_ingredients?.length || 0} ingredientes adicionales
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm flex items-center text-red-500">
                      <Flame className="h-3 w-3 mr-1" />
                      {calories} kcal
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Ingredientes principales:</h4>
                    <div className="flex flex-wrap gap-1">
                      {recipe.available_ingredients?.slice(0, 5).map((ingredient: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-green-50">
                          {ingredient}
                        </Badge>
                      ))}
                      {recipe.available_ingredients?.length > 5 && (
                        <Badge variant="outline">+{recipe.available_ingredients.length - 5} más</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {limit && filteredFavorites.length > limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/profile?tab=favorites")}>
            Ver todos los favoritos
          </Button>
        </div>
      )}
    </div>
  )
}
