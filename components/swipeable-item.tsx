"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, type PanInfo } from "framer-motion"

interface SwipeableItemProps {
  onSwipeLeft: () => void
  onTap?: () => void
  children: React.ReactNode
  className?: string
}

export function SwipeableItem({ onSwipeLeft, onTap, children, className = "" }: SwipeableItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartTimeRef = useRef<number | null>(null)
  const dragDistanceRef = useRef(0)

  const handleDragStart = () => {
    setIsDragging(true)
    dragStartTimeRef.current = Date.now()
    dragDistanceRef.current = 0
  }

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)

    // Si el deslizamiento fue lo suficientemente largo hacia la izquierda, ejecutar onSwipeLeft
    if (info.offset.x < -80) {
      onSwipeLeft()
    }

    // Resetear referencias
    dragStartTimeRef.current = null
    dragDistanceRef.current = 0
  }

  const handleDrag = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragDistanceRef.current = Math.abs(info.offset.x)
  }

  const handleTap = () => {
    // Solo ejecutar onTap si no fue un deslizamiento
    if (!isDragging && dragDistanceRef.current < 5 && onTap) {
      onTap()
    }
  }

  return (
    <motion.div
      className={`relative overflow-hidden touch-none ${className}`}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      onTap={handleTap}
      whileDrag={{ cursor: "grabbing" }}
    >
      <div className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center px-4 text-white">
        Eliminar
      </div>
      {children}
    </motion.div>
  )
}
