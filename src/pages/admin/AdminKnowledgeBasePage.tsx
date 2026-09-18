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

  const getBadgeStyle = (rating: string) => {
    switch (rating) {
      case 'aman':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Aman' }
      case 'hati':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Hati-hati' }
      case 'hindari':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Hindari' }
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: rating }
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Kamus Bahan Skincare (Knowledge Base AI)
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Ensiklopedia bahan kosmetik terstandar yang secara otomatis dipelajari dan diperkaya oleh AI dari setiap scan pengguna.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadIngredients}
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
              color: '#374151',
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
            <Plus size={16} /> Entri Bahan Baru
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Top Metric Cards */}
      <div className="admin-grid-cards">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Bahan Terindeks
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.total} bahan
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Bahan Aktif Klinis
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.actives} bahan
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Potensi Iritasi / Waspada
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.cautions} bahan
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#fdf2f8',
              color: '#db2777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Hash size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Akumulasi Deteksi Scan
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.totalDetections.toLocaleString('id-ID')} kali
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 260,
            display: 'flex',
            gap: 10,
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            alignItems: 'center',
          }}
        >
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Cari nama bahan, nama INCI, atau deskripsi klinis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 13,
              width: '100%',
              color: '#111827',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#9ca3af',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          <option value="all">Semua Kategori</option>
          <option value="Active">Active</option>
          <option value="Hydrating">Hydrating</option>
          <option value="Antioxidant">Antioxidant</option>
          <option value="Preservative">Preservative</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={safetyFilter}
          onChange={(e) => setSafetyFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          <option value="all">Semua Rating Keamanan</option>
          <option value="aman">Aman</option>
          <option value="hati">Perlu Perhatian</option>
          <option value="hindari">Hindari</option>
        </select>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Nama Bahan & INCI
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Kategori
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Rating Keamanan
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Komedogenik (0-5)
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Deteksi Scan
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Verifikasi Ahli
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat kamus bahan...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <BookOpen size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Kamus bahan belum terisi</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Bahan akan terisi secara otomatis seiring user melakukan scan label skincare.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const badge = getBadgeStyle(item.safety_rating)
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>
                          {item.canonical_name}
                        </div>
                        {item.inci_name && (
                          <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>
                            INCI: {item.inci_name}
                          </div>
                        )}
                        {item.description && (
                          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: '#eff6ff',
                            color: '#2563eb',
                          }}
                        >
                          {item.category}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>
                        <span
                          style={{
                            color: item.comedogenic_rating > 2 ? '#dc2626' : '#111827',
                          }}
                        >
                          {item.comedogenic_rating} / 5
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#f3f4f6',
                            color: '#374151',
                          }}
                        >
                          {item.occurrence_count}x
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {item.is_verified ? (
                          <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                            <ShieldCheck size={14} /> Terverifikasi
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 11 }}>Auto-Learned</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => startEdit(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#111827',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={12} /> Edit / Kalibrasi
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 12,
          }}
          onClick={() => setIsEditing(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                  {form.id ? 'Kalibrasi Parameter Bahan' : 'Tambah Entri Bahan Baru'}
                </h2>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Parameter ini menjadi basis acuan ilmiah AI saat mengevaluasi kecocokan kulit.
                </div>
              </div>

              <button
                onClick={() => setIsEditing(false)}
                style={{
                  border: 'none',
                  background: '#f3f4f6',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-grid-2col">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Nama Bahan (Canonical) *
                  </label>
                  <input
                    required
                    value={form.canonical_name}
                    onChange={(e) => setForm({ ...form, canonical_name: e.target.value })}
                    placeholder="misal: Niacinamide"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Nama Standar INCI
                  </label>
                  <input
                    value={form.inci_name}
                    onChange={(e) => setForm({ ...form, inci_name: e.target.value })}
                    placeholder="misal: Niacinamide"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div className="admin-grid-3col">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      background: '#ffffff',
                    }}
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

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Rating Keamanan
                  </label>
                  <select
                    value={form.safety_rating}
                    onChange={(e) => setForm({ ...form, safety_rating: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      background: '#ffffff',
                    }}
                  >
                    <option value="aman">Aman</option>
                    <option value="hati">Perlu Perhatian</option>
                    <option value="hindari">Hindari</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Skor Komedogenik (0-5)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={form.comedogenic_rating}
                    onChange={(e) => setForm({ ...form, comedogenic_rating: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Deskripsi & Manfaat Klinis
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Penjelasan fungsi bagi skin barrier, hiperpigmentasi, atau sebum..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div className="admin-grid-2col">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Fungsi Utama (pisahkan dengan koma)
                  </label>
                  <input
                    value={form.common_functions}
                    onChange={(e) => setForm({ ...form, common_functions: e.target.value })}
                    placeholder="misal: Mencerahkan, Mengontrol Sebum, Memperkuat Barrier"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Hindari Dikombinasikan Dengan
                  </label>
                  <input
                    value={form.incompatible_with}
                    onChange={(e) => setForm({ ...form, incompatible_with: e.target.value })}
                    placeholder="misal: AHA/BHA tinggi, Vitamin C murni"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="is_verified_check"
                  checked={form.is_verified}
                  onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="is_verified_check" style={{ fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  Tandai sebagai parameter ilmiah terverifikasi ahli
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#111827',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
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
