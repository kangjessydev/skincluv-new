import { useState, useRef, useCallback } from 'react'
import { Camera, Type, Upload, AlertCircle, Loader2, Info } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'

type Mode = 'photo' | 'text'
type Status = 'idle' | 'analyzing' | 'result' | 'error'

interface IngredientAnalysis {
  overall_verdict: 'safe' | 'caution' | 'avoid'
  score: number
  summary: string
  key_ingredients: Array<{
    name: string
    verdict: 'beneficial' | 'neutral' | 'caution' | 'avoid'
    reason: string
  }>
  tips: string
}

const VERDICT_COLORS = {
  safe: 'var(--color-success)',
  caution: 'var(--color-warning)',
  avoid: 'var(--color-error)',
  beneficial: 'var(--color-success)',
  neutral: 'var(--color-text-muted)'
}

const VERDICT_LABELS = {
  safe: 'Aman untuk Kulitmu',
  caution: 'Gunakan dengan Hati-hati',
  avoid: 'Sebaiknya Dihindari',
  beneficial: 'Bagus',
  neutral: 'Netral',
}

export default function IngredientScanPage() {
  const { activeSkinProfile } = useAuthStore()
  const { invoke, isLoading } = useInvokeAI()

  const [mode, setMode] = useState<Mode>('photo')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Text state
  const [ingredientsText, setIngredientsText] = useState('')
  
  // Photo state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [result, setResult] = useState<IngredientAnalysis | null>(null)

  const processImage = useCallback((file: File) => {
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const b64 = (e.target?.result as string).split(',')[1]
      setImageBase64(b64)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar')
      return
    }
    setErrorMsg(null)
    processImage(file)
  }

  const analyzeIngredients = async () => {
    if (mode === 'text' && !ingredientsText.trim()) {
      setErrorMsg('Masukkan daftar ingredients terlebih dahulu.')
      return
    }
    if (mode === 'photo' && !imageBase64) {
      setErrorMsg('Upload foto kemasan terlebih dahulu.')
      return
    }

    setStatus('analyzing')
    setErrorMsg(null)
    
    // Construct messages based on mode
    let content: Array<any> = []
    if (mode === 'text') {
      content = [{ text: `Tolong analisis daftar ingredients ini:\n\n${ingredientsText}` }]
    } else {
      content = [
        { inlineData: { mimeType: imageFile!.type, data: imageBase64 } },
        { text: 'Tolong ekstrak daftar ingredients dari gambar kemasan ini dan analisis.' }
      ]
    }

    const res = await invoke({
      feature_slug: 'ingredient_scan',
      messages: [{ role: 'user', content }]
    })

    if (!res) {
      setStatus('error')
      setErrorMsg('Gagal menganalisis. Coba lagi.')
      return
    }

    try {
      const cleaned = res.content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleaned) as IngredientAnalysis
      setResult(parsed)
      setStatus('result')
    } catch {
      setStatus('error')
      setErrorMsg('Format respons tidak valid. Coba ulangi.')
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setErrorMsg(null)
    setImageFile(null)
    setImagePreview(null)
    setImageBase64(null)
    setIngredientsText('')
  }

  return (
    <div className="ingredient-scan-page animate-fade-in">
      <div className="page-header">
        <h1>Ingredient Scan</h1>
        <p className="page-subtitle">Cek apakah produk cocok untuk kulit kamu</p>
      </div>

      {!activeSkinProfile && (
        <div className="missing-profile-alert">
          <Info size={20} />
          <div>
            <strong>Belum ada Profil Kulit</strong>
            <p>Untuk hasil yang akurat, lakukan Face Scan terlebih dahulu agar AI mengetahui tipe kulitmu.</p>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div className="scan-input-area">
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
              onClick={() => setMode('photo')}
            >
              <Camera size={18} /> Foto Kemasan
            </button>
            <button 
              className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              <Type size={18} /> Teks Manual
            </button>
          </div>

          <div className="input-container animate-fade-in">
            {mode === 'photo' ? (
              <div className="photo-mode">
                {imagePreview ? (
                  <div className="preview-container">
                    <img src={imagePreview} alt="Ingredients" className="preview-img" />
                    <button className="btn btn-ghost btn-sm btn-change" onClick={() => setImagePreview(null)}>
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <div 
                    className="drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={32} className="drop-icon" />
                    <p>Upload Foto Ingredients</p>
                    <span className="drop-hint">Pastikan tulisan terbaca jelas</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="text-mode">
                <textarea
                  className="ingredient-textarea"
                  placeholder="Ketik atau paste daftar ingredients di sini..."
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  rows={6}
                />
              </div>
            )}
            
            {errorMsg && <p className="error-text">{errorMsg}</p>}
            
            <button 
              className="btn btn-primary btn-block mt-md" 
              onClick={analyzeIngredients}
              disabled={isLoading}
            >
              Cek Keamanan Produk
            </button>
          </div>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="loading-state animate-fade-in">
          <Loader2 size={48} className="animate-spin loading-spinner" />
          <h3>Menganalisis Ingredients...</h3>
          <p>Mencocokkan dengan profil kulit kamu</p>
        </div>
      )}

      {status === 'result' && result && (
        <div className="result-area animate-slide-up">
          <div 
            className="verdict-card glass-card"
            style={{ borderTop: `4px solid ${VERDICT_COLORS[result.overall_verdict]}` }}
          >
            <h2 style={{ color: VERDICT_COLORS[result.overall_verdict] }}>
              {VERDICT_LABELS[result.overall_verdict]}
            </h2>
            <div className="score-ring">
              <span className="score-value">{result.score}</span>
              <span className="score-label">/100</span>
            </div>
            <p className="summary-text">{result.summary}</p>
          </div>

          <div className="key-ingredients-list">
            <h3>Bahan Utama</h3>
            {result.key_ingredients.map((item, idx) => (
              <div key={idx} className="ingredient-item">
                <div className="ingredient-header">
                  <span className="ingredient-name">{item.name}</span>
                  <span 
                    className="ingredient-badge"
                    style={{ 
                      backgroundColor: `${VERDICT_COLORS[item.verdict]}20`,
                      color: VERDICT_COLORS[item.verdict],
                      borderColor: `${VERDICT_COLORS[item.verdict]}40`
                    }}
                  >
                    {VERDICT_LABELS[item.verdict]}
                  </span>
                </div>
                <p className="ingredient-reason">{item.reason}</p>
              </div>
            ))}
          </div>

          <div className="tips-card">
            <h4>💡 Tips Penggunaan</h4>
            <p>{result.tips}</p>
          </div>

          <button className="btn btn-secondary btn-block mt-lg" onClick={reset}>
            Scan Produk Lain
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="result-area animate-fade-in">
          <div className="verdict-card glass-card" style={{ borderColor: 'var(--color-error)' }}>
            <AlertCircle size={48} color="var(--color-error)" />
            <h2>Terjadi Kesalahan</h2>
            <p>{errorMsg}</p>
            <button className="btn btn-primary mt-md" onClick={reset}>Coba Lagi</button>
          </div>
        </div>
      )}

      <style>{`
        .ingredient-scan-page {
          padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-xl));
        }
        .page-header { margin-bottom: var(--space-lg); }
        .page-header h1 { font-size: 1.75rem; }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 4px; }

        .missing-profile-alert {
          display: flex;
          gap: var(--space-sm);
          background: rgba(234, 179, 8, 0.15);
          border: 1px solid rgba(234, 179, 8, 0.3);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-lg);
          color: #fef08a;
          font-size: 0.875rem;
        }

        .mode-toggle {
          display: flex;
          background: var(--color-surface-glass);
          padding: 4px;
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-md);
        }
        .mode-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .mode-btn.active {
          background: var(--gradient-brand);
          color: white;
          box-shadow: 0 4px 12px rgba(107, 33, 168, 0.2);
        }

        .input-container { margin-bottom: var(--space-xl); }

        .drop-zone {
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl) var(--space-lg);
          text-align: center;
          cursor: pointer;
          background: rgba(255,255,255,0.02);
          transition: border-color var(--transition-fast);
        }
        .drop-zone:hover { border-color: var(--color-brand-400); }
        .drop-icon { color: var(--color-brand-300); margin-bottom: var(--space-sm); }
        .drop-hint { display: block; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; }

        .preview-container { position: relative; }
        .preview-img { width: 100%; border-radius: var(--radius-lg); max-height: 400px; object-fit: contain; background: black; }
        .btn-change { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); color: white; border: none; }

        .ingredient-textarea {
          width: 100%;
          background: var(--color-surface-glass);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          color: var(--color-text);
          font-family: inherit;
          resize: vertical;
        }
        .ingredient-textarea:focus { border-color: var(--color-brand-400); outline: none; }

        .error-text { color: var(--color-error); font-size: 0.875rem; margin-top: 8px; }
        .mt-md { margin-top: var(--space-md); }
        .mt-lg { margin-top: var(--space-lg); }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          text-align: center;
          gap: var(--space-sm);
        }
        .loading-spinner { color: var(--color-brand-400); margin-bottom: var(--space-md); }

        .result-area { display: flex; flex-direction: column; gap: var(--space-md); }
        
        .verdict-card {
          text-align: center;
          padding: var(--space-xl) var(--space-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .verdict-card h2 { font-size: 1.5rem; }
        .score-ring {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 6px solid var(--color-brand-400);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        .score-value { font-size: 2rem; font-weight: 800; line-height: 1; }
        .score-label { font-size: 0.75rem; color: var(--color-text-muted); }
        .summary-text { font-size: 0.9375rem; line-height: 1.6; color: var(--color-text-secondary); }

        .key-ingredients-list h3 { font-size: 1.125rem; margin-bottom: var(--space-sm); margin-top: var(--space-md); }
        .ingredient-item {
          background: var(--color-surface-glass);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          margin-bottom: var(--space-sm);
        }
        .ingredient-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xs);
        }
        .ingredient-name { font-weight: 700; font-size: 0.9375rem; }
        .ingredient-badge {
          font-size: 0.6875rem;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ingredient-reason { font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.5; }

        .tips-card {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
        }
        .tips-card h4 { color: #38bdf8; margin-bottom: 4px; font-size: 0.9375rem; }
        .tips-card p { font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6; }
      `}</style>
    </div>
  )
}
