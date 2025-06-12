import type { ClerkOptions } from "@clerk/types"

export const clerkAppearance: ClerkOptions["appearance"] = {
  elements: {
    formButtonPrimary: "bg-primary hover:bg-primary/90",
    footerActionLink: "text-primary hover:text-primary/90",
    card: "shadow-md",
  },
  variables: {
    colorPrimary: "hsl(142.1, 76.2%, 36.3%)",
  },
}

export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""
