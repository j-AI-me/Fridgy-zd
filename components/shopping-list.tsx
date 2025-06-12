"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, RefreshCw, ShoppingCart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { mockShoppingLists } from "@/lib/mock-data"

interface ShoppingListItem {
  id: string
  name: string
  completed: boolean
}

interface ShoppingList {
  id: string
  name: string
  items: ShoppingListItem[]
}

export function ShoppingListManager() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const { toast } = useToast()

  // Cargar listas al inicio
  useEffect(() => {
    const loadLists = async () => {
      setIsLoading(true)
      try {
        // Simular carga
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Usar datos mock
        setLists(mockShoppingLists)

        // Seleccionar la primera lista si existe
        if (mockShoppingLists.length > 0) {
          setSelectedListId(mockShoppingLists[0].id)
        }
      } catch (error) {
        console.error("Error al cargar listas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las listas de compra",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadLists()
  }, [toast])

  // Crear nueva lista
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor, introduce un nombre para la lista",
        variant: "destructive",
      })
      return
    }

    setIsCreatingList(true)
    try {
      // Simular creación
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newList: ShoppingList = {
        id: `list-${Date.now()}`,
        name: newListName,
        items: [],
      }

      setLists((prev) => [...prev, newList])
      setSelectedListId(newList.id)
      setNewListName("")

      toast({
        title: "Lista creada",
        description: `La lista "${newList.name}" ha sido creada`,
      })
    } catch (error) {
      console.error("Error al crear lista:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la lista",
        variant: "destructive",
      })
    } finally {
      setIsCreatingList(false)
    }
  }

  // Eliminar lista
  const handleDeleteList = async (listId: string) => {
    try {
      // Simular eliminación
      await new Promise((resolve) => setTimeout(resolve, 300))

      setLists((prev) => prev.filter((list) => list.id !== listId))

      if (selectedListId === listId) {
        const remainingLists = lists.filter((list) => list.id !== listId)
        setSelectedListId(remainingLists.length > 0 ? remainingLists[0].id : null)
      }

      toast({
        title: "Lista eliminada",
        description: "La lista ha sido eliminada",
      })
    } catch (error) {
      console.error("Error al eliminar lista:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la lista",
        variant: "destructive",
      })
    }
  }

  // Añadir elemento a la lista
  const handleAddItem = async () => {
    if (!selectedListId) return
    if (!newItemName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor, introduce un nombre para el elemento",
        variant: "destructive",
      })
      return
    }

    setIsAddingItem(true)
    try {
      // Simular añadir elemento
      await new Promise((resolve) => setTimeout(resolve, 300))

      const newItem: ShoppingListItem = {
        id: `item-${Date.now()}`,
        name: newItemName,
        completed: false,
      }

      setLists((prev) =>
        prev.map((list) => (list.id === selectedListId ? { ...list, items: [...list.items, newItem] } : list)),
      )

      setNewItemName("")
    } catch (error) {
      console.error("Error al añadir elemento:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el elemento",
        variant: "destructive",
      })
    } finally {
      setIsAddingItem(false)
    }
  }

  // Actualizar estado de un elemento
  const handleToggleItem = async (itemId: string, completed: boolean) => {
    if (!selectedListId) return

    try {
      setLists((prev) =>
        prev.map((list) =>
          list.id === selectedListId
            ? {
                ...list,
                items: list.items.map((item) => (item.id === itemId ? { ...item, completed } : item)),
              }
            : list,
        ),
      )
    } catch (error) {
      console.error("Error al actualizar elemento:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el elemento",
        variant: "destructive",
      })
    }
  }

  // Eliminar elemento
  const handleDeleteItem = async (itemId: string) => {
    if (!selectedListId) return

    try {
      setLists((prev) =>
        prev.map((list) =>
          list.id === selectedListId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list,
        ),
      )
    } catch (error) {
      console.error("Error al eliminar elemento:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento",
        variant: "destructive",
      })
    }
  }

  // Obtener la lista seleccionada
  const selectedList = lists.find((list) => list.id === selectedListId)

  // Renderizar estado de carga
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Listas de compra</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Listas de compra</span>
          <Button variant="outline" size="icon" onClick={() => window.location.reload()} title="Actualizar listas">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nombre de la nueva lista"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateList} disabled={isCreatingList || !newListName.trim()}>
              {isCreatingList ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Crear
            </Button>
          </div>

          {lists.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Mis listas de compra ({lists.length})</h3>
            </div>
          )}

          {lists.length > 0 ? (
            <div className="grid gap-4">
              {lists.map((list) => (
                <div key={list.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="p-4 pb-2 flex justify-between items-center">
                    <span onClick={() => setSelectedListId(list.id)}>{list.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteList(list.id)
                      }}
                      disabled={isCreatingList}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="p-4 pt-2" onClick={() => setSelectedListId(list.id)}>
                    <p className="text-sm text-muted-foreground">
                      {list.items.length} artículos • {list.items.filter((item) => item.completed).length} completados
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizada el {new Date(list.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center bg-muted/30">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay listas de compra</p>
              <p className="text-sm text-muted-foreground mt-2">Crea una nueva lista para empezar</p>
            </div>
          )}

          {selectedList && (
            <div className="mt-6 space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-item">Añadir elemento</Label>
                  <Input
                    id="new-item"
                    placeholder="Nombre del elemento"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddItem} disabled={isAddingItem || !newItemName.trim()}>
                  {isAddingItem ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  )}
                  Añadir
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="font-medium">
                  {selectedList.name} ({selectedList.items.length})
                </h3>
                {selectedList.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No hay elementos en esta lista</p>
                ) : (
                  <div className="space-y-2">
                    {selectedList.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-card border rounded-md">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={() => handleToggleItem(item.id, !item.completed)}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`item-${item.id}`}
                          className={`${item.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.name}
                        </Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
