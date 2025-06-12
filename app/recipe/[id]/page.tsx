"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { useToast } from "@/components/ui/use-toast"
import { getAnalysisData } from "@/lib/secure-storage"
import { RecipeDetail } from "@/components/recipe-detail"
import { isRecipeCompatibleWithPreferences } from "@/lib/recipe-filter"

export default function RecipePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [recipe, setRecipe] = useState<any>(null)

  useEffect(() => {
    const recipeId = Number.parseInt(params.id as string)
    const fridgeId = searchParams.get("id") || "default-fridge"

    console.log("🔍 RecipePage - Parámetros:", {
      recipeId,
      fridgeId,
      params,
      searchParams: Object.fromEntries(searchParams),
    })

    if (isNaN(recipeId)) {
      console.error("❌ ID de receta inválido:", params.id)
      toast({
        title: "Error",
        description: "No se pudo cargar la receta. ID inválido.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    console.log("🔍 Obteniendo receta:", recipeId, "para nevera:", fridgeId)

    // Intentar obtener los datos de almacenamiento seguro
    const loadRecipe = async () => {
      try {
        console.log("📦 Cargando datos del análisis...")
        const storedData = getAnalysisData(fridgeId)

        if (storedData) {
          console.log("✅ Datos encontrados:", storedData)

          if (storedData.recetas && storedData.recetas[recipeId]) {
            const baseRecipe = storedData.recetas[recipeId]
            console.log("🍳 Receta encontrada:", baseRecipe.titulo)

            // Enriquecer la receta con información de compatibilidad
            const compatibility = await isRecipeCompatibleWithPreferences(baseRecipe)
            const enrichedRecipe = {
              ...baseRecipe,
              ...compatibility,
            }

            setRecipe(enrichedRecipe)
            setLoading(false)
          } else {
            console.error("❌ Receta no encontrada en índice:", recipeId)
            console.log("📋 Recetas disponibles:", Object.keys(storedData.recetas || {}))
            toast({
              title: "Error",
              description: "No se encontró la receta solicitada. Volviendo a los resultados.",
              variant: "destructive",
            })
            setTimeout(() => router.push(`/results?id=${fridgeId}`), 2000)
          }
        } else {
          console.error("❌ No se encontraron datos para fridgeId:", fridgeId)
          toast({
            title: "Error",
            description: "No se encontraron resultados. Volviendo a la página principal.",
            variant: "destructive",
          })
          setTimeout(() => router.push("/"), 2000)
        }
      } catch (error) {
        console.error("❌ Error al obtener datos:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar la receta. Volviendo a la página principal.",
          variant: "destructive",
        })
        setTimeout(() => router.push("/"), 2000)
      }
    }

    loadRecipe()
  }, [params, searchParams, router, toast])

  if (loading) {
    return (
      <>
        <Header title="Cargando..." showBackButton backUrl={`/results?id=${searchParams.get("id") || ""}`} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando receta...</p>
          </div>
        </div>
      </>
    )
  }

  if (!recipe) {
    return (
      <>
        <Header title="Error" showBackButton backUrl={`/results?id=${searchParams.get("id") || ""}`} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive mb-2">No se encontró la receta</p>
            <p className="text-muted-foreground">Volviendo a los resultados...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Receta" showBackButton backUrl={`/results?id=${searchParams.get("id") || ""}`} />
      <div className="flex-1 p-4">
        <RecipeDetail recipe={recipe} />
      </div>
    </>
  )
}
