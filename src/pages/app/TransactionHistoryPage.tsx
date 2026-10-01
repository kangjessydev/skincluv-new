import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle2, CreditCard, ExternalLink, RefreshCw, ShoppingBag } from 'lucide-react'
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
    <div className="v0-page-container animate-fade-in">
      <div className="v0-profile-form-container">
        <div>
          <Link to="/profile/billing" className="v0-back-link">
            <ArrowLeft size={16} /> Kembali ke Billing & Langganan
          </Link>
          <div className="v0-profile-form-header" style={{ marginTop: '12px' }}>
            <h1 className="v0-profile-form-main-title">Riwayat Tagihan & Transaksi</h1>
            <p className="v0-profile-form-main-sub">Daftar tagihan & status pembayaran paket langganan kamu.</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="v0-filter-bar">
          <div className="v0-profile-chip-group">
            <button
              type="button"
              className={`v0-profile-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Semua ({invoices.length})
            </button>
            <button
              type="button"
              className={`v0-profile-chip ${filter === 'unpaid' ? 'active' : ''}`}
              onClick={() => setFilter('unpaid')}
            >
              Belum Dibayar ({invoices.filter(i => i.status === 'UNPAID').length})
            </button>
            <button
              type="button"
              className={`v0-profile-chip ${filter === 'paid' ? 'active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Lunas ({invoices.filter(i => i.status === 'PAID').length})
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="v0-ledger-list">
          {loading ? (
            <div className="v0-profile-card v0-loading-state">
              <RefreshCw size={24} className="animate-spin text-teal" />
              <p className="v0-ledger-sub">Memuat riwayat transaksi...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="v0-profile-card v0-empty-state">
              <ShoppingBag size={44} className="v0-empty-icon" />
              <h3 className="v0-profile-hub-title">Belum Ada Transaksi</h3>
              <p className="v0-profile-hub-sub">Kamu belum memiliki riwayat transaksi di Skincluv.</p>
              <Link to="/pricing" className="v0-btn-action" style={{ marginTop: '12px' }}>
                Upgrade ke PRO
              </Link>
            </div>
          ) : (
            filteredInvoices.map(inv => {
              const isPaid = inv.status === 'PAID'
              const isUnpaid = inv.status === 'UNPAID'
              const dateFormatted = new Date(inv.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })

              return (
                <div key={inv.id} className="v0-profile-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px dashed var(--color-border)' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-teal)', display: 'block' }}>
                        {inv.merchant_ref}
                      </span>
                      <span className="v0-ledger-sub" style={{ marginTop: '2px' }}>{dateFormatted}</span>
                    </div>
                    {isPaid ? (
                      <span className="v0-badge success"><CheckCircle2 size={12} /> LUNAS</span>
                    ) : isUnpaid ? (
                      <span className="v0-badge warning"><Clock size={12} /> BELUM DIBAYAR</span>
                    ) : (
                      <span className="v0-badge danger">KADALUARSA</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CreditCard size={20} style={{ color: 'var(--color-teal)', flexShrink: 0 }} />
                      <div>
                        <h4 className="v0-ledger-title">Skincluv PRO — 1 Bulan</h4>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                          Rp {inv.amount_idr?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    
                    {isUnpaid && (
                      <Link to={`/checkout/${inv.merchant_ref}`} className="v0-btn-action">
                        Bayar Sekarang <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
