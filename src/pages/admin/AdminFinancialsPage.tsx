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
  CreditCard,
  Building,
  Layers,
  Clock,
  ArrowRight,
  Pencil,
  Tag,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AiLogRecord {
  id: string
  feature_id: string
  provider_id: string | null
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
}

interface AiProvider {
  id: string
  name: string
  category: 'llm' | 'search' | 'email' | 'infra' | 'marketing' | 'other'
  billing_type: 'postpaid_credit' | 'prepaid_usd' | 'prepaid_tokens'
  currency: string
  is_active: boolean
  website_url?: string | null
}

interface ProviderDepositRecord {
  id: string
  provider_id: string
  amount_paid_idr: number
  credited_amount_usd: number
  credited_tokens: number
  effective_rate_idr: number | null
  invoice_number: string | null
  payment_method: string | null
  deposited_at: string
  notes?: string | null
  created_at: string
  ai_providers?: {
    name: string
    billing_type: string
    category: string
  } | null
}

interface ProviderBalanceRecord {
  provider_id: string
  provider_name: string
  billing_type: string
  currency: string
  total_paid_idr: number
  total_credited_usd: number
  total_credited_tokens: number
  total_cost_usd: number
  total_tokens_used: number
  remaining_balance: number | null
  average_effective_rate_idr: number | null
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

const USD_TO_IDR = 16000 // Kurs acuan standar untuk estimasi

export default function AdminFinancialsPage() {
  const [logs, setLogs] = useState<AiLogRecord[]>([])
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [features, setFeatures] = useState<AiFeatureMaster[]>([])
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [deposits, setDeposits] = useState<ProviderDepositRecord[]>([])
  const [balances, setBalances] = useState<ProviderBalanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [discountPercent, setDiscountPercent] = useState<number>(30)

  // Filter & Toast Feedback State
  const [depositFilter, setDepositFilter] = useState<string>('all')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal & Form State untuk Deposit Provider (Tambah & Edit)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null)
  const [isSavingTopup, setIsSavingTopup] = useState(false)
  const [topupForm, setTopupForm] = useState({
    provider_id: 'google',
    amount_paid_idr: '',
    credited_amount_usd: '',
    credited_tokens: '',
    invoice_number: '',
    payment_method: 'Kartu Kredit Bisnis',
    deposited_at: new Date().toISOString().slice(0, 16),
    notes: '',
  })

  // Modal & Form State untuk Daftarkan Vendor Baru (Accounting / Non-Runtime)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [isSavingVendor, setIsSavingVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({
    id: '',
    name: '',
    category: 'marketing' as 'llm' | 'search' | 'email' | 'infra' | 'marketing' | 'other',
    billing_type: 'prepaid_usd' as 'prepaid_usd' | 'prepaid_tokens' | 'postpaid_credit',
    website_url: '',
  })

  // Auto-dismiss floating feedback toast
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const loadFinancialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [logsRes, invRes, featuresRes, providersRes, depositsRes, balancesRes] = await Promise.all([
        supabase
          .from('ai_request_logs')
          .select(`
            id,
            feature_id,
            provider_id,
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
          .from('ai_providers')
          .select('id, name, billing_type, category, currency, is_active, website_url')
          .order('name'),
        supabase
          .from('provider_deposits')
          .select(`
            id,
            provider_id,
            amount_paid_idr,
            credited_amount_usd,
            credited_tokens,
            effective_rate_idr,
            invoice_number,
            payment_method,
            deposited_at,
            notes,
            created_at,
            ai_providers (
              name,
              billing_type,
              category
            )
          `)
          .order('deposited_at', { ascending: false }),
        supabase
          .from('provider_balances')
          .select('*'),
      ])

      if (logsRes.error) throw logsRes.error
      if (invRes.error) throw invRes.error
      if (featuresRes.error) throw featuresRes.error
      if (providersRes.error) throw providersRes.error
      if (depositsRes.error) throw depositsRes.error
      if (balancesRes.error) throw balancesRes.error

      setLogs((logsRes.data as any) || [])
      setInvoices((invRes.data as any) || [])
      setFeatures((featuresRes.data as any) || [])
      setProviders((providersRes.data as any) || [])
      setDeposits((depositsRes.data as any) || [])
      setBalances((balancesRes.data as any) || [])
    } catch (err: any) {
      console.error('[AdminFinancials] Error loading data:', err)
      setFeedback({ type: 'error', message: `Gagal memuat data finansial: ${err.message}` })
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

  // Analisis per Fitur AI
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

  // Engine Analisis Multi-Provider & Runway AI
  const providerAnalytics = useMemo(() => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 86400000
    const thirtyDaysAgo = now - 30 * 86400000

    let totalDepositPaidIDR = 0
    let totalCreditedUSD = 0
    let totalUsedUSD = 0
    let totalRemainingUSD = 0

    const cards = providers.map((provider) => {
      const bal = balances.find((b) => b.provider_id === provider.id)
      const paidIdr = bal ? Number(bal.total_paid_idr) : 0
      const creditedUsd = bal ? Number(bal.total_credited_usd) : 0
      const creditedTokens = bal ? Number(bal.total_credited_tokens) : 0
      const usedUsd = bal ? Number(bal.total_cost_usd) : 0
      const usedTokens = bal ? Number(bal.total_tokens_used) : 0
      const remainingBalance =
        bal?.remaining_balance !== null && bal?.remaining_balance !== undefined
          ? Number(bal.remaining_balance)
          : creditedUsd - usedUsd
      const avgRate =
        bal?.average_effective_rate_idr && Number(bal.average_effective_rate_idr) > 0
          ? Number(bal.average_effective_rate_idr)
          : USD_TO_IDR

      totalDepositPaidIDR += paidIdr
      totalCreditedUSD += creditedUsd
      totalUsedUSD += usedUsd
      totalRemainingUSD += remainingBalance

      const providerLogs = logs.filter((l) => l.provider_id === provider.id)
      const totalCalls = providerLogs.length

      const logs7d = providerLogs.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo)
      const burn7dUsd = logs7d.reduce((sum, l) => sum + (l.cost_usd || 0), 0)
      const burn7dTokens = logs7d.reduce((sum, l) => sum + (l.tokens_used || 0), 0)
      const dailyBurnUsd = burn7dUsd / 7
      const dailyBurnTokens = burn7dTokens / 7

      const logs30d = providerLogs.filter((l) => new Date(l.created_at).getTime() >= thirtyDaysAgo)
      const burn30dUsd = logs30d.reduce((sum, l) => sum + (l.cost_usd || 0), 0)

      let runwayDays: number | null = null
      let runwayStatus: 'healthy' | 'warning' | 'critical' | 'exhausted' | 'idle' = 'idle'
      let runwayLabel = 'Belum Ada Pemakaian 7 Hari'

      if (provider.billing_type === 'prepaid_usd') {
        if (remainingBalance <= 0 && usedUsd > 0) {
          runwayDays = 0
          runwayStatus = 'exhausted'
          runwayLabel = 'Saldo Minus / Habis'
        } else if (remainingBalance <= 0 && creditedUsd === 0) {
          runwayDays = 0
          runwayStatus = 'exhausted'
          runwayLabel = 'Belum Ada Deposit'
        } else if (dailyBurnUsd > 0) {
          runwayDays = Math.floor(remainingBalance / dailyBurnUsd)
          if (runwayDays <= 7) {
            runwayStatus = 'critical'
            runwayLabel = `Kritis (~${runwayDays} hari)`
          } else if (runwayDays <= 21) {
            runwayStatus = 'warning'
            runwayLabel = `Perhatian (~${runwayDays} hari)`
          } else {
            runwayStatus = 'healthy'
            runwayLabel = `Aman (~${runwayDays} hari)`
          }
        } else if (creditedUsd > 0) {
          runwayStatus = 'healthy'
          runwayLabel = 'Aman (Burn $0 / Hari)'
        }
      } else if (provider.billing_type === 'prepaid_tokens') {
        const remainingTokens = creditedTokens - usedTokens
        if (remainingTokens <= 0) {
          runwayDays = 0
          runwayStatus = 'exhausted'
          runwayLabel = 'Token Habis'
        } else if (dailyBurnTokens > 0) {
          runwayDays = Math.floor(remainingTokens / dailyBurnTokens)
          if (runwayDays <= 7) {
            runwayStatus = 'critical'
            runwayLabel = `Kritis (~${runwayDays} hari)`
          } else if (runwayDays <= 21) {
            runwayStatus = 'warning'
            runwayLabel = `Perhatian (~${runwayDays} hari)`
          } else {
            runwayStatus = 'healthy'
            runwayLabel = `Aman (~${runwayDays} hari)`
          }
        }
      } else {
        runwayStatus = 'idle'
        runwayLabel = 'Postpaid (Billing Bulanan)'
      }

      const remainingIdr = remainingBalance * avgRate
      const percentUsed =
        creditedUsd > 0 ? Math.min(100, Math.round((usedUsd / creditedUsd) * 100)) : 0

      return {
        provider,
        paidIdr,
        creditedUsd,
        creditedTokens,
        usedUsd,
        usedTokens,
        remainingBalance,
        remainingIdr,
        avgRate,
        totalCalls,
        dailyBurnUsd,
        burn7dUsd,
        burn30dUsd,
        runwayDays,
        runwayStatus,
        runwayLabel,
        percentUsed,
      }
    })

    return {
      cards,
      totalDepositPaidIDR,
      totalCreditedUSD,
      totalUsedUSD,
      totalRemainingUSD,
      totalRemainingIDR: totalRemainingUSD * USD_TO_IDR,
    }
  }, [providers, balances, logs])

  // Live Exchange Rate Calculator di Modal Deposit
  const modalLiveEffectiveRate = useMemo(() => {
    const idr = parseFloat(topupForm.amount_paid_idr) || 0
    const usd = parseFloat(topupForm.credited_amount_usd) || 0
    if (idr > 0 && usd > 0) {
      return Math.round(idr / usd)
    }
    return null
  }, [topupForm.amount_paid_idr, topupForm.credited_amount_usd])

  // Selected provider helper
  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === topupForm.provider_id)
  }, [providers, topupForm.provider_id])

  // Handler auto-sugesti USD saat input IDR
  const handleAmountIdrChange = (val: string) => {
    const idr = parseFloat(val) || 0
    const currentUsd = parseFloat(topupForm.credited_amount_usd) || 0
    setTopupForm((prev) => ({
      ...prev,
      amount_paid_idr: val,
      credited_amount_usd:
        currentUsd === 0 || prev.amount_paid_idr === ''
          ? idr > 0
            ? (idr / USD_TO_IDR).toFixed(2)
            : ''
          : prev.credited_amount_usd,
    }))
  }

  // Buka Modal Tambah Baru
  const handleOpenCreateDeposit = () => {
    setEditingDepositId(null)
    setTopupForm({
      provider_id: providers[0]?.id || 'google',
      amount_paid_idr: '',
      credited_amount_usd: '',
      credited_tokens: '',
      invoice_number: '',
      payment_method: 'Kartu Kredit Bisnis',
      deposited_at: new Date().toISOString().slice(0, 16),
      notes: '',
    })
    setShowTopupModal(true)
  }

  // Buka Modal Edit Transaksi
  const handleOpenEditDeposit = (deposit: ProviderDepositRecord) => {
    setEditingDepositId(deposit.id)
    setTopupForm({
      provider_id: deposit.provider_id,
      amount_paid_idr: deposit.amount_paid_idr ? deposit.amount_paid_idr.toString() : '',
      credited_amount_usd: deposit.credited_amount_usd ? deposit.credited_amount_usd.toString() : '',
      credited_tokens: deposit.credited_tokens ? deposit.credited_tokens.toString() : '',
      invoice_number: deposit.invoice_number || '',
      payment_method: deposit.payment_method || 'Kartu Kredit Bisnis',
      deposited_at: new Date(deposit.deposited_at).toISOString().slice(0, 16),
      notes: deposit.notes || '',
    })
    setShowTopupModal(true)
  }

  // Handler Simpan Deposit (Insert atau Update)
  const handleSaveTopup = async (e: React.FormEvent) => {
    e.preventDefault()
    const idr = parseFloat(topupForm.amount_paid_idr)
    const usd = parseFloat(topupForm.credited_amount_usd) || 0
    const tokens = parseInt(topupForm.credited_tokens) || 0

    if (!idr || idr <= 0) {
      setFeedback({ type: 'error', message: 'Nominal pembayaran IDR wajib lebih besar dari 0' })
      return
    }

    if (usd <= 0 && tokens <= 0) {
      setFeedback({
        type: 'error',
        message: 'Masukkan minimal salah satu dari Saldo USD atau Kuota Token yang didapat',
      })
      return
    }

    setIsSavingTopup(true)
    try {
      if (editingDepositId) {
        const { error } = await supabase
          .from('provider_deposits')
          .update({
            provider_id: topupForm.provider_id,
            amount_paid_idr: idr,
            credited_amount_usd: usd,
            credited_tokens: tokens,
            invoice_number: topupForm.invoice_number.trim() || null,
            payment_method: topupForm.payment_method.trim() || null,
            notes: topupForm.notes.trim() || null,
            deposited_at: new Date(topupForm.deposited_at).toISOString(),
          })
          .eq('id', editingDepositId)

        if (error) {
          if (error.code === '23505' && error.message?.includes('invoice_number')) {
            throw new Error(
              `Nomor invoice "${topupForm.invoice_number}" sudah pernah dicatat sebelumnya. Gunakan nomor invoice yang unik.`
            )
          }
          throw error
        }

        setFeedback({ type: 'success', message: 'Catatan deposit berhasil diperbarui' })
      } else {
        const { error } = await supabase.from('provider_deposits').insert({
          provider_id: topupForm.provider_id,
          amount_paid_idr: idr,
          credited_amount_usd: usd,
          credited_tokens: tokens,
          invoice_number: topupForm.invoice_number.trim() || null,
          payment_method: topupForm.payment_method.trim() || null,
          notes: topupForm.notes.trim() || null,
          deposited_at: new Date(topupForm.deposited_at).toISOString(),
        })

        if (error) {
          if (error.code === '23505' && error.message?.includes('invoice_number')) {
            throw new Error(
              `Nomor invoice "${topupForm.invoice_number}" sudah pernah dicatat sebelumnya. Gunakan nomor invoice yang unik.`
            )
          }
          throw error
        }

        setFeedback({ type: 'success', message: 'Deposit provider berhasil disimpan ke pembukuan' })
      }

      setShowTopupModal(false)
      loadFinancialData()
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan deposit provider AI',
      })
    } finally {
      setIsSavingTopup(false)
    }
  }

  // Handler Hapus Deposit
  const handleDeleteTopup = async (id: string) => {
    if (!window.confirm('Hapus catatan deposit provider ini dari pembukuan?')) return
    try {
      const { error } = await supabase.from('provider_deposits').delete().eq('id', id)
      if (error) throw error
      setFeedback({ type: 'success', message: 'Catatan deposit berhasil dihapus' })
      loadFinancialData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Gagal menghapus deposit: ${err.message}` })
    }
  }

  // Handler Daftarkan Vendor Baru (Kategori Accounting / Non-Runtime)
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    const slug = vendorForm.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!slug) {
      setFeedback({
        type: 'error',
        message: 'Identifier Vendor (slug) wajib diisi huruf kecil tanpa spasi (contoh: midjourney, resend)',
      })
      return
    }
    if (!vendorForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Nama Vendor wajib diisi' })
      return
    }

    setIsSavingVendor(true)
    try {
      const { error } = await supabase.from('ai_providers').insert({
        id: slug,
        name: vendorForm.name.trim(),
        category: vendorForm.category,
        billing_type: vendorForm.billing_type,
        currency: 'USD',
        website_url: vendorForm.website_url.trim() || null,
        is_active: true,
      })

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Vendor dengan identifier "${slug}" sudah terdaftar.`)
        }
        throw error
      }

      setShowVendorModal(false)
      setFeedback({
        type: 'success',
        message: `Vendor "${vendorForm.name}" berhasil didaftarkan ke registri pembukuan`,
      })
      loadFinancialData()
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal mendaftarkan vendor baru',
      })
    } finally {
      setIsSavingVendor(false)
    }
  }

  // Filter Riwayat Deposit
  const filteredDeposits = useMemo(() => {
    if (depositFilter === 'all') return deposits
    return deposits.filter((d) => d.provider_id === depositFilter)
  }, [deposits, depositFilter])

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
  const estimatedTokenCostPerUserPro = 350
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
          <h1>AI Unit Economics & Multi-Provider Accounting</h1>
          <p>
            Bandingkan pendapatan penjualan langganan dengan biaya modal token API riil, lacak deposit kas ke Google/Groq/DeepSeek, dan pantau daya tahan runway.
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

      {/* Section: Rekonsiliasi & Runway Saldo Multi-Provider AI */}
      <div className="section-card multi-provider-section">
        <div className="section-header flex-header">
          <div>
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-emerald-600" />
              <h3>Rekonsiliasi Saldo &amp; Runway Multi-Provider AI</h3>
            </div>
            <p>
              Lacak uang riil (IDR) yang disetor ke setiap provider AI, saldo kredit (USD/Token) yang diperoleh, laju bakar 7 hari, dan estimasi daya tahan runway sebelum layanan habis.
            </p>
          </div>
          <div className="header-action-group">
            <button
              type="button"
              className="btn-add-vendor"
              onClick={() => {
                setVendorForm({
                  id: '',
                  name: '',
                  category: 'marketing',
                  billing_type: 'prepaid_usd',
                  website_url: '',
                })
                setShowVendorModal(true)
              }}
              title="Daftarkan vendor operasional non-runtime (Midjourney, Resend, Supabase)"
            >
              <Building size={14} /> Daftarkan Vendor Baru
            </button>
            <button
              type="button"
              className="btn-add-topup"
              onClick={handleOpenCreateDeposit}
            >
              <Plus size={15} /> Catat Deposit Provider
            </button>
          </div>
        </div>

        {/* Macro Summary Strip for Multi-Provider */}
        <div className="provider-macro-grid">
          <div className="provider-macro-item">
            <span className="macro-label">Total Modal Disetor (IDR)</span>
            <span className="macro-value text-emerald-700">
              {formatIDR(providerAnalytics.totalDepositPaidIDR)}
            </span>
            <span className="macro-sub">Dari {deposits.length} catatan deposit tersimpan</span>
          </div>

          <div className="provider-macro-item">
            <span className="macro-label">Total Saldo Masuk (USD)</span>
            <span className="macro-value text-slate-800">
              ${providerAnalytics.totalCreditedUSD.toFixed(2)}
            </span>
            <span className="macro-sub">Akumulasi kredit USD di console provider</span>
          </div>

          <div className="provider-macro-item">
            <span className="macro-label">Total Pemakaian Riil (USD)</span>
            <span className="macro-value text-red-600">
              ${providerAnalytics.totalUsedUSD.toFixed(4)}
            </span>
            <span className="macro-sub">
              ~{formatIDR(providerAnalytics.totalUsedUSD * USD_TO_IDR)} (riil COGS server)
            </span>
          </div>

          <div className="provider-macro-item">
            <span className="macro-label">Sisa Saldo Tersedia</span>
            <span
              className={`macro-value ${
                providerAnalytics.totalRemainingUSD >= 0 ? 'text-indigo-700' : 'text-amber-600'
              }`}
            >
              ${providerAnalytics.totalRemainingUSD.toFixed(2)}
            </span>
            <span className="macro-sub">
              ~{formatIDR(providerAnalytics.totalRemainingIDR)} (gabungan semua provider)
            </span>
          </div>
        </div>

        {/* Alert jika ada provider dengan saldo kritis atau minus */}
        {providerAnalytics.cards.some(
          (c) =>
            (c.runwayStatus === 'critical' || c.runwayStatus === 'exhausted') &&
            c.usedUsd > 0 &&
            c.remainingBalance <= 0
        ) && (
          <div className="topup-alert-warning">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <span>
              <strong>Perhatian Kritis:</strong> Ditemukan provider dengan saldo minus atau habis yang sedang memiliki pemakaian aktif. Segera lakukan pengisian deposit kas untuk mencegah pemutusan API oleh provider.
            </span>
          </div>
        )}

        {/* Multi-Provider Cards Grid */}
        <div className="provider-cards-grid">
          {providerAnalytics.cards.map((card) => {
            const isCritical = card.runwayStatus === 'critical' || card.runwayStatus === 'exhausted'
            const isHealthy = card.runwayStatus === 'healthy'
            const isWarning = card.runwayStatus === 'warning'

            return (
              <div
                key={card.provider.id}
                className={`provider-balance-card ${
                  isCritical && card.usedUsd > 0 ? 'border-critical' : ''
                }`}
              >
                {/* Card Header */}
                <div className="provider-card-header">
                  <div>
                    <h4 className="provider-title">{card.provider.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="provider-id-tag font-mono">{card.provider.id}</span>
                      <span className="provider-cat-tag font-mono">{card.provider.category.toUpperCase()}</span>
                    </div>
                  </div>
                  <span className={`billing-badge ${card.provider.billing_type}`}>
                    {card.provider.billing_type === 'prepaid_usd' && 'Prepaid USD'}
                    {card.provider.billing_type === 'prepaid_tokens' && 'Token Pack'}
                    {card.provider.billing_type === 'postpaid_credit' && 'Postpaid'}
                  </span>
                </div>

                {/* Balance Display */}
                <div className="provider-balance-row">
                  <div>
                    <span className="balance-caption">Sisa Saldo Tersedia</span>
                    <div
                      className={`balance-amount ${
                        card.remainingBalance >= 0 ? 'text-slate-900' : 'text-red-600'
                      }`}
                    >
                      ${card.remainingBalance.toFixed(2)}
                    </div>
                    <span className="balance-subtext">
                      ~{formatIDR(card.remainingIdr)} (kurs Rp {Math.round(card.avgRate).toLocaleString('id-ID')})
                    </span>
                  </div>

                  <div className="runway-badge-wrap">
                    <span
                      className={`runway-badge ${
                        isCritical
                          ? 'status-critical'
                          : isWarning
                          ? 'status-warning'
                          : isHealthy
                          ? 'status-healthy'
                          : 'status-idle'
                      }`}
                    >
                      <Clock size={12} />
                      {card.runwayLabel}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Konsumsi vs Deposit */}
                <div className="consumption-progress-wrap">
                  <div className="progress-labels">
                    <span>
                      Deposit: ${card.creditedUsd.toFixed(2)} ({formatIDR(card.paidIdr)})
                    </span>
                    <span>Terpakai: ${card.usedUsd.toFixed(4)}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${
                        isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${card.percentUsed}%` }}
                    />
                  </div>
                </div>

                {/* Detail Metrics Row */}
                <div className="provider-metrics-grid">
                  <div className="p-metric">
                    <span className="p-metric-label">Burn Rate 7 Hari</span>
                    <span className="p-metric-val font-mono">
                      ${card.dailyBurnUsd.toFixed(4)} / hari
                    </span>
                  </div>

                  <div className="p-metric">
                    <span className="p-metric-label">Total Panggilan AI</span>
                    <span className="p-metric-val">{card.totalCalls.toLocaleString()} calls</span>
                  </div>

                  <div className="p-metric">
                    <span className="p-metric-label">Estimasi 30 Hari</span>
                    <span className="p-metric-val font-mono">
                      ${card.burn30dUsd.toFixed(3)}
                    </span>
                  </div>

                  <div className="p-metric">
                    <span className="p-metric-label">Kurs Rata-Rata</span>
                    <span className="p-metric-val font-mono">
                      Rp {Math.round(card.avgRate).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Token breakdown jika ada */}
                {(card.creditedTokens > 0 || card.usedTokens > 0) && (
                  <div className="provider-token-strip">
                    <span>
                      Token Terpakai: <strong>{card.usedTokens.toLocaleString()}</strong>
                    </span>
                    {card.creditedTokens > 0 && (
                      <span>
                        / Deposit: {card.creditedTokens.toLocaleString()} tokens
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Section: Riwayat Deposit Transaksi Pembayaran */}
        <div className="deposit-history-container">
          <div className="deposit-history-header">
            <div>
              <h4>Riwayat Deposit Provider AI &amp; Vendor Operasional</h4>
              <p>Daftar transaksi pembayaran riil ke penyedia layanan beserta kurs efektif.</p>
            </div>

            {/* Filter Tabs Provider */}
            <div className="deposit-filter-tabs">
              <button
                type="button"
                className={`filter-tab ${depositFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDepositFilter('all')}
              >
                Semua ({deposits.length})
              </button>
              {providers.map((p) => {
                const count = deposits.filter((d) => d.provider_id === p.id).length
                if (count === 0 && !['google', 'groq', 'deepseek', 'anthropic'].includes(p.id)) return null
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`filter-tab ${depositFilter === p.id ? 'active' : ''}`}
                    onClick={() => setDepositFilter(p.id)}
                  >
                    {p.name.split(' ')[0]} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TANGGAL DEPOSIT</th>
                  <th>PROVIDER / VENDOR</th>
                  <th>PEMBAYARAN (IDR)</th>
                  <th>SALDO DITERIMA (USD / TOKEN)</th>
                  <th>KURS EFEKTIF RIIL</th>
                  <th>INVOICE &amp; METODE</th>
                  <th>CATATAN</th>
                  <th style={{ textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      {depositFilter === 'all'
                        ? 'Belum ada riwayat deposit provider yang dicatat. Klik tombol "Catat Deposit Provider" untuk menambah pencatatan pertama.'
                        : `Belum ada riwayat deposit untuk provider ini.`}
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((d) => {
                    const effectiveRate = d.effective_rate_idr
                      ? Number(d.effective_rate_idr)
                      : d.credited_amount_usd > 0
                      ? Math.round(Number(d.amount_paid_idr) / Number(d.credited_amount_usd))
                      : null

                    return (
                      <tr key={d.id} className="table-row">
                        <td className="font-semibold text-gray-800">
                          {new Date(d.deposited_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className={`provider-tag tag-${d.provider_id}`}>
                              {d.ai_providers?.name || d.provider_id.toUpperCase()}
                            </span>
                            {d.ai_providers?.category && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                {d.ai_providers.category.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-bold text-gray-900">
                          {formatIDR(Number(d.amount_paid_idr))}
                        </td>
                        <td>
                          <div className="font-mono font-semibold text-gray-900">
                            ${Number(d.credited_amount_usd).toFixed(2)} USD
                          </div>
                          {Number(d.credited_tokens) > 0 && (
                            <div className="text-xs text-indigo-600 font-mono">
                              +{Number(d.credited_tokens).toLocaleString()} tokens
                            </div>
                          )}
                        </td>
                        <td>
                          {effectiveRate ? (
                            <span className="effective-rate-pill font-mono">
                              Rp {Math.round(effectiveRate).toLocaleString('id-ID')} / $
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td>
                          <div className="text-xs font-semibold text-gray-800">
                            {d.invoice_number || '-'}
                          </div>
                          <div className="text-xs text-gray-500">{d.payment_method || '-'}</div>
                        </td>
                        <td className="text-gray-600 text-xs max-w-xs truncate">
                          {d.notes || '-'}
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              onClick={() => handleOpenEditDeposit(d)}
                              className="edit-topup-btn"
                              title="Edit catatan deposit (koreksi saldo USD/invoice)"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTopup(d.id)}
                              className="delete-topup-btn"
                              title="Hapus catatan deposit"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
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
                  const avgCostIDR =
                    f.calls > 0 ? ((f.totalCostUSD * USD_TO_IDR) / f.calls).toFixed(1) : '0'

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
                        <div className="font-semibold text-gray-900">
                          {avgTokens.toLocaleString()} tokens
                        </div>
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
                        <span className="credit-tag">{f.creditCost} Credits</span>
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

      {/* MODAL CATAT DEPOSIT (TAMBAH / EDIT) */}
      {showTopupModal && (
        <div className="topup-modal-overlay" onClick={() => setShowTopupModal(false)}>
          <div className="topup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="topup-modal-header">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-emerald-600" />
                <h3>{editingDepositId ? 'Edit Catatan Deposit Provider' : 'Catat Deposit Provider AI'}</h3>
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
              {/* Pilihan Provider Dinamis */}
              <div className="form-group">
                <label>Provider / Vendor *</label>
                <select
                  value={topupForm.provider_id}
                  onChange={(e) =>
                    setTopupForm((prev) => ({
                      ...prev,
                      provider_id: e.target.value,
                    }))
                  }
                  required
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.category.toUpperCase()}] ({p.billing_type === 'prepaid_usd' ? 'Prepaid USD' : p.billing_type === 'prepaid_tokens' ? 'Token Pack' : 'Postpaid'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dual Entry: Pembayaran IDR */}
              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label>Nominal Pembayaran Riil (IDR) *</label>
                  <span className="text-xs text-gray-500">Uang keluar rekening / CC</span>
                </div>
                <input
                  type="number"
                  placeholder="Contoh: 500000"
                  value={topupForm.amount_paid_idr}
                  onChange={(e) => handleAmountIdrChange(e.target.value)}
                  min="1"
                  required
                />
                <div className="quick-amount-tags">
                  {[100000, 250000, 500000, 1000000, 2000000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      className="amount-tag-btn"
                      onClick={() => handleAmountIdrChange(nominal.toString())}
                    >
                      +{nominal >= 1000000 ? `${nominal / 1000000}jt` : `${nominal / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Entry: Saldo USD */}
              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label>Saldo Masuk Provider (USD) *</label>
                  <span className="text-xs text-gray-500">Kredit tertera di billing console</span>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Contoh: 6.25 atau 31.25"
                  value={topupForm.credited_amount_usd}
                  onChange={(e) =>
                    setTopupForm((prev) => ({ ...prev, credited_amount_usd: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Peringatan Cerdas jika Provider USD belum diisi saldo USD */}
              {selectedProvider?.billing_type === 'prepaid_usd' &&
                (!topupForm.credited_amount_usd || parseFloat(topupForm.credited_amount_usd) <= 0) && (
                  <div className="deposit-tip-warning">
                    <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                    <span>
                      <strong>Perhatian:</strong> {selectedProvider.name} menggunakan sistem saldo kredit USD. Anda wajib mengisi Saldo Masuk (USD) agar perhitungan sisa saldo di dashboard tidak $0.00.
                    </span>
                  </div>
                )}

              {/* Live Effective Exchange Rate Banner */}
              {modalLiveEffectiveRate && (
                <div className="live-rate-banner">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">
                      Kurs Efektif Transaksi:
                    </span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      Rp {modalLiveEffectiveRate.toLocaleString('id-ID')} / USD
                    </span>
                  </div>
                  <span className="text-slate-500 text-xs block mt-1">
                    {modalLiveEffectiveRate > USD_TO_IDR
                      ? `Selisih +${(
                          ((modalLiveEffectiveRate - USD_TO_IDR) / USD_TO_IDR) *
                          100
                        ).toFixed(1)}% vs kurs acuan (mencakup PPN 11% & selisih valas bank).`
                      : 'Sesuai kurs acuan standar.'}
                  </span>
                </div>
              )}

              {/* Token Tambahan (Opsional) */}
              <div className="form-group">
                <label>Kuota Token Tambahan (Opsional - untuk token pack)</label>
                <input
                  type="number"
                  placeholder="Contoh: 10000000 (10 juta token)"
                  value={topupForm.credited_tokens}
                  onChange={(e) =>
                    setTopupForm((prev) => ({ ...prev, credited_tokens: e.target.value }))
                  }
                />
              </div>

              {/* Invoice & Payment Method */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>No. Invoice / Referensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-GCP-2026-09"
                    value={topupForm.invoice_number}
                    onChange={(e) =>
                      setTopupForm((prev) => ({ ...prev, invoice_number: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Metode Pembayaran</label>
                  <select
                    value={topupForm.payment_method}
                    onChange={(e) =>
                      setTopupForm((prev) => ({ ...prev, payment_method: e.target.value }))
                    }
                  >
                    <option value="Kartu Kredit Bisnis">Kartu Kredit Bisnis (Visa / Mastercard)</option>
                    <option value="Transfer Bank / VA">Transfer Bank (BCA / Mandiri)</option>
                    <option value="Jenius / Debit Visa">Jenius / Bank Jago (Debit Visa)</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Transaksi */}
              <div className="form-group">
                <label>Waktu Transaksi Deposit *</label>
                <input
                  type="datetime-local"
                  value={topupForm.deposited_at}
                  onChange={(e) =>
                    setTopupForm((prev) => ({ ...prev, deposited_at: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Catatan */}
              <div className="form-group">
                <label>Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Koreksi nominal / Alokasi Qwen 2.5 72B"
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
                  {isSavingTopup ? 'Menyimpan...' : editingDepositId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DAFTARKAN VENDOR BARU (ACCOUNTING / OPERASIONAL) */}
      {showVendorModal && (
        <div className="topup-modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div className="topup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="topup-modal-header">
              <div className="flex items-center gap-2">
                <Building size={18} className="text-indigo-600" />
                <h3>Daftarkan Vendor / Alat Operasional Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="topup-form">
              <div className="form-group">
                <label>Nama Vendor / Alat *</label>
                <input
                  type="text"
                  placeholder="Contoh: Midjourney AI / Resend Email / Supabase Compute"
                  value={vendorForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    setVendorForm((prev) => ({
                      ...prev,
                      name,
                      id: prev.id === '' ? autoSlug : prev.id,
                    }))
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Identifier / Slug Sistem (Unik) *</label>
                <input
                  type="text"
                  placeholder="Contoh: midjourney / resend"
                  value={vendorForm.id}
                  onChange={(e) =>
                    setVendorForm((prev) => ({
                      ...prev,
                      id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                    }))
                  }
                  required
                />
                <span className="text-xs text-gray-500">Huruf kecil tanpa spasi (contoh: midjourney).</span>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Kategori Vendor *</label>
                  <select
                    value={vendorForm.category}
                    onChange={(e) =>
                      setVendorForm((prev) => ({ ...prev, category: e.target.value as any }))
                    }
                    required
                  >
                    <option value="marketing">Marketing & Desain Promosi</option>
                    <option value="infra">Infrastruktur & Server</option>
                    <option value="email">Layanan Email & Notifikasi</option>
                    <option value="search">Search Engine / Riset</option>
                    <option value="llm">LLM / AI Model</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Model Penagihan *</label>
                  <select
                    value={vendorForm.billing_type}
                    onChange={(e) =>
                      setVendorForm((prev) => ({ ...prev, billing_type: e.target.value as any }))
                    }
                    required
                  >
                    <option value="prepaid_usd">Prepaid USD (Deposit Saldo Dolar)</option>
                    <option value="prepaid_tokens">Prepaid Token (Beli Kuota Keping)</option>
                    <option value="postpaid_credit">Postpaid (Tagihan Akhir Bulan)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>URL Konsol / Website (Opsional)</label>
                <input
                  type="url"
                  placeholder="Contoh: https://midjourney.com"
                  value={vendorForm.website_url}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, website_url: e.target.value }))
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowVendorModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSavingVendor}
                >
                  {isSavingVendor ? 'Mendaftarkan...' : 'Daftarkan Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10000,
            maxWidth: 380,
            padding: '12px 16px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#ffffff',
            color: '#111827',
            border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: feedback.type === 'success' ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <span style={{ flex: 1, fontSize: '0.8125rem', lineHeight: 1.4, fontWeight: 500 }}>
            {feedback.message}
          </span>
          <button
            onClick={() => setFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={14} />
          </button>
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

        /* Multi Provider Styles */
        .flex-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .header-action-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-add-vendor {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #ffffff;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-add-vendor:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
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

        .provider-macro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .provider-macro-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
        }

        .macro-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .macro-value {
          font-size: 20px;
          font-weight: 800;
          margin: 4px 0 2px 0;
          letter-spacing: -0.02em;
        }

        .macro-sub {
          font-size: 11px;
          color: #94a3b8;
        }

        .provider-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .provider-balance-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .provider-balance-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .provider-balance-card.border-critical {
          border-color: #fca5a5;
          background: #fffafa;
        }

        .provider-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .provider-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .provider-id-tag {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .provider-cat-tag {
          font-size: 10px;
          font-weight: 700;
          color: #4f46e5;
          background: #eef2ff;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .billing-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          letter-spacing: 0.03em;
        }

        .billing-badge.prepaid_usd {
          background: #e0f2fe;
          color: #0369a1;
        }

        .billing-badge.prepaid_tokens {
          background: #fef3c7;
          color: #b45309;
        }

        .billing-badge.postpaid_credit {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .provider-balance-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 8px;
          border-bottom: 1px dashed #e2e8f0;
        }

        .balance-caption {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .balance-amount {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-top: 2px;
        }

        .balance-subtext {
          font-size: 11px;
          color: #64748b;
          display: block;
          margin-top: 2px;
        }

        .runway-badge-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .runway-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          letter-spacing: 0.02em;
        }

        .runway-badge.status-healthy {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .runway-badge.status-warning {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .runway-badge.status-critical {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .runway-badge.status-idle {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .consumption-progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .provider-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .p-metric {
          display: flex;
          flex-direction: column;
        }

        .p-metric-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .p-metric-val {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }

        .provider-token-strip {
          font-size: 11px;
          color: #4f46e5;
          background: #eef2ff;
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          justify-content: space-between;
        }

        /* Deposit History Container */
        .deposit-history-container {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          margin-top: 10px;
        }

        .deposit-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .deposit-history-header h4 {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px 0;
        }

        .deposit-history-header p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .deposit-filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 5px 10px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }

        .filter-tab.active {
          background: #4f46e5;
          color: #ffffff;
          border-color: #4f46e5;
        }

        .effective-rate-pill {
          font-size: 11px;
          font-weight: 700;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .deposit-tip-warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: #92400e;
          line-height: 1.4;
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
          margin-bottom: 18px;
        }

        .provider-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.03em;
        }

        .provider-tag.tag-google {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .provider-tag.tag-groq {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .provider-tag.tag-deepseek {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .provider-tag.tag-anthropic {
          background: #faf5ff;
          color: #7e22ce;
          border: 1px solid #e9d5ff;
        }

        .provider-tag.tag-openai {
          background: #f1f5f9;
          color: #0f172a;
          border: 1px solid #cbd5e1;
        }

        .provider-tag.tag-openrouter {
          background: #fdf2f8;
          color: #be185d;
          border: 1px solid #fbcfe8;
        }

        .provider-tag.tag-tavily {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .table-actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .edit-topup-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .edit-topup-btn:hover {
          color: #4f46e5;
          background: #eef2ff;
        }

        .delete-topup-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 5px;
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

        /* Simulator Card */
        .simulator-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          align-items: start;
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
          max-width: 500px;
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

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .quick-amount-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .amount-tag-btn {
          padding: 4px 8px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }

        .amount-tag-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .live-rate-banner {
          background: #f8fafc;
          border: 1px solid #c7d2fe;
          border-radius: 8px;
          padding: 10px 12px;
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
          .provider-cards-grid {
            grid-template-columns: 1fr;
          }
          .simulator-grid {
            grid-template-columns: 1fr;
          }
          .section-card {
            padding: 14px;
          }
          .form-row-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
