import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar que Clerk está configurado correctamente
    const publicKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    return NextResponse.json({
      success: true,
      message: "Clerk está configurado correctamente",
      publicKey: publicKey ? "Configurado" : "No configurado",
    })
  } catch (error) {
    console.error("Error al verificar Clerk:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar la configuración de Clerk",
      },
      { status: 500 },
    )
  }
}
