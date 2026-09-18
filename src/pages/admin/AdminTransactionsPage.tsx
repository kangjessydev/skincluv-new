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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface InvoiceRecord {
  id: string
  merchant_ref: string
  reference: string | null
  user_id: string
  amount_idr: number
  plan: string
  status: 'PAID' | 'UNPAID' | 'FAILED' | 'REFUND' | string
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
          plan,
          status,
          checkout_url,
          pay_url,
          qr_url,
          expired_at,
          created_at,
          updated_at,
          profiles (
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

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Hitung Metrik & KPI
  const stats = useMemo(() => {
    const total = invoices.length
    const paidInvoices = invoices.filter((i) => i.status === 'PAID')
    const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID')
    const failedInvoices = invoices.filter((i) => i.status === 'FAILED' || i.status === 'REFUND')

    const totalRevenue = paidInvoices.reduce((acc, curr) => acc + (curr.amount_idr || 0), 0)
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
                        {formatIDR(inv.amount_idr)}
                      </td>
                      <td>
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
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status Invoice
                  </span>
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
                </div>
                <div className="amount-display">
                  <span className="text-xs text-gray-500 block mb-1">Total Tagihan:</span>
                  <span className="amount-hero">{formatIDR(selectedInvoice.amount_idr)}</span>
                </div>
              </div>

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
              <button className="btn-modal-close" onClick={() => setSelectedInvoice(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VANILLA CSS MATCHING ADMIN DESIGN SYSTEM */}
      <style>{`
        .admin-tx-page {
          padding: 24px;
          max-width: 1300px;
          margin: 0 auto;
          font-family: inherit;
        }

        .admin-tx-header {
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

        .admin-tx-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .admin-tx-header p {
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

        .kpi-card.revenue .kpi-icon-wrap { background: #ecfdf5; color: #059669; }
        .kpi-card.paid .kpi-icon-wrap { background: #eff6ff; color: #2563eb; }
        .kpi-card.unpaid .kpi-icon-wrap { background: #fffbeb; color: #d97706; }
        .kpi-card.rate .kpi-icon-wrap { background: #f5f3ff; color: #7c3aed; }

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

        /* Filter Card */
        .filter-bar-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .search-wrap input {
          width: 100%;
          padding: 9px 34px 9px 36px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .search-wrap input:focus {
          border-color: #4f46e5;
          background: #ffffff;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .status-pills {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 8px;
          gap: 2px;
        }

        .pill {
          background: transparent;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }

        .pill.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .pill.active.pill-paid { color: #059669; }
        .pill.active.pill-unpaid { color: #d97706; }
        .pill.active.pill-failed { color: #dc2626; }

        .plan-select-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 4px 10px;
        }

        .plan-select {
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          outline: none;
          cursor: pointer;
        }

        /* Table Card */
        .table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
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

        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar-mini {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 600;
          color: #0f172a;
          display: block;
          font-size: 13px;
        }

        .user-username {
          font-size: 11px;
          color: #94a3b8;
          display: block;
        }

        .plan-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.03em;
        }

        .plan-glow { background: #fef3c7; color: #b45309; }
        .plan-pro { background: #ede9fe; color: #6d28d9; }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 999px;
          letter-spacing: 0.03em;
        }

        .status-paid { background: #dcfce7; color: #15803d; }
        .status-unpaid { background: #fef3c7; color: #b45309; }
        .status-failed { background: #fee2e2; color: #b91c1c; }

        .btn-detail {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-detail:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
          animation: modalPop 0.2s ease-out;
        }

        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-title-wrap h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-section-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 18px;
        }

        .amount-hero {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 12px;
        }

        .meta-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
        }

        .meta-value-copy {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .copy-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
        }

        .btn-pay-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 10px;
          transition: background 0.15s;
        }

        .btn-pay-link:hover {
          background: #4338ca;
        }

        .modal-footer {
          padding: 12px 20px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
        }

        .btn-modal-close {
          padding: 8px 16px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .admin-tx-page {
            padding: 16px 12px;
          }
          .admin-tx-header {
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
          .filter-bar-card {
            flex-direction: column;
            align-items: stretch;
          }
          .search-wrap {
            min-width: 100%;
          }
          .filter-group {
            width: 100%;
          }
          .status-pills {
            overflow-x: auto;
            width: 100%;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }
          .detail-meta-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
