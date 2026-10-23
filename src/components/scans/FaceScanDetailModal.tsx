// src/components/scans/FaceScanDetailModal.tsx
// Zero-Emoji, Defensible Copywriting, 100% Pure Cluv Framework Modal
// Compliance: Invariant 13 (Defensible claims), Invariant 19 (Non-therapeutic claims)

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
} from 'lucide-react'
import type { FaceScan } from '@/types/database'
import { Badge, Button } from '@/components/ui'

interface FaceScanDetailModalProps {
  scan: FaceScan | null
  onClose: () => void
  onConsult?: () => void
}

export default function FaceScanDetailModal({
  scan,
  onClose,
  onConsult,
}: FaceScanDetailModalProps) {
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
  const formattedTime = dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
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
              <span>{formattedDate} • {formattedTime}</span>
            </div>
            <h3 className="cluv-modal-title">
              {scan.skin_status_title || 'Laporan Analisis Kondisi Kulit'}
            </h3>
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
          {/* Hero Score Card */}
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

            {/* Headline Meta */}
            <div className="cluv-flex-col cluv-gap-2 cluv-flex-1 cluv-min-w-xs">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                <Badge variant={isOptimal ? 'teal' : isGood ? 'info' : 'rose'} size="sm">
                  {isOptimal ? 'Kondisi Optimal' : isGood ? 'Kondisi Baik' : 'Perlu Perhatian'}
                </Badge>
                <span className="cluv-chip">
                  <Sparkles size={12} /> Tipe: {String(scan.skin_type || 'Normal').toUpperCase()}
                </span>
              </div>
              <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
                <ShieldCheck size={14} className="cluv-text-teal" />
                <span>Observasi Visual Terarsip (Non-Klinis)</span>
              </div>
              {scan.analysis_notes && (
                <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1">
                  {scan.analysis_notes}
                </p>
              )}
            </div>
          </div>

          {/* Granular Area Evaluations */}
          {parsedAreas.length > 0 && (
            <div className="cluv-flex-col cluv-gap-3">
              <h4 className="cluv-title-card is-sm cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0">
                <Layers size={14} className="cluv-text-teal" />
                <span>Evaluasi Kondisi Kulit Per Area ({parsedAreas.length} Area)</span>
              </h4>

              <div className="cluv-flex-col cluv-gap-2">
                {parsedAreas.map((area: any, aIdx: number) => {
                  const areaScore = area.score || 80
                  const isAreaOpt = areaScore >= 80

                  return (
                    <div key={aIdx} className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-sm cluv-border">
                      <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2 cluv-mb-1">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                          <Target size={13} className="cluv-text-teal" />
                          <span className="cluv-caption cluv-font-bold cluv-text-dark">
                            {area.area_name || area.name || `Area ${aIdx + 1}`}
                          </span>
                        </div>
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                          <Badge variant={isAreaOpt ? 'teal' : 'gold'} size="sm">
                            {area.status || (isAreaOpt ? 'Optimal' : 'Perlu Perhatian')}
                          </Badge>
                          <span className="cluv-micro cluv-font-bold cluv-text-dark">
                            {areaScore}/100
                          </span>
                        </div>
                      </div>

                      {area.finding && (
                        <p className="cluv-caption cluv-text-muted cluv-m-0">
                          <span className="cluv-font-bold cluv-text-dark">Hasil Analisis: </span>
                          {area.finding}
                        </p>
                      )}

                      {area.action_plan && (
                        <p className="cluv-micro cluv-text-teal cluv-font-bold cluv-mt-1 cluv-mb-0">
                          <span className="cluv-text-dark">Rencana: </span>
                          {area.action_plan}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Personalized Tips Section */}
          {(tipsAvoid.length > 0 || tipsReduce.length > 0 || tipsDo.length > 0) && (
            <div className="cluv-flex-col cluv-gap-2">
              <h4 className="cluv-title-card is-sm cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0">
                <CheckCircle2 size={14} className="cluv-text-gold" />
                <span>Saran Rutinitas &amp; Tips Mandiri</span>
              </h4>

              <div className="cluv-grid cols-1 cluv-gap-2">
                {tipsDo.length > 0 && (
                  <div className="cluv-p-3 cluv-border-teal cluv-rounded-sm cluv-bg-surface-soft">
                    <span className="cluv-micro cluv-font-bold cluv-text-teal cluv-block cluv-mb-1">
                      Rekomendasi Rutin:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-caption cluv-text-muted">
                      {tipsDo.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tipsAvoid.length > 0 && (
                  <div className="cluv-p-3 cluv-border-rose cluv-rounded-sm cluv-bg-surface-soft">
                    <span className="cluv-micro cluv-font-bold cluv-text-danger cluv-block cluv-mb-1">
                      Hindari:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-caption cluv-text-muted">
                      {tipsAvoid.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legal Defensible Disclaimer */}
          <div className="cluv-alert is-neutral cluv-mt-1">
            <ShieldCheck size={16} className="cluv-text-muted cluv-flex-shrink-0" />
            <p className="cluv-micro cluv-text-muted cluv-m-0">
              Analisis ini adalah pemetaan observasi visual mandiri berbasis AI dan bukan merupakan diagnosis medis, resep, atau terapi dermatologi pengganti dokter spesialis kulit.
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
              Konsultasikan ke Skinsistant
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
