// src/components/scans/IngredientScanDetailModal.tsx
// Zero-Emoji, Defensible Copywriting, 100% Pure Cluv Framework Modal
// Compliance: Invariant 13 (Defensible claims), Invariant 19 (Non-therapeutic claims)

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar,
  X,
  Sparkles,
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  MessageSquare,
} from 'lucide-react'
import type { IngredientScan } from '@/types/database'
import { Badge, Button } from '@/components/ui'

interface IngredientScanDetailModalProps {
  scan: IngredientScan | null
  onClose: () => void
  onConsult?: () => void
}

export default function IngredientScanDetailModal({
  scan,
  onClose,
  onConsult,
}: IngredientScanDetailModalProps) {
  useEffect(() => {
    if (!scan) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [scan, onClose])

  if (!scan) return null

  let ingRawResponse: Record<string, any> = {}
  try {
    if (typeof scan.raw_ai_response === 'string') {
      ingRawResponse = JSON.parse(scan.raw_ai_response)
    } else if (scan.raw_ai_response && typeof scan.raw_ai_response === 'object') {
      ingRawResponse = scan.raw_ai_response as Record<string, any>
    }
  } catch {
    ingRawResponse = {}
  }

  const ingBreakdown = Array.isArray(scan.ingredients_breakdown)
    ? (scan.ingredients_breakdown as any[])
    : Array.isArray(ingRawResponse?.ingredients_breakdown)
    ? ingRawResponse.ingredients_breakdown
    : []

  const heroIngredients = Array.isArray(ingRawResponse?.hero_actives)
    ? ingRawResponse.hero_actives
    : Array.isArray(scan.key_ingredients)
    ? scan.key_ingredients
    : []

  const dangerCombos = Array.isArray(ingRawResponse?.layering_guide?.danger_combos)
    ? ingRawResponse.layering_guide.danger_combos
    : []

  const score = scan.safety_score ?? 80
  const isSafe = scan.is_safe && score >= 65
  const isVerySafe = score >= 85

  // SVG Gauge calculations
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const dateObj = new Date(scan.created_at)
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return createPortal(
    <div
      className="cluv-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cluv-modal-box is-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="cluv-modal-header">
          <div>
            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
              <Calendar size={13} />
              <span>{formattedDate}</span>
            </div>
            <h3 className="cluv-modal-title">{scan.product_name}</h3>
          </div>
          <button
            type="button"
            className="cluv-modal-close"
            onClick={onClose}
            aria-label="Tutup Dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="cluv-modal-body cluv-flex-col cluv-gap-4">
          {/* Hero Safety Card */}
          <div className="cluv-card cluv-p-4 cluv-flex-row cluv-items-center cluv-gap-4 cluv-flex-wrap">
            {/* Circular Gauge */}
            <div className="cluv-score-ring is-lg">
              <svg className="cluv-score-svg" viewBox="0 0 100 100">
                <circle
                  className="cluv-score-bg-circle"
                  cx="50"
                  cy="50"
                  r={radius}
                  strokeWidth="8"
                />
                <circle
                  className={`cluv-score-fg-circle ${
                    isVerySafe ? 'is-optimal' : isSafe ? 'is-good' : 'is-alert'
                  }`}
                  cx="50"
                  cy="50"
                  r={radius}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="cluv-score-center">
                <span className="cluv-score-val">{score}</span>
                <span className="cluv-score-max">/100</span>
              </div>
            </div>

            {/* Headline Meta */}
            <div className="cluv-flex-col cluv-gap-2 cluv-flex-1 cluv-min-w-xs">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                <Badge variant={isVerySafe ? 'teal' : isSafe ? 'info' : 'rose'} size="sm">
                  {isVerySafe ? 'Formula Sangat Baik' : isSafe ? 'Formula Baik' : 'Perlu Perhatian'}
                </Badge>
                {scan.brand && (
                  <span className="cluv-chip">
                    <FlaskConical size={12} /> {scan.brand.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
                {isSafe ? (
                  <ShieldCheck size={14} className="cluv-text-teal" />
                ) : (
                  <ShieldAlert size={14} className="cluv-text-gold" />
                )}
                <span>
                  {isSafe
                    ? 'Formula terverifikasi aman & minim resiko iritasi'
                    : 'Mengandung bahan yang memerlukan perhatian'}
                </span>
              </div>
              <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1">
                {ingRawResponse?.summary || 'Analisis komposisi bahan aktif, kestabilan formula, dan kompatibilitas kulit.'}
              </p>
            </div>
          </div>

          {/* Hero Actives */}
          {heroIngredients.length > 0 && (
            <div className="cluv-flex-col cluv-gap-2">
              <h4 className="cluv-title-card is-sm cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0">
                <Sparkles size={14} className="cluv-text-teal" />
                <span>Hero Actives &amp; Bahan Kunci</span>
              </h4>
              <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1">
                {heroIngredients.map((item: any, hIdx: number) => {
                  const name = typeof item === 'string' ? item : item.name
                  const func = typeof item === 'object' ? item.function : null
                  return (
                    <span key={hIdx} className="cluv-chip is-active">
                      {name} {func ? `(${func})` : ''}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Layering Warning */}
          {dangerCombos.length > 0 && (
            <div className="cluv-flex-col cluv-gap-2">
              <h4 className="cluv-title-card is-sm cluv-flex-row cluv-items-center cluv-gap-2 cluv-text-danger cluv-m-0">
                <AlertTriangle size={14} />
                <span>Peringatan Kombinasi (Layering)</span>
              </h4>
              {dangerCombos.map((dc: any, dIdx: number) => (
                <div key={dIdx} className="cluv-p-3 cluv-border-rose cluv-rounded-sm cluv-bg-surface-soft">
                  <span className="cluv-caption cluv-font-bold cluv-text-danger cluv-block cluv-mb-1">
                    {Array.isArray(dc.pair) ? dc.pair.join(' + ') : 'Inkompatibilitas Bahan'}
                  </span>
                  <p className="cluv-caption cluv-text-muted cluv-m-0">
                    {dc.warning || dc.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Full Breakdown */}
          {ingBreakdown.length > 0 && (
            <div className="cluv-flex-col cluv-gap-2">
              <h4 className="cluv-title-card is-sm cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0">
                <Layers size={14} className="cluv-text-teal" />
                <span>Komposisi Lengkap ({ingBreakdown.length} Bahan)</span>
              </h4>
              <div className="cluv-card cluv-p-2 cluv-max-h-56 cluv-overflow-y-auto cluv-flex-col cluv-gap-1 cluv-bg-surface-soft">
                {ingBreakdown.map((item: any, bIdx: number) => {
                  const badge = String(item.badge || 'safe').toLowerCase()
                  const isSafeItem = badge === 'safe' || badge === 'aman'
                  return (
                    <div key={bIdx} className="cluv-flex-row cluv-items-center cluv-justify-between cluv-py-1.5 cluv-border-b cluv-last-border-0">
                      <span className="cluv-caption cluv-text-dark">{item.name}</span>
                      <Badge variant={isSafeItem ? 'teal' : 'rose'} size="sm">
                        {isSafeItem ? 'Sangat Baik' : 'Perlu Perhatian'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Defensible Disclaimer */}
          <div className="cluv-alert is-neutral cluv-mt-1">
            <ShieldCheck size={16} className="cluv-text-muted cluv-flex-shrink-0" />
            <p className="cluv-micro cluv-text-muted cluv-m-0">
              Verifikasi formula ini adalah estimasi keamanan bahan kosmetik berbasis data ilmiah publik dan regulasi kosmetik (BPOM/FDA). Bukan merupakan jaminan medis bebas reaksi alergi individual.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="cluv-modal-footer">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Tutup
          </Button>
          {onConsult && (
            <Button
              variant="primary"
              size="md"
              iconLeft={<MessageSquare size={16} />}
              onClick={onConsult}
            >
              Tanya Produk ke Skinsistant
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
