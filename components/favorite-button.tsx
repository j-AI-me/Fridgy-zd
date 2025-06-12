"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { secureRetrieve, secureStore } from "@/lib/secure-storage"

interface Recipe {
  id?: string
  titulo?: string
  title?: string
  descripcion?: string
  description?: string
}

interface FavoriteButtonProps {
  recipeId: string
  recipe?: Recipe
  initialIsFavorite?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
}

export function FavoriteButton({
  recipeId,
  recipe,
  initialIsFavorite = false,
  size = "sm",
  variant = "ghost",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Cargar estado inicial desde almacenamiento local
  useEffect(() => {
    const loadFavoriteStatus = () => {
      try {
        const favorites = secureRetrieve("favorites") || []
        const isAlreadyFavorite = favorites.some((fav: any) => fav.id === recipeId)
        setIsFavorite(isAlreadyFavorite)
      } catch (error) {
        console.error("Error al cargar estado de favorito:", error)
      }
    }

    loadFavoriteStatus()
  }, [recipeId])

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    console.log("🔍 FavoriteButton - Datos recibidos:", { recipeId, recipe })

    if (!recipeId || recipeId === "undefined" || recipeId === "null") {
      console.error("❌ ID de receta inválido:", { recipeId, recipe })
      toast({
        title: "Error",
        description: "No se pudo actualizar favorito. ID de receta inválido.",
        variant: "destructive",
      })
      return
    }

    console.log("✅ ID de receta válido, continuando...")

    setIsLoading(true)

    try {
      // Actualizar estado local inmediatamente para mejor UX
      setIsFavorite((prev) => !prev)

      // Simular retraso de red
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Actualizar almacenamiento local
      const favorites = secureRetrieve("favorites") || []

      if (isFavorite) {
        // Eliminar de favoritos
        const updatedFavorites = favorites.filter((fav: any) => fav.id !== recipeId)
        secureStore("favorites", updatedFavorites)
      } else {
        // Añadir a favoritos
        const recipeToAdd = {
          id: recipeId,
          recipe: recipe || { id: recipeId, title: "Receta favorita" },
          created_at: new Date().toISOString(),
        }
        secureStore("favorites", [...favorites, recipeToAdd])
      }

      toast({
        title: isFavorite ? "Eliminado de favoritos" : "Añadido a favoritos",
        description: isFavorite
          ? "La receta se ha eliminado de tus favoritos"
          : "La receta se ha añadido a tus favoritos",
        variant: "default",
      })
    } catch (error) {
      console.error("Error al actualizar favorito:", error)
      // Revertir cambio en caso de error
      setIsFavorite((prev) => !prev)
      toast({
        title: "Error",
        description: "No se pudo actualizar favorito. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Determinar tamaño del icono según la prop size
  const getIconSize = () => {
    switch (size) {
      case "sm":
        return 16
      case "md":
        return 20
      case "lg":
        return 24
      default:
        return 16
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`rounded-full ${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground"} ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={toggleFavorite}
      disabled={isLoading}
      aria-label={isFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
    >
      <Heart
        size={getIconSize()}
        className={`${isFavorite ? "fill-current" : "fill-none"} transition-all duration-300 ${
          isLoading ? "animate-pulse" : ""
        }`}
      />
    </Button>
  )
}

export default FavoriteButton
