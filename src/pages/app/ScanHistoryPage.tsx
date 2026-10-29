// src/pages/app/ScanHistoryPage.tsx
// Zero-Emoji, Defensible Copywriting, 100% Pure Cluv Framework
// Architecture: Compact 1-Section Bento Cards + Canonical Cluv Modal
// Compliance: Invariant 13 (Defensible claims), Invariant 14 (MCID Guardrail), Invariant 19 (Non-therapeutic)

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Sparkles,
  ScanFace,
  FlaskConical,
  Search,
  X,
  Filter,
  RefreshCw,
  Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FaceScan, IngredientScan } from '@/types/database'
import FaceScanDetailModal from '@/components/scans/FaceScanDetailModal'
import IngredientScanDetailModal from '@/components/scans/IngredientScanDetailModal'
import { Button, Badge, BottomSheet } from '@/components/ui'

export default function ScanHistoryPage() {
  const navigate = useNavigate()
  const { session, user, profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'face' | 'ingredient'>('face')
  const [loading, setLoading] = useState(true)

  // Face Scans State
  const [scans, setScans] = useState<FaceScan[]>([])
  const [selectedScan, setSelectedScan] = useState<FaceScan | null>(null)

  // Ingredient Scans State
  const [ingredientScans, setIngredientScans] = useState<IngredientScan[]>([])
  const [selectedIngredientScan, setSelectedIngredientScan] = useState<IngredientScan | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [faceFilter, setFaceFilter] = useState<'all' | 'optimal' | 'attention'>('all')
  const [ingFilter, setIngFilter] = useState<'all' | 'safe' | 'attention'>('all')
  const [showFilterSheet, setShowFilterSheet] = useState(false)

  // Compact datetime formatter: 1/10/2026 18.32
  const formatCompactDateTime = (isoString?: string | null): string => {
    if (!isoString) return ''
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const day = d.getDate()
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}.${minutes}`
  }

  const isFilterActive =
    activeTab === 'face' ? faceFilter !== 'all' : ingFilter !== 'all'

  const activeFilterLabel =
    activeTab === 'face'
      ? faceFilter === 'optimal'
        ? 'Kondisi Optimal 80+'
        : faceFilter === 'attention'
        ? 'Perlu Perhatian'
        : null
      : ingFilter === 'safe'
      ? 'Formula Baik'
      : ingFilter === 'attention'
      ? 'Perlu Perhatian'
      : null

  const fetchAllHistory = async () => {
    let targetUid = session?.user?.id || user?.id || profile?.id
    if (!targetUid) {
      const { data: authData } = await supabase.auth.getUser()
      targetUid = authData?.user?.id
    }

    if (!targetUid) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. Fetch Face Scans
      const { data: faceData, error: faceErr } = await supabase
        .from('face_scans')
        .select('*')
        .eq('user_id', targetUid)
        .order('created_at', { ascending: false })

      if (!faceErr && faceData && faceData.length > 0) {
        setScans(faceData as FaceScan[])
      } else {
        // Fallback skin_profiles jika face_scans kosong
        const { data: profileScan } = await supabase
          .from('skin_profiles')
          .select('*')
          .eq('user_id', targetUid)
          .eq('is_active', true)
          .maybeSingle()

        if (profileScan?.raw_ai_response) {
          const raw = profileScan.raw_ai_response as Record<string, any>
          const fallbackScan: FaceScan = {
            id: profileScan.id,
            user_id: profileScan.user_id,
            overall_score: raw.overall_score || 85,
            skin_status_title: raw.skin_status_title || 'Analisis Kondisi Kulit Terpantau',
            skin_type: profileScan.skin_type || raw.skin_type || 'normal',
            skin_concerns: profileScan.skin_concerns || raw.skin_concerns || [],
            analysis_notes: profileScan.analysis_notes || raw.analysis_notes || '',
            area_evaluations: raw.area_evaluations || [],
            product_recommendations: raw.product_recommendations || [],
            raw_ai_response: profileScan.raw_ai_response,
            created_at: profileScan.created_at || new Date().toISOString(),
          }
          setScans([fallbackScan])
        } else {
          setScans([])
        }
      }

      // 2. Fetch Ingredient Scans
      const { data: ingData, error: ingErr } = await supabase
        .from('ingredient_scans')
        .select('*')
        .eq('user_id', targetUid)
        .order('created_at', { ascending: false })

      if (!ingErr && ingData && ingData.length > 0) {
        setIngredientScans(ingData as IngredientScan[])
      } else {
        setIngredientScans([])
      }
    } catch (err) {
      console.warn('Fetch history error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, user?.id, profile?.id])

  // Face Scan Counts
  const totalFaceScans = scans.length
  const optimalFaceCount = scans.filter((s) => (s.overall_score || 0) >= 80).length
  const attentionFaceCount = scans.filter((s) => (s.overall_score || 0) < 80).length

  // Ingredient Scan Counts
  const totalIngScans = ingredientScans.length
  const safeProductsCount = ingredientScans.filter((i) => i.is_safe && (i.safety_score ?? 80) >= 65).length
  const attentionIngCount = totalIngScans - safeProductsCount

  // Filtered Face Scans
  const filteredFaceScans = useMemo(() => {
    return scans.filter((scan) => {
      const score = scan.overall_score || 0
      if (faceFilter === 'optimal' && score < 80) return false
      if (faceFilter === 'attention' && score >= 80) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const title = (scan.skin_status_title || '').toLowerCase()
        const notes = (scan.analysis_notes || '').toLowerCase()
        const type = (scan.skin_type || '').toLowerCase()
        const concerns = Array.isArray(scan.skin_concerns)
          ? scan.skin_concerns.join(' ').toLowerCase()
          : ''
        return (
          title.includes(query) ||
          notes.includes(query) ||
          type.includes(query) ||
          concerns.includes(query)
        )
      }
      return true
    })
  }, [scans, faceFilter, searchQuery])

  // Filtered Ingredient Scans
  const filteredIngScans = useMemo(() => {
    return ingredientScans.filter((ing) => {
      const score = ing.safety_score ?? 80
      const isSafe = ing.is_safe && score >= 65
      if (ingFilter === 'safe' && !isSafe) return false
      if (ingFilter === 'attention' && isSafe) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const name = (ing.product_name || '').toLowerCase()
        const brand = (ing.brand || '').toLowerCase()
        return name.includes(query) || brand.includes(query)
      }
      return true
    })
  }, [ingredientScans, ingFilter, searchQuery])

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* ── 1. HEADER HALAMAN KANONIKAL ── */}
      <header className="cluv-mb-4">
        <div className="cluv-badge is-teal is-sm cluv-mb-2">
          <ScanFace size={13} />
          <span>SKIN JOURNEY</span>
        </div>
        <h1 className="cluv-title-section cluv-m-0">Skin Journey &amp; Riwayat Analisis</h1>
        <p className="cluv-subtitle cluv-mt-1">
          Pantau perkembangan kesehatan kulit dan riwayat analisis formula skincare secara berkala.
        </p>
      </header>

      {/* ── 2. TAB NAVIGASI (50:50 Segmented, Tanpa Scroll Horizontal) ── */}
      <div className="cluv-tabs is-full cluv-mb-4">
        <button
          type="button"
          className={`cluv-tab-btn ${activeTab === 'face' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('face')
            setSearchQuery('')
          }}
        >
          <ScanFace size={16} />
          <span>Wajah ({totalFaceScans})</span>
        </button>
        <button
          type="button"
          className={`cluv-tab-btn ${activeTab === 'ingredient' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ingredient')
            setSearchQuery('')
          }}
        >
          <FlaskConical size={16} />
          <span>Komposisi ({totalIngScans})</span>
        </button>
      </div>

      {/* ── 3. SEARCH & FILTER BAR HORIZONTAL (Mobile First) ── */}
      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-3">
        <div className="cluv-input-wrap has-leading-icon has-trailing-icon cluv-flex-1">
          <Search size={18} className="cluv-input-icon is-leading" />
          <input
            type="text"
            className="cluv-input"
            placeholder={
              activeTab === 'face'
                ? 'Cari kondisi kulit, keluhan...'
                : 'Cari nama produk, brand...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cluv-input-icon is-trailing"
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Trigger Button (Sejajar di sebelah kanan) */}
        <button
          type="button"
          className={`cluv-btn ${isFilterActive ? 'is-primary' : 'is-outline'}`}
          style={{
            minWidth: '44px',
            width: '44px',
            height: '44px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
          onClick={() => setShowFilterSheet(true)}
          title="Buka Filter Riwayat"
          aria-label="Filter Riwayat"
        >
          <Filter size={18} />
          {isFilterActive && (
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '9px',
                height: '9px',
                borderRadius: '9999px',
                backgroundColor: 'var(--cluv-gold, #f59e0b)',
                boxShadow: '0 0 0 2px #ffffff',
              }}
            />
          )}
        </button>
      </div>

      {/* Active Filter Chip Indicator */}
      {isFilterActive && activeFilterLabel && (
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-4">
          <span className="cluv-micro cluv-text-muted">Filter aktif:</span>
          <span className="cluv-badge is-teal is-sm cluv-flex-row cluv-items-center cluv-gap-1">
            <span>{activeFilterLabel}</span>
            <button
              type="button"
              className="cluv-border-0 cluv-bg-transparent cluv-p-0 cluv-flex-row cluv-items-center cluv-text-teal"
              onClick={() => {
                if (activeTab === 'face') setFaceFilter('all')
                else setIngFilter('all')
              }}
              title="Reset filter"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* ── BOTTOM SHEET FILTER (Mobile Drawer) ── */}
      <BottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Filter Riwayat Scan"
        subtitle={
          activeTab === 'face'
            ? 'Saring hasil analisis kondisi kulit'
            : 'Saring hasil evaluasi formula skincare'
        }
      >
        <div className="cluv-flex-col cluv-gap-4 cluv-py-2">
          <div className="cluv-flex-col cluv-gap-2.5">
            <span className="cluv-caption cluv-font-bold cluv-text-dark">
              Status Hasil Observasi:
            </span>
            <div className="cluv-flex-col cluv-gap-2">
              {activeTab === 'face' ? (
                <>
                  <button
                    type="button"
                    className={`cluv-chip ${faceFilter === 'all' ? 'is-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => setFaceFilter('all')}
                  >
                    <span>Semua Hasil Scan ({totalFaceScans})</span>
                    {faceFilter === 'all' && <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip ${faceFilter === 'optimal' ? 'is-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => setFaceFilter('optimal')}
                  >
                    <span>Kondisi Optimal 80+ ({optimalFaceCount})</span>
                    {faceFilter === 'optimal' && <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip ${faceFilter === 'attention' ? 'is-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => setFaceFilter('attention')}
                  >
                    <span>Perlu Perhatian ({attentionFaceCount})</span>
                    {faceFilter === 'attention' && <Check size={16} />}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`cluv-chip ${ingFilter === 'all' ? 'is-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => setIngFilter('all')}
                  >
                    <span>Semua Produk ({totalIngScans})</span>
                    {ingFilter === 'all' && <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip ${ingFilter === 'safe' ? 'is-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => setIngFilter('safe')}
                  >
                    <span>Formula Baik ({safeProductsCount})</span>
                    {ingFilter === 'safe' && <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip ${ingFilter === 'attention' ? 'is-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 14px' }}
                    onClick={() => setIngFilter('attention')}
                  >
                    <span>Perlu Perhatian ({attentionIngCount})</span>
                    {ingFilter === 'attention' && <Check size={16} />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons langsung di dalam bodi BottomSheet */}
          <div className="cluv-flex-row cluv-gap-2 cluv-w-full cluv-pt-3 cluv-border-t">
            <Button
              variant="outline"
              size="md"
              className="cluv-flex-1"
              onClick={() => {
                if (activeTab === 'face') setFaceFilter('all')
                else setIngFilter('all')
                setShowFilterSheet(false)
              }}
            >
              Reset Filter
            </Button>
            <Button
              variant="primary"
              size="md"
              className="cluv-flex-1"
              onClick={() => setShowFilterSheet(false)}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* ── 4. BENTO CARDS GRID (1 Seksi Ringkas Murni — Buka Modal saat Diklik) ── */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <RefreshCw size={28} className="cluv-text-teal animate-spin cluv-mx-auto cluv-mb-3" />
          <p className="cluv-body cluv-text-muted cluv-m-0">
            Memuat rekam jejak riwayat analisis...
          </p>
        </div>
      ) : activeTab === 'face' ? (
        /* TAB 1: FACE SCANS GRID */
        filteredFaceScans.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
            <div className="cluv-card-icon-wrap is-xl cluv-mx-auto cluv-mb-4 is-teal">
              <ScanFace size={36} />
            </div>
            <h3 className="cluv-title-card cluv-mb-2">
              {scans.length === 0
                ? 'Belum Ada Riwayat Scan Wajah'
                : 'Tidak Ditemukan Riwayat yang Sesuai'}
            </h3>
            <p className="cluv-body cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-mb-5">
              {scans.length === 0
                ? 'Kamu belum melakukan pemindaian wajah. Mulai sekarang untuk melacak kesehatan kulitmu secara berkala!'
                : 'Coba ubah kata kunci pencarian atau reset filter untuk melihat data riwayat lainnya.'}
            </p>
            {scans.length === 0 ? (
              <Button
                variant="primary"
                size="md"
                iconLeft={<Sparkles size={16} />}
                to="/face-scan"
              >
                Mulai Face Scan Pertama
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setFaceFilter('all')
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="cluv-grid cols-2 cluv-gap-4">
            {filteredFaceScans.map((scan, idx) => {
              const score = scan.overall_score || 0
              const isOptimal = score >= 80
              const isCaution = score >= 65 && score < 80

              return (
                <div
                  key={scan.id}
                  className="cluv-card is-interactive cluv-flex-col cluv-gap-2.5 cluv-p-4"
                  onClick={() => setSelectedScan(scan)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedScan(scan)
                    }
                  }}
                >
                  {/* Card Header: Metadata Tanggal (Icon Kalender) & Badge Terbaru di Kanan */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1.5 cluv-micro cluv-text-muted" style={{ fontWeight: 450 }}>
                      <Calendar size={13} className="cluv-text-muted cluv-flex-shrink-0" />
                      <span>{formatCompactDateTime(scan.created_at)}</span>
                    </div>
                    {scan.id === scans[0]?.id && (
                      <Badge variant="teal" size="sm">
                        Terbaru
                      </Badge>
                    )}
                  </div>

                  {/* Card Main Body */}
                  <div className="cluv-flex-row cluv-items-start cluv-gap-3">
                    <div
                      className={`cluv-score-badge ${
                        isOptimal ? 'is-optimal' : isCaution ? 'is-caution' : 'is-alert'
                      }`}
                    >
                      <span className="cluv-score-badge-val">{score}</span>
                      <span className="cluv-score-badge-label">Skor</span>
                    </div>

                    <div className="cluv-flex-col cluv-gap-1 cluv-flex-1 cluv-min-w-0">
                      <h3 className="cluv-title-card is-sm cluv-m-0 cluv-line-clamp-1">
                        {scan.skin_status_title || 'Analisis Kondisi Kulit'}
                      </h3>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-line-clamp-2">
                        {scan.analysis_notes || 'Hasil pemetaan kondisi kulit mandiri.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* TAB 2: INGREDIENT SCANS GRID */
        filteredIngScans.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
            <div className="cluv-card-icon-wrap is-xl cluv-mx-auto cluv-mb-4 is-teal">
              <FlaskConical size={36} />
            </div>
            <h3 className="cluv-title-card cluv-mb-2">
              {ingredientScans.length === 0
                ? 'Belum Ada Riwayat Formula Skincare'
                : 'Tidak Ditemukan Produk yang Sesuai'}
            </h3>
            <p className="cluv-body cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-mb-5">
              {ingredientScans.length === 0
                ? 'Periksa keamanan formula pembersih, toner, atau serum harianmu untuk memastikan kompatibilitasnya dengan kulitmu.'
                : 'Coba ubah kata kunci pencarian atau reset filter untuk melihat data riwayat lainnya.'}
            </p>
            {ingredientScans.length === 0 ? (
              <Button
                variant="primary"
                size="md"
                iconLeft={<FlaskConical size={16} />}
                to="/ingredient-scan"
              >
                Scan Komposisi Produk Pertama
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setIngFilter('all')
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="cluv-grid cols-2 cluv-gap-4">
            {filteredIngScans.map((ing, idx) => {
              const score = ing.safety_score ?? 80
              const isSafe = ing.is_safe && score >= 65

              return (
                <div
                  key={ing.id}
                  className="cluv-card is-interactive cluv-flex-col cluv-gap-2.5 cluv-p-4"
                  onClick={() => setSelectedIngredientScan(ing)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedIngredientScan(ing)
                    }
                  }}
                >
                  {/* Card Header: Metadata Tanggal (Icon Kalender) & Badge Terbaru di Kanan */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1.5 cluv-micro cluv-text-muted" style={{ fontWeight: 450 }}>
                      <Calendar size={13} className="cluv-text-muted cluv-flex-shrink-0" />
                      <span>{formatCompactDateTime(ing.created_at)}</span>
                    </div>
                    {ing.id === ingredientScans[0]?.id && (
                      <Badge variant="teal" size="sm">
                        Terbaru
                      </Badge>
                    )}
                  </div>

                  {/* Card Main Body */}
                  <div className="cluv-flex-row cluv-items-start cluv-gap-3">
                    <div
                      className={`cluv-score-badge ${isSafe ? 'is-optimal' : 'is-alert'}`}
                    >
                      <span className="cluv-score-badge-val">{score}</span>
                      <span className="cluv-score-badge-label">Safety</span>
                    </div>

                    <div className="cluv-flex-col cluv-gap-1 cluv-flex-1 cluv-min-w-0">
                      <h3 className="cluv-title-card is-sm cluv-m-0 cluv-line-clamp-1">
                        {ing.product_name}
                      </h3>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-line-clamp-2">
                        {ing.brand ? `Brand: ${ing.brand} • ` : ''}
                        {isSafe
                          ? 'Formula terverifikasi aman & minim resiko iritasi.'
                          : 'Formula memiliki bahan yang perlu diperhatikan.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── 5. MODAL DETAIL KANONIKAL CLUV FRAMEWORK ── */}
      <FaceScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
      />

      <IngredientScanDetailModal
        scan={selectedIngredientScan}
        onClose={() => setSelectedIngredientScan(null)}
      />
    </div>
  )
}
