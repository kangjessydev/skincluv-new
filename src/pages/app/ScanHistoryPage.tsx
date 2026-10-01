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
    <div className="skincluv-scan-history-page">
      {/* Header Bar */}
      <div className="page-header-box">
        <Link to="/" className="back-link-btn">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
        <h1 className="page-title">Skin Journey & Riwayat Analisis</h1>
        <p className="page-subtitle">
          Pantau perkembangan kesehatan kulit dan riwayat verifikasi formula skincare kamu dalam satu tempat.
        </p>

        {/* Tab Switcher */}
        <div className="history-tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => setActiveTab('face')}
          >
            <ScanFace size={16} />
            <span>Analisis Wajah ({scans.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'ingredient' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredient')}
          >
            <FlaskConical size={16} />
            <span>Analisis Formula Produk ({ingredientScans.length})</span>
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Bento Grid */}
      <div className="history-stats-grid">
        {activeTab === 'face' ? (
          <>
            <div className="stat-bento-card glass-card">
              <div className="stat-icon-wrapper bg-sky-light">
                <ScanFace size={22} className="text-sky-dark" />
              </div>
              <div>
                <span className="stat-label">Total Sesi Scan Wajah</span>
                <h3 className="stat-value">{totalFaceScans} Kali</h3>
              </div>
            </div>

            <div className="stat-bento-card glass-card">
              <div className="stat-icon-wrapper bg-emerald-light">
                <Award size={22} className="text-emerald-dark" />
              </div>
              <div>
                <span className="stat-label">Rata-rata Skor Kulit</span>
                <h3 className="stat-value">{avgFaceScore}/100</h3>
              </div>
            </div>

            <div className="stat-bento-card glass-card">
              <div className="stat-icon-wrapper bg-indigo-light">
                <TrendingUp size={22} className="text-indigo-dark" />
              </div>
              <div>
                <span className="stat-label">Tren Sesi Terakhir</span>
                <h3 className="stat-value">
                  {faceScoreDiff >= 0 ? `+${faceScoreDiff}` : faceScoreDiff} Poin
                  <span className="stat-subtext"> {faceScoreDiff >= 0 ? 'Meningkat' : 'Perlu Perhatian'}</span>
                </h3>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-bento-card glass-card">
              <div className="stat-icon-wrapper bg-emerald-light">
                <FlaskConical size={22} className="text-emerald-dark" />
              </div>
              <div>
                <span className="stat-label">Total Produk Diperiksa</span>
                <h3 className="stat-value">{totalIngScans} Produk</h3>
              </div>
            </div>

            <div className="stat-bento-card glass-card">
              <div className="stat-icon-wrapper bg-sky-light">
                <ShieldCheck size={22} className="text-sky-dark" />
              </div>
              <div>
                <span className="stat-label">Rata-rata Safety Score</span>
                <h3 className="stat-value">{avgSafetyScore}/100</h3>
              </div>
            </div>

            <div className="stat-bento-card glass-card">
              <div className="stat-icon-wrapper bg-indigo-light">
                <CheckCircle2 size={22} className="text-indigo-dark" />
              </div>
              <div>
                <span className="stat-label">Formula Terverifikasi Aman</span>
                <h3 className="stat-value">
                  {safeProductsCount} Produk
                  <span className="stat-subtext"> Bebas Toksin</span>
                </h3>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-state glass-card">
          <RefreshCw size={28} className="animate-spin text-brand" />
          <p>Memuat rekam jejak riwayat...</p>
        </div>
      ) : activeTab === 'face' ? (
        /* TAB 1: FACE SCANS LIST */
        scans.length === 0 ? (
          <div className="empty-history-card glass-card">
            <ScanFace size={54} className="empty-icon" />
            <h3>Belum Ada Riwayat Scan Wajah</h3>
            <p>Kamu belum melakukan scan wajah. Mulai scan sekarang untuk melacak kesehatan kulitmu secara berkala!</p>
            <Link to="/face-scan" className="btn-primary-gradient mt-md">
              <Sparkles size={16} /> Mulai Face Scan Pertama
            </Link>
          </div>
        ) : (
          <div className="history-timeline-section">
            <h2 className="section-title">Timeline Scan Wajah Klinis</h2>

            <div className="scan-cards-container">
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
                const isOptimal = (scan.overall_score || 0) >= 80
                const isCaution = (scan.overall_score || 0) >= 65 && (scan.overall_score || 0) < 80

                return (
                  <div
                    key={scan.id}
                    className="scan-history-card glass-card"
                    onClick={() => setSelectedScan(scan)}
                  >
                    <div className="scan-card-left">
                      <div className={`score-badge-circle ${isOptimal ? 'optimal' : isCaution ? 'caution' : 'warning'}`}>
                        <span className="score-num">{scan.overall_score}</span>
                        <span className="score-unit">/100</span>
                      </div>

                      <div className="scan-info">
                        <div className="scan-date-badge">
                          <Calendar size={13} /> {formattedDate} • {formattedTime} {idx === 0 && <span className="latest-pill">Terbaru</span>}
                        </div>
                        <h4 className="scan-title">{scan.skin_status_title || 'Analisis Kondisi Kulit'}</h4>
                        <p className="scan-desc-preview">{scan.analysis_notes || 'Hasil pemetaan kondisi kulit menyeluruh.'}</p>

                        <div className="scan-tags-row">
                          <span className="type-tag">Tipe: {scan.skin_type?.toUpperCase()}</span>
                          {Array.isArray(scan.skin_concerns) && scan.skin_concerns.slice(0, 3).map((c, i) => (
                            <span key={i} className="concern-tag">#{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="scan-card-action">
                      <span className="view-detail-hint">
                        Buka Laporan Medis <ChevronRight size={16} />
                      </span>
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
          <div className="empty-history-card glass-card">
            <FlaskConical size={54} className="empty-icon text-emerald-dark" />
            <h3>Belum Ada Riwayat Scan Produk</h3>
            <p>Periksa keamanan komposisi pembersih, toner, atau serum harianmu untuk memastikan bebas bahan berbahaya.</p>
            <Link to="/ingredient-scan" className="btn-primary-gradient mt-md">
              <FlaskConical size={16} /> Scan Komposisi Produk Pertama
            </Link>
          </div>
        ) : (
          <div className="history-timeline-section">
            <h2 className="section-title">Daftar Produk yang Pernah Dianalisis</h2>

            <div className="scan-cards-container">
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
                    className="scan-history-card glass-card"
                    onClick={() => setSelectedIngredientScan(ing)}
                  >
                    <div className="scan-card-left">
                      <div className={`score-badge-circle ${isSafe ? 'optimal' : 'warning'}`}>
                        <span className="score-num">{score}</span>
                        <span className="score-unit">Safety</span>
                      </div>

                      <div className="scan-info">
                        <div className="scan-date-badge">
                          <Calendar size={13} /> {formattedDate} {idx === 0 && <span className="latest-pill">Terbaru</span>}
                        </div>
                        <h4 className="scan-title">{ing.product_name}</h4>
                        <p className="scan-desc-preview">
                          {ing.brand ? `Brand: ${ing.brand} • ` : ''}
                          {isSafe ? 'Formula terverifikasi aman & minim resiko iritasi.' : 'Formula memiliki bahan yang perlu diperhatikan.'}
                        </p>

                        <div className="scan-tags-row">
                          <span className={`status-pill-badge ${isSafe ? 'safe' : 'caution'}`}>
                            {isSafe ? 'Formula Sangat Baik' : 'Perlu Perhatian'}
                          </span>
                          {Array.isArray(ing.key_ingredients) && ing.key_ingredients.slice(0, 3).map((k, i) => (
                            <span key={i} className="concern-tag">
                              {typeof k === 'string' ? k : (k as any)?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="scan-card-action">
                      <span className="view-detail-hint">
                        Buka Audit Formula <ChevronRight size={16} />
                      </span>
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
