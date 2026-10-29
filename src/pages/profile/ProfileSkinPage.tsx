// src/pages/profile/ProfileSkinPage.tsx
// Sub-page Profil & Preferensi Kulit (RFC 020)
// Conforming to Invariant 19 (Non-Therapeutic Claim), Invariant 6 (Deterministic Ground Truth),
// and 100% styled with the Fresh Clinical Tech v0-profile-* design system.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Activity, AlertCircle, ShieldCheck,
  Check, Save, Sparkles, X,
} from 'lucide-react'
import type { SkinProfile, SkinType } from '@/types/database'
import { Button } from '@/components/ui'

const SKIN_TYPES: { id: SkinType; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'dry', label: 'Kering (Dry)' },
  { id: 'oily', label: 'Berminyak (Oily)' },
  { id: 'combination', label: 'Kombinasi' },
  { id: 'sensitive', label: 'Sensitif' },
]

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
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Back link navigation (Desktop only; di mobile sudah ada tombol kembali di topbar) */}
      <Link to="/profile" className="cluv-hide-mobile cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3">
        <ArrowLeft size={16} />
        <span>Kembali ke Profil &amp; Pengaturan</span>
      </Link>

      {/* Header (Desktop only; di mobile sudah terpampang di topbar) */}
      <div className="cluv-hide-mobile cluv-mb-6">
        <h1 className="cluv-title-page">Profil &amp; Preferensi Kulit</h1>
        <p className="cluv-caption cluv-text-muted">Konfigurasikan tipe kulit dan bahan yang ingin kamu hindari untuk mempersonalisasi rekomendasi Skinsistant AI.</p>
      </div>

      {/* Main card (Di mobile dibuat flat/unboxed agar tidak ada double border yang sempit) */}
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
            {/* Section 1: Tipe Kulit Utama */}
            <div className="cluv-flex-col cluv-gap-3">
              <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
                  <div className="cluv-card-icon-wrap is-sm is-teal">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="cluv-body cluv-font-bold cluv-m-0">Tipe Kulit Utama</h3>
                    <p className="cluv-hide-mobile cluv-caption cluv-text-muted cluv-m-0 cluv-mt-0.5">Pilih salah satu kondisi dasar wajah yang paling menggambarkan kulitmu saat ini</p>
                  </div>
                </div>
                <span className="cluv-caption cluv-text-muted cluv-font-semibold">(Pilih 1)</span>
              </div>

              <div className="cluv-chip-grid">
                {SKIN_TYPES.map((t) => {
                  const isActive = skinType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`cluv-chip ${isActive ? 'is-active' : ''}`}
                      onClick={() => setSkinType(t.id)}
                    >
                      {isActive && <Check size={14} className="cluv-text-teal" />}
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <hr className="cluv-divider is-dashed is-compact" />

            {/* Section 2: Target Perawatan */}
            <div className="cluv-flex-col cluv-gap-3">
              <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
                  <div className="cluv-card-icon-wrap is-sm is-rose">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <h3 className="cluv-body cluv-font-bold cluv-m-0">Target Perawatan</h3>
                    <p className="cluv-hide-mobile cluv-caption cluv-text-muted cluv-m-0 cluv-mt-0.5">Dapat memilih lebih dari satu target perawatan (multi-select)</p>
                  </div>
                </div>
                <span className="cluv-caption cluv-text-muted cluv-font-semibold">(Bisa pilih &gt; 1)</span>
              </div>

              <div className="cluv-chip-grid">
                {CONCERNS_LIST.map((c) => {
                  const isActive = concerns.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`cluv-chip ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleToggleConcern(c)}
                    >
                      {isActive && <Check size={14} className="cluv-text-teal" />}
                      <span>{c}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <hr className="cluv-divider is-dashed is-compact" />

            {/* Section 3: Bahan yang Pernah Bikin Kulit Tidak Nyaman */}
            <div className="cluv-flex-col cluv-gap-3">
              <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                <div className="cluv-flex-row cluv-items-center cluv-gap-2.5">
                  <div className="cluv-card-icon-wrap is-sm is-gold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="cluv-body cluv-font-bold cluv-m-0">Bahan yang Dihindari</h3>
                    <p className="cluv-hide-mobile cluv-caption cluv-text-muted cluv-m-0 cluv-mt-0.5">
                      Peringatan otomatis jika terdeteksi dalam produk yang Anda pindai
                    </p>
                  </div>
                </div>
                <span className="cluv-caption cluv-text-muted cluv-font-semibold">(Opsional)</span>
              </div>

              <div className="cluv-chip-grid">
                {SENSITIVITIES_LIST.map((item) => {
                  const isActive = sensitivities.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`cluv-chip ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleToggleSensitivity(item)}
                    >
                      {isActive && <Check size={14} className="cluv-text-teal" />}
                      <span>{item}</span>
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

            {/* Sticky Action Bar di Mobile, Normal di Desktop */}
            <div className="cluv-profile-sticky-action">
              <Button
                variant="primary"
                size="lg"
                block
                loading={loading}
                iconLeft={<Save size={16} />}
                onClick={handleSave}
              >
                {loading ? 'Menyimpan preferensi...' : 'Simpan Profil Kulit'}
              </Button>
              <p className="cluv-caption cluv-text-muted cluv-flex-row cluv-items-center cluv-justify-center cluv-gap-1.5 cluv-mt-2 cluv-mb-0 cluv-hide-mobile">
                <Sparkles size={14} className="cluv-text-gold" /> Preferensi tersimpan otomatis tersinkronisasi ke seluruh fitur scan dan chatbot Skincluv.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
