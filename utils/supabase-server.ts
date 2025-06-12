import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}
