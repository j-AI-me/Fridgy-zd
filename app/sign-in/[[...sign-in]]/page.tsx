import { SignIn } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-white to-green-50">
      <header className="p-4 flex items-center">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Volver</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/90",
            },
          }}
          redirectUrl="/app"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
