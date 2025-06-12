"use client"

import { useState, useEffect } from "react"
import { CameraComponent } from "@/components/camera" // Importar CameraComponent
import { IngredientsList } from "@/components/ingredients-list"
import { RecipeList } from "@/components/recipe-list"
import { RecipeDetail } from "@/components/recipe-detail"
import { HistoryList } from "@/components/history-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Home, History, Heart, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { canPerformAnalysis } from "@/lib/guest-mode"
import { Header } from "@/components/header"

// Datos de ejemplo para usar cuando no hay autenticación
const EXAMPLE_DATA = {
  analyses: [
    {
      id: "1",
      created_at: new Date().toISOString(),
      ingredientes: ["Tomates", "Cebolla", "Pimiento", "Ajo", "Huevos", "Queso"],
      recetas: [
        {
          id: "1",
          titulo: "Tortilla de Verduras",
          descripcion: "Una deliciosa tortilla con las verduras de tu nevera",
          ingredientes: {
            disponibles: ["Huevos", "Cebolla", "Pimiento", "Queso"],
            adicionales: ["Sal", "Pimienta", "Aceite de oliva"],
          },
          preparacion: [
            "Corta la cebolla y el pimiento en trozos pequeños.",
            "Bate los huevos en un recipiente y añade sal y pimienta al gusto.",
            "Calienta aceite en una sartén y sofríe la cebolla y el pimiento hasta que estén tiernos.",
            "Añade los huevos batidos y cocina a fuego medio-bajo.",
            "Cuando esté casi cuajada, añade el queso rallado por encima.",
            "Dobla la tortilla por la mitad y sirve caliente.",
          ],
        },
      ],
    },
  ],
  favorites: [
    {
      id: "1",
      recipe: {
        id: "1",
        titulo: "Tortilla de Verduras",
        descripcion: "Una deliciosa tortilla con las verduras de tu nevera",
        ingredientes: {
          disponibles: ["Huevos", "Cebolla", "Pimiento", "Queso"],
          adicionales: ["Sal", "Pimienta", "Aceite de oliva"],
        },
        preparacion: [
          "Corta la cebolla y el pimiento en trozos pequeños.",
          "Bate los huevos en un recipiente y añade sal y pimienta al gusto.",
          "Calienta aceite en una sartén y sofríe la cebolla y el pimiento hasta que estén tiernos.",
          "Añade los huevos batidos y cocina a fuego medio-bajo.",
          "Cuando esté casi cuajada, añade el queso rallado por encima.",
          "Dobla la tortilla por la mitad y sirve caliente.",
        ],
      },
    },
  ],
}

// Tipos de datos
type Recipe = {
  id?: string
  titulo: string
  descripcion: string
  ingredientes: {
    disponibles: string[]
    adicionales: string[]
  }
  preparacion: string[]
  compatible?: boolean
  incompatibleReasons?: string[]
  compatibilityScore?: number
}

type AnalysisResult = {
  id?: string
  ingredientes: string[]
  recetas: Recipe[]
  created_at?: string
}

// Vistas de la aplicación
type AppView = "home" | "results" | "recipe"

export default function AppPage() {
  console.log("🔍 Renderizando AppPage")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isLoaded, isSignedIn, user } = useUser()

  // Estado para controlar la vista actual
  const [currentView, setCurrentView] = useState<AppView>("home")

  // Estado para almacenar los resultados del análisis
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Estado para almacenar la receta seleccionada
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  // Estado para almacenar el historial de análisis
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([])

  // Estado para almacenar las recetas favoritas
  const [favoriteRecipes, setFavoriteRecipes] = useState<{ id: string; recipe: Recipe }[]>([])

  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState("home")

  // Estado para controlar la carga
  const [isLoading, setIsLoading] = useState(true)

  // Estado para controlar si el usuario puede realizar análisis
  const [canAnalyze, setCanAnalyze] = useState(true)

  // Verificar si el usuario puede realizar análisis
  useEffect(() => {
    if (!isSignedIn) {
      const canPerform = canPerformAnalysis()
      setCanAnalyze(canPerform)
    } else {
      setCanAnalyze(true)
    }
  }, [isSignedIn])

  // Cargar datos de ejemplo
  useEffect(() => {
    console.log("📊 Cargando datos de ejemplo")
    setIsLoading(true)

    // Verificar si hay un parámetro de pestaña en la URL
    const tabParam = searchParams.get("tab")
    if (tabParam && ["home", "history", "favorites"].includes(tabParam)) {
      setActiveTab(tabParam)
    }

    // Simular carga de datos
    setTimeout(() => {
      setAnalysisHistory(EXAMPLE_DATA.analyses)
      setFavoriteRecipes(EXAMPLE_DATA.favorites)
      setIsLoading(false)
    }, 1000)
  }, [searchParams])

  // Función para manejar el análisis exitoso (ya no se usa directamente por CameraComponent)
  // Se mantiene por si otras partes del código la necesitan o para futuras expansiones
  const handleAnalysisSuccess = (result: AnalysisResult) => {
    console.log("✅ Análisis exitoso (desde AppPage):", result)
    setAnalysisResult(result)
    setCurrentView("results")
    setActiveTab("home")
    window.scrollTo(0, 0) // Scroll al inicio de la página

    // Actualizar el estado de canAnalyze para usuarios no autenticados
    if (!isSignedIn) {
      setCanAnalyze(canPerformAnalysis())
    }
  }

  // Función para manejar la selección de receta
  const handleRecipeSelect = (recipe: Recipe) => {
    console.log("🍽️ Receta seleccionada:", recipe)
    setSelectedRecipe(recipe)
    setCurrentView("recipe")
    window.scrollTo(0, 0) // Scroll al inicio de la página
  }

  // Función para manejar la selección de análisis del historial
  const handleHistorySelect = (analysis: AnalysisResult) => {
    console.log("📜 Análisis del historial seleccionado:", analysis)
    setAnalysisResult(analysis)
    setCurrentView("results")
    setActiveTab("home")
    window.scrollTo(0, 0) // Scroll al inicio de la página
  }

  // Función para volver a la vista anterior
  const handleBack = () => {
    console.log("⬅️ Volviendo a la vista anterior desde:", currentView)
    if (currentView === "recipe") {
      setCurrentView("results")
    } else {
      setCurrentView("home")
    }
    window.scrollTo(0, 0) // Scroll al inicio de la página
  }

  // Función para manejar el cambio de pestaña
  const handleTabChange = (value: string) => {
    console.log("🔄 Cambiando a pestaña:", value)
    setActiveTab(value)
    if (value === "home") {
      setCurrentView("home")
    }

    // Actualizar la URL para reflejar la pestaña activa
    router.push(`/app?tab=${value}`, { scroll: false })
  }

  // Si está cargando la autenticación, mostrar spinner
  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  console.log("🎨 Renderizando vista:", currentView, "pestaña activa:", activeTab)

  // Renderizar la vista correspondiente
  const renderView = () => {
    switch (currentView) {
      case "home":
        return (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-green-50">
              <TabsTrigger value="home" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Home size={16} />
                <span className="hidden sm:inline">Inicio</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white">
                <History size={16} />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Heart size={16} />
                <span className="hidden sm:inline">Favoritos</span>
              </TabsTrigger>
            </TabsList>

            <div className="transition-all duration-200">
              <TabsContent value="home" className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="transition-all duration-200">
                  <h1 className="text-2xl font-bold mb-2">¿Qué hay en tu nevera?</h1>
                  <p className="text-muted-foreground mb-8">
                    Toma una foto del contenido de tu nevera y te sugeriremos recetas deliciosas
                  </p>

                  {canAnalyze ? (
                    <CameraComponent /> // Usar CameraComponent directamente
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center bg-card shadow-sm">
                      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Límite alcanzado</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.
                      </p>
                      <Button onClick={() => router.push("/sign-in")}>Iniciar sesión</Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="p-4">
                <h2 className="text-xl font-semibold mb-4">Historial de análisis</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <HistoryList analyses={analysisHistory} onSelect={handleHistorySelect} />
                )}
              </TabsContent>

              <TabsContent value="favorites" className="p-4">
                <h2 className="text-xl font-semibold mb-4">Recetas favoritas</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : favoriteRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {favoriteRecipes.map((fav) => (
                      <div
                        key={fav.id}
                        onClick={() => handleRecipeSelect(fav.recipe)}
                        className="cursor-pointer border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <h3 className="font-medium">{fav.recipe.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{fav.recipe.descripcion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No tienes recetas favoritas guardadas.</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )

      case "results":
        if (!analysisResult) {
          console.warn("⚠️ No hay resultados de análisis para mostrar")
          return null
        }
        return (
          <div className="flex-1 p-4 transition-opacity duration-200">
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Ingredientes encontrados</h2>
              <IngredientsList ingredients={analysisResult.ingredientes} />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Recetas sugeridas</h2>
              <RecipeList recipes={analysisResult.recetas} onRecipeSelect={handleRecipeSelect} />
            </section>

            <div className="mt-6">
              <Button onClick={() => setCurrentView("home")} variant="outline" className="w-full group">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </div>
          </div>
        )

      case "recipe":
        if (!selectedRecipe) {
          console.warn("⚠️ No hay receta seleccionada para mostrar")
          return null
        }
        return (
          <div className="flex-1 p-4 transition-opacity duration-200">
            <RecipeDetail recipe={selectedRecipe} />

            <div className="mt-6 space-y-4">
              <Button onClick={() => setCurrentView("results")} variant="outline" className="w-full group">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a resultados
              </Button>

              <Button onClick={() => setCurrentView("home")} variant="outline" className="w-full group">
                <Home className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </div>
          </div>
        )

      default:
        console.error("❌ Vista no reconocida:", currentView)
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-background to-muted/50">
      <Header title="Fridgy" />
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">{renderView()}</div>
      </main>
    </div>
  )
}
