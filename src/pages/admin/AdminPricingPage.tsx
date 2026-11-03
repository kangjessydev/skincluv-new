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
import '@/styles/admin-pricing.css'

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
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            Komersial & Akses Kuota
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Paket Langganan, Promo & Kuota AI
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Kelola harga tagih riil Tripay, harga coret promosi, badge promo, dan batas kuota universal per paket (RFC 015 & Invarian 1, 2, 18).
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan Data</span>
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

      {/* Section 1: Dynamic Subscription Tiers & Promo Engine */}
      <div className="cluv-card admin-pricing-card">
        <div className="admin-pricing-card-header">
          <div className="cluv-card-icon-wrap is-teal">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="admin-pricing-card-title">
              Daftar Paket Langganan & Pengaturan Promo
            </h2>
            <p className="admin-pricing-card-desc">
              Nilai pada kolom <strong>Harga Tagih</strong> adalah nominal riil yang ditagihkan Tripay (Invarian 18). Kolom <strong>Harga Normal Coret</strong> digunakan untuk menghitung persentase diskon hemat secara otomatis di UI pengguna.
            </p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Nama Paket</th>
                <th style={{ width: 130 }}>Slug</th>
                <th style={{ width: 150 }}>Harga Tagih (Tripay)</th>
                <th style={{ width: 150 }}>Harga Normal Coret</th>
                <th style={{ textAlign: 'center', width: 90 }}>Diskon UI</th>
                <th style={{ width: 160 }}>Badge Promosi</th>
                <th style={{ textAlign: 'center', width: 80 }}>Popular</th>
                <th style={{ textAlign: 'center', width: 120 }}>Fitur Bullets</th>
                <th style={{ textAlign: 'center', width: 110 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => {
                const orig = t.original_price_idr || 0
                const cur = t.price_idr || 0
                const hasDiscount = orig > cur && cur > 0
                const discountPct = hasDiscount ? Math.round(((orig - cur) / orig) * 100) : 0

                return (
                  <tr key={t.id} className="admin-table-row">
                    {/* Nama Tier */}
                    <td>
                      <input
                        className="admin-pricing-input"
                        defaultValue={t.name}
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (val && val !== t.name) handleTierUpdate(t, { name: val })
                        }}
                        style={{ width: '100%', minWidth: 120, fontWeight: 700 }}
                      />
                    </td>

                    {/* Slug */}
                    <td>
                      <code className="admin-pricing-code">
                        {t.slug}
                      </code>
                    </td>

                    {/* Harga Tagih Aktual */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="admin-pricing-curr">Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          defaultValue={t.price_idr}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (!isNaN(val) && val !== t.price_idr) handleTierUpdate(t, { price_idr: val })
                          }}
                          className="admin-pricing-input is-number"
                          style={{ width: 100 }}
                        />
                      </div>
                    </td>

                    {/* Harga Normal Coret */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="admin-pricing-curr">Rp</span>
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
                          className="admin-pricing-input is-number"
                          style={{ width: 100, color: 'var(--cluv-neutral-500)' }}
                        />
                      </div>
                    </td>

                    {/* Diskon Persen Preview */}
                    <td style={{ textAlign: 'center' }}>
                      {hasDiscount ? (
                        <span className="cluv-badge is-rose is-sm">
                          -{discountPct}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--cluv-neutral-400)', fontSize: 13 }}>-</span>
                      )}
                    </td>

                    {/* Promo Badge */}
                    <td>
                      <input
                        className="admin-pricing-input"
                        defaultValue={t.promo_badge || ''}
                        placeholder="Contoh: Ramah Kantong"
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (val !== (t.promo_badge || '')) {
                            handleTierUpdate(t, { promo_badge: val || null })
                          }
                        }}
                        style={{ width: '100%', minWidth: 130, fontSize: 12 }}
                      />
                    </td>

                    {/* Is Popular */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={t.is_popular || false}
                        onChange={(e) => handleTierUpdate(t, { is_popular: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--cluv-teal)' }}
                        title="Tandai sebagai Rekomendasi Utama"
                      />
                    </td>

                    {/* Kelola Fitur Bullet */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenBulletModal(t)}
                        className="cluv-btn is-outline is-sm"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        <Tag size={13} />
                        <span>{t.features_list?.length || 0} Poin</span>
                      </button>
                    </td>

                    {/* Status Aktif */}
                    <td style={{ textAlign: 'center' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={t.is_active}
                          onChange={(e) => handleTierUpdate(t, { is_active: e.target.checked })}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--cluv-teal)' }}
                        />
                        <span className={`cluv-badge ${t.is_active ? 'is-teal' : 'is-neutral'} is-sm`}>
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
      <div className="cluv-card admin-pricing-card">
        <div className="admin-pricing-card-header">
          <div className="cluv-card-icon-wrap is-gold">
            <Coins size={18} />
          </div>
          <div>
            <h2 className="admin-pricing-card-title">
              Biaya Kredit Fitur AI (Pay-per-Use)
            </h2>
            <p className="admin-pricing-card-desc">
              Tentukan berapa Credits yang dipotong saat pengguna Free (atau subscriber yang kuota universal-nya habis) mengakses fitur AI. Perubahan langsung aktif seketika di seluruh aplikasi.
            </p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Nama Fitur</th>
                <th style={{ width: 180 }}>Identifier (Slug)</th>
                <th>Biaya Penggunaan</th>
                <th style={{ textAlign: 'center', width: 120 }}>Status Fitur</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} className="admin-table-row">
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>{f.name}</span>
                  </td>
                  <td>
                    <code className="admin-pricing-code">
                      {f.slug}
                    </code>
                  </td>
                  <td>
                    {(() => {
                      const isInvariantLocked = f.slug === 'face_validation' || f.slug === 'universal_ai'
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
                            className={`admin-pricing-input is-number ${isInvariantLocked ? 'is-locked' : ''}`}
                            style={{ width: 80, textAlign: 'center' }}
                          />
                          {f.slug === 'face_validation' ? (
                            <span className="cluv-badge is-teal is-sm">
                              0 Credits (Invarian 2: Gatekeeper Gratis)
                            </span>
                          ) : f.slug === 'universal_ai' ? (
                            <span className="cluv-badge is-gold is-sm">
                              Invarian 1: Universal Quota Anchor
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cluv-gold)' }}>
                              Credits / panggil
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`cluv-badge ${f.is_active !== false ? 'is-teal' : 'is-rose'} is-sm`}
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
      <div className="cluv-card admin-pricing-card">
        <div className="admin-pricing-card-header">
          <div className="cluv-card-icon-wrap is-teal">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="admin-pricing-card-title">
              Matriks Kuota Bulanan (Batas Panggilan AI / Bulan)
            </h2>
            <p className="admin-pricing-card-desc">
              Ubah angka kuota bulanan per fitur lalu klik di luar input (blur) untuk menyimpan perubahan otomatis ke database.
            </p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Fitur AI</th>
                {tiers.map((t) => (
                  <th key={t.id} className="admin-matrix-tier-head">
                    <span className="admin-matrix-tier-name">{t.name}</span>
                    <span className="admin-matrix-tier-price">
                      {t.price_idr === 0 ? 'Gratis' : `Rp ${t.price_idr.toLocaleString('id-ID')}`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} className="admin-table-row">
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>{f.name}</div>
                    <code style={{ fontSize: 11, color: 'var(--cluv-neutral-500)', fontFamily: 'var(--cluv-font-mono, monospace)' }}>
                      {f.slug}
                    </code>
                  </td>
                  {tiers.map((t) => {
                    const q = quotaMap[`${t.id}_${f.id}`]
                    const currentVal = q?.monthly_limit ?? 0
                    return (
                      <td key={t.id} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                            className="admin-pricing-input is-number"
                            style={{ width: 75, textAlign: 'center' }}
                          />
                          <span style={{ fontSize: 11, color: 'var(--cluv-neutral-400)', fontWeight: 600 }}>req</span>
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
          className="cluv-modal-overlay"
          onClick={() => !isSavingBullets && setEditingFeaturesTier(null)}
        >
          <div
            className="cluv-modal-box is-md"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cluv-modal-header">
              <div>
                <h3 className="cluv-modal-title">
                  Poin Keuntungan: {editingFeaturesTier.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--cluv-neutral-500)' }}>
                  Daftar bullet point ini akan langsung muncul pada card paket di halaman Toko Langganan pengguna.
                </p>
              </div>
              <button
                type="button"
                className="cluv-modal-close"
                onClick={() => setEditingFeaturesTier(null)}
                disabled={isSavingBullets}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cluv-modal-body" style={{ padding: '20px 24px' }}>
              {/* List Poin */}
              <div className="admin-bullet-list">
                {tierBulletPoints.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--cluv-neutral-400)', fontStyle: 'italic', margin: '8px 0' }}>
                    Belum ada poin keuntungan. Tambahkan di bawah.
                  </p>
                ) : (
                  tierBulletPoints.map((item, idx) => (
                    <div key={idx} className="admin-bullet-item">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx)}
                        className="admin-bullet-del-btn"
                        title="Hapus poin ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Tambah Poin Baru */}
              <div className="admin-bullet-input-wrap">
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
                  className="admin-pricing-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="cluv-btn is-primary is-sm"
                >
                  <Plus size={15} />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                borderTop: '1px solid var(--cluv-border)',
                background: 'var(--cluv-neutral-50)',
              }}
            >
              <button
                type="button"
                onClick={() => setEditingFeaturesTier(null)}
                disabled={isSavingBullets}
                className="cluv-btn is-outline is-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBulletPoints}
                disabled={isSavingBullets}
                className="cluv-btn is-primary is-sm"
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
