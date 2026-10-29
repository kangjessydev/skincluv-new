import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui'

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
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back to Billing Link (Desktop only; di mobile sudah ada tombol kembali di topbar) */}
      <button
        type="button"
        className="cluv-hide-mobile cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3"
        onClick={() => navigate('/profile/billing')}
      >
        <ArrowLeft size={16} /> Kembali ke Billing & Langganan
      </button>

      {/* Header */}
      <div className="cluv-mb-6">
        <h1 className="cluv-title-page">Riwayat Mutasi Credits</h1>
        <p className="cluv-caption cluv-text-muted">Rincian perolehan dan penggunaan AI Credits Skincluv kamu.</p>
      </div>

      {/* Coin Balance Banner Card */}
      <div className="cluv-card cluv-mb-6 cluv-flex-between cluv-flex-wrap cluv-gap-4">
        <div className="cluv-flex-row cluv-items-center cluv-gap-3">
          <div className="cluv-card-icon-wrap is-sm is-gold">
            <Coins size={20} />
          </div>
          <div className="cluv-flex-col">
            <span className="cluv-caption cluv-text-muted">Total Saldo Credits</span>
            <span className="cluv-title-card cluv-font-bold cluv-text-gold">
              {coinBalance?.balance ?? 0} Credits
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" to="/missions">
          + Dapatkan Credits
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="cluv-tabs">
        <button
          type="button"
          className={`cluv-tab-btn ${filter === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          <span>Semua</span>
          <span className="cluv-tab-badge">{transactions.length}</span>
        </button>
        <button
          type="button"
          className={`cluv-tab-btn ${filter === 'CREDIT' ? 'is-active' : ''}`}
          onClick={() => setFilter('CREDIT')}
        >
          <span>Pemasukan (+)</span>
          <span className="cluv-tab-badge">{transactions.filter(t => isCredit(t.type)).length}</span>
        </button>
        <button
          type="button"
          className={`cluv-tab-btn ${filter === 'DEBIT' ? 'is-active' : ''}`}
          onClick={() => setFilter('DEBIT')}
        >
          <span>Pengeluaran (-)</span>
          <span className="cluv-tab-badge">{transactions.filter(t => !isCredit(t.type)).length}</span>
        </button>
      </div>

      {/* Mutation List */}
      <div className="cluv-flex-col cluv-gap-3 cluv-mt-6">
        {loading ? (
          <div className="cluv-card cluv-text-center cluv-py-8 cluv-items-center">
            <div className="cluv-spinner cluv-mb-3" />
            <p className="cluv-caption cluv-text-muted">Memuat riwayat mutasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cluv-card cluv-text-center cluv-py-8 cluv-items-center">
            <div className="cluv-card-icon-wrap is-lg is-gold cluv-mb-3">
              <Coins size={28} />
            </div>
            <h3 className="cluv-title-card">Belum Ada Mutasi Credits</h3>
            <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-max-w-md">
              Riwayat perolehan atau penggunaan credits kamu akan tampil di sini.
            </p>
            <Button variant="primary" size="sm" to="/missions" className="cluv-mt-4">
              Selesaikan Misi
            </Button>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="cluv-ledger-card">
              <div className="cluv-ledger-body">
                <div className="cluv-ledger-main">
                  <div className={`cluv-card-icon-wrap is-sm ${isCredit(item.type) ? '' : 'is-rose'}`}>
                    {isCredit(item.type) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <h4 className="cluv-ledger-title">{item.notes || TYPE_LABEL[item.type] || item.type}</h4>
                    <span className="cluv-ledger-date">
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
                <div className={`cluv-font-extrabold ${isCredit(item.type) ? 'cluv-text-teal' : 'cluv-text-rose'}`}>
                  {isCredit(item.type) ? '+' : '-'}{item.amount} Credits
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
