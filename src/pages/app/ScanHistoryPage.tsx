import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  ScanFace,
  ChevronRight,
  X,
  Award,
  RefreshCw,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Target,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Layers,
  Tag,
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
            skin_status_title: raw.skin_status_title || 'Diagnosis Kondisi Kulit Terpantau',
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
                        <h4 className="scan-title">{scan.skin_status_title || 'Diagnosis Kondisi Kulit'}</h4>
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

      {/* STYLES */}
      <style>{`
        .skincluv-scan-history-page {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px 16px 60px;
          font-family: var(--font-body, 'Quicksand', sans-serif);
          box-sizing: border-box;
        }

        .page-header-box {
          margin-bottom: 24px;
        }

        .back-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--skincluv-teal, #0f6784);
          text-decoration: none;
          margin-bottom: 12px;
          transition: opacity 0.2s;
        }

        .back-link-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        /* TAB SWITCHER */
        .history-tab-switcher {
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          width: fit-content;
        }

        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: #ffffff;
          color: var(--skincluv-teal, #0f6784);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        /* STATS GRID */
        .history-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        @media (max-width: 768px) {
          .history-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-bento-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bg-sky-light { background: #e0f2fe; }
        .text-sky-dark { color: #0369a1; }
        .bg-emerald-light { background: #dcfce7; }
        .text-emerald-dark { color: #15803d; }
        .bg-indigo-light { background: #e0e7ff; }
        .text-indigo-dark { color: #4338ca; }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 1.375rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .stat-subtext {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
        }

        /* TIMELINE & CARDS */
        .loading-state {
          padding: 48px;
          text-align: center;
          color: #64748b;
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .history-timeline-section {
          margin-top: 16px;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px 0;
        }

        .scan-cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .scan-history-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 16px;
        }

        .scan-history-card:hover {
          transform: translateY(-2px);
          border-color: var(--skincluv-teal, #0f6784);
          box-shadow: 0 8px 24px -6px rgba(15, 103, 132, 0.15);
        }

        .scan-card-left {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
          flex: 1;
        }

        .score-badge-circle {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 800;
        }

        .score-badge-circle.optimal {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .score-badge-circle.caution {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .score-badge-circle.warning {
          background: #fff1f2;
          color: #e11d48;
          border: 1px solid #fecdd3;
        }

        .score-num {
          font-size: 1.125rem;
          line-height: 1;
        }

        .score-unit {
          font-size: 0.625rem;
          text-transform: uppercase;
        }

        .scan-info {
          min-width: 0;
          flex: 1;
        }

        .scan-date-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .latest-pill {
          background: #e0f2fe;
          color: #0284c7;
          font-size: 0.625rem;
          padding: 2px 6px;
          border-radius: 9999px;
          font-weight: 700;
        }

        .scan-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .scan-desc-preview {
          font-size: 0.8125rem;
          color: #475569;
          margin: 0 0 8px 0;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scan-tags-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .type-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          background: #f1f5f9;
          color: #334155;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .status-pill-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .status-pill-badge.safe {
          background: #dcfce7;
          color: #15803d;
        }

        .status-pill-badge.caution {
          background: #fef3c7;
          color: #b45309;
        }

        .concern-tag {
          font-size: 0.6875rem;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .scan-card-action {
          flex-shrink: 0;
        }

        .view-detail-hint {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--skincluv-teal, #0f6784);
        }

        /* EMPTY STATES */
        .empty-history-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 48px 24px;
          text-align: center;
        }

        .empty-icon {
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .empty-history-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .empty-history-card p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 20px 0;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-primary-gradient {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--skincluv-teal, #0f6784) 0%, var(--skincluv-teal-hover, #0b4f5c) 100%);
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.15s;
        }

        .btn-primary-gradient:hover {
          transform: translateY(-1px);
        }

        /* MODAL STYLES */
        .modal-backdrop-blur {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-card-dialog {
          background: #ffffff;
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .modal-header {
          flex-shrink: 0;
          padding: 18px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-date-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .btn-close-modal {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }

        .btn-close-modal:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .modal-body-scroll {
          flex: 1 1 auto;
          min-height: 0;
          padding: 20px 24px 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-body-scroll > * {
          flex-shrink: 0;
        }

        .modal-score-hero {
          flex-shrink: 0;
          min-height: fit-content;
          background: linear-gradient(135deg, var(--skincluv-teal, #0f6784) 0%, var(--skincluv-teal-hover, #0b4f5c) 100%);
          border-radius: 18px;
          padding: 24px 26px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 103, 132, 0.2);
          box-sizing: border-box;
          width: 100%;
        }

        .hero-glow-accent {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%);
          pointer-events: none;
        }

        .dots-bg-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          pointer-events: none;
        }

        .score-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .score-meta-info {
          flex: 1;
          min-width: 0;
        }

        .score-ring-avatar {
          min-width: 92px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .score-ring-avatar.score-optimal {
          border-color: rgba(52, 211, 153, 0.6);
          background: radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%);
        }

        .score-ring-avatar.score-caution {
          border-color: rgba(251, 191, 36, 0.6);
          background: radial-gradient(circle, rgba(251, 191, 36, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%);
        }

        .score-ring-avatar.score-warning {
          border-color: rgba(248, 113, 113, 0.6);
          background: radial-gradient(circle, rgba(248, 113, 113, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%);
        }

        .sr-number-row {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 2px;
          line-height: 1;
        }

        .sr-val {
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #ffffff;
        }

        .sr-scale {
          font-size: 0.75rem;
          opacity: 0.8;
          line-height: 1;
          color: #e0f2fe;
          margin-left: 2px;
        }

        .sr-unit {
          font-size: 0.625rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.04em;
          opacity: 0.95;
          margin-top: 5px;
          line-height: 1.2;
          text-align: center;
          white-space: nowrap;
          color: #ffffff;
        }

        .hero-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .hero-skin-type-badge, .hero-confidence-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6875rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .hero-notes-text {
          font-size: 0.8125rem;
          line-height: 1.5;
          margin: 0;
          color: #e0f2fe;
        }

        .modal-section-title {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-section-title.text-red { color: #dc2626; }
        .modal-section-title.text-amber { color: #d97706; }

        /* HERO ACTIVES CHIPS IN MODAL */
        .hero-actives-chips-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        @media (max-width: 600px) {
          .hero-actives-chips-grid {
            grid-template-columns: 1fr;
          }
        }

        .hero-active-chip-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hac-name {
          font-size: 0.8125rem;
          font-weight: 800;
          color: #0f172a;
        }

        .hac-function {
          font-size: 0.6875rem;
          color: #64748b;
        }

        /* DANGER COMBOS IN MODAL */
        .danger-combos-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .danger-combo-history-card {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .dc-pair-title {
          font-size: 0.8125rem;
          font-weight: 800;
          color: #be123c;
          margin-bottom: 2px;
        }

        .dc-warning-text {
          font-size: 0.75rem;
          color: #9f1239;
          margin: 0;
          line-height: 1.4;
        }

        /* PERSONAL CONTRAINDICATIONS */
        .personal-contraindications-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .personal-contra-history-card {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .pc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .pc-ing-name {
          font-size: 0.8125rem;
          font-weight: 800;
          color: #b45309;
        }

        .pc-condition-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #d97706;
          background: #fef3c7;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .pc-warning-text {
          font-size: 0.75rem;
          color: #92400e;
          margin: 0;
          line-height: 1.4;
        }

        /* INGREDIENTS BREAKDOWN MINI LIST */
        .ingredients-breakdown-mini-list {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          max-height: 220px;
          overflow-y: auto;
        }

        .ing-mini-row {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          gap: 10px;
          font-size: 0.75rem;
        }

        .ing-mini-row:last-child {
          border-bottom: none;
        }

        .ing-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          flex-shrink: 0;
        }

        .ing-badge-dot.safe, .ing-badge-dot.aman { background: #22c55e; }
        .ing-badge-dot.caution, .ing-badge-dot.perhatian { background: #f59e0b; }
        .ing-badge-dot.avoid, .ing-badge-dot.hindari { background: #ef4444; }

        .ing-mini-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .ing-mini-name {
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ing-mini-fn {
          font-size: 0.6875rem;
          color: #64748b;
        }

        .ing-mini-badge {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .ing-mini-badge.safe, .ing-mini-badge.aman {
          background: #dcfce7;
          color: #15803d;
        }

        .ing-mini-badge.caution, .ing-mini-badge.perhatian {
          background: #fef3c7;
          color: #b45309;
        }

        .ing-mini-badge.avoid, .ing-mini-badge.hindari {
          background: #fee2e2;
          color: #b91c1c;
        }

        /* AREAS STACK IN FACE MODAL */
        .modal-areas-section {
          margin-top: 8px;
        }

        .modal-areas-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .area-detail-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .area-name {
          font-weight: 700;
        }

        .area-badges-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .area-finding-box, .area-analogy-box, .area-action-box {
          margin-top: 6px;
        }

        .area-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .area-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          font-size: 0.8125rem;
          color: #0f172a;
        }

        .area-icon-accent {
          color: var(--skincluv-teal, #0f6784);
        }

        .area-severity-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .area-severity-badge.ringan {
          background: #dcfce7;
          color: #15803d;
        }

        .area-severity-badge.sedang {
          background: #fef3c7;
          color: #b45309;
        }

        .area-score-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748b;
          margin-left: 6px;
        }

        .af-label, .aa-label, .ac-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #475569;
          display: block;
        }

        .af-text, .aa-text, .ac-text {
          font-size: 0.75rem;
          color: #1e293b;
          margin: 2px 0 6px 0;
          line-height: 1.4;
        }

        /* TIPS GRID */
        .modal-tips-section {
          margin-top: 8px;
        }

        .modal-tips-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 600px) {
          .modal-tips-grid {
            grid-template-columns: 1fr;
          }
          .modal-card-dialog {
            margin: 8px;
            max-height: 94vh;
          }
          .modal-body-scroll {
            padding: 16px 16px 24px;
            gap: 16px;
          }
          .modal-score-hero {
            padding: 16px;
          }
          .score-hero-content {
            gap: 14px;
          }
          .score-ring-avatar {
            min-width: 82px;
            padding: 10px 10px;
          }
        }

        .tip-box {
          border-radius: 12px;
          padding: 12px;
        }

        .tip-avoid { background: #fff1f2; border: 1px solid #fecdd3; }
        .tip-reduce { background: #fffbeb; border: 1px solid #fde68a; }
        .tip-do { background: #f0fdf4; border: 1px solid #bbf7d0; }

        .tb-title {
          font-size: 0.75rem;
          font-weight: 800;
          display: block;
          margin-bottom: 6px;
        }

        .tb-list {
          margin: 0;
          padding-left: 16px;
          font-size: 0.6875rem;
          color: #334155;
          line-height: 1.4;
        }

        .modal-footer-action {
          margin-top: 10px;
        }

        .btn-consult-skinsistant-modal {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--skincluv-teal, #0f6784) 0%, var(--skincluv-teal-hover, #0b4f5c) 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .btn-consult-skinsistant-modal:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
