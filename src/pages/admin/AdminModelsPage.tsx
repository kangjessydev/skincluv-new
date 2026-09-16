import { useEffect, useState, useCallback } from 'react'
import { Cpu, CheckCircle2, AlertCircle, ShieldCheck, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AiFeature {
  id: string
  slug: string
  name: string
}

interface ModelConfig {
  id: string
  feature_id: string
  provider: 'google' | 'anthropic' | 'openai'
  model_name: string
  api_key_secret: string
  is_active: boolean
  created_at: string
}

export default function AdminModelsPage() {
  const [features, setFeatures] = useState<AiFeature[]>([])
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('')
  const [provider, setProvider] = useState<'google' | 'anthropic' | 'openai'>('google')
  const [modelName, setModelName] = useState('gemini-2.5-flash')
  const [secretName, setSecretName] = useState('')
  const [secretValue, setSecretValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
  function handleProviderChange(newProvider: 'google' | 'anthropic' | 'openai') {
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
      }
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
      const { error: insertErr } = await supabase.from('model_configs').insert({
        feature_id: selectedFeatureId,
        provider,
        model_name: modelName.trim(),
        api_key_secret: secretName.trim(),
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
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
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
            Konfigurasi Model Aktif
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
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => {
                const feature = features.find((f) => f.id === c.feature_id)
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
                          background:
                            c.provider === 'google'
                              ? '#e0e7ff'
                              : c.provider === 'anthropic'
                              ? '#ffedd5'
                              : '#dcfce7',
                          color:
                            c.provider === 'google'
                              ? '#3730a3'
                              : c.provider === 'anthropic'
                              ? '#9a3412'
                              : '#166534',
                        }}
                      >
                        {c.provider}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {c.model_name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                        {c.api_key_secret}
                      </code>
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
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>Nonaktif</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {configs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <option value="google">Google (Gemini)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Nama Model AI <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: gemini-2.5-flash atau gpt-4o"
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
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Nama Rujukan Secret Vault <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: gemini_api_key"
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

          <div>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: isSaving ? '#9ca3af' : '#111827',
                color: '#ffffff',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {isSaving ? 'Menyimpan & Menulis ke Vault...' : 'Simpan & Aktifkan Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
