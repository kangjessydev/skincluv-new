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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'ALL' | 'FREE' | 'GLOW' | 'PRO'>('ALL')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal State: Adjust Coins
  const [adjustCoinUser, setAdjustCoinUser] = useState<UserItem | null>(null)
  const [coinAmount, setCoinAmount] = useState<number>(5)
  const [coinReason, setCoinReason] = useState<string>('Kompensasi / Penyesuaian CS')
  const [isAdjustingCoins, setIsAdjustingCoins] = useState(false)

  // Modal State: Manage Role
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null)
  const [targetRole, setTargetRole] = useState<'admin' | 'customer'>('customer')
  const [isChangingRole, setIsChangingRole] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      // Ambil profiles, subscriptions, coin_balances, dan user_roles
      const [profilesRes, subsRes, coinsRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, avatar_url, created_at').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('user_id, status, expires_at, subscription_tiers(slug, name)').eq('status', 'active'),
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
        const tierSlug = sub?.subscription_tiers?.slug || 'free'
        const tierName = sub?.subscription_tiers?.name || 'Free Tier'

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
    const adminCount = users.filter((u) => u.role === 'admin').length

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
        if (roleFilter === 'ADMIN' && u.role !== 'admin') return false
        if (roleFilter === 'CUSTOMER' && u.role === 'admin') return false
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
              <option value="ADMIN">Staf Admin</option>
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
                  const isAdmin = u.role === 'admin'
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
                        {isAdmin ? (
                          <span className="role-badge role-admin">
                            <ShieldCheck size={12} /> ADMIN
                          </span>
                        ) : (
                          <span className="role-badge role-customer">
                            CUSTOMER
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-gray-500 font-mono">{joinDate}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
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
                          <button
                            className="btn-action btn-manage-role"
                            onClick={() => {
                              setRoleModalUser(u)
                              setTargetRole(u.role === 'admin' ? 'customer' : 'admin')
                            }}
                            title="Ubah Hak Akses Role"
                          >
                            <Shield size={13} /> Role
                          </button>
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
                      <span>Pengguna aplikasi biasa dengan hak akses standar.</span>
                    </div>
                  </label>

                  <label className={`role-card-option ${targetRole === 'admin' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userRole"
                      value="admin"
                      checked={targetRole === 'admin'}
                      onChange={() => setTargetRole('admin')}
                    />
                    <div>
                      <strong>Admin</strong>
                      <span>Akses penuh ke Control Center Admin, prompt, model, & data finansial.</span>
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

      {/* VANILLA CSS STYLING */}
      <style>{`
        .admin-users-page {
          padding: 24px;
          max-width: 1300px;
          margin: 0 auto;
          font-family: inherit;
        }

        .admin-users-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .badge-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #4f46e5;
          background: #eef2ff;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 8px;
          letter-spacing: 0.04em;
        }

        .admin-users-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .admin-users-header p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .btn-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-refresh:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .alert-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .kpi-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-card.total-users .kpi-icon-wrap { background: #eff6ff; color: #2563eb; }
        .kpi-card.paid-users .kpi-icon-wrap { background: #fdf4ff; color: #c026d3; }
        .kpi-card.free-users .kpi-icon-wrap { background: #f8fafc; color: #64748b; }
        .kpi-card.total-coins .kpi-icon-wrap { background: #fffbeb; color: #d97706; }

        .kpi-content {
          display: flex;
          flex-direction: column;
        }

        .kpi-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .kpi-value {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0;
          letter-spacing: -0.02em;
        }

        .kpi-subtext {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Filter Card */
        .filter-bar-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .search-wrap input {
          width: 100%;
          padding: 9px 34px 9px 36px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .search-wrap input:focus {
          border-color: #4f46e5;
          background: #ffffff;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .status-pills {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 8px;
          gap: 2px;
        }

        .pill {
          background: transparent;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }

        .pill.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .pill.active.pill-pro { color: #7c3aed; }
        .pill.active.pill-glow { color: #d97706; }
        .pill.active.pill-free { color: #475569; }

        .role-select-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 4px 10px;
        }

        .role-select {
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          outline: none;
          cursor: pointer;
        }

        /* Table Card */
        .table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .admin-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .table-row:hover {
          background: #fafafa;
        }

        .user-profile-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: #6366f1;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar-circle.sm {
          width: 38px;
          height: 38px;
        }

        .user-display-name {
          font-weight: 700;
          color: #0f172a;
          display: block;
          font-size: 13px;
        }

        .user-display-username {
          font-size: 12px;
          color: #64748b;
          display: block;
        }

        .tier-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .tier-pro { background: #ede9fe; color: #6d28d9; }
        .tier-glow { background: #fef3c7; color: #b45309; }
        .tier-free { background: #f1f5f9; color: #475569; }

        .expiry-hint {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .coin-balance-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .role-admin { background: #e0e7ff; color: #3730a3; }
        .role-customer { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

        .action-buttons-group {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-adjust-coins {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
        }

        .btn-adjust-coins:hover {
          background: #fef3c7;
        }

        .btn-manage-role {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #334155;
        }

        .btn-manage-role:hover {
          background: #f1f5f9;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-title-wrap h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .user-target-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .form-group input[type="text"],
        .form-group input[type="number"] {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }

        .amount-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .amount-input-wrap input {
          flex: 1;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
        }

        .amount-quick-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
        }

        .amount-quick-btn.pos { background: #dcfce7; color: #15803d; }
        .amount-quick-btn.neg { background: #fee2e2; color: #b91c1c; }

        .helper-text {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .calculation-preview {
          background: #eff6ff;
          border: 1px dashed #bfdbfe;
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #1e40af;
        }

        .role-options-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .role-card-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .role-card-option.selected {
          background: #eef2ff;
          border-color: #6366f1;
        }

        .role-card-option strong {
          display: block;
          font-size: 13px;
          color: #0f172a;
        }

        .role-card-option span {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .modal-footer {
          padding: 14px 20px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-secondary {
          padding: 8px 14px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .btn-primary {
          padding: 8px 16px;
          background: #4f46e5;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338ca;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
