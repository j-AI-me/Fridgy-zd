"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Camera, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getUserMetadata, updateUserMetadata, updateUserName, syncUserWithSupabase } from "@/lib/user-profile"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { History, Heart, ShoppingCart } from "lucide-react"
import { ShoppingListManager } from "@/components/shopping-list"
import { HistoryList } from "@/components/history-list"
import { FavoritesList } from "@/components/favorites-list"
import { NotificationsList } from "@/components/notifications-list"
import { NotificationsBell } from "@/components/notifications-bell"

// Opciones de preferencias dietéticas
const DIETARY_OPTIONS = [
  "Vegetariano",
  "Vegano",
  "Sin gluten",
  "Sin lactosa",
  "Keto",
  "Paleo",
  "Bajo en carbohidratos",
  "Bajo en sodio",
  "Bajo en azúcar",
  "Mediterránea",
]

// Opciones de alergias comunes
const ALLERGY_OPTIONS = ["Frutos secos", "Mariscos", "Lácteos", "Huevos", "Trigo", "Soja", "Pescado", "Maní"]

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [displayName, setDisplayName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Estados para preferencias dietéticas y alergias
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [newDietaryPreference, setNewDietaryPreference] = useState("")
  const [newAllergy, setNewAllergy] = useState("")

  // Obtener la pestaña activa de los parámetros de búsqueda
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    // Si hay un parámetro de pestaña en la URL, usarlo
    if (tabParam && ["profile", "history", "favorites", "shopping-lists", "notifications"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }

    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
      setDisplayName(`${user.firstName || ""} ${user.lastName || ""}`.trim())
      setAvatarUrl(user.imageUrl)

      // Cargar metadatos del usuario
      const loadUserMetadata = async () => {
        try {
          setHasError(false)
          const metadata = await getUserMetadata()
          setBio(metadata.bio || "")
          setDietaryPreferences(metadata.dietaryPreferences || [])
          setAllergies(metadata.allergies || [])
        } catch (error) {
          console.error("Error al cargar metadatos:", error)
          setHasError(true)
          toast({
            title: "Error",
            description: "No se pudieron cargar tus datos de perfil.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      loadUserMetadata()
    }
  }, [user, isLoaded, router, toast])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setIsUploading(true)

      // Subir la imagen a Clerk
      await user.setProfileImage({ file })

      // Actualizar la URL del avatar
      setAvatarUrl(URL.createObjectURL(file))

      // Sincronizar con Supabase
      await syncUserWithSupabase()

      toast({
        title: "Imagen actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente.",
      })
    } catch (error) {
      console.error("Error al subir la imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      // Actualizar nombre en Clerk
      const nameParts = displayName.split(" ")
      const newFirstName = nameParts[0] || ""
      const newLastName = nameParts.slice(1).join(" ") || ""

      await updateUserName(newFirstName, newLastName)

      // Actualizar metadatos en Clerk
      await updateUserMetadata({
        bio,
        dietaryPreferences,
        allergies,
      })

      // Sincronizar con Supabase
      await syncUserWithSupabase()

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha actualizado correctamente.",
      })
    } catch (error) {
      console.error("Error al guardar el perfil:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addDietaryPreference = () => {
    if (newDietaryPreference && !dietaryPreferences.includes(newDietaryPreference)) {
      setDietaryPreferences([...dietaryPreferences, newDietaryPreference])
      setNewDietaryPreference("")
    }
  }

  const removeDietaryPreference = (preference: string) => {
    setDietaryPreferences(dietaryPreferences.filter((p) => p !== preference))
  }

  const addAllergy = () => {
    if (newAllergy && !allergies.includes(newAllergy)) {
      setAllergies([...allergies, newAllergy])
      setNewAllergy("")
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy))
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Actualizar la URL sin recargar la página
    const url = new URL(window.location.href)
    url.searchParams.set("tab", value)
    window.history.pushState({}, "", url)
  }

  // Función para reintentar cargar datos
  const retryLoadData = () => {
    setIsLoading(true)
    setHasError(false)
    window.location.reload()
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  // Si no hay usuario, redirigir a la página de inicio de sesión
  if (!user) {
    router.push("/sign-in")
    return null
  }

  // Si hay error, mostrar pantalla de error
  if (hasError) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error al cargar el perfil</h2>
          <p className="text-muted-foreground mb-4">
            Hubo un problema al cargar tus datos. Por favor, inténtalo de nuevo.
          </p>
          <Button onClick={retryLoadData}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-white to-green-50">
      <header className="sticky top-0 z-10 bg-white border-b border-border h-14 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/app")}
            className="mr-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Perfil</h1>
        </div>
        <div className="flex items-center">
          <NotificationsBell />
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Avatar and profile info section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-white shadow-md">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName || "Usuario"} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploading}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Haz clic en la imagen para cambiarla</p>
          </div>

          {/* Tabs for profile sections */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoritos</span>
              </TabsTrigger>
              <TabsTrigger value="shopping-lists" className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Listas</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab Content */}
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" value={user?.primaryEmailAddress?.emailAddress || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti..."
                  rows={4}
                />
              </div>

              {/* Preferencias dietéticas */}
              <div className="space-y-2">
                <Label htmlFor="dietaryPreferences">Preferencias dietéticas</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dietaryPreferences.map((preference) => (
                    <Badge key={preference} variant="secondary" className="flex items-center gap-1">
                      {preference}
                      <button
                        onClick={() => removeDietaryPreference(preference)}
                        className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Eliminar {preference}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newDietaryPreference}
                    onChange={(e) => setNewDietaryPreference(e.target.value)}
                  >
                    <option value="">Seleccionar preferencia...</option>
                    {DIETARY_OPTIONS.filter((option) => !dietaryPreferences.includes(option)).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={addDietaryPreference} disabled={!newDietaryPreference}>
                    Añadir
                  </Button>
                </div>
              </div>

              {/* Alergias */}
              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias alimentarias</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                      {allergy}
                      <button
                        onClick={() => removeAllergy(allergy)}
                        className="ml-1 rounded-full hover:bg-red-700 p-0.5"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Eliminar {allergy}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                  >
                    <option value="">Seleccionar alergia...</option>
                    {ALLERGY_OPTIONS.filter((option) => !allergies.includes(option)).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={addAllergy} disabled={!newAllergy}>
                    Añadir
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </TabsContent>

            {/* History Tab Content */}
            <TabsContent value="history">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Histórico de análisis</h2>
                <p className="text-muted-foreground">Aquí puedes ver todos tus análisis anteriores.</p>

                <HistoryList showSearch showFilters />
              </div>
            </TabsContent>

            {/* Favorites Tab Content */}
            <TabsContent value="favorites">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recetas favoritas</h2>
                <p className="text-muted-foreground">Aquí puedes ver todas tus recetas favoritas.</p>

                <FavoritesList showSearch />
              </div>
            </TabsContent>

            {/* Shopping Lists Tab Content */}
            <TabsContent value="shopping-lists">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Listas de la compra</h2>
                <p className="text-muted-foreground">Crea y gestiona tus listas de la compra.</p>

                <ShoppingListManager />
              </div>
            </TabsContent>

            {/* Notifications Tab Content */}
            <TabsContent value="notifications">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Notificaciones</h2>
                <p className="text-muted-foreground">Aquí puedes ver todas tus notificaciones.</p>

                <NotificationsList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
