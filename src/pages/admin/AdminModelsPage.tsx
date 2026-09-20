import { useEffect, useState, useCallback } from 'react'
import { Cpu, CheckCircle2, AlertCircle, ShieldCheck, Plus, RefreshCw, Zap, X, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    <div className="admin-page-container" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Model & API Key
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Atur AI Provider, nama model, dan API Key per fitur. API Key disimpan terenkripsi di Supabase Vault.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
        </button>
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
      {/* Test Connection Result Banner */}
      {testResult && (
        <div
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 10,
            border: testResult.success ? '1px solid #86efac' : '1px solid #fca5a5',
            background: testResult.success ? '#f0fdf4' : '#fef2f2',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => setTestResult(null)}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
            }}
            title="Tutup notifikasi"
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {testResult.success ? (
              <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: testResult.success ? '#15803d' : '#b91c1c',
                  }}
                >
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
                      fontSize: 12,
                      fontWeight: 600,
                      background: testResult.latency_ms < 600 ? '#bbf7d0' : '#fed7aa',
                      color: testResult.latency_ms < 600 ? '#166534' : '#9a3412',
                    }}
                  >
                    <Clock size={12} /> {testResult.latency_ms} ms
                  </span>
                )}
                {testResult.tokens_used !== undefined && (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      background: '#f3f4f6',
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
                  <p style={{ fontSize: 13, color: '#166534', margin: '0 0 6px 0' }}>
                    Model <strong>{testResult.model_name}</strong> via{' '}
                    <strong>{testResult.provider?.toUpperCase()}</strong> merespons dengan sukses:
                  </p>
                  <blockquote
                    style={{
                      margin: 0,
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: 6,
                      borderLeft: '3px solid #22c55e',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: '#1f2937',
                    }}
                  >
                    "{testResult.output}"
                  </blockquote>
                </div>
              ) : (
                <div style={{ marginTop: 6, fontSize: 13, color: '#991b1b' }}>
                  <p style={{ margin: 0 }}>{testResult.error}</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#6b7280' }}>
                    Tips: Pastikan nama model valid di provider tersebut dan API key di Supabase Vault atau form masih aktif.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabel Konfigurasi Saat Ini */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Cpu size={18} color="#4b5563" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Konfigurasi Model Aktif & Tersimpan
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Fitur</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Provider</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Nama Model</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Rujukan Secret Vault</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Uji Coba</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => {
                const feature = features.find((f) => f.id === c.feature_id)
                const isTestingThis = testingConfigId === c.id

                const badgeColors =
                  c.provider === 'google'
                    ? { bg: '#e0e7ff', color: '#3730a3' }
                    : c.provider === 'anthropic'
                    ? { bg: '#ffedd5', color: '#9a3412' }
                    : c.provider === 'groq'
                    ? { bg: '#fef3c7', color: '#b45309' }
                    : { bg: '#dcfce7', color: '#166534' }

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: c.is_active ? '#ffffff' : '#fafafa',
                      color: c.is_active ? '#111827' : '#9ca3af',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      {feature?.name ?? c.feature_id}
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6b7280' }}>
                        {feature?.slug}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: badgeColors.bg,
                          color: badgeColors.color,
                        }}
                      >
                        {c.provider}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>
                        {c.model_name}
                      </div>
                      {c.provider === 'google' && (
                        <div style={{ marginTop: 4 }}>
                          {c.parameters?.thinking_budget === 0 ? (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                              ⚡ Thinking: 0 (Fast OCR)
                            </span>
                          ) : c.parameters?.thinking_budget !== undefined ? (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                              🧠 Thinking: {c.parameters.thinking_budget}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                              🧠 Default Reasoning
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                        {c.api_key_secret}
                      </code>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
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
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: isTestingThis ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Tes koneksi live model menggunakan secret di Vault"
                      >
                        <Zap size={13} color={isTestingThis ? '#9ca3af' : '#f59e0b'} />
                        {isTestingThis ? 'Menguji...' : 'Tes Koneksi'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {c.is_active ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            background: '#dcfce7',
                            color: '#15803d',
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
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#1f2937',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
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
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                    Belum ada konfigurasi model.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Tambah / Ganti Konfigurasi */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Plus size={18} color="#4b5563" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Tambah / Perbarui Konfigurasi Model
          </h2>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px 0' }}>
          Mengaktifkan konfigurasi baru akan otomatis menonaktifkan konfigurasi model lama pada fitur yang sama.
        </p>

        <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="admin-grid-2col">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Target Fitur AI <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedFeatureId}
                onChange={(e) => setSelectedFeatureId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  background: '#ffffff',
                }}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                AI Provider <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  background: '#ffffff',
                }}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Nama Model AI <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: llama-3.3-70b-versatile atau gemini-2.5-flash"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                required
              />

              {/* Rekomendasi Model Cepat */}
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                  Pilihan Rekomendasi {provider.toUpperCase()}:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {RECOMMENDED_MODELS[provider]?.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setModelName(m.name)}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: modelName === m.name ? '1px solid #2563eb' : '1px solid #e5e7eb',
                        background: modelName === m.name ? '#eff6ff' : '#f9fafb',
                        color: modelName === m.name ? '#1d4ed8' : '#4b5563',
                        cursor: 'pointer',
                        fontWeight: modelName === m.name ? 600 : 400,
                      }}
                      title={m.desc}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Nama Rujukan Secret Vault <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: groq_api_key atau gemini_api_key"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                required
              />
              <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4, display: 'block' }}>
                Nama kunci identitas secret di Supabase Vault.
              </span>
            </div>
          </div>

          {provider === 'google' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 4 }}>
                Thinking Budget (Gemini Reasoning)
              </label>
              <select
                value={thinkingBudget}
                onChange={(e) => setThinkingBudget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #86efac',
                  fontSize: 13,
                  background: '#ffffff',
                  color: '#1e293b',
                }}
              >
                <option value="">Default Gemini (Reasoning Bawaan AI — Rekomendasi untuk Face Analysis & Diagnosa)</option>
                <option value="0">0 — Matikan Reasoning (Ultra Cepat ~3-9s — Rekomendasi untuk Ingredient Scan / OCR)</option>
                <option value="512">512 Tokens (Reasoning Singkat)</option>
                <option value="1024">1024 Tokens (Reasoning Sedang)</option>
                <option value="2048">2048 Tokens (Reasoning Mendalam)</option>
              </select>
              <span style={{ fontSize: 11, color: '#15803d', marginTop: 6, display: 'block' }}>
                Tersimpan langsung di <code>model_configs.parameters</code> per-fitur tanpa hardcode di kode server.
              </span>
            </div>
          )}

          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ShieldCheck size={16} color="#059669" />
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                Nilai API Key Mentah (Opsional):
              </label>
            </div>
            <input
              type="password"
              placeholder="Masukkan API key baru di sini jika ingin membuat/memperbarui isi secret..."
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                boxSizing: 'border-box',
                background: '#ffffff',
              }}
              autoComplete="new-password"
            />
            <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0 0' }}>
              Kosongkan jika secret dengan nama di atas sudah pernah disimpan di Vault sebelumnya dan Anda hanya ingin mengganti nama model. Nilai key tidak pernah disimpan di database biasa, melainkan langsung dienkripsi ke Supabase Vault.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isSaving || isTestingForm}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: isSaving ? '#9ca3af' : '#111827',
                color: '#ffffff',
                cursor: isSaving || isTestingForm ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                cursor: isSaving || isTestingForm || !modelName.trim() || !secretName.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
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
