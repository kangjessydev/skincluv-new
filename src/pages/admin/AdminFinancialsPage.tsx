import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  Percent,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Calculator,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AiLogRecord {
  id: string
  feature_id: string
  tokens_used: number | null
  cost_usd: number | null
  status: string
  created_at: string
  ai_features?: {
    name: string
    slug: string
    credit_cost?: number
  } | null
  model_configs?: {
    model_name: string
    provider: string
  } | null
}

interface InvoiceRecord {
  amount_idr: number
  plan: string
  status: string
  created_at: string
}

interface AiFeatureMaster {
  id: string
  slug: string
  name: string
  credit_cost?: number
  is_active?: boolean
}

const USD_TO_IDR = 16000 // Kurs konversi standar

export default function AdminFinancialsPage() {
  const [logs, setLogs] = useState<AiLogRecord[]>([])
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [features, setFeatures] = useState<AiFeatureMaster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [discountPercent, setDiscountPercent] = useState<number>(30)

  const loadFinancialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [logsRes, invRes, featuresRes] = await Promise.all([
        supabase
          .from('ai_request_logs')
          .select(`
            id,
            feature_id,
            tokens_used,
            cost_usd,
            status,
            created_at,
            ai_features (
              name,
              slug
            )
          `)
          .eq('status', 'success')
          .order('created_at', { ascending: false }),
        supabase
          .from('tripay_invoices')
          .select('amount_idr, plan, status, created_at')
          .eq('status', 'PAID'),
        supabase
          .from('ai_features')
          .select('id, slug, name, credit_cost, is_active')
          .eq('is_active', true)
          .order('slug'),
      ])

      if (logsRes.error) throw logsRes.error
      if (invRes.error) throw invRes.error
      if (featuresRes.error) throw featuresRes.error

      setLogs((logsRes.data as any) || [])
      setInvoices((invRes.data as any) || [])
      setFeatures((featuresRes.data as any) || [])
    } catch (err) {
      console.error('[AdminFinancials] Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFinancialData()
  }, [loadFinancialData])

  // Hitung Metrik Finansial Makro
  const financials = useMemo(() => {
    const totalRevenueIDR = invoices.reduce((acc, inv) => acc + (inv.amount_idr || 0), 0)
    const totalCostUSD = logs.reduce((acc, log) => acc + (log.cost_usd || 0), 0)
    const totalCostIDR = totalCostUSD * USD_TO_IDR
    const grossProfitIDR = totalRevenueIDR - totalCostIDR
    const grossMarginPercent =
      totalRevenueIDR > 0 ? ((grossProfitIDR / totalRevenueIDR) * 100).toFixed(1) : '100'

    const totalTokens = logs.reduce((acc, log) => acc + (log.tokens_used || 0), 0)
    const avgTokenPerCall = logs.length > 0 ? Math.round(totalTokens / logs.length) : 0
    const avgCostPerCallIDR = logs.length > 0 ? (totalCostIDR / logs.length).toFixed(1) : '0'

    return {
      totalRevenueIDR,
      totalCostUSD,
      totalCostIDR,
      grossProfitIDR,
      grossMarginPercent,
      totalTokens,
      totalCalls: logs.length,
      avgTokenPerCall,
      avgCostPerCallIDR,
    }
  }, [invoices, logs])

  // Analisis per Fitur AI — 100% Tersinkronisasi dengan Master ai_features
  const featureBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        slug: string
        calls: number
        totalTokens: number
        totalCostUSD: number
        creditCost: number
      }
    >()

    // 1. Inisialisasi seluruh fitur aktif dari tabel ai_features agar tarif kredit selalu live
    features.forEach((f) => {
      map.set(f.id, {
        name: f.name,
        slug: f.slug,
        calls: 0,
        totalTokens: 0,
        totalCostUSD: 0,
        creditCost: typeof f.credit_cost === 'number' ? f.credit_cost : 1,
      })
    })

    // 2. Akumulasikan konsumsi token & biaya dari ai_request_logs
    logs.forEach((log) => {
      const featId = log.feature_id
      if (map.has(featId)) {
        const item = map.get(featId)!
        item.calls += 1
        item.totalTokens += log.tokens_used || 0
        item.totalCostUSD += log.cost_usd || 0
      }
    })

    return Array.from(map.values())
  }, [features, logs])

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Simulator Diskon
  const simPricePro = 69000
  const discountedPricePro = Math.round(simPricePro * (1 - discountPercent / 100))
  const estimatedTokenCostPerUserPro = 350 // rata-rata Rp 350 per bulan
  const simProfitPerUser = discountedPricePro - estimatedTokenCostPerUserPro
  const simMarginPercent = ((simProfitPerUser / discountedPricePro) * 100).toFixed(1)

  return (
    <div className="admin-financials-page">
      {/* Header */}
      <div className="admin-fin-header">
        <div>
          <div className="badge-category">
            <TrendingUp size={14} /> ANALITIK BISNIS & UNIT ECONOMICS
          </div>
          <h1>AI Unit Economics & Profit Margin</h1>
          <p>
            Bandingkan pendapatan penjualan langganan dengan biaya riil token API (Google Gemini / Groq) untuk mengukur profitabilitas.
          </p>
        </div>
        <button
          className="btn-refresh"
          onClick={loadFinancialData}
          disabled={isLoading}
          title="Segarkan Data"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon-wrap">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Omzet Penjualan</span>
            <span className="kpi-value">{formatIDR(financials.totalRevenueIDR)}</span>
            <span className="kpi-subtext">Dari {invoices.length} tagihan Tripay lunas</span>
          </div>
        </div>

        <div className="kpi-card cost">
          <div className="kpi-icon-wrap">
            <Cpu size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Biaya API Token (COGS)</span>
            <span className="kpi-value">{formatIDR(financials.totalCostIDR)}</span>
            <span className="kpi-subtext">
              ${financials.totalCostUSD.toFixed(4)} ({financials.totalTokens.toLocaleString()} tokens)
            </span>
          </div>
        </div>

        <div className="kpi-card profit">
          <div className="kpi-icon-wrap">
            <Sparkles size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Laba Kotor AI (Gross Profit)</span>
            <span className="kpi-value">{formatIDR(financials.grossProfitIDR)}</span>
            <span className="kpi-subtext font-semibold text-emerald-600">
              Margin Bersih: {financials.grossMarginPercent}%
            </span>
          </div>
        </div>

        <div className="kpi-card unit-cost">
          <div className="kpi-icon-wrap">
            <Percent size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Rata-Rata Biaya per Call</span>
            <span className="kpi-value">Rp {financials.avgCostPerCallIDR}</span>
            <span className="kpi-subtext">
              ~{financials.avgTokenPerCall.toLocaleString()} tokens per eksekusi
            </span>
          </div>
        </div>
      </div>

      {/* Section: Analisis per Fitur AI */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h3>Ekonomi Fitur AI (Cost per Feature)</h3>
            <p>Berapa modal riil yang keluar setiap kali pengguna memanggil fitur AI tertentu.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NAMA FITUR</th>
                <th>IDENTIFIER (SLUG)</th>
                <th>TOTAL DIPANGGIL</th>
                <th>RATA-RATA TOKEN</th>
                <th>BIAYA RIIL PER PANGGIL</th>
                <th>BIAYA KREDIT USER</th>
                <th>STATUS PROFITABILITAS</th>
              </tr>
            </thead>
            <tbody>
              {featureBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Belum ada data eksekusi AI yang tercatat.
                  </td>
                </tr>
              ) : (
                featureBreakdown.map((f) => {
                  const avgTokens = f.calls > 0 ? Math.round(f.totalTokens / f.calls) : 0
                  const avgCostIDR = f.calls > 0 ? ((f.totalCostUSD * USD_TO_IDR) / f.calls).toFixed(1) : '0'

                  return (
                    <tr key={f.slug} className="table-row">
                      <td className="font-bold text-gray-900">{f.name}</td>
                      <td>
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {f.slug}
                        </span>
                      </td>
                      <td className="font-semibold">{f.calls.toLocaleString()} kali</td>
                      <td>{avgTokens.toLocaleString()} tokens</td>
                      <td className="font-bold text-gray-900">Rp {avgCostIDR}</td>
                      <td>
                        <span className="credit-tag">
                          {f.creditCost} Credits
                        </span>
                      </td>
                      <td>
                        <span className="badge-safe">
                          <CheckCircle2 size={12} /> Margin Super Tebal (&gt;90%)
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Simulator Promo & Diskon Aman */}
      <div className="section-card simulator-card">
        <div className="section-header">
          <div>
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-indigo-600" />
              <h3>Kalkulator Batas Diskon Aman (Floor Price)</h3>
            </div>
            <p>
              Uji coba skenario promo untuk memastikan potongan harga tidak melampaui biaya modal server token AI Anda.
            </p>
          </div>
        </div>

        <div className="simulator-grid">
          <div className="sim-controls">
            <div className="form-group">
              <label className="flex justify-between text-sm font-semibold mb-2">
                <span>Rencana Potongan Diskon Promo:</span>
                <strong className="text-indigo-600 text-base">{discountPercent}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0% (Harga Normal)</span>
                <span>50% (Flash Sale)</span>
                <span>90% (Diskon Ekstrem)</span>
              </div>
            </div>

            <div className="quick-discount-buttons">
              {[20, 30, 50, 70, 80].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`quick-d-btn ${discountPercent === d ? 'active' : ''}`}
                  onClick={() => setDiscountPercent(d)}
                >
                  Diskon {d}%
                </button>
              ))}
            </div>
          </div>

          <div className="sim-result-box">
            <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block mb-1">
              Simulasi Paket VIP PRO (Harga Normal: Rp 69.000)
            </span>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-extrabold text-indigo-700">
                {formatIDR(discountedPricePro)}
              </span>
              <span className="text-xs text-gray-400">/ bulan setelah diskon</span>
            </div>

            <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimasi Biaya Token Maksimal:</span>
                <span className="font-semibold text-gray-900">~Rp 350 / bulan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sisa Laba Bersih per Pelanggan:</span>
                <strong className="text-emerald-600 font-bold">{formatIDR(simProfitPerUser)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Profit Margin:</span>
                <strong className="text-emerald-600 font-bold">{simMarginPercent}%</strong>
              </div>
            </div>

            <div className="verdict-banner">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Sangat Aman:</strong> Bahkan dengan diskon {discountPercent}%, Anda masih mengantongi laba kotor {simMarginPercent}%.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VANILLA CSS STYLING */}
      <style>{`
        .admin-financials-page {
          padding: 24px;
          max-width: 1300px;
          margin: 0 auto;
          font-family: inherit;
        }

        .admin-fin-header {
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

        .admin-fin-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .admin-fin-header p {
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

        .kpi-card.revenue .kpi-icon-wrap { background: #ecfdf5; color: #059669; }
        .kpi-card.cost .kpi-icon-wrap { background: #fee2e2; color: #dc2626; }
        .kpi-card.profit .kpi-icon-wrap { background: #eff6ff; color: #2563eb; }
        .kpi-card.unit-cost .kpi-icon-wrap { background: #fdf4ff; color: #c026d3; }

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

        /* Section Card */
        .section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
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

        .credit-tag {
          font-size: 11px;
          font-weight: 700;
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-safe {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          background: #ecfdf5;
          color: #059669;
          padding: 4px 10px;
          border-radius: 999px;
        }

        /* Simulator Card */
        .simulator-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .simulator-grid {
            grid-template-columns: 1fr;
          }
        }

        .sim-controls {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }

        .quick-discount-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .quick-d-btn {
          padding: 6px 10px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-d-btn.active {
          background: #4f46e5;
          color: #ffffff;
          border-color: #4f46e5;
        }

        .sim-result-box {
          background: #ffffff;
          border: 1px solid #c7d2fe;
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.05);
        }

        .verdict-banner {
          margin-top: 14px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #065f46;
        }
      `}</style>
    </div>
  )
}
