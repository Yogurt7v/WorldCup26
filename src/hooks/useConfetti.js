import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti(active) {
  useEffect(() => {
    if (!active) return

    const colors = [
      '#007aff', '#34c759', '#ff3b30',
      '#ff9f0a', '#af52de', '#ff2d55', '#5856d6',
    ]

    function burst() {
      confetti({
        particleCount: 50, angle: 70, spread: 80,
        origin: { x: 0, y: 0.6 }, colors,
      })
      confetti({
        particleCount: 50, angle: 110, spread: 80,
        origin: { x: 1, y: 0.6 }, colors,
      })
      confetti({
        particleCount: 30, spread: 120,
        origin: { x: 0.5, y: 0.3 }, colors,
      })
    }

    burst()
    const interval = setInterval(burst, 5000)

    return () => clearInterval(interval)
  }, [active])
}
