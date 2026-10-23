// src/components/scans/IngredientScanDetailDrawer.tsx
// Zero-Emoji, Defensible Regulatory Copywriting, 100% Cluv Framework Slide-Over Drawer
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
  Tag,
  Layers,
  MessageSquare,
} from 'lucide-react'
import type { IngredientScan } from '@/types/database'
import { Badge, Button } from '@/components/ui'

interface IngredientScanDetailDrawerProps {
  scan: IngredientScan | null
  onClose: () => void
  onConsult?: () => void
}

export default function IngredientScanDetailDrawer({
  scan,
  onClose,
  onConsult,
}: IngredientScanDetailDrawerProps) {
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

  const personalNotes = Array.isArray(ingRawResponse?.personal_contraindications)
    ? ingRawResponse.personal_contraindications
    : []

  const safetyScore = scan.safety_score ?? 80
  const isSafe = scan.is_safe && safetyScore >= 65
  const isVerySafe = safetyScore >= 85

  // SVG Gauge calculations
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference

  const dateObj = new Date(scan.created_at)
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return createPortal(
    <div
      className="cluv-drawer-backdrop is-open"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cluv-drawer is-wide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="cluv-drawer-header">
          <div>
            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
              <Calendar size={13} />
              <span>{formattedDate} • {formattedTime}</span>
            </div>
            <h3 className="cluv-drawer-title">{scan.product_name}</h3>
          </div>
          <button
            type="button"
            className="cluv-drawer-close"
            onClick={onClose}
            aria-label="Tutup Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="cluv-drawer-body">
          {/* Hero Score Card */}
          <div className="cluv-card cluv-p-5 cluv-flex-col cluv-gap-4">
            <div className="cluv-flex-row cluv-items-center cluv-gap-4">
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
                  <span className="cluv-score-val">{safetyScore}</span>
                  <span className="cluv-score-max">/100</span>
                </div>
              </div>

              {/* Status Meta */}
              <div className="cluv-flex-col cluv-gap-2 cluv-flex-1">
                <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                  <Badge variant={isVerySafe ? 'teal' : isSafe ? 'info' : 'rose'} size="sm">
                    {isVerySafe ? 'Formula Sangat Baik' : isSafe ? 'Formula Baik' : 'Perlu Perhatian'}
                  </Badge>
                  {scan.brand && (
                    <span className="cluv-chip is-sm">
                      <FlaskConical size={12} /> {scan.brand.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
                  {isSafe ? (
                    <ShieldCheck size={13} className="cluv-text-teal" />
                  ) : (
                    <ShieldAlert size={13} className="cluv-text-gold" />
                  )}
                  <span>
                    {isSafe
                      ? 'Formula kompatibel & minim resiko iritasi'
                      : 'Mengandung bahan yang memerlukan perhatian'}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-md cluv-border">
              <span className="cluv-micro cluv-font-bold cluv-text-dark cluv-uppercase cluv-block cluv-mb-1">
                Ringkasan Komposisi:
              </span>
              <p className="cluv-body cluv-text-muted cluv-m-0">
                {ingRawResponse?.summary || 'Analisis komposisi bahan aktif, kestabilan formula, dan kompatibilitas kulit.'}
              </p>
            </div>
          </div>

          {/* Hero Actives & Key Ingredients */}
          {heroIngredients.length > 0 && (
            <div className="cluv-flex-col cluv-gap-3">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-teal">
                  <Sparkles size={14} />
                </div>
                <h4 className="cluv-title-card cluv-m-0">Hero Actives &amp; Bahan Kunci</h4>
              </div>

              <div className="cluv-flex-row cluv-flex-wrap cluv-gap-2">
                {heroIngredients.map((item: any, idx: number) => {
                  const name = typeof item === 'string' ? item : item.name
                  const func = typeof item === 'object' ? item.function : null
                  return (
                    <div key={idx} className="cluv-chip is-active cluv-flex-row cluv-items-center cluv-gap-1">
                      <span className="cluv-font-bold">{name}</span>
                      {func && <span className="cluv-micro cluv-opacity-80">({func})</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Layering & Compatibility Warnings */}
          {dangerCombos.length > 0 && (
            <div className="cluv-flex-col cluv-gap-3 cluv-mt-2">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-rose">
                  <AlertTriangle size={14} />
                </div>
                <h4 className="cluv-title-card cluv-m-0 cluv-text-danger">
                  Peringatan Kombinasi Pemakaian (Layering)
                </h4>
              </div>

              <div className="cluv-flex-col cluv-gap-2">
                {dangerCombos.map((dc: any, idx: number) => (
                  <div key={idx} className="cluv-card cluv-p-4 cluv-border-rose">
                    <span className="cluv-caption cluv-font-bold cluv-text-danger cluv-block cluv-mb-1">
                      {Array.isArray(dc.pair) ? dc.pair.join(' + ') : 'Inkompatibilitas Bahan'}
                    </span>
                    <p className="cluv-caption cluv-text-muted cluv-m-0">
                      {dc.warning || dc.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Skin Condition Notes */}
          {personalNotes.length > 0 && (
            <div className="cluv-flex-col cluv-gap-3 cluv-mt-2">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-gold">
                  <Tag size={14} />
                </div>
                <h4 className="cluv-title-card cluv-m-0">
                  Catatan Khusus untuk Kondisi Kulitmu
                </h4>
              </div>

              <div className="cluv-flex-col cluv-gap-2">
                {personalNotes.map((pc: any, idx: number) => (
                  <div key={idx} className="cluv-card cluv-p-4 cluv-border-gold">
                    <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2 cluv-mb-1">
                      <span className="cluv-caption cluv-font-bold cluv-text-dark">
                        {pc.ingredient}
                      </span>
                      <span className="cluv-chip is-sm">
                        Kondisi: {pc.user_condition}
                      </span>
                    </div>
                    <p className="cluv-caption cluv-text-muted cluv-m-0">
                      {pc.warning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients Breakdown */}
          {ingBreakdown.length > 0 && (
            <div className="cluv-flex-col cluv-gap-3 cluv-mt-2">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-blue">
                  <Layers size={14} />
                </div>
                <h4 className="cluv-title-card cluv-m-0">
                  Komposisi Lengkap ({ingBreakdown.length} Bahan)
                </h4>
              </div>

              <div className="cluv-card cluv-p-3 cluv-flex-col cluv-gap-2 cluv-max-h-64 cluv-overflow-y-auto">
                {ingBreakdown.map((item: any, idx: number) => {
                  const badge = String(item.badge || 'safe').toLowerCase()
                  const isSafeItem = badge === 'safe' || badge === 'aman'
                  const isCautionItem = badge === 'caution' || badge === 'perhatian'

                  return (
                    <div
                      key={idx}
                      className="cluv-flex-row cluv-items-center cluv-justify-between cluv-py-2 cluv-border-b cluv-last-border-0 cluv-gap-2"
                    >
                      <div className="cluv-flex-col cluv-gap-05 cluv-min-w-0">
                        <span className="cluv-caption cluv-font-bold cluv-text-dark cluv-truncate">
                          {item.name}
                        </span>
                        {item.function && (
                          <span className="cluv-micro cluv-text-muted">
                            {item.function}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={isSafeItem ? 'teal' : isCautionItem ? 'gold' : 'rose'}
                        size="sm"
                      >
                        {isSafeItem
                          ? 'Sangat Baik'
                          : isCautionItem
                          ? 'Perlu Perhatian'
                          : 'Hindari'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Defensible Disclaimer */}
          <div className="cluv-alert is-neutral cluv-mt-2">
            <ShieldCheck size={16} className="cluv-text-muted cluv-flex-shrink-0" />
            <p className="cluv-micro cluv-text-muted cluv-m-0">
              Verifikasi formula ini adalah estimasi keamanan bahan kosmetik berbasis data ilmiah publik dan regulasi kosmetik (BPOM/FDA). Bukan merupakan jaminan medis bebas reaksi alergi individual.
            </p>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="cluv-drawer-footer">
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
              Tanya Skinsistant tentang Produk Ini
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
