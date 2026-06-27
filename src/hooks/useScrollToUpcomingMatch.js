import { useEffect, useRef } from "react"

export function useScrollToUpcomingMatch(matches, loading) {
  const hasScrolled = useRef(false)

  useEffect(() => {
    if (loading || matches.length === 0 || hasScrolled.current) return

    const target = matches.find((m) => m.status !== "FINISHED")
    if (!target) return

    hasScrolled.current = true

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(`match-${target.id}`)
          if (!el) return

          const rect = el.getBoundingClientRect()
          const isVisible = rect.top >= 0 && rect.top <= window.innerHeight

          if (!isVisible) {
            const header = document.querySelector(".layout-header")
            const offset = header ? header.offsetHeight + 8 : 80
            const top = rect.top + window.scrollY - offset
            window.scrollTo({ top, behavior: "smooth" })
          }
        }, 100)
      })
    })
  }, [loading, matches])
}
