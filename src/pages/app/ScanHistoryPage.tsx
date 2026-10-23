// src/pages/app/ScanHistoryPage.tsx
// Zero-Emoji, Defensible Copywriting, 100% Pure Cluv Framework
// Architecture: Unified Bento Cards with In-Place Expansion (Canonical Cluv Standard)
// Compliance: Invariant 13 (Defensible claims), Invariant 14 (MCID Guardrail), Invariant 19 (Non-therapeutic)

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  ScanFace,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  CheckCircle2,
  ShieldCheck,
  Search,
  X,
  Filter,
  Target,
  Layers,
  AlertTriangle,
  Tag,
  MessageSquare,
  RefreshCw,
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
  const [expandedFaceIds, setExpandedFaceIds] = useState<string[]>([])

  // Ingredient Scans State
  const [ingredientScans, setIngredientScans] = useState<IngredientScan[]>([])
  const [expandedIngIds, setExpandedIngIds] = useState<string[]>([])

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
      // 1. Fetch Face Scans
      const { data: faceData, error: faceErr } = await supabase
        .from('face_scans')
        .select('*')
        .eq('user_id', targetUid)
        .order('created_at', { ascending: false })

      if (!faceErr && faceData && faceData.length > 0) {
        setScans(faceData as FaceScan[])
        // Auto-expand latest scan
        setExpandedFaceIds([faceData[0].id])
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
          setExpandedFaceIds([fallbackScan.id])
        } else {
          setScans([])
          setExpandedFaceIds([])
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
        setExpandedIngIds([ingData[0].id])
      } else {
        setIngredientScans([])
        setExpandedIngIds([])
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
  const optimalFaceCount = scans.filter((s) => (s.overall_score || 0) >= 80).length
  const attentionFaceCount = scans.filter((s) => (s.overall_score || 0) < 80).length

  // Ingredient Scan Statistics
  const totalIngScans = ingredientScans.length
  const safeProductsCount = ingredientScans.filter((i) => i.is_safe && (i.safety_score ?? 80) >= 65).length
  const attentionIngCount = totalIngScans - safeProductsCount

  // Toggle Face Expansion
  const toggleFaceExpand = (id: string) => {
    setExpandedFaceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Toggle Ingredient Expansion
  const toggleIngExpand = (id: string) => {
    setExpandedIngIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

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
      {/* ── 1. NAVIGASI KEMBALI KANONIKAL ── */}
      <button
        type="button"
        className="cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Dashboard</span>
      </button>

      {/* ── 2. HEADER HALAMAN KANONIKAL (100% Selaras dengan AppFaq & AppPricing) ── */}
      <header className="cluv-mb-5">
        <div className="cluv-badge is-teal is-sm cluv-mb-2">
          <ScanFace size={13} />
          <span>SKIN JOURNEY</span>
        </div>
        <h1 className="cluv-title-section cluv-m-0">Skin Journey &amp; Riwayat Analisis</h1>
        <p className="cluv-subtitle cluv-mt-1">
          Pantau perkembangan kesehatan kulit dan riwayat analisis formula skincare secara berkala.
        </p>
      </header>

      {/* ── 3. TAB NAVIGASI MANDIRI ── */}
      <div className="cluv-tabs cluv-mb-5">
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

      {/* ── 4. SEARCH & FILTER BAR KANONIKAL (Pola Baku AppFaqPage) ── */}
      <div className="cluv-card cluv-mb-6">
        <div className="cluv-field cluv-mb-3">
          <div className="cluv-input-wrap has-leading-icon has-trailing-icon">
            <Search size={18} className="cluv-input-icon is-leading" />
            <input
              type="text"
              className="cluv-input"
              placeholder={
                activeTab === 'face'
                  ? 'Cari kondisi kulit, keluhan, atau tanggal...'
                  : 'Cari nama produk atau brand skincare...'
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
        </div>

        {/* Quick Filter Chips */}
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
          <span className="cluv-micro cluv-font-bold cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
            <Filter size={13} />
            Filter Status:
          </span>
          {activeTab === 'face' ? (
            <>
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
                Kondisi Optimal 80+ ({optimalFaceCount})
              </button>
              <button
                type="button"
                className={`cluv-chip is-sm ${faceFilter === 'attention' ? 'is-active' : ''}`}
                onClick={() => setFaceFilter('attention')}
              >
                Perlu Perhatian ({attentionFaceCount})
              </button>
            </>
          ) : (
            <>
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
                Perlu Perhatian ({attentionIngCount})
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 5. UNIFIED BENTO CARDS GRID (2 Kolom Desktop, In-Place Expansion) ── */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <RefreshCw size={28} className="cluv-text-teal animate-spin cluv-mx-auto cluv-mb-3" />
          <p className="cluv-body cluv-text-muted cluv-m-0">
            Memuat rekam jejak riwayat analisis...
          </p>
        </div>
      ) : activeTab === 'face' ? (
        /* TAB 1: FACE SCANS BENTO GRID */
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
              const isExpanded = expandedFaceIds.includes(scan.id)
              const score = scan.overall_score || 0
              const isOptimal = score >= 80
              const isCaution = score >= 65 && score < 80

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

              const areaList =
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

              return (
                <div
                  key={scan.id}
                  className="cluv-card is-interactive cluv-flex-col cluv-gap-3"
                  onClick={() => toggleFaceExpand(scan.id)}
                >
                  {/* Card Header */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted">
                      <Calendar size={13} />
                      <span>{formattedDate} • {formattedTime}</span>
                      {idx === 0 && <Badge variant="teal" size="sm">Terbaru</Badge>}
                    </div>

                    <Badge variant={isOptimal ? 'teal' : isCaution ? 'gold' : 'rose'} size="sm">
                      {isOptimal ? 'Kondisi Optimal' : isCaution ? 'Kondisi Baik' : 'Perlu Perhatian'}
                    </Badge>
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
                      <h3 className="cluv-title-card is-sm cluv-m-0">
                        {scan.skin_status_title || 'Analisis Kondisi Kulit'}
                      </h3>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-line-clamp-2">
                        {scan.analysis_notes || 'Hasil pemetaan kondisi kulit mandiri.'}
                      </p>

                      <div className="cluv-chip-group cluv-mt-1">
                        <span className="cluv-chip is-sm">
                          Tipe: {String(scan.skin_type || 'Normal').toUpperCase()}
                        </span>
                        {Array.isArray(scan.skin_concerns) &&
                          scan.skin_concerns.slice(0, 2).map((concern, cIdx) => (
                            <span key={cIdx} className="cluv-chip is-sm">
                              {concern}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* In-Place Expanded Detail View */}
                  {isExpanded && (
                    <div
                      className="cluv-flex-col cluv-gap-4 cluv-pt-4 cluv-border-t cluv-mt-1 cluv-animate-fade"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Observasi Note */}
                      <div className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-md cluv-border">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-caption cluv-text-muted cluv-mb-1">
                          <ShieldCheck size={14} className="cluv-text-teal" />
                          <span className="cluv-font-bold cluv-text-dark">Observasi Visual Terarsip (Non-Klinis):</span>
                        </div>
                        <p className="cluv-body cluv-text-muted cluv-m-0">
                          {scan.analysis_notes}
                        </p>
                      </div>

                      {/* Granular Area Evaluations */}
                      {areaList.length > 0 && (
                        <div className="cluv-flex-col cluv-gap-2">
                          <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                            <Layers size={14} className="cluv-text-teal" />
                            <span className="cluv-caption cluv-font-bold cluv-text-dark">
                              Evaluasi Area Wajah ({areaList.length} Area)
                            </span>
                          </div>

                          <div className="cluv-flex-col cluv-gap-2">
                            {areaList.map((area: any, aIdx: number) => {
                              const aScore = area.score || 80
                              const isAreaOpt = aScore >= 80

                              return (
                                <div key={aIdx} className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-sm cluv-border">
                                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2 cluv-mb-1">
                                    <div className="cluv-flex-row cluv-items-center cluv-gap-1">
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
                                        {aScore}/100
                                      </span>
                                    </div>
                                  </div>
                                  {area.finding && (
                                    <p className="cluv-caption cluv-text-muted cluv-m-0">
                                      {area.finding}
                                    </p>
                                  )}
                                  {area.action_plan && (
                                    <p className="cluv-micro cluv-text-teal cluv-font-bold cluv-mt-1 cluv-mb-0">
                                      Rencana: {area.action_plan}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tips Personal */}
                      {(tipsAvoid.length > 0 || tipsReduce.length > 0 || tipsDo.length > 0) && (
                        <div className="cluv-flex-col cluv-gap-2">
                          <span className="cluv-caption cluv-font-bold cluv-text-dark">
                            Saran Rutinitas &amp; Kebiasaan:
                          </span>
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

                      {/* Action CTA */}
                      <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-pt-2 cluv-gap-3 cluv-flex-wrap">
                        <Button
                          variant="primary"
                          size="sm"
                          iconLeft={<MessageSquare size={14} />}
                          onClick={() => navigate('/chatbot')}
                        >
                          Konsultasikan ke Skinsistant
                        </Button>
                        <span className="cluv-micro cluv-text-muted">
                          Bukan pengganti diagnosis dokter kulit
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expansion Footer Toggle */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-pt-2 cluv-border-t cluv-mt-auto">
                    <span className="cluv-caption cluv-font-bold cluv-text-teal cluv-flex-row cluv-items-center cluv-gap-1">
                      {isExpanded ? (
                        <>
                          <span>Tutup Rincian Analisis</span>
                          <ChevronUp size={15} />
                        </>
                      ) : (
                        <>
                          <span>Buka Rincian Lengkap</span>
                          <ChevronDown size={15} />
                        </>
                      )}
                    </span>
                    <span className="cluv-micro cluv-text-muted">
                      {areaList.length > 0 ? `${areaList.length} Area Dianalisis` : 'Observasi AI'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* TAB 2: INGREDIENT SCANS BENTO GRID */
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
              const isExpanded = expandedIngIds.includes(ing.id)
              const score = ing.safety_score ?? 80
              const isSafe = ing.is_safe && score >= 65

              const dateObj = new Date(ing.created_at)
              const formattedDate = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              let ingRawResponse: Record<string, any> = {}
              try {
                if (typeof ing.raw_ai_response === 'string') {
                  ingRawResponse = JSON.parse(ing.raw_ai_response)
                } else if (ing.raw_ai_response && typeof ing.raw_ai_response === 'object') {
                  ingRawResponse = ing.raw_ai_response as Record<string, any>
                }
              } catch {
                ingRawResponse = {}
              }

              const ingBreakdown = Array.isArray(ing.ingredients_breakdown)
                ? (ing.ingredients_breakdown as any[])
                : Array.isArray(ingRawResponse?.ingredients_breakdown)
                ? ingRawResponse.ingredients_breakdown
                : []

              const heroIngredients = Array.isArray(ingRawResponse?.hero_actives)
                ? ingRawResponse.hero_actives
                : Array.isArray(ing.key_ingredients)
                ? ing.key_ingredients
                : []

              const dangerCombos = Array.isArray(ingRawResponse?.layering_guide?.danger_combos)
                ? ingRawResponse.layering_guide.danger_combos
                : []

              return (
                <div
                  key={ing.id}
                  className="cluv-card is-interactive cluv-flex-col cluv-gap-3"
                  onClick={() => toggleIngExpand(ing.id)}
                >
                  {/* Card Header */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted">
                      <Calendar size={13} />
                      <span>{formattedDate}</span>
                      {idx === 0 && <Badge variant="teal" size="sm">Terbaru</Badge>}
                    </div>

                    <Badge variant={isSafe ? 'teal' : 'rose'} size="sm">
                      {isSafe ? 'Formula Baik' : 'Perlu Perhatian'}
                    </Badge>
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
                      <h3 className="cluv-title-card is-sm cluv-m-0">
                        {ing.product_name}
                      </h3>
                      <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-line-clamp-2">
                        {ing.brand ? `Brand: ${ing.brand} • ` : ''}
                        {isSafe
                          ? 'Formula kompatibel & minim resiko iritasi.'
                          : 'Formula memiliki bahan yang perlu diperhatikan.'}
                      </p>

                      <div className="cluv-chip-group cluv-mt-1">
                        {Array.isArray(ing.key_ingredients) &&
                          ing.key_ingredients.slice(0, 3).map((k, kIdx) => (
                            <span key={kIdx} className="cluv-chip is-sm">
                              {typeof k === 'string' ? k : (k as any)?.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* In-Place Expanded Detail View */}
                  {isExpanded && (
                    <div
                      className="cluv-flex-col cluv-gap-4 cluv-pt-4 cluv-border-t cluv-mt-1 cluv-animate-fade"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Summary */}
                      <div className="cluv-p-3 cluv-bg-surface-soft cluv-rounded-md cluv-border">
                        <span className="cluv-micro cluv-font-bold cluv-text-dark cluv-uppercase cluv-block cluv-mb-1">
                          Ringkasan Komposisi:
                        </span>
                        <p className="cluv-body cluv-text-muted cluv-m-0">
                          {ingRawResponse?.summary || 'Analisis komposisi bahan aktif dan keamanan formula skincare.'}
                        </p>
                      </div>

                      {/* Hero Actives */}
                      {heroIngredients.length > 0 && (
                        <div className="cluv-flex-col cluv-gap-2">
                          <span className="cluv-caption cluv-font-bold cluv-text-dark">
                            Hero Actives &amp; Bahan Kunci:
                          </span>
                          <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1">
                            {heroIngredients.map((item: any, hIdx: number) => {
                              const name = typeof item === 'string' ? item : item.name
                              const func = typeof item === 'object' ? item.function : null
                              return (
                                <span key={hIdx} className="cluv-chip is-active is-sm">
                                  {name} {func ? `(${func})` : ''}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Layering Combos Warning */}
                      {dangerCombos.length > 0 && (
                        <div className="cluv-flex-col cluv-gap-2">
                          <span className="cluv-caption cluv-font-bold cluv-text-danger cluv-flex-row cluv-items-center cluv-gap-1">
                            <AlertTriangle size={14} />
                            Peringatan Kombinasi (Layering):
                          </span>
                          {dangerCombos.map((dc: any, dIdx: number) => (
                            <div key={dIdx} className="cluv-p-2 cluv-border-rose cluv-rounded-sm cluv-bg-surface-soft">
                              <span className="cluv-micro cluv-font-bold cluv-text-danger cluv-block">
                                {Array.isArray(dc.pair) ? dc.pair.join(' + ') : 'Inkompatibilitas'}
                              </span>
                              <p className="cluv-caption cluv-text-muted cluv-m-0">
                                {dc.warning || dc.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ingredients Breakdown Mini */}
                      {ingBreakdown.length > 0 && (
                        <div className="cluv-flex-col cluv-gap-2">
                          <span className="cluv-caption cluv-font-bold cluv-text-dark">
                            Komposisi Lengkap ({ingBreakdown.length} Bahan):
                          </span>
                          <div className="cluv-card cluv-p-2 cluv-max-h-48 cluv-overflow-y-auto cluv-flex-col cluv-gap-1 cluv-bg-surface-soft">
                            {ingBreakdown.map((item: any, bIdx: number) => {
                              const badge = String(item.badge || 'safe').toLowerCase()
                              const isSafeItem = badge === 'safe' || badge === 'aman'
                              return (
                                <div key={bIdx} className="cluv-flex-row cluv-items-center cluv-justify-between cluv-py-1 cluv-border-b cluv-last-border-0">
                                  <span className="cluv-caption cluv-text-dark">{item.name}</span>
                                  <Badge variant={isSafeItem ? 'teal' : 'rose'} size="sm">
                                    {isSafeItem ? 'Baik' : 'Perhatian'}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action CTA */}
                      <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-pt-2 cluv-gap-3 cluv-flex-wrap">
                        <Button
                          variant="primary"
                          size="sm"
                          iconLeft={<MessageSquare size={14} />}
                          onClick={() => navigate('/chatbot')}
                        >
                          Tanya Produk ke AI
                        </Button>
                        <span className="cluv-micro cluv-text-muted">
                          Estimasi keamanan bahan publik (BPOM/FDA)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expansion Footer Toggle */}
                  <div className="cluv-flex-row cluv-items-center cluv-justify-between cluv-pt-2 cluv-border-t cluv-mt-auto">
                    <span className="cluv-caption cluv-font-bold cluv-text-teal cluv-flex-row cluv-items-center cluv-gap-1">
                      {isExpanded ? (
                        <>
                          <span>Tutup Evaluasi</span>
                          <ChevronUp size={15} />
                        </>
                      ) : (
                        <>
                          <span>Buka Evaluasi Formula</span>
                          <ChevronDown size={15} />
                        </>
                      )}
                    </span>
                    <span className="cluv-micro cluv-text-muted">
                      {ingBreakdown.length > 0 ? `${ingBreakdown.length} Bahan Terurai` : 'Analisis Skincare'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
