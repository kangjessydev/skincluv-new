import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  User,
  Eye,
  X,
  Copy,
  Check,
  Filter,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-transactions.css'

interface InvoiceRecord {
  id: string
  merchant_ref: string
  reference: string | null
  user_id: string
  amount_idr: number
  total_amount_idr?: number | null
  plan: string
  status: 'PAID' | 'UNPAID' | 'FAILED' | 'REFUND' | string
  settlement_type?: string | null
  admin_notes?: string | null
  settled_by?: string | null
  paid_at?: string | null
  checkout_url: string | null
  pay_url: string | null
  qr_url: string | null
  expired_at: string | null
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string | null
    username: string | null
  } | null
}

export default function AdminTransactionsPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'FAILED'>('ALL')
  const [planFilter, setPlanFilter] = useState<'ALL' | 'GLOW' | 'PREMIUM' | 'PRO'>('ALL')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)
  const [copiedText, setCopiedText] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Resolution & Settlement State
  const [isSyncingTripay, setIsSyncingTripay] = useState(false)
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [showSettleConfirm, setShowSettleConfirm] = useState(false)
  const [settleNotes, setSettleNotes] = useState('')
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false)

  // Manual Pass Modal State
  const [showCreatePassModal, setShowCreatePassModal] = useState(false)
  const [createPassUser, setCreatePassUser] = useState('')
  const [createPassPlan, setCreatePassPlan] = useState<'GLOW' | 'PRO'>('GLOW')
  const [createPassNotes, setCreatePassNotes] = useState('')
  const [isCreatingPass, setIsCreatingPass] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<{ id: string; full_name: string | null; username: string | null }[]>([])
  const [userSearchText, setUserSearchText] = useState('')

  const loadInvoices = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('tripay_invoices')
        .select(`
          id,
          merchant_ref,
          reference,
          user_id,
          amount_idr,
          total_amount_idr,
          plan,
          status,
          settlement_type,
          admin_notes,
          settled_by,
          paid_at,
          checkout_url,
          pay_url,
          qr_url,
          expired_at,
          created_at,
          updated_at,
          profiles!user_id (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices((data as any) || [])
    } catch (err: any) {
      console.error('[AdminTransactions] Gagal mengambil data invoice:', err)
      setErrorMessage(err.message || 'Gagal mengambil data transaksi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSyncTripay = async (inv: InvoiceRecord) => {
    setIsSyncingTripay(true)
    setActionNotice(null)
    try {
      const { data, error } = await supabase.functions.invoke('tripay-check-status', {
        body: {
          merchant_ref: inv.merchant_ref,
          reference: inv.reference,
        },
      })

      if (error) throw error

      if (data?.status === 'PAID' || data?.is_paid) {
        setActionNotice({
          type: 'success',
          text: 'Status terverifikasi PAID di Tripay! Pass 30 hari pengguna telah aktif dan database telah disinkronkan.',
        })
        await loadInvoices()
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'PAID', settlement_type: 'GATEWAY_SYNC' } : null))
      } else {
        setActionNotice({
          type: 'info',
          text: `Tripay melaporkan status transaksi ini: "${data?.status || 'UNPAID'}". Belum ada dana pembayaran masuk dari pengguna di payment gateway.`,
        })
      }
    } catch (err: any) {
      console.error('[AdminTransactions] Error syncing Tripay status:', err)
      setActionNotice({
        type: 'error',
        text: `Gagal sinkronisasi ke Tripay: ${err.message || 'Koneksi gagal'}`,
      })
    } finally {
      setIsSyncingTripay(false)
    }
  }

  const handleManualSettle = async (merchantRef: string) => {
    if (!settleNotes.trim()) {
      alert('Mohon isi catatan verifikasi bukti transfer.')
      return
    }

    setIsSubmittingSettle(true)
    try {
      const { data, error } = await supabase.rpc('admin_manual_settle_invoice' as any, {
        p_merchant_ref: merchantRef,
        p_notes: settleNotes.trim(),
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'Gagal melakukan manual settlement')

      setActionNotice({
        type: 'success',
        text: `Invoice ${merchantRef} berhasil di-settle secara manual oleh admin! Paket pengguna langsung aktif.`,
      })
      setShowSettleConfirm(false)
      setSettleNotes('')
      await loadInvoices()
      setSelectedInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: 'PAID',
              settlement_type: 'ADMIN_MANUAL',
              admin_notes: settleNotes.trim(),
            }
          : null
      )
    } catch (err: any) {
      console.error('[AdminTransactions] Error manual settle:', err)
      alert(`Gagal aktivasi manual: ${err.message}`)
    } finally {
      setIsSubmittingSettle(false)
    }
  }

  const openCreatePassModal = async () => {
    setShowCreatePassModal(true)
    setActionNotice(null)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .order('created_at', { ascending: false })
        .limit(150)
      if (data) setAvailableUsers(data)
    } catch (err) {
      console.error('[AdminTransactions] Failed loading users:', err)
    }
  }

  const handleCreateManualPass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createPassUser) {
      alert('Pilih pengguna terlebih dahulu.')
      return
    }
    if (!createPassNotes.trim()) {
      alert('Mohon isi catatan atau nomor referensi transfer manual.')
      return
    }

    setIsCreatingPass(true)
    try {
      const { data, error } = await supabase.rpc('admin_manual_create_and_settle_pass' as any, {
        p_user_id: createPassUser,
        p_plan: createPassPlan,
        p_notes: createPassNotes.trim(),
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'Gagal membuat pass')

      alert(`Berhasil! Pass ${createPassPlan} 30 hari telah aktif untuk pengguna tersebut.`)
      setShowCreatePassModal(false)
      setCreatePassUser('')
      setCreatePassNotes('')
      await loadInvoices()
    } catch (err: any) {
      console.error('[AdminTransactions] Error creating manual pass:', err)
      alert(`Gagal membuat pass manual: ${err.message}`)
    } finally {
      setIsCreatingPass(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Hitung Metrik & KPI
  const stats = useMemo(() => {
    const total = invoices.length
    const paidInvoices = invoices.filter((i) => i.status === 'PAID')
    const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID')
    const failedInvoices = invoices.filter((i) => i.status === 'FAILED' || i.status === 'REFUND')

    const totalRevenue = paidInvoices.reduce((acc, curr) => acc + (curr.total_amount_idr || curr.amount_idr || 0), 0)
    const conversionRate = total > 0 ? ((paidInvoices.length / total) * 100).toFixed(1) : '0'

    return {
      total,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      failedCount: failedInvoices.length,
      totalRevenue,
      conversionRate,
    }
  }, [invoices])

  // Filter & Search
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Filter status
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false

      // Filter plan
      if (planFilter !== 'ALL') {
        const p = inv.plan?.toUpperCase() || ''
        if (planFilter === 'PRO' || planFilter === 'PREMIUM') {
          if (p !== 'PRO' && p !== 'PREMIUM') return false
        } else if (p !== planFilter) {
          return false
        }
      }

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const refMatch = inv.merchant_ref?.toLowerCase().includes(q) || inv.reference?.toLowerCase().includes(q)
        const nameMatch = inv.profiles?.full_name?.toLowerCase().includes(q)
        const userMatch = inv.profiles?.username?.toLowerCase().includes(q)
        const planMatch = inv.plan?.toLowerCase().includes(q)
        if (!refMatch && !nameMatch && !userMatch && !planMatch) return false
      }

      return true
    })
  }, [invoices, statusFilter, planFilter, searchQuery])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-flex cluv-items-center cluv-gap-2 cluv-mb-1">
            <span className="cluv-badge is-sm is-teal">
              <CreditCard size={12} /> Keuangan & Pembayaran
            </span>
            <span className="cluv-badge is-sm is-purple">Tripay Gateway</span>
          </div>
          <h1 className="cluv-title-section" style={{ margin: 0 }}>
            Riwayat Transaksi & Pembayaran
          </h1>
          <p className="cluv-subtitle cluv-mt-1">
            Pantau seluruh invoice Tripay, status pembayaran pengguna, dan pendapatan langganan secara real-time.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            type="button"
            className="cluv-btn is-primary is-sm"
            onClick={openCreatePassModal}
            title="Aktivasi Pass Manual untuk Pengguna"
          >
            <Plus size={15} />
            <span>Aktivasi Pass Manual</span>
          </button>
          <button
            type="button"
            className="cluv-btn is-outline is-sm"
            onClick={loadInvoices}
            disabled={isLoading}
            title="Segarkan Data"
          >
            <RefreshCw size={15} className={isLoading ? 'cluv-animate-spin' : ''} />
            <span>Refresh</span>
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
            <span className="cluv-stat-label">Omzet Berhasil</span>
            <div className="cluv-stat-icon is-teal">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{formatIDR(stats.totalRevenue)}</div>
          <div className="cluv-stat-meta is-positive">Dari {stats.paidCount} transaksi berhasil</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Transaksi Berhasil</span>
            <div className="cluv-stat-icon is-blue">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{stats.paidCount}</div>
          <div className="cluv-stat-meta is-positive">Tingkat konversi {stats.conversionRate}%</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Menunggu Bayar</span>
            <div className="cluv-stat-icon is-gold">
              <Clock size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{stats.unpaidCount}</div>
          <div className="cluv-stat-meta">Invoice aktif menunggu pelunasan</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Total Invoice</span>
            <div className="cluv-stat-icon is-purple">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="cluv-stat-val">{stats.total}</div>
          <div className="cluv-stat-meta">{stats.failedCount} gagal / expired</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="cluv-card is-compact admin-tx-filter-card">
        <div className="admin-tx-filter-row">
          <div className="admin-tx-search-wrap">
            <Search size={16} className="admin-tx-search-icon" />
            <input
              type="text"
              className="admin-tx-search-input"
              placeholder="Cari nomor invoice, nama pembeli, atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-tx-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Bersihkan pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-tx-filter-group">
            <div className="cluv-chip-group">
              <button
                type="button"
                className={`cluv-chip ${statusFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Semua ({stats.total})
              </button>
              <button
                type="button"
                className={`cluv-chip ${statusFilter === 'PAID' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('PAID')}
              >
                <CheckCircle2 size={13} /> Berhasil ({stats.paidCount})
              </button>
              <button
                type="button"
                className={`cluv-chip ${statusFilter === 'UNPAID' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('UNPAID')}
              >
                <Clock size={13} /> Pending ({stats.unpaidCount})
              </button>
              <button
                type="button"
                className={`cluv-chip ${statusFilter === 'FAILED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('FAILED')}
              >
                <XCircle size={13} /> Gagal ({stats.failedCount})
              </button>
            </div>

            <div className="cluv-flex cluv-items-center cluv-gap-1">
              <Filter size={14} className="cluv-text-muted" />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="admin-select"
                style={{ width: 'auto', minWidth: '130px', height: '34px', fontSize: '12.5px' }}
              >
                <option value="ALL">Semua Paket</option>
                <option value="GLOW">Paket GLOW</option>
                <option value="PRO">Paket PRO / PREMIUM</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="cluv-card cluv-mb-6">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>WAKTU & TANGGAL</th>
                <th>INVOICE REF</th>
                <th>PENGGUNA</th>
                <th>PAKET</th>
                <th>NOMINAL (RP)</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="cluv-text-center cluv-py-6 cluv-text-muted">
                    <RefreshCw size={20} className="cluv-animate-spin" style={{ margin: '0 auto 6px auto' }} />
                    <div>Memuat daftar transaksi...</div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cluv-text-center cluv-py-8 cluv-text-muted">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const dateStr = new Date(inv.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const isPaid = inv.status === 'PAID'
                  const isUnpaid = inv.status === 'UNPAID'
                  const isGlow = inv.plan?.toUpperCase() === 'GLOW'

                  return (
                    <tr key={inv.id} className="admin-table-row">
                      <td className="cluv-caption" style={{ fontFamily: 'var(--cluv-font-mono)' }}>{dateStr}</td>
                      <td>
                        <span className="cluv-body" style={{ fontWeight: 700, fontFamily: 'var(--cluv-font-mono)', fontSize: '12px' }}>
                          {inv.merchant_ref}
                        </span>
                        {inv.reference && (
                          <span className="cluv-caption cluv-text-muted" style={{ display: 'block', fontFamily: 'var(--cluv-font-mono)' }}>
                            Ref: {inv.reference}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-mini">
                            <User size={13} />
                          </div>
                          <div>
                            <span className="admin-user-name">
                              {inv.profiles?.full_name || 'Pelanggan Skincluv'}
                            </span>
                            <span className="admin-user-handle">
                              @{inv.profiles?.username || 'user'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-plan-badge ${isGlow ? 'is-glow' : 'is-pro'}`}>
                          {inv.plan}
                        </span>
                      </td>
                      <td>
                        <strong className="cluv-body" style={{ fontWeight: 800 }}>
                          {formatIDR(inv.total_amount_idr || inv.amount_idr)}
                        </strong>
                      </td>
                      <td>
                        <div className="cluv-flex cluv-items-center cluv-gap-1" style={{ flexWrap: 'wrap' }}>
                          <span
                            className={`admin-status-badge ${
                              isPaid
                                ? 'is-paid'
                                : isUnpaid
                                ? 'is-unpaid'
                                : 'is-failed'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 size={12} /> LUNAS
                              </>
                            ) : isUnpaid ? (
                              <>
                                <Clock size={12} /> MENUNGGU
                              </>
                            ) : (
                              <>
                                <XCircle size={12} /> GAGAL
                              </>
                            )}
                          </span>
                          {isPaid && inv.settlement_type && (
                            <span
                              className={`admin-settle-badge ${
                                inv.settlement_type === 'ADMIN_MANUAL'
                                  ? 'is-manual'
                                  : inv.settlement_type === 'GATEWAY_SYNC'
                                  ? 'is-sync'
                                  : 'is-webhook'
                              }`}
                            >
                              {inv.settlement_type === 'ADMIN_MANUAL'
                                ? 'Manual'
                                : inv.settlement_type === 'GATEWAY_SYNC'
                                ? 'Sync'
                                : 'Webhook'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="cluv-btn is-outline is-sm"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          <Eye size={13} /> Rincian
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="cluv-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="cluv-modal-box is-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cluv-modal-header">
              <div className="cluv-flex cluv-items-center cluv-gap-2">
                <CreditCard size={18} className="cluv-text-teal" />
                <h3 className="cluv-modal-title">Detail Tagihan Transaksi</h3>
              </div>
              <button
                type="button"
                className="cluv-modal-close"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cluv-modal-body">
              <div className="admin-modal-hero-box">
                <div className="admin-modal-hero-top">
                  <span className="admin-meta-label">Status Invoice</span>
                  <div className="cluv-flex cluv-items-center cluv-gap-2">
                    <span
                      className={`admin-status-badge ${
                        selectedInvoice.status === 'PAID'
                          ? 'is-paid'
                          : selectedInvoice.status === 'UNPAID'
                          ? 'is-unpaid'
                          : 'is-failed'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                    {selectedInvoice.status === 'PAID' && selectedInvoice.settlement_type && (
                      <span className={`admin-settle-badge ${
                        selectedInvoice.settlement_type === 'ADMIN_MANUAL'
                          ? 'is-manual'
                          : selectedInvoice.settlement_type === 'GATEWAY_SYNC'
                          ? 'is-sync'
                          : 'is-webhook'
                      }`}>
                        {selectedInvoice.settlement_type === 'ADMIN_MANUAL'
                          ? 'Manual Admin'
                          : selectedInvoice.settlement_type === 'GATEWAY_SYNC'
                          ? 'Sync Tripay'
                          : 'Webhook'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="cluv-caption cluv-text-muted" style={{ display: 'block', marginBottom: '2px' }}>Total Tagihan:</span>
                  <div className="admin-amount-hero">
                    {formatIDR(selectedInvoice.total_amount_idr || selectedInvoice.amount_idr)}
                  </div>
                </div>
              </div>

              {/* Settlement / Resolution Box */}
              {selectedInvoice.status === 'PAID' ? (
                <div className="admin-settlement-box is-paid">
                  <div className="cluv-flex cluv-items-center cluv-gap-2 cluv-mb-1">
                    <ShieldCheck size={18} className="cluv-text-teal" />
                    <span className="cluv-body" style={{ fontWeight: 800, color: 'var(--cluv-teal-dark)' }}>
                      Transaksi Terverifikasi Lunas
                    </span>
                  </div>
                  <div className="cluv-caption cluv-text-teal" style={{ marginBottom: selectedInvoice.admin_notes ? '8px' : 0 }}>
                    Metode Settle: <strong>{selectedInvoice.settlement_type || 'GATEWAY_WEBHOOK'}</strong>
                    {selectedInvoice.paid_at && ` • ${new Date(selectedInvoice.paid_at).toLocaleString('id-ID')}`}
                  </div>
                  {selectedInvoice.admin_notes && (
                    <div className="cluv-caption cluv-text-teal" style={{ background: 'var(--cluv-surface)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--cluv-teal-line)' }}>
                      <strong>Catatan Admin:</strong> {selectedInvoice.admin_notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="admin-settlement-box is-pending">
                  <div className="cluv-flex cluv-items-center cluv-gap-2 cluv-mb-1">
                    <AlertTriangle size={18} className="cluv-text-gold" />
                    <span className="cluv-body" style={{ fontWeight: 800, color: 'var(--cluv-gold)' }}>
                      Resolusi Masalah Transaksi
                    </span>
                  </div>
                  <p className="cluv-caption cluv-mb-3" style={{ color: 'var(--cluv-neutral-700)' }}>
                    Gunakan aksi di bawah jika pelanggan mengalami kendala gateway, webhook tertunda, atau jika Anda telah menerima bukti transfer manual.
                  </p>

                  {actionNotice && (
                    <div className={`cluv-alert cluv-mb-3 ${actionNotice.type === 'success' ? 'is-success' : actionNotice.type === 'error' ? 'is-danger' : 'is-info'}`}>
                      <div className="cluv-alert-content">
                        <div className="cluv-alert-message">{actionNotice.text}</div>
                      </div>
                    </div>
                  )}

                  <div className="cluv-btn-group cluv-mb-2">
                    <button
                      type="button"
                      className="cluv-btn is-outline is-sm"
                      onClick={() => handleSyncTripay(selectedInvoice)}
                      disabled={isSyncingTripay || isSubmittingSettle}
                    >
                      <RefreshCw size={14} className={isSyncingTripay ? 'cluv-animate-spin' : ''} />
                      <span>{isSyncingTripay ? 'Menghubungi Tripay...' : 'Sinkronkan ke Tripay'}</span>
                    </button>

                    <button
                      type="button"
                      className="cluv-btn is-primary is-sm"
                      onClick={() => {
                        setShowSettleConfirm(!showSettleConfirm)
                        setActionNotice(null)
                      }}
                      disabled={isSyncingTripay || isSubmittingSettle}
                    >
                      <Zap size={14} />
                      <span>Aktivasi Manual</span>
                    </button>
                  </div>

                  {showSettleConfirm && (
                    <div className="cluv-card is-compact cluv-mt-3" style={{ background: 'var(--cluv-surface)' }}>
                      <span className="cluv-body" style={{ fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                        Konfirmasi Settle Manual:
                      </span>
                      <p className="cluv-caption cluv-text-muted cluv-mb-3">
                        Tindakan ini akan mengaktifkan paket pass 30 hari <strong>{selectedInvoice.plan}</strong> dan mencatat transaksi sebagai LUNAS.
                      </p>
                      <label className="cluv-label">
                        Catatan Verifikasi / Referensi Transfer (Wajib):
                      </label>
                      <input
                        type="text"
                        className="cluv-input cluv-mb-3"
                        placeholder="Contoh: Bukti transfer BCA a.n. Siti Rp 25.000 sudah diverifikasi"
                        value={settleNotes}
                        onChange={(e) => setSettleNotes(e.target.value)}
                      />
                      <div className="cluv-btn-group is-right">
                        <button
                          type="button"
                          className="cluv-btn is-secondary is-sm"
                          onClick={() => {
                            setShowSettleConfirm(false)
                            setSettleNotes('')
                          }}
                          disabled={isSubmittingSettle}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className="cluv-btn is-primary is-sm"
                          onClick={() => handleManualSettle(selectedInvoice.merchant_ref)}
                          disabled={isSubmittingSettle || !settleNotes.trim()}
                        >
                          {isSubmittingSettle ? 'Memproses...' : 'Ya, Aktifkan Pass'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <span className="admin-meta-label">Merchant Ref (Invoice ID):</span>
                  <div className="cluv-flex cluv-items-center cluv-gap-1">
                    <span className="cluv-body" style={{ fontFamily: 'var(--cluv-font-mono)', fontWeight: 600 }}>{selectedInvoice.merchant_ref}</span>
                    <button
                      type="button"
                      className="cluv-btn is-ghost is-sm"
                      style={{ padding: '2px 6px', height: 'auto' }}
                      onClick={() => handleCopy(selectedInvoice.merchant_ref)}
                      title="Salin ID"
                    >
                      {copiedText ? <Check size={13} className="cluv-text-teal" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">Tripay Ref:</span>
                  <span className="cluv-body" style={{ fontFamily: 'var(--cluv-font-mono)' }}>
                    {selectedInvoice.reference || '-'}
                  </span>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">Nama Pelanggan:</span>
                  <span className="cluv-body" style={{ fontWeight: 700 }}>
                    {selectedInvoice.profiles?.full_name || '-'}
                  </span>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">Username:</span>
                  <span className="cluv-body cluv-text-muted">
                    @{selectedInvoice.profiles?.username || '-'}
                  </span>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">Paket Langganan:</span>
                  <span className="cluv-body" style={{ fontWeight: 800, color: 'var(--cluv-teal)' }}>{selectedInvoice.plan}</span>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">Waktu Dibuat:</span>
                  <span className="cluv-body">
                    {new Date(selectedInvoice.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">Terakhir Diperbarui:</span>
                  <span className="cluv-body">
                    {new Date(selectedInvoice.updated_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="admin-detail-item">
                  <span className="admin-meta-label">User UID:</span>
                  <span className="cluv-caption cluv-text-muted" style={{ fontFamily: 'var(--cluv-font-mono)' }}>
                    {selectedInvoice.user_id}
                  </span>
                </div>
              </div>

              {(selectedInvoice.checkout_url || selectedInvoice.pay_url) && (
                <div className="cluv-mt-3">
                  {selectedInvoice.checkout_url && (
                    <a
                      href={selectedInvoice.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cluv-btn is-outline is-sm cluv-w-full"
                    >
                      <ArrowUpRight size={14} /> Buka Halaman Checkout Tripay
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="cluv-modal-footer">
              <button
                type="button"
                className="cluv-btn is-secondary is-sm"
                onClick={() => {
                  setSelectedInvoice(null)
                  setShowSettleConfirm(false)
                  setSettleNotes('')
                  setActionNotice(null)
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aktivasi Pass Manual Direct */}
      {showCreatePassModal && (
        <div className="cluv-modal-overlay" onClick={() => setShowCreatePassModal(false)}>
          <div className="cluv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cluv-modal-header">
              <div className="cluv-flex cluv-items-center cluv-gap-2">
                <Zap size={18} className="cluv-text-gold" />
                <h3 className="cluv-modal-title">Aktivasi Pass Manual Langsung</h3>
              </div>
              <button
                type="button"
                className="cluv-modal-close"
                onClick={() => setShowCreatePassModal(false)}
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualPass}>
              <div className="cluv-modal-body">
                <p className="cluv-caption cluv-mb-4 cluv-text-muted">
                  Gunakan formulir ini jika pelanggan membayar langsung kepada admin (transfer bank manual / cash) tanpa melalui halaman checkout Tripay.
                </p>

                <div className="cluv-field cluv-mb-4">
                  <label className="cluv-label">
                    Cari & Pilih Pengguna:
                  </label>
                  <input
                    type="text"
                    className="cluv-input cluv-mb-2"
                    placeholder="Ketik nama atau username untuk filter..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                  />
                  <select
                    className="admin-select"
                    value={createPassUser}
                    onChange={(e) => setCreatePassUser(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Akun Pengguna --</option>
                    {availableUsers
                      .filter((u) => {
                        if (!userSearchText.trim()) return true
                        const q = userSearchText.toLowerCase()
                        return (
                          (u.full_name?.toLowerCase().includes(q) ?? false) ||
                          (u.username?.toLowerCase().includes(q) ?? false)
                        )
                      })
                      .slice(0, 40)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || 'Tanpa Nama'} (@{u.username || 'user'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="cluv-field cluv-mb-4">
                  <label className="cluv-label">
                    Pilih Paket Akses 30 Hari:
                  </label>
                  <div className="cluv-flex cluv-flex-col cluv-gap-2">
                    <label className={`admin-plan-option-card ${createPassPlan === 'GLOW' ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="pass_plan"
                        value="GLOW"
                        checked={createPassPlan === 'GLOW'}
                        onChange={() => setCreatePassPlan('GLOW')}
                      />
                      <div>
                        <span className="cluv-body" style={{ fontWeight: 800, color: 'var(--cluv-gold)', display: 'block' }}>GLOW Pass (Rp 25.000)</span>
                        <span className="cluv-caption cluv-text-muted">100 Kuota AI Universal • 30 Hari</span>
                      </div>
                    </label>
                    <label className={`admin-plan-option-card ${createPassPlan === 'PRO' ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="pass_plan"
                        value="PRO"
                        checked={createPassPlan === 'PRO'}
                        onChange={() => setCreatePassPlan('PRO')}
                      />
                      <div>
                        <span className="cluv-body" style={{ fontWeight: 800, color: 'var(--cluv-purple)', display: 'block' }}>PRO Pass (Rp 49.000)</span>
                        <span className="cluv-caption cluv-text-muted">500 Kuota AI Universal • 30 Hari</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="cluv-field cluv-mb-0">
                  <label className="cluv-label">
                    Catatan Verifikasi Pembayaran (Wajib):
                  </label>
                  <textarea
                    className="cluv-textarea"
                    rows={3}
                    placeholder="Contoh: Bukti transfer BCA Rp 25.000 dari Siti Rahmawati via WhatsApp sudah masuk mutasi bank."
                    value={createPassNotes}
                    onChange={(e) => setCreatePassNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="cluv-modal-footer">
                <button
                  type="button"
                  className="cluv-btn is-secondary is-sm"
                  onClick={() => setShowCreatePassModal(false)}
                  disabled={isCreatingPass}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="cluv-btn is-primary is-sm"
                  disabled={isCreatingPass || !createPassUser || !createPassNotes.trim()}
                >
                  {isCreatingPass ? 'Memproses Aktivasi...' : 'Aktifkan Pass Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
