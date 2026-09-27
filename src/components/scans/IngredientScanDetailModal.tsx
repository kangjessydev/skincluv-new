// src/components/scans/IngredientScanDetailModal.tsx
// Zero-Emoji, Defensible Regulatory Copywriting, Biometrically Safe Modal for Ingredient Scan Detail
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
import '@/styles/scan-modals.css'

interface IngredientScanDetailModalProps {
  scan: IngredientScan | null
  onClose: () => void
  onConsult?: () => void
}

export default function IngredientScanDetailModal({ scan, onClose, onConsult }: IngredientScanDetailModalProps) {
  useEffect(() => {
    if (!scan) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [scan])

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

  return createPortal(
    <div className="modal-backdrop-blur" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-date-tag">
              <Calendar size={13} />{' '}
              {new Date(scan.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <h3 className="modal-title">{scan.product_name}</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scroll">
          <div className="modal-score-hero">
            <div className="hero-glow-accent" />
            <div className="dots-bg-pattern" />

            <div className="score-hero-content">
              <div
                className={`score-ring-avatar ${
                  (scan.safety_score ?? 80) >= 65 ? 'score-optimal' : 'score-warning'
                }`}
              >
                <div className="sr-number-row">
                  <span className="sr-val">{scan.safety_score ?? 80}</span>
                  <span className="sr-scale">/100</span>
                </div>
                <span className="sr-unit">Safety Score</span>
              </div>

              <div className="score-meta-info">
                <div className="hero-badges-row">
                  <span className="hero-skin-type-badge">
                    <FlaskConical size={12} />{' '}
                    {scan.brand ? `BRAND: ${scan.brand.toUpperCase()}` : 'PRODUK SKINCARE'}
                  </span>
                  <span className="hero-confidence-badge">
                    {(scan.safety_score ?? 80) >= 70 ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                    {(scan.safety_score ?? 80) >= 85 ? 'FORMULA SANGAT BAIK' : (scan.safety_score ?? 80) >= 70 ? 'FORMULA BAIK' : 'PERLU PERHATIAN'}
                  </span>
                </div>
                <p className="hero-notes-text">
                  {ingRawResponse?.summary || 'Analisis keamanan formula bahan aktif dan kompatibilitas kulit.'}
                </p>
              </div>
            </div>
          </div>

          {heroIngredients.length > 0 && (
            <div className="modal-areas-section">
              <h4 className="modal-section-title">
                <Sparkles size={16} /> Hero Actives & Bahan Kunci
              </h4>
              <div className="hero-actives-chips-grid">
                {heroIngredients.map((item: any, idx: number) => {
                  const name = typeof item === 'string' ? item : item.name
                  const func = typeof item === 'object' ? item.function : null
                  return (
                    <div key={idx} className="hero-active-chip-box">
                      <span className="hac-name">{name}</span>
                      {func && <span className="hac-function">{func}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {dangerCombos.length > 0 && (
            <div className="modal-areas-section">
              <h4 className="modal-section-title text-red">
                <AlertTriangle size={16} /> Peringatan Kombinasi Pemakaian (Layering)
              </h4>
              <div className="danger-combos-stack">
                {dangerCombos.map((dc: any, idx: number) => (
                  <div key={idx} className="danger-combo-history-card">
                    <div className="dc-pair-title">
                      {Array.isArray(dc.pair) ? dc.pair.join(' + ') : 'Inkompatibilitas Bahan'}
                    </div>
                    <p className="dc-warning-text">{dc.warning || dc.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {personalNotes.length > 0 && (
            <div className="modal-areas-section">
              <h4 className="modal-section-title text-amber">
                <Tag size={16} /> Catatan Khusus untuk Kondisi Kulitmu
              </h4>
              <div className="personal-contraindications-stack">
                {personalNotes.map((pc: any, idx: number) => (
                  <div key={idx} className="personal-contra-history-card">
                    <div className="pc-head">
                      <span className="pc-ing-name">{pc.ingredient}</span>
                      <span className="pc-condition-tag">Untuk: {pc.user_condition}</span>
                    </div>
                    <p className="pc-warning-text">{pc.warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ingBreakdown.length > 0 && (
            <div className="modal-areas-section">
              <h4 className="modal-section-title">
                <Layers size={16} /> Komposisi Bahan Lengkap ({ingBreakdown.length} Bahan)
              </h4>
              <div className="ingredients-breakdown-mini-list">
                {ingBreakdown.map((item: any, idx: number) => {
                  const badge = String(item.badge || 'safe').toLowerCase()
                  return (
                    <div key={idx} className="ing-mini-row">
                      <span className={`ing-badge-dot ${badge}`} />
                      <div className="ing-mini-meta">
                        <span className="ing-mini-name">{item.name}</span>
                        {item.function && <span className="ing-mini-fn">{item.function}</span>}
                      </div>
                      <span className={`ing-mini-badge ${badge}`}>
                        {badge === 'safe' || badge === 'aman'
                          ? 'Sangat Baik'
                          : badge === 'caution' || badge === 'perhatian'
                          ? 'Perhatian'
                          : 'Hindari'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {onConsult && (
            <div className="modal-footer-action">
              <button className="btn-consult-skinsistant-modal" onClick={onConsult}>
                <MessageSquare size={16} /> Tanya Skinsistant tentang Produk Ini
              </button>
            </div>
          )}

          <div className="in-chat-card-disclaimer" style={{ marginTop: '8px' }}>
            <span>Analisis AI — bukan pengganti konsultasi dokter spesialis kulit</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
