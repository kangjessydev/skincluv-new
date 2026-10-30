import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  Search,
  X,
  Filter,
  Check,
  Copy,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge, BottomSheet, Toast } from '@/components/ui'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<CoinTransaction | null>(null)
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

  // Hitung total pemasukan dan pengeluaran akumulatif
  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0
    let expense = 0
    transactions.forEach((t) => {
      if (isCredit(t.type)) {
        income += Math.abs(t.amount)
      } else {
        expense += Math.abs(t.amount)
      }
    })
    return { totalIncome: income, totalExpense: expense }
  }, [transactions])

  // Mapping teks notes mentah ke bahasa Indonesia yang ramah pengguna
  const getActionTitle = (item: CoinTransaction) => {
    if (item.notes) {
      const lower = item.notes.toLowerCase()
      if (lower.includes('face') || lower.includes('wajah')) return 'Pemindaian Wajah AI'
      if (lower.includes('ingredient') || lower.includes('komposisi')) return 'Analisis Komposisi Skincare'
      if (lower.includes('chat') || lower.includes('skinsistant')) return 'Konsultasi Skinsistant AI'
      if (lower.includes('daily') || lower.includes('misi')) return 'Hadiah Misi Harian'
      if (lower.includes('welcome') || lower.includes('selamat datang')) return 'Bonus Selamat Datang'
      if (lower.includes('ai feature usage')) return 'Penggunaan Fitur AI'
      return item.notes
    }
    if (item.type === 'mission_reward') return 'Hadiah Misi Harian'
    if (item.type === 'ai_usage') return 'Penggunaan Fitur AI'
    if (item.type === 'admin_adjustment') return 'Penyesuaian Akun'
    return 'Mutasi AI Credits'
  }

  // Filter gabungan (Status + Search Query)
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Filter Tipe Mutasi
      if (filter === 'CREDIT' && !isCredit(t.type)) return false
      if (filter === 'DEBIT' && isCredit(t.type)) return false

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const title = getActionTitle(t).toLowerCase()
        const notes = (t.notes || '').toLowerCase()
        const matchType = (TYPE_LABEL[t.type] || '').toLowerCase()
        if (!title.includes(q) && !notes.includes(q) && !matchType.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [transactions, filter, searchQuery])

  // Pengelompokan mutasi otomatis per Bulan & Tahun
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { label: string; items: CoinTransaction[] } } = {}

    filtered.forEach((t) => {
      const date = new Date(t.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

      if (!groups[key]) {
        groups[key] = { label, items: [] }
      }
      groups[key].items.push(t)
    })

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key])
  }, [filtered])

  const handleCopyRef = async (refText: string) => {
    try {
      await navigator.clipboard.writeText(refText)
      setToastMessage('ID mutasi berhasil disalin ke clipboard')
    } catch {
      setToastMessage('Gagal menyalin ID mutasi')
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

  const creditCount = transactions.filter((t) => isCredit(t.type)).length
  const debitCount = transactions.filter((t) => !isCredit(t.type)).length

  const filterOptions = [
    { key: 'ALL' as const, label: 'Semua', count: transactions.length, dotClass: 'is-all' },
    { key: 'CREDIT' as const, label: 'Pemasukan (+)', count: creditCount, dotClass: 'is-paid' },
    { key: 'DEBIT' as const, label: 'Pengeluaran (-)', count: debitCount, dotClass: 'is-expired' },
  ]

  const activeFilterOption = filterOptions.find((o) => o.key === filter) || filterOptions[0]

  return (
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back to Billing Link (Desktop only) */}
      <button
        type="button"
        className="cluv-hide-mobile cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3"
        onClick={() => navigate('/profile/billing')}
      >
        <ArrowLeft size={16} /> Kembali ke Billing &amp; Langganan
      </button>

      {/* Header (Desktop only) */}
      <div className="cluv-hide-mobile cluv-mb-5">
        <h1 className="cluv-title-page">Riwayat Mutasi Credits</h1>
        <p className="cluv-caption cluv-text-muted">
          Rincian perolehan dan penggunaan AI Credits Skincluv kamu.
        </p>
      </div>

      {/* ===================== BENTO WALLET CARD: TOTAL SALDO & CASHFLOW INSIGHTS ===================== */}
      <div className="cluv-bento-wallet cluv-mb-5">
        <div className="cluv-bento-wallet-top">
          <div className="cluv-bento-wallet-balance-wrap">
            <span className="cluv-bento-wallet-tag">
              <Zap size={13} className="cluv-text-gold" />
              <span>Total Saldo AI Credits</span>
            </span>
            <div className="cluv-bento-wallet-val">
              <span>{(coinBalance?.balance ?? 0).toLocaleString('id-ID')}</span>
              <span className="cluv-bento-wallet-unit">Credits</span>
            </div>
          </div>

          <Button variant="primary" size="sm" to="/missions" radius="pill">
            <Sparkles size={14} className="cluv-mr-1" />
            + Dapatkan Credits
          </Button>
        </div>

        {/* Mini Stats Insight: Pemasukan & Pengeluaran */}
        <div className="cluv-bento-wallet-stats">
          <div className="cluv-bento-wallet-stat-item">
            <span className="cluv-bento-wallet-stat-label">Total Diperoleh</span>
            <span className="cluv-bento-wallet-stat-val is-income">
              +{totalIncome.toLocaleString('id-ID')} Credits
            </span>
          </div>

          <div className="cluv-bento-wallet-stat-item">
            <span className="cluv-bento-wallet-stat-label">Total Digunakan</span>
            <span className="cluv-bento-wallet-stat-val is-expense">
              -{totalExpense.toLocaleString('id-ID')} Credits
            </span>
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP ONLY: Search & Filter Chips ===================== */}
      <div className="cluv-hide-mobile cluv-flex-row cluv-items-center cluv-justify-between cluv-gap-3 cluv-mt-4 cluv-mb-4">
        <div className="cluv-feed-search-wrap" style={{ maxWidth: '280px' }}>
          <Search size={14} className="cluv-feed-search-icon" />
          <input
            type="text"
            className="cluv-feed-search-input"
            placeholder="Cari mutasi..."
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
              placeholder="Cari mutasi credits..."
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

          {/* Filter Dropdown di Kanan (Icon Only + Kondisional Badge) */}
          <div className="cluv-filter-dropdown-wrap" style={{ width: 'auto' }} ref={dropdownRef}>
            <button
              type="button"
              className={`cluv-filter-trigger-btn ${filter !== 'ALL' ? 'is-active' : ''}`}
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              aria-expanded={isFilterDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Filter mutasi: ${activeFilterOption.label}`}
              title={`Filter: ${activeFilterOption.label}`}
            >
              <Filter size={15} className={filter !== 'ALL' ? 'cluv-text-teal' : ''} />
              {filter !== 'ALL' && (
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

      {/* ===================== MUTATION FEED LIST ===================== */}
      <div className="cluv-flex-col cluv-gap-4 cluv-mt-2">
        {loading ? (
          <div className="cluv-card cluv-text-center cluv-py-8 cluv-items-center">
            <div className="cluv-spinner is-md cluv-mb-3" />
            <p className="cluv-caption cluv-text-muted">Memuat riwayat mutasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cluv-card cluv-text-center cluv-py-8 cluv-items-center">
            <div className="cluv-card-icon-wrap is-lg is-gold cluv-mb-3">
              <Coins size={28} />
            </div>
            <h3 className="cluv-title-card">Belum Ada Mutasi Credits</h3>
            <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-max-w-md">
              {searchQuery
                ? `Tidak ditemukan mutasi dengan kata kunci "${searchQuery}".`
                : filter === 'ALL'
                ? 'Riwayat perolehan atau penggunaan credits kamu akan tampil di sini.'
                : 'Tidak ada mutasi untuk jenis yang dipilih.'}
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setFilter('ALL')
                }}
                className="cluv-mt-4"
              >
                Reset Pencarian
              </Button>
            ) : (
              <Button variant="primary" size="sm" to="/missions" className="cluv-mt-4">
                Selesaikan Misi
              </Button>
            )}
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.label} className="cluv-feed-group">
              <span className="cluv-feed-period">{group.label}</span>
              <div className="cluv-feed-card">
                {group.items.map((item) => {
                  const isIncome = isCredit(item.type)
                  const absAmount = Math.abs(item.amount)
                  const actionTitle = getActionTitle(item)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="cluv-feed-item"
                      onClick={() => setSelectedTransaction(item)}
                      aria-label={`Rincian mutasi ${actionTitle}, ${isIncome ? '+' : '-'}${absAmount} Credits`}
                    >
                      <div className="cluv-feed-left">
                        <div
                          className={`cluv-card-icon-wrap is-sm ${
                            isIncome ? 'is-teal' : 'is-rose'
                          }`}
                        >
                          {isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="cluv-feed-info">
                          <h4 className="cluv-feed-title">{actionTitle}</h4>
                          <span className="cluv-feed-meta">
                            {formatShortDate(item.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Kolom Kanan: Nilai Mutasi Bersih Tanpa Typo Minus Ganda */}
                      <div className="cluv-feed-right">
                        <div className="cluv-feed-price-wrap">
                          <span
                            className={`cluv-feed-amount ${
                              isIncome ? 'cluv-text-teal' : 'cluv-text-rose'
                            }`}
                          >
                            {isIncome ? `+${absAmount}` : `-${absAmount}`} Credits
                          </span>
                          <span className="cluv-caption cluv-text-muted" style={{ fontSize: '0.6875rem' }}>
                            {TYPE_LABEL[item.type] || item.type}
                          </span>
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

      {/* ===================== BOTTOM SHEET RESMI: DETAIL MUTASI CREDITS ===================== */}
      <BottomSheet
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={
          <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
            <div className="cluv-card-icon-wrap is-sm is-gold">
              <Coins size={18} />
            </div>
            <span className="cluv-font-bold cluv-text-dark" style={{ fontSize: '1rem' }}>
              Rincian Mutasi Credits
            </span>
          </div>
        }
      >
        {selectedTransaction && (
          <div className="cluv-flex-col cluv-gap-4 cluv-pt-1">
            {/* Hero Nominal & Arah Mutasi */}
            <div className="cluv-card cluv-text-center cluv-py-4 cluv-items-center cluv-gap-1">
              <span className="cluv-caption cluv-text-muted">Jumlah Perubahan</span>
              <div
                className={`cluv-font-bold ${
                  isCredit(selectedTransaction.type) ? 'cluv-text-teal' : 'cluv-text-rose'
                }`}
                style={{ fontSize: '1.75rem', fontVariantNumeric: 'tabular-nums' }}
              >
                {isCredit(selectedTransaction.type) ? '+' : '-'}
                {Math.abs(selectedTransaction.amount)} Credits
              </div>
              <div className="cluv-mt-1">
                {isCredit(selectedTransaction.type) ? (
                  <Badge variant="teal" icon={<ArrowDownLeft size={12} />}>
                    PEMASUKAN KREDIT
                  </Badge>
                ) : (
                  <Badge variant="rose" icon={<ArrowUpRight size={12} />}>
                    PENGGUNAAN KREDIT
                  </Badge>
                )}
              </div>
            </div>

            {/* Receipt Box Breakdown */}
            <div className="cluv-receipt-box">
              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Aktivitas / Fitur</span>
                <span className="cluv-receipt-val">{getActionTitle(selectedTransaction)}</span>
              </div>

              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Jenis Mutasi</span>
                <span className="cluv-receipt-val">
                  {TYPE_LABEL[selectedTransaction.type] || selectedTransaction.type}
                </span>
              </div>

              <div className="cluv-receipt-row">
                <span className="cluv-receipt-label">Waktu Transaksi</span>
                <span className="cluv-receipt-val">
                  {formatBriefDate(selectedTransaction.created_at)}
                </span>
              </div>

              {/* Stacked Row: ID Transaksi */}
              <div className="cluv-receipt-stacked">
                <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                  <span className="cluv-receipt-label">ID Transaksi</span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(selectedTransaction.id)}
                    className="cluv-btn is-outline is-sm cluv-flex-row cluv-items-center"
                    style={{ padding: '2px 8px', minHeight: 'unset', height: '22px', fontSize: '0.75rem' }}
                    title="Salin ID Transaksi"
                    aria-label="Salin ID Transaksi"
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
                  {selectedTransaction.id}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="cluv-flex-col cluv-gap-2 cluv-mt-2">
              <Button
                variant="primary"
                to="/missions"
                block
              >
                Kumpulkan Lebih Banyak Credits
              </Button>

              <Button
                variant="outline"
                onClick={() => setSelectedTransaction(null)}
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
