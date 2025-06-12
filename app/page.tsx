import { WelcomePage } from "@/components/welcome-page"

export default function HomePage() {
  console.log("🔍 Renderizando HomePage")

  // Mostrar siempre la página de bienvenida sin intentar autenticar
  return <WelcomePage />
}
