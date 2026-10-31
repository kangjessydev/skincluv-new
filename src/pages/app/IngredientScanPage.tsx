import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  FlaskConical,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  FileText,
  User,
  Activity,
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
  History,
} from 'lucide-react'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { useAuthStore } from '@/store/authStore'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import { supabase } from '@/lib/supabase'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import { compressImageForAI } from '@/utils/imageQualityValidator'
import { detectHumanFace } from '@/utils/faceLandmarkDetector'
import { Button, Badge, BottomSheet } from '@/components/ui'

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
  const userSkinTypeLabel = useMemo(() => {
    const raw = (activeSkinProfile?.skin_type || 'combination').toLowerCase()
    const map: Record<string, string> = {
      normal: 'Normal',
      dry: 'Kering (Dry)',
      oily: 'Berminyak (Oily)',
      combination: 'Kombinasi (Combination)',
      sensitive: 'Sensitif (Sensitive)',
    }
    return map[raw] || 'Kombinasi'
  }, [activeSkinProfile?.skin_type])
  const rawConcerns = useMemo(() => activeSkinProfile?.skin_concerns || [], [activeSkinProfile?.skin_concerns])

  const userSensitivities = useMemo(() => {
    const matched = rawConcerns.filter((c: string) =>
      /fragrance|parfum|alcohol|alkohol|essential|sulfat|sls|paraben/i.test(c)
    )
    return matched.length ? matched.join(', ') : 'Bebas Alkohol & Parfum'
  }, [rawConcerns])

  const userConcerns = useMemo(() => {
    const regular = rawConcerns.filter((c: string) =>
      !/fragrance|parfum|alcohol|alkohol|essential|sulfat|sls|paraben/i.test(c)
    )
    return regular.length ? regular.join(', ') : 'Sebum berlebih di T-zone, Potensi pori-pori tersumbat di area hidung'
  }, [rawConcerns])

  const userTargetFormula = useMemo(() => {
    const st = (activeSkinProfile?.skin_type || '').toLowerCase()
    if (st.includes('oily') || st.includes('berminyak')) return 'Non-Komedogenik & Sebum Control'
    if (st.includes('dry') || st.includes('kering')) return 'Deep Hydration & Barrier Support'
    if (st.includes('sensitive') || st.includes('sensitif')) return 'Hypoallergenic & Soothing'
    return 'Non-Komedogenik & Barrier Balance'
  }, [activeSkinProfile?.skin_type])

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
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const topResultRef = useRef<HTMLDivElement>(null)
  const [showGuideSheet, setShowGuideSheet] = useState(false)

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
  const rawIngredientsList = useMemo(() => {
    return scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []
  }, [scanResult?.ingredients_breakdown, scanResult?.key_ingredients])

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
    <div className="cluv-canvas-grid cluv-animate-fade">
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
      <div className="cluv-scan-layout">
        {/* LEFT COLUMN: Main Feature Workspace */}
        <div className="cluv-scan-main">
          {/* Page Header (Desktop Only; on mobile hidden to maximize viewport) */}
          <div className="cluv-hide-mobile cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-3 cluv-mb-4">
            <div>
              <h1 className="cluv-title-section cluv-m-0 cluv-flex-row cluv-items-center cluv-gap-2">
                Ingredient Scanner
              </h1>
              <p className="cluv-subtitle cluv-mt-1 cluv-m-0">
                Ketahui keamanan komposisi &amp; cari kecocokan bahan untuk kulitmu
              </p>
            </div>
            <div>
              <Button variant="outline" size="sm" iconLeft={<History size={15} />} to="/scan-history">
                Riwayat Scan
              </Button>
            </div>
          </div>

          {/* Alert Error Box */}
          {errorMsg && (
            <div className="cluv-alert is-danger">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STAGE 1: PHOTO-FIRST UPLOAD (Adaptive Mobile-First) */}
          {stage === 'upload' && (
            <>
              <div className="cluv-card cluv-gap-4">
                {previewUrl ? (
                  <div className="cluv-flex-col cluv-items-center cluv-gap-3 cluv-w-full cluv-py-2">
                    <div className="cluv-dropzone-preview" style={{ maxWidth: '320px', width: '100%' }}>
                      <img src={previewUrl} alt="Preview label komposisi" className="cluv-dropzone-preview-img" style={{ maxHeight: '260px', objectFit: 'contain' }} />
                    </div>
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        iconLeft={<RotateCcw size={14} />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Ganti Foto
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<X size={14} />}
                        onClick={handleClearImage}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Unified Clean Media Upload Box with Info Guide Icon in Top-Right */
                  <div
                    className={`cluv-dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    tabIndex={0}
                    role="button"
                    aria-label="Pilih foto label komposisi dari galeri atau kamera"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                    }}
                  >
                    {/* Panduan Label Guide Button (Top-Right inside box) */}
                    <button
                      type="button"
                      className="cluv-dropzone-guide-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowGuideSheet(true)
                      }}
                      aria-label="Panduan Membaca Label Komposisi"
                      title="Panduan Membaca Label Komposisi"
                    >
                      <Info size={19} />
                    </button>

                    <div className="cluv-dropzone-icon">
                      <FlaskConical size={26} />
                    </div>
                    <h3 className="cluv-dropzone-title">
                      Pilih Foto Label Komposisi
                    </h3>
                    <p className="cluv-dropzone-subtitle">
                      Format JPG, PNG, atau WEBP maks 5MB
                    </p>
                  </div>
                )}

                {/* Hidden Native File Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {/* Photography Tips Card (Desktop only; in mobile accessible via BottomSheet) */}
                <div className="cluv-card is-highlight cluv-p-4 cluv-hide-mobile">
                  <h4 className="cluv-font-bold cluv-text-gold cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-sm">
                    <Sparkles size={14} className="shrink-0" /> Tips Foto Kemasan Supaya 100% Akurat:
                  </h4>
                  <ul className="cluv-list-disc cluv-pl-4 cluv-mt-2 cluv-micro cluv-text-muted cluv-space-y-1 cluv-m-0">
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
                  <div className="cluv-alert is-warning is-compact cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <Coins size={16} className="text-amber-600 shrink-0" />
                      <span className="cluv-micro">
                        Butuh <strong>{ingredientCost} Credits</strong> untuk analisis komposisi (Saldo kamu: <strong>{currentCoins} Credits</strong>).
                      </span>
                    </div>
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                      <Button variant="outline" size="sm" iconLeft={<Trophy size={13} />} to="/missions">
                        Misi Gratis
                      </Button>
                      <Button variant="primary" size="sm" iconLeft={<Crown size={13} />} to="/pricing">
                        Upgrade
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  variant="primary"
                  size="md"
                  block
                  loading={isAnalyzing}
                  disabled={isAnalyzing || !imageBase64}
                  iconLeft={<Sparkles size={18} />}
                  onClick={() => handleStartAnalysis()}
                >
                  Analisa Sekarang
                </Button>

                {/* Invariant 19 Non-Therapeutic Privacy & Credit Notice (Refined Trust Strip) */}
                <div className="cluv-scan-trust-strip">
                  <div className="cluv-scan-trust-badge">
                    <Sparkles size={12} />
                    <span>Biaya {ingredientCost} Credits AI</span>
                  </div>
                  <p className="cluv-scan-trust-text">
                    Foto dianalisis secara privat &amp; hasil observasi bersifat panduan edukasi mandiri 🔒
                  </p>
                </div>
              </div>

              {/* Bento Card: Cara Kerja Analisis Formula */}
              <div className="cluv-card cluv-gap-4">
                <div className="cluv-flex-row cluv-items-center cluv-justify-between">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                    <div className="cluv-card-icon-wrap is-teal is-sm">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="cluv-title-card cluv-m-0">Cara Kerja Analisis Formula</h3>
                      <p className="cluv-caption cluv-text-muted cluv-m-0">3 langkah praktis membaca keamanan komposisi</p>
                    </div>
                  </div>
                  <span className="cluv-badge is-teal is-sm cluv-hide-mobile">Pencocokan Cerdas</span>
                </div>

                <div className="cluv-flex-col cluv-gap-3 cluv-mt-1">
                  <div className="cluv-guide-item">
                    <div className="cluv-guide-num">1</div>
                    <div className="cluv-guide-content">
                      <strong className="cluv-guide-title">Foto Label Komposisi</strong>
                      <p className="cluv-guide-desc">
                        Fokuskan kamera langsung ke teks daftar 'Ingredients' atau 'Komposisi' pada kemasan skincare.
                      </p>
                    </div>
                  </div>

                  <div className="cluv-guide-item">
                    <div className="cluv-guide-num">2</div>
                    <div className="cluv-guide-content">
                      <strong className="cluv-guide-title">Pencocokan Profil Kulit</strong>
                      <p className="cluv-guide-desc">
                        AI memilah bahan aktif, indeks komedogenik, dan potensi iritan terhadap tipe kulit terdaftarmu.
                      </p>
                    </div>
                  </div>

                  <div className="cluv-guide-item">
                    <div className="cluv-guide-num">3</div>
                    <div className="cluv-guide-content">
                      <strong className="cluv-guide-title">Status Kompatibilitas Produk</strong>
                      <p className="cluv-guide-desc">
                        Ketahui seketika apakah produk ini aman, butuh perhatian khusus, atau sebaiknya dihindari.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}


          {/* STAGE 2: NEURAL AI SCANNER HUD */}
          {stage === 'scanning' && (
            <div className="cluv-card cluv-items-center cluv-py-8 cluv-gap-4">
              <div className="cluv-scanner-hud">
                {previewUrl ? (
                  <img src={previewUrl} alt="Label Komposisi" className="cluv-scanner-preview-img" />
                ) : (
                  <div className="cluv-card is-compact cluv-text-muted cluv-micro">Foto Label Komposisi Produk</div>
                )}

                {/* HUD High-Tech Grid & Corner Brackets */}
                <div className="cluv-scanner-grid-overlay" />
                <div className="cluv-scanner-corner top-left" />
                <div className="cluv-scanner-corner top-right" />
                <div className="cluv-scanner-corner bottom-left" />
                <div className="cluv-scanner-corner bottom-right" />

                {/* Sweeping Laser Beam */}
                <div className="cluv-scanner-laser" />

                {/* Live Neural Vision Status Pill */}
                <div className="cluv-scanner-status-pill">
                  <span className="cluv-scanner-status-dot" />
                  <span>AI OCR VISION ACTIVE</span>
                </div>
              </div>

              {/* Shimmering Phase Status */}
              <div className="cluv-flex-row cluv-items-center cluv-justify-center cluv-gap-2 cluv-mt-2">
                <span className="cluv-font-bold cluv-text-teal cluv-text-sm">{scanStagesText[scanTextIndex]}</span>
              </div>

              {/* Smooth Indeterminate Progress Bar */}
              <div className="cluv-scanner-progress-track">
                <div className="cluv-scanner-progress-glow" />
              </div>

              {/* Educational Clinical Tip Box */}
              <div className="cluv-card is-highlight cluv-p-3 cluv-max-w-md cluv-w-full">
                <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-text-xs cluv-font-bold cluv-text-teal">
                  <Sparkles size={13} className="shrink-0" />
                  <span>Catatan Edukasi Komposisi</span>
                </div>
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">{clinicalTips[tipIndex]}</p>
              </div>
            </div>
          )}

          {/* STAGE 3: RESULTS & QUICK-CORRECTION */}
          {stage === 'result' && (
            <div className="cluv-flex-col cluv-gap-4">
              {/* Score Summary Box with Clinical AI Assessment */}
              <div className="cluv-card cluv-gap-4">
                <div className="cluv-flex-row cluv-items-center cluv-gap-4 cluv-flex-wrap">
                  {previewUrl && (
                    <div className="product-packaging-thumb-box">
                      <img src={previewUrl} alt="Foto Kemasan Produk" className="product-packaging-thumb-img" />
                      <span className="packaging-thumb-badge">Label Kemasan</span>
                    </div>
                  )}
                  <div className={`cluv-score-circle ${avoidCount > 0 ? 'is-danger' : cautionCount > 0 ? 'is-caution' : 'is-safe'}`}>
                    <div className="sr-number-row">
                      <span className="sr-val">{scanResult?.safety_score ?? Math.round((safeCount / (totalCount || 1)) * 100)}</span>
                      <span className="sr-scale">/100</span>
                    </div>
                    <span className="sr-unit">Keamanan</span>
                  </div>
                  <div className="cluv-flex-1 cluv-flex-col cluv-gap-1">
                    <div className="cluv-badge is-teal is-sm">
                      <Sparkles size={13} /> {scanResult?.product_name || 'Formula Skincare Terdeteksi'}
                    </div>
                    <h3 className="cluv-title-item cluv-m-0">
                      {avoidCount > 0
                        ? 'Perlu Waspada & Perhatian Khusus'
                        : cautionCount > 0
                        ? 'Sebagian Besar Cocok dengan Catatan'
                        : 'Sangat Cocok & Aman untuk Kulitmu'}
                    </h3>
                    <p className="cluv-body cluv-text-muted cluv-m-0">
                      {safeCount} bahan aman, {cautionCount} perlu diperhatikan, {avoidCount} berisiko untuk profil kulit ({userSkinType.toLowerCase()}).
                    </p>
                    {scanResult?.comedogenic_rating && (
                      <div className="cluv-badge is-slate is-sm cluv-mt-1">
                        Indeks Komedogenik (Pori Tersumbat): <strong>{scanResult.comedogenic_rating}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* OBSERVATION ASSESSMENT BOX: Menampung Observasi Formula & Rekomendasi Lengkap */}
                {(scanResult?.clinical_summary || scanResult?.overall_recommendation) && (
                  <div className="cluv-card is-compact cluv-bg-muted cluv-mt-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-text-teal cluv-font-bold cluv-text-sm">
                      <Sparkles size={15} className="shrink-0" />
                      <span>Observasi Komposisi Formula:</span>
                    </div>
                    {scanResult.clinical_summary && (
                      <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1">{scanResult.clinical_summary}</p>
                    )}
                    {scanResult.overall_recommendation && (
                      <div className="cluv-card is-highlight cluv-p-3 cluv-mt-2">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-sm cluv-text-teal">
                          <CheckCircle2 size={15} className="shrink-0" />
                          <span>Saran Aplikasi untuk Profil Kulitmu:</span>
                        </div>
                        <p className="cluv-body cluv-text-muted cluv-m-0 cluv-mt-1">{scanResult.overall_recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alert Notifications Group (BPOM & Kualitas Foto) */}
              {(scanResult?.bpom_alert || scanResult?.partial_read_warning) && (
                <div className="cluv-flex-col cluv-gap-2">
                  {/* BPOM Regulatory Alert Banner */}
                  {scanResult?.bpom_alert && (
                    <div className="cluv-alert is-danger">
                      <ShieldAlert size={18} className="text-rose-600 shrink-0" />
                      <div>
                        <strong>Peringatan Regulasi BPOM RI & Keamanan Produk:</strong>
                        <p className="cluv-micro cluv-m-0 cluv-mt-1">{scanResult.bpom_alert}</p>
                      </div>
                    </div>
                  )}

                  {/* Partial Read Warning Banner (Jika ada teks pudar) */}
                  {scanResult?.partial_read_warning && (
                    <div className="cluv-alert is-warning is-compact">
                      <AlertCircle size={16} className="shrink-0 text-amber-600" />
                      <span>
                        <strong>Catatan Label:</strong> {scanResult.partial_read_warning}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TIER 1: HERO ACTIVES HIGHLIGHTS */}
              {heroActivesList.length > 0 && (
                <div className="cluv-hero-actives">
                  <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                      <Sparkles size={16} className="text-amber-500 shrink-0" />
                      <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">Bahan Kunci & Pahlawan (Hero Actives):</h4>
                    </div>
                    <span className="cluv-badge is-gold is-sm">{heroActivesList.length} Bahan Unggulan</span>
                  </div>
                  <div className="cluv-hero-actives-grid">
                    {heroActivesList.map((hero, hIdx) => (
                      <div key={hIdx} className="cluv-hero-pill-item">
                        <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-gap-1">
                          <span className="cluv-font-bold cluv-text-dark cluv-text-sm">{hero.name}</span>
                          {typeof hero.comedogenic_score === 'number' && (
                            <span className={`cluv-comedo-badge ${hero.comedogenic_score <= 1 ? 'is-low' : hero.comedogenic_score <= 3 ? 'is-med' : 'is-high'}`}>
                              Pori: {hero.comedogenic_score}
                            </span>
                          )}
                        </div>
                        <p className="cluv-micro cluv-text-muted cluv-m-0">{hero.function || 'Bahan aktif formula.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PERSONAL CONTRAINDICATIONS */}
              {scanResult?.personal_contraindications && scanResult.personal_contraindications.length > 0 && (
                <div className="cluv-contraindications-card">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-dark">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span>Catatan Khusus untuk Profil Kulitmu ({userSkinType.toLowerCase()}):</span>
                  </div>
                  <div className="cluv-flex-col cluv-gap-2">
                    {scanResult.personal_contraindications.map((pc, pcIdx) => (
                      <div key={pcIdx} className="cluv-contraindication-item">
                        <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-gap-2">
                          <b className="cluv-text-dark cluv-text-sm">{pc.ingredient}</b>
                          <span className="cluv-badge is-gold is-sm">{pc.user_condition}</span>
                        </div>
                        <p className="cluv-micro cluv-text-muted cluv-m-0">{pc.warning}</p>
                        {pc.clinical_advice && (
                          <div className="cluv-badge is-teal is-sm cluv-mt-1">
                            <em>Saran: {pc.clinical_advice}</em>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUICK-CORRECTION OCR REVIEW BOX */}
              <div className="cluv-ocr-box">
                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-sm cluv-text-dark">
                    <FileText size={15} className="text-sky-600 shrink-0" />
                    <span>Teks Komposisi Terbaca dari Kemasan:</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Edit3 size={13} />}
                    onClick={() => setIsEditingText(!isEditingText)}
                  >
                    {isEditingText ? 'Tutup Edit' : 'Koreksi / Tambah Kata'}
                  </Button>
                </div>

                {!isEditingText ? (
                  <p className="cluv-ocr-content">
                    {editableText || scanResult?.extracted_raw_text || rawIngredientsList.map((i) => i.name).join(', ')}
                  </p>
                ) : (
                  <div className="cluv-flex-col cluv-gap-2">
                    <p className="cluv-micro cluv-text-muted cluv-m-0">
                      Perbaiki jika ada kata/huruf yang kurang tepat atau tambahkan bahan yang terpotong pada kemasan melengkung:
                    </p>
                    <textarea
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="cluv-textarea"
                      rows={3}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isAnalyzing}
                      disabled={isAnalyzing || !editableText.trim()}
                      iconLeft={<RefreshCw size={14} />}
                      onClick={handleReanalyzeWithText}
                      className="cluv-self-start"
                    >
                      Hitung Ulang Analisis dengan Teks Terkoreksi
                    </Button>
                  </div>
                )}
              </div>

              {/* Layering Guide Box (Do & Don't Combos Antar-Produk) */}
              {scanResult?.layering_guide && (
                ((scanResult.layering_guide.best_combos && scanResult.layering_guide.best_combos.length > 0) ||
                 (scanResult.layering_guide.danger_combos && scanResult.layering_guide.danger_combos.length > 0)) && (
                  <div className="cluv-card">
                    <h4 className="cluv-title-item cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-mb-3">
                      <Zap size={16} className="text-amber-500 shrink-0" /> Panduan Layering & Kombinasi Produk Lain
                    </h4>
                    <div className="cluv-layering-grid">
                      {scanResult.layering_guide.best_combos && scanResult.layering_guide.best_combos.length > 0 && (
                        <div className="cluv-layering-box is-best">
                          <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-teal cluv-text-sm">
                            <ShieldCheck size={16} /> <span>Best Combos (Aman & Efektif):</span>
                          </div>
                          <div className="cluv-flex-col cluv-gap-2">
                            {scanResult.layering_guide.best_combos.map((item, bIdx) => (
                              <div key={bIdx} className="cluv-combo-item">
                                <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-teal cluv-text-sm">
                                  <CheckCircle2 size={14} className="shrink-0" />
                                  <span>{item.pair}</span>
                                </div>
                                <p className="cluv-micro cluv-text-muted cluv-m-0">{item.benefit}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scanResult.layering_guide.danger_combos && scanResult.layering_guide.danger_combos.length > 0 && (
                        <div className="cluv-layering-box is-danger">
                          <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-rose cluv-text-sm">
                            <AlertTriangle size={16} /> <span>Danger Combos (Hindari Bersamaan):</span>
                          </div>
                          <div className="cluv-flex-col cluv-gap-2">
                            {scanResult.layering_guide.danger_combos.map((item, dIdx) => (
                              <div key={dIdx} className="cluv-combo-item">
                                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-gap-2">
                                  <b className="cluv-text-dark cluv-text-sm">{item.pair}</b>
                                  {item.severity === 'fatal' && (
                                    <span className="cluv-badge is-rose is-sm">FATAL</span>
                                  )}
                                  {item.severity === 'caution' && (
                                    <span className="cluv-badge is-gold is-sm">PERHATIAN</span>
                                  )}
                                </div>
                                <p className="cluv-micro cluv-text-muted cluv-m-0">{item.warning}</p>
                                {item.clinical_action && (
                                  <div className="cluv-badge is-teal is-sm cluv-mt-1">
                                    <em>Saran Pemakaian: {item.clinical_action}</em>
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
              <div className="cluv-card is-compact">
                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-text-muted cluv-font-bold cluv-text-xs">
                    <Filter size={14} />
                    <span>Filter ({totalCount} Bahan):</span>
                  </div>
                  <div className="cluv-flex-row cluv-gap-1 cluv-flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFilterBadge('all')}
                      className={`cluv-chip ${filterBadge === 'all' ? 'active' : ''}`}
                    >
                      Semua ({totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterBadge('aman')}
                      className={`cluv-chip ${filterBadge === 'aman' ? 'active' : ''}`}
                    >
                      Aman ({safeCount})
                    </button>
                    {cautionCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterBadge('hati')}
                        className={`cluv-chip ${filterBadge === 'hati' ? 'active' : ''}`}
                      >
                        Perhatian ({cautionCount})
                      </button>
                    )}
                    {avoidCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterBadge('hindari')}
                        className={`cluv-chip ${filterBadge === 'hindari' ? 'active' : ''}`}
                      >
                        Hindari ({avoidCount})
                      </button>
                    )}
                  </div>

                  {/* Mode Tampilan Toggle (Chips vs Cards) */}
                  <div className="cluv-btn-group">
                    <Button
                      variant={viewMode === 'chips' ? 'primary' : 'ghost'}
                      size="sm"
                      iconLeft={<LayoutGrid size={13} />}
                      onClick={() => setViewMode('chips')}
                      title="Tampilan Ringkas (Chips)"
                    >
                      Ringkas
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                      size="sm"
                      iconLeft={<ListFilter size={13} />}
                      onClick={() => setViewMode('cards')}
                      title="Tampilan Detail (Kartu)"
                    >
                      Detail
                    </Button>
                  </div>
                </div>

                <div className="cluv-input-wrap has-leading-icon cluv-mt-2">
                  <span className="cluv-input-icon is-leading">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari bahan spesifik (misal: Niacinamide, Paraben, Alcohol)..."
                    className="cluv-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="cluv-input-icon is-trailing"
                      onClick={() => setSearchQuery('')}
                      title="Reset pencarian"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* INGREDIENT LIST: DUAL MODE (CHIPS VS CARDS) */}
              {viewMode === 'chips' ? (
                /* CHIP VIEW: Ringkas, cepat dibaca */
                <div className="cluv-flex-col cluv-gap-2">
                  {filteredIngredients.length === 0 ? (
                    <div className="cluv-card is-compact cluv-text-center cluv-text-muted">
                      Tidak ada bahan yang cocok dengan pencarian "<strong>{searchQuery}</strong>".
                    </div>
                  ) : (
                    <div className="cluv-flex-row cluv-flex-wrap cluv-gap-2">
                      {filteredIngredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className={`cluv-chip active ${
                            ing.badge === 'aman' ? 'is-teal' : ing.badge === 'hindari' ? 'is-danger' : 'is-gold'
                          }`}
                          title={`${ing.name} — ${ing.badgeLabel}${ing.function ? `: ${ing.function}` : ''}`}
                        >
                          <span className="cluv-dot" />
                          <span>{ing.name}</span>
                          {typeof ing.comedogenic_score === 'number' && ing.comedogenic_score > 0 && (
                            <span className="cluv-badge is-gold is-sm">
                              {ing.comedogenic_score}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
                    Menampilkan mode ringkas ({filteredIngredients.length} bahan). Klik tombol <b>Detail</b> di atas jika ingin membaca fungsi lengkap per bahan.
                  </p>
                </div>
              ) : (
                /* INSET GROUPED LIST VIEW: Bersih, elegan, tanpa border soup */
                <div className="cluv-inset-list">
                  {filteredIngredients.length === 0 ? (
                    <div className="cluv-card is-compact cluv-text-center cluv-text-muted">
                      Tidak ada bahan yang cocok dengan pencarian "<strong>{searchQuery}</strong>".
                    </div>
                  ) : (
                    filteredIngredients.map((ing, idx) => (
                      <div key={idx} className="cluv-inset-item">
                        <div className="cluv-flex-row cluv-justify-between cluv-items-start cluv-gap-2">
                          <div className="cluv-flex-col cluv-gap-1 cluv-flex-1">
                            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
                              <h4 className="cluv-ingredient-name cluv-m-0">{ing.name}</h4>
                              {ing.is_hero_active && (
                                <span className="cluv-badge is-teal is-sm">Hero Active</span>
                              )}
                            </div>
                            {ing.is_drug_or_banned && (
                              <span className="cluv-badge is-rose is-sm cluv-mt-0.5">
                                Regulasi BPOM: Obat Keras / Zat Khusus
                              </span>
                            )}
                          </div>
                          <div className="cluv-flex-row cluv-items-center cluv-gap-1.5 cluv-flex-shrink-0">
                            {typeof ing.comedogenic_score === 'number' && ing.comedogenic_score > 0 && (
                              <span className={`cluv-comedo-badge ${ing.comedogenic_score <= 1 ? 'is-low' : ing.comedogenic_score <= 3 ? 'is-med' : 'is-high'}`}>
                                Pori: {ing.comedogenic_score}
                              </span>
                            )}
                            <span className={`cluv-badge is-sm ${ing.badge === 'aman' ? 'is-teal' : ing.badge === 'hindari' ? 'is-rose' : 'is-gold'}`}>
                              {ing.badgeLabel || (ing.badge === 'aman' ? 'Aman' : ing.badge === 'hindari' ? 'Hindari' : 'Perlu diperhatikan')}
                            </span>
                          </div>
                        </div>

                        {ing.function ? (
                          <p className="cluv-body cluv-mt-2 cluv-m-0" style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--cluv-neutral-700)' }}>
                            {ing.function}
                          </p>
                        ) : (
                          <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-m-0">
                            <em>Bahan pelarut atau penstabil formula.</em>
                          </p>
                        )}

                        {ing.skinType && (
                          <div className="cluv-flex-row cluv-gap-2 cluv-micro cluv-mt-1.5">
                            <b className="cluv-text-dark">Cocok untuk:</b>
                            <span className="cluv-text-muted">{ing.skinType}</span>
                          </div>
                        )}

                        {ing.interaction && (
                          <div className="cluv-flex-row cluv-gap-2 cluv-micro cluv-mt-1">
                            <b className="cluv-text-dark">Interaksi:</b>
                            <span className="cluv-text-muted">{ing.interaction}</span>
                          </div>
                        )}

                        {/* Personal Skin Flag */}
                        {ing.personal?.text && (
                          <div className={`cluv-alert is-compact cluv-mt-2 ${ing.personal.ok ? 'is-success' : 'is-danger'}`}>
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

              {/* Action Buttons: Consult Skinsistant & Reset */}
              <div className="cluv-flex-row cluv-gap-3 cluv-mt-4 cluv-flex-wrap">
                <Button
                  variant="outline"
                  size="md"
                  className="cluv-flex-1"
                  iconLeft={<RotateCcw size={16} />}
                  onClick={handleResetFlow}
                >
                  Scan Produk Lain
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="cluv-flex-2"
                  iconLeft={<Sparkles size={16} />}
                  to={`/chatbot?initialPrompt=${encodeURIComponent(
                    `Halo Skinsistant! Saya baru saja mengecek produk "${scanResult?.product_name || 'skincare'}". Apakah produk ini cocok dikombinasikan dengan kondisi kulit dan rutinitas harian saya?`
                  )}`}
                >
                  Konsultasikan ke Skinsistant AI
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Side Summary & Active Skin Profile Panel (Desktop Only; on mobile accessed via BottomSheet) */}
        <div className="cluv-scan-aside cluv-hide-mobile">
          {/* Active Skin Profile Context Card */}
          <div className="cluv-card is-highlight">
            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-2">
              <div className="cluv-card-icon-wrap is-sm">
                <User size={18} />
              </div>
              <h3 className="cluv-title-item cluv-m-0">Profil Kulit Aktif Anda</h3>
            </div>
            <div className="cluv-flex-row cluv-gap-1 cluv-flex-wrap cluv-mb-2">
              <Badge variant="teal" size="sm">{userSkinType}</Badge>
              {activeSkinProfile?.skin_concerns && activeSkinProfile.skin_concerns.length > 0 ? (
                activeSkinProfile.skin_concerns.slice(0, 2).map((c, i) => (
                  <Badge key={i} variant="slate" size="sm">{c.toUpperCase()}</Badge>
                ))
              ) : (
                <Badge variant="slate" size="sm">KOMBINASI SEHAT</Badge>
              )}
            </div>
            <p className="cluv-micro cluv-text-muted cluv-m-0">
              Analisis keamanan bahan kosmetik secara otomatis disesuaikan dengan keluhan {userConcerns.toLowerCase()} & sensitivitas kulit Anda.
            </p>
          </div>

          {/* Educational Guide Card */}
          <div className="cluv-card">
            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-2">
              <div className="cluv-card-icon-wrap is-sm is-gold">
                <BookOpen size={18} />
              </div>
              <h3 className="cluv-title-item cluv-m-0">Panduan Membaca Label</h3>
            </div>
            <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-space-y-2 cluv-m-0">
              <li>
                <b className="cluv-text-dark">Aturan 5 Bahan Pertama:</b> 5 komposisi teratas menyusun hingga 80% dari total formula produk.
              </li>
              <li>
                <b className="cluv-text-dark">BHA / Salicylic Acid:</b> Sangat baik untuk kulit berminyak, namun hindari pemakaian berlebih jika kulit kemerahan.
              </li>
              <li>
                <b className="cluv-text-dark">Fragrance / Parfum:</b> Berada di urutan paling bawah namun merupakan pemicu utama alergi kulit sensitif.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet: Label Reading Guide & Skin Profile Context */}
      <BottomSheet
        isOpen={showGuideSheet}
        onClose={() => setShowGuideSheet(false)}
        title="Panduan Label & Profil Kulit"
        subtitle="Cara membaca komposisi kosmetik secara mandiri"
      >
        <div className="cluv-flex-col cluv-gap-4">
          {/* Passport Skin Profile Card (Bento Wallet Warm Paper Style) */}
          <div className="cluv-bento-wallet">
            <div className="cluv-bento-wallet-top">
              <div className="cluv-bento-wallet-tag">
                <User size={12} strokeWidth={2.4} />
                <span>Profil Kulit Terdaftar</span>
              </div>
            </div>
            {/* 3 Item Meta Data Seragam Khas Tabel Blok Profil */}
            <div className="cluv-passport-meta-grid">
              <span className="cluv-passport-meta-label">Tipe Kulit</span>
              <span className="cluv-passport-meta-val">{userSkinTypeLabel}</span>

              <span className="cluv-passport-meta-label">Pantangan</span>
              <span className="cluv-passport-meta-val">{userSensitivities}</span>

              <span className="cluv-passport-meta-label">Target</span>
              <span className="cluv-passport-meta-val">{userTargetFormula}</span>
            </div>

            {/* Fokus Perhatian Membentang Penuh (Hirarki Selaras Tanpa Huruf Kapital Semua) */}
            <div className="cluv-bento-wallet-focus-block">
              <span className="cluv-bento-wallet-focus-label">Fokus Perhatian</span>
              <p className="cluv-bento-wallet-focus-val">
                {userConcerns}
              </p>
            </div>
          </div>

          {/* 3 Principles Unified Numbered Guide Card */}
          <div className="cluv-card cluv-p-0 cluv-overflow-hidden">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--cluv-current-border, var(--cluv-border, #dce8f3))', background: 'var(--cluv-current-card-bg-subtle, var(--cluv-neutral-50, #f8fafc))' }}>
              <h4 className="cluv-title-card cluv-m-0" style={{ fontSize: '0.9375rem', fontWeight: 800 }}>3 Prinsip Membaca Label</h4>
              <p className="cluv-caption cluv-text-muted cluv-m-0" style={{ fontSize: '0.78125rem', marginTop: '3px', lineHeight: 1.4 }}>
                Pedoman dermatologi praktis saat memeriksa komposisi skincare
              </p>
            </div>
            <div className="cluv-guide-item">
              <span className="cluv-guide-num is-teal">1</span>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Aturan 5 Bahan Teratas</strong>
                <p className="cluv-guide-desc">Menyusun 70%–80% dari keseluruhan formula produk skincare.</p>
              </div>
            </div>
            <div className="cluv-guide-item">
              <span className="cluv-guide-num is-gold">2</span>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Batas 1% Konsentrasi</strong>
                <p className="cluv-guide-desc">Di bawah 1% (pewarna, pengawet, parfum) urutan penulisan boleh acak.</p>
              </div>
            </div>
            <div className="cluv-guide-item">
              <span className="cluv-guide-num is-rose">3</span>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Indeks Komedogenik (0–5)</strong>
                <p className="cluv-guide-desc">Skor 0–1 aman pori, sedangkan skor 4–5 rawan memicu komedo &amp; jerawat.</p>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

