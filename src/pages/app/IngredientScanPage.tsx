import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FlaskConical,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Camera,
  FileText,
  User,
  Sparkles,
  BookOpen,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Edit3,
  RefreshCw,
  Coins,
  Crown,
  Trophy,
  Search,
  RotateCcw,
  LayoutGrid,
  ListFilter,
} from 'lucide-react'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { useAuthStore } from '@/store/authStore'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import { supabase } from '@/lib/supabase'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import { compressImageForAI } from '@/utils/imageQualityValidator'
import { detectHumanFace } from '@/utils/faceLandmarkDetector'

type ScanStage = 'upload' | 'scanning' | 'result'
type BadgeFilter = 'all' | 'aman' | 'hati' | 'hindari'

export interface PersonalContraindication {
  ingredient: string
  user_condition: string
  warning: string
  clinical_advice?: string
}

export interface LayeringCombo {
  pair: string
  benefit?: string
  warning?: string
  severity?: 'fatal' | 'caution' | string
  clinical_action?: string
}

export interface IngredientItem {
  name: string
  badge?: 'aman' | 'hati' | 'hindari' | string
  badgeLabel?: string
  function?: string
  comedogenic_score?: number
  notes?: string
  skinType?: string
  interaction?: string
  is_drug_or_banned?: boolean
  is_hero_active?: boolean
  category?: 'active' | 'emollient' | 'base' | string
  personal?: {
    ok: boolean
    text: string
  }
}

export interface IngredientAnalysisResult {
  is_valid_skincare?: boolean
  is_readable?: boolean
  rejection_reason?: string
  rejection_suggestion?: string
  partial_read_warning?: string
  product_name?: string
  extracted_raw_text?: string
  clinical_summary?: string
  safety_score?: number
  comedogenic_rating?: string
  total_ingredients?: number
  safe_count?: number
  caution_count?: number
  avoid_count?: number
  overall_recommendation?: string
  bpom_alert?: string | null
  suitable_for_skin_types?: string[]
  layering_guide?: {
    best_combos?: LayeringCombo[]
    danger_combos?: LayeringCombo[]
  }
  personal_contraindications?: PersonalContraindication[]
  hero_actives?: IngredientItem[]
  key_ingredients?: IngredientItem[]
  ingredients_breakdown?: IngredientItem[]
}

export default function IngredientScanPage() {
  const { profile, activeSkinProfile, coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage, askCoinConfirmation, getLastError } = useInvokeAI()
  const currentCoins = coinBalance?.balance ?? 0
  const ingredientCost = getFeatureCreditCost('ingredient_scan')
  const isFreeTierOutOfCredits = !hasPaidAiQuota(subscription) && currentCoins < ingredientCost

  const userSkinType = activeSkinProfile?.skin_type ? activeSkinProfile.skin_type.toUpperCase() : 'BERMINYAK (OILY)'
  const userConcerns = activeSkinProfile?.skin_concerns?.length
    ? activeSkinProfile.skin_concerns.join(', ')
    : 'Pori-pori besar, Rawan Jerawat, Kemerahan'
  const skinTypeDesc = `${userSkinType.toLowerCase()}, ${userConcerns.toLowerCase()}`

  // Stage & Filter States (Photo-First Scan Experience)
  const [stage, setStage] = useState<ScanStage>('upload')
  const [filterBadge, setFilterBadge] = useState<BadgeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'chips' | 'cards'>('chips')

  // Photo & Preview States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Quick-Correction Editable State (Anti-Salah Baca OCR)
  const [isEditingText, setIsEditingText] = useState(false)
  const [editableText, setEditableText] = useState('')

  // Processing & Errors
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanResult, setScanResult] = useState<IngredientAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Scanner Stage Animation Text & Educational Dermatology Tips
  const scanStagesText = useMemo(() => [
    'Menganalisis citra kemasan via Gemini Vision...',
    'Membaca teks mikro & mengurai urutan formula bahan...',
    `Mengevaluasi indeks komedogenik & kecocokan kulit (${userSkinType})...`,
    'Memvalidasi matriks keamanan BPOM & panduan layering...',
  ], [userSkinType])

  const clinicalTips = useMemo(() => [
    'Urutan komposisi bahan pada kemasan kosmetik dicantumkan dari konsentrasi tertinggi hingga terendah.',
    'Bahan aktif seperti UV filter, retinoid, atau vitamin C bekerja optimal pada konsentrasi ilmiah tertentu.',
    'Formula dengan banyak bahan dianalisis per molekul untuk mendeteksi potensi alergen dan pemicu iritasi.',
    'Indeks komedogenik mengevaluasi kecenderungan bahan menyumbat pori-pori berdasarkan tipe kulitmu.',
  ], [])

  const [scanTextIndex, setScanTextIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const topResultRef = useRef<HTMLDivElement>(null)

  // Stage 2 Scanning Timers (Natural Pacing & Tip Rotation)
  useEffect(() => {
    if (stage !== 'scanning') {
      setScanTextIndex(0)
      setTipIndex(0)
      return
    }

    const textInterval = setInterval(() => {
      setScanTextIndex((prev) => (prev < scanStagesText.length - 1 ? prev + 1 : prev))
    }, 2800)

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % clinicalTips.length)
    }, 3800)

    return () => {
      clearInterval(textInterval)
      clearInterval(tipInterval)
    }
  }, [stage, scanStagesText, clinicalTips.length])

  // Auto-scroll smooth to results when Stage 3 activates
  useEffect(() => {
    if (stage === 'result') {
      topResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [stage])

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP)')
      return
    }
    setErrorMsg(null)
    setPreviewUrl(URL.createObjectURL(file))
    setScanResult(null)

    try {
      // Kompresi khusus OCR Ingredient: gunakan resolusi 1600px & quality 0.85 agar teks kecil komposisi kemasan tetap tajam terbaca
      const base64Data = await compressImageForAI(file, 1600, 0.85)
      
      // Client-side Face Detection Gate: Cegah foto selfie wajah manusia masuk ke Scan Ingredient
      // Hanya tolak jika BENAR-BENAR wajah manusia yang valid, tidak tertutup, dan dominan (>25% frame)
      // agar tangan/jari yang memegang botol skincare atau gambar kemasan tidak salah ditolak
      try {
        const faceCheck = await detectHumanFace(base64Data)
        if (faceCheck.isValidFace && faceCheck.isUnobstructed && faceCheck.faceCoverage > 25) {
          setErrorMsg('Foto yang Anda unggah terdeteksi sebagai wajah manusia. Halaman Scan Ingredient ini khusus untuk membaca label/botol kemasan produk skincare. Untuk memeriksa kondisi kulit wajah, silakan gunakan menu Scan Wajah.')
          setPreviewUrl(null)
          setImageBase64(null)
          return
        }
      } catch (faceErr) {
        console.warn('Face pre-check skipped:', faceErr)
      }

      setImageBase64(base64Data)
    } catch {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setImageBase64(result.split(',')[1])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    setImageBase64(null)
    setScanResult(null)
  }

  const handleStartAnalysis = async (customText?: string) => {
    // customText hanya digunakan untuk re-analisis dari Quick-Correction box
    if (!imageBase64 && !customText) {
      setErrorMsg('Pilih atau ambil foto label kemasan produk skincare terlebih dahulu.')
      return
    }

    // ChatGPT Boundary A: Frontend sanitization & canonicalization
    const sanitizedCustomText = customText
      ? customText
          .normalize('NFKC')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .trim()
          .slice(0, 3000)
      : undefined

    if (customText && !sanitizedCustomText) {
      setErrorMsg('Teks komposisi yang dimasukkan kosong atau tidak valid.')
      return
    }

    if (isFreeTierOutOfCredits) {
      const confirmed = await askCoinConfirmation(ingredientCost, 'Analisis Komposisi Produk')
      if (!confirmed) return
    }

    setErrorMsg(null)
    setStage('scanning')
    setIsAnalyzing(true)
    setIsEditingText(false)

    try {
      const input_context: Record<string, string> = {}
      if (sanitizedCustomText) {
        input_context.ingredient_text = sanitizedCustomText
      } else if (imageBase64) {
        input_context.image_base64 = imageBase64
      }

      const result = await invoke<IngredientAnalysisResult>({
        feature_slug: 'ingredient_scan',
        messages: [
          {
            role: 'user',
            content: sanitizedCustomText
              ? `Teks komposisi produk skincare telah dilampirkan via input_context. Lakukan analisis formula dermatologi ilmiah mendalam untuk profil kulit Pengguna: Tipe ${userSkinType}, Masalah: ${userConcerns}.`
              : `Foto kemasan produk skincare telah dilampirkan bersama permintaan ini.

PETUNJUK OCR & ANALISIS WAJIB:
1. BACA dan EKSTRAK teks komposisi (Ingredients / Komposisi) yang TERCETAK NYATA pada foto ini secara presisi huruf demi huruf.
2. DILARANG KERAS MENEBAK, MENAMBAH, ATAU MENGGANTI bahan dengan produk pasaran lain (seperti Glad2Glow, Skintific, Somethinc, dll)! Ekstrak HANYA bahan yang benar-benar tercetak di kemasan foto ini. Jika di foto hanya tertulis 10 bahan, keluarkan tepat 10 bahan tersebut di extracted_raw_text dan ingredients_breakdown.
3. Nama produk: Ambil nama yang tercetak pada foto produk (misal jika ada kata "Salmon", gunakan nama tersebut) atau jika tidak ada tulis "Formula Skincare Terdeteksi".
4. Evaluasi kecocokan setiap bahan untuk profil kulit Pengguna: Tipe ${userSkinType}, Masalah: ${userConcerns}.
5. Jika foto BUKAN produk kosmetik/skincare atau teks tidak terbaca sama sekali, kembalikan is_valid_skincare: false atau is_readable: false sesuai aturan sistem.`,
          },
        ],
        input_context,
      })

      if (!result || typeof result !== 'object') {
        const actualErr = getLastError()
        if (actualErr === 'INSUFFICIENT_CREDITS') {
          setErrorMsg(`Credits kamu tidak mencukupi untuk Analisis Komposisi (butuh ${ingredientCost} Credits). Selesaikan misi harian untuk mendapatkan Credits gratis atau upgrade ke paket Glow / PRO.`)
        } else {
          setErrorMsg(actualErr || 'Gagal menganalisis komposisi produk. Silakan periksa foto dan coba lagi.')
        }
        setStage('upload')
        return
      }

      // Check validation safeguards
      if (result.is_valid_skincare === false || result.is_readable === false) {
        const errorReason =
          result.rejection_reason ||
          'Foto tidak dapat dianalisis sebagai produk skincare yang sah. Pastikan foto memuat kemasan atau teks komposisi yang jelas.'
        const suggestion = result.rejection_suggestion ? ` (${result.rejection_suggestion})` : ''
        setErrorMsg(`${errorReason}${suggestion}`)
        setStage('upload')
        return
      }

      // Anti-Hallucination Guard: jika safety_score === 0 dan tidak ada teks terbaca → AI berhalusinasi
      const extractedList = result.ingredients_breakdown || result.key_ingredients || []
      const hasExtractedText = !!result.extracted_raw_text?.trim()
      const isHallucination = (result.safety_score === 0 || result.safety_score === null) && !hasExtractedText && !customText
      if (isHallucination) {
        setErrorMsg('AI tidak dapat mengidentifikasi teks komposisi skincare pada foto ini. Pastikan foto memuat label "Ingredients" yang jelas dan terbaca.')
        setStage('upload')
        return
      }

      if (extractedList.length === 0 && !hasExtractedText && !customText) {
        setErrorMsg('Tidak ditemukan teks komposisi bahan pada foto kemasan ini. Pastikan foto memuat tabel ingredients yang jelas.')
        setStage('upload')
        return
      }

      setScanResult(result)
      const rawText =
        result.extracted_raw_text ||
        result.ingredients_breakdown?.map((i) => i.name).join(', ') ||
        customText ||
        ''
      setEditableText(rawText)
      setStage('result')

      // Save to ingredient_scans history (multi-session persistence)
      if (profile?.id) {
        const keyIngs = (result.key_ingredients || []).map((k) =>
          typeof k === 'string' ? k : k.name
        )
        const isSafe = (result.safety_score ?? 80) >= 65 && (result.avoid_count ?? 0) === 0

        supabase
          .from('ingredient_scans')
          .insert({
            user_id: profile.id,
            product_name: result.product_name || 'Formula Skincare Terdeteksi',
            brand: (result as any).brand || null,
            safety_score: result.safety_score ?? null,
            is_safe: isSafe,
            matched_concerns: activeSkinProfile?.skin_concerns || [],
            key_ingredients: keyIngs,
            ingredients_breakdown: (result.ingredients_breakdown || []) as any,
            raw_ai_response: result as any,
          })
          .then((res) => {
            if (res && 'error' in res && res.error) {
              console.warn('[Supabase ingredient_scans history insert]:', res.error.message)
            }
          }, (err: unknown) => console.warn('[Supabase ingredient_scans insert error]:', err))
      }
    } catch (err: any) {
      console.error('Ingredient scan error:', err)
      setErrorMsg(err.message || 'Gagal menganalisis komposisi produk.')
      setStage('upload')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReanalyzeWithText = () => {
    if (!editableText.trim()) return
    handleStartAnalysis(editableText)
  }

  const handleResetFlow = () => {
    setStage('upload')
    setPreviewUrl(null)
    setImageBase64(null)
    setScanResult(null)
    setErrorMsg(null)
    setFilterBadge('all')
    setSearchQuery('')
    setIsEditingText(false)
    setEditableText('')
  }

  // Helper for Hero Actives & Safe Neutrals (Kimi & Claude)
  const HERO_ACTIVES_KEYWORDS = useMemo(() => [
    'niacinamide', 'retinol', 'retinal', 'salicylic acid', 'glycolic acid', 'lactic acid',
    'ascorbic acid', 'vitamin c', 'ceramide', 'centella', 'madecassoside', 'asiaticoside',
    'hyaluronic acid', 'sodium hyaluronate', 'panthenol', 'azelaic acid', 'zinc pca',
    'snail secretion', 'bakuchiol', 'copper peptide', 'alpha arbutin', 'tranexamic acid',
    'peptide', 'adenosine', 'resveratrol', 'green tea', 'tea tree'
  ], [])

  const ALWAYS_SAFE_NEUTRALS = useMemo(() => [
    'dimethicone', 'cetyl alcohol', 'peg-8', 'water', 'aqua', 'glycerin', 'squalane', 'petrolatum', 'mineral oil'
  ], [])

  // Normalization Helpers for Ingredient Breakdown
  const rawIngredientsList = scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []

  const displayIngredientsList: IngredientItem[] = useMemo(() => {
    if (!rawIngredientsList.length) return []
    return rawIngredientsList.map((item) => {
      const lowerName = (item.name || '').toLowerCase().trim()
      const isNeutralSafe = ALWAYS_SAFE_NEUTRALS.some((s) => lowerName === s || lowerName.startsWith(s + ' '))

      let badgeType =
        item.badge === 'aman' || item.badge === 'safe'
          ? 'aman'
          : item.badge === 'hindari' || item.badge === 'avoid'
          ? 'hindari'
          : 'hati'

      if (isNeutralSafe) {
        badgeType = 'aman'
      }

      const badgeLabelText =
        isNeutralSafe
          ? 'Aman'
          : item.badgeLabel || (badgeType === 'aman' ? 'Aman' : badgeType === 'hindari' ? 'Hindari' : 'Perlu diperhatikan')

      const isHero =
        item.is_hero_active ||
        item.category === 'active' ||
        item.category === 'Active' ||
        HERO_ACTIVES_KEYWORDS.some((k) => lowerName.includes(k))

      return {
        name: item.name,
        badge: badgeType,
        badgeLabel: badgeLabelText,
        function: item.function || item.notes || '',
        comedogenic_score: isNeutralSafe && typeof item.comedogenic_score !== 'number' ? 0 : item.comedogenic_score,
        skinType: item.skinType || '',
        interaction: item.interaction || '',
        personal: item.personal?.text ? item.personal : undefined,
        is_drug_or_banned: item.is_drug_or_banned,
        is_hero_active: isHero,
      }
    })
  }, [rawIngredientsList, ALWAYS_SAFE_NEUTRALS, HERO_ACTIVES_KEYWORDS])

  // Hero Actives List (Tier 1: Top Highlights - Always visible at top, per Claude)
  const heroActivesList = useMemo(() => {
    const matched = displayIngredientsList.filter((i) => i.is_hero_active)
    if (matched.length > 0) return matched.slice(0, 5)
    return displayIngredientsList.filter((i) => i.function && i.badge === 'aman').slice(0, 3)
  }, [displayIngredientsList])

  // Counts & Filter logic (Derived via useMemo per Claude)
  const safeCount = useMemo(() => displayIngredientsList.filter((i) => i.badge === 'aman').length, [displayIngredientsList])
  const cautionCount = useMemo(() => displayIngredientsList.filter((i) => i.badge === 'hati').length, [displayIngredientsList])
  const avoidCount = useMemo(() => displayIngredientsList.filter((i) => i.badge === 'hindari').length, [displayIngredientsList])
  const totalCount = displayIngredientsList.length

  const filteredIngredients = useMemo(() => {
    return displayIngredientsList.filter((item) => {
      const matchesBadge = filterBadge === 'all' || item.badge === filterBadge
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.function && item.function.toLowerCase().includes(query)) ||
        (item.skinType && item.skinType.toLowerCase().includes(query))
      return matchesBadge && matchesSearch
    })
  }, [displayIngredientsList, filterBadge, searchQuery])

  return (
    <div className="skincluv-ingredient-page">
      {/* Coin Deduction Confirmation Modal */}
      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={true}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={coinBalance?.balance ?? 0}
          featureName={pendingCoinConfirm.featureName || 'Scan Ingredient AI'}
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* Anchor for Auto-Scroll on Results */}
      <div ref={topResultRef} />

      {/* Main 2-Column Responsive Grid */}
      <div className="ingredient-grid-layout">
        {/* LEFT COLUMN: Main Feature Workspace */}
        <div className="main-workspace-col">
          {/* Header Section */}
          <div className="page-header-box">
            <h1 className="page-title">Scan Ingredient Skincare</h1>
            <p className="page-subtitle">
              Analisis keamanan komposisi bahan kosmetik secara ilmiah yang disesuaikan khusus dengan profil kulitmu.
            </p>
          </div>

          {/* Alert Error Box */}
          {errorMsg && (
            <div className="error-alert">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STAGE 1: PHOTO-FIRST UPLOAD */}
          {stage === 'upload' && (
            <div className="stage-card">
              <div
                className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="preview-container">
                    <img src={previewUrl} alt="Preview label komposisi" className="preview-img" />
                    <button onClick={handleClearImage} className="clear-image-btn">
                      <X size={14} /> Ganti / Hapus Foto
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="dz-icon-avatar">
                      <Camera size={26} />
                    </div>
                    <h3 className="dz-main-title">Ambil / Unggah Foto Label Komposisi</h3>
                    <p className="dz-sub-title">Pastikan teks komposisi pada kemasan terlihat jelas dan terang</p>
                    <div className="dz-upload-btn-fake">
                      <Upload size={15} /> Pilih File atau Jepret Kamera
                    </div>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>


              {/* Smart Photography Tips Accordion/Card */}
              <div className="photo-tips-card">
                <h4 className="photo-tips-title">
                  <Sparkles size={14} className="text-amber-500" /> Tips Foto Kemasan Supaya 100% Akurat:
                </h4>
                <ul className="photo-tips-list">
                  <li>
                    <strong>Dekatkan Kamera:</strong> Fokuskan lensa langsung ke bagian teks <em>"Ingredients / Komposisi"</em> (tidak perlu seluruh botol).
                  </li>
                  <li>
                    <strong>Hindari Silau Lampu:</strong> Miringkan botol sedikit agar pantulan cahaya lampu tidak menutupi tulisan.
                  </li>
                  <li>
                    <strong>Pencahayaan Terang:</strong> Pastikan tulisan tidak gelap atau buram/goyang.
                  </li>
                </ul>
              </div>

              {/* Credit Notice if out of credits on Free tier */}
              {isFreeTierOutOfCredits && (
                <div className="ingredient-credit-notice">
                  <div className="notice-left">
                    <Coins size={16} className="notice-coin-icon" />
                    <span>
                      Butuh <strong>{ingredientCost} Credits</strong> untuk analisis komposisi (Saldo kamu: <strong>{currentCoins} Credits</strong>).
                    </span>
                  </div>
                  <div className="notice-right">
                    <Link to="/missions" className="notice-sub-btn mission">
                      <Trophy size={13} /> Misi Gratis
                    </Link>
                    <Link to="/pricing" className="notice-sub-btn upgrade">
                      <Crown size={13} /> Upgrade
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                className="btn-primary-action"
                onClick={() => handleStartAnalysis()}
                disabled={isAnalyzing || !imageBase64}
              >
                <FlaskConical size={18} />
                <span>Mulai Pindai Komposisi Skincare</span>
              </button>

              {/* Medical Disclaimer */}
              <div className="disclaimer-banner">
                <Info size={18} className="disclaimer-icon" />
                <span>
                  <b>Penafian medis:</b> Hasil analisis AI ini bersifat panduan edukasi klinis, bukan pengganti diagnosis dokter spesialis kulit profesional.
                </span>
              </div>
            </div>
          )}

          {/* STAGE 2: NEURAL AI SCANNER HUD */}
          {stage === 'scanning' && (
            <div className="stage-card scanning-card">
              <div className="scan-frame-viewport">
                {previewUrl ? (
                  <img src={previewUrl} alt="Label Komposisi" className="scan-img-preview" />
                ) : (
                  <div className="mock-label-box">Foto Label Komposisi Produk</div>
                )}

                {/* HUD High-Tech Grid & Corner Brackets */}
                <div className="hud-grid-overlay" />
                <div className="hud-corner top-left" />
                <div className="hud-corner top-right" />
                <div className="hud-corner bottom-left" />
                <div className="hud-corner bottom-right" />

                {/* Sweeping Laser Beam */}
                <div className="scan-laser-beam" />

                {/* Live Neural Vision Status Pill */}
                <div className="hud-status-badge">
                  <span className="hud-pulse-dot" />
                  <span>AI OCR VISION ACTIVE</span>
                </div>
              </div>

              {/* Shimmering Phase Status */}
              <div className="scan-status-row">
                <div className="bouncing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="shimmer-scan-text">{scanStagesText[scanTextIndex]}</span>
              </div>

              {/* Smooth Indeterminate Progress Bar */}
              <div className="scan-progress-bar-track">
                <div className="scan-progress-bar-glow" />
              </div>

              {/* Educational Clinical Tip Box */}
              <div className="scan-tip-card">
                <div className="tip-header">
                  <Sparkles size={13} className="tip-sparkle-icon" />
                  <span>Catatan Dermatologi</span>
                </div>
                <p className="tip-body">{clinicalTips[tipIndex]}</p>
              </div>
            </div>
          )}

          {/* STAGE 3: RESULTS & QUICK-CORRECTION */}
          {stage === 'result' && (
            <div className="results-stack">
              {/* Score Summary Box with Clinical AI Assessment */}
              <div className="result-summary-card">
                <div className="summary-card-top-row">
                  {previewUrl && (
                    <div className="product-packaging-thumb-box">
                      <img src={previewUrl} alt="Foto Kemasan Produk" className="product-packaging-thumb-img" />
                      <span className="packaging-thumb-badge">Label Kemasan</span>
                    </div>
                  )}
                  <div className={`score-ring-avatar ${avoidCount > 0 ? 'score-danger' : cautionCount > 0 ? 'score-caution' : 'score-safe'}`}>
                    <div className="sr-number-row">
                      <span className="sr-val">{scanResult?.safety_score ?? Math.round((safeCount / (totalCount || 1)) * 100)}</span>
                      <span className="sr-scale">/100</span>
                    </div>
                    <span className="sr-unit">Keamanan</span>
                  </div>
                  <div className="summary-meta">
                    <div className="product-detected-pill">
                      <Sparkles size={13} /> {scanResult?.product_name || 'Formula Skincare Terdeteksi'}
                    </div>
                    <h3 className="summary-title">
                      {avoidCount > 0
                        ? 'Perlu Waspada & Perhatian Khusus'
                        : cautionCount > 0
                        ? 'Sebagian Besar Cocok dengan Catatan'
                        : 'Sangat Cocok & Aman untuk Kulitmu'}
                    </h3>
                    <p className="summary-subtitle">
                      {safeCount} bahan aman, {cautionCount} perlu diperhatikan, {avoidCount} berisiko untuk profil kulit ({userSkinType.toLowerCase()}).
                    </p>
                    {scanResult?.comedogenic_rating && (
                      <div className="comedogenic-pill">
                        Indeks Komedogenik (Pori Tersumbat): <strong>{scanResult.comedogenic_rating}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* CLINICAL AI ASSESSMENT BOX: Menampung Analisis Klinis & Rekomendasi Lengkap */}
                {(scanResult?.clinical_summary || scanResult?.overall_recommendation) && (
                  <div className="clinical-assessment-card">
                    <div className="cac-header">
                      <Sparkles size={15} className="text-sky-600 shrink-0" />
                      <strong>Analisis Klinis Formula:</strong>
                    </div>
                    {scanResult.clinical_summary && (
                      <p className="cac-summary-text">{scanResult.clinical_summary}</p>
                    )}
                    {scanResult.overall_recommendation && (
                      <div className="cac-recommendation-box">
                        <div className="cac-rec-header">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <strong>Saran Aplikasi untuk Profil Kulitmu:</strong>
                        </div>
                        <p className="cac-rec-text">{scanResult.overall_recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alert Notifications Group (BPOM & Kualitas Foto) */}
              {(scanResult?.bpom_alert || scanResult?.partial_read_warning) && (
                <div className="scan-alerts-group">
                  {/* BPOM Regulatory Alert Banner */}
                  {scanResult?.bpom_alert && (
                    <div className="bpom-alert-banner">
                      <div className="bpom-alert-header">
                        <ShieldAlert size={18} className="text-rose-600 shrink-0" />
                        <strong>Peringatan Regulasi BPOM RI & Keamanan Produk:</strong>
                      </div>
                      <p className="bpom-alert-text">{scanResult.bpom_alert}</p>
                    </div>
                  )}

                  {/* Partial Read Warning Banner (Jika ada teks pudar) */}
                  {scanResult?.partial_read_warning && (
                    <div className="partial-warning-box">
                      <AlertCircle size={16} className="shrink-0 text-amber-600" />
                      <span>
                        <strong>Catatan Label:</strong> {scanResult.partial_read_warning}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TIER 1: HERO ACTIVES HIGHLIGHTS (Paling atas, selalu tampil mencolok - Konsensus Claude & Kimi) */}
              {heroActivesList.length > 0 && (
                <div className="hero-actives-card">
                  <div className="hero-header">
                    <div className="hero-header-left">
                      <Sparkles size={16} className="text-amber-500 shrink-0" />
                      <h4 className="hero-title">Bahan Kunci & Pahlawan (Hero Actives):</h4>
                    </div>
                    <span className="hero-count-pill">{heroActivesList.length} Bahan Unggulan</span>
                  </div>
                  <div className="hero-actives-grid">
                    {heroActivesList.map((hero, hIdx) => (
                      <div key={hIdx} className="hero-pill-item">
                        <div className="hero-pill-top">
                          <span className="hero-pill-name">{hero.name}</span>
                          {typeof hero.comedogenic_score === 'number' && (
                            <span className={`comedogenic-mini-badge score-${hero.comedogenic_score}`}>
                              Pori: {hero.comedogenic_score}
                            </span>
                          )}
                        </div>
                        {hero.function ? (
                          <p className="hero-pill-desc">{hero.function}</p>
                        ) : (
                          <p className="hero-pill-desc text-slate-400">Bahan aktif formula.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PERSONAL CONTRAINDICATIONS: Interaksi Bahan vs Kondisi Kulit Pengguna (RFC 007 Claude & Kimi) */}
              {scanResult?.personal_contraindications && scanResult.personal_contraindications.length > 0 && (
                <div className="personal-contraindications-card">
                  <div className="pc-header text-amber-800">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <strong>Catatan Khusus untuk Profil Kulitmu ({userSkinType.toLowerCase()}):</strong>
                  </div>
                  <div className="pc-list">
                    {scanResult.personal_contraindications.map((pc, pcIdx) => (
                      <div key={pcIdx} className="pc-item">
                        <div className="pc-title-row">
                          <b>{pc.ingredient}</b>
                          <span className="pc-condition-pill">{pc.user_condition}</span>
                        </div>
                        <p className="pc-warning">{pc.warning}</p>
                        {pc.clinical_advice && (
                          <div className="pc-advice">
                            <em>Saran: {pc.clinical_advice}</em>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUICK-CORRECTION OCR REVIEW BOX */}
              <div className="detected-text-box">
                <div className="dt-header">
                  <div className="dt-title">
                    <FileText size={15} className="text-sky-600" />
                    <strong>Teks Komposisi Terbaca dari Kemasan:</strong>
                  </div>
                  <button
                    className="btn-toggle-edit"
                    onClick={() => setIsEditingText(!isEditingText)}
                  >
                    <Edit3 size={13} /> {isEditingText ? 'Tutup Edit' : 'Koreksi / Tambah Kata'}
                  </button>
                </div>

                {!isEditingText ? (
                  <p className="dt-content">
                    {editableText || scanResult?.extracted_raw_text || rawIngredientsList.map((i) => i.name).join(', ')}
                  </p>
                ) : (
                  <div className="edit-box-wrapper">
                    <p className="edit-hint">
                      Perbaiki jika ada kata/huruf yang kurang tepat atau tambahkan bahan yang terpotong pada kemasan melengkung:
                    </p>
                    <textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="edit-textarea"
                      rows={3}
                    />
                    <button
                      className="btn-reanalyze"
                      onClick={handleReanalyzeWithText}
                      disabled={isAnalyzing || !editableText.trim()}
                    >
                      <RefreshCw size={14} /> Hitung Ulang Analisis dengan Teks Terkoreksi
                    </button>
                  </div>
                )}
              </div>

              {/* Layering Guide Box (Do & Don't Combos Antar-Produk) */}
              {scanResult?.layering_guide && (
                ((scanResult.layering_guide.best_combos && scanResult.layering_guide.best_combos.length > 0) ||
                 (scanResult.layering_guide.danger_combos && scanResult.layering_guide.danger_combos.length > 0)) && (
                  <div className="layering-guide-card">
                    <h4 className="layering-title">
                      <Zap size={16} className="text-amber-500" /> Panduan Layering & Kombinasi Produk Lain
                    </h4>
                    <div className="layering-grid">
                      {scanResult.layering_guide.best_combos && scanResult.layering_guide.best_combos.length > 0 && (
                        <div className="layering-box best-box">
                          <div className="box-header text-emerald-700">
                            <ShieldCheck size={16} /> <strong>Best Combos (Aman & Efektif):</strong>
                          </div>
                          <div className="combos-list">
                            {scanResult.layering_guide.best_combos.map((item, bIdx) => (
                              <div key={bIdx} className="combo-card-item best-combo-card">
                                <div className="combo-card-title text-emerald-800">
                                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                  <b>{item.pair}</b>
                                </div>
                                <p className="combo-card-desc">{item.benefit}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scanResult.layering_guide.danger_combos && scanResult.layering_guide.danger_combos.length > 0 && (
                        <div className="layering-box danger-box">
                          <div className="box-header text-rose-700">
                            <AlertTriangle size={16} /> <strong>Danger Combos (Hindari Bersamaan):</strong>
                          </div>
                          <div className="combos-list">
                            {scanResult.layering_guide.danger_combos.map((item, dIdx) => (
                              <div key={dIdx} className="combo-card-item danger-combo-card">
                                <div className="danger-combo-title-row">
                                  <b>{item.pair}</b>
                                  {item.severity === 'fatal' && (
                                    <span className="combo-severity-badge severity-fatal">FATAL</span>
                                  )}
                                  {item.severity === 'caution' && (
                                    <span className="combo-severity-badge severity-caution">PERHATIAN</span>
                                  )}
                                </div>
                                <p className="danger-combo-desc">{item.warning}</p>
                                {item.clinical_action && (
                                  <div className="danger-combo-action">
                                    <em>Solusi Klinis: {item.clinical_action}</em>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Predictive Filter Bar & Search with View Toggle (Chips vs Cards) */}
              <div className="filter-bar">
                <div className="filter-top-row">
                  <div className="filter-label-group">
                    <Filter size={14} />
                    <span>Filter ({totalCount} Bahan):</span>
                  </div>
                  <div className="filter-buttons-row">
                    <button
                      onClick={() => setFilterBadge('all')}
                      className={`filter-btn ${filterBadge === 'all' ? 'active' : ''}`}
                    >
                      Semua ({totalCount})
                    </button>
                    <button
                      onClick={() => setFilterBadge('aman')}
                      className={`filter-btn btn-aman ${filterBadge === 'aman' ? 'active' : ''}`}
                    >
                      Aman ({safeCount})
                    </button>
                    {cautionCount > 0 && (
                      <button
                        onClick={() => setFilterBadge('hati')}
                        className={`filter-btn btn-hati ${filterBadge === 'hati' ? 'active' : ''}`}
                      >
                        Perhatian ({cautionCount})
                      </button>
                    )}
                    {avoidCount > 0 && (
                      <button
                        onClick={() => setFilterBadge('hindari')}
                        className={`filter-btn btn-hindari ${filterBadge === 'hindari' ? 'active' : ''}`}
                      >
                        Hindari ({avoidCount})
                      </button>
                    )}
                  </div>

                  {/* Mode Tampilan Toggle (Chips vs Cards) */}
                  <div className="view-mode-toggle-group">
                    <button
                      type="button"
                      className={`view-toggle-btn ${viewMode === 'chips' ? 'active' : ''}`}
                      onClick={() => setViewMode('chips')}
                      title="Tampilan Ringkas (Chips)"
                    >
                      <LayoutGrid size={13} />
                      <span>Ringkas</span>
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setViewMode('cards')}
                      title="Tampilan Detail (Kartu)"
                    >
                      <ListFilter size={13} />
                      <span>Detail</span>
                    </button>
                  </div>
                </div>

                <div className="filter-search-row">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari bahan spesifik (misal: Niacinamide, Paraben, Alcohol)..."
                    className="ingredient-search-input"
                  />
                  {searchQuery && (
                    <button className="clear-search-btn" onClick={() => setSearchQuery('')} title="Reset pencarian">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* INGREDIENT LIST: DUAL MODE (CHIPS VS CARDS) */}
              {viewMode === 'chips' ? (
                /* CHIP VIEW: Ringkas, cepat dibaca, bebas lelah scroll (Konsensus Claude & Kimi) */
                <div className="ingredients-chips-container">
                  {filteredIngredients.length === 0 ? (
                    <div className="empty-search-state">
                      <p>Tidak ada bahan yang cocok dengan pencarian "<strong>{searchQuery}</strong>".</p>
                    </div>
                  ) : (
                    <div className="ingredients-chips-grid">
                      {filteredIngredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className={`ingredient-chip-item chip-${ing.badge}`}
                          title={`${ing.name} — ${ing.badgeLabel}${ing.function ? `: ${ing.function}` : ''}`}
                        >
                          <span className={`chip-dot dot-${ing.badge}`} />
                          <span className="chip-name">{ing.name}</span>
                          {typeof ing.comedogenic_score === 'number' && ing.comedogenic_score > 0 && (
                            <span className="chip-comedo" title={`Indeks Pori: ${ing.comedogenic_score}`}>
                              {ing.comedogenic_score}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="chips-hint-text">
                    Menampilkan mode ringkas ({filteredIngredients.length} bahan). Klik tombol <b>Detail</b> di atas jika ingin membaca fungsi lengkap per bahan.
                  </p>
                </div>
              ) : (
                /* CARD VIEW: Detail lengkap narasi per bahan */
                <div className="ingredients-cards-list">
                  {filteredIngredients.length === 0 ? (
                    <div className="empty-search-state">
                      <p>Tidak ada bahan yang cocok dengan pencarian "<strong>{searchQuery}</strong>".</p>
                    </div>
                  ) : (
                    filteredIngredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="ingredient-card-item"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <div className="card-top-header">
                          <div className="ing-title-group-col">
                            <h4 className="ing-item-name">{ing.name}</h4>
                            {ing.is_drug_or_banned && (
                              <span className="bpom-drug-badge">
                                Regulasi BPOM: Obat Keras / Zat Khusus
                              </span>
                            )}
                          </div>
                          <div className="ing-badges-cluster">
                            {typeof ing.comedogenic_score === 'number' && (
                              <span className={`comedogenic-mini-badge score-${ing.comedogenic_score}`}>
                                Pori: {ing.comedogenic_score}
                              </span>
                            )}
                            <span className={`ing-status-badge badge-${ing.badge}`}>
                              {ing.badgeLabel || (ing.badge === 'aman' ? 'Aman' : ing.badge === 'hindari' ? 'Hindari' : 'Perlu diperhatikan')}
                            </span>
                          </div>
                        </div>

                        {ing.function ? (
                          <p className="ing-item-func">{ing.function}</p>
                        ) : (
                          <p className="ing-item-func ing-aux-func">Bahan pelarut atau penstabil formula.</p>
                        )}

                        {ing.skinType && (
                          <div className="meta-info-row">
                            <b className="meta-label">Cocok untuk:</b>
                            <span className="meta-value">{ing.skinType}</span>
                          </div>
                        )}

                        {ing.interaction && (
                          <div className="meta-info-row">
                            <b className="meta-label">Interaksi:</b>
                            <span className="meta-value">{ing.interaction}</span>
                          </div>
                        )}

                        {/* Personal Skin Flag */}
                        {ing.personal?.text && (
                          <div className={`personal-skin-flag ${ing.personal.ok ? 'flag-ok' : 'flag-warn'}`}>
                            {ing.personal.ok ? (
                              <CheckCircle2 size={16} className="shrink-0" />
                            ) : (
                              <AlertCircle size={16} className="shrink-0" />
                            )}
                            <span>{ing.personal.text}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Action Buttons: Consult Skinsistant & Reset (Pure Scoped Vanilla CSS Matching FaceScanPage) */}
              <div className="results-action-row">
                <button className="btn-reset-scan" onClick={handleResetFlow}>
                  <RotateCcw size={16} />
                  <span>Scan Produk Lain</span>
                </button>
                <Link
                  to={`/chatbot?initialPrompt=${encodeURIComponent(
                    `Halo Skinsistant! Saya baru saja mengecek produk "${scanResult?.product_name || 'skincare'}". Apakah produk ini cocok dikombinasikan dengan kondisi kulit dan rutinitas harian saya?`
                  )}`}
                  className="btn-consult-skinsistant"
                >
                  <Sparkles size={16} />
                  <span>Konsultasikan ke Skinsistant AI</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Side Summary & Active Skin Profile Panel */}
        <div className="side-summary-col">
          {/* Active Skin Profile Context Card (Un-hardcoded Dynamic Concerns) */}
          <div className="side-card profile-context-card">
            <div className="side-card-header">
              <div className="side-icon-box teal">
                <User size={18} />
              </div>
              <h3 className="side-card-title">Profil Kulit Aktif Anda</h3>
            </div>
            <div className="profile-badge-group">
              <span className="profile-pill-primary">{userSkinType}</span>
              {activeSkinProfile?.skin_concerns && activeSkinProfile.skin_concerns.length > 0 ? (
                activeSkinProfile.skin_concerns.slice(0, 2).map((c, i) => (
                  <span key={i} className="profile-pill-secondary">{c.toUpperCase()}</span>
                ))
              ) : (
                <span className="profile-pill-secondary">KOMBINASI SEHAT</span>
              )}
            </div>
            <p className="profile-desc-text">
              Analisis keamanan bahan kosmetik secara otomatis disesuaikan dengan keluhan {userConcerns.toLowerCase()} & sensitivitas kulit Anda.
            </p>
          </div>

          {/* Educational Guide Card */}
          <div className="side-card guide-card">
            <div className="side-card-header">
              <div className="side-icon-box amber">
                <BookOpen size={18} />
              </div>
              <h3 className="side-card-title">Panduan Membaca Label</h3>
            </div>
            <ul className="guide-tips-list">
              <li>
                <b>Aturan 5 Bahan Pertama:</b> 5 komposisi teratas menyusun hingga 80% dari total formula produk.
              </li>
              <li>
                <b>BHA / Salicylic Acid:</b> Sangat baik untuk kulit berminyak, namun hindari pemakaian berlebih jika kulit kemerahan.
              </li>
              <li>
                <b>Fragrance / Parfum:</b> Berada di urutan paling bawah namun merupakan pemicu utama alergi kulit sensitif.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* PURE VANILLA CSS STYLING MATCHING SKINCLUV DESIGN SYSTEM */}
      <style>{`
        .skincluv-ingredient-page {
          width: 100%;
        }

        .ingredient-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .main-workspace-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .page-header-box {
          margin-bottom: 4px;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f6784;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }

        .page-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .error-alert {
          background: #fbe9e7;
          border: 1px solid #ffcdd2;
          color: #b3261e;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stage-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        /* TAB SWITCHER */
        .tab-switcher {
          display: flex;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 0.84375rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-btn.active {
          background: #ffffff;
          color: #0f6784;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        /* DROPZONE BOX */
        .dropzone-box {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          padding: 36px 20px;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .dropzone-box:hover, .dropzone-box.dragging {
          border-color: #0f6784;
          background: #eaf4fa;
        }

        .dz-icon-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #eaf4fa;
          color: #0f6784;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .dz-main-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .dz-sub-title {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }

        .preview-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .preview-img {
          max-height: 220px;
          border-radius: 12px;
          object-fit: contain;
        }

        .clear-image-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.78125rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* TEXTAREA BOX */
        .text-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .input-label {
          font-size: 0.84375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .ingredient-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px;
          font-size: 0.875rem;
          font-family: inherit;
          color: #1e293b;
          outline: none;
          resize: vertical;
        }

        .ingredient-textarea:focus {
          border-color: #0f6784;
          box-shadow: 0 0 0 3px rgba(15, 103, 132, 0.1);
        }

        .sample-chips-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sample-kicker {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sample-chip-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #0f6784;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .sample-chip-btn:hover {
          background: #eaf4fa;
        }

        /* SMART PHOTOGRAPHY TIPS */
        .photo-tips-card {
          background: #fffdf5;
          border: 1px solid #fef08a;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.78125rem;
        }

        .photo-tips-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #854d0e;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 6px 0;
        }

        .photo-tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: #713f12;
          line-height: 1.45;
        }

        .photo-tips-list li {
          position: relative;
          padding-left: 12px;
        }

        .photo-tips-list li::before {
          content: '•';
          position: absolute;
          left: 2px;
          color: #ca8a04;
        }

        /* PARTIAL READ WARNING BOX */
        .partial-warning-box {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          color: #92400e;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.45;
        }

        /* ALERT NOTIFICATIONS GROUP & BPOM ALERT BANNER */
        .scan-alerts-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 8px;
        }

        .bpom-alert-banner {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bpom-alert-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9f1239;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .bpom-alert-text {
          font-size: 0.8125rem;
          color: #be123c;
          margin: 0;
          line-height: 1.5;
        }

        /* PRIMARY ACTION BUTTON */
        .btn-primary-action {
          width: 100%;
          background: #0f6784;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s ease;
        }

        .btn-primary-action:hover:not(:disabled) {
          background: #0b4f5c;
        }

        .btn-primary-action:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* DISCLAIMER BANNER */
        .disclaimer-banner {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.78125rem;
          line-height: 1.6;
          color: #b45309;
          display: flex;
          gap: 10px;
        }

        .disclaimer-icon {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* NEURAL AI SCANNER HUD & ANIMATION */
        .scanning-card {
          align-items: center;
          padding: 36px 20px;
          gap: 16px;
        }

        .scan-frame-viewport {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          height: 250px;
          width: 100%;
          max-width: 440px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
          border: 1.5px solid #cbd5e1;
        }

        .scan-img-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.72;
          filter: contrast(1.05);
        }

        /* High-Tech HUD Grid Overlay */
        .hud-grid-overlay {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at center, transparent 35%, rgba(15, 23, 42, 0.5) 100%),
            linear-gradient(rgba(14, 165, 233, 0.08) 1px, transparent 1px) 0 0 / 22px 22px,
            linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px) 0 0 / 22px 22px;
          pointer-events: none;
          z-index: 2;
        }

        /* HUD Corner Brackets */
        .hud-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: #38bdf8;
          border-style: solid;
          pointer-events: none;
          z-index: 4;
        }

        .hud-corner.top-left {
          top: 12px;
          left: 12px;
          border-width: 3px 0 0 3px;
          border-top-left-radius: 5px;
        }

        .hud-corner.top-right {
          top: 12px;
          right: 12px;
          border-width: 3px 3px 0 0;
          border-top-right-radius: 5px;
        }

        .hud-corner.bottom-left {
          bottom: 12px;
          left: 12px;
          border-width: 0 0 3px 3px;
          border-bottom-left-radius: 5px;
        }

        .hud-corner.bottom-right {
          bottom: 12px;
          right: 12px;
          border-width: 0 3px 3px 0;
          border-bottom-right-radius: 5px;
        }

        /* Sweeping Laser Beam */
        .scan-laser-beam {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #0284c7 25%, #38bdf8 50%, #0284c7 75%, transparent 100%);
          box-shadow: 0 0 16px 4px rgba(56, 189, 248, 0.75), 0 0 32px 8px rgba(2, 132, 199, 0.35);
          animation: laserScan 2.4s ease-in-out infinite;
          z-index: 3;
          pointer-events: none;
        }

        @keyframes laserScan {
          0% { top: 5%; opacity: 0.85; }
          50% { top: 93%; opacity: 1; }
          100% { top: 5%; opacity: 0.85; }
        }

        /* Live Neural Vision Status Pill */
        .hud-status-badge {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(6px);
          color: #e0f2fe;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid rgba(56, 189, 248, 0.35);
          z-index: 5;
        }

        .hud-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
          animation: pulseBeacon 1.2s infinite ease-in-out;
        }

        @keyframes pulseBeacon {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        .mock-label-box {
          background: #ffffff;
          padding: 16px 24px;
          border-radius: 10px;
          color: #64748b;
          font-size: 0.84375rem;
          font-weight: 500;
        }

        .scan-status-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 4px;
          text-align: center;
        }

        .bouncing-dots {
          display: flex;
          gap: 4px;
        }

        .bouncing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0284c7;
          animation: dotBounce 1.1s infinite ease-in-out;
        }

        .bouncing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .bouncing-dots span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .shimmer-scan-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f6784;
          animation: thinkShimmer 1.8s infinite ease-in-out;
        }

        @keyframes thinkShimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* Indeterminate Progress Glow Track */
        .scan-progress-bar-track {
          width: 100%;
          max-width: 380px;
          height: 4px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }

        .scan-progress-bar-glow {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, #0284c7, #38bdf8, transparent);
          border-radius: 999px;
          animation: progressSweep 1.8s infinite ease-in-out;
        }

        @keyframes progressSweep {
          0% { left: -40%; }
          100% { left: 100%; }
        }

        /* Educational Clinical Tip Box */
        .scan-tip-card {
          width: 100%;
          max-width: 440px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
          animation: fadeIn 0.3s ease;
        }

        .tip-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.71875rem;
          font-weight: 700;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .tip-sparkle-icon {
          color: #16a34a;
        }

        .tip-body {
          font-size: 0.8125rem;
          color: #334155;
          line-height: 1.45;
          margin: 0;
        }

        /* STAGE 3: RESULTS STACK */
        .results-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .result-summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .summary-card-top-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-ring-avatar {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
          border: 3px solid #ffffff;
          outline: 1px solid rgba(0, 0, 0, 0.08);
          position: relative;
        }

        .score-ring-avatar.score-safe {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }

        .score-ring-avatar.score-caution {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
        }

        .score-ring-avatar.score-danger {
          background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
          box-shadow: 0 4px 15px rgba(244, 63, 94, 0.35);
        }

        .clinical-assessment-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cac-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0369a1;
        }

        .cac-summary-text {
          font-size: 0.8125rem;
          color: #334155;
          line-height: 1.55;
          margin: 0;
        }

        .cac-recommendation-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cac-rec-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78125rem;
          font-weight: 700;
          color: #15803d;
        }

        .cac-rec-text {
          font-size: 0.8125rem;
          color: #166534;
          line-height: 1.45;
          margin: 0;
        }

        .sr-number-row {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 1px;
        }

        .sr-val {
          font-size: 1.65rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.5px;
        }

        .sr-scale {
          font-size: 0.625rem;
          font-weight: 600;
          opacity: 0.85;
        }

        .sr-unit {
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          opacity: 0.95;
          margin-top: 2px;
          white-space: nowrap;
        }

        .product-detected-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .comedogenic-pill {
          display: inline-block;
          font-size: 0.78125rem;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 8px;
          margin-top: 8px;
        }

        .dz-upload-btn-fake {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #bae6fd;
          color: #0284c7;
          font-size: 0.8125rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 20px;
          margin-top: 12px;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.08);
        }

        /* QUICK-CORRECTION OCR REVIEW BOX */
        .detected-text-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .dt-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #1e293b;
        }

        .btn-toggle-edit {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0284c7;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .btn-toggle-edit:hover {
          background: #f0f9ff;
          border-color: #0284c7;
        }

        .dt-content {
          font-size: 0.8125rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          border-radius: 10px;
          word-break: break-word;
        }

        .edit-box-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .edit-hint {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .edit-textarea {
          width: 100%;
          border: 1px solid #0284c7;
          border-radius: 10px;
          padding: 10px;
          font-size: 0.8125rem;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          resize: vertical;
          background: #ffffff;
        }

        .btn-reanalyze {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0284c7;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.78125rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-reanalyze:hover:not(:disabled) {
          background: #0369a1;
        }

        .btn-reanalyze:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .product-packaging-thumb-box {
          position: relative;
          width: 76px;
          height: 76px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          background: #f1f5f9;
        }

        .product-packaging-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .packaging-thumb-badge {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          font-size: 0.58rem;
          font-weight: 700;
          text-align: center;
          padding: 2px 0;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        /* HERO ACTIVES HIGHLIGHT CARD */
        .hero-actives-card {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1.5px solid #fde68a;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.06);
        }

        .hero-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .hero-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hero-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #92400e;
          margin: 0;
        }

        .hero-count-pill {
          background: #ffffff;
          border: 1px solid #fde68a;
          color: #b45309;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .hero-actives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }

        .hero-pill-item {
          background: #ffffff;
          border: 1px solid #fef08a;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .hero-pill-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .hero-pill-name {
          font-size: 0.84375rem;
          font-weight: 700;
          color: #1e293b;
        }

        .hero-pill-desc {
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.4;
          margin: 0;
        }

        /* PERSONAL CONTRAINDICATIONS CARD */
        .personal-contraindications-card {
          background: #fffbeb;
          border: 1.5px solid #fed7aa;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pc-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84375rem;
        }

        .pc-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pc-item {
          background: #ffffff;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .pc-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .pc-title-row b {
          font-size: 0.8125rem;
          color: #0f172a;
        }

        .pc-condition-pill {
          background: #fef3c7;
          color: #92400e;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 999px;
        }

        .pc-warning {
          font-size: 0.78125rem;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        .pc-advice {
          font-size: 0.75rem;
          color: #0369a1;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 5px 8px;
        }

        /* LAYERING GUIDE */
        .layering-guide-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .layering-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 12px 0;
        }

        .layering-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .layering-box {
          border-radius: 12px;
          padding: 14px;
          font-size: 0.8125rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .best-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .danger-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }

        .box-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
        }

        .combos-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .combo-card-item {
          background: #ffffff;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .best-combo-card {
          border: 1px solid #dcfce7;
          box-shadow: 0 1px 3px rgba(16, 185, 129, 0.05);
        }

        .combo-card-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84375rem;
        }

        .combo-card-desc {
          font-size: 0.78125rem;
          color: #334155;
          margin: 0;
          line-height: 1.45;
        }

        .danger-combo-card {
          border: 1px solid #fecdd3;
          box-shadow: 0 1px 3px rgba(225, 29, 72, 0.05);
        }

        .danger-combo-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .danger-combo-title-row b {
          font-size: 0.84375rem;
          color: #0f172a;
          line-height: 1.35;
          flex: 1;
        }

        .combo-severity-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .severity-fatal {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .severity-caution {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .danger-combo-desc {
          font-size: 0.78125rem;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }

        .danger-combo-action {
          font-size: 0.75rem;
          color: #0369a1;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 5px 8px;
          margin-top: 2px;
          line-height: 1.4;
        }

        .view-mode-toggle-group {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 2px;
          margin-left: auto;
        }

        .view-toggle-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .view-toggle-btn.active {
          background: #ffffff;
          color: #0f6784;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* CHIP GRID VIEW FOR INGREDIENTS */
        .ingredients-chips-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ingredients-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ingredient-chip-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .ingredient-chip-item:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .ingredient-chip-item.chip-aman {
          border-color: #dcfce7;
        }

        .ingredient-chip-item.chip-hati {
          border-color: #fef08a;
          background: #fffdf5;
        }

        .ingredient-chip-item.chip-hindari {
          border-color: #fecaca;
          background: #fef2f2;
        }

        .chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .chip-dot.dot-aman {
          background: #10b981;
        }

        .chip-dot.dot-hati {
          background: #f59e0b;
        }

        .chip-dot.dot-hindari {
          background: #ef4444;
        }

        .chip-name {
          line-height: 1.2;
        }

        .chip-comedo {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #d97706;
          background: #fef3c7;
          border-radius: 999px;
          padding: 1px 6px;
        }

        .chips-hint-text {
          font-size: 0.75rem;
          color: #64748b;
          margin: 4px 0 0 0;
          line-height: 1.4;
        }

        .ing-title-group-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .bpom-drug-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 1px 6px;
          align-self: flex-start;
        }

        .ing-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .comedogenic-chip {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ea580c;
          background: #fff7ed;
          border: 1px solid #ffedd5;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .summary-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .summary-subtitle {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }

        /* PREDICTIVE FILTER BAR & SEARCH */
        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .filter-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-label-group {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
        }

        .filter-buttons-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .filter-btn.active {
          background: #0f6784;
          color: #ffffff;
          border-color: #0f6784;
        }

        .filter-btn.btn-aman.active {
          background: #166534;
          border-color: #166534;
        }

        .filter-btn.btn-hati.active {
          background: #b45309;
          border-color: #b45309;
        }

        .filter-btn.btn-hindari.active {
          background: #b3261e;
          border-color: #b3261e;
        }

        .filter-search-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
        }

        .filter-search-row .search-icon {
          color: #64748b;
          flex-shrink: 0;
        }

        .ingredient-search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.8125rem;
          color: #0f172a;
          width: 100%;
        }

        .ingredient-search-input::placeholder {
          color: #94a3b8;
        }

        .clear-search-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .clear-search-btn:hover {
          color: #475569;
        }

        .empty-search-state {
          text-align: center;
          padding: 24px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          font-size: 0.84375rem;
        }

        /* INGREDIENT CARDS LIST */
        .ingredients-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ingredient-card-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          opacity: 0;
          transform: translateY(8px);
          animation: cardReveal 0.45s ease forwards;
        }

        @keyframes cardReveal {
          to { opacity: 1; transform: translateY(0); }
        }

        .card-top-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .ing-badges-cluster {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .comedogenic-mini-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .comedogenic-mini-badge.score-0,
        .comedogenic-mini-badge.score-1 {
          background: #ecfdf5;
          color: #065f46;
          border-color: #a7f3d0;
        }

        .comedogenic-mini-badge.score-2,
        .comedogenic-mini-badge.score-3 {
          background: #fffbeb;
          color: #92400e;
          border-color: #fde68a;
        }

        .comedogenic-mini-badge.score-4,
        .comedogenic-mini-badge.score-5 {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .ing-aux-func {
          color: #64748b !important;
          font-style: italic;
        }

        .ing-item-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .ing-status-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .badge-aman {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .badge-hati {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fef3c7;
        }

        .badge-hindari {
          background: #fbe9e7;
          color: #b3261e;
          border: 1px solid #ffcdd2;
        }

        .ing-item-func {
          font-size: 0.8125rem;
          color: #475569;
          line-height: 1.55;
          margin: 0;
        }

        .meta-info-row {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 0.78125rem;
          line-height: 1.5;
        }

        .meta-label {
          color: #1e293b;
          font-weight: 600;
          flex-shrink: 0;
          width: 100px;
        }

        .meta-value {
          color: #64748b;
        }

        .personal-skin-flag {
          margin-top: 4px;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.78125rem;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-weight: 500;
          line-height: 1.5;
        }

        .personal-skin-flag.flag-ok {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #dcfce7;
        }

        .personal-skin-flag.flag-warn {
          background: #fbe9e7;
          color: #b3261e;
          border: 1px solid #ffcdd2;
        }

        .results-action-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        @media (min-width: 640px) {
          .results-action-row {
            flex-direction: row;
          }
        }

        .btn-reset-scan {
          flex: 1;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f6784;
          border-radius: 12px;
          padding: 13px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
        }

        .btn-reset-scan:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .btn-consult-skinsistant {
          flex: 2;
          min-width: 240px;
          background: #0f6784;
          border: none;
          color: #ffffff;
          border-radius: 12px;
          padding: 13px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 2px 6px rgba(15, 103, 132, 0.2);
          transition: all 0.15s ease;
        }

        .btn-consult-skinsistant:hover {
          background: #0b4f5c;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(15, 103, 132, 0.25);
        }

        /* RIGHT COLUMN: SIDE SUMMARY PANEL */
        .side-summary-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .side-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .profile-context-card {
          border-left: 3px solid #0f6784;
        }

        .guide-card {
          border-left: 3px solid #f59e0b;
        }

        .side-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .side-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .side-icon-box.teal {
          background: #eaf4fa;
          color: #0f6784;
        }

        .side-icon-box.amber {
          background: #fffbeb;
          color: #d97706;
        }

        .side-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .profile-badge-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .profile-pill-primary {
          background: #0f6784;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
        }

        .profile-pill-secondary {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
        }

        .profile-desc-text {
          font-size: 0.8125rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .guide-tips-list {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.8125rem;
          color: #475569;
          line-height: 1.5;
        }

        .guide-tips-list b {
          color: #1e293b;
        }

        .ingredient-credit-notice {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.8125rem;
          color: #92400e;
          animation: fadeIn 0.2s ease;
        }

        .notice-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notice-coin-icon {
          color: #d97706;
          flex-shrink: 0;
        }

        .notice-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .notice-sub-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.15s;
        }

        .notice-sub-btn.mission {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .notice-sub-btn.mission:hover {
          background: #fde68a;
        }

        .notice-sub-btn.upgrade {
          background: #0f6784;
          color: #ffffff;
        }

        .notice-sub-btn.upgrade:hover {
          background: #0b4d63;
        }

        @media (max-width: 640px) {
          .ingredient-credit-notice {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .notice-right {
            width: 100%;
          }
          .notice-sub-btn {
            flex: 1;
            justify-content: center;
          }
        }

        /* DESKTOP BREAKPOINT (>= 900px) */
        @media (min-width: 900px) {
          .ingredient-grid-layout {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  )
}
