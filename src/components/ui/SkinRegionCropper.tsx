import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'

export interface SanitizeResult {
  ymin: number
  xmin: number
  ymax: number
  xmax: number
}

export function sanitizeBox(box?: number[]): SanitizeResult | null {
  if (!Array.isArray(box) || box.length !== 4) return null

  const numbers = box.map((val) => Number(val))
  if (numbers.some((num) => isNaN(num))) return null

  let [ymin, xmin, ymax, xmax] = numbers

  // Clamp within 0-100%
  ymin = Math.max(0, Math.min(100, ymin))
  xmin = Math.max(0, Math.min(100, xmin))
  ymax = Math.max(0, Math.min(100, ymax))
  xmax = Math.max(0, Math.min(100, xmax))

  if (ymax <= ymin || xmax <= xmin) return null

  return { ymin, xmin, ymax, xmax }
}

interface SkinRegionCropperProps {
  imageSrc: string
  box?: number[]
  label: string
  location: string
  description: string
  severity?: 'low' | 'medium' | 'high'
  isSelected?: boolean
  onClick?: () => void
}

export function SkinRegionCropper({
  imageSrc,
  box,
  label,
  location,
  description,
  severity = 'medium',
  isSelected = false,
  onClick,
}: SkinRegionCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cropSuccess, setCropSuccess] = useState(false)

  const sanitized = sanitizeBox(box)

  useEffect(() => {
    if (!sanitized || !imageSrc) {
      setCropSuccess(false)
      return
    }

    let isMounted = true
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      if (!isMounted || !canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { naturalWidth: nw, naturalHeight: nh } = img

      // Convert percentages to absolute pixel bounds
      const sx = (sanitized.xmin / 100) * nw
      const sy = (sanitized.ymin / 100) * nh
      const sw = Math.max(1, ((sanitized.xmax - sanitized.xmin) / 100) * nw)
      const sh = Math.max(1, ((sanitized.ymax - sanitized.ymin) / 100) * nh)

      // Set destination canvas size
      canvas.width = 120
      canvas.height = 120

      ctx.clearRect(0, 0, 120, 120)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 120, 120)
      setCropSuccess(true)
    }

    img.onerror = () => {
      if (isMounted) setCropSuccess(false)
    }

    img.src = imageSrc

    return () => {
      isMounted = false
    }
  }, [imageSrc, box])

  const severityBadgeClass =
    severity === 'high'
      ? 'severity-high'
      : severity === 'medium'
      ? 'severity-medium'
      : 'severity-low'

  return (
    <div
      className={`skin-region-card ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      {/* Thumbnail Container */}
      <div className="crop-thumbnail-box">
        {sanitized && cropSuccess ? (
          <canvas ref={canvasRef} className="crop-canvas" />
        ) : (
          <div className="crop-fallback-icon">
            <MapPin size={24} />
          </div>
        )}
      </div>

      {/* Region Details */}
      <div className="region-details">
        <div className="region-header">
          <h4 className="region-label">{label}</h4>
          <span className={`severity-badge ${severityBadgeClass}`}>
            {severity === 'high' ? 'Perhatian' : severity === 'medium' ? 'Sedang' : 'Ringan'}
          </span>
        </div>
        <span className="region-location">📍 {location}</span>
        <p className="region-desc">{description}</p>
      </div>

      <style>{`
        .skin-region-card {
          display: flex; gap: 14px; padding: 14px; border-radius: var(--radius-xl);
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm); position: relative;
        }
        .skin-region-card:hover {
          border-color: var(--color-primary-container); transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(14, 165, 233, 0.15);
        }
        .skin-region-card.is-selected {
          border-color: var(--color-primary); background: rgba(238, 246, 252, 0.9);
          box-shadow: 0 4px 18px rgba(14, 165, 233, 0.22);
        }

        .crop-thumbnail-box {
          width: 80px; height: 80px; border-radius: var(--radius-lg); overflow: hidden;
          background: var(--color-surface-container-low); border: 1px solid var(--color-secondary-container);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .crop-canvas { width: 100%; height: 100%; object-fit: cover; }
        .crop-fallback-icon { color: var(--color-primary); opacity: 0.8; }

        .region-details { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
        .region-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .region-label { font-size: 0.9375rem; font-weight: 700; color: var(--color-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .region-location { font-size: 0.75rem; font-weight: 600; color: var(--color-secondary); }
        .region-desc { font-size: 0.8125rem; color: var(--color-text-main); margin: 2px 0 0 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .severity-badge {
          font-size: 0.6875rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); text-transform: uppercase;
        }
        .severity-high { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .severity-medium { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
        .severity-low { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
      `}</style>
    </div>
  )
}
