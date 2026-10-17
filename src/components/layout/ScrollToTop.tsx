import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop ensures every client-side page navigation in React Router
 * resets window scroll to the top (0, 0) instantly.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname])

  return null
}
