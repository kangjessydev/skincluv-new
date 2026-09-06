import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FaceScan } from '@/types/database'

export default function ScanHistoryPage() {
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [scans, setScans] = useState<FaceScan[]>([])
  const [selectedScan, setSelectedScan] = useState<FaceScan | null>(null)

  const fetchScans = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      // 1. Coba fetch dari tabel face_scans (riwayat multi-sesi)
      const { data, error } = await supabase
        .from('face_scans')
        .select('*')
        .eq('user_id', session.user.id)
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
        .eq('user_id', session.user.id)
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
  }, [session])

  // Statistics calculation
  const totalScans = scans.length
  const avgScore = totalScans > 0
    ? Math.round(scans.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalScans)
    : 0

  const latestScore = scans[0]?.overall_score || 0
  const previousScore = scans[1]?.overall_score || latestScore
  const scoreDiff = latestScore - previousScore

  return (
    <div className="skincluv-scan-history-page animate-fade-in">
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

              return (
                <div
                  key={scan.id}
                  className="scan-history-card glass-card"
                  onClick={() => setSelectedScan(scan)}
                >
                  <div className="scan-card-left">
                    <div className="score-badge-circle">
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
                        {Array.isArray(scan.skin_concerns) && scan.skin_concerns.slice(0, 2).map((c, i) => (
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

      {/* Modal Detail Hasil Scan Masa Lalu */}
      {selectedScan && (
        <div className="modal-backdrop" onClick={() => setSelectedScan(null)}>
          <div className="modal-content-box glass-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-date-tag">
                  <Calendar size={13} /> {new Date(selectedScan.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <h3 className="modal-title">{selectedScan.skin_status_title || 'Laporan Diagnosis Kulit'}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedScan(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll">
              {/* Score Hero */}
              <div className="modal-score-hero">
                <div className="modal-score-circle">
                  <span className="score-big">{selectedScan.overall_score}</span>
                  <span className="score-label">Skor Total</span>
                </div>
                <div className="modal-score-desc">
                  <p className="type-banner">Tipe Kulit: <strong>{selectedScan.skin_type?.toUpperCase()}</strong></p>
                  <p className="notes-text">{selectedScan.analysis_notes}</p>
                </div>
              </div>

              {/* 3-Area Breakdown */}
              {Array.isArray(selectedScan.area_evaluations) && selectedScan.area_evaluations.length > 0 && (
                <div className="modal-areas-section">
                  <h4 className="modal-section-title"><Layers size={16} /> Evaluasi Per Area Wajah</h4>
                  <div className="modal-areas-grid">
                    {(selectedScan.area_evaluations as any[]).map((area, aIdx) => (
                      <div key={aIdx} className="area-detail-card">
                        <div className="area-card-header">
                          <span className="area-name">{area.area_name}</span>
                          <span className="area-score-badge">Skor: {area.score}/100</span>
                        </div>
                        <p className="area-finding"><strong>Diagnosis:</strong> {area.finding}</p>
                        {area.analogy && (
                          <div className="area-analogy-box">
                            💡 <em>"{area.analogy}"</em>
                          </div>
                        )}
                        {area.action_plan && (
                          <p className="area-action"><strong>Rencana Aksi:</strong> {area.action_plan}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Recommendations */}
              {Array.isArray(selectedScan.product_recommendations) && selectedScan.product_recommendations.length > 0 && (
                <div className="modal-products-section">
                  <h4 className="modal-section-title"><ShoppingBag size={16} /> Rekomendasi Produk Terkait</h4>
                  <div className="modal-products-grid">
                    {(selectedScan.product_recommendations as any[]).map((prod, pIdx) => (
                      <div key={pIdx} className="prod-bento-card">
                        <div className="prod-header">
                          <span className="prod-badge">#{pIdx + 1} Match: {prod.match_score}%</span>
                          <span className="prod-category">{prod.category}</span>
                        </div>
                        <h5 className="prod-name">{prod.product_name}</h5>
                        <p className="prod-why">{prod.why_recommended}</p>
                        <a
                          href={`https://shopee.co.id/search?keyword=${encodeURIComponent(prod.product_name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-shopee-link"
                        >
                          Cari di Marketplace <ExternalLink size={13} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedScan(null)}>
                Tutup Laporan
              </button>
            </div>
          </div>
        </div>
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
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
          flex-shrink: 0;
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
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }
        .modal-content-box {
          background: #ffffff;
          border-radius: 1.25rem;
          max-width: 750px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
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
        .modal-score-hero {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 1rem;
          padding: 1.25rem 1.5rem;
        }
        .modal-score-circle {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: #0284c7;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(2, 132, 199, 0.3);
        }
        .score-big {
          font-size: 1.6rem;
          font-weight: 900;
          line-height: 1;
        }
        .score-label {
          font-size: 0.65rem;
          font-weight: 600;
          opacity: 0.9;
        }
        .type-banner {
          font-size: 0.85rem;
          color: #0369a1;
          margin-bottom: 0.3rem;
        }
        .notes-text {
          font-size: 0.9rem;
          color: #334155;
          line-height: 1.5;
        }
        .modal-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }
        .modal-areas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .area-detail-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem;
        }
        .area-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .area-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }
        .area-score-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284c7;
          background: #e0f2fe;
          padding: 0.15rem 0.4rem;
          border-radius: 0.35rem;
        }
        .area-finding {
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 0.4rem;
          line-height: 1.4;
        }
        .area-analogy-box {
          font-size: 0.75rem;
          background: #fefce8;
          border: 1px solid #fef08a;
          color: #854d0e;
          padding: 0.4rem 0.5rem;
          border-radius: 0.4rem;
          margin-bottom: 0.4rem;
        }
        .area-action {
          font-size: 0.75rem;
          color: #059669;
          line-height: 1.4;
        }
        .modal-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .prod-bento-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .prod-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }
        .prod-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: #059669;
          background: #d1fae5;
          padding: 0.15rem 0.4rem;
          border-radius: 0.35rem;
        }
        .prod-category {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
        }
        .prod-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.35rem;
        }
        .prod-why {
          font-size: 0.75rem;
          color: #475569;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        .btn-shopee-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ea580c;
          background: #fff7ed;
          border: 1px solid #ffedd5;
          padding: 0.4rem 0.65rem;
          border-radius: 0.5rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .btn-shopee-link:hover {
          background: #ffedd5;
        }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }
        .btn-secondary {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  )
}
