import { type NextRequest, NextResponse } from "next/server"

// Almacenamiento en memoria para el rate limiting
// En producción, esto debería usar Redis u otro almacenamiento distribuido
const ipRequests = new Map<string, { count: number; resetTime: number }>()

// Configuración del rate limiting
const RATE_LIMIT_MAX = 10 // Máximo número de solicitudes
const RATE_LIMIT_WINDOW = 60 * 1000 // Ventana de tiempo (1 minuto)

export async function rateLimit(request: NextRequest) {
  // Obtener la IP del cliente
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  // Obtener el tiempo actual
  const now = Date.now()

  // Obtener o inicializar el registro para esta IP
  let record = ipRequests.get(ip)

  if (!record) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
    ipRequests.set(ip, record)
  }

  // Reiniciar el contador si ha pasado el tiempo de reset
  if (now > record.resetTime) {
    record.count = 0
    record.resetTime = now + RATE_LIMIT_WINDOW
  }

  // Incrementar el contador
  record.count++

  // Calcular los encabezados para el rate limiting
  const remaining = Math.max(0, RATE_LIMIT_MAX - record.count)
  const reset = Math.ceil((record.resetTime - now) / 1000)

  // Configurar los encabezados de respuesta
  const headers = new Headers()
  headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX.toString())
  headers.set("X-RateLimit-Remaining", remaining.toString())
  headers.set("X-RateLimit-Reset", reset.toString())

  // Si se ha excedido el límite, devolver un error 429
  if (record.count > RATE_LIMIT_MAX) {
    console.warn(`⚠️ Rate limit excedido para IP: ${ip}`)
    return NextResponse.json(
      { success: false, error: "Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde." },
      { status: 429, headers },
    )
  }

  // Si no se ha excedido, devolver los encabezados para usar en la respuesta
  return { headers }
}

// Limpiar periódicamente los registros antiguos para evitar fugas de memoria
setInterval(
  () => {
    const now = Date.now()
    for (const [ip, record] of ipRequests.entries()) {
      if (now > record.resetTime) {
        ipRequests.delete(ip)
      }
    }
  },
  60 * 60 * 1000,
) // Limpiar cada hora
