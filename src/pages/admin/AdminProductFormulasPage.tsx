import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  FlaskConical,
  Search,
  RefreshCw,
  Eye,
  X,
  Zap,
  Coins,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SkincareProductFormula } from '@/types/database'

export default function AdminProductFormulasPage() {
  const [formulas, setFormulas] = useState<SkincareProductFormula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormula, setSelectedFormula] = useState<SkincareProductFormula | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadFormulas = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const { data, error } = await supabase
        .from('skincare_product_formulas')
        .select('*')
        .order('scan_hit_count', { ascending: false })
        .limit(200)

      if (error) throw error
      setFormulas((data as SkincareProductFormula[]) ?? [])
    } catch (err: any) {
      console.error('[AdminProductFormulas] Error loading formulas:', err)
      setFeedback(err.message || 'Gagal memuat formula produk.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFormulas()
  }, [loadFormulas])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return formulas
    const q = searchQuery.toLowerCase()
    return formulas.filter((f) => {
      const name = f.product_name.toLowerCase()
      const brand = f.brand?.toLowerCase() || ''
      const ingredients = (f.ingredients_list || []).join(' ').toLowerCase()
      return name.includes(q) || brand.includes(q) || ingredients.includes(q)
    })
  }, [formulas, searchQuery])

  const metrics = useMemo(() => {
    const totalFormulas = formulas.length
    const totalHits = formulas.reduce((acc, f) => acc + (f.scan_hit_count || 1), 0)
    const tokensSaved = formulas.reduce((acc, f) => acc + (f.estimated_tokens_saved || 0), 0)
    // Formula count that has more than 1 scan hit (cache activated)
    const reusedFormulas = formulas.filter((f) => f.scan_hit_count > 1).length
    return { totalFormulas, totalHits, tokensSaved, reusedFormulas }
  }, [formulas])

  const copyHash = () => {
    if (!selectedFormula) return
    navigator.clipboard.writeText(selectedFormula.formula_hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1360, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#fdf2f8',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Database Formula Skincare & Semantic Cache
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Big Data formula produk yang dipelajari AI dari scan pengguna untuk menghemat token dan mempercepat respons scan ingredient.
          </p>
        </div>

        <button
          onClick={loadFormulas}
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
      </div>

      {/* Error Feedback */}
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
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          }}
        >
          <AlertCircle size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
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
            <FlaskConical size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Formula Produk Terdaftar
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.totalFormulas} formula
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
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Pemindaian / Hits
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.totalHits.toLocaleString('id-ID')} kali
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
            <Coins size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Estimasi Token Terhemat
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
              {metrics.tokensSaved.toLocaleString('id-ID')} token
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
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Efisiensi Latensi Cache
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              &lt; 0.3s <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(vs ~12s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          alignItems: 'center',
        }}
      >
        <Search size={18} color="#9ca3af" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama produk, brand, atau bahan aktif..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: 14,
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
              padding: 2,
            }}
          >
            <X size={16} />
          </button>
        )}
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
                  Nama Produk & Brand
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Safety Score
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Total Scan Hit
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Token Terhemat
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Bahan Utama Terdaftar
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat database formula skincare...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <FlaskConical size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Belum ada formula tersimpan</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Formula produk akan diindeks otomatis setiap kali user melakukan scan label.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>
                        {item.product_name}
                      </div>
                      {item.brand && (
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {item.brand}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: item.overall_safety_score >= 70 ? '#ecfdf5' : '#fffbeb',
                          color: item.overall_safety_score >= 70 ? '#059669' : '#d97706',
                          border: `1px solid ${item.overall_safety_score >= 70 ? '#a7f3d0' : '#fde68a'}`,
                        }}
                      >
                        {item.overall_safety_score} / 100
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          background: item.scan_hit_count > 1 ? '#eff6ff' : '#f3f4f6',
                          color: item.scan_hit_count > 1 ? '#1d4ed8' : '#374151',
                        }}
                      >
                        {item.scan_hit_count}x scan
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                      {item.estimated_tokens_saved ? item.estimated_tokens_saved.toLocaleString('id-ID') : '-'}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.ingredients_list && item.ingredients_list.length > 0 ? (
                          item.ingredients_list.slice(0, 4).map((ing, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 11,
                                background: '#f3f4f6',
                                color: '#374151',
                              }}
                            >
                              {ing}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 11 }}>-</span>
                        )}
                        {item.ingredients_list && item.ingredients_list.length > 4 && (
                          <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>
                            +{item.ingredients_list.length - 4} lainnya
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedFormula(item)}
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
                        <Eye size={12} /> Detail Formula
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedFormula && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setSelectedFormula(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 780,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                  Detail Formula Skincare & Cache
                </h2>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>
                  {selectedFormula.product_name} {selectedFormula.brand && `— ${selectedFormula.brand}`}
                </div>
              </div>

              <button
                onClick={() => setSelectedFormula(null)}
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

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Formula Hash Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Formula Semantic Hash
                  </div>
                  <code style={{ fontSize: 11, color: '#0f172a', wordBreak: 'break-all' }}>
                    {selectedFormula.formula_hash}
                  </code>
                </div>
                <button
                  onClick={copyHash}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: copiedHash ? '#059669' : '#334155',
                  }}
                >
                  {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                  {copiedHash ? 'Tersalin' : 'Salin Hash'}
                </button>
              </div>

              {/* Stats Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}
              >
                <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Safety Score
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    {selectedFormula.overall_safety_score} / 100
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Frekuensi Scan
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8', marginTop: 2 }}>
                    {selectedFormula.scan_hit_count} kali
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Token Terhemat
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed', marginTop: 2 }}>
                    {selectedFormula.estimated_tokens_saved.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Bahan Terurai ({selectedFormula.ingredients_list?.length || 0} bahan)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedFormula.ingredients_list?.map((ing, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        background: '#f3f4f6',
                        color: '#1f2937',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Raw Breakdown JSON Preview */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Verified Breakdown JSON
                </div>
                <pre
                  style={{
                    margin: 0,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    maxHeight: 180,
                  }}
                >
                  {JSON.stringify(selectedFormula.ingredients_breakdown, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f9fafb',
              }}
            >
              <button
                onClick={() => setSelectedFormula(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
