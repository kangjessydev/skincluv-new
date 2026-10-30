import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Crown,
  ExternalLink,
  ShoppingBag,
  ChevronRight,
  Copy,
  Receipt,
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
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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
      if (filter === 'unpaid') return inv.status === 'UNPAID'
      if (filter === 'paid') return inv.status === 'PAID'
      if (filter === 'expired') return inv.status === 'EXPIRED' || inv.status === 'FAILED'
      return true
    })
  }, [invoices, filter])

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

  const formatFullDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
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

      {/* Filter Chips Horizontal Scrollable (Mobile-First Thumb-Friendly) */}
      <div className="cluv-filter-scroll cluv-mt-4 cluv-mb-4">
        <button
          type="button"
          className={`cluv-chip is-pill ${filter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span>Semua</span>
          <span className="cluv-tab-badge">{invoices.length}</span>
        </button>
        <button
          type="button"
          className={`cluv-chip is-pill ${filter === 'unpaid' ? 'is-active' : ''}`}
          onClick={() => setFilter('unpaid')}
        >
          <span>Belum Dibayar</span>
          <span className="cluv-tab-badge">{unpaidCount}</span>
        </button>
        <button
          type="button"
          className={`cluv-chip is-pill ${filter === 'paid' ? 'is-active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          <span>Lunas</span>
          <span className="cluv-tab-badge">{paidCount}</span>
        </button>
        {expiredCount > 0 && (
          <button
            type="button"
            className={`cluv-chip is-pill ${filter === 'expired' ? 'is-active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            <span>Kadaluarsa</span>
            <span className="cluv-tab-badge">{expiredCount}</span>
          </button>
        )}
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
              {filter === 'all'
                ? 'Kamu belum memiliki riwayat transaksi di Skincluv.'
                : 'Tidak ada transaksi untuk filter yang dipilih.'}
            </p>
            {filter === 'all' ? (
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
                        <ChevronRight size={16} className="cluv-feed-arrow" />
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
          <div className="cluv-flex-row cluv-items-center cluv-gap-2">
            <div className="cluv-card-icon-wrap is-sm is-teal">
              <Receipt size={16} />
            </div>
            <span>Rincian Tagihan</span>
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

            {/* Receipt Box Breakdown */}
            <div className="cluv-receipt-box">
              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Paket Layanan</span>
                <span className="cluv-receipt-val">{getPlanTitle(selectedInvoice.plan)}</span>
              </div>

              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Nomor Referensi</span>
                <div className="cluv-flex-row cluv-items-center cluv-gap-1.5">
                  <span
                    className="cluv-receipt-val"
                    style={{ fontFamily: 'var(--cluv-font-mono, monospace)', fontSize: '0.8125rem' }}
                  >
                    {selectedInvoice.merchant_ref}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(selectedInvoice.merchant_ref)}
                    className="cluv-btn is-outline is-sm"
                    style={{ padding: '3px 7px', minHeight: 'unset', height: '24px' }}
                    title="Salin Nomor Referensi"
                    aria-label="Salin Nomor Referensi"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Waktu Transaksi</span>
                <span className="cluv-receipt-val">{formatFullDate(selectedInvoice.created_at)}</span>
              </div>

              {selectedInvoice.paid_at && (
                <div className="cluv-receipt-row">
                  <span className="cluv-receipt-label">Waktu Pembayaran</span>
                  <span className="cluv-receipt-val">{formatFullDate(selectedInvoice.paid_at)}</span>
                </div>
              )}

              {selectedInvoice.status === 'UNPAID' && selectedInvoice.expired_at && (
                <div className="cluv-receipt-row">
                  <span className="cluv-receipt-label">Batas Pembayaran</span>
                  <span className="cluv-receipt-val cluv-text-gold">
                    {formatFullDate(selectedInvoice.expired_at)}
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
