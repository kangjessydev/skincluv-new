import '@/styles/ui-components.css'
import { Skeleton } from '@/components/ui/SkeletonLoader'

/**
 * Route-level lazy loading fallback.
 * Uses skeleton placeholders instead of spinners for seamless page navigation.
 */
export default function PageLoader() {
  return (
    <div className="page-skeleton-shell" role="status" aria-label="Memuat halaman...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width={180} height={24} radius="var(--cluv-radius-md)" />
        <Skeleton width={260} height={14} radius="var(--cluv-radius-sm)" />
      </div>

      <Skeleton height={180} radius="var(--cluv-radius-lg)" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton height={56} radius="var(--cluv-radius-md)" />
        <Skeleton height={56} radius="var(--cluv-radius-md)" />
      </div>
    </div>
  )
}

