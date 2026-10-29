// src/components/scans/IngredientScanDetailModal.tsx
// Zero-Emoji, Defensible Copywriting, 100% Pure Cluv Framework Modal
// Compliance: Invariant 13 (Defensible claims), Invariant 19 (Non-therapeutic claims)

import { useState } from 'react'
import {
  Sparkles,
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Calendar,
  LayoutGrid,
  ListFilter,
} from 'lucide-react'
import type { IngredientScan } from '@/types/database'
import { Badge, BottomSheet } from '@/components/ui'

interface IngredientScanDetailModalProps {
  scan: IngredientScan | null
  onClose: () => void
}

export default function IngredientScanDetailModal({
  scan,
  onClose,
}: IngredientScanDetailModalProps) {
  const [breakdownView, setBreakdownView] = useState<'detail' | 'chips'>('detail')

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
  const formattedDateTime = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}.${String(dateObj.getMinutes()).padStart(2, '0')}`

  return (
    <BottomSheet
      isOpen={Boolean(scan)}
      onClose={onClose}
      title={scan.product_name || 'Laporan Evaluasi Formula'}
    >
      <div className="cluv-flex-col cluv-gap-4">

          {/* Metadata Row: tanggal + status formula + brand */}
          <div className="cluv-scan-meta-row">
            <span className="cluv-scan-meta-item">
              <Calendar size={13} className="cluv-text-muted cluv-flex-shrink-0" />
              <span>{formattedDateTime}</span>
            </span>
            <span className="cluv-scan-meta-item">
              <ShieldCheck size={13} className="cluv-text-muted cluv-flex-shrink-0" />
              <span>{isVerySafe ? 'Formula Sangat Baik' : isSafe ? 'Formula Baik' : 'Perlu Perhatian'}</span>
            </span>
            {scan.brand && (
              <span className="cluv-scan-meta-item">
                <FlaskConical size={13} className="cluv-text-muted cluv-flex-shrink-0" />
                <span>{scan.brand.toUpperCase()}</span>
              </span>
            )}
          </div>
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

            {/* Headline Meta / Summary Box */}
            <div className="cluv-flex-col cluv-gap-2 cluv-flex-1" style={{ minWidth: 220 }}>
              <div className="cluv-summary-box cluv-flex-col cluv-gap-2">
                <div className="cluv-flex-row cluv-items-start cluv-gap-2">
                  <div className="cluv-mt-0.5 cluv-flex-shrink-0">
                    {isSafe ? (
                      <ShieldCheck size={16} className="cluv-text-teal" />
                    ) : (
                      <ShieldAlert size={16} className="cluv-text-gold" />
                    )}
                  </div>
                  <span className="cluv-caption cluv-font-bold cluv-text-dark" style={{ lineHeight: 1.4 }}>
                    {isSafe
                      ? 'Formula Terverifikasi Aman & Minim Risiko Iritasi'
                      : 'Komposisi Memerlukan Perhatian Khusus'}
                  </span>
                </div>
                <p className="cluv-text-muted cluv-m-0" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  {ingRawResponse?.summary || 'Analisis komposisi bahan aktif, kestabilan formula, dan kompatibilitas kulit.'}
                </p>
              </div>
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
            <div className="cluv-flex-col cluv-gap-2.5">
              <h4 className="cluv-font-bold cluv-text-danger cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0" style={{ fontSize: '0.9375rem' }}>
                <AlertTriangle size={16} />
                <span>Peringatan Kombinasi (Layering)</span>
              </h4>
              {dangerCombos.map((dc: any, dIdx: number) => (
                <div key={dIdx} className="cluv-p-3 cluv-border-rose cluv-rounded-sm cluv-bg-surface-soft cluv-flex-col cluv-gap-1">
                  <span className="cluv-caption cluv-font-bold cluv-text-danger cluv-block">
                    {Array.isArray(dc.pair) ? dc.pair.join(' + ') : 'Inkompatibilitas Bahan'}
                  </span>
                  <p className="cluv-text-muted cluv-m-0" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                    {dc.warning || dc.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Full Breakdown with Dual View Modes (Detail vs Ringkas) */}
          {ingBreakdown.length > 0 && (
            <div className="cluv-flex-col cluv-gap-2.5">
              <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-flex-wrap cluv-gap-2">
                <h4 className="cluv-title-card is-sm cluv-flex-row cluv-items-center cluv-gap-2 cluv-m-0">
                  <Layers size={14} className="cluv-text-teal" />
                  <span>Komposisi Lengkap ({ingBreakdown.length} Bahan)</span>
                </h4>
                {/* Mode Tampilan Switcher: Detail vs Ringkas */}
                <div className="cluv-btn-group">
                  <button
                    type="button"
                    className={`cluv-btn is-sm ${breakdownView === 'detail' ? 'is-primary' : 'is-ghost'}`}
                    onClick={() => setBreakdownView('detail')}
                    title="Tampilan Detail dengan Penjelasan Lengkap"
                  >
                    <ListFilter size={13} />
                    <span>Detail</span>
                  </button>
                  <button
                    type="button"
                    className={`cluv-btn is-sm ${breakdownView === 'chips' ? 'is-primary' : 'is-ghost'}`}
                    onClick={() => setBreakdownView('chips')}
                    title="Tampilan Ringkas (Tag Chips)"
                  >
                    <LayoutGrid size={13} />
                    <span>Ringkas</span>
                  </button>
                </div>
              </div>

              {breakdownView === 'detail' ? (
                /* DETAIL VIEW: Kartu Inset per Bahan dengan Fungsi, Kecocokan Kulit, dan Interaksi */
                <div className="cluv-inset-list cluv-max-h-96 cluv-overflow-y-auto">
                  {ingBreakdown.map((item: any, bIdx: number) => {
                    const badge = String(item.badge || 'safe').toLowerCase()
                    const isSafeItem = badge === 'safe' || badge === 'aman'
                    const isAvoidItem = badge === 'hindari' || badge === 'danger'
                    return (
                      <div key={bIdx} className="cluv-inset-item">
                        <div className="cluv-flex-row cluv-justify-between cluv-items-start cluv-gap-2">
                          <div className="cluv-flex-col cluv-gap-1 cluv-flex-1">
                            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                              <h5 className="cluv-ingredient-name cluv-m-0" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                {item.name}
                              </h5>
                              {item.is_hero_active && (
                                <span className="cluv-badge is-teal is-sm">Hero Active</span>
                              )}
                            </div>
                            {item.is_drug_or_banned && (
                              <span className="cluv-badge is-rose is-sm cluv-mt-0.5">
                                Regulasi BPOM: Obat Keras / Zat Khusus
                              </span>
                            )}
                          </div>
                          <div className="cluv-flex-row cluv-items-center cluv-gap-1.5 cluv-flex-shrink-0">
                            {typeof item.comedogenic_score === 'number' && item.comedogenic_score > 0 && (
                              <span className={`cluv-comedo-badge ${item.comedogenic_score <= 1 ? 'is-low' : item.comedogenic_score <= 3 ? 'is-med' : 'is-high'}`}>
                                Pori: {item.comedogenic_score}
                              </span>
                            )}
                            <span className={`cluv-badge is-sm ${isSafeItem ? 'is-teal' : isAvoidItem ? 'is-rose' : 'is-gold'}`}>
                              {item.badgeLabel || (isSafeItem ? 'Aman' : isAvoidItem ? 'Hindari' : 'Perlu Perhatian')}
                            </span>
                          </div>
                        </div>

                        {item.function ? (
                          <p className="cluv-body cluv-mt-1.5 cluv-m-0" style={{ fontSize: '0.8125rem', lineHeight: '1.55', color: 'var(--cluv-text-muted, #64748b)' }}>
                            {item.function}
                          </p>
                        ) : (
                          <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-m-0" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                            Bahan pelarut, penstabil formula, atau basis kosmetik.
                          </p>
                        )}

                        {item.skinType && (
                          <div className="cluv-flex-row cluv-gap-2 cluv-micro cluv-mt-1.5">
                            <b className="cluv-text-dark">Cocok untuk:</b>
                            <span className="cluv-text-muted">{item.skinType}</span>
                          </div>
                        )}

                        {item.interaction && (
                          <div className="cluv-flex-row cluv-gap-2 cluv-micro cluv-mt-1">
                            <b className="cluv-text-dark">Interaksi:</b>
                            <span className="cluv-text-muted">{item.interaction}</span>
                          </div>
                        )}

                        {item.personal?.text && (
                          <div className={`cluv-alert is-compact cluv-mt-2 ${item.personal.ok ? 'is-success' : 'is-danger'}`} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                            <span>{item.personal.text}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* CHIP VIEW: Tampilan Ringkas Cepat Dibaca */
                <div className="cluv-summary-box cluv-max-h-72 cluv-overflow-y-auto">
                  <div className="cluv-flex-row cluv-flex-wrap cluv-gap-2">
                    {ingBreakdown.map((item: any, bIdx: number) => {
                      const badge = String(item.badge || 'safe').toLowerCase()
                      const isSafeItem = badge === 'safe' || badge === 'aman'
                      const isAvoidItem = badge === 'hindari' || badge === 'danger'
                      return (
                        <span
                          key={bIdx}
                          className={`cluv-chip is-active ${isSafeItem ? '' : isAvoidItem ? 'is-danger' : 'is-gold'}`}
                          title={`${item.name} — ${item.badgeLabel || (isSafeItem ? 'Aman' : isAvoidItem ? 'Hindari' : 'Perlu Perhatian')}${item.function ? `: ${item.function}` : ''}`}
                        >
                          <span className="cluv-dot" />
                          <span>{item.name}</span>
                          {typeof item.comedogenic_score === 'number' && item.comedogenic_score > 0 && (
                            <span className="cluv-badge is-gold is-sm" style={{ padding: '1px 5px', fontSize: '0.6875rem' }}>
                              {item.comedogenic_score}
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Defensible Disclaimer */}
          <div className="cluv-alert is-neutral is-sm cluv-mt-1">
            <ShieldCheck size={16} className="cluv-alert-icon cluv-flex-shrink-0" />
            <div className="cluv-alert-content">
              <p className="cluv-micro cluv-text-muted cluv-m-0" style={{ lineHeight: 1.45 }}>
                Verifikasi formula ini adalah estimasi keamanan bahan kosmetik berbasis data ilmiah publik dan regulasi kosmetik (BPOM/FDA). Bukan merupakan jaminan medis bebas reaksi alergi individual.
              </p>
            </div>
          </div>
        </div>
      </BottomSheet>
  )
}
