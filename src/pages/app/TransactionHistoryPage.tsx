import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2, ShieldAlert, CreditCard, ExternalLink, RefreshCw, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

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

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'unpaid') return inv.status === 'UNPAID'
    if (filter === 'paid') return inv.status === 'PAID'
    if (filter === 'expired') return inv.status === 'EXPIRED' || inv.status === 'FAILED'
    return true
  })

  return (
    <div className="transactions-page animate-fade-in">
      <div className="transactions-header">
        <Link to="/wallet" className="back-link">
          <ArrowLeft size={18} /> Wallet
        </Link>
        <h1>Riwayat Transaksi</h1>
        <p className="page-subtitle">Daftar tagihan & pembayaran paket langganan kamu.</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          Semua ({invoices.length})
        </button>
        <button className={`tab-btn ${filter === 'unpaid' ? 'active' : ''}`} onClick={() => setFilter('unpaid')}>
          Belum Dibayar ({invoices.filter(i => i.status === 'UNPAID').length})
        </button>
        <button className={`tab-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>
          Lunas ({invoices.filter(i => i.status === 'PAID').length})
        </button>
      </div>

      {/* Transactions List */}
      <div className="invoice-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="animate-spin text-brand" />
            <p>Memuat riwayat transaksi...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state glass-card">
            <ShoppingBag size={48} className="empty-icon" />
            <h3>Belum Ada Transaksi</h3>
            <p>Kamu belum memiliki riwayat transaksi di Skincluv.</p>
            <Link to="/wallet" className="btn btn-primary btn-sm mt-md">Upgrade ke PRO</Link>
          </div>
        ) : (
          filteredInvoices.map(inv => {
            const isPaid = inv.status === 'PAID'
            const isUnpaid = inv.status === 'UNPAID'
            const dateFormatted = new Date(inv.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={inv.id} className="invoice-card glass-card">
                <div className="card-top">
                  <div>
                    <span className="merchant-ref">{inv.merchant_ref}</span>
                    <span className="created-date">{dateFormatted}</span>
                  </div>
                  {isPaid ? (
                    <span className="badge badge-success"><CheckCircle2 size={12} /> LUNAS</span>
                  ) : isUnpaid ? (
                    <span className="badge badge-warning"><Clock size={12} /> BELUM DIBAYAR</span>
                  ) : (
                    <span className="badge badge-danger">KADALUARSA</span>
                  )}
                </div>

                <div className="card-body">
                  <div className="plan-name">
                    <CreditCard size={18} className="plan-icon" />
                    <div>
                      <h4>Skincluv PRO — 1 Bulan</h4>
                      <span className="price-tag">Rp {inv.amount_idr?.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  {isUnpaid && (
                    <Link to={`/checkout/${inv.merchant_ref}`} className="btn btn-primary btn-sm btn-pay">
                      Bayar Sekarang <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        .transactions-page { padding-bottom: 120px; max-width: 600px; margin: 0 auto; }
        .transactions-header { margin-bottom: var(--space-lg); }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-brand-300); font-size: 0.875rem; text-decoration: none; margin-bottom: 4px; }
        .transactions-header h1 { font-size: 1.5rem; margin: 0; }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 2px; }

        .filter-tabs { display: flex; gap: 8px; margin-bottom: var(--space-lg); overflow-x: auto; padding-bottom: 4px; }
        .tab-btn {
          padding: 8px 16px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05);
          border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.8125rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s; whitespace: nowrap;
        }
        .tab-btn:hover { color: white; background: rgba(255,255,255,0.1); }
        .tab-btn.active { background: var(--color-brand-500); color: white; border-color: var(--color-brand-400); }

        .invoice-list { display: flex; flex-direction: column; gap: var(--space-md); }
        .loading-state, .empty-state { text-align: center; padding: 48px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon { color: var(--color-text-muted); opacity: 0.5; }

        .invoice-card { padding: var(--space-lg); border-radius: var(--radius-xl); border: 1px solid var(--color-border); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md); padding-bottom: 12px; border-bottom: 1px dashed var(--color-border); }
        .merchant-ref { font-family: monospace; font-size: 0.8125rem; font-weight: 700; color: var(--color-brand-300); display: block; }
        .created-date { font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-top: 2px; }

        .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

        .card-body { display: flex; justify-content: space-between; align-items: center; }
        .plan-name { display: flex; align-items: center; gap: 12px; }
        .plan-icon { color: var(--color-brand-400); }
        .plan-name h4 { font-size: 0.9375rem; margin: 0 0 2px 0; }
        .price-tag { font-size: 0.875rem; font-weight: 700; color: #FBBF24; }
        .btn-pay { gap: 6px; text-decoration: none; }
      `}</style>
    </div>
  )
}
