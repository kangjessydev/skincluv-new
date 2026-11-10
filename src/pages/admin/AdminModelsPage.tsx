import { useEffect, useState, useCallback } from 'react'
import { Cpu, CheckCircle2, AlertCircle, ShieldCheck, Plus, RefreshCw, Zap, X, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-models.css'

interface AiFeature {
  id: string
  slug: string
  name: string
}

interface ModelConfig {
  id: string
  feature_id: string
  provider: 'google' | 'anthropic' | 'openai' | 'groq'
  model_name: string
  api_key_secret: string
  parameters?: Record<string, any> | null
  is_active: boolean
  created_at: string
}

interface TestResult {
  success: boolean
  latency_ms?: number
  output?: string
  tokens_used?: number
  provider?: string
  model_name?: string
  error?: string
}

const RECOMMENDED_MODELS: Record<'google' | 'anthropic' | 'openai' | 'groq', Array<{ name: string; desc: string }>> = {
  groq: [
    { name: 'llama-3.3-70b-versatile', desc: 'Rekomendasi Utama (70B, Cepat & Cerdas)' },
    { name: 'qwen/qwen3.8-27b', desc: 'Chatbot & Konsultasi Medis Hemat' },
    { name: 'llama-3.1-8b-instant', desc: 'Ultra Cepat & Hemat' },
    { name: 'deepseek-r1-distill-llama-70b', desc: 'Reasoning Model' },
  ],
  google: [
    { name: 'gemini-3.5-flash', desc: 'Rekomendasi Utama (Multimodal & Reasoning Stabil)' },
    { name: 'gemini-3.6-flash', desc: 'Generasi Terbaru (Akurasi Tinggi & Cepat)' },
    { name: 'gemini-2.5-flash', desc: 'Fallback Stabil (1M Context)' },
  ],
  anthropic: [
    { name: 'claude-3-5-sonnet-20241022', desc: 'Akurasi Medis Tinggi' },
    { name: 'claude-3-5-haiku-20241022', desc: 'Cepat & Ringan' },
  ],
  openai: [
    { name: 'gpt-4o-mini', desc: 'Hemat & Efisien' },
    { name: 'gpt-4o', desc: 'Kemampuan Tertinggi' },
  ],
}

export default function AdminModelsPage() {
  const [features, setFeatures] = useState<AiFeature[]>([])
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('')
  const [provider, setProvider] = useState<'google' | 'anthropic' | 'openai' | 'groq'>('google')
  const [modelName, setModelName] = useState('gemini-3.5-flash')
  const [secretName, setSecretName] = useState('')
  const [secretValue, setSecretValue] = useState('')
  const [thinkingBudget, setThinkingBudget] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Testing states
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null)
  const [isTestingForm, setIsTestingForm] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [featuresRes, configsRes] = await Promise.all([
        supabase.from('ai_features').select('id, slug, name').order('slug'),
        supabase.from('model_configs').select('*').order('created_at', { ascending: false }),
      ])

      const feats = (featuresRes.data ?? []) as AiFeature[]
      setFeatures(feats)
      setConfigs((configsRes.data ?? []) as ModelConfig[])

      if (!selectedFeatureId && feats.length > 0) {
        setSelectedFeatureId(feats[0].id)
      }
    } catch (err: any) {
      console.error('[AdminModels] Error loading data:', err)
      setFeedback({ type: 'error', message: 'Gagal memuat konfigurasi model' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedFeatureId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-suggest secret name based on provider
  function handleProviderChange(newProvider: 'google' | 'anthropic' | 'openai' | 'groq') {
    setProvider(newProvider)
    if (!secretName || secretName.includes('_api_key')) {
      if (newProvider === 'google') {
        setSecretName('gemini_api_key')
        setModelName('gemini-3.5-flash')
      } else if (newProvider === 'anthropic') {
        setSecretName('anthropic_api_key')
        setModelName('claude-3-5-sonnet-20241022')
      } else if (newProvider === 'openai') {
        setSecretName('openai_api_key')
        setModelName('gpt-4o-mini')
      } else if (newProvider === 'groq') {
        setSecretName('groq_api_key')
        setModelName('llama-3.3-70b-versatile')
      }
    }
  }

  async function handleTestConnection(params: {
    provider: 'google' | 'anthropic' | 'openai' | 'groq'
    modelName: string
    secretName: string
    secretValue?: string
    configId?: string
  }) {
    if (params.configId) {
      setTestingConfigId(params.configId)
    } else {
      setIsTestingForm(true)
    }
    setTestResult(null)
    setFeedback(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sesi autentikasi admin tidak ditemukan. Harap login ulang.')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-set-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'test_connection',
          provider: params.provider,
          model_name: params.modelName.trim(),
          secret_name: params.secretName.trim(),
          secret_value: params.secretValue?.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}: Gagal menghubungi model`)
      }

      setTestResult({
        success: true,
        latency_ms: json.latency_ms,
        output: json.output,
        tokens_used: json.tokens_used,
        provider: json.provider,
        model_name: json.model_name,
      })
    } catch (err: any) {
      console.error('[AdminModels] Test connection error:', err)
      setTestResult({
        success: false,
        error: err.message || 'Gagal menghubungi model AI.',
      })
    } finally {
      setTestingConfigId(null)
      setIsTestingForm(false)
    }
  }

  async function handleActivateConfig(configId: string) {
    setIsSaving(true)
    setFeedback(null)
    try {
      const { error } = await supabase
        .from('model_configs')
        .update({ is_active: true })
        .eq('id', configId)

      if (error) throw error
      setFeedback({ type: 'success', message: 'Model berhasil diaktifkan!' })
      await loadData()
    } catch (err: any) {
      console.error('[AdminModels] Gagal mengaktifkan model:', err)
      setFeedback({ type: 'error', message: `Gagal mengaktifkan: ${err.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFeatureId || !modelName.trim() || !secretName.trim()) {
      setFeedback({ type: 'error', message: 'Harap lengkapi semua field yang wajib diisi.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      if (secretValue.trim()) {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) throw new Error('Sesi auth tidak ditemukan. Harap login ulang.')

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const res = await fetch(`${supabaseUrl}/functions/v1/admin-set-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            secret_name: secretName.trim(),
            secret_value: secretValue.trim(),
          }),
        })

        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Gagal menyimpan secret ke Supabase Vault.')
        }
      }

      const params: Record<string, any> = {
        temperature: 0.3,
        max_tokens: 8192,
      }
      if (provider === 'google' && thinkingBudget.trim() !== '') {
        params.thinking_budget = Number(thinkingBudget.trim())
      }

      const { error: insertErr } = await supabase.from('model_configs').insert({
        feature_id: selectedFeatureId,
        provider,
        model_name: modelName.trim(),
        api_key_secret: secretName.trim(),
        parameters: params,
        is_active: true,
      })

      if (insertErr) throw insertErr

      setSecretValue('')
      setFeedback({
        type: 'success',
        message: 'Konfigurasi model & API key berhasil disimpan & diaktifkan ke Supabase Vault!',
      })

      await loadData()
    } catch (err: any) {
      console.error('[AdminModels] Gagal menyimpan konfigurasi:', err)
      setFeedback({ type: 'error', message: `Gagal menyimpan: ${err.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-container admin-models-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            <Cpu size={12} /> Infrastruktur & Vault AI
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Model & API Key
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Atur AI Provider, nama model, thinking budget, dan API Key per fitur (terenkripsi di Supabase Vault).
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            type="button"
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

      {/* Test Connection Result Banner */}
      {testResult && (
        <div className={`admin-models-test-banner ${testResult.success ? 'is-success' : 'is-error'}`}>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="admin-models-test-close-btn"
            title="Tutup notifikasi"
          >
            <X size={16} />
          </button>

          <div className="admin-models-test-content">
            {testResult.success ? (
              <CheckCircle2 size={22} style={{ color: 'var(--cluv-teal)', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertCircle size={22} style={{ color: 'var(--cluv-rose)', flexShrink: 0, marginTop: 2 }} />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`admin-models-test-heading ${testResult.success ? 'is-success' : 'is-error'}`}>
                  {testResult.success ? 'Tes Koneksi Model AI Berhasil!' : 'Tes Koneksi Gagal!'}
                </span>
                {testResult.latency_ms !== undefined && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: 11.5,
                      fontWeight: 700,
                      background: testResult.latency_ms < 600 ? 'var(--cluv-teal-soft)' : 'var(--cluv-gold-soft)',
                      color: testResult.latency_ms < 600 ? 'var(--cluv-teal-dark)' : 'var(--cluv-gold)',
                      border: `1px solid ${testResult.latency_ms < 600 ? 'var(--cluv-teal-line)' : 'var(--cluv-gold-line)'}`,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <Clock size={12} /> {testResult.latency_ms} ms
                  </span>
                )}
                {testResult.tokens_used !== undefined && (
                  <span
                    style={{
                      fontSize: 11.5,
                      color: 'var(--cluv-neutral-500)',
                      background: 'var(--cluv-neutral-100)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {testResult.tokens_used} tokens
                  </span>
                )}
              </div>

              {testResult.success ? (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--cluv-teal-dark)', margin: '0 0 6px 0', fontWeight: 600 }}>
                    Model <strong>{testResult.model_name}</strong> via{' '}
                    <strong>{testResult.provider?.toUpperCase()}</strong> merespons dengan sukses:
                  </p>
                  <blockquote className="admin-models-test-quote">
                    "{testResult.output}"
                  </blockquote>
                </div>
              ) : (
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--cluv-rose)' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{testResult.error}</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 12, color: 'var(--cluv-neutral-500)' }}>
                    Tips: Pastikan nama model valid di provider tersebut dan API key di Supabase Vault atau form masih aktif.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabel Konfigurasi Saat Ini */}
      <div className="cluv-card admin-models-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--cluv-border)' }}>
          <Cpu size={18} style={{ color: 'var(--cluv-teal)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0 }}>
            Konfigurasi Model Aktif & Tersimpan
          </h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>FITUR</th>
                <th style={{ width: 120 }}>PROVIDER</th>
                <th style={{ width: 240 }}>NAMA MODEL</th>
                <th>RUJUKAN SECRET VAULT</th>
                <th style={{ textAlign: 'center', width: 130 }}>UJI COBA</th>
                <th style={{ textAlign: 'center', width: 110 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => {
                const feature = features.find((f) => f.id === c.feature_id)
                const isTestingThis = testingConfigId === c.id

                return (
                  <tr
                    key={c.id}
                    className="admin-table-row"
                    style={!c.is_active ? { opacity: 0.7 } : {}}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>
                        {feature?.name ?? c.feature_id}
                      </div>
                      <code style={{ fontSize: 11, color: 'var(--cluv-neutral-500)', fontFamily: 'var(--cluv-font-mono, monospace)' }}>
                        {feature?.slug}
                      </code>
                    </td>
                    <td>
                      <span className={`admin-models-provider-badge is-${c.provider}`}>
                        {c.provider}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--cluv-font-mono, monospace)', fontWeight: 700, color: 'var(--cluv-neutral-900)', fontSize: 13 }}>
                        {c.model_name}
                      </div>
                      {c.provider === 'google' && (
                        <div style={{ marginTop: 4 }}>
                          {c.parameters?.thinking_budget === 0 ? (
                            <span className="admin-models-thinking-tag is-zero">
                              Thinking: 0 (Fast OCR)
                            </span>
                          ) : c.parameters?.thinking_budget !== undefined ? (
                            <span className="admin-models-thinking-tag is-budget">
                              Thinking: {c.parameters.thinking_budget}
                            </span>
                          ) : (
                            <span className="admin-models-thinking-tag is-default">
                              Default Reasoning
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <code style={{ background: 'var(--cluv-neutral-100)', color: 'var(--cluv-neutral-700)', padding: '3px 8px', borderRadius: 4, fontSize: 12, border: '1px solid var(--cluv-border)' }}>
                        {c.api_key_secret}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() =>
                          handleTestConnection({
                            provider: c.provider,
                            modelName: c.model_name,
                            secretName: c.api_key_secret,
                            configId: c.id,
                          })
                        }
                        disabled={isTestingThis}
                        className="cluv-btn is-outline is-sm"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        title="Tes koneksi live model menggunakan secret di Vault"
                      >
                        <Zap size={13} style={{ color: isTestingThis ? 'var(--cluv-neutral-400)' : 'var(--cluv-gold)' }} />
                        <span>{isTestingThis ? 'Menguji...' : 'Tes Koneksi'}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.is_active ? (
                        <span className="cluv-badge is-teal is-sm">
                          Aktif
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivateConfig(c.id)}
                          disabled={isSaving}
                          className="cluv-btn is-outline is-sm"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        >
                          Aktifkan
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {configs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--cluv-neutral-400)' }}>
                    Belum ada konfigurasi model.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Tambah / Ganti Konfigurasi */}
      <div className="cluv-card admin-models-card" style={{ marginBottom: 0 }}>
        <div className="admin-models-card-header">
          <div className="cluv-card-icon-wrap is-teal">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="admin-models-card-title">
              Tambah / Perbarui Konfigurasi Model
            </h2>
            <p style={{ fontSize: 13, color: 'var(--cluv-neutral-500)', margin: '4px 0 0 0' }}>
              Mengaktifkan konfigurasi baru akan otomatis menonaktifkan konfigurasi model lama pada fitur yang sama.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div className="admin-grid-2col">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                Target Fitur AI <span style={{ color: 'var(--cluv-rose)' }}>*</span>
              </label>
              <select
                value={selectedFeatureId}
                onChange={(e) => setSelectedFeatureId(e.target.value)}
                className="admin-select"
                required
              >
                <option value="">-- Pilih Fitur --</option>
                {features.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                AI Provider <span style={{ color: 'var(--cluv-rose)' }}>*</span>
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as any)}
                className="admin-select"
                required
              >
                <option value="groq">Groq (Ultra-Fast LPU / Rekomendasi Chatbot)</option>
                <option value="google">Google (Gemini)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
              </select>
            </div>
          </div>

          <div className="admin-grid-2col">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                Nama Model AI <span style={{ color: 'var(--cluv-rose)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: llama-3.3-70b-versatile atau gemini-2.5-flash"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="admin-input"
                required
              />

              {/* Rekomendasi Model Cepat */}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cluv-neutral-400)', display: 'block', marginBottom: 4 }}>
                  Pilihan Rekomendasi {provider.toUpperCase()}:
                </span>
                <div className="admin-models-recommendations">
                  {RECOMMENDED_MODELS[provider]?.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setModelName(m.name)}
                      className={`admin-models-rec-btn ${modelName === m.name ? 'is-active' : ''}`}
                      title={m.desc}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                Nama Rujukan Secret Vault <span style={{ color: 'var(--cluv-rose)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: groq_api_key atau gemini_api_key"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                className="admin-input"
                required
              />
              <span style={{ fontSize: 11, color: 'var(--cluv-neutral-400)', marginTop: 4, display: 'block' }}>
                Nama kunci identitas secret di Supabase Vault.
              </span>
            </div>
          </div>

          {provider === 'google' && (
            <div className="admin-models-thinking-box">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--cluv-teal-dark)', marginBottom: 4 }}>
                Thinking Budget (Gemini Reasoning)
              </label>
              <select
                value={thinkingBudget}
                onChange={(e) => setThinkingBudget(e.target.value)}
                className="admin-select"
                style={{ background: 'var(--cluv-surface)' }}
              >
                <option value="">Default Gemini (Reasoning Bawaan AI — Rekomendasi untuk Face Analysis)</option>
                <option value="0">0 — Matikan Reasoning (Ultra Cepat ~3-9s — Rekomendasi untuk OCR / Validation)</option>
                <option value="512">512 Tokens (Reasoning Singkat)</option>
                <option value="1024">1024 Tokens (Reasoning Sedang)</option>
                <option value="2048">2048 Tokens (Reasoning Mendalam)</option>
              </select>
              <span style={{ fontSize: 11, color: 'var(--cluv-teal-dark)', marginTop: 6, display: 'block', opacity: 0.9 }}>
                Tersimpan langsung di <code>model_configs.parameters</code> per-fitur tanpa hardcode di kode server.
              </span>
            </div>
          )}

          <div className="admin-models-vault-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ShieldCheck size={16} style={{ color: 'var(--cluv-teal)' }} />
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--cluv-neutral-800)' }}>
                Nilai API Key Mentah (Opsional):
              </label>
            </div>
            <input
              type="password"
              placeholder="Masukkan API key baru di sini jika ingin membuat/memperbarui isi secret..."
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              className="admin-input"
              autoComplete="new-password"
            />
            <p style={{ fontSize: 12, color: 'var(--cluv-neutral-400)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
              Kosongkan jika secret dengan nama di atas sudah pernah disimpan di Vault sebelumnya dan Anda hanya ingin mengganti nama model. Nilai key tidak pernah disimpan di database biasa, melainkan langsung dienkripsi ke Supabase Vault.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isSaving || isTestingForm}
              className="cluv-btn is-primary is-sm"
            >
              {isSaving ? 'Menyimpan & Menulis ke Vault...' : 'Simpan & Aktifkan Model'}
            </button>

            <button
              type="button"
              onClick={() =>
                handleTestConnection({
                  provider,
                  modelName,
                  secretName,
                  secretValue,
                })
              }
              disabled={isSaving || isTestingForm || !modelName.trim() || !secretName.trim()}
              className="cluv-btn is-outline is-sm"
              title="Coba koneksi langsung ke provider AI dengan key di Vault / key yang sedang diketik"
            >
              <Zap size={14} style={{ color: 'var(--cluv-gold)' }} />
              <span>{isTestingForm ? 'Sedang Menguji...' : 'Uji Koneksi Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
