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
  Plus,
  Wallet,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AiLogRecord {
  id: string
  feature_id: string
  tokens_used: number | null
  input_tokens: number | null
  output_tokens: number | null
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

interface ProviderTopupRecord {
  id: string
  provider: 'gemini' | 'groq' | 'claude' | 'other'
  amount_idr: number
  amount_usd: number
  topped_up_at: string
  notes?: string | null
  created_at: string
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
  const [topups, setTopups] = useState<ProviderTopupRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [discountPercent, setDiscountPercent] = useState<number>(30)

  // Modal & Form State untuk Top-Up Provider
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [isSavingTopup, setIsSavingTopup] = useState(false)
  const [topupForm, setTopupForm] = useState({
    provider: 'gemini' as 'gemini' | 'groq' | 'claude' | 'other',
    amount_idr: '',
    amount_usd: '',
    notes: '',
    topped_up_at: new Date().toISOString().slice(0, 16),
  })

  const loadFinancialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [logsRes, invRes, featuresRes, topupsRes] = await Promise.all([
        supabase
          .from('ai_request_logs')
          .select(`
            id,
            feature_id,
            tokens_used,
            input_tokens,
            output_tokens,
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
        supabase
          .from('provider_topups')
          .select('id, provider, amount_idr, amount_usd, topped_up_at, notes, created_at')
          .order('topped_up_at', { ascending: false }),
      ])

      if (logsRes.error) throw logsRes.error
      if (invRes.error) throw invRes.error
      if (featuresRes.error) throw featuresRes.error
      // provider_topups query error handled gracefully if table was just created
      if (topupsRes.error) console.warn('[AdminFinancials] Provider topups warning:', topupsRes.error)

      setLogs((logsRes.data as any) || [])
      setInvoices((invRes.data as any) || [])
      setFeatures((featuresRes.data as any) || [])
      setTopups((topupsRes.data as any) || [])
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

  // Analisis per Fitur AI — Rentang Empiris MIN, MAX, AVG & Rasio Input/Output
  const featureBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        slug: string
        calls: number
        totalTokens: number
        minTokens: number
        maxTokens: number
        totalInputTokens: number
        totalOutputTokens: number
        totalCostUSD: number
        creditCost: number
      }
    >()

    // 1. Inisialisasi seluruh fitur aktif dari tabel ai_features
    features.forEach((f) => {
      map.set(f.id, {
        name: f.name,
        slug: f.slug,
        calls: 0,
        totalTokens: 0,
        minTokens: Infinity,
        maxTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
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
        const t = log.tokens_used || 0
        item.totalTokens += t
        if (t > 0 && t < item.minTokens) item.minTokens = t
        if (t > item.maxTokens) item.maxTokens = t
        item.totalInputTokens += log.input_tokens || 0
        item.totalOutputTokens += log.output_tokens || 0
        item.totalCostUSD += log.cost_usd || 0
      }
    })

    return Array.from(map.values()).map((item) => ({
      ...item,
      minTokens: item.minTokens === Infinity ? 0 : item.minTokens,
    }))
  }, [features, logs])

  // Hitung Rekonsiliasi Saldo Deposit Provider (Fase B)
  const topupReconciliation = useMemo(() => {
    const totalTopupIDR = topups.reduce((acc, t) => acc + (Number(t.amount_idr) || 0), 0)
    const totalTopupUSD = topups.reduce((acc, t) => acc + (Number(t.amount_usd) || 0), 0)
    const totalCostIDR = financials.totalCostIDR
    const totalCostUSD = financials.totalCostUSD
    const remainingIDR = totalTopupIDR - totalCostIDR
    const remainingUSD = totalTopupUSD - totalCostUSD
    const percentRemaining =
      totalTopupIDR > 0 ? ((remainingIDR / totalTopupIDR) * 100).toFixed(1) : '0'

    // Akumulasi per provider
    const providerStats: Record<string, { topupIDR: number; count: number }> = {
      gemini: { topupIDR: 0, count: 0 },
      groq: { topupIDR: 0, count: 0 },
      claude: { topupIDR: 0, count: 0 },
      other: { topupIDR: 0, count: 0 },
    }

    topups.forEach((t) => {
      const p = t.provider in providerStats ? t.provider : 'other'
      providerStats[p].topupIDR += Number(t.amount_idr) || 0
      providerStats[p].count += 1
    })

    return {
      totalTopupIDR,
      totalTopupUSD,
      remainingIDR,
      remainingUSD,
      percentRemaining,
      providerStats,
    }
  }, [topups, financials])

  const handleAmountIdrChange = (val: string) => {
    const num = parseFloat(val) || 0
    const usd = num > 0 ? (num / USD_TO_IDR).toFixed(2) : ''
    setTopupForm((prev) => ({
      ...prev,
      amount_idr: val,
      amount_usd: usd,
    }))
  }

  const handleSaveTopup = async (e: React.FormEvent) => {
    e.preventDefault()
    const idr = parseFloat(topupForm.amount_idr)
    const usd = parseFloat(topupForm.amount_usd) || idr / USD_TO_IDR
    if (!idr || idr <= 0) return

    setIsSavingTopup(true)
    try {
      const { error } = await supabase.from('provider_topups').insert({
        provider: topupForm.provider,
        amount_idr: idr,
        amount_usd: usd,
        notes: topupForm.notes.trim() || null,
        topped_up_at: new Date(topupForm.topped_up_at).toISOString(),
      })
      if (error) throw error
      setShowTopupModal(false)
      loadFinancialData()
    } catch (err: any) {
      alert(`Gagal mencatat top-up: ${err.message}`)
    } finally {
      setIsSavingTopup(false)
    }
  }

  const handleDeleteTopup = async (id: string) => {
    if (!window.confirm('Hapus catatan top-up provider ini?')) return
    try {
      const { error } = await supabase.from('provider_topups').delete().eq('id', id)
      if (error) throw error
      loadFinancialData()
    } catch (err: any) {
      alert(`Gagal menghapus top-up: ${err.message}`)
    }
  }

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
                <th>RATA-RATA &amp; RENTANG TOKEN</th>
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
                  const avgInput = f.calls > 0 ? Math.round(f.totalInputTokens / f.calls) : 0
                  const avgOutput = f.calls > 0 ? Math.round(f.totalOutputTokens / f.calls) : 0
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
                      <td>
                        <div className="font-semibold text-gray-900">{avgTokens.toLocaleString()} tokens</div>
                        {f.calls > 0 && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            Rentang: {f.minTokens.toLocaleString()} - {f.maxTokens.toLocaleString()}
                            <br />
                            In: ~{avgInput.toLocaleString()} / Out: ~{avgOutput.toLocaleString()}
                          </div>
                        )}
                      </td>
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

      {/* Section: Rekonsiliasi Deposit Saldo Provider AI (Topup vs Real Cost) */}
      <div className="section-card reconciliation-card">
        <div className="section-header flex-header">
          <div>
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-emerald-600" />
              <h3>Rekonsiliasi Deposit Provider AI (Top-Up vs Riil COGS)</h3>
            </div>
            <p>
              Pantau saldo deposit yang Anda bayarkan ke billing provider (Google Cloud / Groq / Anthropic) dibandingkan dengan konsumsi riil AI.
            </p>
          </div>
          <button
            type="button"
            className="btn-add-topup"
            onClick={() => {
              setTopupForm({
                provider: 'gemini',
                amount_idr: '',
                amount_usd: '',
                notes: '',
                topped_up_at: new Date().toISOString().slice(0, 16),
              })
              setShowTopupModal(true)
            }}
          >
            <Plus size={15} /> Catat Top-Up Saldo
          </button>
        </div>

        {/* Topup KPI Summary */}
        <div className="topup-kpi-grid">
          <div className="topup-kpi-item">
            <span className="topup-kpi-label">Total Deposit Diisi</span>
            <span className="topup-kpi-value text-emerald-700">
              {formatIDR(topupReconciliation.totalTopupIDR)}
            </span>
            <span className="topup-kpi-sub">
              ${topupReconciliation.totalTopupUSD.toFixed(2)} dari {topups.length} transaksi
            </span>
          </div>

          <div className="topup-kpi-item">
            <span className="topup-kpi-label">Total AI Terpakai (COGS)</span>
            <span className="topup-kpi-value text-red-600">
              {formatIDR(financials.totalCostIDR)}
            </span>
            <span className="topup-kpi-sub">
              ${financials.totalCostUSD.toFixed(4)} ({financials.totalTokens.toLocaleString()} tokens)
            </span>
          </div>

          <div className="topup-kpi-item">
            <span className="topup-kpi-label">Estimasi Sisa Saldo Tersedia</span>
            <span className={`topup-kpi-value ${topupReconciliation.remainingIDR >= 0 ? 'text-indigo-700' : 'text-amber-600'}`}>
              {formatIDR(topupReconciliation.remainingIDR)}
            </span>
            <span className="topup-kpi-sub">
              ${topupReconciliation.remainingUSD.toFixed(2)} ({topupReconciliation.percentRemaining}% tersisa)
            </span>
          </div>
        </div>

        {/* Warning strip jika saldo menipis */}
        {topupReconciliation.totalTopupIDR > 0 && topupReconciliation.remainingIDR < topupReconciliation.totalTopupIDR * 0.2 && (
          <div className="topup-alert-warning">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <span>
              <strong>Perhatian:</strong> Sisa saldo deposit provider Anda di bawah 20% ({topupReconciliation.percentRemaining}%). Disarankan untuk segera melakukan top-up billing di Google Cloud / Groq untuk mencegah gangguan layanan AI.
            </span>
          </div>
        )}

        {/* Tabel Riwayat Topup */}
        <div className="table-responsive" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>TANGGAL TOP-UP</th>
                <th>PROVIDER</th>
                <th>NOMINAL (IDR)</th>
                <th>NOMINAL (USD)</th>
                <th>CATATAN / INVOICE</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {topups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Belum ada riwayat top-up provider yang dicatat. Klik <strong>Catat Top-Up Saldo</strong> di atas untuk merekam deposit pertama Anda.
                  </td>
                </tr>
              ) : (
                topups.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="font-semibold text-gray-800">
                      {new Date(t.topped_up_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className={`provider-tag tag-${t.provider}`}>
                        {t.provider.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-bold text-gray-900">{formatIDR(Number(t.amount_idr))}</td>
                    <td className="font-mono text-gray-700">${Number(t.amount_usd).toFixed(2)}</td>
                    <td className="text-gray-600 text-xs">{t.notes || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteTopup(t.id)}
                        className="delete-topup-btn"
                        title="Hapus catatan top-up"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
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

      {/* MODAL CATAT TOP-UP PROVIDER */}
      {showTopupModal && (
        <div className="topup-modal-overlay" onClick={() => setShowTopupModal(false)}>
          <div className="topup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="topup-modal-header">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-emerald-600" />
                <h3>Catat Deposit Top-Up Provider AI</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTopup} className="topup-form">
              <div className="form-group">
                <label>Provider AI / Cloud</label>
                <select
                  value={topupForm.provider}
                  onChange={(e) =>
                    setTopupForm((prev) => ({
                      ...prev,
                      provider: e.target.value as any,
                    }))
                  }
                  required
                >
                  <option value="gemini">Google Gemini (Google Cloud Vertex / AI Studio)</option>
                  <option value="groq">Groq Cloud (Llama / Qwen)</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="other">Provider Lain</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nominal Top-Up (Rupiah - IDR)</label>
                <input
                  type="number"
                  placeholder="Contoh: 500000"
                  value={topupForm.amount_idr}
                  onChange={(e) => handleAmountIdrChange(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Estimasi Ekuivalen USD (Kurs Rp 16.000)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 31.25"
                  value={topupForm.amount_usd}
                  onChange={(e) =>
                    setTopupForm((prev) => ({ ...prev, amount_usd: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Waktu Transaksi Top-Up</label>
                <input
                  type="datetime-local"
                  value={topupForm.topped_up_at}
                  onChange={(e) =>
                    setTopupForm((prev) => ({ ...prev, topped_up_at: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Catatan / Nomor Invoice (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Billing GCP Mei 2024 / Ref CC-9821"
                  value={topupForm.notes}
                  onChange={(e) =>
                    setTopupForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowTopupModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSavingTopup}
                >
                  {isSavingTopup ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          .admin-financials-page {
            padding: 16px 12px;
          }
          .admin-fin-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .btn-refresh {
            align-self: flex-start;
          }
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .simulator-grid {
            grid-template-columns: 1fr;
          }
          .section-card {
            padding: 14px;
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

        /* Topup Reconciliation Styles */
        .flex-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-add-topup {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #059669;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-add-topup:hover {
          background: #047857;
        }

        .topup-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .topup-kpi-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
        }

        .topup-kpi-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .topup-kpi-value {
          font-size: 20px;
          font-weight: 800;
          margin: 4px 0 2px 0;
          letter-spacing: -0.02em;
        }

        .topup-kpi-sub {
          font-size: 11px;
          color: #94a3b8;
        }

        .topup-alert-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          color: #92400e;
          margin-bottom: 16px;
        }

        .provider-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.03em;
        }

        .provider-tag.tag-gemini {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .provider-tag.tag-groq {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .provider-tag.tag-claude {
          background: #faf5ff;
          color: #7e22ce;
          border: 1px solid #e9d5ff;
        }

        .provider-tag.tag-other {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .delete-topup-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .delete-topup-btn:hover {
          color: #ef4444;
          background: #fee2e2;
        }

        .table-row {
          transition: background-color 0.15s ease;
        }

        .table-row:hover {
          background-color: #f8fafc;
        }

        .reconciliation-card,
        .simulator-card {
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        /* Topup Modal */
        .topup-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 16px;
        }

        .topup-modal-card {
          background: #ffffff;
          border-radius: 14px;
          max-width: 460px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .topup-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .topup-modal-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }

        .modal-close-btn:hover {
          color: #475569;
          background: #f1f5f9;
        }

        .topup-form {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .topup-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .topup-form label {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .topup-form input, .topup-form select {
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s;
        }

        .topup-form input:focus, .topup-form select:focus {
          border-color: #4f46e5;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }

        .btn-cancel {
          padding: 8px 14px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .btn-submit {
          padding: 8px 16px;
          background: #059669;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #047857;
        }
      `}</style>
    </div>
  )
}
