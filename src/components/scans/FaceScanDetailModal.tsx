// src/components/scans/FaceScanDetailModal.tsx
// Zero-Emoji, Fully Accessible, Biometrically Safe Modal for Face Scan Detail
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
import '@/styles/scan-modals.css'

interface FaceScanDetailModalProps {
  scan: FaceScan | null
  onClose: () => void
  onConsult?: () => void
}

export default function FaceScanDetailModal({ scan, onClose, onConsult }: FaceScanDetailModalProps) {
  useEffect(() => {
    if (!scan) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [scan])

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

  const parsedAreas = Array.isArray(scan.area_evaluations) && scan.area_evaluations.length > 0
    ? scan.area_evaluations
    : Array.isArray(rawResponse.area_evaluations)
    ? rawResponse.area_evaluations
    : []

  const tipsAvoid = Array.isArray(rawResponse?.personal_tips?.avoid) ? rawResponse.personal_tips.avoid : []
  const tipsReduce = Array.isArray(rawResponse?.personal_tips?.reduce) ? rawResponse.personal_tips.reduce : []
  const tipsDo = Array.isArray(rawResponse?.personal_tips?.do) ? rawResponse.personal_tips.do : []

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
            <h3 className="modal-title">{scan.skin_status_title || 'Laporan Diagnosis Kulit'}</h3>
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
                  (scan.overall_score || 80) >= 80
                    ? 'score-optimal'
                    : (scan.overall_score || 80) >= 65
                    ? 'score-caution'
                    : 'score-warning'
                }`}
              >
                <div className="sr-number-row">
                  <span className="sr-val">{scan.overall_score || 80}</span>
                  <span className="sr-scale">/100</span>
                </div>
                <span className="sr-unit">Kesehatan Kulit</span>
              </div>

              <div className="score-meta-info">
                <div className="hero-badges-row">
                  <span className="hero-skin-type-badge">
                    <Sparkles size={12} /> TIPE KULIT: {String(scan.skin_type || 'NORMAL').toUpperCase()}
                  </span>
                  <span className="hero-confidence-badge">
                    <ShieldCheck size={12} /> REKAM MEDIS KLINIS
                  </span>
                </div>
                <p className="hero-notes-text">{scan.analysis_notes}</p>
              </div>
            </div>
          </div>

          {parsedAreas.length > 0 && (
            <div className="modal-areas-section">
              <h4 className="modal-section-title">
                <Layers size={16} /> Evaluasi Kondisi Kulit Per Area (Granular)
              </h4>
              <div className="modal-areas-stack">
                {parsedAreas.map((area: any, aIdx: number) => (
                  <div key={aIdx} className="area-detail-card">
                    <div className="area-card-header">
                      <div className="area-title-group">
                        <Target size={15} className="area-icon-accent" />
                        <span className="area-name">{area.area_name || area.name || `Area ${aIdx + 1}`}</span>
                      </div>
                      <div className="area-badges-group">
                        <span className={`area-severity-badge ${area.status === 'Optimal' ? 'ringan' : 'sedang'}`}>
                          {area.status || 'Optimal'}
                        </span>
                        <span className="area-score-badge">Skor: {area.score || 80}/100</span>
                      </div>
                    </div>

                    {area.finding && (
                      <div className="area-finding-box">
                        <span className="af-label">Diagnosis Klinis:</span>
                        <p className="af-text">{area.finding}</p>
                      </div>
                    )}

                    {area.analogy && (
                      <div className="area-analogy-box">
                        <span className="aa-label">Penjelasan Sederhana:</span>
                        <p className="aa-text">{area.analogy}</p>
                      </div>
                    )}

                    {area.action_plan && (
                      <div className="area-action-box">
                        <span className="ac-label">Rencana Tindakan:</span>
                        <p className="ac-text">{area.action_plan}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(tipsAvoid.length > 0 || tipsReduce.length > 0 || tipsDo.length > 0) && (
            <div className="modal-tips-section">
              <h4 className="modal-section-title">
                <CheckCircle2 size={16} /> Tips Personal Untuk Kulitmu
              </h4>
              <div className="modal-tips-grid">
                {tipsAvoid.length > 0 && (
                  <div className="tip-box tip-avoid">
                    <span className="tb-title text-red">Hindari</span>
                    <ul className="tb-list">
                      {tipsAvoid.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {tipsReduce.length > 0 && (
                  <div className="tip-box tip-reduce">
                    <span className="tb-title text-amber">Kurangi</span>
                    <ul className="tb-list">
                      {tipsReduce.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {tipsDo.length > 0 && (
                  <div className="tip-box tip-do">
                    <span className="tb-title text-green">Rekomendasi Rutin</span>
                    <ul className="tb-list">
                      {tipsDo.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {onConsult && (
            <div className="modal-footer-action">
              <button className="btn-consult-skinsistant-modal" onClick={onConsult}>
                <MessageSquare size={16} /> Konsultasikan Hasil Ini dengan Skinsistant AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
