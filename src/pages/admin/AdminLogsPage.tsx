import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Activity,
  Search,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  Clock,
  Coins,
  Cpu,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-logs.css'

interface AiLogRecord {
  id: string
  feature_id: string
  prompt_version_id: string
  model_config_id: string
  tokens_used: number | null
  input_tokens: number | null
  output_tokens: number | null
  latency_ms: number | null
  cost_usd: number | null
  status: string
  user_feedback: number | null
  created_at: string
  ai_features?: {
    slug: string
    name: string
  } | null
  model_configs?: {
    provider: string
    model_name: string
  } | null
  prompt_versions?: {
    version: number
  } | null
}

const USD_TO_IDR = 16000 // Kurs acuan standar konversi USD ke IDR

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AiLogRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AiLogRecord | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('ai_request_logs')
        .select(`
          id,
          feature_id,
          prompt_version_id,
          model_config_id,
          tokens_used,
          input_tokens,
          output_tokens,
          latency_ms,
          cost_usd,
          status,
          user_feedback,
          created_at,
          ai_features:feature_id (
            slug,
            name
          ),
          model_configs:model_config_id (
            provider,
            model_name
          ),
          prompt_versions:prompt_version_id (
            version
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs((data as unknown as AiLogRecord[]) ?? [])
    } catch (err: any) {
      console.error('[AdminLogs] Error loading logs:', err)
      setErrorMessage(err.message || 'Gagal memuat log permintaan AI.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Status filter
      if (statusFilter !== 'all' && log.status !== statusFilter) {
        return false
      }

      // Search filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const featureName = log.ai_features?.name?.toLowerCase() || ''
      const featureSlug = log.ai_features?.slug?.toLowerCase() || ''
      const model = log.model_configs?.model_name?.toLowerCase() || ''
      const provider = log.model_configs?.provider?.toLowerCase() || ''
      const reqId = log.id.toLowerCase()

      return (
        featureName.includes(q) ||
        featureSlug.includes(q) ||
        model.includes(q) ||
        provider.includes(q) ||
        reqId.includes(q)
      )
    })
  }, [logs, searchQuery, statusFilter])

  // Summary Metrics
  const metrics = useMemo(() => {
    if (logs.length === 0) {
      return { count: 0, avgLatency: 0, totalTokens: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCostUSD: 0, totalCostIDR: 0, successRate: 100 }
    }
    const count = logs.length
    const latencies = logs.filter((l) => l.latency_ms !== null).map((l) => l.latency_ms as number)
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
    const totalTokens = logs.reduce((acc, l) => acc + (l.tokens_used || 0), 0)
    const totalInputTokens = logs.reduce((acc, l) => acc + (l.input_tokens || 0), 0)
    const totalOutputTokens = logs.reduce((acc, l) => acc + (l.output_tokens || 0), 0)
    const totalCostUSD = logs.reduce((acc, l) => acc + (l.cost_usd || 0), 0)
    const totalCostIDR = totalCostUSD * USD_TO_IDR
    const successCount = logs.filter((l) => l.status === 'success').length
    const successRate = Math.round((successCount / count) * 100)

    return { count, avgLatency, totalTokens, totalInputTokens, totalOutputTokens, totalCostUSD, totalCostIDR, successRate }
  }, [logs])

  const renderLatencyBadge = (ms: number | null) => {
    if (ms === null) return <span style={{ color: 'var(--cluv-neutral-400)' }}>-</span>
    if (ms < 1500) return <span className="cluv-badge is-success cluv-tabular-nums">{ms} ms</span>
    if (ms < 3500) return <span className="cluv-badge is-warning cluv-tabular-nums">{ms} ms</span>
    return <span className="cluv-badge is-danger cluv-tabular-nums">{ms} ms</span>
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="cluv-badge is-success">
            <CheckCircle2 size={11} /> Sukses
          </span>
        )
      case 'error':
        return (
          <span className="cluv-badge is-danger">
            <XCircle size={11} /> Error
          </span>
        )
      case 'timeout':
        return (
          <span className="cluv-badge is-warning">
            <Clock size={11} /> Timeout
          </span>
        )
      default:
        return <span className="cluv-badge is-neutral">{status}</span>
    }
  }

  return (
    <div className="admin-page-container cluv-animate-fade">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-title-row">
            <div className="admin-header-icon-wrap" style={{ background: 'var(--cluv-gold-soft)', color: 'var(--cluv-gold)' }}>
              <Activity size={22} />
            </div>
            <h1 className="admin-page-title">
              Log Permintaan &amp; Metrik AI
            </h1>
          </div>
          <p className="admin-page-subtitle">
            Observabilitas performa inferensi, latensi respons, penggunaan token, dan status eksekusi prompt AI.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan Log
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="cluv-alert is-danger cluv-mb-4">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="cluv-stat-grid cols-4">
        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-teal">
            <Activity size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Sampel Log</div>
            <div className="cluv-stat-value cluv-tabular-nums">{metrics.count} requests</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-teal">
            <Clock size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Rata-rata Latensi</div>
            <div className="cluv-stat-value cluv-tabular-nums">{metrics.avgLatency} ms</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-gold">
            <Coins size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Total Token &amp; Biaya</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <div className="cluv-stat-value cluv-tabular-nums">
                {metrics.totalTokens.toLocaleString('id-ID')}
              </div>
              {metrics.totalCostIDR > 0 && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cluv-teal)' }}>
                  (≈ Rp {metrics.totalCostIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })})
                </div>
              )}
            </div>
            {(metrics.totalInputTokens > 0 || metrics.totalOutputTokens > 0) && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-500)', marginTop: 2 }}>
                {metrics.totalInputTokens.toLocaleString('id-ID')} in • {metrics.totalOutputTokens.toLocaleString('id-ID')} out
              </div>
            )}
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-rose">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Tingkat Keberhasilan</div>
            <div className="cluv-stat-value cluv-tabular-nums" style={{ color: metrics.successRate >= 95 ? 'var(--cluv-teal)' : 'var(--cluv-rose)' }}>
              {metrics.successRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cluv-card alogs-filter-card">
        <div className="alogs-search-wrap">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari user, model, prompt, atau konten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="alogs-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="cluv-link is-muted"
              aria-label="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="alogs-filter-select"
        >
          <option value="all">Semua Status</option>
          <option value="success">Sukses Saja</option>
          <option value="error">Error Saja</option>
          <option value="timeout">Timeout Saja</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="cluv-card alogs-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Fitur AI</th>
                <th style={{ textAlign: 'left' }}>Model &amp; Versi</th>
                <th style={{ textAlign: 'left' }}>Permintaan ID</th>
                <th style={{ textAlign: 'center' }}>Latensi</th>
                <th style={{ textAlign: 'center' }}>Token &amp; Biaya</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Feedback</th>
                <th style={{ textAlign: 'left' }}>Waktu</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat riwayat log AI...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <Activity size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--cluv-neutral-800)' }}>Tidak ada log ditemukan</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      {searchQuery || statusFilter !== 'all' ? 'Coba ganti filter pencarian.' : 'Belum ada permintaan AI yang tercatat.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const time = new Date(log.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr key={log.id}>
                      <td>
                        <span className="cluv-badge is-neutral">
                          {log.ai_features?.name || log.feature_id}
                        </span>
                      </td>

                      <td>
                        <div className="alogs-model-wrap">
                          <Cpu size={13} style={{ color: 'var(--cluv-neutral-500)' }} />
                          <span className="alogs-model-name">
                            {log.model_configs?.model_name || 'LLM Model'}
                          </span>
                        </div>
                        {log.prompt_versions?.version && (
                          <div className="alogs-version-sub">
                            Prompt v{log.prompt_versions.version}
                          </div>
                        )}
                      </td>

                      <td>
                        <code className="alogs-req-id">
                          #{log.id.slice(0, 8)}
                        </code>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {renderLatencyBadge(log.latency_ms)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div className="alogs-token-val cluv-tabular-nums">
                          {log.tokens_used ? log.tokens_used.toLocaleString('id-ID') : '-'}
                          <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--cluv-neutral-500)', marginLeft: 4 }}>tk</span>
                        </div>
                        {(log.input_tokens !== null || log.output_tokens !== null) && (
                          <div className="alogs-token-split cluv-tabular-nums">
                            <span title="Input Tokens">in: {log.input_tokens?.toLocaleString('id-ID') ?? 0}</span>
                            <span style={{ color: 'var(--cluv-border)' }}>|</span>
                            <span title="Output Tokens">out: {log.output_tokens?.toLocaleString('id-ID') ?? 0}</span>
                          </div>
                        )}
                        {log.cost_usd !== null && log.cost_usd !== undefined && log.cost_usd > 0 && (
                          <div className="alogs-cost-idr cluv-tabular-nums">
                            ≈ Rp {(Number(log.cost_usd) * USD_TO_IDR).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {renderStatusBadge(log.status)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {log.user_feedback === 1 ? (
                          <span className="cluv-badge is-success">
                            <ThumbsUp size={11} /> Puas
                          </span>
                        ) : log.user_feedback === -1 ? (
                          <span className="cluv-badge is-danger">
                            <ThumbsDown size={11} /> Kurang
                          </span>
                        ) : (
                          <span style={{ color: 'var(--cluv-neutral-400)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>

                      <td style={{ color: 'var(--cluv-neutral-600)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {time}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="cluv-btn is-outline is-sm"
                        >
                          <Eye size={13} /> Detail
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="cluv-modal-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="cluv-modal-content"
            style={{ maxWidth: 800 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cluv-modal-header">
              <div>
                <h2 className="cluv-modal-title">
                  Detail Log Permintaan AI
                </h2>
                <p className="cluv-modal-subtitle">
                  Log ID: <code>{selectedLog.id}</code>
                </p>
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

            {/* Modal Body */}
            <div className="cluv-modal-body">
              {/* Telemetry Stats */}
              <div className="alogs-modal-stats-grid">
                <div>
                  <div className="alogs-modal-stat-label">Fitur &amp; Model</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cluv-neutral-900)', marginTop: 2 }}>
                    {selectedLog.ai_features?.name || selectedLog.feature_id}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-500)' }}>
                    {selectedLog.model_configs?.model_name}
                  </div>
                </div>

                <div>
                  <div className="alogs-modal-stat-label">Latensi</div>
                  <div className="alogs-modal-stat-val cluv-tabular-nums">
                    {selectedLog.latency_ms ? `${selectedLog.latency_ms} ms` : '-'}
                  </div>
                </div>

                <div>
                  <div className="alogs-modal-stat-label">Tokens Used</div>
                  <div className="alogs-modal-stat-val cluv-tabular-nums">
                    {selectedLog.tokens_used ? selectedLog.tokens_used.toLocaleString('id-ID') : '-'}
                  </div>
                  {(selectedLog.input_tokens !== null || selectedLog.output_tokens !== null) && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-500)', marginTop: 2 }}>
                      in: {selectedLog.input_tokens?.toLocaleString('id-ID') ?? 0} • out: {selectedLog.output_tokens?.toLocaleString('id-ID') ?? 0}
                    </div>
                  )}
                </div>

                <div>
                  <div className="alogs-modal-stat-label">Status</div>
                  <div style={{ marginTop: 4 }}>
                    {renderStatusBadge(selectedLog.status)}
                  </div>
                </div>
              </div>

              {/* Technical Telemetry Details */}
              <div className="cluv-stat-grid cols-2" style={{ margin: 0 }}>
                <div className="alogs-modal-stat-box">
                  <div className="alogs-modal-stat-label">Estimasi Biaya Token</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cluv-neutral-900)' }} className="cluv-tabular-nums">
                      {selectedLog.cost_usd ? `$${Number(selectedLog.cost_usd).toFixed(5)}` : '$0.00000'}
                    </span>
                    <span className="cluv-badge is-success cluv-tabular-nums">
                      ≈ Rp {selectedLog.cost_usd ? (Number(selectedLog.cost_usd) * USD_TO_IDR).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '0'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-400)', marginTop: 4 }}>
                    Aktual API: USD • Estimasi konversi: $1 = Rp {USD_TO_IDR.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="alogs-modal-stat-box">
                  <div className="alogs-modal-stat-label">Feedback Pengguna</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--cluv-neutral-900)', marginTop: 4 }}>
                    {selectedLog.user_feedback === 1 ? (
                      <span className="cluv-badge is-success"><ThumbsUp size={12} /> Puas (Positif)</span>
                    ) : selectedLog.user_feedback === -1 ? (
                      <span className="cluv-badge is-danger"><ThumbsDown size={12} /> Kurang (Negatif)</span>
                    ) : (
                      <span style={{ color: 'var(--cluv-neutral-500)', fontWeight: 500 }}>Belum Ada Rating</span>
                    )}
                  </div>
                </div>
              </div>

              {/* UU PDP Compliance Box (Invariant 4 & 16) */}
              <div className="cluv-alert is-success">
                <ShieldCheck size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                    Privasi Data Pengguna Terlindungi (UU PDP No. 27/2022)
                  </div>
                  <p style={{ fontSize: '0.75rem', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                    Sesuai dengan regulasi privasi perlindungan data pribadi dan kerahasiaan konsumen, isi percakapan konsultasi serta foto/data biometrik wajah pengguna dienkripsi secara penuh dan tidak ditampilkan pada log operasional admin.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
