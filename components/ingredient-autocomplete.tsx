"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Lista de ingredientes comunes para el autocompletado
const COMMON_INGREDIENTS = [
  "Aceite de oliva",
  "Ajo",
  "Arroz",
  "Atún",
  "Azúcar",
  "Café",
  "Cebolla",
  "Chocolate",
  "Frijoles",
  "Harina",
  "Huevos",
  "Leche",
  "Lentejas",
  "Limón",
  "Mantequilla",
  "Miel",
  "Pan",
  "Pasta",
  "Patatas",
  "Pimiento",
  "Pollo",
  "Queso",
  "Sal",
  "Tomate",
  "Yogur",
  "Zanahoria",
  "Aguacate",
  "Almendras",
  "Avena",
  "Bacalao",
  "Brócoli",
  "Calabacín",
  "Canela",
  "Champiñones",
  "Cilantro",
  "Espinacas",
  "Garbanzos",
  "Jamón",
  "Maíz",
  "Manzana",
  "Naranja",
  "Nueces",
  "Pepino",
  "Pera",
  "Pimienta",
  "Plátano",
  "Ternera",
  "Vinagre",
  "Zanahorias",
]

interface IngredientAutocompleteProps {
  onAdd: (ingredient: string) => void
  placeholder?: string
  className?: string
}

export function IngredientAutocomplete({
  onAdd,
  placeholder = "Añadir ingrediente",
  className = "",
}: IngredientAutocompleteProps) {
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filtrar sugerencias basadas en la entrada
  useEffect(() => {
    if (input.trim().length > 1) {
      const filtered = COMMON_INGREDIENTS.filter((ingredient) =>
        ingredient.toLowerCase().includes(input.toLowerCase()),
      ).slice(0, 5) // Limitar a 5 sugerencias

      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [input])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      onAdd(input.trim())
      setInput("")
      setShowSuggestions(false)
    }
  }

  const handleAddClick = () => {
    if (input.trim()) {
      onAdd(input.trim())
      setInput("")
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onAdd(suggestion)
    setInput("")
    setShowSuggestions(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim().length > 1 && setSuggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button onClick={handleAddClick} disabled={!input.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir
        </Button>
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="px-4 py-2 hover:bg-muted cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
