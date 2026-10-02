import '@/styles/ui-components.css'

/**
 * Loading screen — shown while auth state is initializing.
 */
export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo animate-float">
        <span>✦</span>
      </div>
      <p className="loading-text animate-pulse">Skincluv</p>
    </div>
  )
}
