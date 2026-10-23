// src/components/scans/FaceScanDetailDrawer.tsx
// Zero-Emoji, Defensible Copywriting, 100% Cluv Framework Slide-Over Drawer
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar,
  X,
  Sparkles,
  ShieldCheck,
  Layers,
  Target,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import type { FaceScan } from '@/types/database'
import { Badge, Button } from '@/components/ui'

interface FaceScanDetailDrawerProps {
  scan: FaceScan | null
  onClose: () => void
  onConsult?: () => void
}

export default function FaceScanDetailDrawer({
  scan,
  onClose,
  onConsult,
}: FaceScanDetailDrawerProps) {
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

  let rawResponse: Record<string, any> = {}
  try {
    if (typeof scan.raw_ai_response === 'string') {
      rawResponse = JSON.parse(scan.raw_ai_response)
    } else if (scan.raw_ai_response && typeof scan.raw_ai_response === 'object') {
      rawResponse = scan.raw_ai_response as Record<string, any>
    }
  } catch {
    rawResponse = {}
  }

  const parsedAreas =
    Array.isArray(scan.area_evaluations) && scan.area_evaluations.length > 0
      ? scan.area_evaluations
      : Array.isArray(rawResponse.area_evaluations)
      ? rawResponse.area_evaluations
      : []

  const tipsAvoid = Array.isArray(rawResponse?.personal_tips?.avoid)
    ? rawResponse.personal_tips.avoid
    : []
  const tipsReduce = Array.isArray(rawResponse?.personal_tips?.reduce)
    ? rawResponse.personal_tips.reduce
    : []
  const tipsDo = Array.isArray(rawResponse?.personal_tips?.do)
    ? rawResponse.personal_tips.do
    : []

  const score = scan.overall_score || 80
  const isOptimal = score >= 80
  const isGood = score >= 65 && score < 80

  // SVG Gauge calculations
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

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
            <h3 className="cluv-drawer-title">
              {scan.skin_status_title || 'Laporan Analisis Kondisi Kulit'}
            </h3>
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
                      isOptimal ? 'is-optimal' : isGood ? 'is-good' : 'is-alert'
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

              {/* Status Meta */}
              <div className="cluv-flex-col cluv-gap-2 cluv-flex-1">
                <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                  <Badge variant={isOptimal ? 'teal' : isGood ? 'info' : 'rose'} size="sm">
                    {isOptimal ? 'Kondisi Optimal' : isGood ? 'Kondisi Baik' : 'Perlu Perhatian'}
                  </Badge>
                  <span className="cluv-chip is-sm">
                    <Sparkles size={12} /> Tipe: {String(scan.skin_type || 'Normal').toUpperCase()}
                  </span>
                </div>
                <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
                  <ShieldCheck size={13} className="cluv-text-teal" />
                  <span>Observasi Visual Terarsip (Non-Klinis)</span>
                </div>
              </div>
            </div>

            {/* Comprehensive Observation Notes */}
            {scan.analysis_notes && (
              <div className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-md cluv-border">
                <span className="cluv-micro cluv-font-bold cluv-text-dark cluv-uppercase cluv-block cluv-mb-1">
                  Catatan Observasi Menyeluruh:
                </span>
                <p className="cluv-body cluv-text-muted cluv-m-0">
                  {scan.analysis_notes}
                </p>
              </div>
            )}
          </div>

          {/* Granular Area Evaluations */}
          {parsedAreas.length > 0 && (
            <div className="cluv-flex-col cluv-gap-3">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-teal">
                  <Layers size={14} />
                </div>
                <h4 className="cluv-title-card cluv-m-0">
                  Evaluasi Kondisi Kulit Per Area ({parsedAreas.length} Area)
                </h4>
              </div>

              <div className="cluv-flex-col cluv-gap-3">
                {parsedAreas.map((area: any, aIdx: number) => {
                  const areaScore = area.score || 80
                  const isAreaOptimal = areaScore >= 80

                  return (
                    <div key={aIdx} className="cluv-card cluv-p-4 cluv-flex-col cluv-gap-2">
                      <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                          <Target size={14} className="cluv-text-teal" />
                          <span className="cluv-font-bold cluv-text-dark">
                            {area.area_name || area.name || `Area ${aIdx + 1}`}
                          </span>
                        </div>
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                          <Badge variant={isAreaOptimal ? 'teal' : 'gold'} size="sm">
                            {area.status || (isAreaOptimal ? 'Optimal' : 'Perlu Perhatian')}
                          </Badge>
                          <span className="cluv-caption cluv-font-bold cluv-text-dark">
                            {areaScore}/100
                          </span>
                        </div>
                      </div>

                      {area.finding && (
                        <div className="cluv-mt-1">
                          <span className="cluv-micro cluv-font-bold cluv-text-dark cluv-block">
                            Hasil Analisis:
                          </span>
                          <p className="cluv-caption cluv-text-muted cluv-mt-05 cluv-mb-0">
                            {area.finding}
                          </p>
                        </div>
                      )}

                      {area.analogy && (
                        <div className="cluv-mt-1 cluv-p-2 cluv-bg-surface-soft cluv-rounded-sm">
                          <span className="cluv-micro cluv-font-bold cluv-text-teal cluv-block">
                            Penjelasan Sederhana:
                          </span>
                          <p className="cluv-micro cluv-text-muted cluv-mt-05 cluv-mb-0">
                            {area.analogy}
                          </p>
                        </div>
                      )}

                      {area.action_plan && (
                        <div className="cluv-mt-1">
                          <span className="cluv-micro cluv-font-bold cluv-text-dark cluv-block">
                            Rencana Tindakan:
                          </span>
                          <p className="cluv-caption cluv-text-muted cluv-mt-05 cluv-mb-0">
                            {area.action_plan}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Personalized Tips Section */}
          {(tipsAvoid.length > 0 || tipsReduce.length > 0 || tipsDo.length > 0) && (
            <div className="cluv-flex-col cluv-gap-3 cluv-mt-2">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-gold">
                  <CheckCircle2 size={14} />
                </div>
                <h4 className="cluv-title-card cluv-m-0">
                  Saran Rutinitas &amp; Tips Mandiri
                </h4>
              </div>

              <div className="cluv-grid cols-1 cluv-gap-3">
                {tipsDo.length > 0 && (
                  <div className="cluv-card cluv-p-4 cluv-border-teal">
                    <span className="cluv-caption cluv-font-bold cluv-text-teal cluv-block cluv-mb-2">
                      Rekomendasi Rutin:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-caption cluv-text-muted cluv-flex-col cluv-gap-1">
                      {tipsDo.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tipsReduce.length > 0 && (
                  <div className="cluv-card cluv-p-4 cluv-border-gold">
                    <span className="cluv-caption cluv-font-bold cluv-text-gold cluv-block cluv-mb-2">
                      Kurangi Kebiasaan:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-caption cluv-text-muted cluv-flex-col cluv-gap-1">
                      {tipsReduce.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tipsAvoid.length > 0 && (
                  <div className="cluv-card cluv-p-4 cluv-border-rose">
                    <span className="cluv-caption cluv-font-bold cluv-text-danger cluv-block cluv-mb-2">
                      Hindari:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-caption cluv-text-muted cluv-flex-col cluv-gap-1">
                      {tipsAvoid.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Defensible Disclaimer (RFC 016 & 017) */}
          <div className="cluv-alert is-neutral cluv-mt-2">
            <ShieldCheck size={16} className="cluv-text-muted cluv-flex-shrink-0" />
            <p className="cluv-micro cluv-text-muted cluv-m-0">
              Analisis ini adalah pemetaan observasi visual mandiri berbasis AI dan bukan merupakan diagnosis medis, resep, atau terapi dermatologi pengganti dokter spesialis kulit.
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
              Konsultasikan ke Skinsistant
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
