/**
 * Módulo simplificado para almacenamiento en el cliente
 */

// Función simple para encriptar datos
function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data)
    return btoa(jsonString) // Base64 encoding
  } catch (error) {
    console.error("Error al encriptar datos:", error)
    return JSON.stringify(data)
  }
}

// Función simple para desencriptar datos
function decryptData(encryptedData: string): any {
  try {
    const jsonString = atob(encryptedData) // Base64 decoding
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("Error al desencriptar datos:", error)
    return null
  }
}

// Guardar datos
export function secureStore(key: string, data: any): boolean {
  try {
    if (typeof window === "undefined") return false

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

// Recuperar datos
export function secureRetrieve(key: string): any {
  try {
    if (typeof window === "undefined") return null

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

// Eliminar datos
export function secureRemove(key: string): boolean {
  try {
    if (typeof window === "undefined") return false

    const storageKey = `fridgy_${key}`
    localStorage.removeItem(storageKey)
    console.log(`🗑️ Datos eliminados: ${key}`)
    return true
  } catch (error) {
    console.error("❌ Error al eliminar datos:", error)
    return false
  }
}

// Función para obtener datos de análisis específicos
export function getAnalysisData(fridgeId: string) {
  const key = `data_${fridgeId}`
  return secureRetrieve(key)
}
