// src/pages/app/FaceScanPage.tsx
// Face Scan — 2 tahap:
//   Step 1: Upload foto → validasi ada wajah (face_validation)
//   Step 2: Analisis kulit (face_analysis) → simpan ke skin_profiles

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, RotateCcw, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
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

  // Convert File to base64 and preview URL
  const processImage = useCallback((file: File) => {
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // Strip data URL prefix — only keep base64 data
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

  // Step 1: Validate face
  const validateFace = async () => {
    if (!imageBase64 || !imageFile) return
    setStep('validating')
    setErrorMsg(null)

    const mimeType = imageFile.type || 'image/jpeg'

    const result = await invoke({
      feature_slug: 'face_validation',
      messages: [{
        role: 'user',
        content: [
          {
            inlineData: { mimeType: mimeType, data: imageBase64 }
          },
          { text: 'Validasi apakah gambar ini menampilkan wajah manusia dengan jelas.' }
        ]
      }]
    })

    if (!result) {
      setStep('error')
      setErrorMsg('Gagal memvalidasi gambar. Coba lagi.')
      return
    }

    try {
      // Strip markdown code fences if present
      const cleaned = result.content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed: ValidationResult = JSON.parse(cleaned)
      setValidation(parsed)
      setStep(parsed.is_valid_face ? 'valid' : 'invalid')
    } catch {
      setStep('error')
      setErrorMsg('Respons AI tidak valid. Coba lagi.')
    }
  }

  // Step 2: Analyze skin
  const analyzeSkin = async () => {
    if (!imageBase64 || !imageFile) return
    setStep('analyzing')
    setErrorMsg(null)

    const mimeType = imageFile.type || 'image/jpeg'

    const result = await invoke({
      feature_slug: 'face_analysis',
      messages: [{
        role: 'user',
        content: [
          {
            inlineData: { mimeType: mimeType, data: imageBase64 }
          },
          { text: 'Analisis tipe dan kondisi kulit dari gambar wajah ini.' }
        ]
      }]
    })

    if (!result) {
      setStep('error')
      setErrorMsg('Gagal menganalisis kulit. Coba lagi.')
      return
    }

    try {
      const cleaned = result.content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed: AnalysisResult = JSON.parse(cleaned)
      setAnalysis(parsed)
      setStep('result')

      // Save to skin_profiles
      await saveSkinProfile(parsed)
    } catch {
      setStep('error')
      setErrorMsg('Respons analisis tidak valid. Coba lagi.')
    }
  }

  const saveSkinProfile = async (data: AnalysisResult) => {
    if (!user) return

    // Deactivate previous active profile
    await supabase
      .from('skin_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Insert new profile
    const { data: newProfile, error } = await supabase
      .from('skin_profiles')
      .insert({
        user_id: user.id,
        skin_type: data.skin_type,
        skin_concerns: data.skin_concerns,
        analysis_notes: data.analysis_notes,
        raw_ai_response: data as unknown as Record<string, unknown>,
        is_active: true,
      })
      .select()
      .single()

    if (!error && newProfile) {
      setActiveSkinProfile(newProfile)
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
        <h1>Face Scan</h1>
        <p className="page-subtitle">Analisis tipe & kondisi kulit kamu dengan AI</p>
      </div>

      {/* Step indicator */}
      <div className="step-bar">
        {['Foto', 'Validasi', 'Analisis', 'Hasil'].map((label, i) => {
          const stepIndex = ['upload', 'validating', 'valid', 'invalid'].includes(step) ? 0
            : step === 'analyzing' ? 2
            : step === 'result' ? 3 : 1
          return (
            <div key={label} className={`step-item ${i <= stepIndex ? 'step-item--done' : ''}`}>
              <div className="step-dot">{i < stepIndex ? '✓' : i + 1}</div>
              <span>{label}</span>
              {i < 3 && <div className={`step-line ${i < stepIndex ? 'step-line--done' : ''}`} />}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="scan-content">

        {/* Upload step */}
        {step === 'upload' && (
          <div className="upload-area animate-fade-in">
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Preview wajah" className="preview-img" />
                <div className="preview-actions">
                  <button className="btn btn-ghost btn-sm" onClick={reset}>
                    <RotateCcw size={16} /> Ganti Foto
                  </button>
                  <button className="btn btn-primary" onClick={validateFace}>
                    Mulai Analisis <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-zone-icon">📸</div>
                <p className="drop-zone-title">Upload foto wajah</p>
                <p className="drop-zone-sub">Drag & drop atau klik untuk pilih foto</p>
                <p className="drop-zone-hint">JPG, PNG, WEBP · Maks 5MB</p>
                <div className="drop-zone-actions">
                  <button className="btn btn-primary" type="button">
                    <Upload size={18} /> Pilih Foto
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Loading states */}
        {(step === 'validating' || step === 'analyzing') && (
          <div className="loading-state animate-fade-in">
            {imagePreview && <img src={imagePreview} alt="Preview" className="preview-img preview-img--blur" />}
            <div className="loading-overlay">
              <Loader2 size={48} className="animate-spin loading-spinner" />
              <p className="loading-label">
                {step === 'validating' ? 'Memvalidasi wajah...' : 'Menganalisis kulit kamu...'}
              </p>
              <p className="loading-sub">
                {step === 'validating' ? 'Mengecek kualitas foto' : 'Ini membutuhkan beberapa detik'}
              </p>
            </div>
          </div>
        )}

        {/* Invalid face */}
        {step === 'invalid' && (
          <div className="result-card result-card--invalid animate-slide-up">
            <AlertCircle size={48} className="result-icon result-icon--invalid" />
            <h2>Foto Tidak Valid</h2>
            <p className="result-reason">{validation?.reason}</p>
            <div className="tips-box">
              <p><strong>Tips foto yang baik:</strong></p>
              <ul>
                <li>✅ Wajah terlihat jelas dan tidak blur</li>
                <li>✅ Pencahayaan cukup terang</li>
                <li>✅ Menghadap ke depan atau sedikit miring</li>
                <li>❌ Jangan pakai kacamata hitam</li>
                <li>❌ Hindari filter yang berlebihan</li>
              </ul>
            </div>
            <button className="btn btn-primary btn-block" onClick={reset}>
              <RotateCcw size={18} /> Ambil Foto Baru
            </button>
          </div>
        )}

        {/* Valid — confirm proceed to analysis */}
        {step === 'valid' && (
          <div className="result-card animate-slide-up">
            <CheckCircle2 size={48} className="result-icon result-icon--valid" />
            <h2>Foto Valid! ✨</h2>
            <p className="result-reason">Wajah terdeteksi dengan jelas. Siap untuk analisis kulit.</p>
            {imagePreview && <img src={imagePreview} alt="Preview" className="preview-img" />}
            <div className="action-buttons">
              <button className="btn btn-ghost" onClick={reset}>
                <RotateCcw size={16} /> Ganti Foto
              </button>
              <button className="btn btn-primary" onClick={analyzeSkin}>
                Analisis Sekarang <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'result' && analysis && (
          <div className="analysis-result animate-slide-up">
            {imagePreview && (
              <div className="result-photo">
                <img src={imagePreview} alt="Foto analisis" className="preview-img" />
                <div className="result-badge">
                  <CheckCircle2 size={16} /> Analisis Selesai
                </div>
              </div>
            )}

            <div className="skin-type-card glass-card">
              <p className="skin-label">Tipe Kulit</p>
              <h2 className="skin-type gradient-text">
                {SKIN_TYPE_LABELS[analysis.skin_type] ?? analysis.skin_type}
              </h2>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
                />
              </div>
              <p className="confidence-text">{Math.round(analysis.confidence * 100)}% confident</p>
            </div>

            {analysis.skin_concerns.length > 0 && (
              <div className="concerns-section">
                <h3>Kondisi Kulit</h3>
                <div className="concern-tags">
                  {analysis.skin_concerns.map((c) => (
                    <span key={c} className="concern-tag">
                      {CONCERN_LABELS[c] ?? c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="notes-card glass-card">
              <h3>💬 Catatan AI</h3>
              <p>{analysis.analysis_notes}</p>
            </div>

            <button className="btn btn-secondary btn-block" onClick={reset}>
              <Camera size={18} /> Scan Ulang
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="result-card result-card--invalid animate-slide-up">
            <AlertCircle size={48} className="result-icon result-icon--invalid" />
            <h2>Ups, Ada Masalah</h2>
            <p className="result-reason">{errorMsg ?? 'Terjadi kesalahan. Coba lagi.'}</p>
            <button className="btn btn-primary btn-block" onClick={reset}>
              <RotateCcw size={18} /> Coba Lagi
            </button>
          </div>
        )}

        {errorMsg && (step === 'upload') && (
          <div className="inline-error animate-fade-in">⚠️ {errorMsg}</div>
        )}
      </div>

      {/* Existing scan result shortcut */}
      {activeSkinProfile && step === 'upload' && !imagePreview && (
        <div className="existing-profile glass-card animate-fade-in">
          <p className="existing-label">Scan terakhir</p>
          <div className="existing-info">
            <span className="skin-type-badge">{SKIN_TYPE_LABELS[activeSkinProfile.skin_type]}</span>
            <span className="existing-concerns">
              {activeSkinProfile.skin_concerns.slice(0, 2).map(c => CONCERN_LABELS[c] ?? c).join(', ')}
            </span>
          </div>
        </div>
      )}

      <style>{`
        .face-scan-page {
          padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-xl));
        }

        .page-header { margin-bottom: var(--space-lg); }
        .page-header h1 { font-size: 1.75rem; }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 4px; }

        /* Step bar */
        .step-bar {
          display: flex;
          align-items: center;
          margin-bottom: var(--space-xl);
          overflow: hidden;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          flex: 1;
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .step-item--done { color: var(--color-brand-300); }
        .step-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-surface-glass);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          transition: all var(--transition-fast);
        }
        .step-item--done .step-dot {
          background: var(--gradient-brand);
          border-color: transparent;
          color: white;
        }
        .step-line {
          position: absolute;
          top: 14px;
          left: 60%;
          right: -40%;
          height: 2px;
          background: var(--color-border);
          z-index: -1;
        }
        .step-line--done { background: var(--gradient-brand); }

        /* Upload area */
        .upload-area { display: flex; flex-direction: column; gap: var(--space-md); }

        .drop-zone {
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl) var(--space-lg);
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }
        .drop-zone:hover, .drop-zone:active {
          border-color: var(--color-brand-400);
          background: rgba(107, 33, 168, 0.05);
        }
        .drop-zone-icon { font-size: 48px; }
        .drop-zone-title { font-size: 1.125rem; font-weight: 700; }
        .drop-zone-sub { color: var(--color-text-muted); font-size: 0.875rem; }
        .drop-zone-hint { color: var(--color-text-muted); font-size: 0.75rem; }
        .drop-zone-actions { margin-top: var(--space-sm); }

        /* Preview */
        .preview-container { display: flex; flex-direction: column; gap: var(--space-md); }
        .preview-img {
          width: 100%;
          max-height: 360px;
          object-fit: cover;
          border-radius: var(--radius-xl);
          display: block;
        }
        .preview-img--blur { filter: blur(4px); opacity: 0.6; }
        .preview-actions {
          display: flex;
          gap: var(--space-sm);
          justify-content: space-between;
        }

        /* Loading */
        .loading-state {
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 20, 0.75);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
        }
        .loading-spinner { color: var(--color-brand-400); }
        .loading-label { font-size: 1rem; font-weight: 700; }
        .loading-sub { color: var(--color-text-muted); font-size: 0.875rem; }

        /* Result cards */
        .result-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          text-align: center;
        }
        .result-icon { color: var(--color-brand-400); }
        .result-icon--valid { color: #34d399; }
        .result-icon--invalid { color: #f87171; }
        .result-card h2 { font-size: 1.5rem; }
        .result-reason { color: var(--color-text-muted); font-size: 0.9375rem; line-height: 1.6; }

        .tips-box {
          width: 100%;
          background: var(--color-surface-glass);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          text-align: left;
          font-size: 0.875rem;
          line-height: 2;
        }

        .action-buttons {
          width: 100%;
          display: flex;
          gap: var(--space-sm);
        }
        .action-buttons .btn { flex: 1; }

        /* Analysis result */
        .analysis-result { display: flex; flex-direction: column; gap: var(--space-lg); }

        .result-photo { position: relative; }
        .result-badge {
          position: absolute;
          bottom: var(--space-sm);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(52, 211, 153, 0.2);
          border: 1px solid rgba(52, 211, 153, 0.5);
          color: #34d399;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .skin-type-card {
          text-align: center;
          padding: var(--space-xl);
        }
        .skin-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: var(--space-xs);
        }
        .skin-type { font-size: 2rem; font-weight: 800; margin-bottom: var(--space-md); }

        .confidence-bar {
          height: 6px;
          background: var(--color-surface-glass);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 6px;
        }
        .confidence-fill {
          height: 100%;
          background: var(--gradient-brand);
          border-radius: var(--radius-full);
          transition: width 1s ease;
        }
        .confidence-text { font-size: 0.75rem; color: var(--color-text-muted); }

        .concerns-section h3 { font-size: 1rem; margin-bottom: var(--space-sm); }
        .concern-tags { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
        .concern-tag {
          padding: 6px 14px;
          background: rgba(107, 33, 168, 0.2);
          border: 1px solid rgba(107, 33, 168, 0.4);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          color: var(--color-brand-300);
          font-weight: 500;
        }

        .notes-card { padding: var(--space-lg); }
        .notes-card h3 { font-size: 0.9375rem; margin-bottom: var(--space-sm); }
        .notes-card p { color: var(--color-text-secondary); font-size: 0.9375rem; line-height: 1.7; }

        .inline-error {
          padding: 12px var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: #fca5a5;
          font-size: 0.875rem;
        }

        .existing-profile {
          margin-top: var(--space-lg);
          padding: var(--space-md) var(--space-lg);
        }
        .existing-label { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 6px; }
        .existing-info { display: flex; align-items: center; gap: var(--space-sm); }
        .skin-type-badge {
          padding: 4px 12px;
          background: var(--gradient-brand);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 700;
          color: white;
        }
        .existing-concerns { font-size: 0.875rem; color: var(--color-text-muted); }
      `}</style>
    </div>
  )
}
