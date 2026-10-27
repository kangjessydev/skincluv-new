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
    { name: 'gemini-2.5-flash', desc: 'Default Gemini (Cepat & Stabil)' },
    { name: 'gemini-3.6-flash', desc: 'Generasi Terbaru (Tinggi Akurasi & Hemat)' },
    { name: 'gemini-2.0-flash', desc: 'Ultra Hemat' },
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
  const [modelName, setModelName] = useState('gemini-2.5-flash')
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
        setModelName('gemini-2.5-flash')
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
      // 1. Jika ada API key baru yang dimasukkan, simpan langsung ke Vault lewat Edge Function
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

      // 2. Simpan konfigurasi model ke tabel model_configs (HANYA menyimpan nama secret, BUKAN raw key)
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

      // Bersihkan state secretValue secepatnya dari memori
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
      <div className="admin-models-header">
        <div>
          <h1 className="admin-models-title">
            Model & API Key
          </h1>
          <p className="admin-models-subtitle">
            Atur AI Provider, nama model, dan API Key per fitur. API Key disimpan terenkripsi di Supabase Vault.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="cluv-btn is-outline is-sm"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
        </button>
      </div>

      {feedback && (
        <div className={`cluv-alert ${feedback.type === 'success' ? 'is-success' : 'is-danger'}`} style={{ marginBottom: 20 }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
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
              <CheckCircle2 size={22} color="var(--cluv-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`admin-models-test-heading ${testResult.success ? 'is-success' : 'is-error'}`}>
                  {testResult.success ? 'Tes Koneksi Model AI Berhasil!' : 'Tes Koneksi Gagal!'}
                </span>
                {testResult.latency_ms !== undefined && (
                  <span
                    className="cluv-tabular-nums"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: testResult.latency_ms < 600 ? 'var(--cluv-teal-100, #bbf7d0)' : '#fed7aa',
                      color: testResult.latency_ms < 600 ? 'var(--cluv-teal-800, #166534)' : '#9a3412',
                    }}
                  >
                    <Clock size={12} /> {testResult.latency_ms} ms
                  </span>
                )}
                {testResult.tokens_used !== undefined && (
                  <span
                    className="cluv-tabular-nums"
                    style={{
                      fontSize: 12,
                      color: 'var(--cluv-text-muted)',
                      background: 'var(--cluv-surface-subtle)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {testResult.tokens_used} tokens
                  </span>
                )}
              </div>

              {testResult.success ? (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--cluv-teal-800, #166534)', margin: '0 0 6px 0' }}>
                    Model <strong>{testResult.model_name}</strong> via{' '}
                    <strong>{testResult.provider?.toUpperCase()}</strong> merespons dengan sukses:
                  </p>
                  <blockquote className="admin-models-test-quote">
                    "{testResult.output}"
                  </blockquote>
                </div>
              ) : (
                <div style={{ marginTop: 6, fontSize: 13, color: '#991b1b' }}>
                  <p style={{ margin: 0 }}>{testResult.error}</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 12, color: 'var(--cluv-text-muted)' }}>
                    Tips: Pastikan nama model valid di provider tersebut dan API key di Supabase Vault atau form masih aktif.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabel Konfigurasi Saat Ini */}
      <div className="admin-models-card">
        <div className="admin-models-card-header">
          <Cpu size={18} color="var(--cluv-text-muted)" />
          <h2 className="admin-models-card-title">
            Konfigurasi Model Aktif & Tersimpan
          </h2>
        </div>

        <div className="admin-models-table-wrap">
          <table className="admin-models-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Fitur</th>
                <th style={{ textAlign: 'left' }}>Provider</th>
                <th style={{ textAlign: 'left' }}>Nama Model</th>
                <th style={{ textAlign: 'left' }}>Rujukan Secret Vault</th>
                <th style={{ textAlign: 'center' }}>Uji Coba</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => {
                const feature = features.find((f) => f.id === c.feature_id)
                const isTestingThis = testingConfigId === c.id

                return (
                  <tr
                    key={c.id}
                    style={{
                      background: c.is_active ? 'var(--cluv-surface)' : 'var(--cluv-surface-subtle)',
                      color: c.is_active ? 'var(--cluv-text-main)' : 'var(--cluv-text-muted)',
                    }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      {feature?.name ?? c.feature_id}
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: 'var(--cluv-text-muted)' }}>
                        {feature?.slug}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-models-provider-badge is-${c.provider}`}>
                        {c.provider}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--cluv-text-main)' }}>
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
                      <code style={{ background: 'var(--cluv-surface-subtle)', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
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
                        title="Tes koneksi live model menggunakan secret di Vault"
                      >
                        <Zap size={13} color={isTestingThis ? 'var(--cluv-text-muted)' : '#f59e0b'} />
                        {isTestingThis ? 'Menguji...' : 'Tes Koneksi'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.is_active ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            background: 'var(--cluv-teal-100, #dcfce7)',
                            color: 'var(--cluv-teal-800, #15803d)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Aktif
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivateConfig(c.id)}
                          disabled={isSaving}
                          className="cluv-btn is-sm"
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
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--cluv-text-muted)' }}>
                    Belum ada konfigurasi model.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Tambah / Ganti Konfigurasi */}
      <div className="admin-models-card" style={{ marginBottom: 0 }}>
        <div className="admin-models-card-header">
          <Plus size={18} color="var(--cluv-text-muted)" />
          <h2 className="admin-models-card-title">
            Tambah / Perbarui Konfigurasi Model
          </h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--cluv-text-muted)', margin: '0 0 20px 0' }}>
          Mengaktifkan konfigurasi baru akan otomatis menonaktifkan konfigurasi model lama pada fitur yang sama.
        </p>

        <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="admin-grid-2col">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--cluv-text-main)', marginBottom: 6 }}>
                Target Fitur AI <span style={{ color: 'var(--cluv-danger, #ef4444)' }}>*</span>
              </label>
              <select
                value={selectedFeatureId}
                onChange={(e) => setSelectedFeatureId(e.target.value)}
                className="cluv-input"
                style={{ width: '100%' }}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--cluv-text-main)', marginBottom: 6 }}>
                AI Provider <span style={{ color: 'var(--cluv-danger, #ef4444)' }}>*</span>
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as any)}
                className="cluv-input"
                style={{ width: '100%' }}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--cluv-text-main)', marginBottom: 6 }}>
                Nama Model AI <span style={{ color: 'var(--cluv-danger, #ef4444)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: llama-3.3-70b-versatile atau gemini-2.5-flash"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="cluv-input"
                style={{ width: '100%' }}
                required
              />

              {/* Rekomendasi Model Cepat */}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cluv-text-muted)', display: 'block', marginBottom: 4 }}>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--cluv-text-main)', marginBottom: 6 }}>
                Nama Rujukan Secret Vault <span style={{ color: 'var(--cluv-danger, #ef4444)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: groq_api_key atau gemini_api_key"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                className="cluv-input"
                style={{ width: '100%' }}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--cluv-text-muted)', marginTop: 4, display: 'block' }}>
                Nama kunci identitas secret di Supabase Vault.
              </span>
            </div>
          </div>

          {provider === 'google' && (
            <div className="admin-models-thinking-box">
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--cluv-teal-800, #166534)', marginBottom: 4 }}>
                Thinking Budget (Gemini Reasoning)
              </label>
              <select
                value={thinkingBudget}
                onChange={(e) => setThinkingBudget(e.target.value)}
                className="cluv-input"
                style={{ width: '100%' }}
              >
                <option value="">Default Gemini (Reasoning Bawaan AI — Rekomendasi untuk Face Analysis & Diagnosa)</option>
                <option value="0">0 — Matikan Reasoning (Ultra Cepat ~3-9s — Rekomendasi untuk Ingredient Scan / OCR)</option>
                <option value="512">512 Tokens (Reasoning Singkat)</option>
                <option value="1024">1024 Tokens (Reasoning Sedang)</option>
                <option value="2048">2048 Tokens (Reasoning Mendalam)</option>
              </select>
              <span style={{ fontSize: 11, color: 'var(--cluv-teal-700, #15803d)', marginTop: 6, display: 'block' }}>
                Tersimpan langsung di <code>model_configs.parameters</code> per-fitur tanpa hardcode di kode server.
              </span>
            </div>
          )}

          <div className="admin-models-vault-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ShieldCheck size={16} color="var(--cluv-teal)" />
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cluv-text-main)' }}>
                Nilai API Key Mentah (Opsional):
              </label>
            </div>
            <input
              type="password"
              placeholder="Masukkan API key baru di sini jika ingin membuat/memperbarui isi secret..."
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              className="cluv-input"
              style={{ width: '100%' }}
              autoComplete="new-password"
            />
            <p style={{ fontSize: 12, color: 'var(--cluv-text-muted)', margin: '6px 0 0 0' }}>
              Kosongkan jika secret dengan nama di atas sudah pernah disimpan di Vault sebelumnya dan Anda hanya ingin mengganti nama model. Nilai key tidak pernah disimpan di database biasa, melainkan langsung dienkripsi ke Supabase Vault.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isSaving || isTestingForm}
              className="cluv-btn is-primary"
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
              className="cluv-btn is-outline"
              title="Coba koneksi langsung ke provider AI dengan key di Vault / key yang sedang diketik"
            >
              <Zap size={15} color="#f59e0b" />
              {isTestingForm ? 'Sedang Menguji...' : 'Uji Koneksi Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
