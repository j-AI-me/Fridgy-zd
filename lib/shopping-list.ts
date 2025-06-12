"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { mockShoppingLists } from "./mock-data"
import { syncUserProfile } from "./sync-user-profile" // Import the syncUserProfile function

// Tipos para las listas de compra
export type ShoppingListItem = {
  id: string
  name: string
  completed: boolean
  fromAnalysis: boolean
  createdAt: string
  updatedAt: string
}

export type ShoppingList = {
  id: string
  name: string
  items: ShoppingListItem[]
  createdAt: string
  updatedAt: string
}

// Función para obtener el perfil del usuario actual
async function getUserProfile() {
  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      throw new Error("Usuario no autenticado")
    }

    const supabase = createServerSupabaseClient()

    // Intentar obtener el perfil existente
    const { data: profile, error } = await supabase.from("profiles").select("id").eq("clerk_id", userId).single()

    if (error) {
      console.error("Error al obtener perfil:", error)

      // Si el perfil no existe, intentar crearlo
      if (error.code === "PGRST116") {
        console.log("Perfil no encontrado, creando nuevo perfil...")

        // Usar la función syncUserProfile para crear el perfil
        const syncResult = await syncUserProfile(userId)

        if (!syncResult.success) {
          throw new Error("No se pudo crear el perfil de usuario")
        }

        // Obtener el perfil recién creado
        const { data: newProfile, error: newProfileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_id", userId)
          .single()

        if (newProfileError) {
          throw new Error("No se pudo obtener el perfil recién creado")
        }

        return newProfile
      }

      throw new Error("No se pudo obtener el perfil del usuario")
    }

    return profile
  } catch (error) {
    console.error("Error en getUserProfile:", error)
    throw error
  }
}

// Función para obtener todas las listas de compra del usuario
export async function getShoppingLists(): Promise<ShoppingList[]> {
  try {
    console.log("Obteniendo listas de compra del usuario")

    // Verificar si el usuario está autenticado
    const authResult = await auth()
    if (!authResult?.userId) {
      console.log("Usuario no autenticado, devolviendo lista vacía")
      return []
    }

    const profile = await getUserProfile()
    const supabase = createServerSupabaseClient()

    // Obtener todas las listas del usuario
    const { data: lists, error: listsError } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })

    if (listsError) {
      console.error("Error al obtener listas:", listsError)
      return []
    }

    console.log(`Se encontraron ${lists?.length || 0} listas`)

    if (!lists || lists.length === 0) {
      return []
    }

    // Para cada lista, obtener sus elementos
    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const { data: items, error: itemsError } = await supabase
          .from("shopping_list_items")
          .select("*")
          .eq("list_id", list.id)
          .order("created_at", { ascending: true })

        if (itemsError) {
          console.error("Error al obtener elementos de la lista:", itemsError)
          return {
            id: list.id,
            name: list.name,
            createdAt: list.created_at,
            updatedAt: list.updated_at,
            items: [],
          }
        }

        return {
          id: list.id,
          name: list.name,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
          items: (items || []).map((item) => ({
            id: item.id,
            name: item.name,
            completed: item.completed,
            fromAnalysis: item.from_analysis,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          })),
        }
      }),
    )

    console.log("Listas cargadas exitosamente")
    return listsWithItems
  } catch (error) {
    console.error("Error al obtener listas de compra:", error)
    return []
  }
}

// Función para obtener las listas de compra del usuario
export async function getUserShoppingLists() {
  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      return { success: true, lists: mockShoppingLists }
    }

    // Por ahora usar datos mock
    return { success: true, lists: mockShoppingLists }
  } catch (error) {
    console.error("Error al obtener listas:", error)
    return { success: true, lists: mockShoppingLists }
  }
}

// Función para crear una nueva lista de compra
export async function createShoppingList(name: string) {
  try {
    const newList = {
      id: "new-list-" + Date.now(),
      name,
      created_at: new Date().toISOString(),
      items: [],
    }

    console.log("➕ Lista creada:", name)
    return { success: true, list: newList }
  } catch (error) {
    console.error("Error al crear lista:", error)
    return { success: false, error: "Error al crear lista" }
  }
}

// Función para eliminar una lista de compra
export async function deleteShoppingList(listId: string) {
  console.log("🗑️ Eliminando lista de compra (mock):", listId)

  // Simular éxito
  return { success: true }
}

// Función para añadir un elemento a una lista de compra
export async function addShoppingListItem(listId: string, name: string) {
  try {
    const newItem = {
      id: "item-" + Date.now(),
      name,
      completed: false,
    }

    console.log("➕ Elemento añadido:", name)
    return { success: true, item: newItem }
  } catch (error) {
    console.error("Error al añadir elemento:", error)
    return { success: false, error: "Error al añadir elemento" }
  }
}

// Función para actualizar un elemento de una lista de compra
export async function updateShoppingListItem(listId: string, itemId: string, completed: boolean) {
  console.log("🔄 Actualizando elemento de lista (mock):", listId, itemId, completed)

  // Simular éxito
  return { success: true }
}

// Función para eliminar un elemento de una lista de compra
export async function deleteShoppingListItem(listId: string, itemId: string) {
  console.log("🗑️ Eliminando elemento de lista (mock):", listId, itemId)

  // Simular éxito
  return { success: true }
}

// Función para obtener los ingredientes del último análisis
export async function getLastAnalysisIngredients(): Promise<string[]> {
  try {
    // Verificar si el usuario está autenticado
    const authResult = await auth()
    if (!authResult?.userId) {
      return []
    }

    try {
      const profile = await getUserProfile()
      const supabase = createServerSupabaseClient()

      // Obtener el último análisis del usuario
      const { data: analysis, error } = await supabase
        .from("analyses")
        .select("ingredients")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("Error al obtener último análisis:", error)
        return []
      }

      // Devolver los ingredientes
      return analysis.ingredients as string[]
    } catch (error) {
      console.error("Error al obtener ingredientes del último análisis:", error)
      return []
    }
  } catch (error) {
    console.error("Error al obtener ingredientes del último análisis:", error)
    return []
  }
}
