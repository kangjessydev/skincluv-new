import { useEffect } from 'react'

/**
 * useScrollReveal
 * =============================================================================
 * Lightweight, zero-dependency IntersectionObserver hook for buttery-smooth
 * scroll reveal animations (.cluv-reveal, .cluv-reveal-group).
 */
export function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  useEffect(() => {
    // If user prefers reduced motion, immediately reveal everything
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = document.querySelectorAll<HTMLElement>('.cluv-reveal, .cluv-reveal-group')

    if (!elements.length) return

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            obs.unobserve(entry.target)
          }
        })
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? '0px 0px -50px 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [options?.threshold, options?.rootMargin])
}
