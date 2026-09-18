import { useEffect, useState, useCallback } from 'react'
import { Package, Plus, CheckCircle2, AlertCircle, RefreshCw, Pencil, ExternalLink, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    <div className="admin-page-container" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Produk Rekomendasi Skincare
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Katalog produk untuk rekomendasi engine AI pada fitur Scan Wajah dan Skinsistant Chatbot.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button
            onClick={loadProducts}
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
            <Plus size={16} /> Produk Baru
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
            <Package size={18} color="#6366f1" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              {form.id ? 'Edit Data Produk' : 'Tambah Produk Baru ke Katalog'}
            </h2>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-grid-3col">
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Nama Produk <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="misal: 10% Niacinamide + Moisture Sabi Beet Serum"
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

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Brand
                </label>
                <input
                  placeholder="misal: Somethinc"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
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
                  Kategori <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  placeholder="misal: Serum, Toner, Cleanser"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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

            <div className="admin-grid-2col">
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Bahan Utama (Pisahkan dengan koma)
                </label>
                <input
                  placeholder="misal: Niacinamide, Sabiwhite, Beet Extract, Centella"
                  value={form.key_ingredients}
                  onChange={(e) => setForm({ ...form, key_ingredients: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4, display: 'block' }}>
                  Dipakai AI matching engine untuk mencocokkan dengan masalah kulit.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Tipe Kulit yang Cocok (Pisahkan dengan koma)
                </label>
                <input
                  placeholder="misal: all, oily, acne, sensitive, combination"
                  value={form.skin_type_fit}
                  onChange={(e) => setForm({ ...form, skin_type_fit: e.target.value })}
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

            <div className="admin-grid-2col">
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Estimasi Harga
                </label>
                <input
                  placeholder="misal: Rp 119.000 (20ml)"
                  value={form.price_estimate}
                  onChange={(e) => setForm({ ...form, price_estimate: e.target.value })}
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
                  URL Marketplace / Toko (Shopee / Tokopedia / Website)
                </label>
                <input
                  placeholder="https://shopee.co.id/..."
                  value={form.marketplace_url}
                  onChange={(e) => setForm({ ...form, marketplace_url: e.target.value })}
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

            <div className="admin-grid-3col">
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Tipe Listing
                </label>
                <select
                  value={form.listing_type}
                  onChange={(e) => setForm({ ...form, listing_type: e.target.value as Product['listing_type'] })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    background: '#ffffff',
                  }}
                >
                  <option value="organic">Organic (Rekomendasi Murni)</option>
                  <option value="affiliate">Affiliate (Komisi Referral)</option>
                  <option value="endorse">Endorse (Brand Partner)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Sponsor Weight (Prioritas)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 untuk produk organic biasa"
                  value={form.sponsor_weight}
                  onChange={(e) => setForm({ ...form, sponsor_weight: parseInt(e.target.value, 10) || 0 })}
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

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    Status Produk Aktif
                  </span>
                </label>
              </div>
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
                {isSaving ? 'Menyimpan...' : 'Simpan Produk'}
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

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari nama produk, brand, kategori, atau bahan utama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 13,
              boxSizing: 'border-box',
              background: '#ffffff',
            }}
          />
        </div>
      </div>

      {/* Tabel Katalog Produk */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} color="#4b5563" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              Katalog Produk ({filteredProducts.length} dari {products.length})
            </h2>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Nama Produk & Brand</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Kategori</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Bahan Utama</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Listing</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Harga</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: p.is_active ? '#ffffff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: p.is_active ? '#111827' : '#6b7280' }}>
                      {p.name}
                    </div>
                    {p.brand && (
                      <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                        {p.brand}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#f3f4f6',
                        color: '#374151',
                      }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px', maxWidth: 220 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(p.key_ingredients || []).slice(0, 3).map((ing, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11,
                            background: '#eff6ff',
                            color: '#1e40af',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {ing}
                        </span>
                      ))}
                      {(p.key_ingredients || []).length > 3 && (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          +{p.key_ingredients.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background:
                          p.listing_type === 'endorse'
                            ? '#fdf4ff'
                            : p.listing_type === 'affiliate'
                            ? '#dbeafe'
                            : '#f3f4f6',
                        color:
                          p.listing_type === 'endorse'
                            ? '#9333ea'
                            : p.listing_type === 'affiliate'
                            ? '#1d4ed8'
                            : '#4b5563',
                      }}
                    >
                      {p.listing_type}
                    </span>
                    {p.sponsor_weight > 0 && (
                      <span style={{ display: 'block', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                        w: {p.sponsor_weight}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>
                    {p.price_estimate || '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {p.is_active ? (
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
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {p.marketplace_url && (
                        <a
                          href={p.marketplace_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Link Produk"
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#4b5563',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button
                        onClick={() => startEdit(p)}
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
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
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
