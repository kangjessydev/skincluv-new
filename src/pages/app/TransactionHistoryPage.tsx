import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Crown,
  ExternalLink,
  ShoppingBag,
  Copy,
  Receipt,
  Filter,
  ChevronDown,
  Check,
  Search,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge, BottomSheet, Toast } from '@/components/ui'

type InvoiceFilter = 'all' | 'unpaid' | 'paid' | 'expired'

interface InvoiceItem {
  id: string
  merchant_ref: string
  reference?: string | null
  amount_idr: number
  total_amount_idr?: number | null
  plan?: string | null
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND'
  checkout_url?: string | null
  pay_url?: string | null
  qr_url?: string | null
  expired_at?: string | null
  paid_at?: string | null
  created_at: string
  updated_at?: string | null
}

export default function TransactionHistoryPage() {
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [filter, setFilter] = useState<InvoiceFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isFilterDropdownOpen])

  useEffect(() => {
    if (!session?.user) return
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('tripay_invoices')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setInvoices(data as InvoiceItem[])
        }
      } catch (err) {
        console.error('Fetch transactions error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [session])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Status Filter
      if (filter === 'unpaid' && inv.status !== 'UNPAID') return false
      if (filter === 'paid' && inv.status !== 'PAID') return false
      if (filter === 'expired' && (inv.status !== 'EXPIRED' && inv.status !== 'FAILED')) return false

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchRef = inv.merchant_ref.toLowerCase().includes(q)
        const matchPlan = (inv.plan || '').toLowerCase().includes(q) || 'skincluv pro'.includes(q)
        const matchStatus = inv.status.toLowerCase().includes(q)
        if (!matchRef && !matchPlan && !matchStatus) return false
      }

      return true
    })
  }, [invoices, filter, searchQuery])

  // Pengelompokan transaksi otomatis berdasarkan Bulan & Tahun
  const groupedInvoices = useMemo(() => {
    const groups: { [key: string]: { label: string; items: InvoiceItem[] } } = {}

    filteredInvoices.forEach((inv) => {
      const date = new Date(inv.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

      if (!groups[key]) {
        groups[key] = { label, items: [] }
      }
      groups[key].items.push(inv)
    })

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key])
  }, [filteredInvoices])

  const handleCopyRef = async (refText: string) => {
    try {
      await navigator.clipboard.writeText(refText)
      setToastMessage('Nomor referensi berhasil disalin ke clipboard')
    } catch {
      setToastMessage('Gagal menyalin referensi')
    }
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBriefDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPlanTitle = (plan?: string | null) => {
    if (!plan || plan === 'PREMIUM' || plan.toLowerCase().includes('pro')) {
      return 'Skincluv PRO — 1 Bulan'
    }
    return plan
  }

  const unpaidCount = invoices.filter((i) => i.status === 'UNPAID').length
  const paidCount = invoices.filter((i) => i.status === 'PAID').length
  const expiredCount = invoices.filter((i) => i.status === 'EXPIRED' || i.status === 'FAILED').length

  const filterOptions: { key: InvoiceFilter; label: string; count: number; dotClass: string }[] = useMemo(() => [
    { key: 'all', label: 'Semua', count: invoices.length, dotClass: 'is-all' },
    { key: 'unpaid', label: 'Belum Dibayar', count: unpaidCount, dotClass: 'is-unpaid' },
    { key: 'paid', label: 'Lunas', count: paidCount, dotClass: 'is-paid' },
    ...(expiredCount > 0
      ? [{ key: 'expired' as const, label: 'Kadaluarsa', count: expiredCount, dotClass: 'is-expired' }]
      : []),
  ], [invoices.length, unpaidCount, paidCount, expiredCount])

  const activeFilterOption = filterOptions.find((o) => o.key === filter) || filterOptions[0]

  return (
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back Link to Billing (Desktop only) */}
      <Link
        to="/profile/billing"
        className="cluv-hide-mobile cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1"
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Billing &amp; Langganan</span>
      </Link>

      {/* Page Header (Desktop only) */}
      <div className="cluv-hide-mobile cluv-flex-col cluv-gap-1 cluv-mt-3">
        <h1 className="cluv-title-page">Riwayat Tagihan &amp; Transaksi</h1>
        <p className="cluv-caption cluv-text-muted">
          Daftar tagihan &amp; status pembayaran paket langganan kamu.
        </p>
      </div>

      {/* ===================== DESKTOP ONLY: Search & Filter Chips ===================== */}
      <div className="cluv-hide-mobile cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-3 cluv-mt-4 cluv-mb-4">
        <div className="cluv-feed-search-wrap" style={{ maxWidth: '280px' }}>
          <Search size={14} className="cluv-feed-search-icon" />
          <input
            type="text"
            className="cluv-feed-search-input"
            placeholder="Cari paket atau ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cluv-feed-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Bersihkan pencarian"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="cluv-filter-scroll">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`cluv-chip is-pill ${filter === opt.key ? 'is-active' : ''}`}
              onClick={() => setFilter(opt.key)}
            >
              <span>{opt.label}</span>
              <span className="cluv-tab-badge">{opt.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===================== MOBILE ONLY: Search Bar (Left) + Dropdown Filter (Right) ===================== */}
      <div className="cluv-hide-desktop cluv-mb-3 cluv-mt-1">
        <div className="cluv-feed-filter-bar">
          {/* Search Bar di Kiri */}
          <div className="cluv-feed-search-wrap">
            <Search size={14} className="cluv-feed-search-icon" />
            <input
              type="text"
              className="cluv-feed-search-input"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cluv-feed-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Bersihkan pencarian"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdown di Kanan: Icon Only (+ Badge Count jika bukan 'all') */}
          <div className="cluv-filter-dropdown-wrap" style={{ width: 'auto' }} ref={dropdownRef}>
            <button
              type="button"
              className={`cluv-filter-trigger-btn ${filter !== 'all' ? 'is-active' : ''}`}
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              aria-expanded={isFilterDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Filter transaksi: ${activeFilterOption.label}`}
              title={`Filter: ${activeFilterOption.label}`}
            >
              <Filter size={15} className={filter !== 'all' ? 'cluv-text-teal' : ''} />
              {filter !== 'all' && (
                <span className="cluv-filter-badge-count">
                  {activeFilterOption.count}
                </span>
              )}
            </button>

            {isFilterDropdownOpen && (
              <div
                className="cluv-filter-dropdown-menu"
                style={{ right: 0, left: 'auto' }}
                role="listbox"
              >
                {filterOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`cluv-filter-dropdown-item ${filter === opt.key ? 'is-active' : ''}`}
                    onClick={() => {
                      setFilter(opt.key)
                      setIsFilterDropdownOpen(false)
                    }}
                    role="option"
                    aria-selected={filter === opt.key}
                  >
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <span className={`cluv-dot-indicator ${opt.dotClass}`} />
                      <span>{opt.label}</span>
                    </div>
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <span className="cluv-tab-badge">{opt.count}</span>
                      {filter === opt.key && <Check size={14} className="cluv-text-teal" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Feed List */}
      <div className="cluv-flex-col cluv-gap-4 cluv-mt-2">
        {loading ? (
          <div className="cluv-card cluv-text-center cluv-py-8 cluv-items-center">
            <div className="cluv-spinner is-md cluv-mb-3" />
            <p className="cluv-caption cluv-text-muted">Memuat riwayat transaksi...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="cluv-card cluv-text-center cluv-py-8 cluv-items-center">
            <div className="cluv-card-icon-wrap is-lg is-teal cluv-mb-3">
              <ShoppingBag size={28} />
            </div>
            <h3 className="cluv-title-card">Belum Ada Transaksi</h3>
            <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-max-w-md">
              {searchQuery
                ? `Tidak ditemukan transaksi dengan kata kunci "${searchQuery}".`
                : filter === 'all'
                ? 'Kamu belum memiliki riwayat transaksi di Skincluv.'
                : 'Tidak ada transaksi untuk status yang dipilih.'}
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setFilter('all')
                }}
                className="cluv-mt-4"
              >
                Reset Pencarian
              </Button>
            ) : filter === 'all' ? (
              <Button variant="primary" size="sm" to="/pricing" className="cluv-mt-4">
                Upgrade ke PRO
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setFilter('all')} className="cluv-mt-4">
                Lihat Semua Transaksi
              </Button>
            )}
          </div>
        ) : (
          groupedInvoices.map((group) => (
            <div key={group.label} className="cluv-feed-group">
              <span className="cluv-feed-period">{group.label}</span>
              <div className="cluv-feed-card">
                {group.items.map((inv) => {
                  const isPaid = inv.status === 'PAID'
                  const isUnpaid = inv.status === 'UNPAID'
                  const planTitle = getPlanTitle(inv.plan)

                  return (
                    <button
                      key={inv.id}
                      type="button"
                      className="cluv-feed-item"
                      onClick={() => setSelectedInvoice(inv)}
                      aria-label={`Rincian transaksi ${planTitle}, Rp ${inv.amount_idr?.toLocaleString('id-ID')}`}
                    >
                      <div className="cluv-feed-left">
                        <div
                          className={`cluv-card-icon-wrap is-sm ${
                            isPaid ? 'is-teal' : isUnpaid ? 'is-gold' : 'is-rose'
                          }`}
                        >
                          <Crown size={16} />
                        </div>
                        <div className="cluv-feed-info">
                          <h4 className="cluv-feed-title">{planTitle}</h4>
                          <span className="cluv-feed-meta">
                            {formatShortDate(inv.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Kolom Kanan Lega (Arrow ditiadakan agar status dan harga tidak berdesakan) */}
                      <div className="cluv-feed-right">
                        <div className="cluv-feed-price-wrap">
                          <span className="cluv-feed-amount">
                            Rp {inv.amount_idr?.toLocaleString('id-ID')}
                          </span>
                          {isPaid ? (
                            <Badge variant="teal" icon={<CheckCircle2 size={10} />}>
                              Lunas
                            </Badge>
                          ) : isUnpaid ? (
                            <Badge variant="gold" icon={<Clock size={10} />}>
                              Belum Bayar
                            </Badge>
                          ) : (
                            <Badge variant="rose">
                              Batal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===================== BOTTOM SHEET RESMI: DETAIL TRANSAKSI ===================== */}
      <BottomSheet
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={
          <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
            <div className="cluv-card-icon-wrap is-sm is-teal">
              <Receipt size={18} />
            </div>
            <span className="cluv-font-bold cluv-text-dark" style={{ fontSize: '1rem' }}>
              Rincian Tagihan
            </span>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="cluv-flex-col cluv-gap-4 cluv-pt-1">
            {/* Hero Nominal & Status */}
            <div className="cluv-card cluv-text-center cluv-py-4 cluv-items-center cluv-gap-1">
              <span className="cluv-caption cluv-text-muted">Total Pembayaran</span>
              <div
                className="cluv-font-bold cluv-text-dark"
                style={{ fontSize: '1.75rem', fontVariantNumeric: 'tabular-nums' }}
              >
                Rp {selectedInvoice.amount_idr?.toLocaleString('id-ID')}
              </div>
              <div className="cluv-mt-1">
                {selectedInvoice.status === 'PAID' ? (
                  <Badge variant="teal" icon={<CheckCircle2 size={12} />}>
                    PEMBAYARAN LUNAS
                  </Badge>
                ) : selectedInvoice.status === 'UNPAID' ? (
                  <Badge variant="gold" icon={<Clock size={12} />}>
                    MENUNGGU PEMBAYARAN
                  </Badge>
                ) : (
                  <Badge variant="rose" icon={<AlertCircle size={12} />}>
                    KADALUARSA / BATAL
                  </Badge>
                )}
              </div>
            </div>

            {/* Receipt Box Breakdown (Balanced & Mobile-Optimized) */}
            <div className="cluv-receipt-box">
              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Paket Layanan</span>
                <span className="cluv-receipt-val">{getPlanTitle(selectedInvoice.plan)}</span>
              </div>

              {/* Stacked Row: Nomor Referensi agar tidak mendesak label */}
              <div className="cluv-receipt-stacked">
                <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                  <span className="cluv-receipt-label">Nomor Referensi</span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(selectedInvoice.merchant_ref)}
                    className="cluv-btn is-outline is-sm cluv-flex-row cluv-items-center"
                    style={{ padding: '2px 8px', minHeight: 'unset', height: '22px', fontSize: '0.75rem' }}
                    title="Salin Nomor Referensi"
                    aria-label="Salin Nomor Referensi"
                  >
                    <Copy size={11} className="cluv-mr-1" />
                    <span>Salin</span>
                  </button>
                </div>
                <span
                  className="cluv-receipt-val"
                  style={{
                    fontFamily: 'var(--cluv-font-mono, monospace)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    wordBreak: 'break-all',
                    color: 'var(--cluv-teal-dark, #127a75)',
                  }}
                >
                  {selectedInvoice.merchant_ref}
                </span>
              </div>

              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Waktu Transaksi</span>
                <span className="cluv-receipt-val">{formatBriefDate(selectedInvoice.created_at)}</span>
              </div>

              {selectedInvoice.paid_at && (
                <div className="cluv-receipt-row">
                  <span className="cluv-receipt-label">Waktu Pembayaran</span>
                  <span className="cluv-receipt-val">{formatBriefDate(selectedInvoice.paid_at)}</span>
                </div>
              )}

              {selectedInvoice.status === 'UNPAID' && selectedInvoice.expired_at && (
                <div className="cluv-receipt-row">
                  <span className="cluv-receipt-label">Batas Pembayaran</span>
                  <span className="cluv-receipt-val cluv-text-gold">
                    {formatBriefDate(selectedInvoice.expired_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="cluv-flex-col cluv-gap-2 cluv-mt-2">
              {selectedInvoice.status === 'UNPAID' ? (
                <Button
                  variant="primary"
                  iconRight={<ExternalLink size={14} />}
                  to={`/checkout/${selectedInvoice.merchant_ref}`}
                  block
                >
                  Bayar Sekarang
                </Button>
              ) : null}

              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
                block
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Toast Feedback Salin */}
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
        variant="success"
        message={toastMessage || ''}
      />
    </div>
  )
}
