import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  FlaskConical,
  Search,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface IngredientScanRecord {
  id: string
  user_id: string
  product_name: string
  brand: string | null
  safety_score: number | null
  is_safe: boolean
  matched_concerns: string[]
  key_ingredients: string[]
  ingredients_breakdown: any
  raw_ai_response: any
  created_at: string
  profiles?: {
    full_name: string | null
    username: string | null
  } | null
}

export default function AdminIngredientScansPage() {
  const [scans, setScans] = useState<IngredientScanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScan, setSelectedScan] = useState<IngredientScanRecord | null>(null)
  const [copiedJson, setCopiedJson] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadIngredientScans = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('ingredient_scans')
        .select(`
          id,
          user_id,
          product_name,
          brand,
          safety_score,
          is_safe,
          matched_concerns,
          key_ingredients,
          ingredients_breakdown,
          raw_ai_response,
          created_at,
          profiles:user_id (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setScans((data as unknown as IngredientScanRecord[]) ?? [])
    } catch (err: any) {
      console.error('[AdminIngredientScans] Error loading scans:', err)
      setErrorMessage(err.message || 'Gagal memuat riwayat scan ingredient.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIngredientScans()
  }, [loadIngredientScans])

  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scans
    const q = searchQuery.toLowerCase()
    return scans.filter((s) => {
      const name = s.profiles?.full_name?.toLowerCase() || ''
      const user = s.profiles?.username?.toLowerCase() || ''
      const prod = s.product_name.toLowerCase()
      const brand = s.brand?.toLowerCase() || ''
      const keys = (s.key_ingredients || []).join(' ').toLowerCase()
      return (
        name.includes(q) ||
        user.includes(q) ||
        prod.includes(q) ||
        brand.includes(q) ||
        keys.includes(q)
      )
    })
  }, [scans, searchQuery])

  const copyJsonToClipboard = () => {
    if (!selectedScan) return
    navigator.clipboard.writeText(JSON.stringify(selectedScan.raw_ai_response, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const getBadgeColor = (badge?: string) => {
    switch (badge?.toLowerCase()) {
      case 'aman':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Aman' }
      case 'hati':
      case 'perlu_perhatian':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Hati-hati' }
      case 'hindari':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Hindari' }
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: badge || 'Netral' }
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
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
              Database Scan Ingredient AI
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Riwayat komposisi produk skincare yang diekstrak dan dianalisis oleh AI untuk seluruh pengguna.
          </p>
        </div>

        <button
          onClick={loadIngredientScans}
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
      {errorMessage && (
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
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
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
          placeholder="Cari berdasarkan nama user, nama produk, brand, atau bahan aktif..."
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
                  Pengguna
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Nama Produk & Brand
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Waktu Scan
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Safety Score
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Status
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Bahan Utama
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
                    <div>Memuat riwayat scan ingredient...</div>
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <FlaskConical size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Tidak ada riwayat scan ingredient</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {searchQuery ? 'Coba ganti kata kunci pencarian.' : 'Belum ada data scan ingredient yang tersimpan.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan) => {
                  const displayName = scan.profiles?.full_name || scan.profiles?.username || 'User'
                  const scanDate = new Date(scan.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr
                      key={scan.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#fdf2f8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#db2777',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            <User size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{displayName}</div>
                            {scan.profiles?.username && (
                              <div style={{ fontSize: 11, color: '#6b7280' }}>@{scan.profiles.username}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{scan.product_name}</div>
                        {scan.brand && (
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{scan.brand}</div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color="#9ca3af" />
                          <span>{scanDate}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {scan.safety_score !== null ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: 13,
                              background: scan.safety_score >= 70 ? '#ecfdf5' : '#fffbeb',
                              color: scan.safety_score >= 70 ? '#059669' : '#d97706',
                              border: `1px solid ${scan.safety_score >= 70 ? '#a7f3d0' : '#fde68a'}`,
                            }}
                          >
                            {scan.safety_score}/100
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: scan.is_safe ? '#ecfdf5' : '#fff1f2',
                            color: scan.is_safe ? '#059669' : '#e11d48',
                            border: `1px solid ${scan.is_safe ? '#a7f3d0' : '#fecdd3'}`,
                          }}
                        >
                          {scan.is_safe ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                          {scan.is_safe ? 'Aman' : 'Perhatian'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {scan.key_ingredients && scan.key_ingredients.length > 0 ? (
                            scan.key_ingredients.slice(0, 3).map((ing, i) => (
                              <span
                                key={i}
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
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                          )}
                          {scan.key_ingredients && scan.key_ingredients.length > 3 && (
                            <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>
                              +{scan.key_ingredients.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedScan(scan)}
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
                          <Eye size={13} /> Detail
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

      {/* Detail Modal */}
      {selectedScan && (
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
          onClick={() => setSelectedScan(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 860,
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
                  Detail Hasil Analisis Komposisi Skincare
                </h2>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Produk: <strong style={{ color: '#111827' }}>{selectedScan.product_name}</strong>
                  {selectedScan.brand && ` (${selectedScan.brand})`}
                </div>
              </div>

              <button
                onClick={() => setSelectedScan(null)}
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
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  background: '#f9fafb',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #f3f4f6',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Pengguna
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginTop: 2 }}>
                    {selectedScan.profiles?.full_name || selectedScan.profiles?.username || 'User'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Safety Score
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    {selectedScan.safety_score !== null ? `${selectedScan.safety_score}/100` : 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Status Rekomendasi
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: selectedScan.is_safe ? '#059669' : '#e11d48', marginTop: 2 }}>
                    {selectedScan.is_safe ? 'Aman Sesuai Profil' : 'Perlu Diwaspadai'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Waktu Scan
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
                    {new Date(selectedScan.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Ingredients Breakdown Table */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  <FileText size={15} color="#db2777" /> Breakdown Kandungan Komposisi
                </div>

                {Array.isArray(selectedScan.ingredients_breakdown) && selectedScan.ingredients_breakdown.length > 0 ? (
                  <div
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>
                            Nama Bahan
                          </th>
                          <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>
                            Kategori
                          </th>
                          <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>
                            Fungsi
                          </th>
                          <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>
                            Catatan / Interaksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScan.ingredients_breakdown.map((item: any, idx: number) => {
                          const badge = getBadgeColor(item.badge)
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>
                                {item.name}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 10,
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
                              <td style={{ padding: '8px 12px', color: '#4b5563' }}>
                                {item.function || '-'}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                                {item.notes || item.interaction || '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    Data rincian bahan tidak tersedia.
                  </div>
                )}
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                    Raw AI Output Response (JSON)
                  </span>
                  <button
                    onClick={copyJsonToClipboard}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: copiedJson ? '#059669' : '#374151',
                    }}
                  >
                    {copiedJson ? <Check size={12} /> : <Copy size={12} />}
                    {copiedJson ? 'Tersalin!' : 'Salin JSON'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: 14,
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    maxHeight: 220,
                  }}
                >
                  {JSON.stringify(selectedScan.raw_ai_response, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f9fafb',
              }}
            >
              <button
                onClick={() => setSelectedScan(null)}
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
