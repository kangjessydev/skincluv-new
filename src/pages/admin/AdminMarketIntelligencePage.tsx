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
    oily: { label: 'Berminyak (Oily)', color: 'var(--cluv-teal)' },
    combination: { label: 'Kombinasi', color: 'var(--cluv-purple)' },
    dry: { label: 'Kering (Dry)', color: 'var(--cluv-gold)' },
    sensitive: { label: 'Sensitif', color: 'var(--cluv-rose)' },
    normal: { label: 'Normal', color: 'var(--cluv-status-success)' },
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-flex cluv-items-center cluv-gap-2 cluv-mb-1">
            <span className="cluv-badge is-sm is-teal">
              <TrendingUp size={12} />
              Riset Pasar Agregat
            </span>
            <span className="cluv-badge is-sm is-purple">UU PDP Compliant</span>
          </div>
          <h1 className="cluv-title-section" style={{ margin: 0 }}>
            Tren Pasar & Demografi Kulit
          </h1>
          <p className="cluv-subtitle cluv-mt-1">
            Statistik agregat anonim 100% tanpa identitas personal. Membantu menentukan strategi kampanye promo produk, riset tren kosmetik, dan pemantauan kualitas AI.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            type="button"
            className="cluv-btn is-outline is-sm"
            onClick={loadMarketIntelligence}
            disabled={isLoading}
            title="Segarkan Data"
          >
            <RefreshCw size={15} className={isLoading ? 'cluv-animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="cluv-alert is-danger cluv-mb-4">
          <AlertTriangle size={18} className="cluv-alert-icon" />
          <div className="cluv-alert-content">
            <div className="cluv-alert-message">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="cluv-stat-grid cols-4 cluv-mb-6">
        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Profil Dianalisis</span>
            <div className="cluv-stat-icon is-blue">
              <PieChart size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{data?.total_profiles?.toLocaleString() || 0}</div>
          <div className="cluv-stat-meta">Sampel agregat riset pasar</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Success Rate AI</span>
            <div className="cluv-stat-icon is-teal">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{successRate}%</div>
          <div className="cluv-stat-meta is-positive">{telemetry?.success_count || 0} scan sukses</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Kecepatan Respon</span>
            <div className="cluv-stat-icon is-purple">
              <Clock size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">
            {telemetry?.avg_latency_ms ? (telemetry.avg_latency_ms / 1000).toFixed(2) : 0}s
          </div>
          <div className="cluv-stat-meta">Latensi pemrosesan server</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Kepuasan Respon</span>
            <div className="cluv-stat-icon is-gold">
              <ThumbsUp size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{satisfactionRate}%</div>
          <div className="cluv-stat-meta">Rating jempol positif user</div>
        </div>
      </div>

      {/* Grid 2 Kolom: Demografi Jenis Kulit & Top Keluhan */}
      <div className="admin-intel-two-col">
        {/* Kolom Kiri: Demografi Jenis Kulit */}
        <div className="cluv-card">
          <div className="cluv-mb-4">
            <div className="cluv-flex cluv-items-center cluv-gap-2">
              <PieChart size={18} className="cluv-text-teal" />
              <h3 className="admin-section-title">Distribusi Jenis Kulit Konsumen</h3>
            </div>
            <p className="admin-section-desc">Proporsi jenis kulit pengguna di platform Skincluv.</p>
          </div>

          <div className="admin-demo-list">
            {(!data?.skin_types || data.skin_types.length === 0) ? (
              <div className="cluv-text-muted cluv-text-center cluv-py-4">Belum ada data jenis kulit yang tercatat.</div>
            ) : (
              data.skin_types.map((st) => {
                const info = skinTypeLabels[st.skin_type.toLowerCase()] || {
                  label: st.skin_type,
                  color: 'var(--cluv-teal)',
                }
                return (
                  <div key={st.skin_type} className="cluv-w-full">
                    <div className="admin-demo-meta">
                      <div className="cluv-flex cluv-items-center cluv-gap-2">
                        <span className="admin-demo-dot" style={{ background: info.color }} />
                        <span className="cluv-body" style={{ fontWeight: 700 }}>{info.label}</span>
                      </div>
                      <span className="admin-demo-percent">
                        <strong>{st.percentage}%</strong> ({st.count} user)
                      </span>
                    </div>
                    <div className="cluv-progress-track">
                      <div
                        className="cluv-progress-bar"
                        style={{ width: `${st.percentage}%`, background: info.color }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="admin-insight-box">
            <Sparkles size={16} className="cluv-text-teal cluv-flex-shrink-0" />
            <span>
              <strong>Rekomendasi Bisnis:</strong> Fokuskan kurasi katalog pada formula ringan (non-comedogenic / water-based) untuk mengakomodasi mayoritas profil berminyak & kombinasi.
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Top 10 Keluhan Kulit Terbanyak */}
        <div className="cluv-card">
          <div className="cluv-mb-4">
            <div className="cluv-flex cluv-items-center cluv-gap-2">
              <Flame size={18} className="cluv-text-amber" />
              <h3 className="admin-section-title">Top 10 Keluhan Kulit Paling Sering Dialami</h3>
            </div>
            <p className="admin-section-desc">Keluhan utama yang paling dicari solusinya oleh pengguna.</p>
          </div>

          <div className="admin-concerns-list">
            {(!data?.skin_concerns || data.skin_concerns.length === 0) ? (
              <div className="cluv-text-muted cluv-text-center cluv-py-4">Belum ada data keluhan kulit yang tercatat.</div>
            ) : (
              data.skin_concerns.map((sc, idx) => {
                const barColor = idx === 0 ? 'var(--cluv-rose)' : idx === 1 ? 'var(--cluv-gold)' : 'var(--cluv-teal)'
                return (
                  <div key={sc.concern} className="admin-concern-row">
                    <span className={`admin-rank-badge ${idx < 3 ? 'is-top' : ''}`}>{idx + 1}</span>
                    <div className="admin-concern-body">
                      <div className="cluv-flex cluv-flex-between cluv-items-center cluv-mb-1">
                        <span className="cluv-body" style={{ fontWeight: 700, fontSize: '13px' }}>{sc.concern}</span>
                        <span className="cluv-caption" style={{ fontWeight: 700, color: 'var(--cluv-teal-dark)' }}>{sc.percentage}%</span>
                      </div>
                      <div className="cluv-progress-track is-sm">
                        <div
                          className="cluv-progress-bar"
                          style={{
                            width: `${sc.percentage}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="admin-insight-box is-amber">
            <Zap size={16} className="cluv-text-gold cluv-flex-shrink-0" />
            <span>
              <strong>Potensi Penjualan:</strong> Keluhan peringkat 1-3 merupakan produk dengan konversi tertinggi jika ditawarkan pada fitur rekomendasi setelah analisis.
            </span>
          </div>
        </div>
      </div>

      {/* Section: Top Produk Kosmetik yang Paling Sering Di-scan */}
      <div className="cluv-card cluv-mb-6">
        <div className="cluv-mb-4">
          <div className="cluv-flex cluv-items-center cluv-gap-2">
            <Award size={18} className="cluv-text-gold" />
            <h3 className="admin-section-title">Produk Skincare Terpopuler di Pasar</h3>
          </div>
          <p className="admin-section-desc">
            Daftar produk kosmetik yang paling sering discan oleh masyarakat di Indonesia melalui fitur Ingredient Scan.
          </p>
        </div>

        <div className="admin-table-container">
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
                  <td colSpan={6} className="cluv-text-center cluv-py-6 cluv-text-muted">
                    Belum ada produk kosmetik yang di-scan oleh pengguna.
                  </td>
                </tr>
              ) : (
                data.top_products.map((prod, idx) => {
                  const isTop3 = idx < 3
                  const score = prod.overall_safety_score || 85
                  return (
                    <tr key={idx} className="admin-table-row">
                      <td style={{ width: 64 }}>
                        <span className={`admin-rank-pill ${isTop3 ? 'is-gold' : ''}`}>#{idx + 1}</span>
                      </td>
                      <td>
                        <strong className="cluv-body" style={{ fontWeight: 700, display: 'block' }}>{prod.product_name}</strong>
                        <span className="cluv-caption cluv-text-muted">{prod.brand}</span>
                      </td>
                      <td>
                        <span className="admin-category-badge">
                          {prod.category || 'Skincare'}
                        </span>
                      </td>
                      <td>
                        <div className="cluv-flex cluv-items-center cluv-gap-1">
                          <ShieldCheck size={14} className={score >= 80 ? 'cluv-text-teal' : 'cluv-text-gold'} />
                          <span className="cluv-body" style={{ fontWeight: 700 }}>{score}/100</span>
                        </div>
                      </td>
                      <td>
                        <span className="cluv-body" style={{ fontWeight: 700, color: 'var(--cluv-teal)' }}>
                          {prod.scan_hit_count.toLocaleString()} kali scan
                        </span>
                      </td>
                      <td>
                        {isTop3 ? (
                          <span className="admin-badge-trending">
                            <Flame size={12} /> Sedang Viral
                          </span>
                        ) : (
                          <span className="admin-badge-popular">Populer</span>
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
      <div className="cluv-card cluv-mb-6">
        <div className="cluv-flex cluv-flex-between cluv-items-center cluv-flex-responsive cluv-gap-3 cluv-mb-4">
          <div>
            <div className="cluv-flex cluv-items-center cluv-gap-2">
              <Layers size={18} className="cluv-text-purple" />
              <h3 className="admin-section-title">Matriks Korelasi Masalah Kulit & Produk Populer</h3>
            </div>
            <p className="admin-section-desc">
              Data anonim yang memetakan hubungan antara <strong>keluhan kulit konsumen</strong> dengan <strong>produk dan bahan aktif</strong> yang paling sering dicari atau discan tanpa menyimpan data identitas pengguna.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="cluv-chip-group">
            <span className="cluv-caption cluv-text-muted cluv-flex cluv-items-center cluv-gap-1">
              <Filter size={13} /> Filter:
            </span>
            {['all', 'Jerawat', 'Flek Hitam', 'Kulit Kusam', 'Pori-pori Besar', 'Skin Barrier Rusak', 'Anti-Aging'].map((concern) => (
              <button
                key={concern}
                type="button"
                onClick={() => handleConcernChange(concern)}
                className={`cluv-chip ${selectedConcern === concern ? 'is-active' : ''}`}
              >
                {concern === 'all' ? 'Semua Masalah' : concern}
              </button>
            ))}
          </div>
        </div>

        {/* Table Correlations */}
        <div className="admin-table-container">
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
                  <td colSpan={6} className="cluv-text-center cluv-py-6 cluv-text-muted">
                    <RefreshCw size={18} className="cluv-animate-spin" style={{ margin: '0 auto 6px auto' }} />
                    <div>Memuat matriks korelasi pasar...</div>
                  </td>
                </tr>
              ) : correlations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cluv-text-center cluv-py-6 cluv-text-muted">
                    Belum ada data korelasi untuk keluhan yang dipilih.
                  </td>
                </tr>
              ) : (
                correlations.map((item) => (
                  <tr key={item.id} className="admin-table-row">
                    <td>
                      <span className="cluv-badge is-sm is-gold">
                        {item.skin_concern}
                      </span>
                    </td>
                    <td>
                      <strong className="cluv-body" style={{ fontWeight: 700, display: 'block' }}>
                        {item.product_name}
                      </strong>
                      <span className="cluv-caption cluv-text-muted">
                        Tipe Kulit: <span style={{ fontWeight: 600 }}>{item.skin_type || 'Semua'}</span>
                      </span>
                    </td>
                    <td>
                      <div className="cluv-body" style={{ fontWeight: 600, fontSize: '12px' }}>{item.brand || '-'}</div>
                      <span className="admin-category-badge">{item.category || 'Skincare'}</span>
                    </td>
                    <td>
                      <div className="cluv-flex cluv-items-center cluv-gap-1" style={{ flexWrap: 'wrap' }}>
                        {(item.associated_ingredients || []).slice(0, 3).map((ing, i) => (
                          <span key={i} className="admin-tag-pill">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="admin-feature-pill">
                        {item.source_feature === 'ingredient_scan'
                          ? 'Scan Komposisi'
                          : item.source_feature === 'face_scan'
                          ? 'Scan Wajah'
                          : 'Chatbot'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="cluv-body" style={{ fontWeight: 800, color: 'var(--cluv-teal)' }}>
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
        <div className="admin-compliance-box">
          <ShieldCheck size={18} className="cluv-text-teal cluv-flex-shrink-0" />
          <span className="admin-compliance-box-text">
            <strong>Jaminan Kepatuhan UU PDP No. 27/2022</strong>: Matriks korelasi di atas disimpan secara de-identified (tanpa menyertakan nama, email, foto, user ID, atau chat session). Data ini murni mengagregasikan frekuensi hubungan antara jenis masalah kulit dan produk/bahan kosmetik yang dicari masyarakat.
          </span>
        </div>
      </div>
    </div>
  )
}

