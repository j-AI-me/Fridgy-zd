"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Settings, Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUser, useClerk } from "@clerk/nextjs"

export function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      router.push("/")
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleProfileClick = () => {
    router.push("/profile")
    setIsOpen(false)
  }

  const handleFavoritesClick = () => {
    router.push("/app?tab=favorites")
    setIsOpen(false)
  }

  const handleSettingsClick = () => {
    router.push("/settings")
    setIsOpen(false)
  }

  // Obtener iniciales para el fallback del avatar
  const getInitials = () => {
    if (!user.firstName && !user.lastName) return "U"

    const first = user.firstName?.[0] || ""
    const last = user.lastName?.[0] || ""

    return (first + last).toUpperCase()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 transition-all hover:scale-105 cursor-pointer">
          <AvatarImage src={user.imageUrl} alt={user.fullName || "Usuario"} />
          <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName || "Usuario"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFavoritesClick} className="cursor-pointer">
          <Heart className="mr-2 h-4 w-4" />
          <span>Favoritos</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
