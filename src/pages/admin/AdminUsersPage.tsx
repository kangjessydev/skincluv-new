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
      // Ambil profiles, active_subscriptions, coin_balances, dan user_roles
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

      const profiles = profilesRes.data || []
      const subs = subsRes.data || []
      const coins = coinsRes.data || []
      const roles = rolesRes.data || []

      // Buat lookup maps
      const subMap = new Map<string, any>()
      subs.forEach((s) => subMap.set(s.user_id, s))

      const coinMap = new Map<string, number>()
      coins.forEach((c) => coinMap.set(c.user_id, c.balance))

      const roleMap = new Map<string, string>()
      roles.forEach((r) => roleMap.set(r.user_id, r.role))

      const combined: UserItem[] = profiles.map((p) => {
        const sub = subMap.get(p.id)
        const role = roleMap.get(p.id) || 'customer'
        const tierSlug = sub?.tier_slug || 'free'
        const tierName = sub?.tier_name || 'Free Tier'

        return {
          id: p.id,
          full_name: p.full_name,
          username: p.username,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          role,
          balance: coinMap.get(p.id) ?? 0,
          tierSlug,
          tierName,
          isSubActive: !!sub,
          expiresAt: sub?.expires_at || null,
        }
      })

      setUsers(combined)
    } catch (err: any) {
      console.error('[AdminUsers] Error loading users:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat daftar pengguna' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // KPIs
  const stats = useMemo(() => {
    const totalUsers = users.length
    const paidUsers = users.filter((u) => u.tierSlug === 'glow' || u.tierSlug === 'premium' || u.tierSlug === 'pro').length
    const freeUsers = totalUsers - paidUsers
    const totalCoinsCirculating = users.reduce((acc, u) => acc + (u.balance || 0), 0)
    const adminCount = users.filter((u) =>
      ['admin', 'super_admin', 'tech_lead', 'business_lead'].includes(u.role || '')
    ).length

    return {
      totalUsers,
      paidUsers,
      freeUsers,
      totalCoinsCirculating,
      adminCount,
    }
  }, [users])

  // Filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter tier
      if (tierFilter !== 'ALL') {
        if (tierFilter === 'FREE' && u.tierSlug !== 'free') return false
        if (tierFilter === 'GLOW' && u.tierSlug !== 'glow') return false
        if (tierFilter === 'PRO' && u.tierSlug !== 'premium' && u.tierSlug !== 'pro') return false
      }

      // Filter role
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'SUPER' && u.role !== 'super_admin') return false
        if (roleFilter === 'TECH' && u.role !== 'tech_lead') return false
        if (roleFilter === 'BUSINESS' && u.role !== 'business_lead') return false
        if (roleFilter === 'SUPPORT' && u.role !== 'support_agent') return false
        if (roleFilter === 'ADMIN' && !['admin', 'super_admin', 'tech_lead', 'business_lead'].includes(u.role || '')) return false
        if (roleFilter === 'CUSTOMER' && u.role && u.role !== 'customer') return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const nameMatch = u.full_name?.toLowerCase().includes(q)
        const userMatch = u.username?.toLowerCase().includes(q)
        const idMatch = u.id.toLowerCase().includes(q)
        if (!nameMatch && !userMatch && !idMatch) return false
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
    <div className="admin-users-page">
      {/* Header */}
      <div className="admin-users-header">
        <div>
          <div className="badge-category">
            <Users size={14} /> PENGGUNA & PELANGGAN
          </div>
          <h1>Manajemen Pengguna (CRM)</h1>
          <p>Kelola profil pengguna, pantau status langganan, saldo koin, dan lakukan tindakan koreksi CS.</p>
        </div>
        <button
          className="btn-refresh"
          onClick={loadUsers}
          disabled={isLoading}
          title="Segarkan Data"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div className={`alert-box ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card total-users">
          <div className="kpi-icon-wrap">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Pengguna</span>
            <span className="kpi-value">{stats.totalUsers}</span>
            <span className="kpi-subtext">{stats.adminCount} staf admin</span>
          </div>
        </div>

        <div className="kpi-card paid-users">
          <div className="kpi-icon-wrap">
            <Crown size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pelanggan Berbayar Aktif</span>
            <span className="kpi-value">{stats.paidUsers}</span>
            <span className="kpi-subtext">Paket Glow & PRO</span>
          </div>
        </div>

        <div className="kpi-card free-users">
          <div className="kpi-icon-wrap">
            <Zap size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Akun Free</span>
            <span className="kpi-value">{stats.freeUsers}</span>
            <span className="kpi-subtext">Menggunakan kredit misi</span>
          </div>
        </div>

        <div className="kpi-card total-coins">
          <div className="kpi-icon-wrap">
            <Coins size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Credits Beredar</span>
            <span className="kpi-value">{stats.totalCoinsCirculating.toLocaleString()}</span>
            <span className="kpi-subtext">Saldo koin di seluruh dompet user</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="filter-bar-card">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama pengguna, username, atau UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="status-pills">
            <button
              className={`pill ${tierFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTierFilter('ALL')}
            >
              Semua Tier ({stats.totalUsers})
            </button>
            <button
              className={`pill pill-pro ${tierFilter === 'PRO' ? 'active' : ''}`}
              onClick={() => setTierFilter('PRO')}
            >
              <Crown size={13} /> PRO
            </button>
            <button
              className={`pill pill-glow ${tierFilter === 'GLOW' ? 'active' : ''}`}
              onClick={() => setTierFilter('GLOW')}
            >
              <Zap size={13} /> Glow
            </button>
            <button
              className={`pill pill-free ${tierFilter === 'FREE' ? 'active' : ''}`}
              onClick={() => setTierFilter('FREE')}
            >
              Free ({stats.freeUsers})
            </button>
          </div>

          <div className="role-select-wrap">
            <Filter size={14} className="text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="role-select"
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

      {/* Users Table Card */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PENGGUNA</th>
                <th>TIER LANGGANAN</th>
                <th>SALDO CREDITS</th>
                <th>ROLE SISTEM</th>
                <th>BERGABUNG</th>
                <th style={{ textAlign: 'right' }}>AKSI CS / ADMIN</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    <RefreshCw size={24} className="animate-spin inline mr-2 text-indigo-500" />
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
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
                    <tr key={u.id} className="table-row">
                      <td>
                        <div className="user-profile-cell">
                          <div className="avatar-circle">
                            {u.full_name?.charAt(0).toUpperCase() || u.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="user-display-name">
                              {u.full_name || 'Pelanggan Skincluv'}
                            </span>
                            <span className="user-display-username">
                              @{u.username || 'user'} • <span className="font-mono text-[10px] text-gray-400">{u.id.slice(0, 8)}...</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`tier-pill ${
                            isPro ? 'tier-pro' : isGlow ? 'tier-glow' : 'tier-free'
                          }`}
                        >
                          {isPro ? <Crown size={12} /> : isGlow ? <Zap size={12} /> : null}
                          {isPro ? 'VIP PRO' : isGlow ? 'GLOW MEMBER' : 'FREE'}
                        </span>
                        {u.expiresAt && (
                          <span className="expiry-hint">
                            s/d {new Date(u.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="coin-balance-cell">
                          <Coins size={14} className="text-amber-500" />
                          <span className="coin-number font-bold text-gray-900">{u.balance}</span>
                          <span className="text-xs text-gray-400">Credits</span>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const r = u.role || 'customer'
                          if (r === 'super_admin') {
                            return (
                              <span className="role-badge role-super-admin">
                                <ShieldCheck size={12} /> SUPER ADMIN
                              </span>
                            )
                          }
                          if (r === 'tech_lead') {
                            return (
                              <span className="role-badge role-tech-lead">
                                <Shield size={12} /> TECH LEAD
                              </span>
                            )
                          }
                          if (r === 'business_lead') {
                            return (
                              <span className="role-badge role-business-lead">
                                <Shield size={12} /> BUSINESS LEAD
                              </span>
                            )
                          }
                          if (r === 'support_agent') {
                            return (
                              <span className="role-badge role-support-agent">
                                <UserCheck size={12} /> CS AGENT
                              </span>
                            )
                          }
                          if (r === 'clinical_reviewer') {
                            return (
                              <span className="role-badge role-clinical-reviewer">
                                <Shield size={12} /> CLINICAL
                              </span>
                            )
                          }
                          if (r === 'admin') {
                            return (
                              <span className="role-badge role-admin">
                                <ShieldCheck size={12} /> ADMIN
                              </span>
                            )
                          }
                          return (
                            <span className="role-badge role-customer">
                              CUSTOMER
                            </span>
                          )
                        })()}
                      </td>
                      <td className="text-xs text-gray-500 font-mono">{joinDate}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
                          <button
                            className="btn-action btn-cs-summary"
                            onClick={() => handleOpenCsSummary(u)}
                            title="Ringkasan Bantuan CS (Invarian 16)"
                          >
                            <UserCheck size={13} /> Detail CS
                          </button>
                          <button
                            className="btn-action btn-adjust-coins"
                            onClick={() => {
                              setAdjustCoinUser(u)
                              setCoinAmount(5)
                              setCoinReason('Kompensasi / Penyesuaian CS')
                            }}
                            title="Koreksi / Berikan Saldo Koin"
                          >
                            <Coins size={13} /> Adjust Koin
                          </button>
                          {canManageRoles && (
                            <button
                              className="btn-action btn-manage-role"
                              onClick={() => {
                                setRoleModalUser(u)
                                setTargetRole(u.role || 'customer')
                              }}
                              title="Ubah Hak Akses Role"
                            >
                              <Shield size={13} /> Role
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
        <div className="modal-overlay" onClick={() => setAdjustCoinUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Coins size={18} className="text-amber-500" />
                <h3>Koreksi Saldo Credits Pengguna</h3>
              </div>
              <button className="modal-close" onClick={() => setAdjustCoinUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="user-target-banner">
                <div className="avatar-circle sm">
                  {adjustCoinUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-sm">
                    {adjustCoinUser.full_name || adjustCoinUser.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    Saldo saat ini: <strong>{adjustCoinUser.balance} Credits</strong>
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Jumlah Koin yang Diberikan / Dikurangkan:</label>
                <div className="amount-input-wrap">
                  <button
                    type="button"
                    className="amount-quick-btn neg"
                    onClick={() => setCoinAmount((prev) => prev - 5)}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                    placeholder="Contoh: 10 atau -5"
                  />
                  <button
                    type="button"
                    className="amount-quick-btn pos"
                    onClick={() => setCoinAmount((prev) => prev + 5)}
                  >
                    +5
                  </button>
                </div>
                <span className="helper-text">
                  Gunakan angka positif (+) untuk menambah koin, atau angka negatif (-) untuk mengurangi koin.
                </span>
              </div>

              <div className="form-group">
                <label>Alasan Penyesuaian (Audit Log):</label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="Contoh: Kompensasi scan gagal / Bonus loyalitas"
                />
              </div>

              <div className="calculation-preview">
                <span>Simulasi Saldo Akhir:</span>
                <strong>{Math.max(0, adjustCoinUser.balance + coinAmount)} Credits</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAdjustCoinUser(null)}
                disabled={isAdjustingCoins}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
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
        <div className="modal-overlay" onClick={() => setRoleModalUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Shield size={18} className="text-indigo-600" />
                <h3>Kelola Hak Akses Role</h3>
              </div>
              <button className="modal-close" onClick={() => setRoleModalUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="user-target-banner">
                <div className="avatar-circle sm">
                  {roleModalUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-sm">
                    {roleModalUser.full_name || roleModalUser.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    Role saat ini: <strong>{roleModalUser.role?.toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Pilih Role Baru:</label>
                <div className="role-options-grid">
                  <label className={`role-card-option ${targetRole === 'customer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="customer"
                      checked={targetRole === 'customer'}
                      onChange={() => setTargetRole('customer')}
                    />
                    <div>
                      <strong>Customer</strong>
                      <span>Pengguna akhir aplikasi dengan hak akses standar.</span>
                    </div>
                  </label>

                  <label className={`role-card-option ${targetRole === 'tech_lead' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="tech_lead"
                      checked={targetRole === 'tech_lead'}
                      onChange={() => setTargetRole('tech_lead')}
                    />
                    <div>
                      <strong>Tech Lead (Person A)</strong>
                      <span>Lead Engineer. Mengelola AI Brain, prompt, model config, handbook, dan logging sistem.</span>
                    </div>
                  </label>

                  <label className={`role-card-option ${targetRole === 'business_lead' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="business_lead"
                      checked={targetRole === 'business_lead'}
                      onChange={() => setTargetRole('business_lead')}
                    />
                    <div>
                      <strong>Business Lead (Person B)</strong>
                      <span>Business & Marketing. Mengelola Unit Economics, deposit vendor, pricing paket, dan CRM.</span>
                    </div>
                  </label>

                  <label className={`role-card-option ${targetRole === 'support_agent' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="support_agent"
                      checked={targetRole === 'support_agent'}
                      onChange={() => setTargetRole('support_agent')}
                    />
                    <div>
                      <strong>Customer Support (CS)</strong>
                      <span>Bantuan CS. Akses ringkasan akun aman, verifikasi transaksi, & koreksi koin (Invarian 16).</span>
                    </div>
                  </label>

                  <label className={`role-card-option ${targetRole === 'super_admin' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="super_admin"
                      checked={targetRole === 'super_admin'}
                      onChange={() => setTargetRole('super_admin')}
                    />
                    <div>
                      <strong>Super Admin</strong>
                      <span>Akses mutlak ke seluruh domain teknis, finansial, dan otoritas pengelolaan role.</span>
                    </div>
                  </label>

                  <label className={`role-card-option ${targetRole === 'clinical_reviewer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="clinical_reviewer"
                      checked={targetRole === 'clinical_reviewer'}
                      onChange={() => setTargetRole('clinical_reviewer')}
                    />
                    <div>
                      <strong>Clinical Reviewer</strong>
                      <span>Reviewer Medis/BPOM. Akses kurasi formula, kamus bahan, dan aturan klinis.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRoleModalUser(null)}
                disabled={isChangingRole}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
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
        <div className="modal-overlay" onClick={() => !isLoadingCsSummary && setCsSummaryUser(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <UserCheck size={18} className="text-blue-600" />
                <div>
                  <h3 style={{ margin: 0 }}>Ringkasan Bantuan CS</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                    Akses Data Terisolasi CS (Invarian 16 dan UU PDP No. 27/2022)
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setCsSummaryUser(null)}
                disabled={isLoadingCsSummary}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {isLoadingCsSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '36px 0' }}>
                  <RefreshCw size={24} className="animate-spin text-blue-600" />
                  <span style={{ fontSize: 13, color: '#64748b' }}>Memuat data aman pelanggan...</span>
                </div>
              ) : csSummaryData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Banner Identitas Pelanggan */}
                  <div className="user-target-banner" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="avatar-circle sm">
                      {csSummaryData.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className="font-bold text-gray-900 block text-sm">
                        {csSummaryData.full_name || 'Pelanggan Skincluv'}
                      </span>
                      <span className="text-xs text-gray-500">
                        @{csSummaryData.username || 'user'} • Terdaftar sejak {new Date(csSummaryData.registered_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Paket Aktif:</span>
                      <strong style={{ fontSize: 13, color: '#0f172a' }}>
                        {csSummaryData.subscription?.tier_name || 'Free'}
                      </strong>
                    </div>
                  </div>

                  {/* Ringkasan Saldo & Kuota */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b45309', fontSize: 12, fontWeight: 600 }}>
                        <Coins size={15} /> Saldo Koin
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#78350f', marginTop: 4 }}>
                        {csSummaryData.coin_balance} <span style={{ fontSize: 12, fontWeight: 500 }}>Credits</span>
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                        <Zap size={15} /> Masa Berlaku Paket
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginTop: 4 }}>
                        {csSummaryData.subscription?.expires_at
                          ? new Date(csSummaryData.subscription.expires_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                          : 'Tidak ada batas'}
                      </div>
                    </div>
                  </div>

                  {/* 10 Invoice Pembayaran Terakhir */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      Riwayat Pembayaran Tripay (Maks 10 Terakhir)
                    </h4>
                    {csSummaryData.recent_invoices?.length > 0 ? (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead style={{ background: '#f8fafc', color: '#64748b' }}>
                            <tr>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ref / Invoice</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Paket</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Nominal</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tanggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csSummaryData.recent_invoices.map((inv: any, idx: number) => (
                              <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>
                                  {inv.reference || inv.tripay_reference || inv.merchant_ref || '-'}
                                </td>
                                <td style={{ padding: '8px 10px' }}>{inv.plan}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                                  Rp {inv.amount_idr?.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      background: inv.status === 'PAID' ? '#dcfce7' : '#fee2e2',
                                      color: inv.status === 'PAID' ? '#15803d' : '#b91c1c',
                                    }}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                                  {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                        Belum ada riwayat tagihan Tripay.
                      </p>
                    )}
                  </div>

                  {/* 10 Riwayat Koin Terakhir */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      Riwayat Transaksi Koin Terakhir
                    </h4>
                    {csSummaryData.recent_coin_transactions?.length > 0 ? (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead style={{ background: '#f8fafc', color: '#64748b' }}>
                            <tr>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Jumlah</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tipe</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Keterangan</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tanggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csSummaryData.recent_coin_transactions.map((tx: any, idx: number) => (
                              <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td
                                  style={{
                                    padding: '8px 10px',
                                    fontWeight: 700,
                                    color: tx.amount > 0 ? '#16a34a' : '#dc2626',
                                  }}
                                >
                                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                </td>
                                <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>
                                  {tx.type}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                  {tx.notes || '-'}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                                  {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                        Belum ada mutasi koin tercatat.
                      </p>
                    )}
                  </div>

                  {/* Banner Privasi Data */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 11,
                      color: '#475569',
                      lineHeight: 1.4,
                    }}
                  >
                    Privasi Data Terjamin: Data foto wajah biometrik, diagnosis klinis, dan privasi percakapan obrolan pengguna diisolasi dari antarmuka ini demi kepatuhan UU PDP No. 27/2022.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 0', textAlign: 'center' }}>
                  <AlertCircle size={28} className="text-amber-500" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Gagal memuat ringkasan pelanggan</span>
                  <span style={{ fontSize: 12, color: '#64748b', maxWidth: 360 }}>
                    Tidak ada data ringkasan yang dapat ditampilkan. Pastikan Anda memiliki wewenang Customer Support atau Administrator.
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
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
