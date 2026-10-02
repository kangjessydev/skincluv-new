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
    <div className="admin-tx-page">
      {/* Header */}
      <div className="admin-tx-header">
        <div>
          <div className="badge-category">
            <CreditCard size={14} /> KEUANGAN & PEMBAYARAN
          </div>
          <h1>Riwayat Transaksi & Pembayaran</h1>
          <p>Pantau seluruh invoice Tripay, status pembayaran pengguna, dan pendapatan langganan secara real-time.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-create-pass"
            onClick={openCreatePassModal}
            title="Aktivasi Pass Manual untuk Pengguna"
          >
            <Plus size={16} />
            <span>Aktivasi Pass Manual</span>
          </button>
          <button
            className="btn-refresh"
            onClick={loadInvoices}
            disabled={isLoading}
            title="Segarkan Data"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="error-alert">
          <XCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon-wrap">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Omzet Berhasil</span>
            <span className="kpi-value">{formatIDR(stats.totalRevenue)}</span>
            <span className="kpi-subtext">Dari {stats.paidCount} transaksi berhasil</span>
          </div>
        </div>

        <div className="kpi-card paid">
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Transaksi Berhasil (PAID)</span>
            <span className="kpi-value">{stats.paidCount}</span>
            <span className="kpi-subtext">Tingkat konversi {stats.conversionRate}%</span>
          </div>
        </div>

        <div className="kpi-card unpaid">
          <div className="kpi-icon-wrap">
            <Clock size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Menunggu Pembayaran</span>
            <span className="kpi-value">{stats.unpaidCount}</span>
            <span className="kpi-subtext">Invoice aktif menunggu pelunasan</span>
          </div>
        </div>

        <div className="kpi-card rate">
          <div className="kpi-icon-wrap">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Invoice Dibuat</span>
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-subtext">{stats.failedCount} gagal / expired</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="filter-bar-card">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nomor invoice, nama pembeli, atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="status-pills">
            <button
              className={`pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Semua Status ({stats.total})
            </button>
            <button
              className={`pill pill-paid ${statusFilter === 'PAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PAID')}
            >
              <CheckCircle2 size={13} /> Berhasil ({stats.paidCount})
            </button>
            <button
              className={`pill pill-unpaid ${statusFilter === 'UNPAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('UNPAID')}
            >
              <Clock size={13} /> Pending ({stats.unpaidCount})
            </button>
            <button
              className={`pill pill-failed ${statusFilter === 'FAILED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('FAILED')}
            >
              <XCircle size={13} /> Gagal ({stats.failedCount})
            </button>
          </div>

          <div className="plan-select-wrap">
            <Filter size={14} className="text-gray-400" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="plan-select"
            >
              <option value="ALL">Semua Paket</option>
              <option value="GLOW">Paket GLOW</option>
              <option value="PRO">Paket PRO / PREMIUM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-responsive">
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
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    <RefreshCw size={24} className="animate-spin inline mr-2 text-indigo-500" />
                    Memuat daftar transaksi...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
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
                    <tr key={inv.id} className="table-row">
                      <td className="font-mono text-xs text-gray-600">{dateStr}</td>
                      <td>
                        <span className="font-mono font-semibold text-gray-900 block text-xs">
                          {inv.merchant_ref}
                        </span>
                        {inv.reference && (
                          <span className="text-[11px] text-gray-400 font-mono">
                            Ref: {inv.reference}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-mini">
                            <User size={13} />
                          </div>
                          <div>
                            <span className="user-name">
                              {inv.profiles?.full_name || 'Pelanggan Skincluv'}
                            </span>
                            <span className="user-username">
                              @{inv.profiles?.username || 'user'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge ${isGlow ? 'plan-glow' : 'plan-pro'}`}>
                          {inv.plan}
                        </span>
                      </td>
                      <td className="font-bold text-gray-900">
                        {formatIDR(inv.total_amount_idr || inv.amount_idr)}
                      </td>
                      <td>
                        <div className="status-cell-wrapper">
                          <span
                            className={`status-badge ${
                              isPaid
                                ? 'status-paid'
                                : isUnpaid
                                ? 'status-unpaid'
                                : 'status-failed'
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
                              className={`settlement-badge-pill ${
                                inv.settlement_type === 'ADMIN_MANUAL'
                                  ? 'manual'
                                  : inv.settlement_type === 'GATEWAY_SYNC'
                                  ? 'sync'
                                  : 'webhook'
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
                          className="btn-detail"
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
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CreditCard size={18} className="text-indigo-600" />
                <h3>Detail Tagihan Transaksi</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section-box">
                <div className="modal-section-top">
                  <span className="modal-section-label">
                    Status Invoice
                  </span>
                  <div className="modal-status-group">
                    <span
                      className={`status-badge ${
                        selectedInvoice.status === 'PAID'
                          ? 'status-paid'
                          : selectedInvoice.status === 'UNPAID'
                          ? 'status-unpaid'
                          : 'status-failed'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                    {selectedInvoice.status === 'PAID' && selectedInvoice.settlement_type && (
                      <span className={`settlement-badge-pill ${
                        selectedInvoice.settlement_type === 'ADMIN_MANUAL'
                          ? 'manual'
                          : selectedInvoice.settlement_type === 'GATEWAY_SYNC'
                          ? 'sync'
                          : 'webhook'
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
                <div className="amount-display-container">
                  <span className="amount-label">Total Tagihan:</span>
                  <span className="amount-hero">
                    {formatIDR(selectedInvoice.total_amount_idr || selectedInvoice.amount_idr)}
                  </span>
                </div>
              </div>

              {/* Settlement / Resolution Box */}
              {selectedInvoice.status === 'PAID' ? (
                <div className="settlement-status-box paid">
                  <div className="verified-header">
                    <ShieldCheck size={18} className="verified-icon" />
                    <span className="verified-title">Transaksi Terverifikasi Lunas</span>
                  </div>
                  <div className="verified-meta">
                    Metode Settle: <strong>{selectedInvoice.settlement_type || 'GATEWAY_WEBHOOK'}</strong>
                    {selectedInvoice.paid_at && ` • ${new Date(selectedInvoice.paid_at).toLocaleString('id-ID')}`}
                  </div>
                  {selectedInvoice.admin_notes && (
                    <div className="verified-admin-notes">
                      <strong>Catatan Admin:</strong> {selectedInvoice.admin_notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="settlement-status-box pending">
                  <div className="resolution-header">
                    <AlertTriangle size={18} className="resolution-icon" />
                    <span className="resolution-title">Resolusi Masalah Transaksi</span>
                  </div>
                  <p className="resolution-desc">
                    Gunakan aksi di bawah jika pelanggan mengalami kendala gateway, webhook tertunda, atau jika Anda telah menerima bukti transfer manual.
                  </p>

                  {actionNotice && (
                    <div className={`action-notice-bar ${actionNotice.type}`}>
                      {actionNotice.text}
                    </div>
                  )}

                  <div className="resolution-actions-grid">
                    <button
                      className="btn-action-sync"
                      onClick={() => handleSyncTripay(selectedInvoice)}
                      disabled={isSyncingTripay || isSubmittingSettle}
                    >
                      <RefreshCw size={14} className={isSyncingTripay ? 'animate-spin' : ''} />
                      <span>{isSyncingTripay ? 'Menghubungi Tripay...' : 'Sinkronkan ke Tripay'}</span>
                    </button>

                    <button
                      className="btn-action-settle"
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
                    <div className="settle-confirm-card">
                      <span className="confirm-headline">
                        Konfirmasi Settle Manual:
                      </span>
                      <p className="confirm-subtext">
                        Tindakan ini akan mengaktifkan paket pass 30 hari <strong>{selectedInvoice.plan}</strong> dan mencatat transaksi sebagai LUNAS.
                      </p>
                      <label className="confirm-input-label">
                        Catatan Verifikasi / Referensi Transfer (Wajib):
                      </label>
                      <input
                        type="text"
                        className="admin-settle-input"
                        placeholder="Contoh: Bukti transfer BCA a.n. Siti Rp 25.000 sudah diverifikasi"
                        value={settleNotes}
                        onChange={(e) => setSettleNotes(e.target.value)}
                      />
                      <div className="confirm-btn-row">
                        <button
                          type="button"
                          className="btn-cancel-action"
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
                          className="btn-confirm-action"
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

              <div className="detail-meta-grid">
                <div className="detail-item">
                  <span className="meta-label">Merchant Ref (Invoice ID):</span>
                  <div className="meta-value-copy">
                    <span className="font-mono">{selectedInvoice.merchant_ref}</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(selectedInvoice.merchant_ref)}
                      title="Salin ID"
                    >
                      {copiedText ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="meta-label">Tripay Ref:</span>
                  <span className="font-mono text-gray-800">
                    {selectedInvoice.reference || '-'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="meta-label">Nama Pelanggan:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedInvoice.profiles?.full_name || '-'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="meta-label">Username:</span>
                  <span className="text-gray-700">
                    @{selectedInvoice.profiles?.username || '-'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="meta-label">Paket Langganan:</span>
                  <span className="font-bold text-indigo-600">{selectedInvoice.plan}</span>
                </div>

                <div className="detail-item">
                  <span className="meta-label">Waktu Dibuat:</span>
                  <span className="text-gray-700">
                    {new Date(selectedInvoice.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="meta-label">Terakhir Diperbarui:</span>
                  <span className="text-gray-700">
                    {new Date(selectedInvoice.updated_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="meta-label">User UID:</span>
                  <span className="font-mono text-xs text-gray-500 truncate block">
                    {selectedInvoice.user_id}
                  </span>
                </div>
              </div>

              {(selectedInvoice.checkout_url || selectedInvoice.pay_url) && (
                <div className="modal-actions-wrap">
                  {selectedInvoice.checkout_url && (
                    <a
                      href={selectedInvoice.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-pay-link"
                    >
                      <ArrowUpRight size={14} /> Buka Halaman Checkout Tripay
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-modal-close"
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
        <div className="modal-overlay" onClick={() => setShowCreatePassModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Zap size={18} className="text-amber-500" />
                <h3>Aktivasi Pass Manual Langsung</h3>
              </div>
              <button className="modal-close" onClick={() => setShowCreatePassModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualPass}>
              <div className="modal-body">
                <p className="admin-modal-desc">
                  Gunakan formulir ini jika pelanggan membayar langsung kepada admin (transfer bank manual / cash) tanpa melalui halaman checkout Tripay.
                </p>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Cari & Pilih Pengguna:
                  </label>
                  <input
                    type="text"
                    className="admin-search-input mb-1.5"
                    placeholder="Ketik nama atau username untuk filter..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                  />
                  <select
                    className="admin-select-input"
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

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Pilih Paket Akses 30 Hari:
                  </label>
                  <div className="plan-radio-group">
                    <label className={`plan-radio-label ${createPassPlan === 'GLOW' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="pass_plan"
                        value="GLOW"
                        checked={createPassPlan === 'GLOW'}
                        onChange={() => setCreatePassPlan('GLOW')}
                      />
                      <div className="plan-radio-info">
                        <span className="plan-radio-title glow">GLOW Pass (Rp 25.000)</span>
                        <span className="plan-radio-subtitle">100 Kuota AI Universal • 30 Hari</span>
                      </div>
                    </label>
                    <label className={`plan-radio-label ${createPassPlan === 'PRO' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="pass_plan"
                        value="PRO"
                        checked={createPassPlan === 'PRO'}
                        onChange={() => setCreatePassPlan('PRO')}
                      />
                      <div className="plan-radio-info">
                        <span className="plan-radio-title pro">PRO Pass (Rp 49.000)</span>
                        <span className="plan-radio-subtitle">500 Kuota AI Universal • 30 Hari</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">
                    Catatan Verifikasi Pembayaran (Wajib):
                  </label>
                  <textarea
                    className="admin-textarea-input"
                    rows={3}
                    placeholder="Contoh: Bukti transfer BCA Rp 25.000 dari Siti Rahmawati via WhatsApp sudah masuk mutasi bank."
                    value={createPassNotes}
                    onChange={(e) => setCreatePassNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel-action"
                  onClick={() => setShowCreatePassModal(false)}
                  disabled={isCreatingPass}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-confirm-action"
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
