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
  Check, Save, Sparkles,
} from 'lucide-react'
import type { SkinProfile, SkinType } from '@/types/database'

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
    <div className="v0-profile-page">
      <div className="v0-profile-form-container">
        {/* Back link navigation */}
        <div style={{ marginBottom: 16 }}>
          <Link to="/profile" className="v0-profile-back-link">
            <ArrowLeft size={16} />
            <span>Kembali ke Profil & Pengaturan</span>
          </Link>
        </div>

        {/* Header */}
        <div className="v0-profile-header">
          <h1>Profil & Preferensi Kulit</h1>
          <p>Konfigurasikan tipe kulit dan bahan yang ingin kamu hindari untuk mempersonalisasi rekomendasi Skinsistant AI.</p>
        </div>

        {/* Main card */}
        <div className="v0-profile-card">
          {/* Regulatory & Privacy Notice (Invarian 19 & UU PDP No. 27/2022) */}
          <div className="v0-regulatory-banner">
            <div className="v0-regulatory-banner-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="v0-regulatory-banner-content">
            <h4 className="v0-regulatory-title">Deklarasi Preferensi Konsumen Edukatif</h4>
            <p className="v0-regulatory-desc">
              Data ini adalah preferensi mandiri yang Anda tentukan sendiri sebagai panduan analisis Skinsistant AI. Ini bukan merupakan diagnosis klinis, rekam medis dokter, ataupun resep obat. Anda berhak mengubah preferensi ini kapan saja.
            </p>
          </div>
        </div>

        {fetching ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
            Memuat preferensi kulit Anda...
          </div>
        ) : (
          <>
            {/* Section 1: Tipe Kulit Utama */}
            <div className="v0-profile-form-section">
              <div className="v0-profile-section-heading">
                <span className="v0-profile-section-icon"><Activity size={16} /></span>
                <div>
                  <p className="v0-profile-form-section-title">Tipe Kulit Utama</p>
                  <p className="v0-profile-form-section-sub">Pilih salah satu kondisi dasar wajah yang paling menggambarkan kulitmu saat ini</p>
                </div>
              </div>
              <div className="v0-profile-chip-group">
                {SKIN_TYPES.map((t) => {
                  const isActive = skinType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`v0-profile-chip ${isActive ? 'active' : ''}`}
                      onClick={() => setSkinType(t.id)}
                    >
                      {isActive && <Check size={14} className="v0-profile-chip-check" />}
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 2: Target Perawatan */}
            <div className="v0-profile-form-section v0-mt-section-form">
              <div className="v0-profile-section-heading">
                <span className="v0-profile-section-icon alert"><AlertCircle size={16} /></span>
                <div>
                  <p className="v0-profile-form-section-title">Target Perawatan & Masalah Kulit</p>
                  <p className="v0-profile-form-section-sub">Dapat memilih lebih dari satu target perawatan (multi-select)</p>
                </div>
              </div>
              <div className="v0-profile-chip-group">
                {CONCERNS_LIST.map((c) => {
                  const isActive = concerns.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`v0-profile-chip ${isActive ? 'active' : ''}`}
                      onClick={() => handleToggleConcern(c)}
                    >
                      {isActive && <Check size={14} className="v0-profile-chip-check" />}
                      <span>{c}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 3: Bahan yang Pernah Bikin Kulit Tidak Nyaman */}
            <div className="v0-profile-form-section v0-mt-section-form">
              <div className="v0-profile-section-heading">
                <span className="v0-profile-section-icon amber">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <p className="v0-profile-form-section-title">Bahan yang Pernah Membuat Kulit Tidak Nyaman</p>
                  <p className="v0-profile-form-section-sub">
                    Skinsistant AI dan fitur Scan Komposisi akan memberikan peringatan otomatis jika mendeteksi bahan ini dalam produk yang Anda pindai
                  </p>
                </div>
              </div>
              <div className="v0-profile-chip-group">
                {SENSITIVITIES_LIST.map((item) => {
                  const isActive = sensitivities.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`v0-profile-chip ${isActive ? 'active' : ''}`}
                      onClick={() => handleToggleSensitivity(item)}
                    >
                      {isActive && <Check size={14} className="v0-profile-chip-check" />}
                      <span>{item}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {message && (
              <div className={`v0-profile-message ${isSuccess ? 'success' : 'error'}`}>
                {isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{message}</span>
              </div>
            )}

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="v0-profile-save-btn"
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={16} />
                <span>{loading ? 'Menyimpan preferensi...' : 'Simpan Profil Kulit'}</span>
              </button>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                <Sparkles size={14} /> Preferensi tersimpan otomatis tersinkronisasi ke seluruh fitur scan dan chatbot Skincluv.
              </p>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
