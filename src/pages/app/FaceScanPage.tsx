import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Camera,
  Upload,
  RotateCcw,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Activity,
  Info,
  CheckCircle2,
  Scan,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'

type Step = 'upload' | 'processing' | 'rejected' | 'result' | 'error'

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
  const { invoke } = useInvokeAI()

  const [step, setStep] = useState<Step>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('Mengecek kejelasan foto & deteksi wajah...')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dynamic Real-Time Contextual Processing Message Rotation
  useEffect(() => {
    if (step !== 'processing') return

    const messagesList = [
      'Mengecek kejelasan foto & deteksi wajah...',
      'Wajah terdeteksi! Memproses fitur dermatologi...',
      'Menganalisis kadar minyak, kelembapan, & pori-pori...',
      'Menyusun diagnosa kulit terpersonalisasi...',
    ]

    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % messagesList.length
      setStatusText(messagesList[idx])
    }, 1300)

    return () => clearInterval(interval)
  }, [step])

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
    setErrorMsg(null)
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

  // Unified 1-Click Scan Handler (Validation + Analysis in 1 Smooth Action)
  const startUnifiedScan = async () => {
    if (!imageBase64) return

    setStep('processing')
    setErrorMsg(null)
    setValidation(null)
    setAnalysis(null)
    setStatusText('Mengecek kejelasan foto & deteksi wajah...')

    try {
      // Step 1: Validate Face
      const validRes = await invoke<ValidationResult>({
        feature_slug: 'face_validation',
        messages: [{ role: 'user', content: 'Validasi foto wajah ini untuk kejelasan & pencahayaan.' }],
        input_context: { image_base64: imageBase64 },
      })

      if (!validRes || typeof validRes !== 'object') {
        setErrorMsg('Tidak dapat memverifikasi foto. Silakan pastikan pencahayaan cukup dan foto wajah terlihat jelas.')
        setStep('error')
        return
      }

      setValidation(validRes)

      // If Face Validation Fails (e.g. coffee cup, blurry, non-human photo)
      if (!validRes.is_valid_face) {
        setStep('rejected')
        return
      }

      // Step 2: Analyze Skin (Runs automatically right after validation success!)
      setStatusText('Wajah terdeteksi! Memproses analisis tipe & kondisi kulit...')

      const analysisRes = await invoke<AnalysisResult>({
        feature_slug: 'face_analysis',
        messages: [{ role: 'user', content: 'Analisis kondisi kulit wajah secara detail.' }],
        input_context: { image_base64: imageBase64 },
      })

      if (!analysisRes || typeof analysisRes !== 'object') {
        setErrorMsg('Gagal menganalisis kulit wajah. Silakan coba lagi.')
        setStep('error')
        return
      }

      setAnalysis(analysisRes)
      setStep('result')

      // Save to database
      if (user && analysisRes.skin_type) {
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
                skin_type: analysisRes.skin_type,
                skin_concerns: analysisRes.skin_concerns ?? [],
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
                skin_type: analysisRes.skin_type,
                skin_concerns: analysisRes.skin_concerns ?? [],
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
      console.error('Unified scan error:', err)
      setErrorMsg(err.message || 'Terjadi kendala saat memproses foto.')
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
      {/* Header Banner */}
      <div className="scan-banner-card">
        <div className="banner-icon-box">
          <Scan size={28} />
        </div>
        <div className="banner-text">
          <h2>AI Face Health Scanner</h2>
          <p>Dapatkan diagnosa tipe kulit, kelembapan, dan kondisi jerawat presisi berbasis AI dalam sekali foto.</p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="scan-main-grid">
        {/* Left Column: Upload / Processing / Rejected / Result Box */}
        <div className="scan-primary-box">
          {/* STATE 1 & 2: Upload Input or Processing State */}
          {(step === 'upload' || step === 'processing') && (
            <div className="upload-wrapper-card">
              {imagePreview ? (
                <div className="preview-container">
                  <img src={imagePreview} alt="Wajah" className="face-preview-img" />

                  {/* Animated AI Laser Beam Overlay during Processing */}
                  {step === 'processing' && (
                    <div className="laser-scanner-overlay">
                      <div className="laser-beam" />
                    </div>
                  )}

                  {step === 'upload' && (
                    <button className="btn-change-photo" onClick={reset} title="Ganti Foto">
                      <RotateCcw size={16} /> Ganti Foto
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="dropzone-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-circle">
                    <Camera size={36} />
                  </div>
                  <h3>Unggah Foto Wajah Kamu</h3>
                  <p>Tarik & lepas foto di sini, atau klik untuk memilih gambar</p>
                  <span className="dropzone-hint">Format JPG, PNG, WEBP (Maks. 5MB)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden-input"
                  />
                </div>
              )}

              {/* Action Controls */}
              {step === 'upload' && imagePreview && (
                <div className="action-button-group">
                  <button className="btn btn-primary btn-block btn-lg" onClick={startUnifiedScan}>
                    <Sparkles size={20} /> Analisis Kesehatan Kulit
                  </button>
                </div>
              )}

              {/* Live AI Orbit Spinner & Contextual Status */}
              {step === 'processing' && (
                <div className="processing-status-card animate-fade-in">
                  <div className="ai-orbit-spinner">
                    <div className="outer-orbit-ring" />
                    <div className="inner-orbit-ring" />
                    <Sparkles size={24} className="center-ai-sparkle" />
                  </div>
                  <h4 className="processing-title">{statusText}</h4>
                  <p className="processing-sub">Kecerdasan buatan Skincluv sedang menganalisis piksel foto wajah kamu...</p>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: Smart Rejection Card (Foto Bukan Wajah / Tidak Sesuai) */}
          {step === 'rejected' && (
            <div className="rejection-card animate-fade-in">
              <div className="rejection-icon-wrapper">
                <AlertCircle size={44} />
              </div>
              <h3>Foto Wajah Tidak Terdeteksi</h3>
              <p className="rejection-reason">
                {validation?.reason || 'Foto yang diunggah terdeteksi sebagai objek lain atau bukan wajah manusia.'}
              </p>

              <div className="rejection-tips-box">
                <h4>Tips Pengambilan Foto yang Tepat:</h4>
                <ul>
                  <li>✔️ Gunakan foto wajah asli manusia dengan posisi menghadap lurus.</li>
                  <li>✔️ Pastikan pencahayaan cukup terang & wajah tidak tertutup masker/topi.</li>
                  <li>✔️ Hindari foto objek benda, pemandangan, atau foto buram.</li>
                </ul>
              </div>

              <button className="btn btn-primary btn-block btn-lg" onClick={reset}>
                <RefreshCw size={18} /> Ambil Ulang Foto Wajah
              </button>
            </div>
          )}

          {/* STATE 4: Error Card */}
          {step === 'error' && (
            <div className="error-card animate-fade-in">
              <AlertCircle size={44} className="error-icon" />
              <h3>Terjadi Kendala</h3>
              <p>{errorMsg || 'Terjadi kesalahan sistem saat menganalisis foto.'}</p>
              <button className="btn btn-outline btn-block" onClick={reset}>
                <RotateCcw size={16} /> Coba Lagi
              </button>
            </div>
          )}

          {/* STATE 5: Result Card (Layar Hasil Analisis Kulit) */}
          {step === 'result' && analysis && (
            <div className="result-main-container animate-fade-in">
              {/* Image & Confidence Badge */}
              <div className="result-hero-box">
                {imagePreview && <img src={imagePreview} alt="Wajah" className="result-face-img" />}
                <div className="result-badge-confidence">
                  <CheckCircle2 size={16} /> Analisis Selesai (Akurasi {Math.round((analysis.confidence || 0.9) * 100)}%)
                </div>
              </div>

              {/* Skin Type Score Box */}
              <div className="result-score-card">
                <span className="score-subtitle">TIPE KULIT TERDETEKSI</span>
                <h3 className="score-title">{SKIN_TYPE_LABELS[analysis.skin_type] || analysis.skin_type}</h3>
                <div className="score-progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round((analysis.confidence || 0.9) * 100)}%` }} />
                </div>
                <span className="score-confidence-text">Tingkat keyakinan diagnosa: {Math.round((analysis.confidence || 0.9) * 100)}%</span>
              </div>

              {/* Skin Concerns Pill List */}
              <div className="result-concerns-card">
                <h4>Indikasi Kondisi Kulit</h4>
                <div className="concerns-pill-group">
                  {analysis.skin_concerns?.length > 0 ? (
                    analysis.skin_concerns.map((c) => (
                      <span key={c} className="concern-pill">
                        {CONCERN_LABELS[c] || c}
                      </span>
                    ))
                  ) : (
                    <span className="concern-pill pill-healthy">Kulit Tampak Sehat & Seimbang</span>
                  )}
                </div>
              </div>

              {/* Detailed AI Analysis Notes */}
              {analysis.analysis_notes && (
                <div className="result-notes-card">
                  <div className="notes-header">
                    <Activity size={18} /> Catatan Diagnosa AI Skincluv
                  </div>
                  <p>{analysis.analysis_notes}</p>
                </div>
              )}

              <button className="btn btn-outline btn-block btn-lg" onClick={reset}>
                <RefreshCw size={18} /> Pindai Wajah Baru
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Tips & Active Skin Profile Info */}
        <div className="scan-secondary-sidebar">
          {activeSkinProfile && (
            <div className="active-profile-card">
              <div className="card-header">
                <ShieldCheck size={20} className="header-icon" />
                <h3>Profil Kulit Saat Ini</h3>
              </div>
              <div className="profile-detail-rows">
                <div className="detail-row">
                  <span className="row-label">Tipe Kulit:</span>
                  <span className="row-val">{SKIN_TYPE_LABELS[activeSkinProfile.skin_type] || activeSkinProfile.skin_type}</span>
                </div>
                <div className="detail-row">
                  <span className="row-label">Fokus Kulit:</span>
                  <div className="mini-pill-wrap">
                    {activeSkinProfile.skin_concerns?.map((c) => (
                      <span key={c} className="mini-pill">
                        {CONCERN_LABELS[c] || c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="scan-tips-card">
            <div className="card-header">
              <Info size={20} className="header-icon" />
              <h3>Panduan Foto Presisi</h3>
            </div>
            <ul className="tips-list">
              <li>✦ Gunakan foto wajah lurus dengan ekspresi netral.</li>
              <li>✦ Hindari pencahayaan terlalu gelap atau bayangan kuat.</li>
              <li>✦ Pastikan wajah tidak tertutup rambut, masker, atau kacamata hitam.</li>
              <li>✦ Privasi dijamin: Foto hanya diproses untuk analisis dermatologi AI.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .face-scan-page {
          display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 1100px; margin: 0 auto;
        }

        .scan-banner-card {
          display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md) var(--space-lg);
          background: linear-gradient(135deg, rgba(212, 229, 241, 0.4) 0%, rgba(238, 246, 252, 0.8) 100%);
          border: 1px solid var(--color-secondary-container); border-radius: var(--radius-2xl);
        }
        .banner-icon-box {
          width: 52px; height: 52px; border-radius: 50%; background: var(--color-primary); color: white;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: var(--shadow-sky);
        }
        .banner-text h2 { font-size: 1.35rem; font-weight: 700; color: var(--color-primary); margin: 0 0 4px 0; font-family: var(--font-heading); }
        .banner-text p { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

        .scan-main-grid {
          display: grid; grid-template-columns: 1fr 340px; gap: var(--space-lg); align-items: start;
        }
        @media (max-width: 900px) {
          .scan-main-grid { grid-template-columns: 1fr; }
        }

        .scan-primary-box {
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl); padding: var(--space-lg); box-shadow: var(--shadow-sm);
        }

        /* Upload & Dropzone Area */
        .upload-wrapper-card { display: flex; flex-direction: column; gap: var(--space-md); }
        .dropzone-area {
          border: 2px dashed var(--color-secondary-container); border-radius: var(--radius-2xl);
          padding: var(--space-2xl) var(--space-md); text-align: center; cursor: pointer; transition: all 0.2s ease;
          background: var(--color-surface-container-low); display: flex; flex-direction: column; align-items: center;
        }
        .dropzone-area:hover {
          border-color: var(--color-primary-container); background: rgba(238, 246, 252, 0.6);
        }
        .dropzone-circle {
          width: 68px; height: 68px; border-radius: 50%; background: var(--color-secondary-fixed);
          color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-md);
        }
        .dropzone-area h3 { font-size: 1.15rem; font-weight: 700; color: var(--color-primary); margin: 0 0 6px 0; font-family: var(--font-heading); }
        .dropzone-area p { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 8px 0; }
        .dropzone-hint { font-size: 0.75rem; color: var(--color-secondary); font-weight: 600; }
        .hidden-input { display: none; }

        /* Preview Container & Holographic Laser Beam Overlay */
        .preview-container {
          position: relative; width: 100%; max-height: 420px; border-radius: var(--radius-2xl); overflow: hidden;
          background: #000; display: flex; align-items: center; justify-content: center;
        }
        .face-preview-img { width: 100%; height: 100%; max-height: 420px; object-fit: cover; }

        .laser-scanner-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0) 100%);
        }
        .laser-beam {
          position: absolute; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent 0%, #0ea5e9 50%, transparent 100%);
          box-shadow: 0 0 15px #0ea5e9, 0 0 25px #0ea5e9;
          animation: laserScan 2.2s ease-in-out infinite alternate;
        }
        @keyframes laserScan {
          0% { top: 5%; }
          100% { top: 92%; }
        }

        .btn-change-photo {
          position: absolute; top: 12px; right: 12px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px);
          color: white; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: var(--radius-full);
          padding: 6px 14px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: all 0.2s;
        }
        .btn-change-photo:hover { background: rgba(0, 0, 0, 0.85); }

        /* Live AI Orbit Spinner & Status Card */
        .processing-status-card {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: var(--space-lg); background: var(--color-surface-container-low); border-radius: var(--radius-2xl);
          border: 1px solid var(--color-secondary-container); gap: 10px;
        }
        .ai-orbit-spinner {
          position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;
        }
        .outer-orbit-ring {
          position: absolute; inset: 0; border-radius: 50%; border: 3px solid rgba(14, 165, 233, 0.2);
          border-top-color: var(--color-primary); animation: orbitSpin 1.4s linear infinite;
        }
        .inner-orbit-ring {
          position: absolute; inset: 6px; border-radius: 50%; border: 2px dashed rgba(14, 165, 233, 0.4);
          animation: orbitSpinReverse 2.5s linear infinite;
        }
        .center-ai-sparkle { color: var(--color-primary); animation: pulseSparkle 1.5s ease-in-out infinite; }

        @keyframes orbitSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes orbitSpinReverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        @keyframes pulseSparkle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } }

        .processing-title { font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0; transition: all 0.3s; }
        .processing-sub { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; }

        /* Smart Rejection Card (Foto Bukan Wajah) */
        .rejection-card {
          display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--space-xl);
          background: rgba(254, 242, 242, 0.7); border: 1px solid rgba(248, 113, 113, 0.4); border-radius: var(--radius-2xl); gap: var(--space-md);
        }
        .rejection-icon-wrapper {
          width: 72px; height: 72px; border-radius: 50%; background: #fee2e2; color: #dc2626;
          display: flex; align-items: center; justify-content: center;
        }
        .rejection-card h3 { font-size: 1.35rem; font-weight: 700; color: #991b1b; margin: 0; font-family: var(--font-heading); }
        .rejection-reason { font-size: 0.9375rem; color: #7f1d1d; margin: 0; line-height: 1.5; max-width: 500px; }

        .rejection-tips-box {
          background: white; border: 1px solid rgba(248, 113, 113, 0.3); border-radius: var(--radius-xl);
          padding: var(--space-md) var(--space-lg); text-align: left; width: 100%; max-width: 520px;
        }
        .rejection-tips-box h4 { font-size: 0.875rem; font-weight: 700; color: #991b1b; margin: 0 0 8px 0; }
        .rejection-tips-box ul { margin: 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 0.8125rem; color: var(--color-text-main); }

        /* Error Card */
        .error-card {
          display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--space-xl);
          gap: var(--space-md); color: var(--color-error);
        }
        .error-icon { color: var(--color-error); }
        .error-card h3 { font-size: 1.2rem; font-weight: 700; margin: 0; }
        .error-card p { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

        /* Result Main Container */
        .result-main-container { display: flex; flex-direction: column; gap: var(--space-lg); }
        .result-hero-box { position: relative; width: 100%; max-height: 320px; border-radius: var(--radius-2xl); overflow: hidden; }
        .result-face-img { width: 100%; height: 100%; max-height: 320px; object-fit: cover; }
        .result-badge-confidence {
          position: absolute; bottom: 12px; left: 12px; background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px);
          color: #065f46; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-full);
          padding: 6px 14px; font-size: 0.8125rem; font-weight: 700; display: flex; align-items: center; gap: 6px;
        }

        .result-score-card {
          background: var(--color-surface-container-low); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl); padding: var(--space-md) var(--space-lg); display: flex; flex-direction: column; gap: 6px;
        }
        .score-subtitle { font-size: 0.75rem; font-weight: 700; color: var(--color-secondary); letter-spacing: 0.05em; }
        .score-title { font-size: 1.6rem; font-weight: 700; color: var(--color-primary); margin: 0; font-family: var(--font-heading); }
        .score-progress-bar { height: 8px; width: 100%; background: var(--color-secondary-container); border-radius: var(--radius-full); overflow: hidden; margin: 4px 0; }
        .progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.6s ease; }
        .score-confidence-text { font-size: 0.75rem; color: var(--color-text-muted); }

        .result-concerns-card { display: flex; flex-direction: column; gap: 8px; }
        .result-concerns-card h4 { font-size: 0.875rem; font-weight: 700; color: var(--color-primary); margin: 0; }
        .concerns-pill-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .concern-pill {
          background: var(--color-secondary-container); color: var(--color-primary); font-size: 0.8125rem; font-weight: 700;
          padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid rgba(14, 165, 233, 0.2);
        }
        .pill-healthy { background: #dcfce7; color: #166534; border-color: #86efac; }

        .result-notes-card {
          background: var(--color-surface-container-low); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl); padding: var(--space-md); font-size: 0.875rem; line-height: 1.6; color: var(--color-text-main);
        }
        .notes-header { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--color-primary); margin-bottom: 6px; }

        /* Secondary Sidebar */
        .scan-secondary-sidebar { display: flex; flex-direction: column; gap: var(--space-md); }
        .active-profile-card, .scan-tips-card {
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl); padding: var(--space-md) var(--space-lg); box-shadow: var(--shadow-sm);
        }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .card-header h3 { font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0; font-family: var(--font-heading); }
        .header-icon { color: var(--color-primary); }

        .profile-detail-rows { display: flex; flex-direction: column; gap: 10px; font-size: 0.875rem; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; }
        .row-label { color: var(--color-text-muted); }
        .row-val { font-weight: 700; color: var(--color-primary); }
        .mini-pill-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
        .mini-pill { background: var(--color-secondary-container); color: var(--color-primary); font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }

        .tips-list { margin: 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem; color: var(--color-text-muted); line-height: 1.5; }
      `}</style>
    </div>
  )
}
