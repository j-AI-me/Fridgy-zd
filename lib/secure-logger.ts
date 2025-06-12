/**
 * Servicio de logging seguro que evita exponer información sensible
 */

// Niveles de log
type LogLevel = "debug" | "info" | "warn" | "error"

// Configuración del logger
const LOG_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug"
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Lista de patrones sensibles a redactar
const SENSITIVE_PATTERNS = [
  /api[-_]?key/i,
  /auth[-_]?token/i,
  /password/i,
  /secret/i,
  /credential/i,
  /private[-_]?key/i,
  /session[-_]?id/i,
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/, // Tarjetas de crédito
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Emails
]

// Función para redactar información sensible
function redactSensitiveInfo(data: any): any {
  if (data === null || data === undefined) return data

  if (typeof data === "string") {
    // Redactar patrones sensibles en strings
    let redacted = data
    SENSITIVE_PATTERNS.forEach((pattern) => {
      redacted = redacted.replace(pattern, "[REDACTADO]")
    })
    return redacted
  }

  if (typeof data === "object") {
    if (Array.isArray(data)) {
      // Redactar arrays recursivamente
      return data.map((item) => redactSensitiveInfo(item))
    } else {
      // Redactar objetos recursivamente
      const redactedObj: Record<string, any> = {}

      for (const [key, value] of Object.entries(data)) {
        // Verificar si la clave es sensible
        const isSensitiveKey = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))

        if (isSensitiveKey) {
          redactedObj[key] = "[REDACTADO]"
        } else {
          redactedObj[key] = redactSensitiveInfo(value)
        }
      }

      return redactedObj
    }
  }

  // Devolver otros tipos de datos sin cambios
  return data
}

// Función para formatear el mensaje de log
function formatLogMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const formattedData = data ? JSON.stringify(redactSensitiveInfo(data)) : ""
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedData}`
}

// Funciones de logging
export const logger = {
  debug(message: string, data?: any) {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.debug) {
      console.debug(formatLogMessage("debug", message, data))
    }
  },

  info(message: string, data?: any) {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.info) {
      console.info(formatLogMessage("info", message, data))
    }
  },

  warn(message: string, data?: any) {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.warn) {
      console.warn(formatLogMessage("warn", message, data))
    }
  },

  error(message: string, error?: any) {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.error) {
      console.error(
        formatLogMessage("error", message, {
          message: error?.message,
          stack: error?.stack,
          ...(error && typeof error === "object" ? redactSensitiveInfo(error) : {}),
        }),
      )
    }
  },
}
