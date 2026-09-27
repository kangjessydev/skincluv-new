// src/components/chat/ChatAttachmentSlot.tsx
// RFC 012: In-Chat Visual Cards (Mini Scan Result Hub)
// Strictly Zero-Emoji, Zero-Trust Server Resource Authority, Biometric Minimizing UI

import { useState, useEffect } from 'react'
import {
  ScanFace,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { FaceScan, IngredientScan } from '@/types/database'
import '@/styles/chat-attachments.css'

export interface ChatAttachmentDescriptor {
  type: 'face_scan_summary' | 'ingredient_scan_summary' | string
  resource_id: string
  resource_version?: number
}

interface ChatAttachmentSlotProps {
  attachments?: ChatAttachmentDescriptor[]
  onOpenFaceScan?: (scan: FaceScan) => void
  onOpenIngredientScan?: (scan: IngredientScan) => void
}

// In-memory session cache to avoid repeated queries
const faceScanCache = new Map<string, FaceScan | null>()
const ingredientScanCache = new Map<string, IngredientScan | null>()

/* -------------------------------------------------------------------------- */
/* 1. InChatFaceCard Component                                                */
/* -------------------------------------------------------------------------- */
interface InChatFaceCardProps {
  scanId: string
  onOpenDetail?: (scan: FaceScan) => void
}

function InChatFaceCard({ scanId, onOpenDetail }: InChatFaceCardProps) {
  const [scan, setScan] = useState<FaceScan | null | undefined>(faceScanCache.get(scanId))
  const [loading, setLoading] = useState<boolean>(!faceScanCache.has(scanId))

  useEffect(() => {
    if (faceScanCache.has(scanId)) {
      setScan(faceScanCache.get(scanId))
      setLoading(false)
      return
    }

    let isMounted = true
    const fetchFaceScan = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('face_scans')
          .select('id, user_id, overall_score, skin_status_title, skin_type, skin_concerns, analysis_notes, area_evaluations, product_recommendations, raw_ai_response, created_at')
          .eq('id', scanId)
          .maybeSingle()

        if (!isMounted) return

        if (error || !data) {
          faceScanCache.set(scanId, null)
          setScan(null)
        } else {
          faceScanCache.set(scanId, data as FaceScan)
          setScan(data as FaceScan)
        }
      } catch {
        if (isMounted) {
          faceScanCache.set(scanId, null)
          setScan(null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchFaceScan()

    return () => {
      isMounted = false
    }
  }, [scanId])

  if (loading) {
    return (
      <div className="in-chat-card loading">
        <Loader2 size={16} className="animate-spin text-primary" />
        <span>Memverifikasi data analisis wajah...</span>
      </div>
    )
  }

  // Right to be Forgotten fallback (Invariant 12)
  if (!scan) {
    return (
      <div className="in-chat-card unavailable">
        <div className="in-chat-card-header">
          <div className="card-title-group">
            <ScanFace size={14} className="card-title-icon-face" />
            <span>Analisis Wajah</span>
          </div>
        </div>
        <div className="unavailable-body">
          <ShieldAlert size={16} className="unavailable-icon" />
          <div className="unavailable-text-group">
            <span className="unavailable-title">Data Tidak Tersedia</span>
            <p className="unavailable-desc">
              Hasil analisis wajah ini sudah tidak tersedia atau telah dihapus dari akun kamu.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const score = scan.overall_score || 80
  const scoreClass = score >= 80 ? 'score-optimal' : score >= 65 ? 'score-caution' : 'score-warning'
  const assessmentLabel = score >= 80 ? 'Skin Assessment: Optimal' : score >= 65 ? 'Skin Assessment: Baik' : 'Skin Assessment: Perlu Perawatan'
  const formattedDate = new Date(scan.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const isRecent = Math.abs(Date.now() - new Date(scan.created_at).getTime()) < 24 * 3600 * 1000
  const cardTitle = isRecent ? 'Analisis Wajah Terkini' : 'Hasil Rekam Wajah'

  return (
    <div className="in-chat-card">
      <div className="in-chat-card-header">
        <div className="card-title-group">
          <ScanFace size={14} className="card-title-icon-face" />
          <span>{cardTitle}</span>
        </div>
        <span className="card-date-badge">{formattedDate}</span>
      </div>

      <div className="face-mini-body">
        {/* Biometric Minimization: SVG score ring instead of raw face photo */}
        <div className={`face-score-ring ${scoreClass}`}>
          <span className="fs-num">{score}</span>
          <span className="fs-max">/100</span>
        </div>

        <div className="face-meta-col">
          <span className="skin-type-tag">
            <Sparkles size={11} />
            TIPE KULIT: {String(scan.skin_type || 'NORMAL').toUpperCase()}
          </span>
          <span className="skin-assessment-label">{assessmentLabel}</span>
          <p className="skin-assessment-desc">
            {scan.analysis_notes || 'Observasi kondisi kulit dan persebaran hidrasi terkini.'}
          </p>
        </div>
      </div>

      {onOpenDetail && (
        <div className="in-chat-card-footer">
          <button
            type="button"
            className="in-chat-card-btn"
            onClick={() => onOpenDetail(scan)}
          >
            <span>Lihat Evaluasi Lengkap</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Kimi Audit & PerBPOM 3/2022: Mandatory 1-line clinical micro-disclaimer */}
      <div className="in-chat-card-disclaimer">
        <span>Analisis AI — bukan pengganti konsultasi dokter</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 2. InChatIngredientCard Component                                          */
/* -------------------------------------------------------------------------- */
interface InChatIngredientCardProps {
  scanId: string
  onOpenDetail?: (scan: IngredientScan) => void
}

function InChatIngredientCard({ scanId, onOpenDetail }: InChatIngredientCardProps) {
  const [scan, setScan] = useState<IngredientScan | null | undefined>(ingredientScanCache.get(scanId))
  const [loading, setLoading] = useState<boolean>(!ingredientScanCache.has(scanId))

  useEffect(() => {
    if (ingredientScanCache.has(scanId)) {
      setScan(ingredientScanCache.get(scanId))
      setLoading(false)
      return
    }

    let isMounted = true
    const fetchIngredientScan = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('ingredient_scans')
          .select('id, user_id, product_name, brand, safety_score, is_safe, matched_concerns, key_ingredients, ingredients_breakdown, raw_ai_response, created_at')
          .eq('id', scanId)
          .maybeSingle()

        if (!isMounted) return

        if (error || !data) {
          ingredientScanCache.set(scanId, null)
          setScan(null)
        } else {
          ingredientScanCache.set(scanId, data as IngredientScan)
          setScan(data as IngredientScan)
        }
      } catch {
        if (isMounted) {
          ingredientScanCache.set(scanId, null)
          setScan(null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchIngredientScan()

    return () => {
      isMounted = false
    }
  }, [scanId])

  if (loading) {
    return (
      <div className="in-chat-card loading">
        <Loader2 size={16} className="animate-spin text-primary" />
        <span>Memverifikasi formula produk...</span>
      </div>
    )
  }

  // Right to be Forgotten fallback (Invariant 12)
  if (!scan) {
    return (
      <div className="in-chat-card unavailable">
        <div className="in-chat-card-header">
          <div className="card-title-group">
            <FileText size={14} className="card-title-icon-ingredient" />
            <span>Analisis Komposisi</span>
          </div>
        </div>
        <div className="unavailable-body">
          <ShieldAlert size={16} className="unavailable-icon" />
          <div className="unavailable-text-group">
            <span className="unavailable-title">Data Tidak Tersedia</span>
            <p className="unavailable-desc">
              Hasil analisis komposisi produk ini sudah tidak tersedia atau telah dihapus dari akun kamu.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Extract danger combos from raw_ai_response (Kimi: danger_combos TIDAK BOLEH DISEMBUNYIKAN)
  let rawAi: any = {}
  try {
    if (typeof scan.raw_ai_response === 'string') rawAi = JSON.parse(scan.raw_ai_response)
    else if (scan.raw_ai_response && typeof scan.raw_ai_response === 'object') rawAi = scan.raw_ai_response
  } catch {
    rawAi = {}
  }
  const dangerCombos = Array.isArray(rawAi?.layering_guide?.danger_combos) ? rawAi.layering_guide.danger_combos : []

  // PerBPOM 3/2022 & Kimi Consensus: use qualitative bands, avoid absolute words like "Aman"
  const score = scan.safety_score ?? (scan.is_safe ? 85 : 45)
  const isVeryGood = score >= 85 && scan.is_safe
  const isGood = score >= 70 && scan.is_safe
  const badgeClass = isVeryGood ? 'safe' : isGood ? 'good' : 'caution'
  const assessmentBandLabel = isVeryGood
    ? 'Sangat Baik'
    : isGood
    ? 'Baik'
    : 'Perlu Perhatian'

  const formattedDate = new Date(scan.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const previewIngredients = Array.isArray(scan.key_ingredients) && scan.key_ingredients.length > 0
    ? scan.key_ingredients.slice(0, 3)
    : []

  const totalIngredientsCount = Array.isArray(scan.ingredients_breakdown)
    ? scan.ingredients_breakdown.length
    : previewIngredients.length

  return (
    <div className="in-chat-card">
      <div className="in-chat-card-header">
        <div className="card-title-group">
          <FileText size={14} className="card-title-icon-ingredient" />
          <span>Evaluasi Komposisi Produk</span>
        </div>
        <span className="card-date-badge">{formattedDate}</span>
      </div>

      <div className="ingredient-mini-body">
        <span className="ing-product-brand">
          {scan.brand ? scan.brand.toUpperCase() : 'PRODUK SKINCARE'}
        </span>
        <h4 className="ing-product-name">{scan.product_name}</h4>

        <div className="ing-assessment-row">
          <span className={`ing-score-badge ${badgeClass}`}>
            {isVeryGood || isGood ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
            Skor Keamanan Formula: {assessmentBandLabel} ({score}/100)
          </span>
        </div>

        <p className="ing-provenance-caption">
          Berdasarkan profil {totalIngredientsCount > 0 ? `${totalIngredientsCount} bahan` : 'bahan'} terverifikasi
        </p>

        {/* Kimi Audit: Peringatan kombinasi pemakaian jika ada danger combos */}
        {dangerCombos.length > 0 && (
          <div className="ing-danger-alert-pill">
            <AlertTriangle size={12} className="alert-pill-icon" />
            <span>Terdapat kombinasi pemakaian yang perlu diperhatikan</span>
          </div>
        )}

        {previewIngredients.length > 0 && (
          <div className="ing-chips-preview">
            {previewIngredients.map((ing, idx) => (
              <span key={idx} className="ing-chip">
                {ing}
              </span>
            ))}
          </div>
        )}
      </div>

      {onOpenDetail && (
        <div className="in-chat-card-footer">
          <button
            type="button"
            className="in-chat-card-btn"
            onClick={() => onOpenDetail(scan)}
          >
            <span>Lihat Rincian Formula</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Kimi Audit & PerBPOM 3/2022: Mandatory 1-line clinical micro-disclaimer */}
      <div className="in-chat-card-disclaimer">
        <span>Analisis AI — bukan pengganti konsultasi dokter</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 3. Main Attachment Slot Component                                          */
/* -------------------------------------------------------------------------- */
export default function ChatAttachmentSlot({
  attachments,
  onOpenFaceScan,
  onOpenIngredientScan,
}: ChatAttachmentSlotProps) {
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
    return null
  }

  return (
    <div className="chat-attachments-container">
      {attachments.map((att, idx) => {
        if (att.type === 'face_scan_summary' && att.resource_id) {
          return (
            <InChatFaceCard
              key={`${att.resource_id}-${idx}`}
              scanId={att.resource_id}
              onOpenDetail={onOpenFaceScan}
            />
          )
        }
        if (att.type === 'ingredient_scan_summary' && att.resource_id) {
          return (
            <InChatIngredientCard
              key={`${att.resource_id}-${idx}`}
              scanId={att.resource_id}
              onOpenDetail={onOpenIngredientScan}
            />
          )
        }
        return null
      })}
    </div>
  )
}
