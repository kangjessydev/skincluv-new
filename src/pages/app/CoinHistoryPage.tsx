import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react'
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
      if (data) setTransactions(data as unknown as CoinTransaction[])
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
    <div className="v0-page-container animate-fade-in">
      <div className="v0-profile-form-container">
        <button
          type="button"
          className="v0-back-link"
          onClick={() => navigate('/profile/billing')}
        >
          <ArrowLeft size={16} /> Kembali ke Billing & Langganan
        </button>

        <div className="v0-profile-form-header" style={{ marginTop: '12px' }}>
          <h1 className="v0-profile-form-main-title">Riwayat Mutasi Credits</h1>
          <p className="v0-profile-form-main-sub">Rincian perolehan dan penggunaan AI Credits Skincluv kamu.</p>
        </div>

        {/* Coin Balance Card */}
        <div className="v0-profile-card v0-stat-card">
          <div className="v0-stat-card-left">
            <div className="v0-profile-credits-icon-box">
              <Coins size={22} />
            </div>
            <div>
              <span className="v0-profile-credits-title">Total Saldo Credits</span>
              <span className="v0-stat-card-val">{coinBalance?.balance ?? 0} Credits</span>
            </div>
          </div>
          <Link to="/missions" className="v0-profile-hub-action-btn">
            + Dapatkan Credits
          </Link>
        </div>

        {/* Filter Tabs & History List Card */}
        <div className="v0-profile-card">
          <div className="v0-filter-bar">
            <span className="v0-filter-label"><Filter size={15} /> Filter Mutasi:</span>
            <div className="v0-profile-chip-group">
              <button
                type="button"
                className={`v0-profile-chip ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                Semua
              </button>
              <button
                type="button"
                className={`v0-profile-chip ${filter === 'CREDIT' ? 'active' : ''}`}
                onClick={() => setFilter('CREDIT')}
              >
                Pemasukan (+)
              </button>
              <button
                type="button"
                className={`v0-profile-chip ${filter === 'DEBIT' ? 'active' : ''}`}
                onClick={() => setFilter('DEBIT')}
              >
                Pengeluaran (-)
              </button>
            </div>
          </div>

          <div className="v0-ledger-list">
            {loading ? (
              <p className="v0-ledger-sub" style={{ textAlign: 'center', padding: '32px 0' }}>Memuat riwayat mutasi...</p>
            ) : filtered.length === 0 ? (
              <p className="v0-ledger-sub" style={{ textAlign: 'center', padding: '32px 0' }}>Belum ada riwayat mutasi credits.</p>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="v0-ledger-item">
                  <div className="v0-ledger-left">
                    <div className={`v0-ledger-icon ${isCredit(item.type) ? 'optimal' : 'alert'}`}>
                      {isCredit(item.type) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className="v0-ledger-info">
                      <h4 className="v0-ledger-title">{item.notes || TYPE_LABEL[item.type] || item.type}</h4>
                      <span className="v0-ledger-sub">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={`v0-ledger-amount ${isCredit(item.type) ? 'credit' : 'debit'}`}>
                    {isCredit(item.type) ? '+' : '-'}{item.amount} Credits
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
