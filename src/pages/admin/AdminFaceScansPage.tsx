import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ScanFace,
  Search,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  User,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FaceScanRecord {
  id: string
  user_id: string
  overall_score: number
  skin_status_title: string | null
  skin_type: string
  skin_concerns: string[]
  analysis_notes: string | null
  area_evaluations: any
  product_recommendations: any
  raw_ai_response: any
  created_at: string
  profiles?: {
    full_name: string | null
    username: string | null
  } | null
}

export default function AdminFaceScansPage() {
  const [scans, setScans] = useState<FaceScanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScan, setSelectedScan] = useState<FaceScanRecord | null>(null)
  const [copiedJson, setCopiedJson] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadFaceScans = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('face_scans')
        .select(`
          id,
          user_id,
          overall_score,
          skin_status_title,
          skin_type,
          skin_concerns,
          analysis_notes,
          area_evaluations,
          product_recommendations,
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
      setScans((data as unknown as FaceScanRecord[]) ?? [])
    } catch (err: any) {
      console.error('[AdminFaceScans] Error loading scans:', err)
      setErrorMessage(err.message || 'Gagal memuat riwayat scan wajah.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFaceScans()
  }, [loadFaceScans])

  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scans
    const q = searchQuery.toLowerCase()
    return scans.filter((s) => {
      const name = s.profiles?.full_name?.toLowerCase() || ''
      const user = s.profiles?.username?.toLowerCase() || ''
      const type = s.skin_type.toLowerCase()
      const title = s.skin_status_title?.toLowerCase() || ''
      const concerns = s.skin_concerns.join(' ').toLowerCase()
      return (
        name.includes(q) ||
        user.includes(q) ||
        type.includes(q) ||
        title.includes(q) ||
        concerns.includes(q)
      )
    })
  }, [scans, searchQuery])

  const copyJsonToClipboard = () => {
    if (!selectedScan) return
    navigator.clipboard.writeText(JSON.stringify(selectedScan.raw_ai_response, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' }
    if (score >= 60) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' }
    return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' }
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
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ScanFace size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Database Scan Wajah AI
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Riwayat memori analisis scan wajah seluruh pengguna, skor kesehatan kulit, dan rekomendasi klinis AI.
          </p>
        </div>

        <button
          onClick={loadFaceScans}
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
          placeholder="Cari berdasarkan nama user, tipe kulit, status, atau skin concerns..."
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
                  Waktu Scan
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Skor Kulit
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Tipe & Status
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Skin Concerns Terdeteksi
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
                    <div>Memuat riwayat scan wajah...</div>
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <ScanFace size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Tidak ada riwayat scan wajah</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {searchQuery ? 'Coba ganti kata kunci pencarian.' : 'Belum ada data scan wajah yang tersimpan.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan) => {
                  const scoreTheme = getScoreColor(scan.overall_score)
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
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6b7280',
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

                      <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color="#9ca3af" />
                          <span>{scanDate}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 38,
                            height: 28,
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 13,
                            background: scoreTheme.bg,
                            color: scoreTheme.text,
                            border: `1px solid ${scoreTheme.border}`,
                          }}
                        >
                          {scan.overall_score}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: '#f3f4f6',
                              color: '#374151',
                              textTransform: 'uppercase',
                            }}
                          >
                            {scan.skin_type}
                          </span>
                        </div>
                        {scan.skin_status_title && (
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                            {scan.skin_status_title}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {scan.skin_concerns && scan.skin_concerns.length > 0 ? (
                            scan.skin_concerns.map((c, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  fontWeight: 500,
                                }}
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
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
              maxWidth: 820,
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
                  Detail Memori Scan Wajah
                </h2>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  ID: <code style={{ color: '#4b5563' }}>{selectedScan.id}</code>
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
              {/* Summary Banner */}
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
                    Overall Health Score
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    {selectedScan.overall_score}/100
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Tipe Kulit
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginTop: 2, textTransform: 'uppercase' }}>
                    {selectedScan.skin_type}
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

              {/* Analysis Notes */}
              {selectedScan.analysis_notes && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    <Sparkles size={15} color="#6366f1" /> Catatan Analisis Klinis
                  </div>
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      color: '#334155',
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedScan.analysis_notes}
                  </div>
                </div>
              )}

              {/* Area Evaluations */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  <Layers size={15} color="#4f46e5" /> Evaluasi Per Zona Wajah
                </div>
                {Array.isArray(selectedScan.area_evaluations) && selectedScan.area_evaluations.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {selectedScan.area_evaluations.map((area: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: 12,
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                            {area.area || area.name || `Area ${idx + 1}`}
                          </span>
                          {area.score !== undefined && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                              {area.score}/100
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {area.evaluation || area.status || area.description || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    Data zona evaluasi tidak tersedia.
                  </div>
                )}
              </div>

              {/* Product Recommendations */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  <Activity size={15} color="#059669" /> Rekomendasi Produk & Treatment
                </div>
                {Array.isArray(selectedScan.product_recommendations) && selectedScan.product_recommendations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedScan.product_recommendations.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: '10px 14px',
                          background: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                            {rec.product_name || rec.name || rec.type || `Rekomendasi ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {rec.reason || rec.instruction || rec.step || '-'}
                          </div>
                        </div>
                        {rec.category && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              background: '#eff6ff',
                              color: '#2563eb',
                              fontWeight: 600,
                            }}
                          >
                            {rec.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    Tidak ada produk yang direkomendasikan.
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
