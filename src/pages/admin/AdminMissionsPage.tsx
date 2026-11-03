import { useEffect, useState, useCallback } from 'react'
import { Target, Plus, CheckCircle2, AlertCircle, RefreshCw, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-missions.css'

interface Mission {
  id: string
  slug: string
  name: string
  description: string | null
  type: 'daily' | 'weekly' | 'one_time' | 'streak' | 'social'
  coin_reward: number
  target_count: number
  cooldown_hours: number | null
  is_active: boolean
  created_at: string
}

interface MissionFormState {
  id: string
  slug: string
  name: string
  description: string
  type: Mission['type']
  coin_reward: number
  target_count: number
  cooldown_hours: string
  is_active: boolean
}

const emptyForm: MissionFormState = {
  id: '',
  slug: '',
  name: '',
  description: '',
  type: 'daily',
  coin_reward: 10,
  target_count: 1,
  cooldown_hours: '',
  is_active: true,
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [form, setForm] = useState<MissionFormState>(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadMissions = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMissions((data ?? []) as Mission[])
    } catch (err: any) {
      console.error('[AdminMissions] Error loading missions:', err)
      setFeedback({ type: 'error', message: `Gagal memuat misi: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMissions()
  }, [loadMissions])

  function startEdit(m: Mission) {
    setForm({
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description ?? '',
      type: m.type,
      coin_reward: m.coin_reward,
      target_count: m.target_count,
      cooldown_hours: m.cooldown_hours?.toString() ?? '',
      is_active: m.is_active,
    })
    setIsEditing(true)
    setFeedback(null)
  }

  function startNew() {
    setForm(emptyForm)
    setIsEditing(true)
    setFeedback(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.slug.trim() || !form.name.trim()) {
      setFeedback({ type: 'error', message: 'Slug dan Nama misi wajib diisi.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      coin_reward: form.coin_reward,
      target_count: form.target_count,
      cooldown_hours: form.cooldown_hours ? parseInt(form.cooldown_hours, 10) : null,
      is_active: form.is_active,
    }

    try {
      const { error } = form.id
        ? await supabase.from('missions').update(payload).eq('id', form.id)
        : await supabase.from('missions').insert(payload)

      if (error) throw error

      setFeedback({
        type: 'success',
        message: form.id ? 'Misi berhasil diperbarui.' : 'Misi baru berhasil ditambahkan.',
      })
      setIsEditing(false)
      await loadMissions()
    } catch (err: any) {
      console.error('[AdminMissions] Gagal menyimpan misi:', err)
      setFeedback({ type: 'error', message: `Gagal menyimpan: ${err.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            <Target size={12} /> Gamifikasi & Retensi
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Misi Glow (Rewards & Gamifikasi)
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Kelola misi harian, mingguan, dan reward kredit koin untuk pengguna Skincluv.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            onClick={loadMissions}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={startNew}
            className="cluv-btn is-primary is-sm"
          >
            <Plus size={16} />
            <span>Misi Baru</span>
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

      {/* Form Drawer / Card */}
      {isEditing && (
        <div className="cluv-card admin-missions-card">
          <div className="admin-missions-header">
            <div className="cluv-card-icon-wrap is-teal">
              <Target size={18} />
            </div>
            <div>
              <h2 className="admin-missions-title">
                {form.id ? 'Edit Konfigurasi Misi' : 'Tambah Misi Baru'}
              </h2>
              <p className="admin-missions-desc">
                Konfigurasi syarat penyelesaian misi, cooldown jam, dan besaran reward credits.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-grid-2col">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Slug Unik <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                </label>
                <input
                  placeholder="misal: daily_face_scan"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="admin-input"
                  disabled={!!form.id}
                  style={form.id ? { background: 'var(--cluv-neutral-100)', cursor: 'not-allowed' } : {}}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Nama Misi <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                </label>
                <input
                  placeholder="misal: Scan Wajah Pertama Hari Ini"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                Deskripsi Misi
              </label>
              <textarea
                placeholder="Penjelasan ringkas instruksi misi untuk pengguna..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="input-field"
              />
            </div>

            <div className="admin-grid-4col">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Tipe Misi
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Mission['type'] })}
                  className="admin-select"
                >
                  <option value="daily">Daily (Harian)</option>
                  <option value="weekly">Weekly (Mingguan)</option>
                  <option value="one_time">One Time (Sekali)</option>
                  <option value="streak">Streak (Berturut-turut)</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Reward Credits
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.coin_reward}
                  onChange={(e) => setForm({ ...form, coin_reward: parseInt(e.target.value, 10) || 0 })}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Target Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.target_count}
                  onChange={(e) => setForm({ ...form, target_count: parseInt(e.target.value, 10) || 1 })}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Cooldown (Jam)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Kosongkan jika default"
                  value={form.cooldown_hours}
                  onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="mission_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--cluv-teal)' }}
              />
              <label htmlFor="mission_is_active" style={{ fontSize: 13, fontWeight: 700, color: 'var(--cluv-neutral-800)', cursor: 'pointer' }}>
                Status Misi Aktif (Bisa dikerjakan oleh user)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                disabled={isSaving}
                className="cluv-btn is-primary is-sm"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Misi'}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cluv-btn is-outline is-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Misi */}
      <div className="cluv-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--cluv-border)' }}>
          <Target size={18} style={{ color: 'var(--cluv-teal)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0 }}>
            Semua Misi Terdaftar ({missions.length})
          </h2>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 280 }}>NAMA & SLUG</th>
                <th style={{ width: 120 }}>TIPE</th>
                <th style={{ textAlign: 'center', width: 130 }}>REWARD</th>
                <th style={{ textAlign: 'center', width: 100 }}>TARGET</th>
                <th style={{ textAlign: 'center', width: 120 }}>COOLDOWN</th>
                <th style={{ textAlign: 'center', width: 110 }}>STATUS</th>
                <th style={{ textAlign: 'right', width: 100 }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr
                  key={m.id}
                  className="admin-table-row"
                  style={!m.is_active ? { opacity: 0.7 } : {}}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>
                      {m.name}
                    </div>
                    <code className="admin-mission-code">
                      {m.slug}
                    </code>
                    {m.description && (
                      <p style={{ fontSize: 12, color: 'var(--cluv-neutral-500)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {m.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <span
                      className={`cluv-badge ${
                        m.type === 'daily'
                          ? 'is-teal'
                          : m.type === 'weekly'
                          ? 'is-gold'
                          : m.type === 'streak'
                          ? 'is-purple'
                          : 'is-neutral'
                      } is-sm`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{ color: 'var(--cluv-teal)', fontVariantNumeric: 'tabular-nums' }}>
                      +{m.coin_reward} Credits
                    </strong>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--cluv-neutral-600)', fontVariantNumeric: 'tabular-nums' }}>
                    {m.target_count}x
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--cluv-neutral-500)', fontVariantNumeric: 'tabular-nums' }}>
                    {m.cooldown_hours ? `${m.cooldown_hours} jam` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`cluv-badge ${m.is_active ? 'is-teal' : 'is-neutral'} is-sm`}>
                      {m.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => startEdit(m)}
                      className="cluv-btn is-outline is-sm"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {missions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--cluv-neutral-400)' }}>
                    Belum ada misi terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
