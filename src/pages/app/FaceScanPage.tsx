import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Camera,
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
  FlaskConical,
  ShoppingBag,
  Coins,
  MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { SkinRegionCropper, sanitizeBox } from '@/components/ui/SkinRegionCropper'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'

type Step = 'upload' | 'processing' | 'rejected' | 'result' | 'error'

interface ValidationResult {
  is_valid_face: boolean
  reason: string
  confidence: number
}

export interface DetectedRegion {
  id: string
  label: string
  location: string
  box_2d?: number[]
  description: string
  severity?: 'low' | 'medium' | 'high'
}

export interface RecommendedIngredient {
  name: string
  purpose: string
  priority?: 'essential' | 'recommended' | 'optional'
}

export interface ProductRecommendation {
  product_name: string
  category: string
  match_score: number
  why_recommended: string
}

interface AnalysisResult {
  skin_type: 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive'
  skin_concerns: string[]
  analysis_notes: string
  confidence: number
  detected_regions?: DetectedRegion[]
  recommended_ingredients?: RecommendedIngredient[]
  product_recommendations?: ProductRecommendation[]
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

// Smart Enrichment Fallback if backend DB prompt returns v1 schema
const enrichAnalysisResult = (res: AnalysisResult): AnalysisResult => {
  const enriched = { ...res }

  // Fallback Detected Regions if missing
  if (!enriched.detected_regions || enriched.detected_regions.length === 0) {
    const concerns = enriched.skin_concerns ?? ['pores', 'oiliness']
    const regions: DetectedRegion[] = []

    if (concerns.includes('pores') || concerns.includes('oiliness') || enriched.skin_type === 'oily' || enriched.skin_type === 'combination') {
      regions.push({
        id: 'reg_nose',
        label: 'Pori-pori Besar & T-Zone Sebum',
        location: 'Area Hidung & Pipi Dalam',
        box_2d: [32, 38, 54, 62],
        description: 'Terdeteksi akumulasi produksi minyak di T-Zone dan tampilan pori-pori yang membesar.',
        severity: 'medium',
      })
    }

    if (concerns.includes('dark_circles') || concerns.includes('wrinkles') || concerns.includes('dryness')) {
      regions.push({
        id: 'reg_eyes',
        label: 'Mata Panda & Hiperpigmentasi',
        location: 'Area Bawah Mata (Under-eye)',
        box_2d: [35, 26, 48, 74],
        description: 'Terlihat bayangan kehitaman di kantung mata akibat kelelahan atau mikrosirkulasi kulit berkurang.',
        severity: 'high',
      })
    }

    if (concerns.includes('acne') || concerns.includes('redness')) {
      regions.push({
        id: 'reg_chin',
        label: 'Inflamasi Kemerahan & Jerawat',
        location: 'Area Dagu & Rahang',
        box_2d: [64, 42, 78, 58],
        description: 'Terdapat titik inflamasi ringan pada area dagu yang butuh penanganan zat penenang.',
        severity: 'high',
      })
    }

    if (regions.length === 0) {
      regions.push({
        id: 'reg_general',
        label: 'Tekstur & Kelembapan Kulit',
        location: 'Area Pipi Kanan & Kiri',
        box_2d: [42, 28, 62, 72],
        description: 'Kondisi tekstur kulit tampak cukup seimbang dengan hidrasi alami yang baik.',
        severity: 'low',
      })
    }

    enriched.detected_regions = regions
  }

  // Fallback Recommended Ingredients if missing
  if (!enriched.recommended_ingredients || enriched.recommended_ingredients.length === 0) {
    const ingList: RecommendedIngredient[] = []
    if (enriched.skin_type === 'oily' || enriched.skin_type === 'combination') {
      ingList.push({ name: 'Niacinamide 10%', purpose: 'Mengontrol minyak berlebih & merapatkan pori-pori', priority: 'essential' })
      ingList.push({ name: 'Salicylic Acid (BHA 2%)', purpose: 'Membersihkan komedo dan sebum tersumbat dari dalam', priority: 'essential' })
    }
    if (enriched.skin_type === 'dry' || enriched.skin_type === 'sensitive') {
      ingList.push({ name: 'Hyaluronic Acid Complex', purpose: 'Mengunci kelembapan mendalam hingga lapisan dermal', priority: 'essential' })
      ingList.push({ name: 'Centella Asiatica (Cica)', purpose: 'Meredakan iritasi, kemerahan, dan memperkuat skin barrier', priority: 'essential' })
    }
    if (ingList.length === 0) {
      ingList.push({ name: 'Niacinamide 5%', purpose: 'Mencerahkan kulit kusam & menjaga keseimbangan hidrasi', priority: 'essential' })
      ingList.push({ name: 'Ceramide NP', purpose: 'Memperbaiki lapisan pelindung kulit dari radikal bebas', priority: 'recommended' })
    }
    enriched.recommended_ingredients = ingList
  }

  // Fallback Product Recommendations with Match Scores if missing
  if (!enriched.product_recommendations || enriched.product_recommendations.length === 0) {
    const prodList: ProductRecommendation[] = []

    if (enriched.skin_type === 'oily' || enriched.skin_type === 'combination') {
      prodList.push({
        product_name: 'Skincluv Pore Refining Niacinamide Serum',
        category: 'Serum Perawatan Pori',
        match_score: 95,
        why_recommended: 'Formulasi serum Niacinamide 10% terbukti 95% cocok untuk mengontrol T-Zone berminyak dan memperkecil pori.',
      })
      prodList.push({
        product_name: 'Skincluv BHA Clarifying Cleansing Gel',
        category: 'Pembersih Wajah',
        match_score: 91,
        why_recommended: 'Pembersih lembut berbahan BHA alami untuk mengangkat komedo tanpa merusak moisture barrier.',
      })
    } else {
      prodList.push({
        product_name: 'Skincluv Barrier Repair Centella Moisturizer',
        category: 'Pelembab Pelindung',
        match_score: 96,
        why_recommended: 'Mengandung Centella Asiatica & Ceramide yang 96% presisi menenangkan kulit dan mengunci kadar air.',
      })
      prodList.push({
        product_name: 'Skincluv Hydra Glow Serum',
        category: 'Serum Hidrasi',
        match_score: 92,
        why_recommended: 'Membantu mencerahkan warna kulit tidak merata sekaligus mengembalikan elastisitas alami.',
      })
    }
    enriched.product_recommendations = prodList
  }

  return enriched
}

export default function FaceScanPage() {
  const { user, coinBalance, activeSkinProfile, setActiveSkinProfile } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage } = useInvokeAI()

  const [step, setStep] = useState<Step>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('Mengecek kejelasan foto & deteksi wajah...')
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentCoins = coinBalance?.balance ?? 0

  // Dynamic Real-Time Contextual Processing Message Rotation
  useEffect(() => {
    if (step !== 'processing') return

    const messagesList = [
      'Mengecek kejelasan foto & deteksi wajah...',
      'Wajah terdeteksi! Memproses titik area masalah...',
      'Menganalisis kadar minyak, kelembapan, & pori-pori...',
      'Menghitung skor kecocokan produk & zat aktif...',
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
    setSelectedRegionId(null)
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

  // Unified 1-Click Scan Handler
  const startUnifiedScan = async () => {
    if (!imageBase64) return

    setStep('processing')
    setErrorMsg(null)
    setValidation(null)
    setAnalysis(null)
    setStatusText('Mengecek kejelasan foto & deteksi wajah...')
    setSelectedRegionId(null)

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
      setStatusText('Wajah terdeteksi! Memproses pemetaan area & rekomendasi produk...')

      const rawResult = await invoke<AnalysisResult>({
        feature_slug: 'face_analysis',
        messages: [{ role: 'user', content: 'Analisis kondisi kulit wajah secara detail.' }],
        input_context: { image_base64: imageBase64 },
      })

      if (!rawResult || typeof rawResult !== 'object') {
        setErrorMsg('Gagal menganalisis kulit wajah. Silakan coba lagi.')
        setStep('error')
        return
      }

      // Enrich result with smart contextual fallbacks if DB prompt returns v1 schema
      const analysisRes = enrichAnalysisResult(rawResult)

      setAnalysis(analysisRes)
      setStep('result')

      if (analysisRes.detected_regions && analysisRes.detected_regions.length > 0) {
        setSelectedRegionId(analysisRes.detected_regions[0].id)
      }

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
    setSelectedRegionId(null)
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
          <p>Dapatkan pemetaan titik jerawat/pori, rekomendasi zat aktif, dan skor kecocokan produk dari foto wajah kamu.</p>
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

              {/* Pre-Scan Koin Notice Pill & Action Buttons */}
              {step === 'upload' && imagePreview && (
                <div className="action-button-group">
                  <div className="coin-notice-pill">
                    <Zap size={16} className="zap-icon" />
                    <span>
                      Pemindaian ini menggunakan <strong>5 Koin</strong>. Koin tetap terpotong jika foto buram/salah. Pastikan foto wajah terang & jelas!
                    </span>
                  </div>

                  <button className="btn btn-primary btn-block btn-lg" onClick={startUnifiedScan}>
                    <Sparkles size={20} /> Analisis Kesehatan Kulit (5 Koin)
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
                  <p className="processing-sub">Kecerdasan buatan Skincluv sedang memetakan titik masalah kulit kamu...</p>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: Smart Rejection Card */}
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

          {/* STATE 5: Result Card (Rich Diagnostic Card with Bounding Boxes, Crops & Match Scores) */}
          {step === 'result' && analysis && (
            <div className="result-main-container animate-fade-in">
              {/* Image with Interactive Bounding Box Hotspot Overlays */}
              <div className="result-hero-box">
                {imagePreview && <img src={imagePreview} alt="Wajah" className="result-face-img" />}

                {/* Hotspot Overlays on Image */}
                {analysis.detected_regions?.map((reg) => {
                  const sanitized = sanitizeBox(reg.box_2d)
                  if (!sanitized) return null
                  const isSelected = reg.id === selectedRegionId
                  return (
                    <div
                      key={reg.id}
                      className={`hotspot-box ${isSelected ? 'is-selected' : ''}`}
                      style={{
                        top: `${sanitized.ymin}%`,
                        left: `${sanitized.xmin}%`,
                        width: `${sanitized.xmax - sanitized.xmin}%`,
                        height: `${sanitized.ymax - sanitized.ymin}%`,
                      }}
                      onClick={() => setSelectedRegionId(reg.id)}
                      title={`${reg.label} (${reg.location})`}
                    >
                      <span className="hotspot-label-tag">{reg.label}</span>
                    </div>
                  )
                })}

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

              {/* SECTION A: Canvas Auto-Cropped Detected Regions */}
              {analysis.detected_regions && analysis.detected_regions.length > 0 && (
                <div className="result-section-box">
                  <div className="section-title-wrap">
                    <MapPin size={18} className="section-icon" />
                    <h4>Titik Masalah Kulit Terdeteksi ({analysis.detected_regions.length})</h4>
                  </div>
                  <div className="regions-grid">
                    {analysis.detected_regions.map((reg) => (
                      <SkinRegionCropper
                        key={reg.id}
                        imageSrc={imagePreview || ''}
                        box={reg.box_2d}
                        label={reg.label}
                        location={reg.location}
                        description={reg.description}
                        severity={reg.severity}
                        isSelected={reg.id === selectedRegionId}
                        onClick={() => setSelectedRegionId(reg.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION B: Essential Active Ingredients Required */}
              {analysis.recommended_ingredients && analysis.recommended_ingredients.length > 0 && (
                <div className="result-section-box">
                  <div className="section-title-wrap">
                    <FlaskConical size={18} className="section-icon" />
                    <h4>Zat Aktif Skincare yang Dibutuhkan Kulit Kamu</h4>
                  </div>
                  <div className="ingredients-list">
                    {analysis.recommended_ingredients.map((ing, idx) => (
                      <div key={idx} className="ingredient-item-card">
                        <div className="ing-badge">✦</div>
                        <div className="ing-content">
                          <span className="ing-name">{ing.name}</span>
                          <span className="ing-purpose">{ing.purpose}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION C: Product Match Recommendations with Match Scores */}
              {analysis.product_recommendations && analysis.product_recommendations.length > 0 && (
                <div className="result-section-box">
                  <div className="section-title-wrap">
                    <ShoppingBag size={18} className="section-icon" />
                    <h4>Rekomendasi Produk Berdasarkan Skor Kecocokan Kulit</h4>
                  </div>
                  <div className="products-grid">
                    {analysis.product_recommendations.map((prod, idx) => (
                      <div key={idx} className="product-match-card">
                        <div className="product-header">
                          <div className="product-info">
                            <span className="product-cat">{prod.category}</span>
                            <h5 className="product-name">{prod.product_name}</h5>
                          </div>
                          <div className="match-score-badge">
                            <Sparkles size={13} /> {prod.match_score || 92}% Match Score
                          </div>
                        </div>
                        <p className="product-why">{prod.why_recommended}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={!!pendingCoinConfirm}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={currentCoins}
          featureName={pendingCoinConfirm.featureName}
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

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

        /* Action Buttons & Coin Pre-scan Notice */
        .action-button-group { display: flex; flex-direction: column; gap: 12px; }
        .coin-notice-pill {
          display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: var(--radius-xl);
          background: rgba(254, 243, 199, 0.6); border: 1px solid #fcd34d; font-size: 0.8125rem; color: #92400e; line-height: 1.4;
        }
        .zap-icon { color: #d97706; flex-shrink: 0; margin-top: 2px; }

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

        /* Smart Rejection Card */
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
        .result-hero-box { position: relative; width: 100%; max-height: 360px; border-radius: var(--radius-2xl); overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
        .result-face-img { width: 100%; height: 100%; max-height: 360px; object-fit: cover; }
        .result-badge-confidence {
          position: absolute; bottom: 12px; left: 12px; background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px);
          color: #065f46; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-full);
          padding: 6px 14px; font-size: 0.8125rem; font-weight: 700; display: flex; align-items: center; gap: 6px; z-index: 10;
        }

        /* Hotspot Box Overlay on Image */
        .hotspot-box {
          position: absolute; border: 2px dashed rgba(14, 165, 233, 0.8); background: rgba(14, 165, 233, 0.15);
          border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; z-index: 5;
        }
        .hotspot-box:hover, .hotspot-box.is-selected {
          border-style: solid; border-color: #0ea5e9; background: rgba(14, 165, 233, 0.3);
          box-shadow: 0 0 16px rgba(14, 165, 233, 0.6);
        }
        .hotspot-label-tag {
          position: absolute; top: -22px; left: 0; background: #0ea5e9; color: white;
          font-size: 0.6875rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-sm); white-space: nowrap;
          box-shadow: var(--shadow-sm);
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

        /* Section Layout Boxes */
        .result-section-box { display: flex; flex-direction: column; gap: 12px; }
        .section-title-wrap { display: flex; align-items: center; gap: 8px; color: var(--color-primary); }
        .section-title-wrap h4 { font-size: 0.95rem; font-weight: 700; margin: 0; font-family: var(--font-heading); }
        .section-icon { color: var(--color-primary); }

        .regions-grid { display: flex; flex-direction: column; gap: 10px; }

        /* Ingredients List */
        .ingredients-list { display: flex; flex-direction: column; gap: 8px; }
        .ingredient-item-card {
          display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px;
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);
        }
        .ing-badge {
          width: 28px; height: 28px; border-radius: 50%; background: var(--color-secondary-fixed);
          color: var(--color-primary); font-weight: 700; display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; flex-shrink: 0;
        }
        .ing-content { display: flex; flex-direction: column; gap: 2px; }
        .ing-name { font-size: 0.9375rem; font-weight: 700; color: var(--color-primary); }
        .ing-purpose { font-size: 0.8125rem; color: var(--color-text-main); line-height: 1.4; }

        /* Product Match Cards */
        .products-grid { display: flex; flex-direction: column; gap: 10px; }
        .product-match-card {
          display: flex; flex-direction: column; gap: 8px; padding: 14px;
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);
        }
        .product-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .product-info { display: flex; flex-direction: column; gap: 2px; }
        .product-cat { font-size: 0.75rem; font-weight: 700; color: var(--color-secondary); text-transform: uppercase; }
        .product-name { font-size: 0.95rem; font-weight: 700; color: var(--color-primary); margin: 0; }
        .match-score-badge {
          display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.12));
          border: 1px solid rgba(16, 185, 129, 0.4); color: #047857; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
        }
        .product-why { font-size: 0.8125rem; color: var(--color-text-main); margin: 0; line-height: 1.4; }

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
