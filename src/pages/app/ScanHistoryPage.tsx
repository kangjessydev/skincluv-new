import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FaceScan, IngredientScan } from '@/types/database'
import FaceScanDetailModal from '@/components/scans/FaceScanDetailModal'
import IngredientScanDetailModal from '@/components/scans/IngredientScanDetailModal'

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

  // Lock body scroll on modal active
  useEffect(() => {
    if (selectedScan || selectedIngredientScan) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedScan(null)
          setSelectedIngredientScan(null)
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [selectedScan, selectedIngredientScan])

  // Face Scan Statistics
  const totalFaceScans = scans.length
  const avgFaceScore = totalFaceScans > 0
    ? Math.round(scans.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalFaceScans)
    : 0
  const latestFaceScore = scans[0]?.overall_score || 0
  const previousFaceScore = scans[1]?.overall_score || latestFaceScore
  const faceScoreDiff = latestFaceScore - previousFaceScore

  // Ingredient Scan Statistics
  const totalIngScans = ingredientScans.length
  const safeProductsCount = ingredientScans.filter((i) => i.is_safe).length
  const avgSafetyScore = totalIngScans > 0
    ? Math.round(ingredientScans.reduce((acc, s) => acc + (s.safety_score || 0), 0) / totalIngScans)
    : 0


  return (
    <div className="cluv-page">
      {/* Header Bar */}
      <div className="cluv-mb-6">
        <Link to="/" className="cluv-back-link cluv-mb-3">
          <ArrowLeft size={16} />
          <span>Kembali ke Dashboard</span>
        </Link>
        <h1 className="cluv-title-page">Skin Journey &amp; Riwayat Analisis</h1>
        <p className="cluv-caption cluv-text-muted">
          Pantau perkembangan kesehatan kulit dan riwayat verifikasi formula skincare kamu dalam satu tempat.
        </p>

        {/* Tab Switcher */}
        <div className="cluv-tabs cluv-mt-5">
          <button
            type="button"
            className={`cluv-tab-btn ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => setActiveTab('face')}
          >
            <ScanFace size={16} />
            <span>Analisis Wajah ({scans.length})</span>
          </button>
          <button
            type="button"
            className={`cluv-tab-btn ${activeTab === 'ingredient' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredient')}
          >
            <FlaskConical size={16} />
            <span>Analisis Formula Produk ({ingredientScans.length})</span>
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Bento Grid */}
      <div className="cluv-grid cols-3 cluv-gap-4 cluv-mb-6">
        {activeTab === 'face' ? (
          <>
            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-teal">
                <ScanFace size={22} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Total Sesi Scan Wajah</span>
                <h3 className="cluv-title-card cluv-m-0">{totalFaceScans} Kali</h3>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-gold">
                <Award size={22} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Rata-rata Skor Kulit</span>
                <h3 className="cluv-title-card cluv-m-0">{avgFaceScore}/100</h3>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-blue">
                <TrendingUp size={22} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Tren Sesi Terakhir</span>
                <h3 className="cluv-title-card cluv-m-0">
                  {faceScoreDiff >= 0 ? `+${faceScoreDiff}` : faceScoreDiff} Poin
                  <span className="cluv-caption cluv-font-normal cluv-text-muted"> {faceScoreDiff >= 0 ? 'Meningkat' : 'Perlu Perhatian'}</span>
                </h3>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-teal">
                <FlaskConical size={22} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Total Produk Diperiksa</span>
                <h3 className="cluv-title-card cluv-m-0">{totalIngScans} Produk</h3>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-blue">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Rata-rata Safety Score</span>
                <h3 className="cluv-title-card cluv-m-0">{avgSafetyScore}/100</h3>
              </div>
            </div>

            <div className="cluv-card cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-md is-gold">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Formula Terverifikasi Aman</span>
                <h3 className="cluv-title-card cluv-m-0">
                  {safeProductsCount} Produk
                  <span className="cluv-caption cluv-font-normal cluv-text-muted"> Bebas Toksin</span>
                </h3>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
          <RefreshCw size={28} className="cluv-text-teal animate-spin cluv-mx-auto cluv-mb-3" />
          <p className="cluv-body cluv-text-muted cluv-m-0">Memuat rekam jejak riwayat...</p>
        </div>
      ) : activeTab === 'face' ? (
        /* TAB 1: FACE SCANS LIST */
        scans.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
            <div className="cluv-card-icon-wrap is-xl cluv-mx-auto cluv-mb-4 is-teal">
              <ScanFace size={36} />
            </div>
            <h3 className="cluv-title-card cluv-mb-2">Belum Ada Riwayat Scan Wajah</h3>
            <p className="cluv-body cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-mb-5">
              Kamu belum melakukan scan wajah. Mulai scan sekarang untuk melacak kesehatan kulitmu secara berkala!
            </p>
            <Link to="/face-scan" className="cluv-btn is-primary is-md">
              <Sparkles size={16} />
              <span>Mulai Face Scan Pertama</span>
            </Link>
          </div>
        ) : (
          <div className="cluv-mb-6">
            <h2 className="cluv-title-card cluv-mb-4">Timeline Analisis Wajah</h2>

            <div className="cluv-flex-col cluv-gap-3">
              {scans.map((scan, idx) => {
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

                return (
                  <div
                    key={scan.id}
                    className="cluv-scan-card"
                    onClick={() => setSelectedScan(scan)}
                  >
                    <div className="cluv-scan-card-main">
                      <div className={`cluv-score-badge ${isOptimal ? 'is-optimal' : isCaution ? 'is-caution' : 'is-alert'}`}>
                        <span className="cluv-score-badge-val">{score}</span>
                        <span className="cluv-score-badge-label">/100</span>
                      </div>

                      <div className="cluv-scan-card-body">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
                          <Calendar size={13} />
                          <span>{formattedDate} • {formattedTime}</span>
                          {idx === 0 && <span className="cluv-badge is-teal is-sm">Terbaru</span>}
                        </div>
                        <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">{scan.skin_status_title || 'Analisis Kondisi Kulit'}</h4>
                        <p className="cluv-micro cluv-text-muted cluv-truncate cluv-mt-1 cluv-mb-2">
                          {scan.analysis_notes || 'Hasil pemetaan kondisi kulit menyeluruh.'}
                        </p>

                        <div className="cluv-chip-group">
                          <span className="cluv-chip is-sm">Tipe: {scan.skin_type?.toUpperCase()}</span>
                          {Array.isArray(scan.skin_concerns) && scan.skin_concerns.slice(0, 3).map((c, i) => (
                            <span key={i} className="cluv-chip is-sm">#{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="cluv-scan-card-action">
                      <span>Buka Rangkuman Analisis</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      ) : (
        /* TAB 2: INGREDIENT SCANS LIST */
        ingredientScans.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
            <div className="cluv-card-icon-wrap is-xl cluv-mx-auto cluv-mb-4 is-teal">
              <FlaskConical size={36} />
            </div>
            <h3 className="cluv-title-card cluv-mb-2">Belum Ada Riwayat Scan Produk</h3>
            <p className="cluv-body cluv-text-muted cluv-max-w-md cluv-mx-auto cluv-mb-5">
              Periksa keamanan komposisi pembersih, toner, atau serum harianmu untuk memastikan bebas bahan berbahaya.
            </p>
            <Link to="/ingredient-scan" className="cluv-btn is-primary is-md">
              <FlaskConical size={16} />
              <span>Scan Komposisi Produk Pertama</span>
            </Link>
          </div>
        ) : (
          <div className="cluv-mb-6">
            <h2 className="cluv-title-card cluv-mb-4">Daftar Produk yang Pernah Dianalisis</h2>

            <div className="cluv-flex-col cluv-gap-3">
              {ingredientScans.map((ing, idx) => {
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
                      <div className={`cluv-score-badge ${isSafe ? 'is-optimal' : 'is-alert'}`}>
                        <span className="cluv-score-badge-val">{score}</span>
                        <span className="cluv-score-badge-label">Safety</span>
                      </div>

                      <div className="cluv-scan-card-body">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-caption cluv-text-muted cluv-mb-1">
                          <Calendar size={13} />
                          <span>{formattedDate}</span>
                          {idx === 0 && <span className="cluv-badge is-teal is-sm">Terbaru</span>}
                        </div>
                        <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">{ing.product_name}</h4>
                        <p className="cluv-micro cluv-text-muted cluv-truncate cluv-mt-1 cluv-mb-2">
                          {ing.brand ? `Brand: ${ing.brand} • ` : ''}
                          {isSafe ? 'Formula terverifikasi aman & minim resiko iritasi.' : 'Formula memiliki bahan yang perlu diperhatikan.'}
                        </p>

                        <div className="cluv-chip-group">
                          <span className={`cluv-badge is-sm ${isSafe ? 'is-teal' : 'is-rose'}`}>
                            {isSafe ? 'Formula Sangat Baik' : 'Perlu Perhatian'}
                          </span>
                          {Array.isArray(ing.key_ingredients) && ing.key_ingredients.slice(0, 3).map((k, i) => (
                            <span key={i} className="cluv-chip is-sm">
                              {typeof k === 'string' ? k : (k as any)?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="cluv-scan-card-action">
                      <span>Buka Evaluasi Formula</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* MODAL 1: FACE SCAN CLINICAL DETAIL */}
      <FaceScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
        onConsult={() => {
          setSelectedScan(null)
          navigate('/chatbot')
        }}
      />

      {/* MODAL 2: INGREDIENT SCAN DETAIL */}
      <IngredientScanDetailModal
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
