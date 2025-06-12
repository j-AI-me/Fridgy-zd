import { secureStore, secureRetrieve } from "@/lib/secure-storage"

// Tipo para los datos del modo invitado
type GuestModeData = {
  remainingRequests: number
  lastRequestTime?: string
  analysisIds: string[]
}

// Función para obtener los datos del modo invitado
export function getGuestModeData(): GuestModeData {
  const data = secureRetrieve("guest_mode") as GuestModeData | null

  if (!data) {
    // Inicializar con valores predeterminados
    const defaultData: GuestModeData = {
      remainingRequests: 3,
      analysisIds: [],
    }
    secureStore("guest_mode", defaultData)
    return defaultData
  }

  return data
}

// Función para verificar si el usuario puede realizar un análisis
export function canPerformAnalysis(): boolean {
  const data = getGuestModeData()
  return data.remainingRequests > 0
}

// Función para registrar un análisis
export function registerAnalysis(analysisId: string): boolean {
  const data = getGuestModeData()

  if (data.remainingRequests <= 0) {
    return false
  }

  // Actualizar los datos
  const updatedData: GuestModeData = {
    remainingRequests: data.remainingRequests - 1,
    lastRequestTime: new Date().toISOString(),
    analysisIds: [...data.analysisIds, analysisId],
  }

  secureStore("guest_mode", updatedData)
  return true
}

// Función para verificar si un análisis pertenece al usuario invitado
export function isGuestAnalysis(analysisId: string): boolean {
  const data = getGuestModeData()
  return data.analysisIds.includes(analysisId)
}

// Función para resetear el modo invitado (útil para pruebas)
export function resetGuestMode(): void {
  const defaultData: GuestModeData = {
    remainingRequests: 3,
    analysisIds: [],
  }
  secureStore("guest_mode", defaultData)
}
