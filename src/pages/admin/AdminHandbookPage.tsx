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
import '@/styles/admin-handbook.css'

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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = item.canonical_name.toLowerCase().includes(q)
        const matchSlug = item.slug.toLowerCase().includes(q)
        const matchDesc = item.description.toLowerCase().includes(q)
        const matchNot = item.what_it_is_not.toLowerCase().includes(q)
        const matchAliases = item.aliases?.some((a) => a.toLowerCase().includes(q))
        if (!matchName && !matchSlug && !matchDesc && !matchNot && !matchAliases) {
          return false
        }
      }

      return true
    })
  }, [entries, categoryFilter, statusFilter, searchQuery])

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
    setFeedback(null)
  }

  const startNew = () => {
    setForm(emptyForm)
    setIsEditing(true)
    setFeedback(null)
  }

  const handleTogglePublish = async (entry: HandbookEntry) => {
    try {
      const nextStatus = !entry.is_published
      const { error } = await supabase
        .from('skincluv_handbook')
        .update({ is_published: nextStatus, last_reviewed: new Date().toISOString() })
        .eq('id', entry.id)

      if (error) throw error

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_published: nextStatus } : e))
      )
      setFeedback({
        type: 'success',
        message: `Status entri "${entry.canonical_name}" diubah menjadi ${
          nextStatus ? 'Aktif (Terinjeksi ke AI)' : 'Draft (Nonaktif)'
        }.`,
      })
    } catch (err: any) {
      console.error('[AdminHandbook] Toggle error:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah status publikasi.' })
    }
  }

  const confirmDelete = async () => {
    if (!entryToDelete) return
    setIsLoading(true)
    try {
      const { error } = await supabase.from('skincluv_handbook').delete().eq('id', entryToDelete.id)
      if (error) throw error

      setFeedback({
        type: 'success',
        message: `Entri "${entryToDelete.canonical_name}" berhasil dihapus dari buku panduan.`,
      })
      setEntryToDelete(null)
      loadEntries()
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
    { label: string; badgeModifier: string }
  > = {
    feature: { label: 'Fitur Inti', badgeModifier: 'is-teal' },
    billing: { label: 'Tagihan & Kredit', badgeModifier: 'is-gold' },
    subscription: { label: 'Paket Langganan', badgeModifier: 'is-gold' },
    gamification: { label: 'Gamifikasi & Misi', badgeModifier: 'is-purple' },
    policy: { label: 'Kebijakan & Privasi', badgeModifier: 'is-purple' },
    profile: { label: 'Profil Pengguna', badgeModifier: 'is-rose' },
    architecture: { label: 'Arsitektur & Akun', badgeModifier: 'is-purple' },
    clinical: { label: 'Klinis & Medis', badgeModifier: 'is-teal' },
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
    <div className="admin-page-container admin-handbook-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            <BookMarked size={12} /> AI Ontology & Anti-Halusinasi
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Buku Panduan Fitur Skincluv
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Ontologi produk internal untuk mencegah Skinsistant halusinasi fitur dan batasan layanan (RFC 013 & Invarian 15).
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            type="button"
            className="cluv-btn is-outline is-sm"
            onClick={() => setShowPromptPreview((v) => !v)}
            title="Lihat simulasi prompt injeksi"
          >
            <FileCode size={14} />
            <span>{showPromptPreview ? 'Sembunyikan Prompt' : 'Simulasi Prompt LLM'}</span>
          </button>
          <button
            type="button"
            className="cluv-btn is-outline is-sm"
            onClick={loadEntries}
            disabled={isLoading}
            title="Segarkan data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            className="cluv-btn is-primary is-sm"
            onClick={startNew}
          >
            <Plus size={15} />
            <span>Tambah Entri</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`cluv-alert ${feedback.type === 'success' ? 'is-success' : 'is-danger'}`}
          style={{ marginBottom: 24 }}
        >
          <div className="cluv-alert-icon">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div className="cluv-alert-content">
            <p className="cluv-alert-message" style={{ fontWeight: 600 }}>{feedback.message}</p>
          </div>
        </div>
      )}

      {/* Prompt Simulator Drawer */}
      {showPromptPreview && (
        <div className="cluv-card is-compact" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} style={{ color: 'var(--cluv-teal)' }} />
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--cluv-neutral-900)' }}>
                Simulasi Injeksi System Prompt (RFC 013 Handbook Context)
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'var(--cluv-neutral-400)',
                fontWeight: 600,
              }}
            >
              Hanya entri dengan status &quot;Aktif&quot; yang diinjeksi ke AI
            </span>
          </div>
          <pre className="admin-handbook-code-block">
            {renderedPromptPreview}
          </pre>
        </div>
      )}

      {/* Metric Cards */}
      <div className="cluv-stat-grid cols-4" style={{ marginBottom: 24 }}>
        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-teal" style={{ marginBottom: 12 }}>
            <BookMarked size={18} />
          </div>
          <div className="cluv-stat-label">Total Entri</div>
          <div className="cluv-stat-value">{metrics.total}</div>
          <div className="cluv-stat-subtext">Katalog ontologi produk</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-teal" style={{ marginBottom: 12 }}>
            <CheckCircle2 size={18} />
          </div>
          <div className="cluv-stat-label">Aktif Di AI</div>
          <div className="cluv-stat-value">{metrics.published}</div>
          <div className="cluv-stat-subtext">Terinjeksi ke Skinsistant</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-neutral" style={{ marginBottom: 12 }}>
            <EyeOff size={18} />
          </div>
          <div className="cluv-stat-label">Entri Draft</div>
          <div className="cluv-stat-value">{metrics.drafts}</div>
          <div className="cluv-stat-subtext">Tersimpan nonaktif</div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-card-icon-wrap is-gold" style={{ marginBottom: 12 }}>
            <Layers size={18} />
          </div>
          <div className="cluv-stat-label">Kategori</div>
          <div className="cluv-stat-value">{metrics.categories}</div>
          <div className="cluv-stat-subtext">Taksonomi terdefinisi</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="cluv-card is-compact" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="admin-handbook-search-wrap">
            <Search size={16} className="admin-handbook-search-icon" />
            <input
              type="text"
              placeholder="Cari fitur, slug, definisi, atau apa yang bukan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-handbook-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="admin-handbook-clear-btn"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select"
              style={{ width: 180 }}
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
              className="admin-select"
              style={{ width: 140 }}
            >
              <option value="all">Semua Status</option>
              <option value="published">Hanya Aktif</option>
              <option value="draft">Hanya Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--cluv-neutral-400)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--cluv-teal)' }} />
          <div>Memuat buku panduan Skincluv...</div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="cluv-card" style={{ padding: 48, textAlign: 'center' }}>
          <Info size={32} style={{ color: 'var(--cluv-neutral-400)', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--cluv-neutral-900)' }}>
            Tidak ada entri panduan yang sesuai
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cluv-neutral-500)' }}>
            Coba ubah kata kunci pencarian atau reset filter kategori di atas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredEntries.map((entry) => {
            const catCfg = CATEGORY_CONFIG[entry.category]
            const badgeModifier = catCfg?.badgeModifier || 'is-neutral'
            const catLabel = catCfg?.label || entry.category

            return (
              <div
                key={entry.id}
                className={`cluv-card admin-handbook-entry-card ${!entry.is_published ? 'is-draft' : ''}`}
                style={{ padding: '18px 22px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 800,
                        color: 'var(--cluv-neutral-900)',
                      }}
                    >
                      {entry.canonical_name}
                    </span>
                    <code
                      style={{
                        fontSize: '0.6875rem',
                        background: 'var(--cluv-neutral-100)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: 'var(--cluv-neutral-600)',
                        fontFamily: 'var(--cluv-font-mono, monospace)',
                        border: '1px solid var(--cluv-border)',
                      }}
                    >
                      slug: {entry.slug}
                    </code>
                    <span className={`cluv-badge ${badgeModifier} is-sm`}>
                      {catLabel}
                    </span>
                    {entry.is_published ? (
                      <span className="cluv-badge is-teal is-sm">
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--cluv-teal)',
                          }}
                        />
                        Aktif di AI
                      </span>
                    ) : (
                      <span className="cluv-badge is-neutral is-sm">
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--cluv-neutral-400)',
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
                      className="cluv-btn is-outline is-sm"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      {entry.is_published ? (
                        <>
                          <EyeOff size={13} />
                          <span>Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <Eye size={13} />
                          <span>Aktifkan</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      title="Edit rincian entri"
                      className="cluv-btn is-outline is-sm"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryToDelete(entry)}
                      title="Hapus entri ini"
                      className="cluv-btn is-outline is-sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: 'var(--cluv-rose)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Deskripsi */}
                <div style={{ fontSize: '0.8125rem', color: 'var(--cluv-neutral-800)', lineHeight: 1.5, marginBottom: 8 }}>
                  {entry.description}
                </div>

                {/* APA ITU BUKAN (KOTAK MERAH MUDA ANTI-HALUSINASI) */}
                <div className="admin-handbook-anti-box">
                  <AlertTriangle size={15} className="admin-handbook-anti-icon" />
                  <div>
                    <strong style={{ fontWeight: 800 }}>APA ITU BUKAN (ANTI-HALUSINASI): </strong>
                    <span>{entry.what_it_is_not}</span>
                  </div>
                </div>

                {/* Workflow & Aliases */}
                {(entry.workflow || (entry.aliases && entry.aliases.length > 0)) && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 16,
                      fontSize: '0.75rem',
                      color: 'var(--cluv-neutral-400)',
                      borderTop: '1px solid var(--cluv-border)',
                      paddingTop: 8,
                      marginTop: 4,
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
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Edit / Tambah */}
      {isEditing && (
        <div className="cluv-modal-overlay" onClick={() => setIsEditing(false)}>
          <div
            className="cluv-modal-box is-lg"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cluv-modal-header">
              <h2 className="cluv-modal-title">
                {form.id ? 'Edit Entri Panduan' : 'Tambah Entri Panduan Baru'}
              </h2>
              <button
                type="button"
                className="cluv-modal-close"
                onClick={() => setIsEditing(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="cluv-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="admin-grid-2col">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 4 }}>
                      Nama Kanonikal Fitur <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Misi Glow & Koin"
                      value={form.canonical_name}
                      onChange={(e) => setForm({ ...form, canonical_name: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 4 }}>
                      Slug Identifikasi (Unik) <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: misi_glow"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-grid-2col">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 4 }}>
                      Kategori <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="admin-select"
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>
                          {cfg.label} ({key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 4 }}>
                      Sinonim / Aliases (Pisahkan koma)
                    </label>
                    <input
                      type="text"
                      placeholder="misal: misi, tugas harian, klaim koin"
                      value={form.aliases}
                      onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 4 }}>
                    Deskripsi Resmi Fitur <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Jelaskan fungsi, tujuan, dan mekanisme fitur ini secara lugas..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--cluv-rose)',
                      marginBottom: 4,
                    }}
                  >
                    APA ITU BUKAN (PENTING - Anti-Halusinasi AI) <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Tuliskan dengan tegas apa saja yang BUKAN bagian dari fitur ini agar AI tidak keliru menyamakan istilah (misal: 'Bukan produk skincare, bukan checklist medis')."
                    value={form.what_it_is_not}
                    onChange={(e) => setForm({ ...form, what_it_is_not: e.target.value })}
                    className="input-field"
                    style={{
                      borderColor: 'var(--cluv-rose-line)',
                      background: 'var(--cluv-rose-soft)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 4 }}>
                    Alur Pengguna (Workflow / User Journey)
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Buka tab Misi -> Jalankan scan -> Klaim hadiah koin"
                    value={form.workflow}
                    onChange={(e) => setForm({ ...form, workflow: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--cluv-teal)', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_published" style={{ fontSize: 13, fontWeight: 700, color: 'var(--cluv-neutral-800)', cursor: 'pointer' }}>
                    Publikasikan ke Injeksi Prompt AI (Skinsistant akan langsung membaca entri ini)
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: '16px 24px',
                  borderTop: '1px solid var(--cluv-border)',
                  background: 'var(--cluv-neutral-50)',
                }}
              >
                <button
                  type="button"
                  className="cluv-btn is-outline is-sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="cluv-btn is-primary is-sm"
                  disabled={isSaving}
                >
                  {isSaving ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Tambahkan ke Buku Panduan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {entryToDelete && (
        <div className="cluv-modal-overlay" onClick={() => setEntryToDelete(null)}>
          <div
            className="cluv-modal-box is-sm"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cluv-modal-body" style={{ padding: '24px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--cluv-rose-soft)',
                    color: 'var(--cluv-rose)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--cluv-neutral-900)' }}>
                    Hapus Entri Panduan
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--cluv-neutral-500)' }}>
                    Konfirmasi penghapusan data
                  </p>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--cluv-neutral-700)', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus permanen entri{' '}
                <strong>&quot;{entryToDelete.canonical_name}&quot;</strong> (<code>{entryToDelete.slug}</code>)?
                Entri ini tidak akan diinjeksi lagi ke Skinsistant AI.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '14px 24px',
                borderTop: '1px solid var(--cluv-border)',
                background: 'var(--cluv-neutral-50)',
              }}
            >
              <button
                type="button"
                className="cluv-btn is-outline is-sm"
                onClick={() => setEntryToDelete(null)}
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isLoading}
                className="cluv-btn is-primary is-sm"
                style={{ background: 'var(--cluv-rose)' }}
              >
                <Trash2 size={14} />
                <span>{isLoading ? 'Menghapus...' : 'Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
