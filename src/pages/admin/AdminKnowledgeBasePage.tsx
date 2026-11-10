import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BookOpen,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  Sparkles,
  AlertCircle,
  Hash,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SkincareIngredient } from '@/types/database'
import '@/styles/admin-knowledge-base.css'

interface FormState {
  id: string
  canonical_name: string
  inci_name: string
  category: string
  safety_rating: 'aman' | 'hati' | 'hindari'
  comedogenic_rating: number
  description: string
  common_functions: string
  incompatible_with: string
  is_verified: boolean
}

const emptyForm: FormState = {
  id: '',
  canonical_name: '',
  inci_name: '',
  category: 'Active',
  safety_rating: 'aman',
  comedogenic_rating: 0,
  description: '',
  common_functions: '',
  incompatible_with: '',
  is_verified: true,
}

export default function AdminKnowledgeBasePage() {
  const [ingredients, setIngredients] = useState<SkincareIngredient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [safetyFilter, setSafetyFilter] = useState('all')
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadIngredients = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const { data, error } = await supabase
        .from('skincare_ingredients')
        .select('*')
        .order('occurrence_count', { ascending: false })
        .limit(200)

      if (error) throw error
      setIngredients((data as SkincareIngredient[]) ?? [])
    } catch (err: any) {
      console.error('[AdminKnowledgeBase] Error loading:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat kamus bahan.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIngredients()
  }, [loadIngredients])

  const filtered = useMemo(() => {
    return ingredients.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (safetyFilter !== 'all' && item.safety_rating !== safetyFilter) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const name = item.canonical_name.toLowerCase()
      const inci = item.inci_name?.toLowerCase() || ''
      const desc = item.description?.toLowerCase() || ''
      return name.includes(q) || inci.includes(q) || desc.includes(q)
    })
  }, [ingredients, searchQuery, categoryFilter, safetyFilter])

  const metrics = useMemo(() => {
    const total = ingredients.length
    const actives = ingredients.filter((i) => i.category === 'Active').length
    const cautions = ingredients.filter((i) => i.safety_rating === 'hati' || i.safety_rating === 'hindari').length
    const totalDetections = ingredients.reduce((sum, i) => sum + (i.occurrence_count || 1), 0)
    return { total, actives, cautions, totalDetections }
  }, [ingredients])

  const startEdit = (ing: SkincareIngredient) => {
    setForm({
      id: ing.id,
      canonical_name: ing.canonical_name,
      inci_name: ing.inci_name || '',
      category: ing.category || 'Other',
      safety_rating: ing.safety_rating || 'aman',
      comedogenic_rating: ing.comedogenic_rating || 0,
      description: ing.description || '',
      common_functions: (ing.common_functions || []).join(', '),
      incompatible_with: (ing.incompatible_with || []).join(', '),
      is_verified: ing.is_verified,
    })
    setIsEditing(true)
  }

  const startNew = () => {
    setForm(emptyForm)
    setIsEditing(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.canonical_name.trim()) return
    setIsSaving(true)
    setFeedback(null)

    const payload = {
      canonical_name: form.canonical_name.trim(),
      inci_name: form.inci_name.trim() || null,
      category: form.category,
      safety_rating: form.safety_rating,
      comedogenic_rating: Number(form.comedogenic_rating),
      description: form.description.trim() || null,
      common_functions: form.common_functions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      incompatible_with: form.incompatible_with
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      is_verified: form.is_verified,
      updated_at: new Date().toISOString(),
    }

    try {
      if (form.id) {
        const { error } = await supabase
          .from('skincare_ingredients')
          .update(payload)
          .eq('id', form.id)
        if (error) throw error
        setFeedback({ type: 'success', message: `Bahan "${payload.canonical_name}" berhasil diperbarui.` })
      } else {
        const { error } = await supabase
          .from('skincare_ingredients')
          .insert({ ...payload, occurrence_count: 1 })
        if (error) throw error
        setFeedback({ type: 'success', message: `Bahan "${payload.canonical_name}" berhasil didaftarkan.` })
      }
      setIsEditing(false)
      loadIngredients()
    } catch (err: any) {
      console.error('[AdminKnowledgeBase] Save error:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan bahan.' })
    } finally {
      setIsSaving(false)
    }
  }

  const renderSafetyBadge = (rating: string) => {
    switch (rating) {
      case 'aman':
        return <span className="cluv-badge is-success">Aman</span>
      case 'hati':
        return <span className="cluv-badge is-warning">Perlu Perhatian</span>
      case 'hindari':
        return <span className="cluv-badge is-danger">Hindari</span>
      default:
        return <span className="cluv-badge is-neutral">{rating}</span>
    }
  }

  return (
    <div className="admin-page-container cluv-animate-fade">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-title-row">
            <div className="admin-header-icon-wrap">
              <BookOpen size={22} />
            </div>
            <h1 className="admin-page-title">
              Kamus Bahan Skincare (Knowledge Base AI)
            </h1>
          </div>
          <p className="admin-page-subtitle">
            Ensiklopedia bahan kosmetik terstandar yang secara otomatis dipelajari dan diperkaya oleh AI dari setiap scan pengguna.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={loadIngredients}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
          </button>
          <button
            type="button"
            onClick={startNew}
            className="cluv-btn is-primary is-sm"
          >
            <Plus size={16} /> Entri Bahan Baru
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`cluv-alert cluv-mb-4 ${feedback.type === 'success' ? 'is-success' : 'is-danger'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="cluv-stat-grid cols-4">
        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Bahan Terindeks</span>
            <div className="cluv-stat-icon is-teal">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="cluv-stat-val cluv-tabular-nums">{metrics.total}</div>
          <div className="cluv-stat-meta">bahan terdaftar</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Bahan Aktif Klinis</span>
            <div className="cluv-stat-icon is-teal">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="cluv-stat-val cluv-tabular-nums">{metrics.actives}</div>
          <div className="cluv-stat-meta">kategori Active</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Potensi Iritasi / Waspada</span>
            <div className="cluv-stat-icon is-gold">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="cluv-stat-val cluv-tabular-nums">{metrics.cautions}</div>
          <div className="cluv-stat-meta">rating hati / hindari</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-header">
            <span className="cluv-stat-label">Akumulasi Deteksi Scan</span>
            <div className="cluv-stat-icon is-rose">
              <Hash size={18} />
            </div>
          </div>
          <div className="cluv-stat-val cluv-tabular-nums">{metrics.totalDetections.toLocaleString('id-ID')}</div>
          <div className="cluv-stat-meta">kali teridentifikasi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cluv-card akb-filter-card">
        <div className="akb-search-wrap">
          <Search size={16} className="akb-search-icon" />
          <input
            type="text"
            placeholder="Cari nama bahan, nama INCI, atau deskripsi klinis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="akb-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="cluv-link is-muted"
              aria-label="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="akb-filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="akb-filter-select"
          >
            <option value="all">Semua Kategori</option>
            <option value="Active">Active</option>
            <option value="Hydrating">Hydrating</option>
            <option value="Antioxidant">Antioxidant</option>
            <option value="Preservative">Preservative</option>
            <option value="Emollient">Emollient</option>
            <option value="Exfoliant">Exfoliant</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={safetyFilter}
            onChange={(e) => setSafetyFilter(e.target.value)}
            className="akb-filter-select"
          >
            <option value="all">Semua Rating Keamanan</option>
            <option value="aman">Aman</option>
            <option value="hati">Perlu Perhatian</option>
            <option value="hindari">Hindari</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="cluv-card akb-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Nama Bahan &amp; INCI</th>
                <th style={{ textAlign: 'center' }}>Kategori</th>
                <th style={{ textAlign: 'center' }}>Rating Keamanan</th>
                <th style={{ textAlign: 'center' }}>Komedogenik (0-5)</th>
                <th style={{ textAlign: 'center' }}>Deteksi Scan</th>
                <th style={{ textAlign: 'center' }}>Verifikasi Ahli</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat kamus bahan...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <BookOpen size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--cluv-neutral-800)' }}>Kamus bahan tidak ditemukan</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      {searchQuery ? 'Coba ubah kata kunci atau reset filter pencarian.' : 'Bahan akan terisi otomatis saat pengguna memindai komposisi skincare.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="akb-ingredient-name">
                        {item.canonical_name}
                      </div>
                      {item.inci_name && (
                        <div className="akb-inci-name">
                          INCI: {item.inci_name}
                        </div>
                      )}
                      {item.description && (
                        <div className="akb-desc-text">
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="cluv-badge is-neutral">
                        {item.category}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {renderSafetyBadge(item.safety_rating)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: item.comedogenic_rating > 2 ? 'var(--cluv-rose)' : 'var(--cluv-neutral-800)',
                        }}
                      >
                        {item.comedogenic_rating} / 5
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="akb-scan-count-pill cluv-tabular-nums">
                        {item.occurrence_count}x
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {item.is_verified ? (
                        <span className="akb-verified-badge">
                          <ShieldCheck size={14} /> Terverifikasi
                        </span>
                      ) : (
                        <span className="akb-auto-badge">Auto-Learned</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="cluv-btn is-outline is-sm"
                      >
                        <Edit2 size={13} /> Edit / Kalibrasi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div
          className="cluv-modal-overlay"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="cluv-modal-box is-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cluv-modal-header">
              <div>
                <h2 className="cluv-modal-title">
                  {form.id ? 'Kalibrasi Parameter Bahan' : 'Tambah Entri Bahan Baru'}
                </h2>
                <p className="cluv-modal-subtitle">
                  Parameter ini menjadi basis acuan ilmiah AI saat mengevaluasi kecocokan kulit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cluv-modal-close"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
            >
              <div className="cluv-modal-body akb-form-body">
                <div className="akb-grid-2col">
                  <div className="cluv-field">
                    <label className="cluv-label">
                      Nama Bahan (Canonical) *
                    </label>
                    <input
                      required
                      value={form.canonical_name}
                      onChange={(e) => setForm({ ...form, canonical_name: e.target.value })}
                      placeholder="misal: Niacinamide"
                      className="cluv-input"
                    />
                  </div>

                  <div className="cluv-field">
                    <label className="cluv-label">
                      Nama Standar INCI
                    </label>
                    <input
                      value={form.inci_name}
                      onChange={(e) => setForm({ ...form, inci_name: e.target.value })}
                      placeholder="misal: Niacinamide"
                      className="cluv-input"
                    />
                  </div>
                </div>

                <div className="akb-grid-3col">
                  <div className="cluv-field">
                    <label className="cluv-label">
                      Kategori
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="cluv-input"
                    >
                      <option value="Active">Active</option>
                      <option value="Hydrating">Hydrating</option>
                      <option value="Antioxidant">Antioxidant</option>
                      <option value="Preservative">Preservative</option>
                      <option value="Emollient">Emollient</option>
                      <option value="Exfoliant">Exfoliant</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="cluv-field">
                    <label className="cluv-label">
                      Rating Keamanan
                    </label>
                    <select
                      value={form.safety_rating}
                      onChange={(e) => setForm({ ...form, safety_rating: e.target.value as any })}
                      className="cluv-input"
                    >
                      <option value="aman">Aman</option>
                      <option value="hati">Perlu Perhatian</option>
                      <option value="hindari">Hindari</option>
                    </select>
                  </div>

                  <div className="cluv-field">
                    <label className="cluv-label">
                      Skor Komedogenik (0-5)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={form.comedogenic_rating}
                      onChange={(e) => setForm({ ...form, comedogenic_rating: Number(e.target.value) })}
                      className="cluv-input cluv-tabular-nums"
                    />
                  </div>
                </div>

                <div className="cluv-field">
                  <label className="cluv-label">
                    Deskripsi &amp; Manfaat Klinis
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Penjelasan fungsi bagi skin barrier, hiperpigmentasi, atau sebum..."
                    className="cluv-input"
                  />
                </div>

                <div className="akb-grid-2col">
                  <div className="cluv-field">
                    <label className="cluv-label">
                      Fungsi Utama (pisahkan dengan koma)
                    </label>
                    <input
                      value={form.common_functions}
                      onChange={(e) => setForm({ ...form, common_functions: e.target.value })}
                      placeholder="misal: Mencerahkan, Mengontrol Sebum, Memperkuat Barrier"
                      className="cluv-input"
                    />
                  </div>

                  <div className="cluv-field">
                    <label className="cluv-label">
                      Hindari Dikombinasikan Dengan
                    </label>
                    <input
                      value={form.incompatible_with}
                      onChange={(e) => setForm({ ...form, incompatible_with: e.target.value })}
                      placeholder="misal: AHA/BHA tinggi, Vitamin C murni"
                      className="cluv-input"
                    />
                  </div>
                </div>

                <label className="akb-checkbox-label">
                  <input
                    type="checkbox"
                    id="is_verified_check"
                    checked={form.is_verified}
                    onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                    className="akb-checkbox-input"
                  />
                  <span>Tandai sebagai parameter ilmiah terverifikasi ahli</span>
                </label>
              </div>

              <div className="cluv-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="cluv-btn is-outline is-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cluv-btn is-primary is-sm"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
