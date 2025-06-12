"use client"

import { ArrowLeft } from "lucide-react"

interface HeaderProps {
  title: string
  showBackButton?: boolean
  onBack?: () => void
}

export function Header({ title, showBackButton = false, onBack }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-border h-14 flex items-center px-4">
      {showBackButton && (
        <button onClick={onBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  )
}
