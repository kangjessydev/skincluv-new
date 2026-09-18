import { useEffect, useState, useCallback } from 'react'
import { Target, Plus, CheckCircle2, AlertCircle, RefreshCw, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    <div className="admin-page-container" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Misi Glow (Rewards & Gamifikasi)
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Kelola misi harian, mingguan, dan reward kredit koin untuk pengguna Skincluv.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            onClick={loadMissions}
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

          <button
            onClick={startNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#111827',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Misi Baru
          </button>
        </div>
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

      {/* Form Drawer / Card */}
      {isEditing && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            marginBottom: 32,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Target size={18} color="#6366f1" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              {form.id ? 'Edit Konfigurasi Misi' : 'Tambah Misi Baru'}
            </h2>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-grid-2col">
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Slug Unik <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="misal: daily_face_scan"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    background: form.id ? '#f3f4f6' : '#ffffff',
                  }}
                  disabled={!!form.id}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Nama Misi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="misal: Scan Wajah Pertama Hari Ini"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Deskripsi Misi
              </label>
              <textarea
                placeholder="Penjelasan ringkas instruksi misi untuk pengguna..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="admin-grid-4col">
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Tipe Misi
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Mission['type'] })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    background: '#ffffff',
                  }}
                >
                  <option value="daily">Daily (Harian)</option>
                  <option value="weekly">Weekly (Mingguan)</option>
                  <option value="one_time">One Time (Sekali)</option>
                  <option value="streak">Streak (Berturut-turut)</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Reward Koin (Credit)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.coin_reward}
                  onChange={(e) => setForm({ ...form, coin_reward: parseInt(e.target.value, 10) || 0 })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Target Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.target_count}
                  onChange={(e) => setForm({ ...form, target_count: parseInt(e.target.value, 10) || 1 })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Cooldown (Jam)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Kosongkan jika default"
                  value={form.cooldown_hours}
                  onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="mission_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="mission_is_active" style={{ fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Status Misi Aktif (Bisa dikerjakan oleh user)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSaving ? '#9ca3af' : '#111827',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Misi'}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Misi */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Target size={18} color="#4b5563" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
            Semua Misi Terdaftar ({missions.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Nama & Slug</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Tipe</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Reward</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Target</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Cooldown</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: m.is_active ? '#ffffff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: m.is_active ? '#111827' : '#6b7280' }}>
                      {m.name}
                    </div>
                    <code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, color: '#4b5563' }}>
                      {m.slug}
                    </code>
                    {m.description && (
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>
                        {m.description}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          m.type === 'daily'
                            ? '#dbeafe'
                            : m.type === 'weekly'
                            ? '#fef3c7'
                            : m.type === 'streak'
                            ? '#fce7f3'
                            : '#f3f4f6',
                        color:
                          m.type === 'daily'
                            ? '#1d4ed8'
                            : m.type === 'weekly'
                            ? '#b45309'
                            : m.type === 'streak'
                            ? '#be185d'
                            : '#374151',
                      }}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#059669' }}>
                    +{m.coin_reward} credit
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#4b5563' }}>
                    {m.target_count}x
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                    {m.cooldown_hours ? `${m.cooldown_hours} jam` : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {m.is_active ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
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
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 9999,
                          background: '#f3f4f6',
                          color: '#6b7280',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => startEdit(m)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {missions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
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
