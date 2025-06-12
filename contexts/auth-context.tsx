"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { secureStore, secureRetrieve } from "@/lib/secure-storage"

// Tipo para el usuario
type User = {
  id: string
  name: string
  email: string
  imageUrl: string
  preferences?: {
    dietaryPreferences: string[]
    allergies: string[]
  }
}

// Tipo para el contexto de autenticación
type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Usuario de ejemplo
const DEMO_USER: User = {
  id: "demo-user",
  name: "Usuario Demo",
  email: "demo@example.com",
  imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
  preferences: {
    dietaryPreferences: ["Vegetariano"],
    allergies: ["Frutos secos"],
  },
}

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Comprobar si hay un usuario guardado al cargar
  useEffect(() => {
    const storedUser = secureRetrieve("user")
    if (storedUser) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      // Simular una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // En una aplicación real, aquí verificarías las credenciales
      // Para esta demo, aceptamos cualquier email/contraseña
      const user = { ...DEMO_USER, email }
      setUser(user)
      secureStore("user", user)

      toast({
        title: "Sesión iniciada",
        description: "Has iniciado sesión correctamente",
      })

      return true
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión. Inténtalo de nuevo.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Función para registrarse
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      // Simular una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // En una aplicación real, aquí crearías el usuario
      const user = { ...DEMO_USER, name, email }
      setUser(user)
      secureStore("user", user)

      toast({
        title: "Registro completado",
        description: "Te has registrado correctamente",
      })

      return true
    } catch (error) {
      console.error("Error al registrarse:", error)
      toast({
        title: "Error",
        description: "No se pudo completar el registro. Inténtalo de nuevo.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    setUser(null)
    secureStore("user", null)
    router.push("/")
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    })
  }

  // Función para actualizar datos del usuario
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      secureStore("user", updatedUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
