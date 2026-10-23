// src/pages/app/ScanHistoryPage.tsx
// Zero-Emoji, Defensible Copywriting, 100% Cluv Framework Master-Detail Skin Journey
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
  ShieldAlert,
  Search,
  X,
  Target,
  Layers,
  AlertTriangle,
  Tag,
  MessageSquare,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FaceScan, IngredientScan } from '@/types/database'
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

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

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
        setSelectedScan(faceData[0] as FaceScan)
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
          setSelectedScan(fallbackScan)
        } else {
          setScans([])
          setSelectedScan(null)
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
        setSelectedIngredientScan(ingData[0] as IngredientScan)
      } else {
        setIngredientScans([])
        setSelectedIngredientScan(null)
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
      label: 'Penyesuaian',
      val: `${faceScoreDiff} Poin`,
      sub: 'Perlu fokus perawatan',
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

  // Parse Raw Response for Selected Face Scan
  const selectedFaceRaw = useMemo(() => {
    if (!selectedScan) return {}
    try {
      if (typeof selectedScan.raw_ai_response === 'string') {
        return JSON.parse(selectedScan.raw_ai_response)
      }
      if (selectedScan.raw_ai_response && typeof selectedScan.raw_ai_response === 'object') {
        return selectedScan.raw_ai_response as Record<string, any>
      }
    } catch {
      return {}
    }
    return {}
  }, [selectedScan])

  const parsedAreas = useMemo(() => {
    if (!selectedScan) return []
    if (Array.isArray(selectedScan.area_evaluations) && selectedScan.area_evaluations.length > 0) {
      return selectedScan.area_evaluations
    }
    if (Array.isArray(selectedFaceRaw?.area_evaluations)) {
      return selectedFaceRaw.area_evaluations
    }
    return []
  }, [selectedScan, selectedFaceRaw])

  const tipsAvoid = Array.isArray(selectedFaceRaw?.personal_tips?.avoid) ? selectedFaceRaw.personal_tips.avoid : []
  const tipsReduce = Array.isArray(selectedFaceRaw?.personal_tips?.reduce) ? selectedFaceRaw.personal_tips.reduce : []
  const tipsDo = Array.isArray(selectedFaceRaw?.personal_tips?.do) ? selectedFaceRaw.personal_tips.do : []

  // Parse Raw Response for Selected Ingredient Scan
  const selectedIngRaw = useMemo(() => {
    if (!selectedIngredientScan) return {}
    try {
      if (typeof selectedIngredientScan.raw_ai_response === 'string') {
        return JSON.parse(selectedIngredientScan.raw_ai_response)
      }
      if (selectedIngredientScan.raw_ai_response && typeof selectedIngredientScan.raw_ai_response === 'object') {
        return selectedIngredientScan.raw_ai_response as Record<string, any>
      }
    } catch {
      return {}
    }
    return {}
  }, [selectedIngredientScan])

  const ingBreakdown = Array.isArray(selectedIngredientScan?.ingredients_breakdown)
    ? (selectedIngredientScan.ingredients_breakdown as any[])
    : Array.isArray(selectedIngRaw?.ingredients_breakdown)
    ? selectedIngRaw.ingredients_breakdown
    : []

  const heroIngredients = Array.isArray(selectedIngRaw?.hero_actives)
    ? selectedIngRaw.hero_actives
    : Array.isArray(selectedIngredientScan?.key_ingredients)
    ? selectedIngredientScan.key_ingredients
    : []

  const dangerCombos = Array.isArray(selectedIngRaw?.layering_guide?.danger_combos)
    ? selectedIngRaw.layering_guide.danger_combos
    : []

  const personalNotes = Array.isArray(selectedIngRaw?.personal_contraindications)
    ? selectedIngRaw.personal_contraindications
    : []

  // SVG Gauge calculations for Face
  const faceScore = selectedScan?.overall_score || 80
  const isOptimal = faceScore >= 80
  const isGood = faceScore >= 65 && faceScore < 80
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (faceScore / 100) * circumference

  // SVG Gauge calculations for Ingredient
  const ingScore = selectedIngredientScan?.safety_score ?? 80
  const isVerySafe = ingScore >= 85
  const isSafe = (selectedIngredientScan?.is_safe ?? true) && ingScore >= 65
  const ingDashoffset = circumference - (ingScore / 100) * circumference

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

        {/* Tab Switcher & Compact 1-Line Status Bar */}
        <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-4 cluv-flex-wrap cluv-mt-5">
          <div className="cluv-tabs">
            <button
              type="button"
              className={`cluv-tab-btn ${activeTab === 'face' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('face')
                setSearchQuery('')
                setMobileView('list')
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
                setMobileView('list')
              }}
            >
              <FlaskConical size={16} />
              <span>Evaluasi Formula Skincare ({totalIngScans})</span>
            </button>
          </div>

          {/* Slim 1-Line Metric Summary Bar */}
          <div className="cluv-card cluv-py-2 cluv-px-4 cluv-flex-row cluv-items-center cluv-gap-4 cluv-bg-surface-soft">
            {activeTab === 'face' ? (
              <>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Rata-rata:</span>
                  <span className="cluv-caption cluv-font-bold cluv-text-teal">{avgFaceScore}/100</span>
                </div>
                <span className="cluv-text-muted">•</span>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Sesi:</span>
                  <span className="cluv-caption cluv-font-bold cluv-text-dark">{totalFaceScans} Kali</span>
                </div>
                <span className="cluv-text-muted">•</span>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Tren MCID:</span>
                  <Badge variant={faceTrendMeta.badge} size="sm">{faceTrendMeta.label}</Badge>
                </div>
              </>
            ) : (
              <>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Total Produk:</span>
                  <span className="cluv-caption cluv-font-bold cluv-text-teal">{totalIngScans}</span>
                </div>
                <span className="cluv-text-muted">•</span>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Rata-rata Safety:</span>
                  <span className="cluv-caption cluv-font-bold cluv-text-dark">{avgSafetyScore}/100</span>
                </div>
                <span className="cluv-text-muted">•</span>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Formula Baik:</span>
                  <span className="cluv-caption cluv-font-bold cluv-text-teal">{safeProductsCount}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Master-Detail Interactive Canvas */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <RefreshCw size={28} className="cluv-text-teal animate-spin cluv-mx-auto cluv-mb-3" />
          <p className="cluv-body cluv-text-muted cluv-m-0">
            Memuat rekam jejak riwayat analisis...
          </p>
        </div>
      ) : activeTab === 'face' ? (
        /* TAB 1: FACE SCANS MASTER-DETAIL */
        scans.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
            <div className="cluv-card-icon-wrap is-xl cluv-mx-auto cluv-mb-4 is-teal">
              <ScanFace size={36} />
            </div>
            <h3 className="cluv-title-card cluv-mb-2">Belum Ada Riwayat Scan Wajah</h3>
            <p className="cluv-body cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-mb-5">
              Kamu belum melakukan pemindaian wajah. Mulai sekarang untuk melacak perkembangan kesehatan kulitmu!
            </p>
            <Button
              variant="primary"
              size="md"
              iconLeft={<Sparkles size={16} />}
              to="/face-scan"
            >
              Mulai Face Scan Pertama
            </Button>
          </div>
        ) : (
          <div className="cluv-master-detail">
            {/* 2.1 LEFT COLUMN: MASTER FEED */}
            <div className={`cluv-master-pane ${mobileView === 'detail' ? 'cluv-hide-mobile' : ''}`}>
              {/* Search & Filters */}
              <div className="cluv-card cluv-p-3 cluv-flex-col cluv-gap-2">
                <div className="cluv-input-wrap cluv-w-full">
                  <span className="cluv-input-icon-left">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="cluv-input cluv-input-with-icon"
                    placeholder="Cari kondisi kulit..."
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
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-flex-wrap">
                  <button
                    type="button"
                    className={`cluv-chip is-sm ${faceFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setFaceFilter('all')}
                  >
                    Semua ({totalFaceScans})
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip is-sm ${faceFilter === 'optimal' ? 'is-active' : ''}`}
                    onClick={() => setFaceFilter('optimal')}
                  >
                    Optimal 80+
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip is-sm ${faceFilter === 'attention' ? 'is-active' : ''}`}
                    onClick={() => setFaceFilter('attention')}
                  >
                    Perlu Perhatian
                  </button>
                </div>
              </div>

              {/* Scrollable Session Items */}
              <div className="cluv-flex-col cluv-gap-2">
                {filteredFaceScans.length === 0 ? (
                  <div className="cluv-card cluv-p-6 cluv-text-center cluv-text-muted cluv-caption">
                    Tidak ada sesi yang cocok dengan filter.
                  </div>
                ) : (
                  filteredFaceScans.map((scan, idx) => {
                    const isSelected = selectedScan?.id === scan.id
                    const sScore = scan.overall_score || 0
                    const isOpt = sScore >= 80
                    const isCtn = sScore >= 65 && sScore < 80

                    const dateObj = new Date(scan.created_at)
                    const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={scan.id}
                        className={`cluv-session-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedScan(scan)
                          setMobileView('detail')
                        }}
                      >
                        {/* Mini Score Badge */}
                        <div
                          className={`cluv-score-badge ${
                            isOpt ? 'is-optimal' : isCtn ? 'is-caution' : 'is-alert'
                          }`}
                        >
                          <span className="cluv-score-badge-val">{sScore}</span>
                          <span className="cluv-score-badge-label">Skor</span>
                        </div>

                        {/* Title & Date */}
                        <div className="cluv-flex-col cluv-gap-05 cluv-min-w-0 cluv-flex-1">
                          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted">
                            <span>{dateFormatted} • {timeFormatted}</span>
                            {idx === 0 && <Badge variant="teal" size="sm">Terbaru</Badge>}
                          </div>
                          <span className="cluv-caption cluv-font-bold cluv-text-dark cluv-truncate">
                            {scan.skin_status_title || 'Analisis Kondisi Kulit'}
                          </span>
                          <span className="cluv-micro cluv-text-muted cluv-truncate">
                            Tipe: {String(scan.skin_type || 'Normal').toUpperCase()}
                          </span>
                        </div>

                        <ChevronRight
                          size={16}
                          className={`cluv-flex-shrink-0 ${
                            isSelected ? 'cluv-text-teal' : 'cluv-text-muted'
                          }`}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* 2.2 RIGHT COLUMN: LIVE INSPECTION CANVAS */}
            {selectedScan ? (
              <div className={`cluv-detail-pane ${mobileView === 'list' ? 'cluv-hide-mobile' : ''}`}>
                {/* Mobile Back Button to Master Feed */}
                <div className="cluv-hide-desktop cluv-mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<ArrowLeft size={14} />}
                    onClick={() => setMobileView('list')}
                  >
                    Kembali ke Daftar Sesi
                  </Button>
                </div>

                <div className="cluv-card cluv-p-6 cluv-flex-col cluv-gap-5">
                  {/* Top Bar of Canvas */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-border-b cluv-pb-4 cluv-gap-4 cluv-flex-wrap">
                    <div>
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
                        <Calendar size={13} />
                        <span>
                          {new Date(selectedScan.created_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h2 className="cluv-title-card cluv-m-0">
                        {selectedScan.skin_status_title || 'Laporan Analisis Kondisi Kulit'}
                      </h2>
                    </div>

                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<MessageSquare size={14} />}
                        onClick={() => navigate('/chatbot')}
                      >
                        Tanya Skinsistant
                      </Button>
                    </div>
                  </div>

                  {/* Hero Gauge Section */}
                  <div className="cluv-flex-row cluv-items-center cluv-gap-5 cluv-flex-wrap">
                    {/* SVG Gauge */}
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
                        <span className="cluv-score-val">{faceScore}</span>
                        <span className="cluv-score-max">/100</span>
                      </div>
                    </div>

                    {/* Headline Metadata */}
                    <div className="cluv-flex-col cluv-gap-2 cluv-flex-1 cluv-min-w-xs">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                        <Badge variant={isOptimal ? 'teal' : isGood ? 'info' : 'rose'} size="sm">
                          {isOptimal ? 'Kondisi Optimal' : isGood ? 'Kondisi Baik' : 'Perlu Perhatian'}
                        </Badge>
                        <span className="cluv-chip is-sm">
                          <Sparkles size={12} /> Tipe: {String(selectedScan.skin_type || 'Normal').toUpperCase()}
                        </span>
                        {Array.isArray(selectedScan.skin_concerns) &&
                          selectedScan.skin_concerns.map((c, i) => (
                            <span key={i} className="cluv-chip is-sm">
                              #{c}
                            </span>
                          ))}
                      </div>

                      <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
                        <ShieldCheck size={14} className="cluv-text-teal" />
                        <span>Observasi Visual Terarsip (Non-Klinis)</span>
                      </div>

                      {selectedScan.analysis_notes && (
                        <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1">
                          {selectedScan.analysis_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Granular Area Evaluations (2-column Bento Grid) */}
                  {parsedAreas.length > 0 && (
                    <div className="cluv-flex-col cluv-gap-3 cluv-pt-3 cluv-border-t">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div className="cluv-card-icon-wrap is-sm is-teal">
                          <Layers size={14} />
                        </div>
                        <h3 className="cluv-title-card cluv-m-0">
                          Evaluasi Kondisi Kulit Per Area ({parsedAreas.length} Area)
                        </h3>
                      </div>

                      <div className="cluv-grid cols-2 cluv-gap-3">
                        {parsedAreas.map((area: any, aIdx: number) => {
                          const areaScore = area.score || 80
                          const isAreaOpt = areaScore >= 80

                          return (
                            <div key={aIdx} className="cluv-card cluv-p-4 cluv-flex-col cluv-gap-2 cluv-bg-surface-soft">
                              <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2">
                                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                                  <Target size={14} className="cluv-text-teal" />
                                  <span className="cluv-font-bold cluv-text-dark">
                                    {area.area_name || area.name || `Area ${aIdx + 1}`}
                                  </span>
                                </div>
                                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                                  <Badge variant={isAreaOpt ? 'teal' : 'gold'} size="sm">
                                    {area.status || (isAreaOpt ? 'Optimal' : 'Perlu Perhatian')}
                                  </Badge>
                                  <span className="cluv-caption cluv-font-bold cluv-text-dark">
                                    {areaScore}/100
                                  </span>
                                </div>
                              </div>

                              {area.finding && (
                                <p className="cluv-caption cluv-text-muted cluv-m-0">
                                  <span className="cluv-font-bold cluv-text-dark">Analisis: </span>
                                  {area.finding}
                                </p>
                              )}

                              {area.action_plan && (
                                <p className="cluv-micro cluv-text-teal cluv-m-0 cluv-font-bold">
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
                    <div className="cluv-flex-col cluv-gap-3 cluv-pt-3 cluv-border-t">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div className="cluv-card-icon-wrap is-sm is-gold">
                          <CheckCircle2 size={14} />
                        </div>
                        <h3 className="cluv-title-card cluv-m-0">
                          Saran Rutinitas &amp; Tips Mandiri
                        </h3>
                      </div>

                      <div className="cluv-grid cols-3 cluv-gap-3">
                        {tipsDo.length > 0 && (
                          <div className="cluv-card cluv-p-3 cluv-border-teal">
                            <span className="cluv-micro cluv-font-bold cluv-text-teal cluv-block cluv-mb-1 cluv-uppercase">
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
                          <div className="cluv-card cluv-p-3 cluv-border-gold">
                            <span className="cluv-micro cluv-font-bold cluv-text-gold cluv-block cluv-mb-1 cluv-uppercase">
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
                          <div className="cluv-card cluv-p-3 cluv-border-rose">
                            <span className="cluv-micro cluv-font-bold cluv-text-danger cluv-block cluv-mb-1 cluv-uppercase">
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

                  {/* Defensible Legal Disclaimer */}
                  <div className="cluv-alert is-neutral cluv-mt-2">
                    <ShieldCheck size={16} className="cluv-text-muted cluv-flex-shrink-0" />
                    <p className="cluv-micro cluv-text-muted cluv-m-0">
                      Analisis ini adalah pemetaan observasi visual mandiri berbasis AI dan bukan merupakan diagnosis medis, resep, atau terapi dermatologi pengganti dokter spesialis kulit.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cluv-card cluv-p-8 cluv-text-center cluv-text-muted cluv-body">
                Pilih salah satu sesi di sebelah kiri untuk melihat rincian pemetaan kondisi kulit.
              </div>
            )}
          </div>
        )
      ) : (
        /* TAB 2: INGREDIENT SCANS MASTER-DETAIL */
        ingredientScans.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
            <div className="cluv-card-icon-wrap is-xl cluv-mx-auto cluv-mb-4 is-teal">
              <FlaskConical size={36} />
            </div>
            <h3 className="cluv-title-card cluv-mb-2">Belum Ada Riwayat Formula Skincare</h3>
            <p className="cluv-body cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-mb-5">
              Periksa keamanan formula pembersih, toner, atau serum harianmu untuk memastikan kompatibilitasnya dengan kulitmu.
            </p>
            <Button
              variant="primary"
              size="md"
              iconLeft={<FlaskConical size={16} />}
              to="/ingredient-scan"
            >
              Scan Komposisi Produk Pertama
            </Button>
          </div>
        ) : (
          <div className="cluv-master-detail">
            {/* 2.1 LEFT COLUMN: MASTER FEED */}
            <div className={`cluv-master-pane ${mobileView === 'detail' ? 'cluv-hide-mobile' : ''}`}>
              {/* Search & Filters */}
              <div className="cluv-card cluv-p-3 cluv-flex-col cluv-gap-2">
                <div className="cluv-input-wrap cluv-w-full">
                  <span className="cluv-input-icon-left">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="cluv-input cluv-input-with-icon"
                    placeholder="Cari nama produk / brand..."
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
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-flex-wrap">
                  <button
                    type="button"
                    className={`cluv-chip is-sm ${ingFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setIngFilter('all')}
                  >
                    Semua ({totalIngScans})
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip is-sm ${ingFilter === 'safe' ? 'is-active' : ''}`}
                    onClick={() => setIngFilter('safe')}
                  >
                    Formula Baik ({safeProductsCount})
                  </button>
                  <button
                    type="button"
                    className={`cluv-chip is-sm ${ingFilter === 'attention' ? 'is-active' : ''}`}
                    onClick={() => setIngFilter('attention')}
                  >
                    Perlu Perhatian
                  </button>
                </div>
              </div>

              {/* Scrollable Product Items */}
              <div className="cluv-flex-col cluv-gap-2">
                {filteredIngScans.length === 0 ? (
                  <div className="cluv-card cluv-p-6 cluv-text-center cluv-text-muted cluv-caption">
                    Tidak ada produk yang cocok dengan filter.
                  </div>
                ) : (
                  filteredIngScans.map((ing, idx) => {
                    const isSelected = selectedIngredientScan?.id === ing.id
                    const sScore = ing.safety_score ?? 80
                    const isItemSafe = ing.is_safe && sScore >= 65

                    const dateObj = new Date(ing.created_at)
                    const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })

                    return (
                      <div
                        key={ing.id}
                        className={`cluv-session-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedIngredientScan(ing)
                          setMobileView('detail')
                        }}
                      >
                        {/* Safety Score Badge */}
                        <div
                          className={`cluv-score-badge ${
                            isItemSafe ? 'is-optimal' : 'is-alert'
                          }`}
                        >
                          <span className="cluv-score-badge-val">{sScore}</span>
                          <span className="cluv-score-badge-label">Safety</span>
                        </div>

                        {/* Product Title & Brand */}
                        <div className="cluv-flex-col cluv-gap-05 cluv-min-w-0 cluv-flex-1">
                          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted">
                            <span>{dateFormatted}</span>
                            {idx === 0 && <Badge variant="teal" size="sm">Terbaru</Badge>}
                          </div>
                          <span className="cluv-caption cluv-font-bold cluv-text-dark cluv-truncate">
                            {ing.product_name}
                          </span>
                          <span className="cluv-micro cluv-text-muted cluv-truncate">
                            {ing.brand ? `Brand: ${ing.brand}` : 'Skincare Terdaftar'}
                          </span>
                        </div>

                        <ChevronRight
                          size={16}
                          className={`cluv-flex-shrink-0 ${
                            isSelected ? 'cluv-text-teal' : 'cluv-text-muted'
                          }`}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* 2.2 RIGHT COLUMN: LIVE INSPECTION CANVAS */}
            {selectedIngredientScan ? (
              <div className={`cluv-detail-pane ${mobileView === 'list' ? 'cluv-hide-mobile' : ''}`}>
                {/* Mobile Back Button to Master Feed */}
                <div className="cluv-hide-desktop cluv-mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<ArrowLeft size={14} />}
                    onClick={() => setMobileView('list')}
                  >
                    Kembali ke Daftar Produk
                  </Button>
                </div>

                <div className="cluv-card cluv-p-6 cluv-flex-col cluv-gap-5">
                  {/* Top Bar of Canvas */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-border-b cluv-pb-4 cluv-gap-4 cluv-flex-wrap">
                    <div>
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
                        <Calendar size={13} />
                        <span>
                          {new Date(selectedIngredientScan.created_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h2 className="cluv-title-card cluv-m-0">
                        {selectedIngredientScan.product_name}
                      </h2>
                    </div>

                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<MessageSquare size={14} />}
                        onClick={() => navigate('/chatbot')}
                      >
                        Tanya Produk ke AI
                      </Button>
                    </div>
                  </div>

                  {/* Hero Safety Section */}
                  <div className="cluv-flex-row cluv-items-center cluv-gap-5 cluv-flex-wrap">
                    {/* SVG Gauge */}
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
                          strokeDashoffset={ingDashoffset}
                        />
                      </svg>
                      <div className="cluv-score-center">
                        <span className="cluv-score-val">{ingScore}</span>
                        <span className="cluv-score-max">/100</span>
                      </div>
                    </div>

                    {/* Headline Metadata */}
                    <div className="cluv-flex-col cluv-gap-2 cluv-flex-1 cluv-min-w-xs">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                        <Badge variant={isVerySafe ? 'teal' : isSafe ? 'info' : 'rose'} size="sm">
                          {isVerySafe ? 'Formula Sangat Baik' : isSafe ? 'Formula Baik' : 'Perlu Perhatian'}
                        </Badge>
                        {selectedIngredientScan.brand && (
                          <span className="cluv-chip is-sm">
                            <FlaskConical size={12} /> {selectedIngredientScan.brand.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
                        {isSafe ? (
                          <ShieldCheck size={14} className="cluv-text-teal" />
                        ) : (
                          <ShieldAlert size={14} className="cluv-text-gold" />
                        )}
                        <span>
                          {isSafe
                            ? 'Formula kompatibel & minim resiko iritasi'
                            : 'Mengandung bahan yang memerlukan perhatian'}
                        </span>
                      </div>

                      <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1">
                        {selectedIngRaw?.summary || 'Analisis komposisi bahan aktif, kestabilan formula, dan kompatibilitas kulit.'}
                      </p>
                    </div>
                  </div>

                  {/* Hero Actives */}
                  {heroIngredients.length > 0 && (
                    <div className="cluv-flex-col cluv-gap-3 cluv-pt-3 cluv-border-t">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div className="cluv-card-icon-wrap is-sm is-teal">
                          <Sparkles size={14} />
                        </div>
                        <h3 className="cluv-title-card cluv-m-0">
                          Hero Actives &amp; Bahan Kunci
                        </h3>
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

                  {/* Danger Layering Combos */}
                  {dangerCombos.length > 0 && (
                    <div className="cluv-flex-col cluv-gap-3 cluv-pt-3 cluv-border-t">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div className="cluv-card-icon-wrap is-sm is-rose">
                          <AlertTriangle size={14} />
                        </div>
                        <h3 className="cluv-title-card cluv-m-0 cluv-text-danger">
                          Peringatan Kombinasi Pemakaian (Layering)
                        </h3>
                      </div>

                      <div className="cluv-flex-col cluv-gap-2">
                        {dangerCombos.map((dc: any, idx: number) => (
                          <div key={idx} className="cluv-card cluv-p-3 cluv-border-rose cluv-bg-surface-soft">
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

                  {/* Personal Contraindications */}
                  {personalNotes.length > 0 && (
                    <div className="cluv-flex-col cluv-gap-3 cluv-pt-3 cluv-border-t">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div className="cluv-card-icon-wrap is-sm is-gold">
                          <Tag size={14} />
                        </div>
                        <h3 className="cluv-title-card cluv-m-0">
                          Catatan Khusus untuk Kondisi Kulitmu
                        </h3>
                      </div>

                      <div className="cluv-flex-col cluv-gap-2">
                        {personalNotes.map((pc: any, idx: number) => (
                          <div key={idx} className="cluv-card cluv-p-3 cluv-border-gold cluv-bg-surface-soft">
                            <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2 cluv-mb-1">
                              <span className="cluv-caption cluv-font-bold cluv-text-dark">
                                {pc.ingredient}
                              </span>
                              <span className="cluv-chip is-sm">
                                Untuk: {pc.user_condition}
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

                  {/* Full Ingredients Breakdown */}
                  {ingBreakdown.length > 0 && (
                    <div className="cluv-flex-col cluv-gap-3 cluv-pt-3 cluv-border-t">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div className="cluv-card-icon-wrap is-sm is-blue">
                          <Layers size={14} />
                        </div>
                        <h3 className="cluv-title-card cluv-m-0">
                          Komposisi Lengkap ({ingBreakdown.length} Bahan)
                        </h3>
                      </div>

                      <div className="cluv-card cluv-p-3 cluv-flex-col cluv-gap-2 cluv-max-h-64 cluv-overflow-y-auto cluv-bg-surface-soft">
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
              </div>
            ) : (
              <div className="cluv-card cluv-p-8 cluv-text-center cluv-text-muted cluv-body">
                Pilih salah satu produk di sebelah kiri untuk melihat rincian evaluasi formula.
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
