import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  ScanFace,
  ChevronRight,
  X,
  ExternalLink,
  ShoppingBag,
  Layers,
  Award,
  RefreshCw,
  FlaskConical,
  CheckCircle2,
  Target,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FaceScan } from '@/types/database'

export default function ScanHistoryPage() {
  const { session, user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [scans, setScans] = useState<FaceScan[]>([])
  const [selectedScan, setSelectedScan] = useState<FaceScan | null>(null)

  const fetchScans = async () => {
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
      // 1. Coba fetch dari tabel face_scans (riwayat multi-sesi)
      const { data, error } = await supabase
        .from('face_scans')
        .select('*')
        .eq('user_id', targetUid)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setScans(data as FaceScan[])
        return
      }

      // 2. Fallback: Jika tabel face_scans belum ada di DB remote atau masih kosong,
      // ambil dari profil aktif di tabel skin_profiles
      const { data: profileScan, error: profileErr } = await supabase
        .from('skin_profiles')
        .select('*')
        .eq('user_id', targetUid)
        .eq('is_active', true)
        .maybeSingle()

      if (!profileErr && profileScan && profileScan.raw_ai_response) {
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
    } catch (err) {
      console.warn('Fetch face scans error, trying fallback:', err)
      setScans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, user?.id, profile?.id])

  // Lock body scroll and close on Escape when modal is active
  useEffect(() => {
    if (selectedScan) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedScan(null)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [selectedScan])

  // Statistics calculation
  const totalScans = scans.length
  const avgScore = totalScans > 0
    ? Math.round(scans.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalScans)
    : 0

  const latestScore = scans[0]?.overall_score || 0
  const previousScore = scans[1]?.overall_score || latestScore
  const scoreDiff = latestScore - previousScore

  // Helper extraction for selectedScan (robust against stringified or object JSON)
  let rawResponse: Record<string, any> = {}
  try {
    if (typeof selectedScan?.raw_ai_response === 'string') {
      rawResponse = JSON.parse(selectedScan.raw_ai_response)
    } else if (selectedScan?.raw_ai_response && typeof selectedScan.raw_ai_response === 'object') {
      rawResponse = selectedScan.raw_ai_response as Record<string, any>
    }
  } catch {
    rawResponse = {}
  }

  let parsedAreas: any[] = []
  if (Array.isArray(selectedScan?.area_evaluations)) {
    parsedAreas = selectedScan.area_evaluations
  } else if (typeof selectedScan?.area_evaluations === 'string') {
    try {
      const p = JSON.parse(selectedScan.area_evaluations)
      if (Array.isArray(p)) parsedAreas = p
    } catch {}
  } else if (Array.isArray(rawResponse.area_evaluations)) {
    parsedAreas = rawResponse.area_evaluations
  }

  let parsedProducts: any[] = []
  if (Array.isArray(selectedScan?.product_recommendations)) {
    parsedProducts = selectedScan.product_recommendations
  } else if (typeof selectedScan?.product_recommendations === 'string') {
    try {
      const p = JSON.parse(selectedScan.product_recommendations)
      if (Array.isArray(p)) parsedProducts = p
    } catch {}
  } else if (Array.isArray(rawResponse.product_recommendations)) {
    parsedProducts = rawResponse.product_recommendations
  }

  const tipsAvoid = Array.isArray(rawResponse.tips_avoid) ? rawResponse.tips_avoid : []
  const tipsReduce = Array.isArray(rawResponse.tips_reduce) ? rawResponse.tips_reduce : []
  const tipsDo = Array.isArray(rawResponse.tips_do) ? rawResponse.tips_do : []

  const rawHeroList = (
    Array.isArray(rawResponse.recommended_ingredients) && rawResponse.recommended_ingredients.length > 0
      ? rawResponse.recommended_ingredients
      : parsedProducts
  )

  const heroIngredients = rawHeroList.map((item: any) => {
    const rawName = typeof item === 'string'
      ? item
      : (item?.name || item?.product_name || item?.ingredient || 'Bahan Aktif')
    const cleanName = String(rawName).replace(/^Kandungan yang cocok:\s*/i, '').trim()
    const purpose = typeof item === 'object' && item
      ? (item.purpose || item.why_recommended || item.reason || 'Membantu merawat dan menjaga stabilitas lapisan kulit.')
      : 'Membantu merawat dan menjaga stabilitas lapisan kulit.'
    const isEssential = typeof item === 'object' && item?.priority
      ? item.priority === 'essential'
      : (String(item?.category || '').includes('Essential') || String(item?.category || '').includes('Utama'))

    return {
      name: cleanName,
      purpose,
      priority: isEssential ? 'essential' : 'recommended',
    }
  })

  return (
    <div className="skincluv-scan-history-page">
      {/* Header Bar */}
      <div className="page-header-box">
        <Link to="/app/face-scan" className="back-link-btn">
          <ArrowLeft size={16} /> Kembali ke Scan Wajah
        </Link>
        <h1 className="page-title">Skin Journey & Riwayat Scan</h1>
        <p className="page-subtitle">
          Pantau perkembangan kesehatan kulit wajahmu dari waktu ke waktu berdasarkan hasil diagnosis klinis AI.
        </p>
      </div>

      {/* Overview Statistics Cards */}
      <div className="history-stats-grid">
        <div className="stat-bento-card glass-card">
          <div className="stat-icon-wrapper bg-sky-light">
            <ScanFace size={22} className="text-sky-dark" />
          </div>
          <div>
            <span className="stat-label">Total Sesi Scan</span>
            <h3 className="stat-value">{totalScans} Kali</h3>
          </div>
        </div>

        <div className="stat-bento-card glass-card">
          <div className="stat-icon-wrapper bg-emerald-light">
            <Award size={22} className="text-emerald-dark" />
          </div>
          <div>
            <span className="stat-label">Rata-rata Skor Kulit</span>
            <h3 className="stat-value">{avgScore}/100</h3>
          </div>
        </div>

        <div className="stat-bento-card glass-card">
          <div className="stat-icon-wrapper bg-indigo-light">
            <TrendingUp size={22} className="text-indigo-dark" />
          </div>
          <div>
            <span className="stat-label">Tren Sesi Terakhir</span>
            <h3 className="stat-value">
              {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} Poin
              <span className="stat-subtext"> {scoreDiff >= 0 ? 'Meningkat' : 'Perlu Perhatian'}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-state glass-card">
          <RefreshCw size={28} className="animate-spin text-brand" />
          <p>Memuat rekam jejak kulitmu...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="empty-history-card glass-card">
          <ScanFace size={54} className="empty-icon" />
          <h3>Belum Ada Riwayat Scan</h3>
          <p>Kamu belum melakukan scan wajah. Mulai scan sekarang untuk melacak kesehatan kulitmu!</p>
          <Link to="/app/face-scan" className="btn-primary-gradient mt-md">
            <Sparkles size={16} /> Mulai Scan Wajah Pertama
          </Link>
        </div>
      ) : (
        <div className="history-timeline-section">
          <h2 className="section-title">Timeline Riwayat Scan</h2>

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

                  <div className="scan-card-right">
                    <button className="btn-view-detail">
                      Detail <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Detail Hasil Scan Masa Lalu (Diselaraskan dengan Standar Baru FaceScanPage via Portal) */}
      {selectedScan && createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedScan(null)}>
          <div className="modal-content-box glass-card animate-modal-zoom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-date-tag">
                  <Calendar size={13} /> {new Date(selectedScan.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <h3 className="modal-title">{selectedScan.skin_status_title || 'Laporan Diagnosis Kulit'}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedScan(null)} aria-label="Tutup">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll">
              {/* Score Hero Banner */}
              <div className="modal-score-hero">
                <div className="hero-glow-accent" />
                <div className="dots-bg-pattern" />

                <div className="score-hero-content">
                  <div className={`score-ring-avatar ${
                    (selectedScan.overall_score || 80) >= 80 ? 'score-optimal' :
                    (selectedScan.overall_score || 80) >= 65 ? 'score-caution' : 'score-warning'
                  }`}>
                    <div className="sr-number-row">
                      <span className="sr-val">{selectedScan.overall_score || 80}</span>
                      <span className="sr-scale">/100</span>
                    </div>
                    <span className="sr-unit">Kesehatan Kulit</span>
                  </div>

                  <div className="score-meta-info">
                    <div className="hero-badges-row">
                      <span className="hero-skin-type-badge">
                        <Sparkles size={12} /> TIPE KULIT: {String(selectedScan.skin_type || 'NORMAL').toUpperCase()}
                      </span>
                      <span className="hero-confidence-badge">
                        <ShieldCheck size={12} /> REKAM MEDIS KLINIS
                      </span>
                    </div>
                    <p className="hero-notes-text">{selectedScan.analysis_notes}</p>
                  </div>
                </div>
              </div>

              {/* 3-Area Breakdown */}
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
                            <span className="af-label">🔬 Diagnosis Klinis:</span>
                            <p className="af-text">{area.finding}</p>
                          </div>
                        )}

                        {area.analogy && (
                          <div className="area-analogy-box">
                            <span className="aa-label">💡 Analogi Bestie:</span>
                            <p className="aa-text">{area.analogy}</p>
                          </div>
                        )}

                        {area.action_plan && (
                          <div className="area-action-box">
                            <span className="ac-label">🎯 Rencana Aksi Sederhana:</span>
                            <p className="ac-text">{area.action_plan}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Tips if available */}
              {(tipsAvoid.length > 0 || tipsReduce.length > 0 || tipsDo.length > 0) && (
                <div className="modal-tips-section">
                  <h4 className="modal-section-title">
                    <CheckCircle2 size={16} /> Tips Personal Untuk Kulitmu
                  </h4>
                  <div className="modal-tips-grid">
                    {tipsAvoid.length > 0 && (
                      <div className="tip-box tip-avoid">
                        <span className="tb-title text-red">✕ Hindari</span>
                        <ul className="tb-list">
                          {tipsAvoid.map((t: string, i: number) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                    {tipsReduce.length > 0 && (
                      <div className="tip-box tip-reduce">
                        <span className="tb-title text-amber">− Kurangi</span>
                        <ul className="tb-list">
                          {tipsReduce.map((t: string, i: number) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                    {tipsDo.length > 0 && (
                      <div className="tip-box tip-do">
                        <span className="tb-title text-green">✓ Rutin Lakukan</span>
                        <ul className="tb-list">
                          {tipsDo.map((t: string, i: number) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hero Actives Recommendations (Cleaned from Rp89.000 & Fake Commercial Products) */}
              {heroIngredients.length > 0 && (
                <div className="modal-products-section">
                  <h4 className="modal-section-title">
                    <FlaskConical size={16} /> Rekomendasi Bahan Aktif Klinis (Hero Actives)
                  </h4>
                  <div className="modal-actives-stack">
                    {heroIngredients.map((item, pIdx) => {
                      const isEssential = item.priority === 'essential'
                      const searchKeyword = `serum ${item.name}`
                      const askPrompt = `Halo SkinSistant! Dari riwayat scan wajah tanggal ${new Date(selectedScan.created_at).toLocaleDateString('id-ID')}, kulitku direkomendasikan bahan aktif "${item.name}". Bagaimana urutan dan cara pakainya yang aman?`

                      return (
                        <div key={pIdx} className="active-ing-card">
                          <div className="aic-header">
                            <div className="aic-badge-row">
                              <span className="aic-rank">#{pIdx + 1}</span>
                              <span className={`aic-priority-pill ${isEssential ? 'essential' : 'recommended'}`}>
                                {isEssential ? '✨ Target Utama (Essential)' : '🛡️ Penyeimbang (Recommended)'}
                              </span>
                            </div>
                            <h5 className="aic-name">{item.name}</h5>
                          </div>

                          <p className="aic-purpose">{item.purpose}</p>

                          <div className="aic-actions-row">
                            <a
                              href={`https://shopee.co.id/search?keyword=${encodeURIComponent(searchKeyword)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-shopee-search"
                            >
                              <ShoppingBag size={13} /> Cari Skincare di Marketplace ↗
                            </a>
                            <Link
                              to={`/chatbot?initialPrompt=${encodeURIComponent(askPrompt)}`}
                              className="btn-ask-skinsistant"
                            >
                              <MessageSquare size={13} /> Tanya Cara Pakai
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedScan(null)}>
                Tutup Laporan
              </button>
              <Link
                to="/chatbot?initialPrompt=Halo%20SkinSistant%2C%20saya%20ingin%20konsultasi%20mengenai%20riwayat%20kesehatan%20kulitku%20dari%20scan%20sebelumnya."
                className="btn-primary-consult"
              >
                <MessageSquare size={14} /> Konsultasikan ke SkinSistant AI
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Embedded CSS for Modern Bento Aesthetics */}
      <style>{`
        .skincluv-scan-history-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 1.5rem 1rem 4rem;
        }

        .page-header-box {
          margin-bottom: 2rem;
        }

        .back-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: #0284c7;
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 0.75rem;
          transition: transform 0.2s;
        }

        .back-link-btn:hover {
          transform: translateX(-3px);
        }

        .page-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.4rem;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
        }

        .history-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .stat-bento-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
        }

        .stat-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bg-sky-light { background: #e0f2fe; }
        .text-sky-dark { color: #0284c7; }
        .bg-emerald-light { background: #d1fae5; }
        .text-emerald-dark { color: #059669; }
        .bg-indigo-light { background: #e0e7ff; }
        .text-indigo-dark { color: #4f46e5; }

        .stat-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .stat-value {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 0.15rem;
        }

        .stat-subtext {
          font-size: 0.8rem;
          font-weight: 600;
          color: #059669;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .scan-cards-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .scan-history-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scan-history-card:hover {
          border-color: #38bdf8;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(2, 132, 199, 0.08);
        }

        .scan-card-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1;
        }

        .score-badge-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .score-badge-circle.optimal {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .score-badge-circle.caution {
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
        }

        .score-badge-circle.warning {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        .score-num {
          font-size: 1.25rem;
          font-weight: 800;
          line-height: 1;
        }

        .score-unit {
          font-size: 0.65rem;
          opacity: 0.85;
          font-weight: 600;
        }

        .scan-info {
          flex: 1;
        }

        .scan-date-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .latest-pill {
          background: #0284c7;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.45rem;
          border-radius: 9999px;
          margin-left: 0.35rem;
        }

        .scan-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .scan-desc-preview {
          font-size: 0.85rem;
          color: #475569;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scan-tags-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .type-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 0.35rem;
          background: #f1f5f9;
          color: #334155;
        }

        .concern-tag {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 0.35rem;
          background: #e0f2fe;
          color: #0369a1;
        }

        .btn-view-detail {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 0.45rem 0.85rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scan-history-card:hover .btn-view-detail {
          background: #0284c7;
          border-color: #0284c7;
          color: #ffffff;
        }

        .empty-history-card {
          text-align: center;
          padding: 4rem 2rem;
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 1.25rem;
        }

        .empty-icon {
          color: #94a3b8;
          margin-bottom: 1rem;
        }

        .btn-primary-gradient {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(2, 132, 199, 0.3);
          transition: transform 0.2s;
        }

        .btn-primary-gradient:hover {
          transform: translateY(-2px);
        }

        /* MODAL STYLES */
        @keyframes modalBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalContentZoomIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-backdrop {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(15, 23, 42, 0.72) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 999999 !important;
          padding: 1.25rem !important;
          box-sizing: border-box !important;
          animation: modalBackdropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .modal-content-box {
          background: #ffffff !important;
          border-radius: 1.5rem !important;
          max-width: 840px !important;
          width: 100% !important;
          max-height: 88vh !important;
          display: flex !important;
          flex-direction: column !important;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgba(0, 0, 0, 0.08) !important;
          overflow: hidden !important;
          position: relative !important;
          animation: modalContentZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-date-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.2rem;
        }

        .modal-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .btn-close-modal {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 0.35rem;
          border-radius: 0.4rem;
        }

        .btn-close-modal:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-body-scroll {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* MODAL HERO BANNER */
        .modal-score-hero {
          background: linear-gradient(135deg, #082d38 0%, #0d5265 65%, #0a3d4a 100%);
          border-radius: 1rem;
          padding: 1.5rem;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(13, 82, 101, 0.15);
        }

        .hero-glow-accent {
          position: absolute;
          top: -30px;
          right: -30px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }

        .dots-bg-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 14px 14px;
        }

        .score-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .score-ring-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 3px solid rgba(255, 255, 255, 0.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .score-ring-avatar.score-optimal {
          border-color: #34d399;
          background: radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, rgba(255,255,255,0.05) 100%);
        }

        .score-ring-avatar.score-caution {
          border-color: #fbbf24;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, rgba(255,255,255,0.05) 100%);
        }

        .score-ring-avatar.score-warning {
          border-color: #f87171;
          background: radial-gradient(circle, rgba(248, 113, 113, 0.2) 0%, rgba(255,255,255,0.05) 100%);
        }

        .sr-number-row {
          display: flex;
          align-items: baseline;
          line-height: 1;
        }

        .sr-val {
          font-size: 1.7rem;
          font-weight: 800;
        }

        .sr-scale {
          font-size: 0.75rem;
          opacity: 0.75;
          margin-left: 2px;
        }

        .sr-unit {
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.85;
          margin-top: 2px;
        }

        .score-meta-info {
          flex: 1;
          min-width: 240px;
        }

        .hero-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .hero-skin-type-badge {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(52, 211, 153, 0.4);
          color: #a7f3d0;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .hero-confidence-badge {
          background: rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .hero-notes-text {
          font-size: 0.85rem;
          color: #d1fae5;
          line-height: 1.5;
          margin: 0;
        }

        .modal-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.85rem;
        }

        /* 3-AREA STACK IN MODAL */
        .modal-areas-stack {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .area-detail-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.85rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .area-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .area-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .area-icon-accent {
          color: #0f6784;
        }

        .area-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
        }

        .area-badges-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .area-severity-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .area-severity-badge.ringan {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .area-severity-badge.sedang {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fef3c7;
        }

        .area-score-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #0f6784;
          background: #eaf4fa;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .area-finding-box, .area-analogy-box, .area-action-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .af-label, .aa-label, .ac-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
        }

        .af-text {
          font-size: 0.8125rem;
          color: #1e293b;
          line-height: 1.45;
          margin: 0;
        }

        .area-analogy-box {
          background: #f8fafc;
          border-left: 3px solid #0f6784;
          border-radius: 0 6px 6px 0;
          padding: 6px 10px;
        }

        .aa-text {
          font-size: 0.78125rem;
          color: #334155;
          line-height: 1.45;
          margin: 0;
          font-style: italic;
        }

        .area-action-box {
          background: #f0fdf4;
          border-left: 3px solid #10b981;
          border-radius: 0 6px 6px 0;
          padding: 6px 10px;
        }

        .ac-text {
          font-size: 0.78125rem;
          color: #166534;
          line-height: 1.45;
          margin: 0;
          font-weight: 500;
        }

        /* PERSONAL TIPS IN MODAL */
        .modal-tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.85rem;
        }

        .tip-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 12px;
        }

        .tip-box.tip-avoid { border-top: 3px solid #ef4444; }
        .tip-box.tip-reduce { border-top: 3px solid #f59e0b; }
        .tip-box.tip-do { border-top: 3px solid #10b981; }

        .tb-title {
          font-size: 0.78125rem;
          font-weight: 700;
          display: block;
          margin-bottom: 8px;
        }

        .text-red { color: #b3261e; }
        .text-amber { color: #b45309; }
        .text-green { color: #166534; }

        .tb-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.5;
        }

        .tb-list li {
          margin-bottom: 4px;
        }

        /* HERO ACTIVES IN MODAL */
        .modal-actives-stack {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .active-ing-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.85rem;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .aic-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aic-badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .aic-rank {
          font-size: 0.7rem;
          font-weight: 800;
          color: #0f6784;
          background: #eaf4fa;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .aic-priority-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .aic-priority-pill.essential {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .aic-priority-pill.recommended {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .aic-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .aic-purpose {
          font-size: 0.78125rem;
          color: #475569;
          line-height: 1.45;
          margin: 0;
        }

        .aic-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .btn-shopee-search {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #0f6784;
          color: #0f6784;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-shopee-search:hover {
          background: #0f6784;
          color: #ffffff;
        }

        .btn-ask-skinsistant {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-ask-skinsistant:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* MODAL FOOTER */
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-secondary {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 0.55rem 1.1rem;
          border-radius: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-primary-consult {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0f6784;
          border: none;
          color: #ffffff;
          padding: 0.55rem 1.1rem;
          border-radius: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-primary-consult:hover {
          background: #0b4f5c;
        }
      `}</style>
    </div>
  )
}
