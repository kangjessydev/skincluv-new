import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BrainCircuit,
  Search,
  RefreshCw,
  User,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { UserClinicalMemory } from '@/types/database'

interface ClinicalMemoryRecord extends UserClinicalMemory {
  profiles?: {
    full_name: string | null
    username: string | null
  } | null
}

export default function AdminClinicalMemoryPage() {
  const [memories, setMemories] = useState<ClinicalMemoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadMemories = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const { data, error } = await supabase
        .from('user_clinical_memories')
        .select(`
          id,
          user_id,
          memory_type,
          entity,
          clinical_fact,
          confidence_score,
          source_feature,
          is_active,
          created_at,
          updated_at,
          profiles:user_id (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setMemories((data as unknown as ClinicalMemoryRecord[]) ?? [])
    } catch (err: any) {
      console.error('[AdminClinicalMemory] Error loading:', err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat memori klinis.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      if (typeFilter !== 'all' && m.memory_type !== typeFilter) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const user = m.profiles?.full_name?.toLowerCase() || ''
      const username = m.profiles?.username?.toLowerCase() || ''
      const entity = m.entity.toLowerCase()
      const fact = m.clinical_fact.toLowerCase()
      return user.includes(q) || username.includes(q) || entity.includes(q) || fact.includes(q)
    })
  }, [memories, searchQuery, typeFilter])

  const metrics = useMemo(() => {
    const total = memories.length
    const uniqueUsers = new Set(memories.map((m) => m.user_id)).size
    const allergies = memories.filter((m) => m.memory_type === 'allergy' || m.memory_type === 'sensitivity').length
    const activeMemories = memories.filter((m) => m.is_active).length
    return { total, uniqueUsers, allergies, activeMemories }
  }, [memories])

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_clinical_memories')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: !currentStatus } : m))
      )
      setFeedback({
        type: 'success',
        message: `Status memori klinis berhasil diubah menjadi ${!currentStatus ? 'Aktif' : 'Nonaktif'}.`,
      })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui status.' })
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'allergy':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Alergi' }
      case 'sensitivity':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Sensitivitas' }
      case 'treatment_reaction':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Reaksi Treatment' }
      case 'skin_trend':
        return { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8', label: 'Tren Kondisi' }
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: type }
    }
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
                background: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BrainCircuit size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Memori Klinis Pasien (Episodic AI Memory)
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Fakta klinis jangka panjang (alergi, sensitivitas, dan reaksi treatment) yang diingat oleh asisten AI untuk mempersonalisasi saran konsultasi.
          </p>
        </div>

        <button
          onClick={loadMemories}
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

      {/* Feedback */}
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
              background: '#ede9fe',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrainCircuit size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Fakta Klinis Tersimpan
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.total} memori
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
            <User size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Pasien dengan Profil Memori
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {metrics.uniqueUsers} pengguna
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
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Alergi & Sensitivitas
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>
              {metrics.allergies} catatan
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
              Memori Aktif Terhubung
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
              {metrics.activeMemories} aktif
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
            placeholder="Cari nama pasien, entitas bahan, atau fakta klinis..."
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          <option value="all">Semua Tipe Memori</option>
          <option value="allergy">Alergi</option>
          <option value="sensitivity">Sensitivitas</option>
          <option value="treatment_reaction">Reaksi Treatment</option>
          <option value="skin_trend">Tren Kondisi Kulit</option>
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
                  Pasien
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Tipe Memori
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Entitas Bahan / Pemicu
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Fakta Klinis yang Diserap AI
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Sumber Fitur
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                  Status Injeksi
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
                    <div>Memuat memori klinis AI...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                    <BrainCircuit size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>Belum ada fakta klinis tersimpan</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Memori klinis terbentuk secara otomatis dari riwayat chat dan evaluasi kulit pengguna.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const badge = getTypeBadge(item.memory_type)
                  const displayName = item.profiles?.full_name || item.profiles?.username || 'User'

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: item.is_active ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{displayName}</div>
                        {item.profiles?.username && (
                          <div style={{ fontSize: 11, color: '#6b7280' }}>@{item.profiles.username}</div>
                        )}
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
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#111827' }}>
                          {item.entity}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, color: '#374151', maxWidth: 420 }}>
                          {item.clinical_fact}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            background: '#f3f4f6',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {item.source_feature}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: item.is_active ? '#ecfdf5' : '#f3f4f6',
                            color: item.is_active ? '#059669' : '#9ca3af',
                          }}
                        >
                          {item.is_active ? 'Disuntikkan ke AI' : 'Dinonaktifkan'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => toggleActive(item.id, item.is_active)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: item.is_active ? '#dc2626' : '#059669',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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
    </div>
  )
}
