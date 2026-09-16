import { useEffect, useState, useCallback } from 'react'
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Tier {
  id: string
  slug: string
  name: string
  price_idr: number
  is_active: boolean
}

interface Feature {
  id: string
  slug: string
  name: string
}

interface QuotaConfig {
  id: string
  tier_id: string
  feature_id: string
  monthly_limit: number
}

export default function AdminPricingPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [quotaMap, setQuotaMap] = useState<Record<string, QuotaConfig>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [tiersRes, featuresRes, quotaRes] = await Promise.all([
        supabase.from('subscription_tiers').select('*').order('price_idr'),
        supabase.from('ai_features').select('id, slug, name').order('slug'),
        supabase.from('quota_configs').select('*'),
      ])

      if (tiersRes.error) throw tiersRes.error
      if (featuresRes.error) throw featuresRes.error
      if (quotaRes.error) throw quotaRes.error

      setTiers((tiersRes.data ?? []) as Tier[])
      setFeatures((featuresRes.data ?? []) as Feature[])

      const map: Record<string, QuotaConfig> = {}
      for (const q of (quotaRes.data ?? []) as QuotaConfig[]) {
        map[`${q.tier_id}_${q.feature_id}`] = q
      }
      setQuotaMap(map)
    } catch (err: any) {
      console.error('[AdminPricing] Error loading data:', err)
      setFeedback({ type: 'error', message: `Gagal memuat paket & kuota: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleTierUpdate(
    tier: Tier,
    updates: { name?: string; price_idr?: number; is_active?: boolean }
  ) {
    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .update(updates)
        .eq('id', tier.id)

      if (error) throw error

      setFeedback({ type: 'success', message: `Tier ${tier.name} berhasil diperbarui.` })
      await loadData()
    } catch (err: any) {
      console.error('[AdminPricing] Gagal update tier:', err)
      setFeedback({ type: 'error', message: `Gagal update tier: ${err.message}` })
    }
  }

  async function handleQuotaChange(tierId: string, featureId: string, newLimit: number) {
    const key = `${tierId}_${featureId}`
    const existing = quotaMap[key]

    try {
      const { error } = existing
        ? await supabase
            .from('quota_configs')
            .update({ monthly_limit: newLimit })
            .eq('id', existing.id)
        : await supabase
            .from('quota_configs')
            .insert({ tier_id: tierId, feature_id: featureId, monthly_limit: newLimit })

      if (error) throw error

      setFeedback({ type: 'success', message: 'Batas kuota bulanan berhasil disimpan.' })
      await loadData()
    } catch (err: any) {
      console.error('[AdminPricing] Gagal update kuota:', err)
      setFeedback({ type: 'error', message: `Gagal update kuota: ${err.message}` })
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Paket Langganan & Kuota AI
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Atur harga tier membership dan batas kuota bulanan untuk masing-masing fitur AI per paket.
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

      {/* Tabel Tier Langganan */}
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
          <CreditCard size={18} color="#4b5563" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Daftar Tier Langganan
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Nama Tier</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Slug</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Harga (IDR)</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status Aktif</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>
                    <input
                      defaultValue={t.name}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val && val !== t.name) handleTierUpdate(t, { name: val })
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                        fontWeight: 600,
                        width: '90%',
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                      {t.slug}
                    </code>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>Rp</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={t.price_idr}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val !== t.price_idr) handleTierUpdate(t, { price_idr: val })
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          fontSize: 13,
                          width: 140,
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={t.is_active}
                        onChange={(e) => handleTierUpdate(t, { is_active: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.is_active ? '#15803d' : '#9ca3af' }}>
                        {t.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriks Kuota Bulanan per Tier x Fitur */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Layers size={18} color="#4b5563" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Matriks Kuota Bulanan (Batas Panggilan AI / Bulan)
          </h2>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px 0' }}>
          Ubah angka kuota bulanan per fitur lalu klik di luar input (blur) untuk menyimpan perubahan otomatis.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600, color: '#374151', width: 220 }}>
                  Fitur AI
                </th>
                {tiers.map((t) => (
                  <th key={t.id} style={{ textAlign: 'center', padding: '12px', fontWeight: 600, color: '#374151' }}>
                    {t.name}
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6b7280' }}>
                      {t.price_idr === 0 ? 'Gratis' : `Rp ${t.price_idr.toLocaleString('id-ID')}`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{f.name}</div>
                    <code style={{ fontSize: 11, color: '#6b7280' }}>{f.slug}</code>
                  </td>
                  {tiers.map((t) => {
                    const q = quotaMap[`${t.id}_${f.id}`]
                    const currentVal = q?.monthly_limit ?? 0
                    return (
                      <td key={t.id} style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            min={0}
                            defaultValue={currentVal}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10)
                              if (!isNaN(val) && val !== currentVal) {
                                handleQuotaChange(t.id, f.id, val)
                              }
                            }}
                            style={{
                              width: 80,
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '1px solid #d1d5db',
                              textAlign: 'center',
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          />
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>req</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
