import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, RotateCcw, Loader2, CheckCircle2, AlertCircle, ChevronRight, Sparkles, ShieldCheck, Activity, Info, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'

type Step = 'upload' | 'validating' | 'valid' | 'invalid' | 'analyzing' | 'result' | 'error'

interface ValidationResult {
  is_valid_face: boolean
  reason: string
  confidence: number
}

interface AnalysisResult {
  skin_type: 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive'
  skin_concerns: string[]
  analysis_notes: string
  confidence: number
}

const SKIN_TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  oily: 'Berminyak',
  dry: 'Kering',
  combination: 'Kombinasi',
  sensitive: 'Sensitif',
}

const CONCERN_LABELS: Record<string, string> = {
  acne: 'Jerawat',
  hyperpigmentation: 'Hiperpigmentasi',
  wrinkles: 'Kerutan',
  dryness: 'Kering',
  oiliness: 'Berminyak',
  sensitivity: 'Sensitif',
  redness: 'Kemerahan',
  dark_circles: 'Mata Panda',
  pores: 'Pori Besar',
}

export default function FaceScanPage() {
  const { user, activeSkinProfile, setActiveSkinProfile } = useAuthStore()
  const { invoke, isLoading } = useInvokeAI()

  const [step, setStep] = useState<Step>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback((file: File) => {
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
    setStep('upload')
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 5MB')
      return
    }
    setErrorMsg(null)
    processImage(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processImage(file)
  }

  const validateFace = async () => {
    if (!imageBase64) return
    setStep('validating')
    setErrorMsg(null)

    try {
      const result = await invoke<ValidationResult>({
        feature_slug: 'face_validation',
        messages: [{ role: 'user', content: 'Validasi foto wajah ini untuk kejelasan & pencahayaan.' }],
        input_context: { image_base64: imageBase64 },
      })

      if (!result || typeof result !== 'object') {
        setErrorMsg('Gagal memvalidasi foto wajah. Silakan pastikan foto wajah terlihat jelas dan coba lagi.')
        setStep('error')
        return
      }

      setValidation(result)
      if (result.is_valid_face) {
        setStep('valid')
      } else {
        setStep('invalid')
      }
    } catch (err: any) {
      console.error('Validation error:', err)
      setErrorMsg(err.message || 'Gagal memvalidasi foto wajah.')
      setStep('error')
    }
  }

  const analyzeSkin = async () => {
    if (!imageBase64) return
    setStep('analyzing')
    setErrorMsg(null)

    try {
      const result = await invoke<AnalysisResult>({
        feature_slug: 'face_analysis',
        messages: [{ role: 'user', content: 'Analisis kondisi kulit wajah secara detail.' }],
        input_context: { image_base64: imageBase64 },
      })

      if (!result || typeof result !== 'object') {
        setErrorMsg('Gagal menganalisis kulit wajah. Silakan coba lagi.')
        setStep('error')
        return
      }

      setAnalysis(result)
      setStep('result')

      if (user && result.skin_type) {
        try {
          const { data: existing } = await supabase
            .from('skin_profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          let savedProfile = null
          if (existing?.id) {
            const { data } = await supabase
              .from('skin_profiles')
              .update({
                skin_type: result.skin_type,
                skin_concerns: result.skin_concerns ?? [],
              })
              .eq('id', existing.id)
              .select()
              .single()
            savedProfile = data
          } else {
            const { data } = await supabase
              .from('skin_profiles')
              .insert({
                user_id: user.id,
                skin_type: result.skin_type,
                skin_concerns: result.skin_concerns ?? [],
                is_active: true,
              })
              .select()
              .single()
            savedProfile = data
          }

          if (savedProfile) {
            setActiveSkinProfile(savedProfile)
          }
        } catch (dbErr) {
          console.warn('Save skin_profile error:', dbErr)
        }
      }
    } catch (err: any) {
      console.error('Analysis error:', err)
      setErrorMsg(err.message || 'Gagal menganalisis kondisi kulit.')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('upload')
    setImageFile(null)
    setImagePreview(null)
    setImageBase64(null)
    setValidation(null)
    setAnalysis(null)
    setErrorMsg(null)
  }

  return (
    <div className="face-scan-page animate-fade-in">
      <div className="page-header">
        <h1>Analisis Kondisi Wajah</h1>
        <p className="page-subtitle">Ambil atau unggah foto selfie wajahmu untuk deteksi tipe & masalah kulit secara mendalam.</p>
      </div>

      {/* Stich Step Bar Indicator */}
      <div className="step-bar">
        <div className={`step-item ${['upload', 'validating', 'valid', 'invalid', 'analyzing', 'result'].includes(step) ? 'step-item--done' : ''}`}>
          <div className="step-dot">1</div>
          <span>Upload</span>
          <div className={`step-line ${['validating', 'valid', 'analyzing', 'result'].includes(step) ? 'step-line--done' : ''}`} />
        </div>

        <div className={`step-item ${['validating', 'valid', 'analyzing', 'result'].includes(step) ? 'step-item--done' : ''}`}>
          <div className="step-dot">2</div>
          <span>Validasi</span>
          <div className={`step-line ${['analyzing', 'result'].includes(step) ? 'step-line--done' : ''}`} />
        </div>

        <div className={`step-item ${['analyzing', 'result'].includes(step) ? 'step-item--done' : ''}`}>
          <div className="step-dot">3</div>
          <span>Analisis</span>
          <div className={`step-line ${step === 'result' ? 'step-line--done' : ''}`} />
        </div>

        <div className={`step-item ${step === 'result' ? 'step-item--done' : ''}`}>
          <div className="step-dot">4</div>
          <span>Hasil</span>
        </div>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="facescan-grid">
        {/* Left Column (7 Cols): Scanner Canvas */}
        <div className="scan-main-col">
          {/* Step UPLOAD & PREVIEW */}
          {step === 'upload' && (
            <div className="upload-area">
              {!imagePreview ? (
                <div
                  className="drop-zone stich-bento-card"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="drop-zone-icon-box">
                    <Camera size={36} />
                  </div>
                  <h3 className="drop-zone-title">Upload Foto Wajah</h3>
                  <p className="drop-zone-sub">Drag & drop atau klik untuk memilih foto selfie</p>
                  <span className="drop-zone-hint">Format JPG, PNG, WEBP (Maksimal 5MB)</span>
                  
                  <div className="drop-zone-actions">
                    <button className="btn btn-primary btn-sm">
                      <Upload size={16} /> Pilih Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-container stich-bento-card">
                  <img src={imagePreview} alt="Preview Wajah" className="preview-img" />
                  <div className="preview-actions">
                    <button className="btn btn-secondary btn-sm" onClick={reset}>
                      <RotateCcw size={16} /> Ganti Foto
                    </button>
                    <button className="btn btn-primary" onClick={validateFace}>
                      <CheckCircle2 size={16} /> Mulai Validasi Wajah
                    </button>
                  </div>
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

          {/* Step VALIDATING / ANALYZING LOADING */}
          {(step === 'validating' || step === 'analyzing') && (
            <div className="loading-state stich-bento-card">
              {imagePreview && <img src={imagePreview} alt="Target" className="preview-img preview-img--blur" />}
              <div className="loading-overlay">
                <Loader2 size={44} className="animate-spin loading-spinner" />
                <p className="loading-label">
                  {step === 'validating' ? 'Memvalidasi Foto Wajah...' : 'Menganalisis Kondisi Kulit...'}
                </p>
                <p className="loading-sub">
                  {step === 'validating' ? 'Memastikan pencahayaan & deteksi posisi wajah' : 'Mendeteksi tipe kulit, kelembaban, & sensitivitas'}
                </p>
              </div>
            </div>
          )}

          {/* Step VALIDATION RESULT: VALID */}
          {step === 'valid' && validation && (
            <div className="result-card stich-bento-card animate-fade-in">
              <CheckCircle2 size={48} className="result-icon result-icon--valid" />
              <h2>Wajah Terdeteksi Jelas!</h2>
              <p className="result-reason">{validation.reason}</p>
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={reset}>
                  Ganti Foto
                </button>
                <button className="btn btn-primary" onClick={analyzeSkin}>
                  <Sparkles size={16} /> Lanjut Analisis Kulit
                </button>
              </div>
            </div>
          )}

          {/* Step VALIDATION RESULT: INVALID */}
          {step === 'invalid' && validation && (
            <div className="result-card stich-bento-card animate-fade-in">
              <AlertCircle size={48} className="result-icon result-icon--invalid" />
              <h2>Foto Tidak Valid</h2>
              <p className="result-reason">{validation.reason}</p>
              <button className="btn btn-primary btn-block" onClick={reset}>
                <RotateCcw size={16} /> Coba Foto Lain
              </button>
            </div>
          )}

          {/* Step FINAL RESULT */}
          {step === 'result' && analysis && (
            <div className="analysis-result animate-fade-in">
              <div className="result-photo stich-bento-card">
                {imagePreview && <img src={imagePreview} alt="Hasil Wajah" className="preview-img" />}
                <div className="result-badge">
                  <ShieldCheck size={16} /> Analisis Selesai (Akurasi {Math.round(analysis.confidence * 100)}%)
                </div>
              </div>

              <div className="notes-card stich-bento-card">
                <h3>Catatan Spesialis Skincluv</h3>
                <p>{analysis.analysis_notes}</p>
              </div>

              <div className="action-buttons">
                <button className="btn btn-outline btn-block" onClick={reset}>
                  <RotateCcw size={16} /> Scan Ulang
                </button>
              </div>
            </div>
          )}

          {/* Step ERROR */}
          {step === 'error' && (
            <div className="result-card stich-bento-card animate-fade-in">
              <AlertCircle size={48} className="result-icon result-icon--invalid" />
              <h2>Terjadi Kesalahan</h2>
              <p className="result-reason">{errorMsg}</p>
              <button className="btn btn-primary btn-block" onClick={reset}>
                <RotateCcw size={16} /> Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 Cols): Info, Tips & Result Summary */}
        <div className="scan-side-col">
          {step === 'result' && analysis ? (
            <>
              {/* Tipe Kulit Card */}
              <div className="skin-type-card stich-bento-card">
                <span className="skin-label">Tipe Kulit Terdeteksi</span>
                <div className="skin-type">{SKIN_TYPE_LABELS[analysis.skin_type]}</div>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${analysis.confidence * 100}%` }} />
                </div>
                <span className="confidence-text">Tingkat keyakinan diagnosa: {Math.round(analysis.confidence * 100)}%</span>
              </div>

              {/* Masalah Kulit */}
              {analysis.skin_concerns.length > 0 && (
                <div className="concerns-section stich-bento-card">
                  <h3>Indikasi Kondisi Kulit</h3>
                  <div className="concern-tags">
                    {analysis.skin_concerns.map((c) => (
                      <span key={c} className="concern-tag">
                        {CONCERN_LABELS[c] ?? c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Tips Foto Box */}
              <div className="stich-bento-card tips-card">
                <h3><Info size={18} className="text-sky" /> Panduan Foto Selfie Ideal</h3>
                <ul className="tips-list">
                  <li>✨ <strong>Pencahayaan Terang:</strong> Ambil foto di dekat jendela atau ruang terang.</li>
                  <li>✨ <strong>Tanpa Riasan Tebal:</strong> Sebaiknya ambil foto saat wajah bersih sesudah cuci muka.</li>
                  <li>✨ <strong>Posisi Tegak Lurus:</strong> Posisikan wajah tepat di tengah bingkai kamera.</li>
                </ul>
              </div>

              {/* Privacy Guarantee Card */}
              <div className="stich-bento-card privacy-card">
                <Lock size={24} className="text-sky mb-xs" />
                <h4>Kerahasiaan Foto Terjamin</h4>
                <p>Foto selfie kamu diproses secara privat dengan enkripsi dan tidak akan pernah dibagikan ke pihak ketiga.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .face-scan-page { padding-bottom: 60px; width: 100%; }
        .page-header { margin-bottom: var(--space-xl); }
        .page-header h1 { font-size: 1.875rem; margin: 0 0 4px 0; color: var(--color-primary); font-family: var(--font-heading); }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin: 0; }

        /* Step bar */
        .step-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: var(--space-xl); max-width: 700px;
        }
        .step-item {
          display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; flex: 1;
          font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); font-family: var(--font-heading);
        }
        .step-item--done { color: var(--color-primary); }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%; background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container); display: flex; align-items: center; justify-content: center;
          font-size: 0.8125rem; font-weight: 700; transition: all 0.2s; box-shadow: var(--shadow-sm);
        }
        .step-item--done .step-dot { background: var(--color-primary); border-color: transparent; color: white; }
        .step-line { position: absolute; top: 16px; left: 60%; right: -40%; height: 2px; background: var(--color-secondary-container); z-index: -1; }
        .step-line--done { background: var(--color-primary); }

        /* 2-Column Grid Layout */
        .facescan-grid {
          display: grid; grid-template-columns: 1fr; gap: var(--space-lg); width: 100%;
        }
        @media (min-width: 900px) {
          .facescan-grid {
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

        /* Dropzone */
        .drop-zone {
          border: 2px dashed var(--color-secondary-fixed-dim); text-align: center; cursor: pointer;
          transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; gap: var(--space-sm);
          background: var(--color-surface-container-low);
        }
        .drop-zone:hover { border-color: var(--color-primary-container); background: var(--color-secondary-container); }
        .drop-zone-icon-box {
          width: 64px; height: 64px; border-radius: 50%; background: var(--color-secondary-fixed);
          color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
        }
        .drop-zone-title { font-size: 1.25rem; font-weight: 700; color: var(--color-text-main); margin: 0; }
        .drop-zone-sub { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }
        .drop-zone-hint { color: var(--color-secondary); font-size: 0.75rem; font-weight: 600; }
        .drop-zone-actions { margin-top: var(--space-sm); }

        .preview-container { display: flex; flex-direction: column; gap: var(--space-md); }
        .preview-img { width: 100%; max-height: 380px; object-fit: cover; border-radius: var(--radius-lg); display: block; border: 1px solid var(--color-secondary-container); }
        .preview-img--blur { filter: blur(4px); opacity: 0.5; }
        .preview-actions { display: flex; gap: var(--space-sm); justify-content: space-between; }

        .loading-state { position: relative; overflow: hidden; min-height: 340px; display: flex; align-items: center; justify-content: center; }
        .loading-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-md); }
        .loading-spinner { color: var(--color-primary); }
        .loading-label { font-size: 1.125rem; font-weight: 700; color: var(--color-text-main); margin: 0; }
        .loading-sub { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }

        .result-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); text-align: center; }
        .result-icon { color: var(--color-primary); }
        .result-icon--valid { color: var(--color-success); }
        .result-icon--invalid { color: var(--color-error); }
        .result-card h2 { font-size: 1.5rem; margin: 0; color: var(--color-text-main); }
        .result-reason { color: var(--color-text-muted); font-size: 0.9375rem; line-height: 1.6; }

        .action-buttons { width: 100%; display: flex; gap: var(--space-sm); }

        .analysis-result { display: flex; flex-direction: column; gap: var(--space-lg); }
        .result-photo { position: relative; }
        .result-badge {
          position: absolute; bottom: var(--space-sm); left: 50%; transform: translateX(-50%);
          background: var(--color-success-soft); border: 1px solid #bbf7d0; color: #16a34a; padding: 6px 16px;
          border-radius: var(--radius-full); font-size: 0.8125rem; font-weight: 700; display: flex; align-items: center; gap: 6px; white-space: nowrap; box-shadow: var(--shadow-sm);
        }

        .skin-type-card { text-align: center; }
        .skin-label { font-size: 0.75rem; color: var(--color-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-xs); font-weight: 700; }
        .skin-type { font-size: 2.25rem; font-weight: 800; margin-bottom: var(--space-md); color: var(--color-primary); font-family: var(--font-heading); }
        .confidence-bar { height: 8px; background: var(--color-surface-container-high); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 6px; }
        .confidence-fill { height: 100%; background: var(--color-primary-container); border-radius: var(--radius-full); transition: width 1s ease; }
        .confidence-text { font-size: 0.75rem; color: var(--color-text-muted); }

        .concerns-section h3 { font-size: 1rem; margin-bottom: var(--space-sm); }
        .concern-tags { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
        .concern-tag { padding: 6px 14px; background: var(--color-secondary-container); border: 1px solid var(--color-secondary-fixed-dim); border-radius: var(--radius-full); font-size: 0.8125rem; color: var(--color-primary); font-weight: 700; }

        .notes-card h3 { font-size: 1rem; margin-bottom: var(--space-sm); }
        .notes-card p { color: var(--color-text-muted); font-size: 0.9375rem; line-height: 1.7; }

        /* Side Column Cards */
        .tips-card h3 { font-size: 1rem; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
        .tips-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.6; }

        .privacy-card h4 { font-size: 1rem; margin: 0 0 4px 0; color: var(--color-text-main); }
        .privacy-card p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; line-height: 1.5; }
        .text-sky { color: var(--color-primary); }
        .mb-xs { margin-bottom: var(--space-xs); }
        .btn-block { width: 100%; justify-content: center; }
      `}</style>
    </div>
  )
}
