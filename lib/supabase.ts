import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Re-exportar createClient desde @supabase/supabase-js
export { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase para el lado del servidor
export const createServerSupabaseClient = () => {
  console.log("🔌 Creando cliente de Supabase para el servidor")

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Variables de entorno de Supabase no disponibles:", {
      url: supabaseUrl ? "Disponible" : "No disponible",
      key: supabaseKey ? "Disponible" : "No disponible",
    })
    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  console.log("✅ Variables de entorno de Supabase disponibles")
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}

// Crear un cliente de Supabase para el lado del cliente
let clientSupabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export const createClientSupabaseClient = () => {
  console.log("🔌 Creando cliente de Supabase para el cliente")

  if (clientSupabaseClient) {
    console.log("♻️ Reutilizando cliente de Supabase existente")
    return clientSupabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Variables de entorno públicas de Supabase no disponibles:", {
      url: supabaseUrl ? "Disponible" : "No disponible",
      key: supabaseKey ? "Disponible" : "No disponible",
    })
    throw new Error("Variables de entorno públicas de Supabase no configuradas")
  }

  console.log("✅ Variables de entorno públicas de Supabase disponibles")
  clientSupabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey)
  return clientSupabaseClient
}
