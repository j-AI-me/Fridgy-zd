"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { IngredientsList } from "@/components/ingredients-list"
import { RecipeList } from "@/components/recipe-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { secureRetrieve } from "@/lib/secure-storage" // Importar secureRetrieve

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [isExample, setIsExample] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const analysisId = searchParams.get("id")

    if (!analysisId) {
      console.log("❌ No hay ID de análisis, redirigiendo...")
      router.push("/app")
      return
    }

    console.log("🔍 Cargando análisis:", analysisId)

    // Cargar datos usando la función secureRetrieve
    try {
      const storedData = secureRetrieve(`analysis_${analysisId}`)

      if (storedData) {
        console.log("✅ Datos cargados:", {
          hasData: !!storedData.data,
          isExample: storedData.isExample,
          message: storedData.message,
        })

        setData(storedData.data) // Los datos de la receta están en storedData.data
        setIsExample(storedData.isExample || false)
        setMessage(storedData.message || "")
      } else {
        console.log("❌ No se encontraron datos para:", analysisId)
        router.push("/app")
        return
      }
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
      router.push("/app")
      return
    }

    setLoading(false)
  }, [searchParams, router])

  if (loading) {
    return (
      <>
        <Header title="Cargando..." showBackButton backUrl="/app" />
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
        <Header title="Error" showBackButton backUrl="/app" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive mb-2">No se encontraron resultados</p>
            <p className="text-muted-foreground">Volviendo a la página principal...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Resultados" showBackButton backUrl="/app" />
      <div className="flex-1 p-4">
        {/* Aviso si son datos de ejemplo */}
        {isExample && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>⚠️ Datos de Ejemplo</AlertTitle>
            <AlertDescription>
              {message} Las recetas mostradas son ejemplos, no están basadas en tu imagen real.
            </AlertDescription>
          </Alert>
        )}

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Ingredientes encontrados</h2>
          <IngredientsList ingredients={data.ingredientes || []} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Recetas sugeridas</h2>
          <RecipeList recipes={data.recetas || []} fridgeId={searchParams.get("id") || ""} />
        </section>
      </div>
    </>
  )
}
