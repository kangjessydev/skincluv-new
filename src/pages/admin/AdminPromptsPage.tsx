import { useEffect, useState, useCallback } from 'react'
import { Sparkles, CheckCircle2, AlertCircle, History } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

  const selectedFeature = features.find((f) => f.id === selectedFeatureId)
  const currentActivePrompt = selectedFeatureId ? activePrompts[selectedFeatureId] : null
  const selectedHistory = allVersions.filter((v) => v.feature_id === selectedFeatureId)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
          Prompt & AI Features
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Kelola system prompt per fitur AI. Versi baru langsung aktif dan versi lama otomatis dinonaktifkan oleh database.
        </p>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Sidebar Fitur */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 16,
            height: 'fit-content',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
            Daftar Fitur AI ({features.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {features.map((f) => {
              const isSelected = selectedFeatureId === f.id
              const hasActive = !!activePrompts[f.id]
              return (
                <button
                  key={f.id}
                  onClick={() => selectFeature(f.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    textAlign: 'left',
                    background: isSelected ? '#f0fdf4' : 'transparent',
                    border: `1px solid ${isSelected ? '#86efac' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#166534' : '#1f2937' }}>
                      {f.name}
                    </span>
                    {hasActive && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: isSelected ? '#bbf7d0' : '#e5e7eb',
                          color: isSelected ? '#15803d' : '#4b5563',
                        }}
                      >
                        v{activePrompts[f.id]?.version}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280', marginTop: 2, fontFamily: 'monospace' }}>
                    {f.slug}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Editor Form */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
          }}
        >
          {selectedFeature ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                    {selectedFeature.name}
                  </h2>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
                    Slug: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{selectedFeature.slug}</code>
                    {selectedFeature.description && ` — ${selectedFeature.description}`}
                  </p>
                </div>

                {currentActivePrompt && (
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 9999,
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={13} /> Aktif: v{currentActivePrompt.version}
                    </span>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  System Prompt:
                </label>
                <textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  rows={16}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 13,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    lineHeight: 1.5,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    background: '#fcfcfc',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                  placeholder="Ketik system prompt di sini..."
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Catatan Versi (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kalibrasi respon panjang, perketat rekomendasi"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={handleSavePrompt}
                  disabled={isSaving || !draftPrompt.trim()}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    background: isSaving || !draftPrompt.trim() ? '#9ca3af' : '#111827',
                    color: '#ffffff',
                    cursor: isSaving || !draftPrompt.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {isSaving ? 'Menyimpan ke Database...' : 'Simpan & Aktifkan Versi Baru'}
                </button>

                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  Versi baru akan otomatis mendapatkan nomor versi berikutnya.
                </span>
              </div>

              {/* Riwayat Versi */}
              {selectedHistory.length > 0 && (
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                    <History size={16} /> Riwayat Versi ({selectedHistory.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedHistory.map((ver) => (
                      <div
                        key={ver.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          background: ver.is_active ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: ver.is_active ? '#166534' : '#4b5563',
                              fontFamily: 'monospace',
                            }}
                          >
                            v{ver.version}
                          </span>
                          {ver.is_active && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>
                              Sedang Aktif
                            </span>
                          )}
                          <span style={{ color: '#6b7280' }}>
                            {ver.notes ? ver.notes : 'Tanpa catatan'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            {new Date(ver.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!ver.is_active && (
                            <button
                              onClick={() => {
                                setDraftPrompt(ver.system_prompt)
                                setDraftNotes(`Restore dari versi v${ver.version}`)
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: 500,
                                borderRadius: 4,
                                border: '1px solid #d1d5db',
                                background: '#f9fafb',
                                cursor: 'pointer',
                              }}
                            >
                              Gunakan Prompt Ini
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              {isLoading ? 'Memuat data...' : 'Pilih fitur di sebelah kiri untuk melihat dan mengedit prompt.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
