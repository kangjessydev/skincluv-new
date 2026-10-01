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
import '@/styles/ingredient-scan.css'

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
    <div className="v0-page-container skincluv-ingredient-page animate-fade-in">
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

    </div>
  )
}
