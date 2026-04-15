/**
 * ConfettiCanvas.tsx — Fires confetti burst when confettiTrigger increments
 * Uses canvas-confetti library
 */

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useUIStore } from '../store/uiStore'

export default function ConfettiCanvas() {
  const trigger = useUIStore((s) => s.confettiTrigger)
  const prevRef = useRef(0)

  useEffect(() => {
    if (trigger > prevRef.current) {
      prevRef.current = trigger

      // Burst from center-bottom, cinema style
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x: 0.5, y: 0.75 },
        colors: ['#e50914', '#f5c518', '#ff6b35', '#22d3a8', '#ffffff'],
        gravity: 1.2,
        scalar: 1.1,
        ticks: 200,
      })

      // Side bursts with slight delay
      setTimeout(() => {
        confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#f5c518', '#ff6b35'] })
        confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#e50914', '#22d3a8'] })
      }, 150)
    }
  }, [trigger])

  return null // No DOM output — confetti renders on its own canvas
}
