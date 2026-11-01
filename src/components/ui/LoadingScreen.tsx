import '@/styles/ui-components.css'
import { Skeleton } from '@/components/ui/SkeletonLoader'

/**
 * Loading screen — shown while auth state is initializing.
 * Pure skeleton layout (no logo, no spinner) to prevent layout shift and visual jarring.
 */
export default function LoadingScreen() {
  return (
    <div className="app-skeleton-shell" role="status" aria-label="Memuat aplikasi...">
      {/* Topbar Skeleton */}
      <div className="app-skeleton-topbar">
        <Skeleton width={120} height={28} radius="var(--cluv-radius-md)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton width={80} height={32} radius="var(--cluv-radius-pill)" />
          <Skeleton width={36} height={36} radius="var(--cluv-radius-pill)" />
        </div>
      </div>

      {/* Main Body Content Skeleton */}
      <div className="app-skeleton-body">
        {/* Page Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={220} height={28} radius="var(--cluv-radius-md)" />
          <Skeleton width={320} height={16} radius="var(--cluv-radius-sm)" />
        </div>

        {/* Hero Card Skeleton */}
        <Skeleton height={150} radius="var(--cluv-radius-xl)" />

        {/* Grid Cards Skeleton */}
        <div className="app-skeleton-grid">
          <Skeleton height={170} radius="var(--cluv-radius-lg)" />
          <Skeleton height={170} radius="var(--cluv-radius-lg)" />
          <Skeleton height={170} radius="var(--cluv-radius-lg)" />
        </div>
      </div>
    </div>
  )
}

