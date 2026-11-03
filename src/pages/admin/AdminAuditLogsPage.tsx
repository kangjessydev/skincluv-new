import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  X,
  Clock,
  Download,
  UserCheck,
  UserX,
  Coins,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AdminAuditLog } from '@/types/database'
import '@/styles/admin-audit-logs.css'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)

      if (actionFilter !== 'ALL') {
        query = query.eq('action', actionFilter)
      }

      if (roleFilter !== 'ALL') {
        query = query.eq('actor_role', roleFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs((data as AdminAuditLog[]) || [])
    } catch (err: any) {
      console.error('Failed to load audit logs:', err)
      setErrorMessage(err?.message || 'Gagal memuat log audit admin.')
    } finally {
      setIsLoading(false)
    }
  }, [actionFilter, roleFilter])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Filter client-side berdasarkan pencarian teks
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs

    const q = searchQuery.toLowerCase()
    return logs.filter((log) => {
      const emailMatch = log.actor_email?.toLowerCase().includes(q)
      const actionMatch = log.action?.toLowerCase().includes(q)
      const targetTypeMatch = log.target_type?.toLowerCase().includes(q)
      const targetIdMatch = log.target_id?.toLowerCase().includes(q)
      const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(q)

      return emailMatch || actionMatch || targetTypeMatch || targetIdMatch || detailsMatch
    })
  }, [logs, searchQuery])

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, currentPage, pageSize])

  // Ringkasan Statistik
  const stats = useMemo(() => {
    const total = logs.length
    const roleChanges = logs.filter((l) => l.action === 'ASSIGN_ROLE' || l.action === 'REVOKE_ROLE').length
    const creditAdjustments = logs.filter((l) => l.action === 'ADJUST_CREDITS').length
    const uniqueActors = new Set(logs.map((l) => l.actor_email).filter(Boolean)).size

    return { total, roleChanges, creditAdjustments, uniqueActors }
  }, [logs])

  // Ekspor Data ke JSON
  const handleExportJson = () => {
    const exportData = filteredLogs.map((l) => ({
      id: l.id,
      timestamp: l.created_at,
      actor_email: l.actor_email,
      actor_role: l.actor_role,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      details: l.details,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skincluv-audit-logs-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'ASSIGN_ROLE':
        return (
          <span className="cluv-badge is-success">
            <UserCheck size={11} /> ASSIGN ROLE
          </span>
        )
      case 'REVOKE_ROLE':
        return (
          <span className="cluv-badge is-danger">
            <UserX size={11} /> REVOKE ROLE
          </span>
        )
      case 'ADJUST_CREDITS':
        return (
          <span className="cluv-badge is-warning">
            <Coins size={11} /> ADJUST CREDITS
          </span>
        )
      default:
        return (
          <span className="cluv-badge is-neutral">
            <Settings size={11} /> {action}
          </span>
        )
    }
  }

  const renderRoleBadge = (role: string | null) => {
    const r = role || 'staff'
    switch (r) {
      case 'super_admin':
        return <span className="cluv-badge is-gold">super admin</span>
      case 'tech_lead':
        return <span className="cluv-badge is-teal">tech lead</span>
      case 'business_lead':
        return <span className="cluv-badge is-warning">business lead</span>
      case 'support_agent':
        return <span className="cluv-badge is-neutral">support agent</span>
      default:
        return <span className="cluv-badge is-neutral">{r.replace('_', ' ')}</span>
    }
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="admin-page-container cluv-animate-fade">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-title-row">
            <div className="admin-header-icon-wrap" style={{ background: 'var(--cluv-teal-soft)', color: 'var(--cluv-teal)' }}>
              <ShieldCheck size={22} />
            </div>
            <h1 className="admin-page-title">Log Audit Tata Kelola Admin</h1>
          </div>
          <p className="admin-page-subtitle">
            Rekam jejak mutasi hak akses, penyesuaian kuota/kredit, dan perubahan konfigurasi tata kelola sistem sesuai UU PDP No. 27/2022.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={handleExportJson}
            className="cluv-btn is-outline is-sm"
            title="Unduh log terfilter dalam format JSON"
          >
            <Download size={14} />
            <span>Ekspor JSON</span>
          </button>
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="cluv-btn is-primary is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Baris Statistik Cepat */}
      <div className="cluv-stat-grid cols-4">
        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-teal">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Total Log Tercatat</div>
            <div className="cluv-stat-value cluv-tabular-nums">{stats.total}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-400)', marginTop: 2 }}>300 entri terbaru</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-rose">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Mutasi Role / Akses</div>
            <div className="cluv-stat-value cluv-tabular-nums" style={{ color: 'var(--cluv-teal)' }}>
              {stats.roleChanges}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-400)', marginTop: 2 }}>Assign &amp; Revoke</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-gold">
            <Coins size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Penyesuaian Kredit</div>
            <div className="cluv-stat-value cluv-tabular-nums" style={{ color: 'var(--cluv-gold)' }}>
              {stats.creditAdjustments}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-400)', marginTop: 2 }}>Manual adjustments</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-neutral">
            <Settings size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Staf Aktor Aktif</div>
            <div className="cluv-stat-value cluv-tabular-nums">{stats.uniqueActors}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-400)', marginTop: 2 }}>Akun unik pelaksana</div>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="cluv-card aal-toolbar-card">
        <div className="aal-search-wrap">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari email aktor, aksi, tipe target, atau ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="aal-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="cluv-link is-muted"
              aria-label="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="aal-filter-group">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="aal-filter-select"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="ASSIGN_ROLE">ASSIGN ROLE</option>
            <option value="REVOKE_ROLE">REVOKE ROLE</option>
            <option value="ADJUST_CREDITS">ADJUST CREDITS</option>
            <option value="UPDATE_PRICING">UPDATE PRICING</option>
            <option value="UPDATE_CONFIG">UPDATE CONFIG</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="aal-filter-select"
          >
            <option value="ALL">Semua Role Aktor</option>
            <option value="super_admin">Super Admin</option>
            <option value="tech_lead">Tech Lead</option>
            <option value="business_lead">Business Lead</option>
            <option value="support_agent">Support Agent</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="aal-filter-select"
          >
            <option value={15}>15 baris</option>
            <option value={25}>25 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="cluv-alert is-danger cluv-mb-4">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabel Data Audit Log */}
      <div className="cluv-card aal-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Waktu Pelaksanaan</th>
                <th>Aktor &amp; Peran</th>
                <th style={{ width: '160px' }}>Aksi</th>
                <th>Target Mutasi</th>
                <th>Ringkasan Rincian</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat riwayat audit log...</div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <ShieldCheck size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cluv-neutral-800)' }}>Tidak ada log audit yang cocok</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Ubah parameter filter atau kata kunci pencarian.</div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const detailsObj = log.details && typeof log.details === 'object' ? (log.details as any) : {}
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--cluv-neutral-600)' }}>
                          <Clock size={13} style={{ color: 'var(--cluv-neutral-400)' }} />
                          <span>{formatTimestamp(log.created_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cluv-neutral-900)' }}>
                            {log.actor_email || 'Sistem / Anonim'}
                          </span>
                          <div>{renderRoleBadge(log.actor_role)}</div>
                        </div>
                      </td>
                      <td>{renderActionBadge(log.action)}</td>
                      <td>
                        <div className="aal-target-wrap">
                          <span className="aal-target-type">
                            {log.target_type}
                          </span>
                          {log.target_id && (
                            <span className="aal-target-id">
                              {log.target_id.slice(0, 18)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="aal-details-preview">
                          {detailsObj.new_role && (
                            <span>Role baru: <strong>{detailsObj.new_role}</strong> (sebelumnya: {detailsObj.previous_role || 'none'})</span>
                          )}
                          {detailsObj.amount !== undefined && (
                            <span>Penyesuaian: <strong>{detailsObj.amount > 0 ? `+${detailsObj.amount}` : detailsObj.amount}</strong> credits ({detailsObj.reason})</span>
                          )}
                          {!detailsObj.new_role && detailsObj.amount === undefined && (
                            <span>{JSON.stringify(detailsObj)}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="cluv-btn is-outline is-sm"
                          title="Lihat Rincian JSON Lengkap"
                          style={{ padding: '4px 8px' }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Baris Pagination */}
        {filteredLogs.length > pageSize && (
          <div className="aal-pagination">
            <span style={{ fontSize: '0.75rem', color: 'var(--cluv-neutral-600)' }} className="cluv-tabular-nums">
              Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredLogs.length)} dari {filteredLogs.length} entri
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="aal-page-btn"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cluv-neutral-800)' }} className="cluv-tabular-nums">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="aal-page-btn"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Log JSON */}
      {selectedLog && (
        <div className="cluv-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="cluv-modal-content" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="cluv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} style={{ color: 'var(--cluv-teal)' }} />
                <h3 className="cluv-modal-title">
                  Rincian Log Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="cluv-modal-close-btn"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cluv-modal-body">
              <div className="aal-modal-grid">
                <div>
                  <div className="aal-modal-field-label">ID Log</div>
                  <div className="aal-modal-field-val font-mono">{selectedLog.id}</div>
                </div>
                <div>
                  <div className="aal-modal-field-label">Waktu Pelaksanaan</div>
                  <div className="aal-modal-field-val">{formatTimestamp(selectedLog.created_at)}</div>
                </div>
                <div>
                  <div className="aal-modal-field-label">Aktor (Email)</div>
                  <div className="aal-modal-field-val">{selectedLog.actor_email || 'Tidak diketahui'}</div>
                </div>
                <div>
                  <div className="aal-modal-field-label">Peran Aktor</div>
                  <div>{renderRoleBadge(selectedLog.actor_role)}</div>
                </div>
                <div>
                  <div className="aal-modal-field-label">Aksi</div>
                  <div>{renderActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <div className="aal-modal-field-label">Target</div>
                  <div className="aal-modal-field-val">
                    {selectedLog.target_type} ({selectedLog.target_id || '-'})
                  </div>
                </div>
              </div>

              <div>
                <div className="aal-modal-field-label" style={{ marginBottom: 6 }}>Muatan Rincian (Raw Payload JSON)</div>
                <pre className="aal-code-preview">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="cluv-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="cluv-btn is-outline is-sm"
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
