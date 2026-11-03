import { useEffect, useState, useCallback } from 'react'
import { Package, Plus, CheckCircle2, AlertCircle, RefreshCw, Pencil, ExternalLink, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '@/styles/admin-products.css'

interface Product {
  id: string
  name: string
  brand: string | null
  category: string
  key_ingredients: string[]
  skin_type_fit: string[]
  price_estimate: string | null
  marketplace_url: string | null
  listing_type: 'organic' | 'affiliate' | 'endorse'
  sponsor_weight: number
  is_active: boolean
  created_at: string
}

interface ProductFormState {
  id: string
  name: string
  brand: string
  category: string
  key_ingredients: string
  skin_type_fit: string
  price_estimate: string
  marketplace_url: string
  listing_type: 'organic' | 'affiliate' | 'endorse'
  sponsor_weight: number
  is_active: boolean
}

const emptyForm: ProductFormState = {
  id: '',
  name: '',
  brand: '',
  category: 'Serum',
  key_ingredients: '',
  skin_type_fit: 'all, oily, acne',
  price_estimate: '',
  marketplace_url: '',
  listing_type: 'organic',
  sponsor_weight: 0,
  is_active: true,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts((data ?? []) as Product[])
    } catch (err: any) {
      console.error('[AdminProducts] Error loading products:', err)
      setFeedback({ type: 'error', message: `Gagal memuat produk: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand ?? '',
      category: p.category,
      key_ingredients: (p.key_ingredients || []).join(', '),
      skin_type_fit: (p.skin_type_fit || []).join(', '),
      price_estimate: p.price_estimate ?? '',
      marketplace_url: p.marketplace_url ?? '',
      listing_type: p.listing_type,
      sponsor_weight: p.sponsor_weight,
      is_active: p.is_active,
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
    if (!form.name.trim() || !form.category.trim()) {
      setFeedback({ type: 'error', message: 'Nama produk dan Kategori wajib diisi.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category.trim(),
      key_ingredients: form.key_ingredients
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      skin_type_fit: form.skin_type_fit
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      price_estimate: form.price_estimate.trim() || null,
      marketplace_url: form.marketplace_url.trim() || null,
      listing_type: form.listing_type,
      sponsor_weight: form.sponsor_weight,
      is_active: form.is_active,
    }

    try {
      const { error } = form.id
        ? await supabase.from('products').update(payload).eq('id', form.id)
        : await supabase.from('products').insert(payload)

      if (error) throw error

      setFeedback({
        type: 'success',
        message: form.id ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan ke katalog rekomendasi.',
      })
      setIsEditing(false)
      await loadProducts()
    } catch (err: any) {
      console.error('[AdminProducts] Gagal menyimpan produk:', err)
      setFeedback({ type: 'error', message: `Gagal menyimpan: ${err.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.key_ingredients.some((ing) => ing.toLowerCase().includes(q))
    )
  })

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-title">
          <div className="cluv-badge is-teal is-sm" style={{ marginBottom: 6 }}>
            <Package size={12} /> Katalog & Afiliasi
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Produk Rekomendasi Skincare
          </h1>
          <p style={{ color: 'var(--cluv-neutral-500)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Katalog produk untuk rekomendasi engine AI pada fitur Scan Wajah dan Skinsistant Chatbot.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            onClick={loadProducts}
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
            <span>Produk Baru</span>
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
        <div className="cluv-card admin-products-card">
          <div className="admin-products-header">
            <div className="cluv-card-icon-wrap is-teal">
              <Package size={18} />
            </div>
            <div>
              <h2 className="admin-products-title">
                {form.id ? 'Edit Data Produk' : 'Tambah Produk Baru ke Katalog'}
              </h2>
              <p className="admin-products-desc">
                Informasi produk, bahan utama, kategori, serta tautan marketplace mitra.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-grid-3col">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Nama Produk <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                </label>
                <input
                  placeholder="misal: 10% Niacinamide + Moisture Sabi Beet Serum"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Brand
                </label>
                <input
                  placeholder="misal: Somethinc"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Kategori <span style={{ color: 'var(--cluv-rose)' }}>*</span>
                </label>
                <input
                  placeholder="misal: Serum, Toner, Cleanser"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>
            </div>

            <div className="admin-grid-2col">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Bahan Utama (Pisahkan dengan koma)
                </label>
                <input
                  placeholder="misal: Niacinamide, Sabiwhite, Beet Extract, Centella"
                  value={form.key_ingredients}
                  onChange={(e) => setForm({ ...form, key_ingredients: e.target.value })}
                  className="admin-input"
                />
                <span style={{ fontSize: 11, color: 'var(--cluv-neutral-400)', marginTop: 4, display: 'block' }}>
                  Dipakai AI matching engine untuk mencocokkan dengan masalah kulit pengguna.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Tipe Kulit yang Cocok (Pisahkan dengan koma)
                </label>
                <input
                  placeholder="misal: all, oily, acne, sensitive, combination"
                  value={form.skin_type_fit}
                  onChange={(e) => setForm({ ...form, skin_type_fit: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            <div className="admin-grid-2col">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Estimasi Harga
                </label>
                <input
                  placeholder="misal: Rp 119.000 (20ml)"
                  value={form.price_estimate}
                  onChange={(e) => setForm({ ...form, price_estimate: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  URL Marketplace / Toko (Shopee / Tokopedia / Website)
                </label>
                <input
                  placeholder="https://shopee.co.id/..."
                  value={form.marketplace_url}
                  onChange={(e) => setForm({ ...form, marketplace_url: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            <div className="admin-grid-3col">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Tipe Listing
                </label>
                <select
                  value={form.listing_type}
                  onChange={(e) => setForm({ ...form, listing_type: e.target.value as Product['listing_type'] })}
                  className="admin-select"
                >
                  <option value="organic">Organic (Rekomendasi Murni)</option>
                  <option value="affiliate">Affiliate (Komisi Referral)</option>
                  <option value="endorse">Endorse (Brand Partner)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cluv-neutral-700)', marginBottom: 6 }}>
                  Sponsor Weight (Prioritas)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 untuk produk organic biasa"
                  value={form.sponsor_weight}
                  onChange={(e) => setForm({ ...form, sponsor_weight: parseInt(e.target.value, 10) || 0 })}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--cluv-teal)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cluv-neutral-800)' }}>
                    Status Produk Aktif
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                disabled={isSaving}
                className="cluv-btn is-primary is-sm"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Produk'}
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

      {/* Filter & Search Bar */}
      <div className="cluv-card is-compact" style={{ padding: '12px 16px', marginBottom: 20 }}>
        <div className="admin-products-search-wrap">
          <Search size={16} className="admin-products-search-icon" />
          <input
            type="text"
            placeholder="Cari nama produk, brand, kategori, atau bahan utama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-products-search-input"
          />
        </div>
      </div>

      {/* Tabel Katalog Produk */}
      <div className="cluv-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cluv-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} style={{ color: 'var(--cluv-teal)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--cluv-neutral-900)', margin: 0 }}>
              Katalog Produk ({filteredProducts.length} dari {products.length})
            </h2>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 260 }}>NAMA PRODUK & BRAND</th>
                <th style={{ width: 130 }}>KATEGORI</th>
                <th>BAHAN UTAMA</th>
                <th style={{ textAlign: 'center', width: 110 }}>LISTING</th>
                <th style={{ width: 140 }}>ESTIMASI HARGA</th>
                <th style={{ textAlign: 'center', width: 100 }}>STATUS</th>
                <th style={{ textAlign: 'right', width: 120 }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className="admin-table-row"
                  style={!p.is_active ? { opacity: 0.7 } : {}}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--cluv-neutral-900)' }}>
                      {p.name}
                    </div>
                    {p.brand && (
                      <span className="cluv-badge is-purple is-sm" style={{ marginTop: 4 }}>
                        {p.brand}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="cluv-badge is-neutral is-sm">
                      {p.category}
                    </span>
                  </td>
                  <td style={{ maxWidth: 240 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(p.key_ingredients || []).slice(0, 3).map((ing, idx) => (
                        <span
                          key={idx}
                          className="cluv-badge is-teal is-sm"
                        >
                          {ing}
                        </span>
                      ))}
                      {(p.key_ingredients || []).length > 3 && (
                        <span style={{ fontSize: 11, color: 'var(--cluv-neutral-400)', alignSelf: 'center', fontWeight: 600 }}>
                          +{p.key_ingredients.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`cluv-badge ${
                        p.listing_type === 'endorse'
                          ? 'is-purple'
                          : p.listing_type === 'affiliate'
                          ? 'is-gold'
                          : 'is-neutral'
                      } is-sm`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {p.listing_type}
                    </span>
                    {p.sponsor_weight > 0 && (
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--cluv-neutral-400)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                        w: {p.sponsor_weight}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--cluv-neutral-600)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                    {p.price_estimate || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`cluv-badge ${p.is_active ? 'is-teal' : 'is-neutral'} is-sm`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {p.marketplace_url && (
                        <a
                          href={p.marketplace_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Link Produk"
                          className="cluv-btn is-outline is-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button
                        onClick={() => startEdit(p)}
                        className="cluv-btn is-outline is-sm"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--cluv-neutral-400)' }}>
                    {searchQuery ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada produk terdaftar di katalog.'}
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
