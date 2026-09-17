import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  RefreshCw,
  PieChart,
  Award,
  Sparkles,
  ShieldCheck,
  Zap,
  ThumbsUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SkinTypeItem {
  skin_type: string
  count: number
  percentage: number
}

interface SkinConcernItem {
  concern: string
  count: number
  percentage: number
}

interface TopProductItem {
  product_name: string
  brand: string
  category: string | null
  scan_hit_count: number
  overall_safety_score: number
}

interface AiTelemetry {
  total_requests: number
  success_count: number
  error_count: number
  rejected_no_face_count: number
  avg_latency_ms: number
  positive_feedback: number
  negative_feedback: number
}

interface IntelligenceData {
  total_profiles: number
  skin_types: SkinTypeItem[]
  skin_concerns: SkinConcernItem[]
  top_products: TopProductItem[]
  ai_telemetry: AiTelemetry
}

export default function AdminMarketIntelligencePage() {
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadMarketIntelligence = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: res, error } = await supabase.rpc('get_market_intelligence_stats' as any)
      if (error) throw error
      setData((res as any) || null)
    } catch (err: any) {
      console.error('[AdminMarketIntelligence] Gagal mengambil data:', err)
      setErrorMessage(err.message || 'Gagal mengambil data intelijen pasar.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMarketIntelligence()
  }, [loadMarketIntelligence])

  const telemetry = data?.ai_telemetry
  const totalReq = telemetry?.total_requests || 0
  const successRate = totalReq > 0 ? (((telemetry?.success_count || 0) / totalReq) * 100).toFixed(1) : '100'
  const totalFeedback = (telemetry?.positive_feedback || 0) + (telemetry?.negative_feedback || 0)
  const satisfactionRate = totalFeedback > 0 ? (((telemetry?.positive_feedback || 0) / totalFeedback) * 100).toFixed(1) : '100'

  const skinTypeLabels: Record<string, { label: string; color: string }> = {
    oily: { label: 'Berminyak (Oily)', color: '#3b82f6' },
    combination: { label: 'Kombinasi', color: '#8b5cf6' },
    dry: { label: 'Kering (Dry)', color: '#f59e0b' },
    sensitive: { label: 'Sensitif', color: '#ef4444' },
    normal: { label: 'Normal', color: '#10b981' },
  }

  return (
    <div className="admin-intel-page">
      {/* Header */}
      <div className="admin-intel-header">
        <div>
          <div className="badge-category">
            <TrendingUp size={14} /> RISET PASAR & KEPATUHAN PRIVASI (UU PDP)
          </div>
          <h1>Tren Pasar & Demografi Kulit (Market Intelligence)</h1>
          <p>
            Statistik agregat anonim 100% tanpa identitas personal. Membantu menentukan strategi kampanye promo produk, riset tren kosmetik, dan pemantauan kualitas AI.
          </p>
        </div>
        <button
          className="btn-refresh"
          onClick={loadMarketIntelligence}
          disabled={isLoading}
          title="Segarkan Data"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {errorMessage && (
        <div className="error-alert">
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card profiles">
          <div className="kpi-icon-wrap">
            <PieChart size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Profil Kulit Dianalisis</span>
            <span className="kpi-value">{data?.total_profiles?.toLocaleString() || 0}</span>
            <span className="kpi-subtext">Sampel agregat riset pasar</span>
          </div>
        </div>

        <div className="kpi-card success-rate">
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tingkat Keberhasilan AI</span>
            <span className="kpi-value">{successRate}%</span>
            <span className="kpi-subtext">{telemetry?.success_count || 0} scan sukses</span>
          </div>
        </div>

        <div className="kpi-card speed">
          <div className="kpi-icon-wrap">
            <Clock size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Rata-rata Kecepatan Respon</span>
            <span className="kpi-value">{telemetry?.avg_latency_ms ? (telemetry.avg_latency_ms / 1000).toFixed(2) : 0}s</span>
            <span className="kpi-subtext">Latensi pemrosesan server</span>
          </div>
        </div>

        <div className="kpi-card satisfaction">
          <div className="kpi-icon-wrap">
            <ThumbsUp size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Kepuasan Respon AI</span>
            <span className="kpi-value">{satisfactionRate}%</span>
            <span className="kpi-subtext">Rating jempol positif dari user</span>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Demografi Jenis Kulit & Top Keluhan */}
      <div className="two-col-grid">
        {/* Kolom Kiri: Demografi Jenis Kulit */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-indigo-600" />
                <h3>Distribusi Jenis Kulit Konsumen</h3>
              </div>
              <p>Proporsi jenis kulit pengguna di platform Skincluv.</p>
            </div>
          </div>

          <div className="demographic-list">
            {(!data?.skin_types || data.skin_types.length === 0) ? (
              <div className="empty-state">Belum ada data jenis kulit yang tercatat.</div>
            ) : (
              data.skin_types.map((st) => {
                const info = skinTypeLabels[st.skin_type.toLowerCase()] || {
                  label: st.skin_type,
                  color: '#6366f1',
                }
                return (
                  <div key={st.skin_type} className="demo-item">
                    <div className="demo-meta">
                      <div className="flex items-center gap-2">
                        <span className="color-dot" style={{ background: info.color }} />
                        <span className="font-semibold text-gray-800">{info.label}</span>
                      </div>
                      <span className="demo-percent">
                        <strong>{st.percentage}%</strong> ({st.count} user)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${st.percentage}%`, background: info.color }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="insight-box">
            <Sparkles size={16} className="text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Rekomendasi Bisnis:</strong> Fokuskan kurasi katalog pada formula ringan (non-comedogenic / water-based) untuk mengakomodasi mayoritas profil berminyak & kombinasi.
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Top 10 Keluhan Kulit Terbanyak */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-500" />
                <h3>Top 10 Keluhan Kulit Paling Sering Dialami</h3>
              </div>
              <p>Keluhan utama yang paling dicari solusinya oleh pengguna.</p>
            </div>
          </div>

          <div className="concerns-ranked-list">
            {(!data?.skin_concerns || data.skin_concerns.length === 0) ? (
              <div className="empty-state">Belum ada data keluhan kulit yang tercatat.</div>
            ) : (
              data.skin_concerns.map((sc, idx) => (
                <div key={sc.concern} className="concern-rank-item">
                  <span className={`rank-badge ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
                  <div className="concern-body">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900 text-xs">{sc.concern}</span>
                      <span className="text-xs font-semibold text-indigo-600">{sc.percentage}%</span>
                    </div>
                    <div className="progress-track sm">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${sc.percentage}%`,
                          background: idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="insight-box amber">
            <Zap size={16} className="text-amber-600 flex-shrink-0" />
            <span>
              <strong>Potensi Penjualan:</strong> Keluhan peringkat 1-3 merupakan produk dengan konversi tertinggi jika ditawarkan pada fitur rekomendasi setelah analisis.
            </span>
          </div>
        </div>
      </div>

      {/* Section: Top Produk Kosmetik yang Paling Sering Di-scan */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <h3>Produk Skincare Terpopuler di Pasar (Berdasarkan Scan Konsumen)</h3>
            </div>
            <p>
              Daftar produk kosmetik yang paling sering discan oleh masyarakat di Indonesia melalui fitur Ingredient Scan.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PERINGKAT</th>
                <th>PRODUK & BRAND</th>
                <th>KATEGORI</th>
                <th>SKOR KEAMANAN</th>
                <th>FREKUENSI SCAN KONSUMEN</th>
                <th>STATUS PASAR</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.top_products || data.top_products.length === 0) ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Belum ada produk kosmetik yang di-scan oleh pengguna.
                  </td>
                </tr>
              ) : (
                data.top_products.map((prod, idx) => {
                  const isTop3 = idx < 3
                  const score = prod.overall_safety_score || 85
                  return (
                    <tr key={idx} className="table-row">
                      <td className="w-16">
                        <span className={`rank-pill ${isTop3 ? 'gold' : ''}`}>#{idx + 1}</span>
                      </td>
                      <td>
                        <strong className="text-gray-900 block text-sm">{prod.product_name}</strong>
                        <span className="text-xs text-gray-500">{prod.brand}</span>
                      </td>
                      <td>
                        <span className="category-badge">
                          {prod.category || 'Skincare'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className={score >= 80 ? 'text-emerald-500' : 'text-amber-500'} />
                          <span className="font-bold text-gray-900">{score}/100</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-indigo-600">
                          {prod.scan_hit_count.toLocaleString()} kali scan
                        </span>
                      </td>
                      <td>
                        {isTop3 ? (
                          <span className="badge-trending">
                            <Flame size={12} /> Sedang Viral
                          </span>
                        ) : (
                          <span className="badge-popular">Populer</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VANILLA CSS STYLING */}
      <style>{`
        .admin-intel-page {
          padding: 24px;
          max-width: 1300px;
          margin: 0 auto;
          font-family: inherit;
        }

        .admin-intel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .badge-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #4f46e5;
          background: #eef2ff;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 8px;
          letter-spacing: 0.04em;
        }

        .admin-intel-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .admin-intel-header p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .btn-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-refresh:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .kpi-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-card.profiles .kpi-icon-wrap { background: #eff6ff; color: #2563eb; }
        .kpi-card.success-rate .kpi-icon-wrap { background: #ecfdf5; color: #059669; }
        .kpi-card.speed .kpi-icon-wrap { background: #fdf4ff; color: #c026d3; }
        .kpi-card.satisfaction .kpi-icon-wrap { background: #fffbeb; color: #d97706; }

        .kpi-content {
          display: flex;
          flex-direction: column;
        }

        .kpi-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .kpi-value {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0;
          letter-spacing: -0.02em;
        }

        .kpi-subtext {
          font-size: 12px;
          color: #94a3b8;
        }

        /* 2-Column Grid */
        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .two-col-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px 0;
        }

        .section-header p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .demographic-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 18px;
        }

        .demo-meta {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }

        .demo-percent {
          font-size: 12px;
          color: #64748b;
        }

        .demo-percent strong {
          color: #0f172a;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-track.sm {
          height: 6px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .concerns-ranked-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }

        .concern-rank-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rank-badge {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rank-badge.top {
          background: #eef2ff;
          color: #4f46e5;
        }

        .concern-body {
          flex: 1;
        }

        .insight-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: #334155;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }

        .insight-box.amber {
          background: #fffbeb;
          border-color: #fde68a;
          color: #92400e;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .admin-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .table-row:hover {
          background: #fafafa;
        }

        .rank-pill {
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .rank-pill.gold {
          background: #fef3c7;
          color: #b45309;
        }

        .category-badge {
          font-size: 11px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-trending {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          background: #fee2e2;
          color: #b91c1c;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .badge-popular {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}
