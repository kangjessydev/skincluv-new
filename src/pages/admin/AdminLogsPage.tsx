import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Activity,
  Search,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  AlertTriangle,
  Clock,
  Coins,
  Cpu,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Database,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-logs.css'

interface AiLogRecord {
  id: string
  feature_id: string | null
  prompt_version_id: string | null
  model_config_id: string | null
  provider_id: string | null
  tokens_used: number | null
  input_tokens: number | null
  output_tokens: number | null
  latency_ms: number | null
  cost_usd: number | null
  status: string
  user_feedback: number | null
  created_at: string
  input_summary: string | null
  output_summary: string | null
  raw_output: Record<string, any> | null
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

interface ErrorDiagnostics {
  code: string
  label: string
  badgeClass: string
  httpStatus: number | string
  modelAttempted: string
  creditStatus: string
  details: string
  recommendation: string
}

function parseLogDiagnostics(log: AiLogRecord): ErrorDiagnostics | null {
  if (log.status !== 'error') return null

  const raw = log.raw_output || {}
  const errorCode = raw.error_code || 'AI_SERVICE_ERROR'
  const prov = raw.provider_details || {}
  const httpStatus = prov.httpStatus || (errorCode === 'AI_REQUEST_TIMEOUT' ? 504 : 500)
  const creditStatus = raw.credit_status || 'RELEASED'
  const modelAttempted = prov.modelUsed || log.model_configs?.model_name || log.provider_id || 'Gemini Flash'

  let label = '500 Gangguan Layanan'
  let badgeClass = 'is-danger'
  let recommendation = 'Periksa kuota dan status server penyedia AI.'

  if (httpStatus === 503 || prov.providerCode === 'UNAVAILABLE' || errorCode === 'AI_TEMPORARILY_UNAVAILABLE') {
    label = '503 Antrean Padat (High Demand)'
    badgeClass = 'is-warning'
    recommendation = 'Model Google Free Tier sedang mengalami lonjakan antrean trafik di server Google. Saran: Masukkan API key Paid Tier 1 di /admin/models untuk prioritas tanpa antrean, atau tunggu beberapa saat.'
  } else if (httpStatus === 429 || prov.providerCode === 'RESOURCE_EXHAUSTED' || errorCode === 'AI_RATE_LIMITED') {
    label = '429 Batas Limit (Rate Limit RPM)'
    badgeClass = 'is-warning'
    recommendation = 'Permintaan per menit (RPM) akun Free Tier telah melampaui limit kuota Google. Saran: Upgrade API Key ke Google AI Studio Tier 1 (Pay-as-you-go).'
  } else if (httpStatus === 504 || errorCode === 'AI_REQUEST_TIMEOUT' || (log.latency_ms && log.latency_ms > 8500 && log.tokens_used === null)) {
    label = '504 Timeout Pemrosesan SLA'
    badgeClass = 'is-warning'
    recommendation = 'AI membutuhkan waktu lebih lama dari batas waktu SLA untuk memproses gambar/JSON. Batas timeout multimodal telah diperpanjang menjadi 35 detik.'
  } else if (httpStatus === 400 || errorCode === 'AI_INVALID_REQUEST') {
    label = '400 Format Data Tidak Valid'
    badgeClass = 'is-danger'
    recommendation = 'Input foto atau teks dari pengguna tidak dapat di-parse atau tidak memuat elemen wajah/skincare yang sah.'
  } else if (errorCode === 'INSUFFICIENT_CREDITS') {
    label = '402 Kredit Tidak Cukup'
    badgeClass = 'is-neutral'
    recommendation = 'Pengguna mencoba memanggil fitur AI tanpa saldo koin/kuota yang mencukupi.'
  }

  const rawMsg = prov.providerMessage || prov.rawBody || prov.message || log.output_summary || ''
  let cleanedMsg = rawMsg
  try {
    const parsed = JSON.parse(rawMsg)
    if (parsed.error?.message) cleanedMsg = parsed.error.message
  } catch {}

  return {
    code: errorCode,
    label,
    badgeClass,
    httpStatus,
    modelAttempted,
    creditStatus,
    details: cleanedMsg || 'Tidak ada pesan error mendalam dari penyedia.',
    recommendation,
  }
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
          provider_id,
          tokens_used,
          input_tokens,
          output_tokens,
          latency_ms,
          cost_usd,
          status,
          user_feedback,
          input_summary,
          output_summary,
          raw_output,
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
      // Hide background tasks from main table so 1 user action = strictly 1 row
      if (log.input_summary?.startsWith('[BG:')) {
        return false
      }

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
      const provider = (log.model_configs?.provider || log.provider_id || '').toLowerCase()
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
    if (ms === null) return <span className="alogs-muted-dash">-</span>
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
            <div className="admin-header-icon-wrap is-gold">
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
        <div className="cluv-alert is-danger">
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
            <div className="alogs-stat-row">
              <div className="cluv-stat-value cluv-tabular-nums">
                {metrics.totalTokens.toLocaleString('id-ID')}
              </div>
              {metrics.totalCostIDR > 0 && (
                <div className="alogs-stat-cost-inline cluv-tabular-nums">
                  (≈ Rp {metrics.totalCostIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })})
                </div>
              )}
            </div>
            {(metrics.totalInputTokens > 0 || metrics.totalOutputTokens > 0) && (
              <div className="alogs-stat-sub cluv-tabular-nums">
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
            <div className={`cluv-stat-value cluv-tabular-nums ${metrics.successRate >= 95 ? 'alogs-stat-val-good' : 'alogs-stat-val-alert'}`}>
              {metrics.successRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cluv-card alogs-filter-card">
        <div className="alogs-search-wrap">
          <Search size={16} className="alogs-search-icon" />
          <input
            type="text"
            placeholder="Cari fitur, model, provider, atau ID log..."
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
                <th className="alogs-th-left">Fitur AI</th>
                <th className="alogs-th-left">Model &amp; Versi</th>
                <th className="alogs-th-left">Permintaan ID</th>
                <th className="alogs-th-center">Latensi</th>
                <th className="alogs-th-center">Token &amp; Biaya</th>
                <th className="alogs-th-center">Status</th>
                <th className="alogs-th-center">Feedback</th>
                <th className="alogs-th-left">Waktu</th>
                <th className="alogs-th-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="alogs-empty-cell">
                    <RefreshCw size={24} className="animate-spin alogs-empty-icon" />
                    <div>Memuat riwayat log AI...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="alogs-empty-cell">
                    <Activity size={32} className="alogs-empty-icon is-muted" />
                    <div className="alogs-empty-title">Tidak ada log ditemukan</div>
                    <div className="alogs-empty-sub">
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
                          {log.ai_features?.name || log.feature_id || 'Sistem / Tes Koneksi'}
                        </span>
                        {Array.isArray(log.raw_output?.background_enrichments) && log.raw_output.background_enrichments.length > 0 && (
                          <div>
                            <span className="alogs-bg-badge-pill" title={`${log.raw_output.background_enrichments.length} bahan baru didaftarkan ke kamus di latar belakang`}>
                              <Database size={10} /> +{log.raw_output.background_enrichments.length} bahan baru DB
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="alogs-model-wrap">
                          <Cpu size={13} className="alogs-model-icon" />
                          <span className="alogs-model-name">
                            {log.model_configs?.model_name || log.provider_id || 'LLM Model'}
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

                      <td className="alogs-td-center">
                        {renderLatencyBadge(log.latency_ms)}
                      </td>

                      <td className="alogs-td-center">
                        <div className="alogs-token-val cluv-tabular-nums">
                          {log.tokens_used ? log.tokens_used.toLocaleString('id-ID') : '-'}
                          <span className="alogs-token-unit">tk</span>
                        </div>
                        {(log.input_tokens !== null || log.output_tokens !== null) && (
                          <div className="alogs-token-split cluv-tabular-nums">
                            <span title="Input Tokens">in: {log.input_tokens?.toLocaleString('id-ID') ?? 0}</span>
                            <span className="alogs-token-sep">|</span>
                            <span title="Output Tokens">out: {log.output_tokens?.toLocaleString('id-ID') ?? 0}</span>
                          </div>
                        )}
                        {log.cost_usd !== null && log.cost_usd !== undefined && log.cost_usd > 0 && (
                          <div className="alogs-cost-idr cluv-tabular-nums">
                            ≈ Rp {(Number(log.cost_usd) * USD_TO_IDR).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                          </div>
                        )}
                      </td>

                      <td className="alogs-td-center">
                        {renderStatusBadge(log.status)}
                        {log.status === 'error' && (() => {
                          const diag = parseLogDiagnostics(log)
                          return diag ? (
                            <span className="alogs-error-sub-label" title={diag.details}>
                              {diag.label}
                            </span>
                          ) : null
                        })()}
                      </td>

                      <td className="alogs-td-center">
                        {log.user_feedback === 1 ? (
                          <span className="cluv-badge is-success">
                            <ThumbsUp size={11} /> Puas
                          </span>
                        ) : log.user_feedback === -1 ? (
                          <span className="cluv-badge is-danger">
                            <ThumbsDown size={11} /> Kurang
                          </span>
                        ) : (
                          <span className="alogs-muted-dash">-</span>
                        )}
                      </td>

                      <td className="alogs-td-time">
                        {time}
                      </td>

                      <td className="alogs-td-right">
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
            className="cluv-modal-content alogs-modal-wide"
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
                  <div className="alogs-modal-stat-label">Fitur AI</div>
                  <div className="alogs-modal-feature-title">
                    {selectedLog.ai_features?.name || selectedLog.feature_id || 'Sistem / Tes Koneksi'}
                  </div>
                  <div className="alogs-version-sub">
                    {selectedLog.model_configs?.model_name || selectedLog.provider_id || 'LLM Model'}
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
                    <div className="alogs-stat-sub cluv-tabular-nums">
                      in: {selectedLog.input_tokens?.toLocaleString('id-ID') ?? 0} • out: {selectedLog.output_tokens?.toLocaleString('id-ID') ?? 0}
                    </div>
                  )}
                </div>

                <div>
                  <div className="alogs-modal-stat-label">Status</div>
                  <div className="cluv-mt-1">
                    {renderStatusBadge(selectedLog.status)}
                  </div>
                </div>
              </div>

              {/* Technical Telemetry Details */}
              <div className="cluv-stat-grid cols-2">
                <div className="alogs-modal-stat-box">
                  <div className="alogs-modal-stat-label">Estimasi Biaya Token</div>
                  <div className="alogs-modal-cost-row">
                    <span className="alogs-modal-cost-usd cluv-tabular-nums">
                      {selectedLog.cost_usd ? `$${Number(selectedLog.cost_usd).toFixed(5)}` : '$0.00000'}
                    </span>
                    <span className="cluv-badge is-success cluv-tabular-nums">
                      ≈ Rp {selectedLog.cost_usd ? (Number(selectedLog.cost_usd) * USD_TO_IDR).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '0'}
                    </span>
                  </div>
                  <div className="alogs-modal-cost-note">
                    Aktual API: USD • Estimasi konversi: $1 = Rp {USD_TO_IDR.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="alogs-modal-stat-box">
                  <div className="alogs-modal-stat-label">Feedback Pengguna</div>
                  <div className="alogs-modal-feedback-wrap">
                    {selectedLog.user_feedback === 1 ? (
                      <span className="cluv-badge is-success"><ThumbsUp size={12} /> Puas (Positif)</span>
                    ) : selectedLog.user_feedback === -1 ? (
                      <span className="cluv-badge is-danger"><ThumbsDown size={12} /> Kurang (Negatif)</span>
                    ) : (
                      <span className="alogs-modal-no-rating">Belum Ada Rating</span>
                    )}
                  </div>
                </div>
              </div>

              {/* UU PDP Compliance Box (Invariant 4 & 16) */}
              <div className="cluv-alert is-success">
                <ShieldCheck size={22} className="alogs-pdp-icon" />
                <div>
                  <div className="alogs-pdp-title">
                    Privasi Data Pengguna Terlindungi (UU PDP No. 27/2022)
                  </div>
                  <p className="alogs-pdp-desc">
                    Sesuai dengan regulasi privasi perlindungan data pribadi dan kerahasiaan konsumen, isi percakapan konsultasi serta foto/data biometrik wajah pengguna dienkripsi secara penuh dan tidak ditampilkan pada log operasional admin.
                  </p>
                </div>
              </div>

              {/* Background Auto-Enrichments Section (RFC 021) */}
              {Array.isArray(selectedLog.raw_output?.background_enrichments) && selectedLog.raw_output.background_enrichments.length > 0 && (
                <div className="alogs-enrichment-card">
                  <div className="alogs-enrichment-header">
                    <div className="alogs-enrichment-icon-wrap">
                      <Database size={16} />
                    </div>
                    <div>
                      <div className="alogs-enrichment-title">
                        Otomatisasi Database Bahan ({selectedLog.raw_output.background_enrichments.length} Bahan Baru)
                      </div>
                      <div className="alogs-enrichment-sub">
                        Bahan berikut otomatis didaftarkan ke database kamus skincare di latar belakang • (0 Kredit Pengguna)
                      </div>
                    </div>
                  </div>

                  <div className="alogs-enrichment-list">
                    {selectedLog.raw_output.background_enrichments.map((item: any, idx: number) => (
                      <div key={idx} className="alogs-enrichment-item">
                        <div className="alogs-enrichment-info">
                          <CheckCircle2 size={13} className="alogs-enrichment-check" />
                          <span className="alogs-enrichment-name">{item.name}</span>
                          {item.category && <span className="cluv-badge is-neutral">{item.category}</span>}
                          {item.safety_rating && <span className="cluv-badge is-success">{item.safety_rating}</span>}
                        </div>
                        <div className="alogs-enrichment-meta cluv-tabular-nums">
                          {item.tokens_used ? `${item.tokens_used} tk` : ''}
                          {item.latency_ms ? ` • ${item.latency_ms} ms` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jika status error, tampilkan Diagnostik Masalah & Root Cause secara transparan untuk Admin */}
              {selectedLog.status === 'error' && (() => {
                const diag = parseLogDiagnostics(selectedLog)
                if (!diag) return null
                return (
                  <div className="alogs-diag-card">
                    <div className="alogs-diag-header">
                      <div className="alogs-diag-icon-wrap">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <div className="alogs-diag-title">
                          Diagnostik Kegagalan &amp; Root Cause
                        </div>
                        <div className="alogs-diag-subtitle">
                          {diag.label} • Kode: <code>{diag.code}</code>
                        </div>
                      </div>
                    </div>

                    <div className="alogs-diag-grid">
                      <div className="alogs-diag-item">
                        <div className="alogs-diag-label">HTTP / Provider Status</div>
                        <div className="alogs-diag-value cluv-tabular-nums">
                          HTTP {diag.httpStatus}
                        </div>
                      </div>

                      <div className="alogs-diag-item">
                        <div className="alogs-diag-label">Model yang Dieksekusi</div>
                        <div className="alogs-diag-value">
                          {diag.modelAttempted}
                        </div>
                      </div>

                      <div className="alogs-diag-item">
                        <div className="alogs-diag-label">Status Saldo Pengguna</div>
                        <div className="alogs-diag-value">
                          {diag.creditStatus === 'RELEASED' ? (
                            <span className="cluv-badge is-success">Aman (Di-Refund Otomatis)</span>
                          ) : (
                            <span className="cluv-badge is-warning">{diag.creditStatus}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="alogs-diag-detail-box">
                      <div className="alogs-diag-label">Detail Pesan dari Penyedia AI:</div>
                      <pre className="alogs-diag-pre">{diag.details}</pre>
                    </div>

                    <div className="alogs-diag-solution-box">
                      <div className="alogs-diag-label">Saran / Rekomendasi Tindakan Admin:</div>
                      <p className="alogs-diag-solution-text">{diag.recommendation}</p>
                    </div>
                  </div>
                )
              })()}
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
