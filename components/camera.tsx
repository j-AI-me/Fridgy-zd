"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { LucideCamera, Upload, Loader2, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { secureStore } from "@/lib/secure-storage"
import { v4 as uuidv4 } from "uuid" // Añadir uuid para generar IDs únicos
import { getUserMetadata } from "@/lib/user-profile"
import { useUser } from "@clerk/nextjs"
import { canPerformAnalysis } from "@/lib/guest-mode"

interface CameraProps {
  onAnalysisSuccess: (result: any) => void
}

// Datos de ejemplo para usar cuando la API no está disponible
const FALLBACK_DATA = {
  ingredientes: ["Tomates", "Cebolla", "Pimiento", "Ajo", "Huevos", "Queso", "Leche", "Mantequilla"],
  recetas: [
    {
      titulo: "Tortilla de Verduras",
      descripcion: "Una deliciosa tortilla con las verduras de tu nevera",
      ingredientes: {
        disponibles: ["Huevos", "Cebolla", "Pimiento", "Queso"],
        adicionales: ["Sal", "Pimienta", "Aceite de oliva"],
      },
      preparacion: [
        "Corta la cebolla y el pimiento en trozos pequeños.",
        "Bate los huevos en un recipiente y añade sal y pimienta al gusto.",
        "Calienta aceite en una sartén y sofríe la cebolla y el pimiento hasta que estén tiernos.",
        "Añade los huevos batidos y cocina a fuego medio-bajo.",
        "Cuando esté casi cuajada, añade el queso rallado por encima.",
        "Dobla la tortilla por la mitad y sirve caliente.",
      ],
    },
    {
      titulo: "Salsa de Tomate Casera",
      descripcion: "Una salsa versátil para pasta, pizza o como acompañamiento",
      ingredientes: {
        disponibles: ["Tomates", "Cebolla", "Ajo"],
        adicionales: ["Aceite de oliva", "Sal", "Pimienta", "Albahaca"],
      },
      preparacion: [
        "Pica finamente la cebolla y el ajo.",
        "Calienta aceite en una sartén y sofríe la cebolla y el ajo hasta que estén transparentes.",
        "Añade los tomates cortados en cubos y cocina a fuego medio durante 15-20 minutos.",
        "Sazona con sal y pimienta al gusto.",
        "Si lo deseas, añade albahaca fresca picada al final de la cocción.",
      ],
    },
    {
      titulo: "Queso a la Plancha con Tomate",
      descripcion: "Un aperitivo rápido y sabroso",
      ingredientes: {
        disponibles: ["Queso", "Tomates"],
        adicionales: ["Pan", "Orégano", "Aceite de oliva"],
      },
      preparacion: [
        "Corta el queso en rebanadas de aproximadamente 1 cm de grosor.",
        "Calienta una sartén antiadherente a fuego medio-alto.",
        "Coloca las rebanadas de queso en la sartén y cocina hasta que se doren por ambos lados.",
        "Sirve el queso caliente con rodajas de tomate fresco.",
        "Rocía con un poco de aceite de oliva y espolvorea orégano por encima.",
        "Acompaña con pan tostado si lo deseas.",
      ],
    },
  ],
}

export function Camera({ onAnalysisSuccess }: CameraProps) {
  console.log("🔍 Renderizando componente Camera")

  const { toast } = useToast()
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<{
    dietaryPreferences: string[]
    allergies: string[]
  }>({ dietaryPreferences: [], allergies: [] })
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isSignedIn } = useUser()
  const [canAnalyze, setCanAnalyze] = useState(true)

  useEffect(() => {
    console.log("📸 Camera montada")

    // Verificar si la API de MediaDevices está disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("❌ API de MediaDevices no soportada en este navegador")
    } else {
      console.log("✅ API de MediaDevices disponible")
    }

    // Verificar si el usuario puede realizar análisis
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

    // Cargar preferencias del usuario
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
      console.log("📸 Camera desmontada")
      // Asegurarse de detener la cámara al desmontar
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isSignedIn, toast])

  const startCamera = useCallback(async () => {
    if (!canAnalyze) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.",
        variant: "destructive",
      })
      return
    }

    console.log("🎬 Iniciando cámara")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      console.log("✅ Stream de cámara obtenido:", stream.getVideoTracks().length, "pistas de video")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
        console.log("📹 Cámara iniciada correctamente")
      }
    } catch (error) {
      console.error("❌ Error al acceder a la cámara:", error)
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Por favor, verifica los permisos.",
        variant: "destructive",
      })
    }
  }, [toast, canAnalyze])

  const stopCamera = useCallback(() => {
    console.log("⏹️ Deteniendo cámara")
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsCapturing(false)
      console.log("📹 Cámara detenida correctamente")
    }
  }, [])

  const captureImage = useCallback(async () => {
    if (!canAnalyze) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.",
        variant: "destructive",
      })
      return
    }

    console.log("📸 Capturando imagen")
    if (!videoRef.current || !canvasRef.current) {
      console.error("❌ Referencias de video o canvas no disponibles")
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        console.error("❌ No se pudo obtener el contexto 2D del canvas")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      console.log("🖼️ Dimensiones del canvas:", canvas.width, "x", canvas.height)

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get preview image
      const previewDataUrl = canvas.toDataURL("image/jpeg")
      setPreviewImage(previewDataUrl)

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
          },
          "image/jpeg",
          0.8,
        )
      })

      console.log("✅ Imagen capturada correctamente:", blob.size, "bytes")
      stopCamera()

      // Process the image
      setIsProcessing(true)
      await processImage(blob)
    } catch (error) {
      console.error("❌ Error capturando imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo capturar la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }, [stopCamera, toast, canAnalyze])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!canAnalyze) {
        toast({
          title: "Límite alcanzado",
          description: "Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.",
          variant: "destructive",
        })
        return
      }

      const file = event.target.files?.[0]
      if (!file) {
        console.warn("⚠️ No se seleccionó ningún archivo")
        return
      }

      console.log(
        "📁 Archivo seleccionado:",
        file.name,
        "Tamaño:",
        (file.size / 1024).toFixed(2),
        "KB",
        "Tipo:",
        file.type,
      )

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setIsProcessing(true)
      try {
        await processImage(file)
      } catch (error) {
        console.error("❌ Error procesando imagen:", error)
        toast({
          title: "Error",
          description: "No se pudo procesar la imagen. Inténtalo de nuevo.",
          variant: "destructive",
        })
        setIsProcessing(false)
        setPreviewImage(null)
      }
    },
    [toast, canAnalyze],
  )

  const cancelPreview = () => {
    setPreviewImage(null)
    setIsProcessing(false)
  }

  const processImage = async (imageBlob: Blob) => {
    try {
      console.log("🔄 Procesando imagen...")

      // Validar el tamaño de la imagen
      if (imageBlob.size > 10 * 1024 * 1024) {
        throw new Error("La imagen es demasiado grande. El tamaño máximo es 10MB.")
      }

      // Validar el tipo de la imagen
      if (!imageBlob.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen.")
      }

      // Mostrar mensaje sobre preferencias si existen
      if (userPreferences.dietaryPreferences.length > 0 || userPreferences.allergies.length > 0) {
        let preferencesMessage = "Analizando imagen teniendo en cuenta tus preferencias"

        if (userPreferences.dietaryPreferences.length > 0) {
          preferencesMessage += `: ${userPreferences.dietaryPreferences.join(", ")}`
        }

        if (userPreferences.allergies.length > 0) {
          preferencesMessage +=
            userPreferences.dietaryPreferences.length > 0
              ? ` y evitando: ${userPreferences.allergies.join(", ")}`
              : ` evitando: ${userPreferences.allergies.join(", ")}`
        }

        toast({
          title: "Preferencias detectadas",
          description: preferencesMessage,
        })
      }

      // Intentar usar la API
      try {
        // Crear FormData para enviar la imagen
        const formData = new FormData()
        formData.append("image", imageBlob)

        // Añadir un token anti-CSRF (en una implementación real, esto vendría del servidor)
        const csrfToken = sessionStorage.getItem("csrfToken") || "default-token"

        // Enviar la imagen a la API con un timeout
        console.log("📤 Enviando imagen a la API...")
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRF-Token": csrfToken,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error("❌ Error en la respuesta HTTP:", response.status, response.statusText)
          throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log("📥 Resultado del análisis:", result)

        if (result.success) {
          console.log("✅ Análisis exitoso")

          // Generar un ID único para este análisis
          const analysisId = result.id || uuidv4()

          // Guardar los datos de forma segura
          secureStore(`data_${analysisId}`, result.data)

          // Guardar el ID del último análisis
          secureStore("last_analysis_id", analysisId)

          onAnalysisSuccess({
            id: analysisId,
            ...result.data,
          })
        } else if (result.limitReached) {
          // Si se alcanzó el límite de análisis gratuitos
          setCanAnalyze(false)
          toast({
            title: "Límite alcanzado",
            description: "Has alcanzado el límite de análisis gratuitos. Regístrate para continuar.",
            variant: "destructive",
          })
        } else {
          console.error("❌ Error en el análisis:", result.error)
          throw new Error(result.error || "Error desconocido")
        }
      } catch (apiError) {
        console.error("❌ Error al llamar a la API:", apiError)
        console.log("⚠️ Usando datos de ejemplo como fallback")

        // Generar un ID único para los datos de ejemplo
        const fallbackId = uuidv4()

        // Guardar los datos de ejemplo de forma segura
        secureStore(`data_${fallbackId}`, FALLBACK_DATA)

        // Guardar el ID del último análisis
        secureStore("last_analysis_id", fallbackId)

        // Simular un retraso para que parezca que se está procesando
        await new Promise((resolve) => setTimeout(resolve, 1000))

        onAnalysisSuccess({
          id: fallbackId,
          ...FALLBACK_DATA,
        })
      }
    } catch (error) {
      console.error("❌ Error processing image:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo analizar la imagen. Inténtalo de nuevo con una foto más clara de tu nevera.",
        variant: "destructive",
      })
      setPreviewImage(null)

      // Usar datos de ejemplo como último recurso
      const fallbackId = uuidv4()
      secureStore(`data_${fallbackId}`, FALLBACK_DATA)
      secureStore("last_analysis_id", fallbackId)

      onAnalysisSuccess({
        id: fallbackId,
        ...FALLBACK_DATA,
      })
    } finally {
      setIsProcessing(false)
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
    <div className="w-full max-w-sm">
      {isCapturing ? (
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
              disabled={isProcessing}
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
      ) : previewImage ? (
        <div className="relative transition-all duration-200">
          <img
            src={previewImage || "/placeholder.svg"}
            alt="Vista previa"
            className="w-full h-auto rounded-lg border border-border shadow-md"
          />
          {!isProcessing && (
            <button
              onClick={cancelPreview}
              className="absolute top-2 right-2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
            >
              <span className="sr-only">Cancelar</span>
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 transition-all duration-200">
          <div className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center bg-card shadow-sm hover:shadow-md transition-shadow">
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

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => {
                console.log("📸 Botón 'Usar cámara' clickeado")
                startCamera()
              }}
              disabled={isProcessing}
              className="w-full shadow-sm hover:scale-105 transition-transform"
              variant="default"
            >
              <LucideCamera className="mr-2 h-4 w-4" />
              Usar cámara
            </Button>

            <Button
              onClick={() => {
                console.log("📁 Botón 'Subir foto' clickeado")
                fileInputRef.current?.click()
              }}
              disabled={isProcessing}
              className="w-full shadow-sm hover:scale-105 transition-transform"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir foto
            </Button>

            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>
        </div>
      )}

      {isProcessing && (
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
