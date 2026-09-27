import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BookMarked,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  FileCode,
  Shield,
  Layers,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface HandbookEntry {
  id: string
  slug: string
  canonical_name: string
  aliases: string[]
  category: 'feature' | 'subscription' | 'gamification' | 'architecture' | 'clinical' | string
  description: string
  what_it_is_not: string
  workflow: string | null
  is_published: boolean
  last_reviewed: string
  created_at: string
}

interface FormState {
  id: string
  slug: string
  canonical_name: string
  aliases: string
  category: string
  description: string
  what_it_is_not: string
  workflow: string
  is_published: boolean
}

const emptyForm: FormState = {
  id: '',
  slug: '',
  canonical_name: '',
  aliases: '',
  category: 'feature',
  description: '',
  what_it_is_not: '',
  workflow: '',
  is_published: true,
}

export default function AdminHandbookPage() {
  const [entries, setEntries] = useState<HandbookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<HandbookEntry | null>(null)

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const { data, error } = await supabase
        .from('skincluv_handbook')
        .select('*')
        .order('category', { ascending: true })
        .order('canonical_name', { ascending: true })

      if (error) throw error
      setEntries((data as HandbookEntry[]) ?? [])
    } catch (err: any) {
      console.error('[AdminHandbook] Error loading:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat buku panduan.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter === 'published' && !item.is_published) return false
      if (statusFilter === 'draft' && item.is_published) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const name = item.canonical_name.toLowerCase()
      const slug = item.slug.toLowerCase()
      const desc = item.description.toLowerCase()
      const notDesc = item.what_it_is_not.toLowerCase()
      const aliases = (item.aliases || []).join(' ').toLowerCase()

      return (
        name.includes(q) ||
        slug.includes(q) ||
        desc.includes(q) ||
        notDesc.includes(q) ||
        aliases.includes(q)
      )
    })
  }, [entries, searchQuery, categoryFilter, statusFilter])

  const metrics = useMemo(() => {
    const total = entries.length
    const published = entries.filter((e) => e.is_published).length
    const drafts = total - published
    const categories = new Set(entries.map((e) => e.category)).size
    return { total, published, drafts, categories }
  }, [entries])

  const startEdit = (entry: HandbookEntry) => {
    setForm({
      id: entry.id,
      slug: entry.slug,
      canonical_name: entry.canonical_name,
      aliases: (entry.aliases || []).join(', '),
      category: entry.category,
      description: entry.description,
      what_it_is_not: entry.what_it_is_not,
      workflow: entry.workflow || '',
      is_published: entry.is_published,
    })
    setIsEditing(true)
  }

  const startNew = () => {
    setForm(emptyForm)
    setIsEditing(true)
  }

  const handleTogglePublish = async (entry: HandbookEntry) => {
    try {
      const nextStatus = !entry.is_published
      const { error } = await supabase
        .from('skincluv_handbook')
        .update({
          is_published: nextStatus,
          last_reviewed: new Date().toISOString(),
        })
        .eq('id', entry.id)

      if (error) throw error

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_published: nextStatus } : e))
      )
      setFeedback({
        type: 'success',
        message: `Status publikasi "${entry.canonical_name}" berhasil diubah menjadi ${
          nextStatus ? 'Aktif' : 'Draft'
        }.`,
      })
    } catch (err: any) {
      console.error('[AdminHandbook] Toggle error:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah status.' })
    }
  }

  const confirmDelete = async () => {
    if (!entryToDelete) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('skincluv_handbook')
        .delete()
        .eq('id', entryToDelete.id)

      if (error) throw error
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id))
      setFeedback({
        type: 'success',
        message: `Entri "${entryToDelete.canonical_name}" berhasil dihapus.`,
      })
      setEntryToDelete(null)
    } catch (err: any) {
      console.error('[AdminHandbook] Delete error:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus entri.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.canonical_name.trim() || !form.slug.trim() || !form.what_it_is_not.trim()) {
      setFeedback({
        type: 'error',
        message: 'Nama, slug, deskripsi, dan batasan "Apa itu BUKAN" wajib diisi.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const payload = {
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '_'),
      canonical_name: form.canonical_name.trim(),
      aliases: form.aliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      category: form.category,
      description: form.description.trim(),
      what_it_is_not: form.what_it_is_not.trim(),
      workflow: form.workflow.trim() || null,
      is_published: form.is_published,
      last_reviewed: new Date().toISOString(),
    }

    try {
      if (form.id) {
        const { error } = await supabase
          .from('skincluv_handbook')
          .update(payload)
          .eq('id', form.id)
        if (error) throw error
        setFeedback({
          type: 'success',
          message: `Entri "${payload.canonical_name}" berhasil diperbarui.`,
        })
      } else {
        const { error } = await supabase.from('skincluv_handbook').insert(payload)
        if (error) throw error
        setFeedback({
          type: 'success',
          message: `Entri "${payload.canonical_name}" berhasil ditambahkan ke buku panduan.`,
        })
      }
      setIsEditing(false)
      loadEntries()
    } catch (err: any) {
      console.error('[AdminHandbook] Save error:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan entri panduan.' })
    } finally {
      setIsSaving(false)
    }
  }

  const CATEGORY_CONFIG: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    feature: { label: 'Fitur Inti', bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' },
    billing: { label: 'Tagihan & Kredit', bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    subscription: { label: 'Paket Langganan', bg: '#fef9c3', text: '#a16207', border: '#fef08a' },
    gamification: { label: 'Gamifikasi & Misi', bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' },
    policy: { label: 'Kebijakan & Privasi', bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
    profile: { label: 'Profil Pengguna', bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
    architecture: { label: 'Arsitektur & Akun', bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    clinical: { label: 'Klinis & Medis', bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  }

  const getCategoryBadge = (category: string) => {
    const config = CATEGORY_CONFIG[category]
    if (config) {
      return { bg: config.bg, text: config.text, border: config.border, label: config.label }
    }
    return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: category }
  }

  // Preview Prompt yang diinjeksi ke LLM (Skinsistant)
  const renderedPromptPreview = useMemo(() => {
    const publishedList = entries.filter((e) => e.is_published)
    if (publishedList.length === 0) return 'Tidak ada entri panduan aktif.'
    let out = '[BUKU PANDUAN RESMI FITUR SKINCLUV (INTERNAL PRODUCT HANDBOOK)]:\n'
    publishedList.forEach((hb, idx) => {
      out += `${idx + 1}. ${hb.canonical_name} (Kategori: ${hb.category}):\n`
      out += `   - Deskripsi: ${hb.description}\n`
      out += `   - APA ITU BUKAN (PENTING): ${hb.what_it_is_not}\n`
    })
    out += `\n[HIERARKI OTORITAS PRODUK (INVARIAN 15)]: Database/Transaksi > Buku Panduan > LLM. Dilarang mengarang kuota/koin atau mengubah scope fitur di luar panduan ini.`
    return out
  }, [entries])

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
              <BookMarked size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Buku Panduan Fitur Skincluv
              </h1>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Ontologi produk internal untuk mencegah Skinsistant halusinasi fitur dan batasan
                layanan (RFC 013).
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPromptPreview((v) => !v)}
            title="Lihat simulasi prompt injeksi"
          >
            <FileCode size={14} />
            <span>{showPromptPreview ? 'Sembunyikan Prompt' : 'Simulasi Prompt LLM'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadEntries}
            disabled={isLoading}
            title="Segarkan data"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>Segarkan</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={14} />
            <span>Tambah Entri</span>
          </button>
        </div>
      </div>

      {/* Prompt Simulator Drawer */}
      {showPromptPreview && (
        <div
          style={{
            background: 'var(--color-surface-container-low)',
            border: '1px solid var(--color-secondary-container)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-md) var(--space-lg)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Simulasi Injeksi System Prompt (RFC 013 Handbook Context)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
              }}
            >
              Hanya entri dengan status &quot;Aktif&quot; yang diinjeksi ke AI
            </span>
          </div>
          <pre
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              maxHeight: 220,
              overflowY: 'auto',
              margin: 0,
              fontFamily: 'monospace',
            }}
          >
            {renderedPromptPreview}
          </pre>
        </div>
      )}

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            background: 'var(--color-surface-container-lowest, #ffffff)',
            border: '1px solid var(--color-secondary-container, #e5e7eb)',
            borderRadius: 'var(--radius-xl, 12px)',
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
              background: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookMarked size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Entri
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.total}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-surface-container-lowest, #ffffff)',
            border: '1px solid var(--color-secondary-container, #e5e7eb)',
            borderRadius: 'var(--radius-xl, 12px)',
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
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Entri Aktif (AI)
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
              {metrics.published}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-surface-container-lowest, #ffffff)',
            border: '1px solid var(--color-secondary-container, #e5e7eb)',
            borderRadius: 'var(--radius-xl, 12px)',
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
              background: '#f3f4f6',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <EyeOff size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Entri Draft
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>
              {metrics.drafts}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-surface-container-lowest, #ffffff)',
            border: '1px solid var(--color-secondary-container, #e5e7eb)',
            borderRadius: 'var(--radius-xl, 12px)',
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
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Kategori
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0284c7' }}>
              {metrics.categories}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 'var(--space-lg)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '0 12px',
            height: 38,
            flex: 1,
            minWidth: 260,
            maxWidth: 440,
            boxSizing: 'border-box',
          }}
        >
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Cari fitur, slug, definisi, atau apa yang bukan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              width: '100%',
              color: '#111827',
              height: '100%',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              fontSize: 13,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">Semua Kategori</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              fontSize: 13,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">Semua Status</option>
            <option value="published">Hanya Aktif</option>
            <option value="draft">Hanya Draft</option>
          </select>
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <div>Memuat buku panduan Skincluv...</div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'var(--color-surface-container-lowest)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-secondary-container)',
          }}
        >
          <Info size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>
            Tidak ada entri panduan yang sesuai
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Coba ubah kata kunci pencarian atau reset filter kategori di atas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredEntries.map((entry) => {
            const badge = getCategoryBadge(entry.category)
            return (
              <div
                key={entry.id}
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-secondary-container)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-md) var(--space-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  opacity: entry.is_published ? 1 : 0.65,
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 800,
                        color: 'var(--color-text-main)',
                      }}
                    >
                      {entry.canonical_name}
                    </span>
                    <code
                      style={{
                        fontSize: '0.6875rem',
                        background: 'var(--color-surface-container-low)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      slug: {entry.slug}
                    </code>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border || '#e5e7eb'}`,
                      }}
                    >
                      {badge.label}
                    </span>
                    {entry.is_published ? (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#10b981',
                          }}
                        />
                        Aktif di AI
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: '#f8fafc',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#94a3b8',
                          }}
                        />
                        Draft (Nonaktif)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(entry)}
                      title={entry.is_published ? 'Nonaktifkan entri ini dari injeksi AI' : 'Aktifkan entri ini ke injeksi AI'}
                      style={{
                        height: 32,
                        padding: '0 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s ease',
                        background: entry.is_published ? '#fff7ed' : '#ecfdf5',
                        color: entry.is_published ? '#c2410c' : '#047857',
                        border: `1px solid ${entry.is_published ? '#fed7aa' : '#a7f3d0'}`,
                      }}
                    >
                      {entry.is_published ? (
                        <>
                          <EyeOff size={14} />
                          <span>Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>Aktifkan</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      title="Edit rincian entri"
                      style={{
                        height: 32,
                        padding: '0 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s ease',
                        background: '#ffffff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryToDelete(entry)}
                      title="Hapus entri ini"
                      style={{
                        height: 32,
                        padding: '0 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Deskripsi */}
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
                  {entry.description}
                </div>

                {/* APA ITU BUKAN (KOTAK MERAH MUDA ANTI-HALUSINASI) */}
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: '0.75rem',
                    color: '#991b1b',
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong style={{ fontWeight: 800 }}>APA ITU BUKAN (ANTI-HALUSINASI): </strong>
                    <span>{entry.what_it_is_not}</span>
                  </div>
                </div>

                {/* Workflow & Aliases */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    borderTop: '1px solid var(--color-secondary-container)',
                    paddingTop: 8,
                    marginTop: 2,
                  }}
                >
                  {entry.workflow && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={13} />
                      <span>Alur: {entry.workflow}</span>
                    </div>
                  )}
                  {entry.aliases && entry.aliases.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={13} />
                      <span>Sinonim: {entry.aliases.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Edit / Tambah (Fixed Overlay Popup) */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setIsEditing(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-md)',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                {form.id ? 'Edit Entri Panduan' : 'Tambah Entri Panduan Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Nama Kanonikal Fitur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Misi Glow & Koin"
                    value={form.canonical_name}
                    onChange={(e) => setForm({ ...form, canonical_name: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', height: 38 }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Slug Identifikasi (Unik) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: misi_glow"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', height: 38 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Kategori *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', height: 38 }}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label} ({key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Sinonim / Aliases (Pisahkan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="misal: misi, tugas harian, klaim koin"
                    value={form.aliases}
                    onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', height: 38 }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Deskripsi Resmi Fitur *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan fungsi, tujuan, dan mekanisme fitur ini secara lugas..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#b91c1c',
                    marginBottom: 4,
                  }}
                >
                  APA ITU BUKAN (PENTING - Anti-Halusinasi AI) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tuliskan dengan tegas apa saja yang BUKAN bagian dari fitur ini agar AI tidak keliru menyamakan istilah (misal: 'Bukan produk skincare, bukan checklist medis')."
                  value={form.what_it_is_not}
                  onChange={(e) => setForm({ ...form, what_it_is_not: e.target.value })}
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderColor: '#fca5a5',
                    background: '#fffbfb',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Alur Pengguna (Workflow / User Journey)
                </label>
                <input
                  type="text"
                  placeholder="misal: Buka tab Misi -> Jalankan scan -> Klaim hadiah koin"
                  value={form.workflow}
                  onChange={(e) => setForm({ ...form, workflow: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', height: 38 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="is_published" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Publikasikan ke Injeksi Prompt AI (Skinsistant akan langsung membaca entri ini)
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 'var(--space-md)',
                  borderTop: '1px solid var(--color-secondary-container)',
                  paddingTop: 12,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Tambahkan ke Buku Panduan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus In-App (Tanpa window.confirm) */}
      {entryToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setEntryToDelete(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                  Hapus Entri Panduan
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                  Konfirmasi penghapusan data
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus permanen entri{' '}
              <strong>&quot;{entryToDelete.canonical_name}&quot;</strong> (<code>{entryToDelete.slug}</code>)?
              Entri ini tidak akan diinjeksi lagi ke Skinsistant AI.
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 8,
                paddingTop: 14,
                borderTop: '1px solid #f3f4f6',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEntryToDelete(null)}
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={15} />
                <span>{isLoading ? 'Menghapus...' : 'Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification (Tidak merusak layout halaman) */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10000,
            maxWidth: 380,
            padding: '12px 16px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#ffffff',
            color: '#111827',
            border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: feedback.type === 'success' ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <span style={{ flex: 1, fontSize: '0.8125rem', lineHeight: 1.4, fontWeight: 500 }}>
            {feedback.message}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
