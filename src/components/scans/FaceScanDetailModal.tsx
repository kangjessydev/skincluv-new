// src/components/scans/FaceScanDetailModal.tsx
// Zero-Emoji, Defensible Copywriting, 100% Pure Cluv Framework Modal
// Compliance: Invariant 13 (Defensible claims), Invariant 19 (Non-therapeutic claims)

import {
  Sparkles,
  ShieldCheck,
  Layers,
  Target,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import type { FaceScan } from '@/types/database'
import { Badge, BottomSheet } from '@/components/ui'

interface FaceScanDetailModalProps {
  scan: FaceScan | null
  onClose: () => void
}

export default function FaceScanDetailModal({
  scan,
  onClose,
}: FaceScanDetailModalProps) {
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
  const formattedDateTime = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}.${String(dateObj.getMinutes()).padStart(2, '0')}`

  return (
    <BottomSheet
      isOpen={Boolean(scan)}
      onClose={onClose}
      title={scan.skin_status_title || 'Laporan Analisis Kondisi Kulit'}
    >
      <div className="cluv-flex-col cluv-gap-4">

          {/* Metadata Row: tanggal + kondisi + tipe kulit (seragam gaya metadata Gambar 2) */}
          <div className="cluv-scan-meta-row">
            <span className="cluv-scan-meta-item">
              <Calendar size={13} className="cluv-text-muted cluv-flex-shrink-0" />
              <span>{formattedDateTime}</span>
            </span>
            <span className="cluv-scan-meta-item">
              <ShieldCheck size={13} className="cluv-text-muted cluv-flex-shrink-0" />
              <span>{isOptimal ? 'Kondisi Optimal' : isGood ? 'Kondisi Baik' : 'Perlu Perhatian'}</span>
            </span>
            <span className="cluv-scan-meta-item">
              <Sparkles size={13} className="cluv-text-muted cluv-flex-shrink-0" />
              <span>Tipe: {String(scan.skin_type || 'Normal').toUpperCase()}</span>
            </span>
          </div>
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
            <div className="cluv-flex-col cluv-gap-2.5 cluv-flex-1 cluv-min-w-xs">
              <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1.5">
                <ShieldCheck size={14} className="cluv-text-teal" />
                <span className="cluv-font-medium">Observasi Visual Terarsip (Non-Klinis)</span>
              </div>
              {scan.analysis_notes && (
                <div className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-sm cluv-border">
                  <p className="cluv-caption cluv-text-muted cluv-m-0" style={{ lineHeight: 1.55 }}>
                    {scan.analysis_notes}
                  </p>
                </div>
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

              <div className="cluv-flex-col cluv-gap-2.5">
                {parsedAreas.map((area: any, aIdx: number) => {
                  const areaScore = area.score || 80
                  const isAreaOpt = areaScore >= 80

                  return (
                    <div
                      key={aIdx}
                      className={`cluv-card is-area-card ${
                        isAreaOpt ? 'is-optimal' : 'is-alert'
                      }`}
                    >
                      {/* Sub-header structure: Judul Area (15px Bold) & Badge Terpadu (Option A: Optimal • 85) */}
                      <div className="cluv-area-card-header">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                          <Target size={16} className={isAreaOpt ? 'cluv-text-teal' : 'cluv-text-gold'} />
                          <h5 className="cluv-font-bold cluv-text-dark cluv-m-0" style={{ fontSize: '0.9375rem', lineHeight: 1.3 }}>
                            {area.area_name || area.name || `Area ${aIdx + 1}`}
                          </h5>
                        </div>
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                          <Badge variant={isAreaOpt ? 'teal' : 'gold'} size="sm">
                            {area.status || (isAreaOpt ? 'Optimal' : 'Perlu Perhatian')} • {areaScore}
                          </Badge>
                        </div>
                      </div>

                      {/* Konten Terstruktur: Judul seksi (14px Bold) LEBIH BESAR daripada teks deskripsi (13px Regular) */}
                      {area.finding && (
                        <div className="cluv-flex-col cluv-gap-1.5">
                          <span className="cluv-caption cluv-font-bold cluv-text-dark">Hasil Observasi</span>
                          <p className="cluv-text-muted cluv-m-0" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                            {area.finding}
                          </p>
                        </div>
                      )}

                      {area.action_plan && (
                        <div className="cluv-p-3 cluv-rounded-sm cluv-bg-surface-soft cluv-border cluv-flex-col cluv-gap-1.5 cluv-mt-1">
                          <span className="cluv-caption cluv-font-bold cluv-text-teal cluv-flex-row cluv-items-center cluv-gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>Rencana Perawatan</span>
                          </span>
                          <p className="cluv-text-dark cluv-m-0" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
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
            <div className="cluv-flex-col cluv-gap-2.5">
              <h4 className="cluv-font-bold cluv-text-dark cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0" style={{ fontSize: '0.9375rem' }}>
                <CheckCircle2 size={16} className="cluv-text-gold" />
                <span>Saran Rutinitas &amp; Tips Mandiri</span>
              </h4>

              <div className="cluv-grid cols-1 cluv-gap-2.5">
                {tipsDo.length > 0 && (
                  <div className="cluv-p-3 cluv-border-teal cluv-rounded-sm cluv-bg-surface-soft">
                    <span className="cluv-caption cluv-font-bold cluv-text-teal cluv-block cluv-mb-1.5">
                      Rekomendasi Rutin:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {tipsDo.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tipsReduce.length > 0 && (
                  <div className="cluv-p-3 cluv-border-gold cluv-rounded-sm cluv-bg-surface-soft">
                    <span className="cluv-caption cluv-font-bold cluv-text-gold cluv-block cluv-mb-1.5">
                      Kurangi Frekuensi:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {tipsReduce.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tipsAvoid.length > 0 && (
                  <div className="cluv-p-3 cluv-border-rose cluv-rounded-sm cluv-bg-surface-soft">
                    <span className="cluv-caption cluv-font-bold cluv-text-danger cluv-block cluv-mb-1.5">
                      Hindari:
                    </span>
                    <ul className="cluv-m-0 cluv-p-0 cluv-pl-4 cluv-text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
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
          <div className="cluv-alert is-neutral is-sm cluv-mt-1">
            <ShieldCheck size={16} className="cluv-alert-icon cluv-flex-shrink-0" />
            <div className="cluv-alert-content">
              <p className="cluv-micro cluv-text-muted cluv-m-0" style={{ lineHeight: 1.45 }}>
                Analisis ini adalah pemetaan observasi visual mandiri berbasis AI dan bukan merupakan diagnosis medis, resep, atau terapi dermatologi pengganti dokter spesialis kulit.
              </p>
            </div>
          </div>
        </div>
      </BottomSheet>
  )
}
