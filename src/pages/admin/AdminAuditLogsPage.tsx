import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  X,
  Clock,
  Filter,
  Download,
  UserCheck,
  UserX,
  Coins,
  Settings,
  ChevronLeft,
  ChevronRight,
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
          <span className="audit-badge audit-badge-green">
            <UserCheck size={12} /> ASSIGN ROLE
          </span>
        )
      case 'REVOKE_ROLE':
        return (
          <span className="audit-badge audit-badge-red">
            <UserX size={12} /> REVOKE ROLE
          </span>
        )
      case 'ADJUST_CREDITS':
        return (
          <span className="audit-badge audit-badge-amber">
            <Coins size={12} /> ADJUST CREDITS
          </span>
        )
      default:
        return (
          <span className="audit-badge audit-badge-blue">
            <Settings size={12} /> {action}
          </span>
        )
    }
  }

  const renderRoleBadge = (role: string | null) => {
    const r = role || 'staff'
    let bg = '#f1f5f9'
    let color = '#475569'

    if (r === 'super_admin') {
      bg = '#f3e8ff'
      color = '#7e22ce'
    } else if (r === 'tech_lead') {
      bg = '#ecfdf5'
      color = '#047857'
    } else if (r === 'business_lead') {
      bg = '#fffbeb'
      color = '#b45309'
    } else if (r === 'support_agent') {
      bg = '#eff6ff'
      color = '#1d4ed8'
    }

    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 9999,
          background: bg,
          color: color,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {r.replace('_', ' ')}
      </span>
    )
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
    <div className="audit-page-container">
      {/* Header Halaman */}
      <div className="audit-header">
        <div>
          <div className="audit-title-wrapper">
            <ShieldCheck size={24} className="text-indigo-600" />
            <h1 className="audit-page-title">Log Audit Tata Kelola Admin</h1>
          </div>
          <p className="audit-page-subtitle">
            Rekam jejak mutasi hak akses, penyesuaian kuota/kredit, dan perubahan konfigurasi tata kelola sistem sesuai UU PDP No. 27/2022.
          </p>
        </div>

        <div className="audit-header-actions">
          <button
            type="button"
            onClick={handleExportJson}
            className="btn-audit btn-audit-secondary"
            title="Unduh log terfilter dalam format JSON"
          >
            <Download size={15} />
            <span>Ekspor JSON</span>
          </button>
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="btn-audit btn-audit-primary"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Baris Statistik Cepat */}
      <div className="audit-stats-grid">
        <div className="audit-stat-card">
          <span className="stat-label">Total Log Tercatat</span>
          <span className="stat-val">{stats.total}</span>
          <span className="stat-hint">300 entri terbaru</span>
        </div>
        <div className="audit-stat-card">
          <span className="stat-label">Mutasi Role / Akses</span>
          <span className="stat-val text-indigo-600">{stats.roleChanges}</span>
          <span className="stat-hint">Assign & Revoke</span>
        </div>
        <div className="audit-stat-card">
          <span className="stat-label">Penyesuaian Kredit</span>
          <span className="stat-val text-amber-600">{stats.creditAdjustments}</span>
          <span className="stat-hint">Manual admin adjustments</span>
        </div>
        <div className="audit-stat-card">
          <span className="stat-label">Staf Aktor Aktif</span>
          <span className="stat-val text-emerald-600">{stats.uniqueActors}</span>
          <span className="stat-hint">Akun unik pelaksana</span>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="audit-toolbar">
        <div className="audit-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari email aktor, aksi, tipe target, atau ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="audit-search-input"
          />
        </div>

        <div className="audit-filter-group">
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="audit-select"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="ASSIGN_ROLE">ASSIGN ROLE</option>
              <option value="REVOKE_ROLE">REVOKE ROLE</option>
              <option value="ADJUST_CREDITS">ADJUST CREDITS</option>
              <option value="UPDATE_PRICING">UPDATE PRICING</option>
              <option value="UPDATE_CONFIG">UPDATE CONFIG</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="audit-select"
            >
              <option value="ALL">Semua Role Aktor</option>
              <option value="super_admin">Super Admin</option>
              <option value="tech_lead">Tech Lead</option>
              <option value="business_lead">Business Lead</option>
              <option value="support_agent">Support Agent</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="audit-select"
            >
              <option value={15}>15 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="audit-error-banner">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabel Data Audit Log */}
      <div className="audit-table-card">
        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Waktu Pelaksanaan</th>
                <th>Aktor & Peran</th>
                <th style={{ width: '160px' }}>Aksi</th>
                <th>Target Mutasi</th>
                <th>Ringkasan Rincian</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                    <RefreshCw size={22} className="animate-spin inline-block mb-2" />
                    <div>Memuat riwayat audit log...</div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                    <ShieldCheck size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 500 }}>Tidak ada log audit yang cocok</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Ubah parameter filter atau kata kunci pencarian.</div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const detailsObj = log.details && typeof log.details === 'object' ? (log.details as any) : {}
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4b5563' }}>
                          <Clock size={13} className="text-gray-400" />
                          <span>{formatTimestamp(log.created_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                            {log.actor_email || 'Sistem / Anonim'}
                          </span>
                          <div>{renderRoleBadge(log.actor_role)}</div>
                        </div>
                      </td>
                      <td>{renderActionBadge(log.action)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                            {log.target_type}
                          </span>
                          {log.target_id && (
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6b7280' }}>
                              {log.target_id.slice(0, 18)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: '#4b5563', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {detailsObj.new_role && (
                            <span>Role baru: <strong>{detailsObj.new_role}</strong> (sebelumnya: {detailsObj.previous_role || 'none'})</span>
                          )}
                          {detailsObj.amount !== undefined && (
                            <span>Penyesuaian: <strong>{detailsObj.amount > 0 ? `+${detailsObj.amount}` : detailsObj.amount}</strong> koin ({detailsObj.reason})</span>
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
                          className="btn-view-detail"
                          title="Lihat Rincian JSON Lengkap"
                        >
                          <Eye size={15} />
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
          <div className="audit-pagination">
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredLogs.length)} dari {filteredLogs.length} entri
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Log JSON */}
      {selectedLog && (
        <div className="audit-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} className="text-indigo-600" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  Rincian Log Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="audit-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="audit-modal-body">
              <div className="modal-info-grid">
                <div>
                  <label className="modal-field-label">ID Log</label>
                  <div className="modal-field-val font-mono">{selectedLog.id}</div>
                </div>
                <div>
                  <label className="modal-field-label">Waktu Pelaksanaan</label>
                  <div className="modal-field-val">{formatTimestamp(selectedLog.created_at)}</div>
                </div>
                <div>
                  <label className="modal-field-label">Aktor (Email)</label>
                  <div className="modal-field-val">{selectedLog.actor_email || 'Tidak diketahui'}</div>
                </div>
                <div>
                  <label className="modal-field-label">Peran Aktor</label>
                  <div>{renderRoleBadge(selectedLog.actor_role)}</div>
                </div>
                <div>
                  <label className="modal-field-label">Aksi</label>
                  <div>{renderActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <label className="modal-field-label">Target</label>
                  <div className="modal-field-val">
                    {selectedLog.target_type} ({selectedLog.target_id || '-'})
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="modal-field-label">Muatan Rincian (Raw Payload JSON)</label>
                <pre className="modal-json-pre">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="audit-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-audit btn-audit-primary"
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
