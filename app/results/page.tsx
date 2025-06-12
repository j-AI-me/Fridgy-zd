"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { IngredientsList } from "@/components/ingredients-list"
import { RecipeList } from "@/components/recipe-list"
import { useToast } from "@/components/ui/use-toast"
import { secureRetrieve } from "@/lib/secure-storage"
import { enrichRecipesWithCompatibility } from "@/lib/recipe-filter"

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const id = searchParams.get("id")

    if (!id) {
      console.error("No se proporcionó ID en los parámetros de búsqueda")
      toast({
        title: "Error",
        description: "No se pudo cargar los resultados. Volviendo a la página principal.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    console.log("🔍 Obteniendo resultados para ID:", id)

    // Intentar obtener los datos de almacenamiento seguro
    const loadData = async () => {
      try {
        const storedData = secureRetrieve(`data_${id}`)

        if (storedData) {
          console.log("✅ Datos encontrados en almacenamiento seguro")

          // Enriquecer las recetas con información de compatibilidad
          if (storedData.recetas && storedData.recetas.length > 0) {
            const enrichedRecipes = await enrichRecipesWithCompatibility(storedData.recetas)

            // Actualizar los datos con las recetas enriquecidas
            setData({
              ...storedData,
              recetas: enrichedRecipes,
            })
          } else {
            setData(storedData)
          }

          setLoading(false)
        } else {
          console.error("❌ No se encontraron datos en almacenamiento seguro")
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
          description: "Ocurrió un error al cargar los resultados. Volviendo a la página principal.",
          variant: "destructive",
        })
        setTimeout(() => router.push("/"), 2000)
      }
    }

    loadData()
  }, [searchParams, router, toast])

  if (loading) {
    return (
      <>
        <Header title="Cargando..." showBackButton backUrl="/" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando resultados...</p>
          </div>
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Header title="Error" showBackButton backUrl="/" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive mb-2">No se encontraron resultados</p>
            <p className="text-muted-foreground">Volviendo a la página principal...</p>
          </div>
        </div>
      </>
    )
  }

  const { ingredientes, recetas } = data

  return (
    <>
      <Header title="Resultados" showBackButton backUrl="/" />
      <div className="flex-1 p-4">
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Ingredientes encontrados</h2>
          <IngredientsList ingredients={ingredientes} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Recetas sugeridas</h2>
          <RecipeList recipes={recetas} fridgeId={searchParams.get("id") || ""} />
        </section>
      </div>
    </>
  )
}
