"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { LucideCamera, Upload, Loader2, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { saveAnalysisData } from "@/lib/secure-storage" // Importar saveAnalysisData
import { v4 as uuidv4 } from "uuid"
import { getUserMetadata } from "@/lib/user-profile"
import { useUser } from "@clerk/nextjs"
import { canPerformAnalysis } from "@/lib/guest-mode"
import { useRouter } from "next/navigation"

// Datos de ejemplo para usar cuando la API no está disponible o falla
const FALLBACK_DATA = {
  ingredientes: ["Tomates", "Cebolla", "Pimiento", "Ajo", "Huevos", "Queso"],
  recetas: [
    {
      titulo: "Tortilla de Verduras (EJEMPLO)",
      descripcion: "Esta es una receta de ejemplo porque la IA no pudo procesar tu imagen.",
      ingredientes: {
        disponibles: ["Huevos", "Cebolla", "Pimiento"],
        adicionales: ["Sal", "Pimienta", "Aceite"],
      },
      preparacion: ["Corta la cebolla y el pimiento", "Bate los huevos", "Cocina en la sartén"],
      calorias: 300,
      tiempo_preparacion: 20,
      dificultad: "fácil",
      porciones: 2,
      consejos: "Puedes añadir otras verduras como calabacín o champiñones.",
    },
  ],
}

// Renombramos la exportación para que coincida con la importación en app/app/page.tsx
export function CameraComponent() {
  console.log("🔍 Renderizando CameraComponent")

  const { toast } = useToast()
  const [isCapturing, setIsCapturing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [canAnalyze, setCanAnalyze] = useState(true)
  const [userPreferences, setUserPreferences] = useState<{
    dietaryPreferences: string[]
    allergies: string[]
  }>({ dietaryPreferences: [], allergies: [] })

  useEffect(() => {
    // Verificar si el usuario puede realizar análisis (para modo invitado)
    if (!isSignedIn) {
      const canPerform = canPerformAnalysis()
      setCanAnalyze(canPerform)
      if (!canPerform) {
        toast({
          title: "Límite alcanzado",
          description: "Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.",
          variant: "destructive",
        })
      }
    }

    // Cargar preferencias del usuario si está autenticado
    const loadUserPreferences = async () => {
      try {
        if (isSignedIn) {
          const metadata = await getUserMetadata()
          setUserPreferences({
            dietaryPreferences: metadata.dietaryPreferences || [],
            allergies: metadata.allergies || [],
          })
        }
      } catch (error) {
        console.error("Error al cargar preferencias del usuario:", error)
      }
    }
    loadUserPreferences()

    return () => {
      // Detener la cámara al desmontar el componente
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [isSignedIn, toast])

  const startCamera = useCallback(async () => {
    if (!canAnalyze) return // No iniciar si el límite está alcanzado
    setIsCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("❌ Error al acceder a la cámara:", error)
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      })
      setIsCapturing(false)
    }
  }, [canAnalyze, toast])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }, [])

  const captureImage = useCallback(async () => {
    if (!canAnalyze) return
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8)
    })

    if (blob) {
      setPreviewImage(URL.createObjectURL(blob))
      stopCamera()
      setIsLoading(true)
      await analyzeImage(blob)
    } else {
      toast({ title: "Error", description: "No se pudo capturar la imagen.", variant: "destructive" })
    }
  }, [stopCamera, canAnalyze, toast])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!canAnalyze) return
      const file = event.target.files?.[0]
      if (!file) return

      setPreviewImage(URL.createObjectURL(file))
      setIsLoading(true)
      await analyzeImage(file)
    },
    [canAnalyze, toast],
  )

  const cancelPreview = () => {
    if (previewImage) URL.revokeObjectURL(previewImage)
    setPreviewImage(null)
    setIsLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    stopCamera() // Asegurarse de detener la cámara si estaba activa
  }

  const analyzeImage = async (imageFile: Blob | File) => {
    try {
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new Error("La imagen es demasiado grande (máx. 10MB).")
      }
      if (!imageFile.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen.")
      }

      // Mostrar mensaje de preferencias
      if (userPreferences.dietaryPreferences.length > 0 || userPreferences.allergies.length > 0) {
        let preferencesMessage = "Analizando imagen teniendo en cuenta tus preferencias"
        if (userPreferences.dietaryPreferences.length > 0)
          preferencesMessage += `: ${userPreferences.dietaryPreferences.join(", ")}`
        if (userPreferences.allergies.length > 0)
          preferencesMessage +=
            (userPreferences.dietaryPreferences.length > 0 ? ` y evitando: ` : ` evitando: `) +
            userPreferences.allergies.join(", ")
        toast({ title: "Preferencias detectadas", description: preferencesMessage })
      }

      const formData = new FormData()
      formData.append("image", imageFile)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Guardar la respuesta completa de la API
        const saved = saveAnalysisData(result.analysisId, result)
        if (saved) {
          toast({
            title: result.isExample ? "Usando datos de ejemplo" : "¡Análisis completado!",
            description: result.message,
            variant: result.isExample ? "default" : "success", // Usar 'default' para ejemplo, 'success' para real
          })
          router.push(`/results?id=${result.analysisId}`)
        } else {
          throw new Error("No se pudieron guardar los datos localmente.")
        }
      } else {
        throw new Error(result.error || `Error en la API: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("❌ Error en analyzeImage:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al analizar la imagen."

      // Fallback a datos de ejemplo si hay un error
      const fallbackId = uuidv4()
      saveAnalysisData(fallbackId, {
        data: FALLBACK_DATA,
        isExample: true,
        message: `Error: ${errorMessage}. Se muestran recetas de ejemplo.`,
      })
      toast({
        title: "Error en el análisis",
        description: `No se pudo analizar la imagen. ${errorMessage}. Se muestran datos de ejemplo.`,
        variant: "destructive",
      })
      router.push(`/results?id=${fallbackId}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!canAnalyze) {
    return (
      <div className="w-full max-w-sm">
        <div className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center bg-card shadow-sm">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Límite alcanzado</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.
          </p>
          <Button onClick={() => (window.location.href = "/sign-in")}>Iniciar sesión</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isLoading}
      />

      {/* Botones de acción iniciales */}
      {!previewImage && !isCapturing && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={startCamera}
            disabled={isLoading}
            className="w-full shadow-sm hover:scale-105 transition-transform"
            variant="default"
          >
            <LucideCamera className="mr-2 h-4 w-4" />
            Usar cámara
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full shadow-sm hover:scale-105 transition-transform"
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Subir foto
          </Button>
        </div>
      )}

      {/* Instrucciones iniciales */}
      {!previewImage && !isCapturing && (
        <div className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center bg-card shadow-sm">
          <LucideCamera className="h-12 w-12 text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Toma una foto de tu nevera para comenzar</p>
          {(userPreferences.dietaryPreferences.length > 0 || userPreferences.allergies.length > 0) && (
            <div className="mt-4 text-xs text-center text-muted-foreground">
              <p className="font-medium text-primary">Tus preferencias serán consideradas:</p>
              {userPreferences.dietaryPreferences.length > 0 && (
                <p className="mt-1">
                  <span className="font-medium">Dieta:</span> {userPreferences.dietaryPreferences.join(", ")}
                </p>
              )}
              {userPreferences.allergies.length > 0 && (
                <p className="mt-1">
                  <span className="font-medium">Alergias:</span> {userPreferences.allergies.join(", ")}
                </p>
              )}
            </div>
          )}
          {!isSignedIn && (
            <div className="mt-4 text-xs text-center text-amber-600">
              <p>Modo invitado: Análisis gratuitos restantes: 3</p>
            </div>
          )}
        </div>
      )}

      {/* Vista de cámara activa */}
      {isCapturing && (
        <div className="relative transition-all duration-200">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto rounded-lg border border-border shadow-md"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={captureImage}
              disabled={isLoading}
              className="rounded-full h-14 w-14 bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:scale-105 transition-transform"
            >
              <span className="sr-only">Capturar</span>
              <div className="h-10 w-10 rounded-full border-2 border-primary" />
            </button>
          </div>
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-5 w-5" />
          </button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Vista previa de imagen seleccionada/capturada */}
      {previewImage && !isCapturing && (
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Vista previa"
              className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm"
            />
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => analyzeImage(new Blob())} disabled={isLoading} size="lg" className="flex-1 max-w-xs">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <LucideCamera className="mr-2 h-4 w-4" />
                  Analizar Imagen
                </>
              )}
            </Button>
            <Button onClick={cancelPreview} disabled={isLoading} variant="outline" size="lg">
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading && (
        <div className="mt-4 text-center transition-all duration-200">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Analizando imagen...</p>
            <p className="text-xs text-muted-foreground mt-1">Esto puede tardar unos segundos</p>
          </div>
        </div>
      )}
    </div>
  )
}
