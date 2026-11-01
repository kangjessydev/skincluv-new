// src/pages/profile/ProfileSkinPage.tsx
// Sub-page Profil & Preferensi Kulit (RFC 020)
// Conforming to Invariant 19 (Non-Therapeutic Claim), Invariant 6 (Deterministic Ground Truth),
// and 100% styled with the Fresh Clinical Tech v0-profile-* design system.

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import {
  Activity, AlertCircle, ShieldCheck,
  Check, Save, Sparkles, X,
} from 'lucide-react'
import type { SkinProfile, SkinType } from '@/types/database'
import { Button, Badge } from '@/components/ui'

const SKIN_TYPES: { id: SkinType; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'dry', label: 'Kering (Dry)' },
  { id: 'oily', label: 'Berminyak (Oily)' },
  { id: 'combination', label: 'Kombinasi' },
  { id: 'sensitive', label: 'Sensitif' },
]

const SKIN_TYPE_DESCRIPTIONS: Record<SkinType, string> = {
  normal: 'Keseimbangan kelembapan alami, pori-pori halus, minim masalah.',
  dry: 'Cenderung kaku atau bersisik, membutuhkan hidrasi & lipid pelindung.',
  oily: 'Produksi sebum berlebih terutama di T-zone, rentan kilap & komedo.',
  combination: 'Berminyak di area T (dahi, hidung, dagu) dan normal/kering di pipi.',
  sensitive: 'Reaktif terhadap faktor lingkungan atau bahan keras, rentan kemerahan.',
}

const CONCERNS_LIST = [
  'Jerawat & Beruntusan',
  'Flek Hitam & Noda Bekas Jerawat',
  'Garis Halus & Penuaan Dini',
  'Komedo & Pori Tersumbat',
  'Kulit Kusam & Warna Tidak Rata',
  'Kemerahan & Skin Barrier Rusak',
  'Tekstur Kasar',
]

const SENSITIVITIES_LIST = [
  'Fragrance / Parfum Buatan',
  'Simple Alcohol (Alcohol Denat, Ethanol)',
  'Essential Oils (Minyak Atsiri)',
  'Sulfat Kuat (SLS / SLES)',
  'Paraben Preservatives',
]

export default function ProfileSkinPage() {
  // Atomic Zustand Selectors (Claude & DeepSeek RFC 020 recommendation)
  const user = useAuthStore((s) => s.user)
  const activeSkinProfile = useAuthStore((s) => s.activeSkinProfile)
  const setActiveSkinProfile = useAuthStore((s) => s.setActiveSkinProfile)

  const [skinType, setSkinType] = useState<SkinType>('normal')
  const [concerns, setConcerns] = useState<string[]>([])
  const [sensitivities, setSensitivities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false)

  // Populate from activeSkinProfile or fetch from DB
  useEffect(() => {
    let isMounted = true

    async function loadSkinProfile() {
      if (!user) {
        setFetching(false)
        return
      }

      if (activeSkinProfile) {
        setSkinType((activeSkinProfile.skin_type as SkinType) || 'normal')
        const rawConcerns: string[] = activeSkinProfile.skin_concerns || []
        const existingSensitivities = rawConcerns.filter((c: string) => SENSITIVITIES_LIST.includes(c))
        const regularConcerns = rawConcerns.filter((c: string) => !SENSITIVITIES_LIST.includes(c))
        setConcerns(regularConcerns)
        setSensitivities(existingSensitivities)
        setFetching(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('skin_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data && isMounted) {
          const profile = data as unknown as SkinProfile
          setActiveSkinProfile(profile)
          setSkinType((profile.skin_type as SkinType) || 'normal')
          
          const rawConcerns: string[] = profile.skin_concerns || []
          const existingSensitivities = rawConcerns.filter((c: string) => SENSITIVITIES_LIST.includes(c))
          const regularConcerns = rawConcerns.filter((c: string) => !SENSITIVITIES_LIST.includes(c))
          
          setConcerns(regularConcerns)
          setSensitivities(existingSensitivities)
        }
      } catch (err) {
        console.error('Error fetching skin profile:', err)
      } finally {
        if (isMounted) setFetching(false)
      }
    }

    loadSkinProfile()
    return () => {
      isMounted = false
    }
  }, [user, activeSkinProfile, setActiveSkinProfile])

  const handleToggleConcern = (concern: string) => {
    setConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    )
  }

  const handleToggleSensitivity = (item: string) => {
    setSensitivities((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    )
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)

    const allConcernsCombined = [...concerns, ...sensitivities]

    try {
      const { data: existing } = await supabase
        .from('skin_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      let result
      if (existing) {
        result = await supabase
          .from('skin_profiles')
          .update({ skin_type: skinType, skin_concerns: allConcernsCombined })
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('skin_profiles')
          .insert({
            user_id: user.id,
            skin_type: skinType,
            skin_concerns: allConcernsCombined,
            is_active: true,
          })
          .select()
          .single()
      }

      if (result.error) throw result.error

      if (result.data) {
        setActiveSkinProfile(result.data as unknown as SkinProfile)
      }

      try {
        await supabase.rpc('track_profile_completion')
      } catch {
        // non-blocking
      }

      setIsSuccess(true)
      setMessage('Profil kulit berhasil diperbarui! Rekomendasi Skinsistant AI akan otomatis menyesuaikan.')
      setTimeout(() => setMessage(null), 5000)
    } catch (err: any) {
      console.error('Error saving skin profile:', err)
      setIsSuccess(false)
      setMessage(err.message || 'Gagal menyimpan profil kulit. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">

      {/* Header (Desktop only; di mobile sudah terpampang di topbar) */}
      <div className="cluv-hide-mobile cluv-mb-6">
        <h1 className="cluv-title-section cluv-m-0">Profil &amp; Preferensi Kulit</h1>
        <p className="cluv-subtitle cluv-mt-1 cluv-m-0">
          Konfigurasikan tipe kulit dan bahan yang ingin kamu hindari untuk mempersonalisasi rekomendasi Skinsistant AI.
        </p>
      </div>

      <div className="cluv-skin-config-layout">
        {/* ── Left Column: Live Skin Passport Preview (Desktop Sticky) ── */}
        <div className="cluv-hide-mobile">
          <div className="cluv-skin-passport-card cluv-flex-col cluv-gap-4">
            <div className="cluv-skin-passport-header">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <div className="cluv-card-icon-wrap is-sm is-gold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="cluv-title-card cluv-m-0" style={{ fontSize: '0.875rem' }}>
                    Live Paspor Kulit
                  </h3>
                  <span className="cluv-micro cluv-text-muted">Preview Real-time</span>
                </div>
              </div>
              <Badge variant="teal" size="sm">
                Sinkron AI
              </Badge>
            </div>

            {/* 1. Tipe Kulit Aktif */}
            <div className="cluv-skin-passport-section">
              <span className="cluv-skin-passport-section-label">Tipe Kulit Utama</span>
              <div className="cluv-skin-passport-active-box">
                <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                  <span className="cluv-body cluv-font-bold cluv-text-teal">
                    {SKIN_TYPES.find((t) => t.id === skinType)?.label || skinType}
                  </span>
                  <span className="cluv-micro cluv-text-teal cluv-font-bold">Aktif</span>
                </div>
                <p className="cluv-micro cluv-text-muted cluv-mt-1 cluv-m-0" style={{ lineHeight: '1.4' }}>
                  {SKIN_TYPE_DESCRIPTIONS[skinType] || 'Kondisi kulit utama.'}
                </p>
              </div>
            </div>

            <div className="cluv-skin-passport-divider" />

            {/* 2. Target Perawatan */}
            <div className="cluv-skin-passport-section">
              <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                <span className="cluv-skin-passport-section-label">Target Perawatan</span>
                <span className="cluv-micro cluv-text-muted cluv-tabular-nums">{concerns.length} dipilih</span>
              </div>
              {concerns.length > 0 ? (
                <div className="cluv-skin-passport-tag-list">
                  {concerns.map((c) => (
                    <span key={c} className="cluv-skin-passport-chip is-teal">
                      <Check size={11} strokeWidth={3} />
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-italic">
                  Pilih target di formulir samping untuk memandu fokus perawatan.
                </p>
              )}
            </div>

            <div className="cluv-skin-passport-divider" />

            {/* 3. Bahan Dihindari */}
            <div className="cluv-skin-passport-section">
              <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                <span className="cluv-skin-passport-section-label">Bahan Dihindari</span>
                <span className="cluv-micro cluv-text-muted cluv-tabular-nums">{sensitivities.length} dipilih</span>
              </div>
              {sensitivities.length > 0 ? (
                <div className="cluv-skin-passport-tag-list">
                  {sensitivities.map((s) => (
                    <span key={s} className="cluv-skin-passport-chip is-rose">
                      <X size={11} strokeWidth={3} />
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-italic">
                  Tidak ada bahan sensitif yang dihindari.
                </p>
              )}
            </div>

            <div className="cluv-skin-passport-divider" />

            {/* Edukasi Klinis (Gambar 2: Dibungkus rapi, teks tidak overbold) */}
            <div className="cluv-skin-passport-note">
              <ShieldCheck size={16} className="cluv-text-teal cluv-flex-shrink-0 cluv-mt-0.5" />
              <p className="cluv-skin-passport-note-text">
                Data preferensi ini digunakan oleh mesin Skinsistant AI dan Formula Scan untuk memfilter bahan berbahaya bagi profil kulit Anda.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column: Formulir Utama (100% Mobile Parity) ── */}
        <div className="cluv-card is-mobile-flat cluv-flex-col cluv-gap-6">
        {/* Regulatory & Privacy Notice (Invarian 19 & UU PDP No. 27/2022) - Bisa ditutup */}
        {!isNoticeDismissed && (
          <div className="cluv-card-note is-dismissible">
            <ShieldCheck size={18} className="cluv-text-teal" />
            <div className="cluv-flex-col cluv-gap-1 cluv-flex-1">
              <h4 className="cluv-body cluv-font-bold cluv-text-teal cluv-m-0">Deklarasi Preferensi Konsumen Edukatif</h4>
              <p className="cluv-caption cluv-m-0">
                Data ini adalah preferensi mandiri Anda sebagai panduan analisis Skinsistant AI (bukan diagnosis klinis/resep medis). Anda berhak mengubahnya kapan saja.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNoticeDismissed(true)}
              className="cluv-card-note-close"
              aria-label="Tutup pemberitahuan"
              title="Tutup pemberitahuan"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {fetching ? (
          <div className="cluv-text-center cluv-py-8 cluv-flex-col cluv-items-center cluv-gap-2">
            <div className="cluv-spinner cluv-mb-2" />
            <p className="cluv-caption cluv-text-muted">Memuat preferensi kulit Anda...</p>
          </div>
        ) : (
          <>
            {/* Section 1: Tipe Kulit Utama (Single-select Radio Group) */}
            <div className="cluv-flex-col cluv-gap-2">
              <div className="cluv-section-mobile-header">
                <span className="cluv-section-mobile-title">Tipe Kulit Utama</span>
                <span className="cluv-section-mobile-hint">Pilih 1</span>
              </div>

              <div className="cluv-select-group">
                {SKIN_TYPES.map((t) => {
                  const isActive = skinType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`cluv-select-row ${isActive ? 'is-active' : ''}`}
                      onClick={() => setSkinType(t.id)}
                    >
                      <span className="cluv-select-row-label">{t.label}</span>
                      <div className="cluv-radio-indicator">
                        <div className="cluv-radio-dot" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 2: Target Perawatan (Multi-select Checkbox Group) */}
            <div className="cluv-flex-col cluv-gap-2">
              <div className="cluv-section-mobile-header">
                <span className="cluv-section-mobile-title">Target Perawatan &amp; Masalah Kulit</span>
                <span className="cluv-section-mobile-hint">Bisa pilih &gt; 1</span>
              </div>

              <div className="cluv-select-group">
                {CONCERNS_LIST.map((c) => {
                  const isActive = concerns.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`cluv-select-row ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleToggleConcern(c)}
                    >
                      <span className="cluv-select-row-label">{c}</span>
                      <div className="cluv-checkbox-indicator">
                        {isActive && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 3: Bahan yang Pernah Bikin Kulit Tidak Nyaman (Multi-select Checkbox Group) */}
            <div className="cluv-flex-col cluv-gap-2">
              <div className="cluv-section-mobile-header">
                <span className="cluv-section-mobile-title">Bahan yang Dihindari</span>
                <span className="cluv-section-mobile-hint">Opsional</span>
              </div>

              <div className="cluv-select-group">
                {SENSITIVITIES_LIST.map((item) => {
                  const isActive = sensitivities.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`cluv-select-row ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleToggleSensitivity(item)}
                    >
                      <span className="cluv-select-row-label">{item}</span>
                      <div className="cluv-checkbox-indicator">
                        {isActive && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {message && (
              <div className={`cluv-alert ${isSuccess ? 'is-success' : 'is-danger'}`}>
                {isSuccess ? <Check size={16} className="cluv-alert-icon" /> : <AlertCircle size={16} className="cluv-alert-icon" />}
                <div className="cluv-alert-content">
                  <p className="cluv-alert-message">{message}</p>
                </div>
              </div>
            )}

            {/* Action Bar Alami di Paling Bawah (Bukan Melayang, Ukuran Pas 44px) */}
            <div className="cluv-profile-action-bar">
              <Button
                variant="primary"
                size="md"
                block
                loading={loading}
                iconLeft={<Save size={16} />}
                onClick={handleSave}
              >
                {loading ? 'Menyimpan preferensi...' : 'Simpan Profil Kulit'}
              </Button>
              <p className="cluv-hide-mobile cluv-profile-action-hint">
                <Sparkles size={15} className="cluv-text-gold cluv-flex-shrink-0" /> Preferensi tersimpan otomatis tersinkronisasi ke seluruh fitur scan dan chatbot.
              </p>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
