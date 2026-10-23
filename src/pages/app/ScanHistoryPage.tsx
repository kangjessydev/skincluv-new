// src/pages/app/ScanHistoryPage.tsx
// Zero-Emoji, Defensible Copywriting, 100% Cluv Framework Zen Minimalist Skin Journey
import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  ScanFace,
  ChevronRight,
  Award,
  RefreshCw,
  FlaskConical,
  CheckCircle2,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FaceScan, IngredientScan } from '@/types/database'
import FaceScanDetailDrawer from '@/components/scans/FaceScanDetailDrawer'
import IngredientScanDetailDrawer from '@/components/scans/IngredientScanDetailDrawer'
import { Button, Badge } from '@/components/ui'

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
      // 1. Fetch Face Scans (Index-Only Scan)
      const { data: faceData, error: faceErr } = await supabase
        .from('face_scans')
        .select('*')
        .eq('user_id', targetUid)
        .order('created_at', { ascending: false })

      if (!faceErr && faceData) {
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

      // 2. Fetch Ingredient Scans (RFC 008 Unification)
      const { data: ingData, error: ingErr } = await supabase
        .from('ingredient_scans')
        .select('*')
        .eq('user_id', targetUid)
        .order('created_at', { ascending: false })

      if (!ingErr && ingData) {
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

  // Face Scan Statistics
  const totalFaceScans = scans.length
  const avgFaceScore =
    totalFaceScans > 0
      ? Math.round(scans.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalFaceScans)
      : 0
  const latestFaceScore = scans[0]?.overall_score || 0
  const previousFaceScore = scans[1]?.overall_score || latestFaceScore
  const faceScoreDiff = latestFaceScore - previousFaceScore

  // MCID Guardrail Computation (Invariant 14)
  const faceTrendMeta = useMemo(() => {
    if (totalFaceScans < 2) {
      return {
        label: 'Basis Awal',
        val: '-',
        sub: 'Sesi analisis perdana',
        badge: 'neutral' as const,
      }
    }
    if (Math.abs(faceScoreDiff) < 5) {
      return {
        label: 'Stabil',
        val: '0 Poin',
        sub: 'Variasi normal pencahayaan (MCID)',
        badge: 'teal' as const,
      }
    }
    if (faceScoreDiff >= 5) {
      return {
        label: 'Meningkat',
        val: `+${faceScoreDiff} Poin`,
        sub: 'Peningkatan kondisi terukur',
        badge: 'teal' as const,
      }
    }
    return {
      label: 'Perlu Perhatian',
      val: `${faceScoreDiff} Poin`,
      sub: 'Perlu penyesuaian rutinitas',
      badge: 'gold' as const,
    }
  }, [totalFaceScans, faceScoreDiff])

  // Ingredient Scan Statistics
  const totalIngScans = ingredientScans.length
  const safeProductsCount = ingredientScans.filter((i) => i.is_safe && (i.safety_score ?? 80) >= 65).length
  const avgSafetyScore =
    totalIngScans > 0
      ? Math.round(ingredientScans.reduce((acc, s) => acc + (s.safety_score || 0), 0) / totalIngScans)
      : 0

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
      {/* 1. Header & Navigation */}
      <div className="cluv-mb-6">
        <Link to="/" className="cluv-back-link cluv-mb-3">
          <ArrowLeft size={16} />
          <span>Kembali ke Dashboard</span>
        </Link>
        <h1 className="cluv-title-page">Skin Journey &amp; Riwayat Analisis</h1>
        <p className="cluv-caption cluv-text-muted">
          Pantau perkembangan kesehatan kulit dan riwayat analisis formula skincare secara berkala.
        </p>

        {/* Tab Switcher */}
        <div className="cluv-tabs cluv-mt-5">
          <button
            type="button"
            className={`cluv-tab-btn ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('face')
              setSearchQuery('')
            }}
          >
            <ScanFace size={16} />
            <span>Analisis Wajah AI ({totalFaceScans})</span>
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
            <span>Evaluasi Formula Skincare ({totalIngScans})</span>
          </button>
        </div>
      </div>

      {/* 2. Health Overview Bento KPI Grid */}
      <div className="cluv-grid cols-3 cluv-gap-4 cluv-mb-6">
        {activeTab === 'face' ? (
          <>
            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-teal">
                <Sparkles size={22} />
              </div>
              <div className="cluv-flex-col cluv-gap-05">
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">
                  Rata-rata Skor Kulit
                </span>
                <h3 className="cluv-title-card cluv-m-0">{avgFaceScore}/100</h3>
                <span className="cluv-micro cluv-text-muted">
                  {avgFaceScore >= 80
                    ? 'Kondisi kulit dominan optimal'
                    : avgFaceScore >= 65
                    ? 'Kondisi kulit terpantau baik'
                    : 'Perlu fokus hidrasi & proteksi'}
                </span>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-gold">
                <Award size={22} />
              </div>
              <div className="cluv-flex-col cluv-gap-05">
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">
                  Konsistensi Pemantauan
                </span>
                <h3 className="cluv-title-card cluv-m-0">{totalFaceScans} Sesi</h3>
                <span className="cluv-micro cluv-text-muted">
                  Rekam jejak observasi mandiri
                </span>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-blue">
                <TrendingUp size={22} />
              </div>
              <div className="cluv-flex-col cluv-gap-05">
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">
                  Dinamika Sesi Terakhir
                </span>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <h3 className="cluv-title-card cluv-m-0">{faceTrendMeta.val}</h3>
                  <Badge variant={faceTrendMeta.badge} size="sm">
                    {faceTrendMeta.label}
                  </Badge>
                </div>
                <span className="cluv-micro cluv-text-muted">
                  {faceTrendMeta.sub}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-teal">
                <FlaskConical size={22} />
              </div>
              <div className="cluv-flex-col cluv-gap-05">
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">
                  Total Produk Diperiksa
                </span>
                <h3 className="cluv-title-card cluv-m-0">{totalIngScans} Produk</h3>
                <span className="cluv-micro cluv-text-muted">
                  Skincare &amp; kosmetik terverifikasi
                </span>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-blue">
                <ShieldCheck size={22} />
              </div>
              <div className="cluv-flex-col cluv-gap-05">
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">
                  Rata-rata Safety Score
                </span>
                <h3 className="cluv-title-card cluv-m-0">{avgSafetyScore}/100</h3>
                <span className="cluv-micro cluv-text-muted">
                  Indeks keamanan formula bahan aktif
                </span>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-gold">
                <CheckCircle2 size={22} />
              </div>
              <div className="cluv-flex-col cluv-gap-05">
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">
                  Formula Terverifikasi Baik
                </span>
                <h3 className="cluv-title-card cluv-m-0">{safeProductsCount} Produk</h3>
                <span className="cluv-micro cluv-text-muted">
                  Kompatibel &amp; minim resiko iritasi
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Filter & Quick Search Bar */}
      <div className="cluv-card cluv-p-4 cluv-mb-5 cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-4 cluv-flex-wrap">
        {/* Chips Filter */}
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
          {activeTab === 'face' ? (
            <>
              <button
                type="button"
                className={`cluv-chip ${faceFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setFaceFilter('all')}
              >
                Semua ({totalFaceScans})
              </button>
              <button
                type="button"
                className={`cluv-chip ${faceFilter === 'optimal' ? 'is-active' : ''}`}
                onClick={() => setFaceFilter('optimal')}
              >
                Kondisi Optimal 80+ ({scans.filter((s) => (s.overall_score || 0) >= 80).length})
              </button>
              <button
                type="button"
                className={`cluv-chip ${faceFilter === 'attention' ? 'is-active' : ''}`}
                onClick={() => setFaceFilter('attention')}
              >
                Perlu Perhatian &lt;80 ({scans.filter((s) => (s.overall_score || 0) < 80).length})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`cluv-chip ${ingFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setIngFilter('all')}
              >
                Semua ({totalIngScans})
              </button>
              <button
                type="button"
                className={`cluv-chip ${ingFilter === 'safe' ? 'is-active' : ''}`}
                onClick={() => setIngFilter('safe')}
              >
                Formula Baik ({safeProductsCount})
              </button>
              <button
                type="button"
                className={`cluv-chip ${ingFilter === 'attention' ? 'is-active' : ''}`}
                onClick={() => setIngFilter('attention')}
              >
                Perlu Perhatian ({totalIngScans - safeProductsCount})
              </button>
            </>
          )}
        </div>

        {/* Search Input */}
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-1 cluv-max-w-xs">
          <div className="cluv-input-wrap cluv-w-full">
            <span className="cluv-input-icon-left">
              <Search size={15} />
            </span>
            <input
              type="text"
              className="cluv-input cluv-input-with-icon"
              placeholder={activeTab === 'face' ? 'Cari kondisi kulit...' : 'Cari nama produk / brand...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cluv-input-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus Pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Timeline Chronological Feed */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <RefreshCw size={28} className="cluv-text-teal animate-spin cluv-mx-auto cluv-mb-3" />
          <p className="cluv-body cluv-text-muted cluv-m-0">
            Memuat rekam jejak riwayat analisis...
          </p>
        </div>
      ) : activeTab === 'face' ? (
        /* TAB 1: FACE SCANS LIST */
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
          <div className="cluv-flex-col cluv-gap-3">
            {filteredFaceScans.map((scan, idx) => {
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
              const score = scan.overall_score || 0
              const isOptimal = score >= 80
              const isCaution = score >= 65 && score < 80

              // Calculate diff with chronological previous scan if available
              const nextScanInList = filteredFaceScans[idx + 1]
              const itemDiff = nextScanInList
                ? score - (nextScanInList.overall_score || score)
                : null

              return (
                <div
                  key={scan.id}
                  className="cluv-scan-card"
                  onClick={() => setSelectedScan(scan)}
                >
                  <div className="cluv-scan-card-main">
                    {/* Score Gauge Badge */}
                    <div
                      className={`cluv-score-badge ${
                        isOptimal ? 'is-optimal' : isCaution ? 'is-caution' : 'is-alert'
                      }`}
                    >
                      <span className="cluv-score-badge-val">{score}</span>
                      <span className="cluv-score-badge-label">Skor</span>
                    </div>

                    {/* Card Content Body */}
                    <div className="cluv-scan-card-body">
                      {/* Meta Date & Badges */}
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1 cluv-flex-wrap">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                          <Calendar size={13} />
                          <span>{formattedDate} • {formattedTime}</span>
                        </div>
                        {idx === 0 && <Badge variant="teal" size="sm">Terbaru</Badge>}
                        {itemDiff !== null && (
                          <span className="cluv-micro cluv-text-muted">
                            {Math.abs(itemDiff) < 5
                              ? '• Kondisi Stabil'
                              : itemDiff > 0
                              ? `• +${itemDiff} Poin vs Sebelumnya`
                              : `• ${itemDiff} Poin vs Sebelumnya`}
                          </span>
                        )}
                      </div>

                      {/* Skin Status Headline */}
                      <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">
                        {scan.skin_status_title || 'Analisis Kondisi Kulit'}
                      </h4>

                      {/* Concise Observation Summary */}
                      <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-mb-2 cluv-line-clamp-2">
                        {scan.analysis_notes || 'Hasil pemetaan kondisi kulit menyeluruh.'}
                      </p>

                      {/* Chips Tags */}
                      <div className="cluv-chip-group">
                        <span className="cluv-chip is-sm">
                          Tipe: {String(scan.skin_type || 'Normal').toUpperCase()}
                        </span>
                        {Array.isArray(scan.skin_concerns) &&
                          scan.skin_concerns.slice(0, 2).map((c, i) => (
                            <span key={i} className="cluv-chip is-sm">
                              {c}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Link */}
                  <div className="cluv-scan-card-action">
                    <span>Lihat Rincian Analisis</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* TAB 2: INGREDIENT SCANS LIST */
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
          <div className="cluv-flex-col cluv-gap-3">
            {filteredIngScans.map((ing, idx) => {
              const dateObj = new Date(ing.created_at)
              const formattedDate = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              const score = ing.safety_score ?? 80
              const isSafe = ing.is_safe && score >= 65

              return (
                <div
                  key={ing.id}
                  className="cluv-scan-card"
                  onClick={() => setSelectedIngredientScan(ing)}
                >
                  <div className="cluv-scan-card-main">
                    {/* Score Badge */}
                    <div
                      className={`cluv-score-badge ${isSafe ? 'is-optimal' : 'is-alert'}`}
                    >
                      <span className="cluv-score-badge-val">{score}</span>
                      <span className="cluv-score-badge-label">Safety</span>
                    </div>

                    {/* Card Content Body */}
                    <div className="cluv-scan-card-body">
                      {/* Meta Date */}
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
                        <Calendar size={13} />
                        <span>{formattedDate}</span>
                        {idx === 0 && <Badge variant="teal" size="sm">Terbaru</Badge>}
                      </div>

                      {/* Product Name */}
                      <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">
                        {ing.product_name}
                      </h4>

                      {/* Brand & Brief Meta */}
                      <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-mb-2">
                        {ing.brand ? `Brand: ${ing.brand} • ` : ''}
                        {isSafe
                          ? 'Formula terverifikasi aman & minim resiko iritasi.'
                          : 'Formula memiliki bahan yang perlu diperhatikan.'}
                      </p>

                      {/* Chips Group */}
                      <div className="cluv-chip-group">
                        <Badge variant={isSafe ? 'teal' : 'rose'} size="sm">
                          {isSafe ? 'Formula Sangat Baik' : 'Perlu Perhatian'}
                        </Badge>
                        {Array.isArray(ing.key_ingredients) &&
                          ing.key_ingredients.slice(0, 3).map((k, i) => (
                            <span key={i} className="cluv-chip is-sm">
                              {typeof k === 'string' ? k : (k as any)?.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Link */}
                  <div className="cluv-scan-card-action">
                    <span>Lihat Evaluasi Formula</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* 5. Slide-Over Detail Drawers */}
      <FaceScanDetailDrawer
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
        onConsult={() => {
          setSelectedScan(null)
          navigate('/chatbot')
        }}
      />

      <IngredientScanDetailDrawer
        scan={selectedIngredientScan}
        onClose={() => setSelectedIngredientScan(null)}
        onConsult={() => {
          setSelectedIngredientScan(null)
          navigate('/chatbot')
        }}
      />
    </div>
  )
}
