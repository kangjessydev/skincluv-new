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
import '@/styles/admin-product-formulas.css'

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
    <div className="admin-page-container cluv-animate-fade">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-title-row">
            <div className="admin-header-icon-wrap" style={{ background: 'var(--cluv-rose-soft)', color: 'var(--cluv-rose)' }}>
              <FlaskConical size={22} />
            </div>
            <h1 className="admin-page-title">
              Database Formula Skincare &amp; Semantic Cache
            </h1>
          </div>
          <p className="admin-page-subtitle">
            Big Data formula produk yang dipelajari AI dari scan pengguna untuk menghemat token dan mempercepat respons scan ingredient.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={loadFormulas}
            disabled={isLoading}
            className="cluv-btn is-outline is-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {feedback && (
        <div className="cluv-alert is-danger cluv-mb-4">
          <AlertCircle size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="cluv-stat-grid cols-4">
        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-rose">
            <FlaskConical size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Formula Terdaftar</div>
            <div className="cluv-stat-value cluv-tabular-nums">{metrics.totalFormulas} formula</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-teal">
            <Zap size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Total Pemindaian / Hits</div>
            <div className="cluv-stat-value cluv-tabular-nums">{metrics.totalHits.toLocaleString('id-ID')} kali</div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-gold">
            <Coins size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Estimasi Token Terhemat</div>
            <div className="cluv-stat-value cluv-tabular-nums" style={{ color: 'var(--cluv-teal)' }}>
              {metrics.tokensSaved.toLocaleString('id-ID')} token
            </div>
          </div>
        </div>

        <div className="cluv-stat-card">
          <div className="cluv-stat-icon-wrap is-neutral">
            <Clock size={20} />
          </div>
          <div>
            <div className="cluv-stat-label">Efisiensi Latensi Cache</div>
            <div className="cluv-stat-value cluv-tabular-nums">
              &lt; 0.3s <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--cluv-neutral-500)' }}>(vs ~12s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="cluv-card apf-search-card">
        <div className="apf-search-wrap">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, brand, atau bahan aktif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="apf-search-input"
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
      </div>

      {/* Table Container */}
      <div className="cluv-card apf-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Nama Produk &amp; Brand</th>
                <th style={{ textAlign: 'center' }}>Safety Score</th>
                <th style={{ textAlign: 'center' }}>Total Scan Hit</th>
                <th style={{ textAlign: 'center' }}>Token Terhemat</th>
                <th style={{ textAlign: 'left' }}>Bahan Utama Terdaftar</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <div>Memuat database formula skincare...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--cluv-neutral-500)' }}>
                    <FlaskConical size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--cluv-neutral-800)' }}>Belum ada formula tersimpan</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      Formula produk akan diindeks otomatis setiap kali pengguna memindai label komposisi.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="apf-product-name">
                        {item.product_name}
                      </div>
                      {item.brand && (
                        <div className="apf-brand-name">
                          {item.brand}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`cluv-badge ${item.overall_safety_score >= 70 ? 'is-success' : 'is-warning'}`}>
                        {item.overall_safety_score} / 100
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="cluv-badge is-neutral cluv-tabular-nums">
                        {item.scan_hit_count}x scan
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', color: 'var(--cluv-teal)', fontWeight: 600 }} className="cluv-tabular-nums">
                      {item.estimated_tokens_saved ? item.estimated_tokens_saved.toLocaleString('id-ID') : '-'}
                    </td>

                    <td>
                      <div className="apf-ingredients-wrap">
                        {item.ingredients_list && item.ingredients_list.length > 0 ? (
                          item.ingredients_list.slice(0, 4).map((ing, idx) => (
                            <span key={idx} className="apf-tag-pill">
                              {ing}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--cluv-neutral-400)', fontSize: '0.75rem' }}>-</span>
                        )}
                        {item.ingredients_list && item.ingredients_list.length > 4 && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--cluv-neutral-500)', alignSelf: 'center' }}>
                            +{item.ingredients_list.length - 4} lainnya
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedFormula(item)}
                        className="cluv-btn is-outline is-sm"
                      >
                        <Eye size={13} /> Detail Formula
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
          className="cluv-modal-overlay"
          onClick={() => setSelectedFormula(null)}
        >
          <div
            className="cluv-modal-content"
            style={{ maxWidth: 760 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cluv-modal-header">
              <div>
                <h2 className="cluv-modal-title">
                  Detail Formula Skincare &amp; Cache
                </h2>
                <p className="cluv-modal-subtitle">
                  {selectedFormula.product_name} {selectedFormula.brand && `— ${selectedFormula.brand}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFormula(null)}
                className="cluv-modal-close-btn"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="cluv-modal-body">
              {/* Formula Hash Card */}
              <div className="apf-hash-box">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cluv-neutral-500)', textTransform: 'uppercase' }}>
                    Formula Semantic Hash
                  </div>
                  <code className="apf-hash-code">
                    {selectedFormula.formula_hash}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copyHash}
                  className="cluv-btn is-outline is-sm"
                  style={{ color: copiedHash ? 'var(--cluv-teal)' : 'inherit' }}
                >
                  {copiedHash ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedHash ? 'Tersalin' : 'Salin Hash'}</span>
                </button>
              </div>

              {/* Stats Summary */}
              <div className="cluv-stat-grid cols-3" style={{ margin: 0 }}>
                <div className="apf-modal-stat-box">
                  <div className="apf-modal-stat-label">Safety Score</div>
                  <div className="apf-modal-stat-val cluv-tabular-nums" style={{ color: 'var(--cluv-teal)' }}>
                    {selectedFormula.overall_safety_score} / 100
                  </div>
                </div>

                <div className="apf-modal-stat-box">
                  <div className="apf-modal-stat-label">Frekuensi Scan</div>
                  <div className="apf-modal-stat-val cluv-tabular-nums" style={{ color: 'var(--cluv-neutral-800)' }}>
                    {selectedFormula.scan_hit_count} kali
                  </div>
                </div>

                <div className="apf-modal-stat-box">
                  <div className="apf-modal-stat-label">Token Terhemat</div>
                  <div className="apf-modal-stat-val cluv-tabular-nums" style={{ color: 'var(--cluv-gold)' }}>
                    {selectedFormula.estimated_tokens_saved.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cluv-neutral-800)', marginBottom: 8 }}>
                  Bahan Terurai ({selectedFormula.ingredients_list?.length || 0} bahan)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedFormula.ingredients_list?.map((ing, idx) => (
                    <span key={idx} className="apf-tag-pill" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Raw Breakdown JSON Preview */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cluv-neutral-800)', marginBottom: 6 }}>
                  Verified Breakdown JSON
                </div>
                <pre className="apf-code-preview">
                  {JSON.stringify(selectedFormula.ingredients_breakdown, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="cluv-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedFormula(null)}
                className="cluv-btn is-outline is-sm"
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
