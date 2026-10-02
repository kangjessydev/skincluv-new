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
  Filter,
  Layers,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-market-intelligence.css'

interface CorrelationItem {
  id: string
  skin_concern: string
  skin_type: string
  product_name: string
  brand: string | null
  category: string | null
  associated_ingredients: string[]
  source_feature: string
  occurrence_count: number
  last_occurred_at: string
}

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
  const [correlations, setCorrelations] = useState<CorrelationItem[]>([])
  const [selectedConcern, setSelectedConcern] = useState<string>('all')
  const [loadingCorrelations, setLoadingCorrelations] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadCorrelations = useCallback(async (concern: string) => {
    setLoadingCorrelations(true)
    try {
      const { data: res, error } = await supabase.rpc('get_market_correlations', {
        p_concern: concern === 'all' ? undefined : concern,
      })
      if (error) throw error
      setCorrelations((res as unknown as CorrelationItem[]) || [])
    } catch (err: any) {
      console.error('[AdminMarketIntelligence] Gagal memuat data korelasi:', err)
    } finally {
      setLoadingCorrelations(false)
    }
  }, [])

  const loadMarketIntelligence = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: res, error } = await supabase.rpc('get_market_intelligence_stats' as any)
      if (error) throw error
      setData((res as any) || null)
      await loadCorrelations(selectedConcern)
    } catch (err: any) {
      console.error('[AdminMarketIntelligence] Gagal mengambil data:', err)
      setErrorMessage(err.message || 'Gagal mengambil data intelijen pasar.')
    } finally {
      setIsLoading(false)
    }
  }, [loadCorrelations, selectedConcern])

  useEffect(() => {
    loadMarketIntelligence()
  }, [loadMarketIntelligence])

  const handleConcernChange = (concern: string) => {
    setSelectedConcern(concern)
    loadCorrelations(concern)
  }

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

      {/* SECTION 4: Matriks Korelasi Kebutuhan & Produk Populer (Zero PII) */}
      <div className="section-card full-width" style={{ marginTop: 24 }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              <h3>Matriks Korelasi Masalah Kulit & Produk Populer</h3>
            </div>
            <p>
              Data anonim yang memetakan hubungan antara <strong>keluhan kulit konsumen</strong> dengan <strong>produk dan bahan aktif</strong> yang paling sering dicari atau discan tanpa menyimpan data identitas pengguna.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
              <Filter size={13} /> Filter Masalah:
            </span>
            {['all', 'Jerawat', 'Flek Hitam', 'Kulit Kusam', 'Pori-pori Besar', 'Skin Barrier Rusak', 'Anti-Aging'].map((concern) => (
              <button
                key={concern}
                onClick={() => handleConcernChange(concern)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: selectedConcern === concern ? 700 : 500,
                  background: selectedConcern === concern ? '#4f46e5' : '#f1f5f9',
                  color: selectedConcern === concern ? '#ffffff' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {concern === 'all' ? 'Semua Masalah' : concern}
              </button>
            ))}
          </div>
        </div>

        {/* Table Correlations */}
        <div className="table-responsive" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Masalah Kulit</th>
                <th>Produk / Kosmetik Terkait</th>
                <th>Brand & Kategori</th>
                <th>Bahan Aktif Terkait</th>
                <th style={{ textAlign: 'center' }}>Fitur Asal</th>
                <th style={{ textAlign: 'right' }}>Frekuensi Korelasi</th>
              </tr>
            </thead>
            <tbody>
              {loadingCorrelations ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                    <div>Memuat matriks korelasi pasar...</div>
                  </td>
                </tr>
              ) : correlations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    Belum ada data korelasi untuk keluhan yang dipilih.
                  </td>
                </tr>
              ) : (
                correlations.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: '#fef3c7',
                          color: '#b45309',
                          display: 'inline-block',
                        }}
                      >
                        {item.skin_concern}
                      </span>
                    </td>
                    <td>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: 13 }}>
                        {item.product_name}
                      </strong>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Tipe Kulit: <span style={{ fontWeight: 600 }}>{item.skin_type || 'Semua'}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: 12 }}>{item.brand || '-'}</div>
                      <span className="category-badge">{item.category || 'Skincare'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(item.associated_ingredients || []).slice(0, 3).map((ing, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '2px 7px',
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#f8fafc',
                          color: '#475569',
                          fontWeight: 600,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {item.source_feature === 'ingredient_scan'
                          ? 'Scan Komposisi'
                          : item.source_feature === 'face_scan'
                          ? 'Scan Wajah'
                          : 'Chatbot'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#4f46e5' }}>
                        {item.occurrence_count.toLocaleString()}x
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legal & Privacy Guarantee Footnote */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#166534', lineHeight: 1.4 }}>
            <strong>Jaminan Kepatuhan UU PDP No. 27/2022</strong>: Matriks korelasi di atas disimpan secara de-identified (tanpa menyertakan nama, email, foto, user ID, atau chat session). Data ini murni mengagregasikan frekuensi hubungan antara jenis masalah kulit dan produk/bahan kosmetik yang dicari masyarakat.
          </span>
        </div>
      </div>


    </div>
  )
}
