import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, History, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// Type yang sesuai dengan schema coin_transactions
interface CoinTransaction {
  id: string
  amount: number
  type: 'mission_reward' | 'ai_usage' | 'admin_adjustment'
  notes: string | null
  created_at: string
}

// Mapping type ke label yang user-friendly
const TYPE_LABEL: Record<string, string> = {
  mission_reward: 'Hadiah Misi',
  ai_usage: 'Penggunaan AI',
  admin_adjustment: 'Penyesuaian Admin',
}

// Mapping type ke arah transaksi (credit/debit)
const isCredit = (type: string) => type === 'mission_reward' || type === 'admin_adjustment'

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT'

export default function CoinHistoryPage() {
  const navigate = useNavigate()
  const { user, coinBalance } = useAuthStore()
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchTransactions = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('id, amount, type, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[CoinHistoryPage] Gagal fetch coin_transactions:', error)
      }
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [user])

  const filtered = transactions.filter(t => {
    if (filter === 'ALL') return true
    if (filter === 'CREDIT') return isCredit(t.type)
    return !isCredit(t.type)
  })

  return (
    <div className="coin-history-page animate-fade-in">
      <button className="btn-back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <div className="page-header">
        <h1>Riwayat Mutasi Koin</h1>
        <p className="page-subtitle">Rincian perolehan dan penggunaan Koin Darurat Skincluv kamu.</p>
      </div>

      {/* Coin Balance Card */}
      <div className="balance-card stich-bento-card">
        <div className="balance-left">
          <Coins size={28} className="text-amber-500" />
          <div>
            <span className="balance-label">Total Saldo Koin</span>
            <span className="balance-val">{coinBalance?.balance ?? 50} Koin</span>
          </div>
        </div>
        <Link to="/missions" className="btn btn-primary btn-sm">
          + Dapatkan Koin
        </Link>
      </div>

      {/* Filter Tabs & History List Card */}
      <div className="history-card stich-bento-card">
        <div className="filter-row">
          <span className="filter-title"><Filter size={16} /> Filter Mutasi:</span>
          <div className="tabs">
            <button className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
              Semua
            </button>
            <button className={`tab-btn ${filter === 'CREDIT' ? 'active' : ''}`} onClick={() => setFilter('CREDIT')}>
              Pemasukan (+)
            </button>
            <button className={`tab-btn ${filter === 'DEBIT' ? 'active' : ''}`} onClick={() => setFilter('DEBIT')}>
              Pengeluaran (-)
            </button>
          </div>
        </div>

        <div className="ledger-list">
          {loading ? (
            <p className="status-text">Memuat riwayat mutasi...</p>
          ) : filtered.length === 0 ? (
            <p className="status-text">Belum ada riwayat mutasi koin.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="ledger-item">
                <div className={`icon-circle ${isCredit(item.type) ? 'icon-credit' : 'icon-debit'}`}>
                  {isCredit(item.type) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="ledger-info">
                  <h4>{item.notes || TYPE_LABEL[item.type] || item.type}</h4>
                  <span className="ledger-date">
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`ledger-amount ${isCredit(item.type) ? 'amount-credit' : 'amount-debit'}`}>
                  {isCredit(item.type) ? '+' : '-'}{item.amount} Koin
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .coin-history-page { padding-bottom: 60px; max-width: 680px; margin: 0 auto; width: 100%; }
        .btn-back-link {
          display: inline-flex; align-items: center; gap: 6px; background: transparent; border: none;
          color: var(--color-primary); font-family: var(--font-heading); font-weight: 700; font-size: 0.875rem;
          cursor: pointer; padding: 4px 8px; border-radius: var(--radius-sm); margin-bottom: 12px;
        }
        .btn-back-link:hover { background: var(--color-surface-container-low); }

        .page-header { margin-bottom: var(--space-lg); }
        .page-header h1 { font-size: 1.875rem; margin: 0 0 4px 0; color: var(--color-primary); font-family: var(--font-heading); }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin: 0; }

        .stich-bento-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sky);
          margin-bottom: var(--space-lg);
        }

        .balance-card { display: flex; justify-content: space-between; align-items: center; }
        .balance-left { display: flex; align-items: center; gap: 12px; }
        .coin-icon { font-size: 32px; }
        .balance-label { font-size: 0.75rem; color: var(--color-secondary); display: block; }
        .balance-val { font-size: 1.5rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-heading); }

        .filter-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); flex-wrap: wrap; gap: 8px; }
        .filter-title { font-size: 0.875rem; font-weight: 700; color: var(--color-text-main); display: flex; align-items: center; gap: 6px; }
        .tabs { display: flex; gap: 6px; background: var(--color-surface-container); padding: 4px; border-radius: var(--radius-md); }
        .tab-btn {
          border: none; background: transparent; padding: 6px 12px; border-radius: var(--radius-sm);
          font-family: var(--font-heading); font-size: 0.75rem; font-weight: 600; color: var(--color-secondary); cursor: pointer;
        }
        .tab-btn.active { background: var(--color-surface-container-lowest); color: var(--color-primary); font-weight: 700; box-shadow: var(--shadow-sm); }

        .ledger-list { display: flex; flex-direction: column; gap: 8px; }
        .ledger-item {
          display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-lg);
          background: var(--color-surface-container-low); border: 1px solid var(--color-secondary-container);
        }
        .icon-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .icon-credit { background: var(--color-success-soft); color: var(--color-success); }
        .icon-debit { background: #fef2f2; color: var(--color-error); }

        .ledger-info { flex: 1; }
        .ledger-info h4 { font-size: 0.875rem; margin: 0 0 2px 0; color: var(--color-text-main); }
        .ledger-date { font-size: 0.75rem; color: var(--color-text-muted); }

        .ledger-amount { font-size: 0.9375rem; font-weight: 800; font-family: var(--font-heading); }
        .amount-credit { color: var(--color-success); }
        .amount-debit { color: var(--color-error); }

        .status-text { text-align: center; color: var(--color-text-muted); font-size: 0.875rem; padding: 20px 0; }
      `}</style>
    </div>
  )
}
