import { useState, useRef } from 'react'
import { FileText, Camera, Upload, RotateCcw, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, ChevronRight, Info, ShieldCheck, HelpCircle, BookOpen } from 'lucide-react'
import { useInvokeAI } from '@/hooks/useInvokeAI'

type InputMode = 'text' | 'image'
type Step = 'input' | 'analyzing' | 'result' | 'error'

interface IngredientItem {
  name: string
  function: string
  safety_level: 'safe' | 'caution' | 'avoid'
  notes: string
}

interface IngredientAnalysisResult {
  product_name?: string
  safety_score: number
  overall_recommendation: string
  key_ingredients: IngredientItem[]
}

const SAMPLE_INGREDIENTS = [
  'Aqua, Niacinamide 5%, Hyaluronic Acid, Centella Asiatica Extract, Phenoxyethanol, Ethylhexylglycerin',
  'Water, Salicylic Acid 2%, Glycolic Acid 7%, Alcohol Denat, Fragrance, Parabens',
  'Aqua, Glycerin, Ceramide NP, Squalane, Tocopherol, Panthenol, Xanthan Gum',
]

export default function IngredientScanPage() {
  const { invoke } = useInvokeAI()

  const [mode, setMode] = useState<InputMode>('text')
  const [step, setStep] = useState<Step>('input')
  const [ingredientText, setIngredientText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<IngredientAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP)')
      return
    }
    setErrorMsg(null)
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (mode === 'text' && !ingredientText.trim()) {
      setErrorMsg('Masukkan teks komposisi produk terlebih dahulu.')
      return
    }
    if (mode === 'image' && !imageBase64) {
      setErrorMsg('Pilih foto kemasan produk terlebih dahulu.')
      return
    }

    setStep('analyzing')
    setErrorMsg(null)

    try {
      const input_context: Record<string, string> = {}
      if (mode === 'text') input_context.ingredient_text = ingredientText
      if (mode === 'image' && imageBase64) input_context.image_base64 = imageBase64

      const result = await invoke<IngredientAnalysisResult>({
        feature_slug: 'ingredient_scan',
        messages: [{ role: 'user', content: mode === 'text' ? ingredientText : 'Analisis komposisi dari foto kemasan produk ini.' }],
        input_context,
      })

      if (!result || typeof result !== 'object') {
        setErrorMsg('Gagal menganalisis komposisi produk. Silakan periksa teks/foto dan coba lagi.')
        setStep('error')
        return
      }

      setAnalysis(result)
      setStep('result')
    } catch (err: any) {
      console.error('Ingredient scan error:', err)
      setErrorMsg(err.message || 'Gagal menganalisis komposisi produk.')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('input')
    setIngredientText('')
    setImagePreview(null)
    setImageBase64(null)
    setAnalysis(null)
    setErrorMsg(null)
  }

  const getSafetyBadge = (level: 'safe' | 'caution' | 'avoid') => {
    switch (level) {
      case 'safe':
        return <span className="safety-badge safety-badge--safe"><CheckCircle2 size={12} /> Aman</span>
      case 'caution':
        return <span className="safety-badge safety-badge--caution"><Info size={12} /> Perhatian</span>
      case 'avoid':
        return <span className="safety-badge safety-badge--avoid"><AlertCircle size={12} /> Hindari</span>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score--good'
    if (score >= 60) return 'score--medium'
    return 'score--poor'
  }

  return (
    <div className="ingredient-page animate-fade-in">
      <div className="page-header">
        <h1>Cek Komposisi Skincare</h1>
        <p className="page-subtitle">Pindai foto kemasan atau ketik daftar bahan untuk mendeteksi bahaya & kesesuaian produk.</p>
      </div>

      {/* Input mode tabs */}
      {step === 'input' && (
        <div className="mode-tabs">
          <button
            className={`tab-btn ${mode === 'text' ? 'tab-btn--active' : ''}`}
            onClick={() => setMode('text')}
          >
            <FileText size={16} /> Ketik Komposisi
          </button>
          <button
            className={`tab-btn ${mode === 'image' ? 'tab-btn--active' : ''}`}
            onClick={() => setMode('image')}
          >
            <Camera size={16} /> Scan Foto Kemasan
          </button>
        </div>
      )}

      {/* Full-Width 2-Column Grid Layout */}
      <div className="ingredient-grid">
        {/* Left Column (7 Cols): Main Action Canvas */}
        <div className="scan-main-col">
          {step === 'input' && (
            <div className="input-card stich-bento-card">
              {mode === 'text' ? (
                <div className="text-mode">
                  <label className="input-label">Daftar Bahan / Ingredients (dipisah koma):</label>
                  <textarea
                    className="ingredient-textarea"
                    rows={6}
                    placeholder="Contoh: Aqua, Niacinamide, Glycerin, Centella Asiatica Extract..."
                    value={ingredientText}
                    onChange={(e) => setIngredientText(e.target.value)}
                  />

                  <div className="samples-box">
                    <span className="samples-label">Coba contoh produk:</span>
                    <div className="sample-buttons">
                      {SAMPLE_INGREDIENTS.map((sample, idx) => (
                        <button
                          key={idx}
                          className="sample-btn"
                          onClick={() => setIngredientText(sample)}
                        >
                          Sampel #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="image-mode">
                  {!imagePreview ? (
                    <div
                      className="drop-zone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="drop-zone-icon-box">
                        <Camera size={36} />
                      </div>
                      <h3 className="drop-zone-title">Upload Foto Kemasan Produk</h3>
                      <p className="drop-zone-sub">Foto bagian daftar bahan (Ingredients) secara jelas</p>
                      <span className="drop-zone-hint">Format JPG, PNG, WEBP (Maksimal 5MB)</span>
                      <button className="btn btn-primary btn-sm mt-sm">
                        <Upload size={16} /> Pilih Foto
                      </button>
                    </div>
                  ) : (
                    <div className="preview-box">
                      <img src={imagePreview} alt="Kemasan" className="preview-img" />
                      <button className="btn btn-secondary btn-sm mt-sm" onClick={() => { setImagePreview(null); setImageBase64(null) }}>
                        <RotateCcw size={16} /> Ganti Foto
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              )}

              {errorMsg && <div className="error-box"><AlertCircle size={16} /> {errorMsg}</div>}

              <button
                className="btn btn-primary btn-block mt-lg"
                onClick={analyze}
                disabled={mode === 'text' ? !ingredientText.trim() : !imageBase64}
              >
                <Sparkles size={16} /> Mulai Pindai Komposisi
              </button>
            </div>
          )}

          {/* ANALYZING LOADING */}
          {step === 'analyzing' && (
            <div className="loading-card stich-bento-card">
              <Loader2 size={44} className="animate-spin loading-spinner" />
              <h3>Menganalisis Kandungan Skincare...</h3>
              <p>Memeriksa potensi komedogenik, iritan, & kecocokan dengan jenis kulitmu.</p>
            </div>
          )}

          {/* RESULT */}
          {step === 'result' && analysis && (
            <div className="result-container animate-fade-in">
              <div className="ingredients-list-card stich-bento-card">
                <h3>Detail Kandungan Terdeteksi ({analysis.key_ingredients.length})</h3>
                <div className="ingredients-stack">
                  {analysis.key_ingredients.map((item, idx) => (
                    <div key={idx} className="ingredient-item">
                      <div className="ingredient-main">
                        <span className="ingredient-name">{item.name}</span>
                        {getSafetyBadge(item.safety_level)}
                      </div>
                      <span className="ingredient-fn">Fungsi: {item.function}</span>
                      <p className="ingredient-notes">{item.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="action-row mt-md">
                <button className="btn btn-primary btn-block" onClick={reset}>
                  <RotateCcw size={16} /> Pindai Produk Lain
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="error-card stich-bento-card animate-fade-in">
              <AlertCircle size={44} className="error-icon" />
              <h2>Analisis Gagal</h2>
              <p>{errorMsg}</p>
              <button className="btn btn-primary btn-block" onClick={reset}>
                <RotateCcw size={16} /> Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 Cols): Side Info / Safety Score Result */}
        <div className="scan-side-col">
          {step === 'result' && analysis ? (
            <div className={`score-card stich-bento-card ${getScoreColor(analysis.safety_score)}`}>
              <div className="score-header">
                <div>
                  <span className="score-meta">Tingkat Keamanan Produk</span>
                  <div className="score-display">
                    <span className="score-num">{analysis.safety_score}</span>
                    <span className="score-denom">/100</span>
                  </div>
                </div>
                <div className="score-ring">
                  <ShieldCheck size={36} />
                </div>
              </div>
              <p className="recommendation-text">{analysis.overall_recommendation}</p>
            </div>
          ) : (
            <>
              {/* Guide Card */}
              <div className="stich-bento-card guide-card">
                <h3><BookOpen size={18} className="text-sky" /> Panduan Komposisi Skincare</h3>
                <p>AI Skincluv akan mencocokkan setiap nama kimia produk dengan database dermatologi untuk mendeteksi:</p>
                <ul className="guide-list">
                  <li>🟢 <strong>Bahan Aman & Melembabkan:</strong> Hyaluronic Acid, Niacinamide, Glycerin, Ceramides.</li>
                  <li>🟡 <strong>Perhatian Terbatas:</strong> Eksfoliator (AHA/BHA), Retinol, Fragrance.</li>
                  <li>🔴 <strong>Potensi Iritasi / Alergi:</strong> Alcohol Denat konsentrasi tinggi, Paraben sintetis.</li>
                </ul>
              </div>

              <div className="stich-bento-card help-card">
                <HelpCircle size={24} className="text-sky mb-xs" />
                <h4>Di mana menemukan label komposisi?</h4>
                <p>Cari bagian "Ingredients" atau "Komposisi" di bagian belakang dus kotak atau kemasan botol produkmu.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .ingredient-page { padding-bottom: 60px; width: 100%; }
        .page-header { margin-bottom: var(--space-lg); }
        .page-header h1 { font-size: 1.875rem; margin: 0 0 4px 0; color: var(--color-primary); font-family: var(--font-heading); }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin: 0; }

        .mode-tabs { display: flex; gap: var(--space-xs); margin-bottom: var(--space-lg); background: var(--color-surface-container); padding: 4px; border-radius: var(--radius-lg); max-width: 500px; }
        .tab-btn {
          flex: 1; padding: 10px; border-radius: var(--radius-md); border: none; background: transparent;
          font-family: var(--font-heading); font-size: 0.875rem; font-weight: 600; color: var(--color-secondary);
          display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s;
        }
        .tab-btn--active { background: var(--color-surface-container-lowest); color: var(--color-primary); box-shadow: var(--shadow-sm); font-weight: 700; }

        /* 2-Column Grid Layout */
        .ingredient-grid {
          display: grid; grid-template-columns: 1fr; gap: var(--space-lg); width: 100%;
        }
        @media (min-width: 900px) {
          .ingredient-grid {
            grid-template-columns: 7fr 5fr;
          }
        }

        .stich-bento-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sky);
          margin-bottom: var(--space-lg);
        }

        .input-label { font-size: 0.875rem; font-weight: 600; color: var(--color-text-main); margin-bottom: 8px; display: block; }
        .ingredient-textarea {
          width: 100%; padding: 14px; border: 1px solid var(--color-secondary-container); border-radius: var(--radius-lg);
          font-family: var(--font-body); font-size: 0.875rem; background: var(--color-surface-container-low); color: var(--color-text-main);
          resize: vertical; outline: none; transition: border 0.2s;
        }
        .ingredient-textarea:focus { border-color: var(--color-primary-container); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15); }

        .samples-box { margin-top: var(--space-md); }
        .samples-label { font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-bottom: 6px; }
        .sample-buttons { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
        .sample-btn {
          padding: 4px 10px; background: var(--color-secondary-container); border: 1px solid var(--color-secondary-fixed-dim);
          border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; color: var(--color-primary); cursor: pointer;
        }

        .drop-zone {
          border: 2px dashed var(--color-secondary-fixed-dim); text-align: center; cursor: pointer;
          border-radius: var(--radius-lg); padding: var(--space-xl); background: var(--color-surface-container-low);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .drop-zone-icon-box {
          width: 56px; height: 56px; border-radius: 50%; background: var(--color-secondary-fixed); color: var(--color-primary);
          display: flex; align-items: center; justify-content: center;
        }
        .drop-zone-title { font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--color-text-main); }
        .drop-zone-sub { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; }
        .drop-zone-hint { font-size: 0.75rem; color: var(--color-secondary); }

        .preview-box { text-align: center; }
        .preview-img { max-height: 300px; border-radius: var(--radius-lg); border: 1px solid var(--color-secondary-container); }

        .loading-card { text-align: center; padding: var(--space-2xl); display: flex; flex-direction: column; align-items: center; gap: var(--space-md); }
        .loading-spinner { color: var(--color-primary); }

        .score-card { display: flex; flex-direction: column; gap: var(--space-md); }
        .score-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .score-meta { font-size: 0.8125rem; font-weight: 700; color: var(--color-secondary); text-transform: uppercase; }
        .score-display { display: flex; align-items: baseline; gap: 4px; }
        .score-num { font-size: 3rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-heading); line-height: 1; }
        .score-denom { font-size: 1rem; color: var(--color-text-muted); }
        .score-ring { width: 56px; height: 56px; border-radius: 50%; background: var(--color-secondary-container); color: var(--color-primary); display: flex; align-items: center; justify-content: center; }
        .recommendation-text { font-size: 0.9375rem; color: var(--color-text-main); line-height: 1.6; margin: 0; }

        .ingredients-list-card h3 { font-size: 1.125rem; margin: 0 0 var(--space-md) 0; }
        .ingredients-stack { display: flex; flex-direction: column; gap: var(--space-sm); }
        .ingredient-item {
          padding: var(--space-md); border-radius: var(--radius-lg); background: var(--color-surface-container-low);
          border: 1px solid var(--color-secondary-container);
        }
        .ingredient-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .ingredient-name { font-weight: 700; font-size: 0.9375rem; color: var(--color-text-main); }
        .safety-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.6875rem; font-weight: 700; }
        .safety-badge--safe { background: var(--color-success-soft); color: var(--color-success); border: 1px solid #bbf7d0; }
        .safety-badge--caution { background: var(--color-tertiary-fixed); color: var(--color-tertiary); border: 1px solid #fde68a; }
        .safety-badge--avoid { background: #fef2f2; color: var(--color-error); border: 1px solid #fecaca; }

        .ingredient-fn { font-size: 0.75rem; color: var(--color-primary); font-weight: 600; display: block; margin-bottom: 4px; }
        .ingredient-notes { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; line-height: 1.5; }

        .guide-card h3 { font-size: 1rem; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; }
        .guide-card p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0 0 12px 0; }
        .guide-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem; color: var(--color-text-muted); }

        .help-card h4 { font-size: 0.9375rem; margin: 0 0 4px 0; color: var(--color-text-main); }
        .help-card p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; }
        .text-sky { color: var(--color-primary); }
        .mt-sm { margin-top: var(--space-sm); }
        .mt-md { margin-top: var(--space-md); }
        .mt-lg { margin-top: var(--space-lg); }
        .mb-xs { margin-bottom: var(--space-xs); }
        .btn-block { width: 100%; justify-content: center; }
      `}</style>
    </div>
  )
}
