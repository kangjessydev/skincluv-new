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

      <style>{`
        .loading-screen {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          background: var(--gradient-dark);
        }

        .loading-logo {
          width: 80px;
          height: 80px;
          background: var(--gradient-brand);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          box-shadow: var(--shadow-glow);
        }

        .loading-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: var(--gradient-brand);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  )
}
