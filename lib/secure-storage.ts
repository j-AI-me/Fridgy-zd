/**
 * Módulo simplificado para almacenamiento en el cliente
 */

// Función simple para encriptar datos (Base64)
function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data)
    return btoa(jsonString)
  } catch (error) {
    console.error("Error al encriptar datos:", error)
    return JSON.stringify(data) // Fallback a JSON sin encriptar si hay error
  }
}

// Función simple para desencriptar datos (Base64)
function decryptData(encryptedData: string): any {
  try {
    const jsonString = atob(encryptedData)
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("Error al desencriptar datos:", error)
    return null // Retorna null si hay error al desencriptar
  }
}

// Guardar datos de forma segura en localStorage
export function secureStore(key: string, data: any): boolean {
  try {
    if (typeof window === "undefined") return false // Solo en el cliente

    const storageKey = `fridgy_${key}`
    const encryptedData = encryptData(data)
    localStorage.setItem(storageKey, encryptedData)

    console.log(`💾 Datos guardados: ${key}`)
    return true
  } catch (error) {
    console.error("❌ Error al guardar datos:", error)
    return false
  }
}

// Recuperar datos de forma segura de localStorage
export function secureRetrieve(key: string): any {
  try {
    if (typeof window === "undefined") return null // Solo en el cliente

    const storageKey = `fridgy_${key}`
    const encryptedData = localStorage.getItem(storageKey)

    if (!encryptedData) {
      console.log(`⚠️ No se encontraron datos para: ${key}`)
      return null
    }

    const data = decryptData(encryptedData)
    console.log(`✅ Datos recuperados: ${key}`)
    return data
  } catch (error) {
    console.error("❌ Error al recuperar datos:", error)
    return null
  }
}

// Eliminar datos de localStorage
export function secureRemove(key: string): boolean {
  try {
    if (typeof window === "undefined") return false // Solo en el cliente

    const storageKey = `fridgy_${key}`
    localStorage.removeItem(storageKey)
    console.log(`🗑️ Datos eliminados: ${key}`)
    return true
  } catch (error) {
    console.error("❌ Error al eliminar datos:", error)
    return false
  }
}

// Función para guardar los resultados completos del análisis (incluyendo metadata)
export function saveAnalysisData(analysisId: string, apiResponse: any) {
  try {
    // Guardamos la respuesta completa de la API, que ya incluye data, isExample, message
    secureStore(`analysis_${analysisId}`, apiResponse)
    console.log("💾 Datos de análisis guardados localmente:", analysisId)
    return true
  } catch (error) {
    console.error("❌ Error al guardar datos de análisis:", error)
    return false
  }
}

// Función para obtener datos de análisis específicos por ID
export function getAnalysisData(analysisId: string): any {
  if (typeof window === "undefined") return null // Solo en el cliente
  if (!analysisId) {
    console.warn("⚠️ getAnalysisData llamado sin analysisId.")
    return null
  }
  // secureRetrieve se encarga de añadir el prefijo "fridgy_" y manejar la desencriptación.
  // La clave que usa saveAnalysisData es `analysis_${analysisId}`.
  const data = secureRetrieve(`analysis_${analysisId}`)
  if (data) {
    console.log(`✅ Datos de análisis recuperados mediante getAnalysisData para ID: ${analysisId}`)
  } else {
    console.log(`⚠️ No se encontraron datos mediante getAnalysisData para ID: ${analysisId}`)
  }
  return data
}
