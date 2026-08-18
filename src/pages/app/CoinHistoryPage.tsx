import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Coins, ArrowUpRight, ArrowDownLeft, RefreshCw, History } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function CoinHistoryPage() {
  const { session, coinBalance } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const fetchCoinHistory = async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTransactions(data)
      }
    } catch (err) {
      console.error('Fetch coin history error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoinHistory()
  }, [session])

  const filteredTx = transactions.filter(t => {
    if (filter === 'income') return t.amount > 0
    if (filter === 'expense') return t.amount < 0
    return true
  })

  return (
    <div className="coin-history-page animate-fade-in">
      <div className="history-header">
        <Link to="/profile" className="back-link">
          <ArrowLeft size={18} /> Profil Saya
        </Link>
        <h1>Riwayat Koin Darurat</h1>
        <p className="page-subtitle">Daftar pemasukan koin dari misi dan penggunaan fitur AI.</p>
      </div>

      {/* Balance Summary Header */}
      <div className="balance-banner glass-card">
        <div className="banner-left">
          <Coins size={36} className="coin-gold-icon" />
          <div>
            <span className="banner-label">Saldo Koin Saat Ini</span>
            <div className="banner-amount">{coinBalance?.balance ?? 0} Koin</div>
          </div>
        </div>
        <span className="banner-badge">Tidak Pernah Hangus</span>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          Semua ({transactions.length})
        </button>
        <button className={`tab-btn ${filter === 'income' ? 'active' : ''}`} onClick={() => setFilter('income')}>
          Pemasukan ({transactions.filter(t => t.amount > 0).length})
        </button>
        <button className={`tab-btn ${filter === 'expense' ? 'active' : ''}`} onClick={() => setFilter('expense')}>
          Pengeluaran ({transactions.filter(t => t.amount < 0).length})
        </button>
      </div>

      {/* Transaction List */}
      <div className="tx-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="animate-spin text-brand" />
            <p>Memuat riwayat koin...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="empty-state glass-card">
            <History size={48} className="empty-icon" />
            <h3>Belum Ada Mutasi Koin</h3>
            <p>Selesaikan misi harian untuk mengumpulkan koin gratis!</p>
            <Link to="/missions" className="btn btn-primary btn-sm mt-md">Buka Misi Harian</Link>
          </div>
        ) : (
          filteredTx.map(t => {
            const isIncome = t.amount > 0
            const dateFormatted = new Date(t.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={t.id} className="tx-item glass-card">
                <div className="tx-left">
                  <div className={`tx-icon-circle ${isIncome ? 'income' : 'expense'}`}>
                    {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <h4 className="tx-title">{t.notes || (isIncome ? 'Hadiah Misi' : 'Penggunaan AI')}</h4>
                    <span className="tx-date">{dateFormatted}</span>
                  </div>
                </div>
                <div className={`tx-amount ${isIncome ? 'income' : 'expense'}`}>
                  {isIncome ? `+${t.amount}` : t.amount} Koin
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        .coin-history-page { padding-bottom: 120px; max-width: 600px; margin: 0 auto; }
        .history-header { margin-bottom: var(--space-lg); }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-brand-300); font-size: 0.875rem; text-decoration: none; margin-bottom: 4px; }
        .history-header h1 { font-size: 1.5rem; margin: 0; }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 2px; }

        .balance-banner {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-lg); border-radius: var(--radius-xl); margin-bottom: var(--space-lg);
          background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(245,158,11,0.15));
          border: 1px solid rgba(245,158,11,0.3);
        }
        .banner-left { display: flex; align-items: center; gap: 14px; }
        .coin-gold-icon { color: #FBBF24; filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4)); }
        .banner-label { font-size: 0.75rem; color: var(--color-text-muted); display: block; }
        .banner-amount { font-size: 1.5rem; font-weight: 800; color: white; }
        .banner-badge { font-size: 0.75rem; font-weight: 700; color: #FBBF24; background: rgba(251,191,36,0.1); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(251,191,36,0.3); }

        .filter-tabs { display: flex; gap: 8px; margin-bottom: var(--space-lg); }
        .tab-btn {
          padding: 8px 16px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05);
          border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.8125rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .tab-btn:hover { color: white; background: rgba(255,255,255,0.1); }
        .tab-btn.active { background: var(--color-brand-500); color: white; border-color: var(--color-brand-400); }

        .tx-list { display: flex; flex-direction: column; gap: 10px; }
        .loading-state, .empty-state { text-align: center; padding: 48px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon { color: var(--color-text-muted); opacity: 0.5; }

        .tx-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-radius: var(--radius-lg); border: 1px solid var(--color-border);
        }
        .tx-left { display: flex; align-items: center; gap: 12px; }
        .tx-icon-circle {
          width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .tx-icon-circle.income { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .tx-icon-circle.expense { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        .tx-title { font-size: 0.875rem; margin: 0 0 2px 0; }
        .tx-date { font-size: 0.75rem; color: var(--color-text-muted); }
        .tx-amount { font-weight: 800; font-size: 0.9375rem; }
        .tx-amount.income { color: #22c55e; }
        .tx-amount.expense { color: #ef4444; }
      `}</style>
    </div>
  )
}
