import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import '@/styles/ui-components.css'

export interface SanitizeResult {
  ymin: number
  xmin: number
  ymax: number
  xmax: number
}

function sanitizeBox(box?: number[]): SanitizeResult | null {
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

  const sanitized = useMemo(() => sanitizeBox(box), [box])

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
  }, [imageSrc, sanitized])

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
        <span className="region-location"><MapPin size={12} className="inline mr-1" />{location}</span>
        <p className="region-desc">{description}</p>
      </div>


    </div>
  )
}
