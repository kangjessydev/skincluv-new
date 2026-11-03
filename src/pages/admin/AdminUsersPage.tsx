import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  Coins,
  Shield,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  UserCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import '@/styles/admin-users.css'

interface UserItem {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  created_at: string
  role?: string | null
  balance: number
  tierSlug: 'free' | 'glow' | 'premium' | string
  tierName: string
  isSubActive: boolean
  expiresAt: string | null
}

export default function AdminUsersPage() {
  const { userRoles, isAdmin: isStaffAdmin } = useAuthStore()

  const canManageRoles = useMemo(() => {
    return (
      userRoles.includes('super_admin') ||
      userRoles.includes('tech_lead') ||
      userRoles.includes('admin') ||
      (!userRoles.length && isStaffAdmin)
    )
  }, [userRoles, isStaffAdmin])

  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'ALL' | 'FREE' | 'GLOW' | 'PRO'>('ALL')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'ADMIN' | 'SUPER' | 'TECH' | 'BUSINESS' | 'SUPPORT'>('ALL')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal State: Adjust Coins
  const [adjustCoinUser, setAdjustCoinUser] = useState<UserItem | null>(null)
  const [coinAmount, setCoinAmount] = useState<number>(5)
  const [coinReason, setCoinReason] = useState<string>('Kompensasi / Penyesuaian CS')
  const [isAdjustingCoins, setIsAdjustingCoins] = useState(false)

  // Modal State: Manage Role
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null)
  const [targetRole, setTargetRole] = useState<string>('customer')
  const [isChangingRole, setIsChangingRole] = useState(false)

  // Modal State: CS-Safe Customer Summary (Invarian 16)
  const [csSummaryUser, setCsSummaryUser] = useState<UserItem | null>(null)
  const [csSummaryData, setCsSummaryData] = useState<any>(null)
  const [isLoadingCsSummary, setIsLoadingCsSummary] = useState(false)

  const handleOpenCsSummary = async (user: UserItem) => {
    setCsSummaryUser(user)
    setCsSummaryData(null)
    setIsLoadingCsSummary(true)
    try {
      const { data, error } = await supabase.rpc('cs_get_customer_summary' as any, {
        p_target_user_id: user.id,
      })
      if (error) throw error
      setCsSummaryData(data)
    } catch (err: any) {
      console.error('[AdminUsers] Error loading CS summary:', err)
      setFeedback({ type: 'error', message: `Gagal memuat data CS: ${err.message}` })
    } finally {
      setIsLoadingCsSummary(false)
    }
  }

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const [profilesRes, subsRes, coinsRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, avatar_url, created_at').order('created_at', { ascending: false }),
        supabase.from('active_subscriptions').select('user_id, status, expires_at, tier_slug, tier_name'),
        supabase.from('coin_balances').select('user_id, balance'),
        supabase.from('user_roles').select('user_id, role'),
      ])

      if (profilesRes.error) throw profilesRes.error
      if (subsRes.error) throw subsRes.error
      if (coinsRes.error) throw coinsRes.error
      if (rolesRes.error) throw rolesRes.error

      const subsMap = new Map<string, any>()
      subsRes.data?.forEach((s) => {
        if (s.user_id) subsMap.set(s.user_id, s)
      })

      const coinsMap = new Map<string, number>()
      coinsRes.data?.forEach((c) => {
        if (c.user_id) coinsMap.set(c.user_id, c.balance || 0)
      })

      const rolesMap = new Map<string, string>()
      rolesRes.data?.forEach((r) => {
        if (r.user_id) rolesMap.set(r.user_id, r.role)
      })

      const formatted: UserItem[] = (profilesRes.data || []).map((p) => {
        const sub = subsMap.get(p.id)
        const balance = coinsMap.get(p.id) || 0
        const role = rolesMap.get(p.id) || 'customer'

        return {
          id: p.id,
          full_name: p.full_name,
          username: p.username,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          role: role,
          balance: balance,
          tierSlug: sub?.tier_slug || 'free',
          tierName: sub?.tier_name || 'Free Plan',
          isSubActive: sub?.status === 'active',
          expiresAt: sub?.expires_at || null,
        }
      })

      setUsers(formatted)
    } catch (err: any) {
      console.error('[AdminUsers] Error loading users:', err)
      setFeedback({ type: 'error', message: `Gagal memuat pengguna: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Hitung KPI
  const stats = useMemo(() => {
    const totalUsers = users.length
    const paidUsers = users.filter((u) => u.tierSlug === 'premium' || u.tierSlug === 'glow' || u.tierSlug === 'pro').length
    const freeUsers = totalUsers - paidUsers
    const totalCoinsCirculating = users.reduce((acc, u) => acc + (u.balance || 0), 0)
    const adminCount = users.filter((u) => u.role && u.role !== 'customer').length

    return { totalUsers, paidUsers, freeUsers, totalCoinsCirculating, adminCount }
  }, [users])

  // Filter Search, Tier & Role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Filter Search (Nama, Username, ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = u.full_name?.toLowerCase().includes(query)
        const matchUser = u.username?.toLowerCase().includes(query)
        const matchId = u.id.toLowerCase().includes(query)
        if (!matchName && !matchUser && !matchId) return false
      }

      // 2. Filter Tier
      if (tierFilter !== 'ALL') {
        const isPro = u.tierSlug === 'premium' || u.tierSlug === 'pro'
        const isGlow = u.tierSlug === 'glow'
        const isFree = !isPro && !isGlow

        if (tierFilter === 'PRO' && !isPro) return false
        if (tierFilter === 'GLOW' && !isGlow) return false
        if (tierFilter === 'FREE' && !isFree) return false
      }

      // 3. Filter Role
      if (roleFilter !== 'ALL') {
        const r = u.role || 'customer'
        if (roleFilter === 'CUSTOMER' && r !== 'customer') return false
        if (roleFilter === 'SUPER' && r !== 'super_admin') return false
        if (roleFilter === 'TECH' && r !== 'tech_lead') return false
        if (roleFilter === 'BUSINESS' && r !== 'business_lead') return false
        if (roleFilter === 'SUPPORT' && r !== 'support_agent') return false
        if (roleFilter === 'ADMIN' && r === 'customer') return false
      }

      return true
    })
  }, [users, tierFilter, roleFilter, searchQuery])

  // Handler: Eksekusi Koreksi Koin via RPC
  const handleExecuteCoinAdjust = async () => {
    if (!adjustCoinUser || coinAmount === 0) return
    setIsAdjustingCoins(true)
    try {
      const { data: newBalance, error } = await supabase.rpc('admin_adjust_user_coins' as any, {
        p_target_user_id: adjustCoinUser.id,
        p_amount: coinAmount,
        p_reason: coinReason,
      })

      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Berhasil mengubah saldo koin ${adjustCoinUser.full_name || adjustCoinUser.username} sebesar ${
          coinAmount > 0 ? `+${coinAmount}` : coinAmount
        } Credits. Saldo baru: ${newBalance} Credits.`,
      })

      // Update state lokal
      setUsers((prev) =>
        prev.map((u) => (u.id === adjustCoinUser.id ? { ...u, balance: (newBalance as number) ?? u.balance + coinAmount } : u))
      )
      setAdjustCoinUser(null)
    } catch (err: any) {
      console.error('[AdminUsers] Error adjusting coins:', err)
      setFeedback({ type: 'error', message: `Gagal memperbarui koin: ${err.message}` })
    } finally {
      setIsAdjustingCoins(false)
    }
  }

  // Handler: Eksekusi Ubah Role via RPC
  const handleExecuteRoleChange = async () => {
    if (!roleModalUser) return
    setIsChangingRole(true)
    try {
      const { error } = await supabase.rpc('admin_set_user_role' as any, {
        p_target_user_id: roleModalUser.id,
        p_role: targetRole,
      })

      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Hak akses ${roleModalUser.full_name || roleModalUser.username} berhasil diubah menjadi: ${targetRole.toUpperCase()}`,
      })

      setUsers((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? { ...u, role: targetRole } : u))
      )
      setRoleModalUser(null)
    } catch (err: any) {
      console.error('[AdminUsers] Error changing role:', err)
      setFeedback({ type: 'error', message: `Gagal mengubah hak akses: ${err.message}` })
    } finally {
      setIsChangingRole(false)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            <Users size={12} /> CRM & Pelanggan
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Manajemen Pengguna (CRM)
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Pantau profil pengguna, hak akses role sistem, saldo credits, dan riwayat transaksi aman CS (Invarian 16 & UU PDP).
          </p>
        </div>
        <div className="admin-page-header-actions">
          <button
            className="cluv-btn is-outline is-sm"
            onClick={loadUsers}
            disabled={isLoading}
            title="Segarkan Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`cluv-alert ${feedback.type === 'success' ? 'is-success' : 'is-danger'}`}
          style={{ marginBottom: 24 }}
        >
          <div className="cluv-alert-icon">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div className="cluv-alert-content">
            <p className="cluv-alert-message" style={{ fontWeight: 600 }}>{feedback.message}</p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="cluv-stat-grid cols-4" style={{ marginBottom: 24 }}>
        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-teal" style={{ marginBottom: 12 }}>
            <Users size={18} />
          </div>
          <div className="cluv-stat-label">Total Pengguna</div>
          <div className="cluv-stat-value">{stats.totalUsers}</div>
          <div className="cluv-stat-subtext">{stats.adminCount} staf pengelola</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-gold" style={{ marginBottom: 12 }}>
            <Crown size={18} />
          </div>
          <div className="cluv-stat-label">Subscriber Berbayar</div>
          <div className="cluv-stat-value">{stats.paidUsers}</div>
          <div className="cluv-stat-subtext">Paket Glow & PRO aktif</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-neutral" style={{ marginBottom: 12 }}>
            <Zap size={18} />
          </div>
          <div className="cluv-stat-label">Akun Non-Berbayar</div>
          <div className="cluv-stat-value">{stats.freeUsers}</div>
          <div className="cluv-stat-subtext">Akses kuota gratis & misi</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-gold" style={{ marginBottom: 12 }}>
            <Coins size={18} />
          </div>
          <div className="cluv-stat-label">Total Credits Beredar</div>
          <div className="cluv-stat-value">{stats.totalCoinsCirculating.toLocaleString()}</div>
          <div className="cluv-stat-subtext">Saldo koin di seluruh dompet</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="cluv-card is-compact" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div className="admin-user-search-wrap">
            <Search size={16} className="admin-user-search-icon" />
            <input
              type="text"
              placeholder="Cari nama pengguna, username, atau UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-user-search-input"
            />
            {searchQuery && (
              <button className="admin-user-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="cluv-chip-group">
              <button
                className={`cluv-chip ${tierFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setTierFilter('ALL')}
              >
                Semua ({stats.totalUsers})
              </button>
              <button
                className={`cluv-chip ${tierFilter === 'PRO' ? 'is-active' : ''}`}
                onClick={() => setTierFilter('PRO')}
              >
                <Crown size={12} /> PRO
              </button>
              <button
                className={`cluv-chip ${tierFilter === 'GLOW' ? 'is-active' : ''}`}
                onClick={() => setTierFilter('GLOW')}
              >
                <Zap size={12} /> Glow
              </button>
              <button
                className={`cluv-chip ${tierFilter === 'FREE' ? 'is-active' : ''}`}
                onClick={() => setTierFilter('FREE')}
              >
                Free ({stats.freeUsers})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} style={{ color: 'var(--cluv-neutral-400)' }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="admin-select"
                style={{ width: 160 }}
              >
                <option value="ALL">Semua Role</option>
                <option value="CUSTOMER">Customer Biasa</option>
                <option value="SUPER">Super Admin</option>
                <option value="TECH">Tech Lead</option>
                <option value="BUSINESS">Business Lead</option>
                <option value="SUPPORT">Customer Support</option>
                <option value="ADMIN">Semua Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="cluv-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 260 }}>PENGGUNA</th>
                <th style={{ width: 150 }}>TIER LANGGANAN</th>
                <th style={{ width: 140 }}>SALDO CREDITS</th>
                <th style={{ width: 160 }}>HAK AKSES ROLE</th>
                <th style={{ width: 130 }}>BERGABUNG</th>
                <th style={{ textAlign: 'right' }}>AKSI CS / ADMIN</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--cluv-neutral-400)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ display: 'inline', marginRight: 8, color: 'var(--cluv-teal)' }} />
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-400)' }}>
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPro = u.tierSlug === 'premium' || u.tierSlug === 'pro'
                  const isGlow = u.tierSlug === 'glow'
                  const joinDate = new Date(u.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <tr key={u.id} className="admin-table-row">
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {u.full_name?.charAt(0).toUpperCase() || u.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="admin-user-name">
                              {u.full_name || 'Pelanggan Skincluv'}
                            </span>
                            <span className="admin-user-handle">
                              @{u.username || 'user'} • <span style={{ fontFamily: 'var(--cluv-font-mono, monospace)', fontSize: 10, color: 'var(--cluv-neutral-400)' }}>{u.id.slice(0, 8)}...</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`cluv-badge ${
                            isPro ? 'is-purple' : isGlow ? 'is-gold' : 'is-neutral'
                          } is-sm`}
                        >
                          {isPro ? <Crown size={12} /> : isGlow ? <Zap size={12} /> : null}
                          {isPro ? 'VIP PRO' : isGlow ? 'GLOW' : 'FREE'}
                        </span>
                        {u.expiresAt && (
                          <span style={{ display: 'block', fontSize: 10.5, color: 'var(--cluv-neutral-400)', marginTop: 2 }}>
                            s/d {new Date(u.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Coins size={14} style={{ color: 'var(--cluv-gold)' }} />
                          <span style={{ fontWeight: 800, color: 'var(--cluv-neutral-900)', fontVariantNumeric: 'tabular-nums' }}>
                            {u.balance}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--cluv-neutral-400)' }}>Credits</span>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const r = u.role || 'customer'
                          if (r === 'super_admin') {
                            return (
                              <span className="cluv-badge is-purple is-sm">
                                <ShieldCheck size={12} /> SUPER ADMIN
                              </span>
                            )
                          }
                          if (r === 'tech_lead') {
                            return (
                              <span className="cluv-badge is-teal is-sm">
                                <Shield size={12} /> TECH LEAD
                              </span>
                            )
                          }
                          if (r === 'business_lead') {
                            return (
                              <span className="cluv-badge is-gold is-sm">
                                <Shield size={12} /> BUSINESS LEAD
                              </span>
                            )
                          }
                          if (r === 'support_agent') {
                            return (
                              <span className="cluv-badge is-info is-sm">
                                <UserCheck size={12} /> CS AGENT
                              </span>
                            )
                          }
                          if (r === 'clinical_reviewer') {
                            return (
                              <span className="cluv-badge is-teal is-sm">
                                <Shield size={12} /> CLINICAL
                              </span>
                            )
                          }
                          if (r === 'admin') {
                            return (
                              <span className="cluv-badge is-purple is-sm">
                                <ShieldCheck size={12} /> ADMIN
                              </span>
                            )
                          }
                          return (
                            <span className="cluv-badge is-neutral is-sm">
                              CUSTOMER
                            </span>
                          )
                        })()}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--cluv-neutral-500)', fontVariantNumeric: 'tabular-nums' }}>
                        {joinDate}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="cluv-btn is-outline is-sm"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => handleOpenCsSummary(u)}
                            title="Ringkasan Bantuan CS (Invarian 16)"
                          >
                            <UserCheck size={13} />
                            <span>Detail CS</span>
                          </button>
                          <button
                            className="cluv-btn is-outline is-sm"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => {
                              setAdjustCoinUser(u)
                              setCoinAmount(5)
                              setCoinReason('Kompensasi / Penyesuaian CS')
                            }}
                            title="Koreksi / Berikan Saldo Koin"
                          >
                            <Coins size={13} />
                            <span>Adjust Koin</span>
                          </button>
                          {canManageRoles && (
                            <button
                              className="cluv-btn is-outline is-sm"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                              onClick={() => {
                                setRoleModalUser(u)
                                setTargetRole(u.role || 'customer')
                              }}
                              title="Ubah Hak Akses Role"
                            >
                              <Shield size={13} />
                              <span>Role</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Adjust Coins */}
      {adjustCoinUser && (
        <div className="cluv-modal-overlay" onClick={() => setAdjustCoinUser(null)}>
          <div className="cluv-modal-box is-sm" onClick={(e) => e.stopPropagation()}>
            <div className="cluv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coins size={18} style={{ color: 'var(--cluv-gold)' }} />
                <h3 className="cluv-modal-title">Koreksi Saldo Credits</h3>
              </div>
              <button className="cluv-modal-close" onClick={() => setAdjustCoinUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="cluv-modal-body" style={{ padding: '20px 24px' }}>
              <div className="admin-user-target-banner">
                <div className="admin-user-avatar sm">
                  {adjustCoinUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--cluv-neutral-900)', display: 'block', fontSize: 13 }}>
                    {adjustCoinUser.full_name || adjustCoinUser.username}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--cluv-neutral-500)' }}>
                    Saldo saat ini: <strong style={{ color: 'var(--cluv-teal)' }}>{adjustCoinUser.balance} Credits</strong>
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Jumlah Koin yang Diberikan / Dikurangkan:
                </label>
                <div className="admin-amount-input-wrap">
                  <button
                    type="button"
                    className="admin-amount-quick-btn is-neg"
                    onClick={() => setCoinAmount((prev) => prev - 5)}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                    placeholder="Contoh: 10 atau -5"
                    className="admin-pricing-input is-number"
                    style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 800 }}
                  />
                  <button
                    type="button"
                    className="admin-amount-quick-btn is-pos"
                    onClick={() => setCoinAmount((prev) => prev + 5)}
                  >
                    +5
                  </button>
                </div>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--cluv-neutral-400)', marginTop: 4 }}>
                  Gunakan angka positif (+) untuk menambah koin, atau angka negatif (-) untuk mengurangi koin.
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Alasan Penyesuaian (Audit Log):
                </label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="Contoh: Kompensasi scan gagal / Bonus loyalitas"
                  className="admin-pricing-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="admin-calc-preview">
                <span>Simulasi Saldo Akhir:</span>
                <strong>{Math.max(0, adjustCoinUser.balance + coinAmount)} Credits</strong>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                borderTop: '1px solid var(--cluv-border)',
                background: 'var(--cluv-neutral-50)',
              }}
            >
              <button
                type="button"
                className="cluv-btn is-outline is-sm"
                onClick={() => setAdjustCoinUser(null)}
                disabled={isAdjustingCoins}
              >
                Batal
              </button>
              <button
                type="button"
                className="cluv-btn is-primary is-sm"
                onClick={handleExecuteCoinAdjust}
                disabled={isAdjustingCoins || coinAmount === 0}
              >
                {isAdjustingCoins ? 'Menyimpan...' : 'Terapkan Penyesuaian'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manage Role */}
      {roleModalUser && (
        <div className="cluv-modal-overlay" onClick={() => setRoleModalUser(null)}>
          <div className="cluv-modal-box is-md" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="cluv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} style={{ color: 'var(--cluv-teal)' }} />
                <h3 className="cluv-modal-title">Kelola Hak Akses Role</h3>
              </div>
              <button className="cluv-modal-close" onClick={() => setRoleModalUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="cluv-modal-body" style={{ padding: '20px 24px' }}>
              <div className="admin-user-target-banner">
                <div className="admin-user-avatar sm">
                  {roleModalUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--cluv-neutral-900)', display: 'block', fontSize: 13 }}>
                    {roleModalUser.full_name || roleModalUser.username}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--cluv-neutral-500)' }}>
                    Role saat ini: <strong>{roleModalUser.role?.toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 8 }}>
                  Pilih Role Baru:
                </label>
                <div className="admin-role-options-list">
                  <label className={`admin-role-option-card ${targetRole === 'customer' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="customer"
                      checked={targetRole === 'customer'}
                      onChange={() => setTargetRole('customer')}
                      style={{ accentColor: 'var(--cluv-teal)', marginTop: 2 }}
                    />
                    <div>
                      <strong className="admin-role-option-title">Customer</strong>
                      <span className="admin-role-option-desc">Pengguna akhir aplikasi dengan hak akses standar.</span>
                    </div>
                  </label>

                  <label className={`admin-role-option-card ${targetRole === 'tech_lead' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="tech_lead"
                      checked={targetRole === 'tech_lead'}
                      onChange={() => setTargetRole('tech_lead')}
                      style={{ accentColor: 'var(--cluv-teal)', marginTop: 2 }}
                    />
                    <div>
                      <strong className="admin-role-option-title">Tech Lead (Person A)</strong>
                      <span className="admin-role-option-desc">Lead Engineer. Mengelola AI Brain, prompt, model config, handbook, dan logging sistem.</span>
                    </div>
                  </label>

                  <label className={`admin-role-option-card ${targetRole === 'business_lead' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="business_lead"
                      checked={targetRole === 'business_lead'}
                      onChange={() => setTargetRole('business_lead')}
                      style={{ accentColor: 'var(--cluv-teal)', marginTop: 2 }}
                    />
                    <div>
                      <strong className="admin-role-option-title">Business Lead (Person B)</strong>
                      <span className="admin-role-option-desc">Business & Marketing. Mengelola Unit Economics, deposit vendor, pricing paket, dan CRM.</span>
                    </div>
                  </label>

                  <label className={`admin-role-option-card ${targetRole === 'support_agent' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="support_agent"
                      checked={targetRole === 'support_agent'}
                      onChange={() => setTargetRole('support_agent')}
                      style={{ accentColor: 'var(--cluv-teal)', marginTop: 2 }}
                    />
                    <div>
                      <strong className="admin-role-option-title">Customer Support (CS)</strong>
                      <span className="admin-role-option-desc">Bantuan CS. Akses ringkasan akun aman, verifikasi transaksi, & koreksi koin (Invarian 16).</span>
                    </div>
                  </label>

                  <label className={`admin-role-option-card ${targetRole === 'super_admin' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="super_admin"
                      checked={targetRole === 'super_admin'}
                      onChange={() => setTargetRole('super_admin')}
                      style={{ accentColor: 'var(--cluv-teal)', marginTop: 2 }}
                    />
                    <div>
                      <strong className="admin-role-option-title">Super Admin</strong>
                      <span className="admin-role-option-desc">Akses mutlak ke seluruh domain teknis, finansial, dan otoritas pengelolaan role.</span>
                    </div>
                  </label>

                  <label className={`admin-role-option-card ${targetRole === 'clinical_reviewer' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="clinical_reviewer"
                      checked={targetRole === 'clinical_reviewer'}
                      onChange={() => setTargetRole('clinical_reviewer')}
                      style={{ accentColor: 'var(--cluv-teal)', marginTop: 2 }}
                    />
                    <div>
                      <strong className="admin-role-option-title">Clinical Reviewer</strong>
                      <span className="admin-role-option-desc">Reviewer Medis/BPOM. Akses kurasi formula, kamus bahan, dan aturan klinis.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                borderTop: '1px solid var(--cluv-border)',
                background: 'var(--cluv-neutral-50)',
              }}
            >
              <button
                type="button"
                className="cluv-btn is-outline is-sm"
                onClick={() => setRoleModalUser(null)}
                disabled={isChangingRole}
              >
                Batal
              </button>
              <button
                type="button"
                className="cluv-btn is-primary is-sm"
                onClick={handleExecuteRoleChange}
                disabled={isChangingRole || targetRole === roleModalUser.role}
              >
                {isChangingRole ? 'Menyimpan...' : 'Simpan Hak Akses'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: CS-Safe Customer Summary (Invarian 16) */}
      {csSummaryUser && (
        <div className="cluv-modal-overlay" onClick={() => !isLoadingCsSummary && setCsSummaryUser(null)}>
          <div
            className="cluv-modal-box is-lg"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cluv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} style={{ color: 'var(--cluv-teal)' }} />
                <div>
                  <h3 className="cluv-modal-title">Ringkasan Bantuan CS</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--cluv-neutral-500)' }}>
                    Akses Data Terisolasi CS (Invarian 16 dan UU PDP No. 27/2022)
                  </p>
                </div>
              </div>
              <button
                className="cluv-modal-close"
                onClick={() => setCsSummaryUser(null)}
                disabled={isLoadingCsSummary}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cluv-modal-body" style={{ padding: '20px 24px' }}>
              {isLoadingCsSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '36px 0' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--cluv-teal)' }} />
                  <span style={{ fontSize: 13, color: 'var(--cluv-neutral-500)' }}>Memuat data aman pelanggan...</span>
                </div>
              ) : csSummaryData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Banner Identitas Pelanggan */}
                  <div className="admin-user-target-banner">
                    <div className="admin-user-avatar sm">
                      {csSummaryData.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 800, color: 'var(--cluv-neutral-900)', display: 'block', fontSize: 13 }}>
                        {csSummaryData.full_name || 'Pelanggan Skincluv'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--cluv-neutral-500)' }}>
                        @{csSummaryData.username || 'user'} • Terdaftar sejak {new Date(csSummaryData.registered_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: 'var(--cluv-neutral-400)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Paket Aktif:</span>
                      <strong style={{ fontSize: 13, color: 'var(--cluv-teal)' }}>
                        {csSummaryData.subscription?.tier_name || 'Free Plan'}
                      </strong>
                    </div>
                  </div>

                  {/* Ringkasan Saldo & Kuota */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ background: 'var(--cluv-gold-soft)', border: '1px solid var(--cluv-gold-line)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cluv-gold)', fontSize: 12, fontWeight: 700 }}>
                        <Coins size={15} /> Saldo Koin
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cluv-neutral-900)', marginTop: 4 }}>
                        {csSummaryData.coin_balance} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cluv-neutral-500)' }}>Credits</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--cluv-teal-soft)', border: '1px solid var(--cluv-teal-line)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cluv-teal-dark)', fontSize: 12, fontWeight: 700 }}>
                        <Zap size={15} /> Masa Berlaku Paket
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cluv-teal-dark)', marginTop: 6 }}>
                        {csSummaryData.subscription?.expires_at
                          ? new Date(csSummaryData.subscription.expires_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                          : 'Tidak ada batas'}
                      </div>
                    </div>
                  </div>

                  {/* 10 Invoice Pembayaran Terakhir */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: 'var(--cluv-neutral-900)' }}>
                      Riwayat Pembayaran Tripay (Maks 10 Terakhir)
                    </h4>
                    {csSummaryData.recent_invoices?.length > 0 ? (
                      <div className="admin-table-container" style={{ border: '1px solid var(--cluv-border)', borderRadius: 8 }}>
                        <table className="admin-table" style={{ fontSize: 12 }}>
                          <thead>
                            <tr>
                              <th>Ref / Invoice</th>
                              <th>Paket</th>
                              <th style={{ textAlign: 'right' }}>Nominal</th>
                              <th style={{ textAlign: 'center' }}>Status</th>
                              <th style={{ textAlign: 'right' }}>Tanggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csSummaryData.recent_invoices.map((inv: any, idx: number) => (
                              <tr key={idx} className="admin-table-row">
                                <td style={{ fontFamily: 'var(--cluv-font-mono, monospace)', fontSize: 11 }}>
                                  {inv.reference || inv.tripay_reference || inv.merchant_ref || '-'}
                                </td>
                                <td>{inv.plan}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                  Rp {inv.amount_idr?.toLocaleString('id-ID')}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    className={`cluv-badge ${inv.status === 'PAID' ? 'is-teal' : 'is-rose'} is-sm`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--cluv-neutral-400)', fontVariantNumeric: 'tabular-nums' }}>
                                  {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--cluv-neutral-400)', fontStyle: 'italic' }}>
                        Belum ada riwayat tagihan Tripay.
                      </p>
                    )}
                  </div>

                  {/* 10 Riwayat Koin Terakhir */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: 'var(--cluv-neutral-900)' }}>
                      Riwayat Mutasi Koin Terakhir
                    </h4>
                    {csSummaryData.recent_coin_transactions?.length > 0 ? (
                      <div className="admin-table-container" style={{ border: '1px solid var(--cluv-border)', borderRadius: 8 }}>
                        <table className="admin-table" style={{ fontSize: 12 }}>
                          <thead>
                            <tr>
                              <th>Jumlah</th>
                              <th>Tipe</th>
                              <th>Keterangan</th>
                              <th style={{ textAlign: 'right' }}>Tanggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csSummaryData.recent_coin_transactions.map((tx: any, idx: number) => (
                              <tr key={idx} className="admin-table-row">
                                <td
                                  style={{
                                    fontWeight: 800,
                                    fontVariantNumeric: 'tabular-nums',
                                    color: tx.amount > 0 ? 'var(--cluv-teal)' : 'var(--cluv-rose)',
                                  }}
                                >
                                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>
                                  {tx.type}
                                </td>
                                <td style={{ color: 'var(--cluv-neutral-600)' }}>
                                  {tx.notes || '-'}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--cluv-neutral-400)', fontVariantNumeric: 'tabular-nums' }}>
                                  {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--cluv-neutral-400)', fontStyle: 'italic' }}>
                        Belum ada mutasi koin tercatat.
                      </p>
                    )}
                  </div>

                  {/* Banner Privasi Data */}
                  <div
                    style={{
                      background: 'var(--cluv-neutral-100)',
                      border: '1px solid var(--cluv-border)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 11,
                      color: 'var(--cluv-neutral-600)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Privasi Data Terjamin:</strong> Data foto wajah biometrik, diagnosis klinis, dan privasi percakapan obrolan pengguna diisolasi dari antarmuka ini demi kepatuhan UU PDP No. 27/2022.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 0', textAlign: 'center' }}>
                  <AlertCircle size={28} style={{ color: 'var(--cluv-gold)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cluv-neutral-800)' }}>Gagal memuat ringkasan pelanggan</span>
                  <span style={{ fontSize: 12, color: 'var(--cluv-neutral-500)', maxWidth: 360 }}>
                    Tidak ada data ringkasan yang dapat ditampilkan. Pastikan Anda memiliki wewenang Customer Support atau Administrator.
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--cluv-border)',
                background: 'var(--cluv-neutral-50)',
              }}
            >
              <button
                type="button"
                className="cluv-btn is-outline is-sm"
                onClick={() => setCsSummaryUser(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
