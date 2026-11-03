import { useEffect, useState, useCallback } from 'react'
import { Sparkles, CheckCircle2, AlertCircle, History, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-prompts.css'

interface AiFeature {
  id: string
  slug: string
  name: string
  description: string | null
  is_active: boolean
}

interface PromptVersion {
  id: string
  feature_id: string
  version: number
  system_prompt: string
  notes: string | null
  is_active: boolean
  created_at: string
}

export default function AdminPromptsPage() {
  const [features, setFeatures] = useState<AiFeature[]>([])
  const [activePrompts, setActivePrompts] = useState<Record<string, PromptVersion>>({})
  const [allVersions, setAllVersions] = useState<PromptVersion[]>([])
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [featuresRes, promptsRes] = await Promise.all([
        supabase.from('ai_features').select('*').order('slug'),
        supabase.from('prompt_versions').select('*').order('version', { ascending: false }),
      ])

      const feats = (featuresRes.data ?? []) as AiFeature[]
      const prompts = (promptsRes.data ?? []) as PromptVersion[]

      setFeatures(feats)
      setAllVersions(prompts)

      const activeMap: Record<string, PromptVersion> = {}
      for (const p of prompts) {
        if (p.is_active && !activeMap[p.feature_id]) {
          activeMap[p.feature_id] = p
        }
      }
      setActivePrompts(activeMap)

      // Auto-select first feature if none selected
      if (!selectedFeatureId && feats.length > 0) {
        const first = feats[0]
        setSelectedFeatureId(first.id)
        setDraftPrompt(activeMap[first.id]?.system_prompt ?? '')
      }
    } catch (err: any) {
      console.error('[AdminPrompts] Error loading data:', err)
      setFeedback({ type: 'error', message: 'Gagal memuat data fitur & prompt' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedFeatureId])

  useEffect(() => {
    loadData()
  }, [loadData])

  function selectFeature(featureId: string) {
    setSelectedFeatureId(featureId)
    setDraftPrompt(activePrompts[featureId]?.system_prompt ?? '')
    setDraftNotes('')
    setFeedback(null)
  }

  async function handleSavePrompt() {
    if (!selectedFeatureId || !draftPrompt.trim()) return
    setIsSaving(true)
    setFeedback(null)

    try {
      // Find latest version for this feature to increment
      const featureVersions = allVersions.filter((v) => v.feature_id === selectedFeatureId)
      const maxVersion = featureVersions.reduce((max, v) => Math.max(max, v.version || 0), 0)
      const nextVersion = maxVersion + 1

      const { error } = await supabase.from('prompt_versions').insert({
        feature_id: selectedFeatureId,
        version: nextVersion,
        system_prompt: draftPrompt.trim(),
        notes: draftNotes.trim() || null,
        is_active: true,
      })

      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Prompt versi v${nextVersion} berhasil disimpan & diaktifkan! Versi sebelumnya otomatis dinonaktifkan.`,
      })
      setDraftNotes('')
      await loadData()
    } catch (err: any) {
      console.error('[AdminPrompts] Gagal menyimpan prompt:', err)
      setFeedback({ type: 'error', message: `Gagal menyimpan: ${err.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDirectActivate(versionId: string, versionNum: number) {
    setIsSaving(true)
    setFeedback(null)
    try {
      const { error } = await supabase
        .from('prompt_versions')
        .update({ is_active: true })
        .eq('id', versionId)

      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Prompt versi v${versionNum} berhasil diaktifkan kembali! Versi lainnya otomatis dinonaktifkan.`,
      })
      await loadData()
    } catch (err: any) {
      console.error('[AdminPrompts] Gagal mengaktifkan versi:', err)
      setFeedback({ type: 'error', message: `Gagal mengaktifkan versi: ${err.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedFeature = features.find((f) => f.id === selectedFeatureId)
  const currentActivePrompt = selectedFeatureId ? activePrompts[selectedFeatureId] : null
  const selectedHistory = allVersions.filter((v) => v.feature_id === selectedFeatureId)

  return (
    <div className="admin-page-container admin-prompts-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            <Sparkles size={12} /> AI Brain & Prompts
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Prompt & Fitur AI
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Kelola system prompt per fitur AI. Versi baru langsung aktif dan versi lama otomatis dinonaktifkan oleh database.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
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

      <div className="admin-prompts-layout">
        {/* Sidebar Fitur */}
        <div className="admin-prompts-sidebar">
          <div className="admin-prompts-sidebar-heading">
            Daftar Fitur AI ({features.length})
          </div>

          <div className="admin-prompts-feature-list">
            {features.map((f) => {
              const isSelected = selectedFeatureId === f.id
              const hasActive = !!activePrompts[f.id]
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selectFeature(f.id)}
                  className={`admin-prompts-feature-item ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="admin-prompts-feature-meta">
                    <span className="admin-prompts-feature-name">
                      {f.name}
                    </span>
                    {hasActive && (
                      <span className="admin-prompts-feature-version">
                        v{activePrompts[f.id]?.version}
                      </span>
                    )}
                  </div>
                  <span className="admin-prompts-feature-slug">
                    {f.slug}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Editor Form */}
        <div className="admin-prompts-editor-panel">
          {selectedFeature ? (
            <>
              <div className="admin-prompts-editor-header">
                <div>
                  <h2 className="admin-prompts-selected-title">
                    {selectedFeature.name}
                  </h2>
                  <p className="admin-prompts-selected-slug">
                    Slug: <code className="admin-prompts-slug-badge">{selectedFeature.slug}</code>
                    {selectedFeature.description && ` — ${selectedFeature.description}`}
                  </p>
                </div>

                {currentActivePrompt && (
                  <div style={{ textAlign: 'right' }}>
                    <span className="admin-prompts-active-tag">
                      <Sparkles size={13} /> Aktif: v{currentActivePrompt.version}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--cluv-neutral-400)', marginTop: 4 }}>
                      {new Date(currentActivePrompt.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  System Prompt:
                </label>
                <textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  rows={16}
                  className="admin-prompts-textarea"
                  placeholder="Ketik system prompt di sini..."
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Catatan Versi (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kalibrasi respon panjang, perketat rekomendasi"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSavePrompt}
                  disabled={isSaving || !draftPrompt.trim()}
                  className="cluv-btn is-primary is-sm"
                >
                  {isSaving ? 'Menyimpan ke Database...' : 'Simpan & Aktifkan Versi Baru'}
                </button>

                <span style={{ fontSize: 12, color: 'var(--cluv-neutral-400)' }}>
                  Versi baru akan otomatis mendapatkan nomor versi berikutnya.
                </span>
              </div>

              {/* Riwayat Versi */}
              {selectedHistory.length > 0 && (
                <div className="admin-prompts-history-section">
                  <div className="admin-prompts-history-title">
                    <History size={16} style={{ color: 'var(--cluv-teal)' }} />
                    <span>Riwayat Versi ({selectedHistory.length})</span>
                  </div>

                  <div>
                    {selectedHistory.map((ver) => (
                      <div
                        key={ver.id}
                        className={`admin-prompts-history-card ${ver.is_active ? 'is-active' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="admin-prompts-history-ver">
                            v{ver.version}
                          </span>
                          {ver.is_active && (
                            <span className="cluv-badge is-teal is-sm">
                              Sedang Aktif
                            </span>
                          )}
                          <span style={{ color: 'var(--cluv-neutral-600)' }}>
                            {ver.notes ? ver.notes : 'Tanpa catatan'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--cluv-neutral-400)', fontVariantNumeric: 'tabular-nums' }}>
                            {new Date(ver.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!ver.is_active && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleDirectActivate(ver.id, ver.version)}
                                disabled={isSaving}
                                className="cluv-btn is-outline is-sm"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                Aktifkan Langsung
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftPrompt(ver.system_prompt)
                                  setDraftNotes(`Restore dari versi v${ver.version}`)
                                }}
                                className="cluv-btn is-outline is-sm"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                Salin ke Editor
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--cluv-neutral-400)' }}>
              {isLoading ? 'Memuat data...' : 'Pilih fitur di sebelah kiri untuk melihat dan mengedit prompt.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
