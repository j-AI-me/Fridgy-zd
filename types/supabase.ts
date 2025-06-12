export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          clerk_id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          user_id: string
          ingredients: Json
          created_at: string
          image_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          ingredients: Json
          created_at?: string
          image_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          ingredients?: Json
          created_at?: string
          image_url?: string | null
        }
      }
      recipes: {
        Row: {
          id: string
          analysis_id: string
          title: string
          description: string | null
          available_ingredients: Json
          additional_ingredients: Json
          preparation_steps: Json
          calories: number | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          title: string
          description?: string | null
          available_ingredients: Json
          additional_ingredients: Json
          preparation_steps: Json
          calories?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          title?: string
          description?: string | null
          available_ingredients?: Json
          additional_ingredients?: Json
          preparation_steps?: Json
          calories?: number | null
          created_at?: string
        }
      }
      favorite_recipes: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      shopping_list_items: {
        Row: {
          id: string
          list_id: string
          name: string
          completed: boolean
          from_analysis: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          completed?: boolean
          from_analysis?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          completed?: boolean
          from_analysis?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
