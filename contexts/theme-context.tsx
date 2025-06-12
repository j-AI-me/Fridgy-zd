"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { updateUserMetadata, getUserMetadata } from "@/lib/user-profile"

type Theme = "light" | "dark" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, defaultTheme = "system", ...props }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    // Cargar el tema guardado en localStorage o en las preferencias del usuario
    const loadTheme = async () => {
      const savedTheme = localStorage.getItem("theme") as Theme | null

      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        try {
          // Intentar obtener el tema de las preferencias del usuario
          const metadata = await getUserMetadata()
          if (metadata.theme) {
            setTheme(metadata.theme)
            localStorage.setItem("theme", metadata.theme)
          }
        } catch (error) {
          console.error("Error al cargar el tema:", error)
        }
      }
    }

    loadTheme()
  }, [])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      localStorage.setItem("theme", newTheme)

      // Guardar el tema en las preferencias del usuario
      try {
        updateUserMetadata({ theme: newTheme })
      } catch (error) {
        console.error("Error al guardar el tema:", error)
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
