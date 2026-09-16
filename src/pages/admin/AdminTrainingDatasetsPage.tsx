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

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1360, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
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
              <FileCode size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Pusat Dataset & Fine-Tuning AI (Training Flywheel)
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Repositori data pasangan instruksi-jawaban terkurasi untuk melatih (fine-tune) model AI masa depan dan kalibrasi prompt aktif.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadDatasets}
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
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
          </button>

          <button
            onClick={exportToJsonl}
            disabled={filtered.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Download size={16} /> Unduh Dataset (JSONL)
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
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
            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
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
            <FileCode size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Pasangan Training
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.total} sampel
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
            <Star size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Gold Standard (Terkurasi)
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>
              {metrics.gold} sampel
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
              background: '#f3f4f6',
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Silver Standard
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.silver} sampel
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
              background: '#ede9fe',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Few-Shot Exemplars Aktif
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>
              {metrics.exemplars} contoh
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
            placeholder="Cari user prompt atau tags..."
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
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={featureFilter}
          onChange={(e) => setFeatureFilter(e.target.value)}
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
          <option value="all">Semua Fitur</option>
          <option value="face_analysis">Scan Wajah</option>
          <option value="ingredient_scan">Scan Ingredient</option>
          <option value="chatbot">Chatbot Skinsistant</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
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
          <option value="all">Semua Tier Kualitas</option>
          <option value="gold">Gold (Gold Standard)</option>
          <option value="silver">Silver</option>
          <option value="candidate">Candidate</option>
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
                  Input Prompt Pengguna
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Tier Kualitas
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Few-Shot Exemplar
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Domain Tags
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat dataset training...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <FileCode size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Belum ada data training</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Data pasangan instruksi-jawaban akan terakumulasi dari penggunaan AI dan kurasi feedback.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
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
                          color: '#2563eb',
                        }}
                      >
                        {item.feature_slug}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          color: '#111827',
                          maxWidth: 380,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 13,
                        }}
                      >
                        {item.user_input || '(Attachment foto / tanpa teks)'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            item.quality_tier === 'gold'
                              ? '#fef3c7'
                              : item.quality_tier === 'silver'
                              ? '#f3f4f6'
                              : '#f8fafc',
                          color:
                            item.quality_tier === 'gold'
                              ? '#d97706'
                              : item.quality_tier === 'silver'
                              ? '#374151'
                              : '#64748b',
                          border:
                            item.quality_tier === 'gold'
                              ? '1px solid #fde68a'
                              : '1px solid #e2e8f0',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.quality_tier}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleExemplar(item.id, item.is_few_shot_exemplar)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: item.is_few_shot_exemplar ? '1px solid #c4b5fd' : '1px solid #d1d5db',
                          background: item.is_few_shot_exemplar ? '#ede9fe' : '#ffffff',
                          color: item.is_few_shot_exemplar ? '#6d28d9' : '#6b7280',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={11} />
                        {item.is_few_shot_exemplar ? 'Exemplar Aktif' : 'Nonaktif'}
                      </button>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.domain_tags?.map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              background: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedDataset(item)}
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
                        <Eye size={12} /> Detail
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setSelectedDataset(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 780,
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
                  Detail Sampel Data Training AI
                </h2>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Fitur: <code style={{ color: '#4f46e5' }}>{selectedDataset.feature_slug}</code>
                </div>
              </div>

              <button
                onClick={() => setSelectedDataset(null)}
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
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Quality Tier Selector */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Tingkat Kurasi Kualitas
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Pilih apakah sampel ini layak menjadi standar emas untuk fine-tuning
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {(['candidate', 'silver', 'gold'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => updateTier(selectedDataset.id, tier)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        background: selectedDataset.quality_tier === tier ? '#111827' : '#ffffff',
                        color: selectedDataset.quality_tier === tier ? '#ffffff' : '#475569',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Input Prompt */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Input Prompt Pengguna
                </div>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#1e293b',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 120,
                    overflowY: 'auto',
                  }}
                >
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                    Ideal Output Response (Ground Truth)
                  </span>
                  <button
                    onClick={copyResponse}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: copiedResponse ? '#059669' : '#374151',
                    }}
                  >
                    {copiedResponse ? <Check size={12} /> : <Copy size={12} />}
                    {copiedResponse ? 'Tersalin' : 'Salin Respon'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    maxHeight: 200,
                  }}
                >
                  {JSON.stringify(selectedDataset.ideal_response, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f9fafb',
              }}
            >
              <button
                onClick={() => setSelectedDataset(null)}
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
