"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserAnalyses } from "@/lib/actions"
import { Loader2, Search, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface HistoryListProps {
  limit?: number
  showSearch?: boolean
  showFilters?: boolean
  onAnalysisSelect?: (analysis: any) => void
}

export function HistoryList({ limit, showSearch = false, showFilters = false, onAnalysisSelect }: HistoryListProps) {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setLoading(true)
        const result = await getUserAnalyses()
        if (result.success && result.analyses) {
          setAnalyses(result.analyses)
          setFilteredAnalyses(result.analyses)
        } else {
          console.error("Error al obtener análisis:", result.error)
          setAnalyses([])
          setFilteredAnalyses([])
        }
      } catch (error) {
        console.error("Error al obtener análisis:", error)
        setAnalyses([])
        setFilteredAnalyses([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyses()
  }, [])

  useEffect(() => {
    // Aplicar filtros
    let filtered = [...analyses]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((analysis) => {
        // Buscar en ingredientes
        const ingredientsMatch =
          Array.isArray(analysis.ingredients) &&
          analysis.ingredients.some((ingredient: string) => ingredient.toLowerCase().includes(term))

        // Buscar en recetas
        const recipesMatch =
          Array.isArray(analysis.recipes) &&
          analysis.recipes.some(
            (recipe: any) =>
              (recipe.title || "").toLowerCase().includes(term) ||
              (recipe.description || "").toLowerCase().includes(term),
          )

        return ingredientsMatch || recipesMatch
      })
    }

    // Filtrar por fecha
    if (dateFilter) {
      const today = new Date()
      const filterDate = new Date(today)

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((analysis) => new Date(analysis.created_at) >= filterDate)
          break
        case "week":
          filterDate.setDate(today.getDate() - 7)
          filtered = filtered.filter((analysis) => new Date(analysis.created_at) >= filterDate)
          break
        case "month":
          filterDate.setMonth(today.getMonth() - 1)
          filtered = filtered.filter((analysis) => new Date(analysis.created_at) >= filterDate)
          break
      }
    }

    setFilteredAnalyses(filtered)
  }, [searchTerm, dateFilter, analyses])

  const handleAnalysisClick = (analysis: any) => {
    if (onAnalysisSelect) {
      onAnalysisSelect(analysis)
    } else {
      router.push(`/results?id=${analysis.id}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
  }

  const displayedAnalyses = limit ? filteredAnalyses.slice(0, limit) : filteredAnalyses

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay análisis en tu historial</p>
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
              placeholder="Buscar ingredientes o recetas..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {showFilters && (
            <div className="flex gap-2">
              <Button
                variant={dateFilter === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(dateFilter === "today" ? null : "today")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Hoy
              </Button>
              <Button
                variant={dateFilter === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(dateFilter === "week" ? null : "week")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Semana
              </Button>
              <Button
                variant={dateFilter === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(dateFilter === "month" ? null : "month")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Mes
              </Button>
            </div>
          )}
        </div>
      )}

      {displayedAnalyses.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No se encontraron resultados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAnalyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleAnalysisClick(analysis)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Análisis del {formatDate(analysis.created_at)}</CardTitle>
                    <CardDescription>{analysis.recipes?.length || 0} recetas generadas</CardDescription>
                  </div>
                  {analysis.image_url && (
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                      <img
                        src={analysis.image_url || "/placeholder.svg"}
                        alt="Imagen del análisis"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Ingredientes detectados:</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(analysis.ingredients) &&
                      analysis.ingredients.slice(0, 8).map((ingredient: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {ingredient}
                        </Badge>
                      ))}
                    {Array.isArray(analysis.ingredients) && analysis.ingredients.length > 8 && (
                      <Badge variant="outline">+{analysis.ingredients.length - 8} más</Badge>
                    )}
                  </div>
                </div>
                {analysis.recipes && analysis.recipes.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-1">Recetas:</h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.recipes.map((recipe: any) => (
                        <li key={recipe.id} className="text-muted-foreground">
                          {recipe.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {limit && filteredAnalyses.length > limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/profile?tab=history")}>
            Ver todo el historial
          </Button>
        </div>
      )}
    </div>
  )
}
