import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2, CreditCard, ExternalLink, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge } from '@/components/ui'

export default function TransactionHistoryPage() {
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'expired'>('all')

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
          setInvoices(data)
        }
      } catch (err) {
        console.error('Fetch transactions error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [session])

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'unpaid') return inv.status === 'UNPAID'
    if (filter === 'paid') return inv.status === 'PAID'
    if (filter === 'expired') return inv.status === 'EXPIRED' || inv.status === 'FAILED'
    return true
  })

  return (
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back Link to Billing */}
      <Link to="/profile/billing" className="cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1">
        <ArrowLeft size={16} />
        <span>Kembali ke Billing &amp; Langganan</span>
      </Link>

      {/* Page Header */}
      <div className="cluv-flex-col cluv-gap-1 cluv-mt-3">
        <h1 className="cluv-title-page">Riwayat Tagihan &amp; Transaksi</h1>
        <p className="cluv-caption cluv-text-muted">
          Daftar tagihan &amp; status pembayaran paket langganan kamu.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="cluv-tabs cluv-mt-5">
        <button
          type="button"
          className={`cluv-tab-btn ${filter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span>Semua</span>
          <span className="cluv-tab-badge">{invoices.length}</span>
        </button>
        <button
          type="button"
          className={`cluv-tab-btn ${filter === 'unpaid' ? 'is-active' : ''}`}
          onClick={() => setFilter('unpaid')}
        >
          <span>Belum Dibayar</span>
          <span className="cluv-tab-badge">{invoices.filter((i) => i.status === 'UNPAID').length}</span>
        </button>
        <button
          type="button"
          className={`cluv-tab-btn ${filter === 'paid' ? 'is-active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          <span>Lunas</span>
          <span className="cluv-tab-badge">{invoices.filter((i) => i.status === 'PAID').length}</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="cluv-flex-col cluv-gap-3 cluv-mt-6">
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
              Kamu belum memiliki riwayat transaksi di Skincluv.
            </p>
            <Button variant="primary" size="sm" to="/pricing" className="cluv-mt-4">
              Upgrade ke PRO
            </Button>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.status === 'PAID'
            const isUnpaid = inv.status === 'UNPAID'
            const dateFormatted = new Date(inv.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={inv.id} className="cluv-ledger-card">
                <div className="cluv-ledger-header">
                  <div>
                    <span className="cluv-ledger-ref">{inv.merchant_ref}</span>
                    <span className="cluv-ledger-date">{dateFormatted}</span>
                  </div>
                  {isPaid ? (
                    <Badge variant="teal" icon={<CheckCircle2 size={12} />}>
                      LUNAS
                    </Badge>
                  ) : isUnpaid ? (
                    <Badge variant="gold" icon={<Clock size={12} />}>
                      BELUM DIBAYAR
                    </Badge>
                  ) : (
                    <Badge variant="rose">
                      KADALUARSA
                    </Badge>
                  )}
                </div>

                <div className="cluv-ledger-body">
                  <div className="cluv-ledger-main">
                    <div className="cluv-card-icon-wrap is-sm is-teal">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h4 className="cluv-ledger-title">Skincluv PRO — 1 Bulan</h4>
                      <span className="cluv-ledger-amount">
                        Rp {inv.amount_idr?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {isUnpaid && (
                    <Button
                      variant="primary"
                      size="sm"
                      iconRight={<ExternalLink size={13} />}
                      to={`/checkout/${inv.merchant_ref}`}
                    >
                      Bayar Sekarang
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
