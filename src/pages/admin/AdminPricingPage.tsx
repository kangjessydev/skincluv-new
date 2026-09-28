import { useEffect, useState, useCallback } from 'react'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Coins,
  Plus,
  Trash2,
  X,
  Tag,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface Tier {
  id: string
  slug: string
  name: string
  price_idr: number
  original_price_idr?: number | null
  features_list?: string[] | null
  promo_badge?: string | null
  is_popular?: boolean
  is_active: boolean
}

interface Feature {
  id: string
  slug: string
  name: string
  credit_cost?: number
  is_active?: boolean
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

  // Modal State untuk Edit Bullet Point Fitur Paket
  const [editingFeaturesTier, setEditingFeaturesTier] = useState<Tier | null>(null)
  const [tierBulletPoints, setTierBulletPoints] = useState<string[]>([])
  const [newBulletText, setNewBulletText] = useState('')
  const [isSavingBullets, setIsSavingBullets] = useState(false)

  // Auto-dismiss floating toast feedback
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3500)
    return () => clearTimeout(timer)
  }, [feedback])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [tiersRes, featuresRes, quotaRes] = await Promise.all([
        supabase.from('subscription_tiers').select('*').order('price_idr', { ascending: true }),
        supabase.from('ai_features').select('id, slug, name, credit_cost, is_active').order('slug'),
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
    updates: Partial<Tier>
  ) {
    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .update(updates)
        .eq('id', tier.id)

      if (error) throw error

      setFeedback({ type: 'success', message: `Paket ${tier.name} berhasil diperbarui.` })
      await loadData()
    } catch (err: any) {
      console.error('[AdminPricing] Gagal update tier:', err)
      setFeedback({ type: 'error', message: `Gagal update tier: ${err.message}` })
    }
  }

  const handleOpenBulletModal = (tier: Tier) => {
    setEditingFeaturesTier(tier)
    setTierBulletPoints(tier.features_list ? [...tier.features_list] : [])
    setNewBulletText('')
  }

  const handleAddBullet = () => {
    const text = newBulletText.trim()
    if (!text) return
    setTierBulletPoints((prev) => [...prev, text])
    setNewBulletText('')
  }

  const handleRemoveBullet = (index: number) => {
    setTierBulletPoints((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSaveBulletPoints = async () => {
    if (!editingFeaturesTier) return
    setIsSavingBullets(true)
    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .update({ features_list: tierBulletPoints })
        .eq('id', editingFeaturesTier.id)

      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Daftar bullet point fitur untuk ${editingFeaturesTier.name} berhasil disimpan.`,
      })
      setEditingFeaturesTier(null)
      await loadData()
    } catch (err: any) {
      console.error('[AdminPricing] Gagal update bullet points:', err)
      setFeedback({ type: 'error', message: `Gagal menyimpan bullet point: ${err.message}` })
    } finally {
      setIsSavingBullets(false)
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

  async function handleCreditCostUpdate(feature: Feature, newCost: number) {
    if (feature.slug === 'face_validation' || feature.slug === 'universal_ai') {
      setFeedback({
        type: 'error',
        message: `Fitur ${feature.name} (${feature.slug}) adalah invariant sistem yang terkunci (Invarian 1 & 2) dan tidak dapat diubah.`,
      })
      return
    }
    if (newCost < 0) return
    try {
      const { error } = await supabase
        .from('ai_features')
        .update({ credit_cost: newCost })
        .eq('id', feature.id)

      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Biaya kredit untuk ${feature.name} berhasil diubah menjadi ${newCost} Credits.`,
      })
      await loadData()
    } catch (err: any) {
      console.error('[AdminPricing] Gagal update credit cost:', err)
      setFeedback({ type: 'error', message: `Gagal update biaya kredit: ${err.message}` })
    }
  }

  return (
    <div className="admin-page-container" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Paket Langganan, Promo & Kuota AI
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Kelola harga tagih, harga coret promosi, badge promo, dan batas kuota universal per paket (RFC 015 Tahap 4).
          </p>
        </div>

        <button
          onClick={loadData}
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
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan Data
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

      {/* Section 1: Dynamic Subscription Tiers & Promo Engine */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CreditCard size={18} color="#4b5563" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Daftar Paket Langganan & Pengaturan Promo
          </h2>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px 0' }}>
          Nilai pada kolom <strong>Harga Tagih</strong> adalah nominal riil yang ditagihkan Tripay (Invarian 18). Kolom <strong>Harga Normal Coret</strong> digunakan untuk menghitung persentase diskon hemat secara otomatis di UI pengguna.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Nama Paket</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Slug</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Harga Tagih (Tripay)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Harga Normal Coret</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Diskon UI</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Badge Promosi</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Popular</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Fitur Bullets</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => {
                const orig = t.original_price_idr || 0
                const cur = t.price_idr || 0
                const hasDiscount = orig > cur && cur > 0
                const discountPct = hasDiscount ? Math.round(((orig - cur) / orig) * 100) : 0

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {/* Nama Tier */}
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
                          width: 130,
                        }}
                      />
                    </td>

                    {/* Slug */}
                    <td style={{ padding: '12px' }}>
                      <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                        {t.slug}
                      </code>
                    </td>

                    {/* Harga Tagih Aktual */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                            fontWeight: 700,
                            color: '#111827',
                            width: 100,
                          }}
                        />
                      </div>
                    </td>

                    {/* Harga Normal Coret */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          defaultValue={t.original_price_idr ?? 0}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (!isNaN(val) && val !== (t.original_price_idr ?? 0)) {
                              handleTierUpdate(t, { original_price_idr: val })
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            fontSize: 13,
                            color: '#6b7280',
                            width: 100,
                          }}
                        />
                      </div>
                    </td>

                    {/* Diskon Persen Preview */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {hasDiscount ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: '#fee2e2',
                            color: '#dc2626',
                          }}
                        >
                          -{discountPct}%
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                      )}
                    </td>

                    {/* Promo Badge */}
                    <td style={{ padding: '12px' }}>
                      <input
                        defaultValue={t.promo_badge || ''}
                        placeholder="Contoh: Ramah Kantong"
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (val !== (t.promo_badge || '')) {
                            handleTierUpdate(t, { promo_badge: val || null })
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          fontSize: 12,
                          width: 140,
                        }}
                      />
                    </td>

                    {/* Is Popular */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={t.is_popular || false}
                        onChange={(e) => handleTierUpdate(t, { is_popular: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                        title="Tandai sebagai Rekomendasi Utama"
                      />
                    </td>

                    {/* Kelola Fitur Bullet */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenBulletModal(t)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Tag size={13} />
                        {t.features_list?.length || 0} Poin
                      </button>
                    </td>

                    {/* Status Aktif */}
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Biaya Kredit Fitur AI (Pay-per-Use) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Coins size={18} color="#d97706" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Biaya Kredit Fitur AI (Pay-per-Use)
          </h2>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px 0' }}>
          Tentukan berapa Credits yang dipotong saat pengguna Free (atau pengguna berbayar yang kuotanya habis) mengakses fitur AI. Perubahan langsung aktif seketika di seluruh aplikasi.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Nama Fitur</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Identifier (Slug)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Biaya Penggunaan</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status Fitur</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{f.name}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                      {f.slug}
                    </code>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {(() => {
                      const isInvariantLocked = f.slug === 'face_validation' || f.slug === 'universal_ai'
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={isInvariantLocked}
                            defaultValue={f.credit_cost ?? (f.slug === 'face_validation' ? 0 : 1)}
                            onBlur={(e) => {
                              if (isInvariantLocked) return
                              const val = parseInt(e.target.value, 10)
                              if (!isNaN(val) && val !== f.credit_cost) {
                                handleCreditCostUpdate(f, val)
                              }
                            }}
                            style={{
                              width: 80,
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: isInvariantLocked ? '1px dashed #94a3b8' : '1px solid #d1d5db',
                              fontSize: 13,
                              fontWeight: 700,
                              color: isInvariantLocked ? '#64748b' : '#b45309',
                              textAlign: 'center',
                              background: isInvariantLocked ? '#f1f5f9' : '#fffbeb',
                              cursor: isInvariantLocked ? 'not-allowed' : 'text',
                            }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 600, color: isInvariantLocked ? '#64748b' : '#92400e' }}>
                            {f.slug === 'face_validation'
                              ? '0 Credits (Invarian 2: Gatekeeper Gratis)'
                              : f.slug === 'universal_ai'
                              ? 'Invarian 1: Universal Quota Anchor'
                              : 'Credits / panggil'}
                          </span>
                        </div>
                      )
                    })()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: f.is_active !== false ? '#dcfce7' : '#fee2e2',
                        color: f.is_active !== false ? '#15803d' : '#991b1b',
                      }}
                    >
                      {f.is_active !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Matriks Kuota Bulanan per Tier x Fitur */}
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

      {/* Modal: Kelola Poin Keuntungan Paket (features_list) */}
      {editingFeaturesTier && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 16,
          }}
          onClick={() => !isSavingBullets && setEditingFeaturesTier(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 600,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Poin Keuntungan: {editingFeaturesTier.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                  Daftar bullet point ini akan langsung muncul pada card paket di halaman Toko Langganan pengguna.
                </p>
              </div>
              <button
                onClick={() => setEditingFeaturesTier(null)}
                disabled={isSavingBullets}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* List Poin */}
            <div
              style={{
                maxHeight: 280,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 16,
                padding: '4px 0',
              }}
            >
              {tierBulletPoints.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                  Belum ada poin keuntungan. Tambahkan di bawah.
                </p>
              ) : (
                tierBulletPoints.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: '#1e293b' }}>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: 4,
                      }}
                      title="Hapus poin ini"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Tambah Poin Baru */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                type="text"
                value={newBulletText}
                onChange={(e) => setNewBulletText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddBullet()
                  }
                }}
                placeholder="Tambah poin keuntungan baru..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={handleAddBullet}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Tambah
              </button>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditingFeaturesTier(null)}
                disabled={isSavingBullets}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBulletPoints}
                disabled={isSavingBullets}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isSavingBullets ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
