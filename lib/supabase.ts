import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Función para crear un cliente de Supabase con el rol de servicio
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Configurar explícitamente para usar el rol de servicio
    global: {
      headers: {
        "x-supabase-role": "service_role",
      },
    },
  })
}

// Cliente para uso en el lado del cliente
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}
