import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Download,
  Search,
  RefreshCw,
  Star,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Copy,
  Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AiTrainingDataset } from '@/types/database'
import '@/styles/admin-training-datasets.css'

export default function AdminTrainingDatasetsPage() {
  const [datasets, setDatasets] = useState<AiTrainingDataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [featureFilter, setFeatureFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [selectedDataset, setSelectedDataset] = useState<AiTrainingDataset | null>(null)
  const [copiedResponse, setCopiedResponse] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadDatasets = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const { data, error } = await supabase
        .from('ai_training_datasets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setDatasets((data as AiTrainingDataset[]) ?? [])
    } catch (err: any) {
      console.error('[AdminTrainingDatasets] Error loading:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat dataset training.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  const filtered = useMemo(() => {
    return datasets.filter((item) => {
      if (featureFilter !== 'all' && item.feature_slug !== featureFilter) return false
      if (tierFilter !== 'all' && item.quality_tier !== tierFilter) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const input = item.user_input.toLowerCase()
      const tags = (item.domain_tags || []).join(' ').toLowerCase()
      return input.includes(q) || tags.includes(q)
    })
  }, [datasets, searchQuery, featureFilter, tierFilter])

  const metrics = useMemo(() => {
    const total = datasets.length
    const gold = datasets.filter((d) => d.quality_tier === 'gold').length
    const silver = datasets.filter((d) => d.quality_tier === 'silver').length
    const exemplars = datasets.filter((d) => d.is_few_shot_exemplar).length
    return { total, gold, silver, exemplars }
  }, [datasets])

  const toggleExemplar = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_training_datasets')
        .update({ is_few_shot_exemplar: !current })
        .eq('id', id)

      if (error) throw error
      setDatasets((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_few_shot_exemplar: !current } : d))
      )
      setFeedback({
        type: 'success',
        message: `Status Few-Shot Exemplar berhasil ${!current ? 'diaktifkan' : 'dinonaktifkan'}.`,
      })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah status.' })
    }
  }

  const updateTier = async (id: string, tier: 'gold' | 'silver' | 'candidate') => {
    try {
      const { error } = await supabase
        .from('ai_training_datasets')
        .update({ quality_tier: tier })
        .eq('id', id)

      if (error) throw error
      setDatasets((prev) =>
        prev.map((d) => (d.id === id ? { ...d, quality_tier: tier } : d))
      )
      if (selectedDataset && selectedDataset.id === id) {
        setSelectedDataset({ ...selectedDataset, quality_tier: tier })
      }
      setFeedback({ type: 'success', message: `Tier kualitas berhasil diubah menjadi "${tier.toUpperCase()}".` })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah tier.' })
    }
  }

  // 1-Click Export to JSONL (OpenAI / Vertex AI / HuggingFace Standard)
  const exportToJsonl = () => {
    if (filtered.length === 0) {
      setFeedback({ type: 'error', message: 'Tidak ada data untuk diekspor.' })
      return
    }

    const lines = filtered.map((d) => {
      const assistantContent =
        typeof d.ideal_response === 'string'
          ? d.ideal_response
          : JSON.stringify(d.ideal_response)

      const entry = {
        messages: [
          { role: 'system', content: d.system_prompt },
          { role: 'user', content: d.user_input },
          { role: 'assistant', content: assistantContent },
        ],
      }
      return JSON.stringify(entry)
    })

    const blob = new Blob([lines.join('\n')], { type: 'application/jsonl;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `skincluv_training_dataset_${new Date().toISOString().slice(0, 10)}.jsonl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setFeedback({
      type: 'success',
      message: `Berhasil mengunduh ${lines.length} sampel dataset dalam format standar JSONL.`,
    })
  }

  const copyResponse = () => {
    if (!selectedDataset) return
    navigator.clipboard.writeText(JSON.stringify(selectedDataset.ideal_response, null, 2))
    setCopiedResponse(true)
    setTimeout(() => setCopiedResponse(false), 2000)
  }

  const renderTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return <span className="cluv-badge is-gold"><Star size={11} /> Gold</span>
      case 'silver':
        return <span className="cluv-badge is-neutral">Silver</span>
      default:
        return <span className="cluv-badge is-neutral">{tier}</span>
    }
  }

  return (
    <div className="admin-page-container cluv-animate-fade">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-title-row">
            <div className="admin-header-icon-wrap" style={{ background: 'var(--cluv-teal-soft)', color: 'var(--cluv-teal)' }}>
              <FileCode size={22} />
            </div>
            <h1 className="admin-page-title">
              Pusat Dataset &amp; Fine-Tuning AI (Training Flywheel)
            </h1>
          </div>
          <p className="admin-page-subtitle">
            Repositori data pasangan instruksi-jawaban terkurasi untuk melatih (fine-tune) model AI masa depan dan kalibrasi prompt aktif.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={loadDatasets}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
          </button>

          <button
            type="button"
            onClick={exportToJsonl}
            disabled={filtered.length === 0}
            className="cluv-btn is-primary is-sm"
          >
            <Download size={15} /> Unduh Dataset (JSONL)
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`cluv-alert ${feedback.type === 'success' ? 'is-success' : 'is-danger'} cluv-mb-4`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="cluv-stat-grid cols-4">
        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-teal">
            <FileCode size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Total Pasangan Training</div>
            <div className="cluv-stat-value cluv-tabular-nums">{metrics.total} sampel</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-gold">
            <Star size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Gold Standard (Terkurasi)</div>
            <div className="cluv-stat-value cluv-tabular-nums" style={{ color: 'var(--cluv-gold)' }}>
              {metrics.gold} sampel
            </div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-neutral">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Silver Standard</div>
            <div className="cluv-stat-value cluv-tabular-nums">{metrics.silver} sampel</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-rose">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Few-Shot Exemplars Aktif</div>
            <div className="cluv-stat-value cluv-tabular-nums" style={{ color: 'var(--cluv-teal)' }}>
              {metrics.exemplars} contoh
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cluv-card ad-toolbar-card">
        <div className="ad-search-wrap">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari user prompt atau tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ad-search-input"
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
          value={featureFilter}
          onChange={(e) => setFeatureFilter(e.target.value)}
          className="ad-filter-select"
        >
          <option value="all">Semua Fitur</option>
          <option value="face_analysis">Scan Wajah</option>
          <option value="ingredient_scan">Scan Ingredient</option>
          <option value="chatbot">Chatbot Skinsistant</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="ad-filter-select"
        >
          <option value="all">Semua Tier Kualitas</option>
          <option value="gold">Gold (Gold Standard)</option>
          <option value="silver">Silver</option>
          <option value="candidate">Candidate</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="cluv-card ad-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Fitur AI</th>
                <th style={{ textAlign: 'left' }}>Input Prompt Pengguna</th>
                <th style={{ textAlign: 'center' }}>Tier Kualitas</th>
                <th style={{ textAlign: 'center' }}>Few-Shot Exemplar</th>
                <th style={{ textAlign: 'left' }}>Domain Tags</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat dataset training...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <FileCode size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--cluv-neutral-800)' }}>Belum ada data training</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      Data pasangan instruksi-jawaban akan terakumulasi dari penggunaan AI dan kurasi feedback.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="cluv-badge is-neutral">
                        {item.feature_slug}
                      </span>
                    </td>

                    <td>
                      <div className="ad-input-preview">
                        {item.user_input || '(Attachment foto / tanpa teks)'}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {renderTierBadge(item.quality_tier)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => toggleExemplar(item.id, item.is_few_shot_exemplar)}
                        className={`ad-exemplar-btn ${item.is_few_shot_exemplar ? 'is-active' : 'is-inactive'}`}
                      >
                        <Sparkles size={11} />
                        {item.is_few_shot_exemplar ? 'Exemplar Aktif' : 'Nonaktif'}
                      </button>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.domain_tags?.map((t, idx) => (
                          <span key={idx} className="ad-tag-pill">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDataset(item)}
                        className="cluv-btn is-outline is-sm"
                      >
                        <Eye size={13} /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDataset && (
        <div
          className="cluv-modal-overlay"
          onClick={() => setSelectedDataset(null)}
        >
          <div
            className="cluv-modal-content"
            style={{ maxWidth: 780 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cluv-modal-header">
              <div>
                <h2 className="cluv-modal-title">
                  Detail Sampel Data Training AI
                </h2>
                <p className="cluv-modal-subtitle">
                  Fitur: <code style={{ color: 'var(--cluv-teal)' }}>{selectedDataset.feature_slug}</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDataset(null)}
                className="cluv-modal-close-btn"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="cluv-modal-body">
              {/* Quality Tier Selector */}
              <div className="ad-tier-selector-box">
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>
                    Tingkat Kurasi Kualitas
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cluv-neutral-500)' }}>
                    Pilih apakah sampel ini layak menjadi standar emas untuk fine-tuning
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {(['candidate', 'silver', 'gold'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => updateTier(selectedDataset.id, tier)}
                      className={`cluv-btn is-sm ${selectedDataset.quality_tier === tier ? 'is-primary' : 'is-outline'}`}
                      style={{ textTransform: 'uppercase', fontSize: '0.6875rem' }}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Input Prompt */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cluv-neutral-900)', marginBottom: 6 }}>
                  Input Prompt Pengguna
                </div>
                <div className="ad-box-preview">
                  {selectedDataset.user_input || '(Attachment gambar multimodal)'}
                </div>
              </div>

              {/* Ideal AI Output Response */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>
                    Ideal Output Response (Ground Truth)
                  </span>
                  <button
                    type="button"
                    onClick={copyResponse}
                    className="cluv-btn is-outline is-sm"
                  >
                    {copiedResponse ? <Check size={12} /> : <Copy size={12} />}
                    {copiedResponse ? 'Tersalin' : 'Salin Respon'}
                  </button>
                </div>
                <pre className="ad-code-preview">
                  {JSON.stringify(selectedDataset.ideal_response, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="cluv-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedDataset(null)}
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
