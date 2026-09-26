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

  const getLatencyBadge = (ms: number | null) => {
    if (ms === null) return { color: '#6b7280', text: '-' }
    if (ms < 1500) return { color: '#059669', text: `${ms} ms` }
    if (ms < 3500) return { color: '#d97706', text: `${ms} ms` }
    return { color: '#dc2626', text: `${ms} ms` }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Sukses' }
      case 'error':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Error' }
      case 'timeout':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Timeout' }
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: status }
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Log Permintaan & Metrik AI
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Observabilitas performa inferensi, latensi respons, penggunaan token, dan status eksekusi prompt AI.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan Log
        </button>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="admin-grid-cards">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Sampel Log
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.count} requests
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Rata-rata Latensi
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.avgLatency} ms
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Coins size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Token & Biaya
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                {metrics.totalTokens.toLocaleString('id-ID')}
              </div>
              {metrics.totalCostIDR > 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
                  (≈ Rp {metrics.totalCostIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })})
                </div>
              )}
            </div>
            {(metrics.totalInputTokens > 0 || metrics.totalOutputTokens > 0) && (
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {metrics.totalInputTokens.toLocaleString('id-ID')} in • {metrics.totalOutputTokens.toLocaleString('id-ID')} out
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Tingkat Keberhasilan
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.successRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 260,
            display: 'flex',
            gap: 10,
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            alignItems: 'center',
          }}
        >
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Cari user, model, prompt, atau konten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 13,
              width: '100%',
              color: '#111827',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          <option value="all">Semua Status</option>
          <option value="success">Sukses Saja</option>
          <option value="error">Error Saja</option>
          <option value="timeout">Timeout Saja</option>
        </select>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Fitur AI
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Model & Versi
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Permintaan ID
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Latensi
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Token & Biaya
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Status
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Feedback
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Waktu
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat riwayat log AI...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <Activity size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Tidak ada log ditemukan</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {searchQuery || statusFilter !== 'all' ? 'Coba ganti filter pencarian.' : 'Belum ada permintaan AI yang tercatat.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const statusInfo = getStatusBadge(log.status)
                  const latencyInfo = getLatencyBadge(log.latency_ms)
                  const time = new Date(log.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: '#eff6ff',
                            color: '#1e40af',
                          }}
                        >
                          {log.ai_features?.name || log.feature_id}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Cpu size={13} color="#6b7280" />
                          <span style={{ fontWeight: 600, color: '#111827' }}>
                            {log.model_configs?.model_name || 'LLM Model'}
                          </span>
                        </div>
                        {log.prompt_versions?.version && (
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                            Prompt v{log.prompt_versions.version}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ fontSize: 11, background: '#f3f4f6', padding: '3px 6px', borderRadius: 4, color: '#4b5563', fontFamily: 'monospace' }}>
                          #{log.id.slice(0, 8)}
                        </code>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 600, color: latencyInfo.color }}>
                          {latencyInfo.text}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ color: '#111827', fontWeight: 700 }}>
                          {log.tokens_used ? log.tokens_used.toLocaleString('id-ID') : '-'}
                          <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginLeft: 4 }}>tk</span>
                        </div>
                        {(log.input_tokens !== null || log.output_tokens !== null) && (
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, display: 'flex', justifyContent: 'center', gap: 5 }}>
                            <span title="Input Tokens">in: {log.input_tokens?.toLocaleString('id-ID') ?? 0}</span>
                            <span style={{ color: '#d1d5db' }}>|</span>
                            <span title="Output Tokens">out: {log.output_tokens?.toLocaleString('id-ID') ?? 0}</span>
                          </div>
                        )}
                        {log.cost_usd !== null && log.cost_usd !== undefined && log.cost_usd > 0 && (
                          <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                            ≈ Rp {(Number(log.cost_usd) * USD_TO_IDR).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: statusInfo.bg,
                            color: statusInfo.text,
                            border: `1px solid ${statusInfo.border}`,
                          }}
                        >
                          {log.status === 'success' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {statusInfo.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {log.user_feedback === 1 ? (
                          <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600 }}>
                            <ThumbsUp size={12} /> Puas
                          </span>
                        ) : log.user_feedback === -1 ? (
                          <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600 }}>
                            <ThumbsDown size={12} /> Kurang
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 11 }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {time}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#111827',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 12,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 820,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Detail Log Permintaan AI
                </h2>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Log ID: <code style={{ color: '#4b5563' }}>{selectedLog.id}</code>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  border: 'none',
                  background: '#f3f4f6',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Telemetry Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                  background: '#f9fafb',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #f3f4f6',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Fitur & Model
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                    {selectedLog.ai_features?.name || selectedLog.feature_id}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {selectedLog.model_configs?.model_name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Latensi
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                    {selectedLog.latency_ms ? `${selectedLog.latency_ms} ms` : '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Tokens Used
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                    {selectedLog.tokens_used ? selectedLog.tokens_used.toLocaleString('id-ID') : '-'}
                  </div>
                  {(selectedLog.input_tokens !== null || selectedLog.output_tokens !== null) && (
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      in: {selectedLog.input_tokens?.toLocaleString('id-ID') ?? 0} • out: {selectedLog.output_tokens?.toLocaleString('id-ID') ?? 0}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Status
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: selectedLog.status === 'success' ? '#059669' : '#dc2626', marginTop: 2, textTransform: 'uppercase' }}>
                    {selectedLog.status}
                  </div>
                </div>
              </div>

              {/* Technical Telemetry Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Estimasi Biaya Token</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {selectedLog.cost_usd ? `$${Number(selectedLog.cost_usd).toFixed(5)}` : '$0.00000'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                      ≈ Rp {selectedLog.cost_usd ? (Number(selectedLog.cost_usd) * USD_TO_IDR).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '0'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Aktual API: USD • Estimasi konversi: $1 = Rp {USD_TO_IDR.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {selectedLog.user_feedback === 1 ? 'Puas (Positif)' : selectedLog.user_feedback === -1 ? 'Kurang (Negatif)' : 'Belum Ada Rating'}
                  </div>
                </div>
              </div>

              {/* UU PDP Compliance Box */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <ShieldCheck size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                    Privasi Data Pengguna Terlindungi (UU PDP No. 27/2022)
                  </div>
                  <p style={{ fontSize: 12, color: '#15803d', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                    Sesuai dengan regulasi privasi perlindungan data pribadi dan kerahasiaan konsumen, isi percakapan konsultasi serta foto/data biometrik wajah pengguna dienkripsi secara penuh dan tidak ditampilkan pada log operasional admin.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f9fafb',
              }}
            >
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                }}
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
