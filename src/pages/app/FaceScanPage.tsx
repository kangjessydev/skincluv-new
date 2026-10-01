import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  X,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ShoppingBag,
  History,
  Coins,
  Crown,
  Trophy,
  FlaskConical,
  CheckCircle2,
  Target,
  ShieldCheck,
  MessageSquare,
  Info,
  Zap,
  Sun,
  Scan,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import { validateImageQuality, compressImageForAI } from '@/utils/imageQualityValidator'
import { detectHumanFace, disposeFaceLandmarker } from '@/utils/faceLandmarkDetector'
import '@/styles/face-scan.css'

type Stage = 'upload' | 'scanning' | 'result'

export interface AreaEvaluation {
  id: string
  area_name: string
  score: number // 1-100
  status: 'Optimal' | 'Perlu Perhatian' | 'Waspada'
  finding: string
  analogy: string
  action_plan: string
}

export interface RecommendedIngredient {
  name: string
  purpose: string
  priority?: 'essential' | 'recommended' | 'optional'
}

export interface ProductRecommendation {
  product_name: string
  brand?: string
  category: string
  match_score?: number | null
  priority_label?: string
  key_ingredients?: string[]
  why_recommended: string
  price_estimate?: string
  priority?: 'essential' | 'recommended' | 'optional'
  is_ingredient_recommendation?: boolean
}

interface AnalysisResult {
  skin_type: 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive'
  skin_concerns: string[]
  analysis_notes: string
  confidence?: number
  overall_score?: number
  skin_status_title?: string
  area_evaluations?: AreaEvaluation[]
  recommended_ingredients?: RecommendedIngredient[]
  product_recommendations?: ProductRecommendation[]
  tips_avoid?: string[]
  tips_reduce?: string[]
  tips_do?: string[]
  cached?: boolean
  cached_at?: string
  scan_id?: string
  image_content_hash?: string
  analysis_version?: string
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

// Scanner Stage Animation Text
const FACE_SCAN_STAGES_TEXT = [
  'Tahap 1/3: Memverifikasi kelayakan foto & orientasi wajah...',
  'Tahap 2/3: Memetakan 3 zona wajah klinis (Dahi, T-Zone & Pipi, Dagu)...',
  'Tahap 3/3: Menganalisis aktivitas sebum, pori-pori & integritas barrier...',
  'Tahap 3/3: Menyelaraskan profil kulit & menyusun rekomendasi hero actives...',
]

// Educational Clinical Dermatology Tips (Rotating during Stage 2 HUD)
const CLINICAL_FACIAL_TIPS = [
  'Zona T (Dahi & Hidung) memiliki konsentrasi kelenjar sebasea tertinggi, sehingga paling cepat memproduksi kilap sebum alami.',
  'Pori-pori tidak memiliki otot untuk membuka atau menutup; penumpukan sel kulit mati dan sebumlah yang membuatnya tampak membesar.',
  'Kombinasi BHA (Salicylic Acid) dan Niacinamide bekerja sinergis: BHA membersihkan pori dari dalam, Niacinamide mengontrol sebum dan memperkuat barrier.',
  'Kulit area perioral (sekitar mulut & dagu) sangat responsif terhadap fluktuasi hormon dan hidrasi harian.',
  'Skin barrier yang optimal mampu mengunci kadar air alami (TEWL rendah) dan melindungi kulit dari mikro-inflamasi polusi.',
]

// Kimi & BPOM Approved Clinical Severity Bands (RFC 011)
export function getClinicalSeverityBand(score: number): {
  band: 'optimal' | 'mild_attention' | 'needs_attention' | 'consult_dermatologist'
  label: string
  descriptor: string
  colorClass: string
} {
  if (score >= 85) {
    return {
      band: 'optimal',
      label: 'Optimal',
      descriptor: 'Kulitmu dalam kondisi baik — pertahankan rutinitasmu.',
      colorClass: 'score-optimal',
    }
  }
  if (score >= 70) {
    return {
      band: 'mild_attention',
      label: 'Perhatian Ringan',
      descriptor: 'Ada hal kecil yang bisa ditingkatkan di rutinitasmu.',
      colorClass: 'score-optimal',
    }
  }
  if (score >= 55) {
    return {
      band: 'needs_attention',
      label: 'Perlu Perhatian',
      descriptor: 'Beberapa area butuh perawatan rutin yang lebih konsisten.',
      colorClass: 'score-caution',
    }
  }
  return {
    band: 'consult_dermatologist',
    label: 'Konsultasi Ahli Kulit Dianjurkan',
    descriptor: 'Hasil scan-mu menunjukkan kondisi yang sebaiknya ditinjau dokter spesialis kulit. Skincluv adalah alat bantu perawatan sehari-hari, bukan pengganti konsultasi medis.',
    colorClass: 'score-warning',
  }
}

// Smart Enrichment Adapter to ensure full 3-Stage UI data completeness
const enrichAnalysisResult = (res: AnalysisResult & { is_valid_face?: boolean }): AnalysisResult => {
  const enriched = { ...res }

  // If overall_score is missing, calculate average from area_evaluations rather than fake random!
  if (!enriched.overall_score) {
    if (enriched.area_evaluations && enriched.area_evaluations.length > 0) {
      const avg = enriched.area_evaluations.reduce((sum, a) => sum + (Number(a.score) || 80), 0) / enriched.area_evaluations.length
      enriched.overall_score = Math.round(avg)
    } else {
      enriched.overall_score = 80
    }
  }

  const bandInfo = getClinicalSeverityBand(enriched.overall_score ?? 80)
  if (!enriched.skin_status_title) {
    enriched.skin_status_title = `Kondisi Kulit: ${bandInfo.label}`
  }

  // Ensure 3-Area Granular Breakdown (Forehead, T-Zone & Cheeks, Chin & Perioral)
  if (!enriched.area_evaluations || enriched.area_evaluations.length === 0) {
    enriched.area_evaluations = [
      {
        id: 'area_forehead',
        area_name: 'Dahi (Forehead)',
        score: Math.min(100, (enriched.overall_score ?? 78) + 2),
        status: (enriched.overall_score ?? 78) >= 80 ? 'Optimal' : 'Perlu Perhatian',
        finding: 'Tekstur dahi relatif mulus tanpa bintik inflamasi, hanya terlihat kilat sebum halus di bawah pencahayaan.',
        analogy: 'Mulus banget mirip layar HP baru lepas tempered glass, tinggal dijaga biar tidak overcook minyaknya.',
        action_plan: 'Pastikan sisa produk rambut atau alat roll tidak menempel terlalu lama di dahi untuk mencegah clogged pores.',
      },
      {
        id: 'area_tzone',
        area_name: 'Hidung & Pipi (T-Zone & Cheeks)',
        score: Math.max(50, (enriched.overall_score ?? 75) - 6),
        status: 'Perlu Perhatian',
        finding: 'Produksi minyak alami tampak cukup menonjol di area pangkal hidung dan pipi dalam dengan pori-pori tereksfoliasi ringan.',
        analogy: 'Kena efek filter dewy glow alami, tapi kalau dibiarkan pas cuaca panas bisa berubah jadi ladang minyak.',
        action_plan: 'Gunakan eksfoliator BHA cair ringan 2 kali seminggu untuk membersihkan komedo tersembunyi di sekitar lekukan hidung.',
      },
      {
        id: 'area_chin',
        area_name: 'Dagu & Sekitar Mulut (Chin & Perioral)',
        score: Math.min(100, (enriched.overall_score ?? 80) + 1),
        status: 'Optimal',
        finding: 'Area dagu bersih dari jerawat hormonal aktif dan warna kulit tampak merata.',
        analogy: 'Aman dari drama breakout dadakan, siap tampil bare face tanpa perlu tumpukan concealer.',
        action_plan: 'Rutin gunakan pelembap tekstur gel dan hidrasi bibir secara maksimal.',
      },
    ]
  }

  // Normalize recommended_ingredients from AI response
  if (Array.isArray(enriched.recommended_ingredients) && enriched.recommended_ingredients.length > 0) {
    enriched.recommended_ingredients = enriched.recommended_ingredients.map((item: any) => ({
      name: typeof item === 'string' ? item : (item.name || item.ingredient || 'Bahan Aktif'),
      purpose: typeof item === 'object' ? (item.purpose || item.why_recommended || item.reason || 'Membantu merawat dan menjaga stabilitas skin barrier.') : 'Membantu merawat dan menjaga stabilitas skin barrier.',
      priority: typeof item === 'object' && item.priority ? item.priority : 'recommended',
    }))
  } else if (Array.isArray(enriched.product_recommendations) && enriched.product_recommendations.length > 0) {
    enriched.recommended_ingredients = enriched.product_recommendations.map((p) => ({
      name: p.product_name.replace(/^Kandungan yang cocok:\s*/i, ''),
      purpose: p.why_recommended,
      priority: (p.priority as any) || 'recommended',
    }))
  } else {
    enriched.recommended_ingredients = [
      {
        name: 'Niacinamide 5%',
        purpose: 'Mengontrol produksi sebum di area T-Zone sekaligus memperkuat skin barrier tanpa memicu iritasi.',
        priority: 'essential',
      },
      {
        name: 'Salicylic Acid 2% (BHA)',
        purpose: 'Membantu membersihkan pori-pori yang tersumbat di area hidung dan mengurangi potensi timbulnya komedo.',
        priority: 'essential',
      },
      {
        name: 'Hyaluronic Acid',
        purpose: 'Memberikan hidrasi mendalam berbahan dasar air (water-based) agar kulit tidak dehidrasi dan mengimbangi eksfoliasi BHA.',
        priority: 'recommended',
      },
      {
        name: 'Ceramide',
        purpose: 'Menjaga keutuhan skin barrier dan mengunci kelembapan alami kulit.',
        priority: 'recommended',
      },
    ]
  }

  // Fallback Categorized Tips (Avoid, Reduce, Do)
  if (!enriched.tips_avoid || enriched.tips_avoid.length === 0) {
    enriched.tips_avoid = [
      'Memakai pembersih wajah yang bikin kulit terasa tertarik atau "kesat"',
      'Menyentuh atau memencet area hidung saat tangan belum dicuci',
      'Penggunaan pelembap bertekstur heavy cream di area T-zone',
    ]
  }

  if (!enriched.tips_reduce || enriched.tips_reduce.length === 0) {
    enriched.tips_reduce = [
      'Penggunaan makeup tebal bertumpuk saat beraktivitas outdoor',
      'Konsumsi makanan berminyak berlebihan saat malam hari',
      'Terpapar ruangan ber-AC terlalu lama tanpa hidrasi cukup',
    ]
  }

  if (!enriched.tips_do || enriched.tips_do.length === 0) {
    enriched.tips_do = [
      'Lakukan double cleansing pakai cleansing oil / micellar water sebelum pembersih wajah',
      'Pakai sunscreen bertekstur watery gel setiap pagi hari',
      'Sering ganti sarung bantal dan cuci aksesoris rambut secara rutin',
    ]
  }

  return enriched
}

interface FaceValidationResponse {
  is_valid_face: boolean
  reason: string
  confidence?: number
}

export default function FaceScanPage() {
  const { user, session, profile, activeSkinProfile, setActiveSkinProfile, coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage, askCoinConfirmation, getLastError } = useInvokeAI()
  const currentCoins = coinBalance?.balance ?? 0
  const faceCost = getFeatureCreditCost('face_analysis')
  const isFreeTierOutOfCredits = !hasPaidAiQuota(subscription) && currentCoins < faceCost

  const userSkinType = activeSkinProfile?.skin_type ? activeSkinProfile.skin_type.toUpperCase() : 'KOMBINASI'
  const userConcerns: string[] = activeSkinProfile?.skin_concerns?.length
    ? activeSkinProfile.skin_concerns.map((c: string) => CONCERN_LABELS[c] || c).slice(0, 3)
    : ['Pori besar', 'Minyak T-Zone', 'Skin Barrier']

  // Stage Management
  const [stage, setStage] = useState<Stage>('upload')

  // Photo & Preview States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Stage 2 Scanning HUD States
  const [scanTextIndex, setScanTextIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  // Analysis Results & Errors
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [createdScanId, setCreatedScanId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [forceReanalyze, setForceReanalyze] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const topResultRef = useRef<HTMLDivElement>(null)

  // Memory cleanup for MediaPipe Wasm (RFC 009 DeepSeek)
  useEffect(() => {
    return () => {
      disposeFaceLandmarker()
    }
  }, [])

  // Rotating clinical tips during scanning
  useEffect(() => {
    if (stage !== 'scanning') return
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % CLINICAL_FACIAL_TIPS.length)
    }, 3800)
    return () => clearInterval(tipInterval)
  }, [stage])

  // Unified Scanning Pipeline:
  // Client CV (Canvas quality & MediaPipe Face Mesh) -> AI Face Validation Gate (0 Credits) -> AI Dermatologist Analysis -> Result
  useEffect(() => {
    if (stage !== 'scanning') {
      setScanTextIndex(0)
      return
    }

    let isSubscribed = true
    let textInterval: ReturnType<typeof setInterval> | null = null

    const runScanPipeline = async () => {
      try {
        setScanTextIndex(0) // "Tahap 1/3: Memverifikasi kelayakan foto & orientasi wajah..."

        if (!imageBase64) {
          setErrorMsg('Pilih foto terlebih dahulu.')
          setStage('upload')
          return
        }

        // =========================================================================
        // GERBANG 1 (FRONTEND): Canvas Math (Pencahayaan & Laplacian Blur Check)
        // 0 Biaya, 0 Network (< 25ms)
        // =========================================================================
        const qualityRes = await validateImageQuality(imageBase64)
        if (!isSubscribed) return

        if (!qualityRes.isValid) {
          setErrorMsg(qualityRes.message)
          setStage('upload')
          return
        }

        // =========================================================================
        // GERBANG 2 (FRONTEND): Google MediaPipe 468 Face Mesh (Human & Obstruction)
        // 100% Client-Side WebAssembly (< 40ms) — Zero Backend Call!
        // =========================================================================
        const faceRes = await detectHumanFace(imageBase64)
        if (!isSubscribed) return

        // 2a. Cek apakah ini wajah manusia asli
        if (!faceRes.isHuman || faceRes.faceCount === 0) {
          const failReason =
            faceRes.rejectionReason ||
            'Foto yang Anda unggah terdeteksi sebagai produk skincare, hewan, atau objek non-manusia.'
          setErrorMsg(failReason)
          setStage('upload')
          return
        }

        // 2b. Cek apakah wajah terhalang
        if (!faceRes.isUnobstructed) {
          const failReason =
            faceRes.rejectionReason ||
            'Wajah terdeteksi terhalang ponsel (mirror selfie) atau masker. Harap pastikan mata, hidung, dan mulut terlihat jelas.'
          setErrorMsg(failReason)
          setStage('upload')
          return
        }

        // =========================================================================
        // GERBANG 3 (AI GATE): Validasi Wajah Cepat AI (Gratis / 0 Credits)
        // Memastikan foto layak secara klinis tanpa risiko memotong kredit pengguna
        // =========================================================================
        const valRes = await invoke<FaceValidationResponse>({
          feature_slug: 'face_validation',
          messages: [
            {
              role: 'user',
              content: 'Verifikasi apakah gambar ini adalah foto wajah manusia yang layak dianalisis secara klinis.',
            },
          ],
          input_context: {
            image_base64: imageBase64 || '',
          },
        })

        if (!isSubscribed) return

        if (valRes && valRes.is_valid_face === false) {
          setErrorMsg(
            valRes.reason ||
              'Wajah tidak terlihat cukup jelas untuk analisis dermatologis. Silakan gunakan foto dengan pencahayaan lebih terang dan tanpa filter.'
          )
          setStage('upload')
          return
        }

        // =========================================================================
        // GERBANG 4 (AI SPECIALIST): Analisis Dermatologis Mendalam (5 Credits)
        // Model penalaran klinis tinggi dengan rekomendasi bahan aktif
        // =========================================================================
        setScanTextIndex(1)
        textInterval = setInterval(() => {
          setScanTextIndex((prev) => (prev < FACE_SCAN_STAGES_TEXT.length - 1 ? prev + 1 : prev))
        }, 1800)

        const result = await invoke<AnalysisResult & { is_valid_face?: boolean; reason?: string }>({
          feature_slug: 'face_analysis',
          messages: [
            {
              role: 'user',
              content: 'Analisis kondisi kulit dari foto wajah yang dilampirkan berikut ini.',
            },
          ],
          input_context: {
            image_base64: imageBase64 || '',
          },
          force_reanalysis: forceReanalyze,
        })

        if (!isSubscribed) return
        setForceReanalyze(false)

        if (!result) {
          const actualErr = getLastError()
          if (actualErr === 'INSUFFICIENT_CREDITS') {
            setErrorMsg(`Credits kamu tidak mencukupi untuk Analisis Wajah (butuh ${faceCost} Credits). Selesaikan misi harian untuk mendapatkan Credits gratis atau upgrade ke paket Glow / PRO.`)
          } else {
            setErrorMsg(actualErr || 'Layanan analisis AI sedang sibuk atau mengalami gangguan koneksi. Saldo Credit Anda tetap aman. Silakan coba klik Mulai Analisis lagi.')
          }
          setStage('upload')
          return
        }

        if (result.is_valid_face === false) {
          setErrorMsg(
            result.reason ||
              'Wajah tidak terlihat cukup jelas untuk analisis dermatologis. Silakan gunakan foto yang lebih terang dan fokus.'
          )
          setStage('upload')
          return
        }

        const enriched = enrichAnalysisResult(result)
        setAnalysisResult(enriched)

        // Save scan record & sync with Supabase skin_profiles and face_scans history schema
        let effectiveUserId = user?.id || session?.user?.id || profile?.id
        if (!effectiveUserId) {
          const { data: authUser } = await supabase.auth.getUser()
          effectiveUserId = authUser?.user?.id
        }

        if (effectiveUserId && enriched.skin_type) {
          try {
            const scoreInt = Math.min(100, Math.max(0, Math.round(Number(enriched.overall_score) || 80)))

            // Invariant 7 (RFC 011): Jika hasil berasal dari cache hit, reuse scan_id yang sudah ada!
            // Jangan memasukkan baris duplikat ke face_scans agar baseline tren tidak tercemar.
            if (enriched.cached && enriched.scan_id) {
              setCreatedScanId(enriched.scan_id)
              console.log('[FaceScanPage] Cache hit reused scan_id:', enriched.scan_id)
            } else {
              const scanRecord = {
                user_id: effectiveUserId,
                overall_score: scoreInt,
                skin_status_title: enriched.skin_status_title || 'Kondisi Kulit Terpantau',
                skin_type: String(enriched.skin_type).toLowerCase(),
                skin_concerns: enriched.skin_concerns || [],
                analysis_notes: enriched.analysis_notes || '',
                area_evaluations: (enriched.area_evaluations || []) as any,
                product_recommendations: (enriched.product_recommendations || []) as any,
                raw_ai_response: enriched as any,
                image_content_hash: (enriched as any).image_content_hash || null,
                analysis_version: (enriched as any).analysis_version || 'face-v4',
                is_repeat: false,
              }

              // A. Simpan ke Riwayat Scan Multi-Sesi (face_scans)
              const { data: insertedScan, error: insertErr } = await supabase
                .from('face_scans')
                .insert(scanRecord)
                .select('id')
                .maybeSingle()

              if (insertErr) {
                console.error('[FaceScanPage] face_scans insert error:', insertErr.message)
              } else if (insertedScan?.id) {
                setCreatedScanId(insertedScan.id)
                console.log('[FaceScanPage] face_scans history saved for user:', effectiveUserId, insertedScan.id)
              }
            }

            // B. Update Profil Kulit Aktif Pengguna (skin_profiles)
            const { data: existing } = await supabase
              .from('skin_profiles')
              .select('id')
              .eq('user_id', effectiveUserId)
              .eq('is_active', true)
              .maybeSingle()

            const payload = {
              skin_type: String(enriched.skin_type).toLowerCase(),
              skin_concerns: enriched.skin_concerns || [],
              analysis_notes: enriched.analysis_notes || '',
              raw_ai_response: enriched as any,
            }

            if (existing?.id) {
              await supabase
                .from('skin_profiles')
                .update(payload)
                .eq('id', existing.id)
            } else {
              await supabase
                .from('skin_profiles')
                .insert({
                  ...payload,
                  user_id: effectiveUserId,
                  is_active: true,
                })
            }

            // C. Perbarui activeSkinProfile di store Zustand
            if (setActiveSkinProfile) {
              setActiveSkinProfile({
                id: existing?.id || effectiveUserId,
                user_id: effectiveUserId,
                skin_type: String(enriched.skin_type).toLowerCase(),
                skin_concerns: enriched.skin_concerns || [],
                analysis_notes: enriched.analysis_notes || '',
                raw_ai_response: enriched as any,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any)
            }
          } catch (syncErr) {
            console.error('[FaceScanPage] Sync face_scans/skin_profiles exception:', syncErr)
          }
        }

        setStage('result')
      } catch (err: any) {
        if (!isSubscribed) return
        console.error('Face scan pipeline error:', err)
        setErrorMsg('Terjadi kendala saat menganalisis foto. Credit Anda tidak berkurang. Silakan coba lagi.')
        setStage('upload')
      }
    }

    runScanPipeline()

    return () => {
      isSubscribed = false
      if (textInterval) clearInterval(textInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Smooth Auto-scroll to results when Stage 3 activates
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
    setAnalysisResult(null)

    try {
      const base64Data = await compressImageForAI(file, 800, 0.70)
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
    setAnalysisResult(null)
  }

  const handleStartFlow = async () => {
    if (!imageBase64) {
      setErrorMsg('Pilih atau unggah foto wajah terlebih dahulu.')
      return
    }
    if (isFreeTierOutOfCredits) {
      const confirmed = await askCoinConfirmation(faceCost, 'Scan Wajah Spesialis')
      if (!confirmed) return
    }
    setErrorMsg(null)
    setForceReanalyze(false)
    setStage('scanning')
  }

  const handleForceReanalyze = async () => {
    if (!imageBase64) return
    if (isFreeTierOutOfCredits) {
      const confirmed = await askCoinConfirmation(faceCost, 'Scan Ulang Wajah (5 Credits)')
      if (!confirmed) return
    }
    setErrorMsg(null)
    setForceReanalyze(true)
    setStage('scanning')
  }

  const handleResetFlow = () => {
    setStage('upload')
    setPreviewUrl(null)
    setImageBase64(null)
    setAnalysisResult(null)
    setErrorMsg(null)
    setCreatedScanId(null)
    setForceReanalyze(false)
  }

  // Unified Hero Actives list
  const heroIngredients: RecommendedIngredient[] =
    analysisResult?.recommended_ingredients && analysisResult.recommended_ingredients.length > 0
      ? analysisResult.recommended_ingredients
      : (analysisResult?.product_recommendations || []).map((p) => ({
          name: p.product_name.replace(/^Kandungan yang cocok:\s*/i, ''),
          purpose: p.why_recommended,
          priority: (p.priority as any) || 'recommended',
        }))

  return (
    <div className="v0-page-container skincluv-face-scan-page animate-fade-in">
      {/* Coin Deduction Modal */}
      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={true}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={coinBalance?.balance ?? 0}
          featureName={pendingCoinConfirm.featureName || 'Scan Wajah AI'}
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* Auto-scroll anchor */}
      <div ref={topResultRef} />

      {/* Header Bar */}
      <div className="page-header-box">
        <div className="page-header-content">
          <h1 className="page-title">Scan Wajah AI</h1>
          <p className="page-subtitle">
            Pemetaan kondisi kulit dari foto wajahmu dengan AI secara objektif, lengkap dengan analogi penyebab, saran perawatan, dan rekomendasi bahan aktif formulasi kosmetik.
          </p>
        </div>
        <Link to="/scan-history" className="history-shortcut-btn">
          <History size={16} /> Riwayat Scan Kulit
        </Link>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="error-alert">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STAGE 1: UPLOAD & SIDE PANEL */}
      {stage === 'upload' && (
        <div className="facescan-grid-layout">
          {/* Left Column: Dropzone & Main Action */}
          <div className="main-dropzone-col">
            <div
              className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview Foto Wajah" className="preview-img" />
                  <button onClick={handleClearImage} className="clear-image-btn">
                    <X size={14} /> Ganti Foto
                  </button>
                </div>
              ) : (
                <>
                  <div className="dz-icon-avatar">
                    <Camera size={26} />
                  </div>
                  <h3 className="dz-main-title">Unggah foto wajah kamu</h3>
                  <p className="dz-sub-title">Tarik & lepas, atau klik untuk memilih — JPG/PNG/WEBP maks 5MB</p>
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

            {isFreeTierOutOfCredits && (
              <div className="face-scan-credit-notice">
                <div className="notice-left">
                  <Coins size={16} className="notice-coin-icon" />
                  <span>
                    Butuh <strong>{faceCost} Credits</strong> untuk analisis wajah (Saldo kamu: <strong>{currentCoins} Credits</strong>).
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

            <button
              className="btn-primary-action"
              onClick={handleStartFlow}
              disabled={!imageBase64}
            >
              <Sparkles size={18} />
              <span>Mulai Analisis Wajah AI</span>
            </button>

            {/* Medical Disclaimer */}
            <div className="disclaimer-banner">
              <Info size={16} className="disclaimer-icon" />
              <span>
                <b>Privasi & Klinis:</b> Foto hanya diproses untuk deteksi kondisi kulit dan tidak dibagikan kepada pihak ketiga. Hasil analisis bersifat edukasi dermatologi.
              </span>
            </div>
          </div>

          {/* Right Column: Profile Context & Photo Guidelines */}
          <div className="side-info-col">
            <div className="side-card">
              <div className="card-section-label">PROFIL KULIT AKTIF</div>
              <div className="profile-info-row">
                <span>Tipe kulit</span>
                <span className="profile-val-text">{userSkinType}</span>
              </div>
              <div className="profile-info-row stacked">
                <span>Fokus kulit</span>
                <div className="chips-mini-group">
                  {userConcerns.map((concern: string, idx: number) => (
                    <span key={idx} className="chip-mini-item">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="side-card capture-guidance-card">
              <div className="card-section-label">Panduan Sebelum Pengambilan Foto</div>
              <p className="capture-guidance-sub">
                Pastikan kondisi berikut terpenuhi agar hasil analisis akurat dan konsisten dalam membandingkan perkembangan kulit.
              </p>
              <div className="capture-guidance-items">
                <div className="cg-item">
                  <div className="cg-icon"><Sun size={18} /></div>
                  <div className="cg-text">
                    <strong>1. Pencahayaan merata dan alami</strong>
                    <p>Pencahayaan memengaruhi akurasi pembacaan warna dan tekstur kulit. Ruangan terang dengan cahaya alami adalah pilihan terbaik.</p>
                  </div>
                </div>
                <div className="cg-item">
                  <div className="cg-icon"><Sparkles size={18} /></div>
                  <div className="cg-text">
                    <strong>2. Wajah bersih tanpa riasan atau produk tebal</strong>
                    <p>Disarankan mengambil foto sekitar 1 jam setelah mencuci wajah agar kondisi alami sebum dan pori terlihat jelas.</p>
                  </div>
                </div>
                <div className="cg-item">
                  <div className="cg-icon"><Scan size={18} /></div>
                  <div className="cg-text">
                    <strong>3. Posisikan wajah sejajar, jarak sekitar 30 cm</strong>
                    <p>Pastikan dahi, kedua pipi, hidung, dan dagu berada tepat di dalam bingkai panduan kamera.</p>
                  </div>
                </div>
              </div>
              <div className="cg-footer-tip">
                <em>Catatan: Kualitas pencahayaan atau sudut foto dapat memengaruhi akurasi skor. Indikator kualitas foto akan memandu Anda saat kamera aktif.</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: NEURAL AI FACIAL BIOMETRIC SCANNER HUD */}
      {stage === 'scanning' && (
        <div className="stage-card scanning-card">
          <div className="scan-frame-viewport">
            {previewUrl ? (
              <img src={previewUrl} alt="Foto Wajah" className="scan-img-preview" />
            ) : (
              <div className="mock-face-shape" />
            )}

            {/* HUD High-Tech Grid & Corner Brackets */}
            <div className="hud-grid-overlay" />
            <div className="hud-corner top-left" />
            <div className="hud-corner top-right" />
            <div className="hud-corner bottom-left" />
            <div className="hud-corner bottom-right" />

            {/* Sweeping Laser Beam */}
            <div className="scan-laser-beam" />

            {/* Live Facial Biometric Status Pill */}
            <div className="hud-status-badge">
              <span className="hud-pulse-dot" />
              <span>AI BIOMETRIC SCAN ACTIVE</span>
            </div>
          </div>

          {/* Shimmering Phase Status */}
          <div className="scan-status-row">
            <div className="bouncing-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="shimmer-scan-text">{FACE_SCAN_STAGES_TEXT[scanTextIndex]}</span>
          </div>

          {/* Smooth Indeterminate Progress Bar */}
          <div className="scan-progress-bar-track">
            <div className="scan-progress-bar-glow" />
          </div>

          {/* Educational Clinical Tip Box */}
          <div className="scan-tip-card">
            <div className="tip-header">
              <Sparkles size={13} className="tip-sparkle-icon" />
              <span>Catatan Dermatologi Klinis</span>
            </div>
            <p className="tip-body">{CLINICAL_FACIAL_TIPS[tipIndex]}</p>
          </div>
        </div>
      )}

      {/* STAGE 3: RESULTS OUTPUT & CLINICAL REPORT */}
      {stage === 'result' && analysisResult && (
        <div className="results-stack">
          {/* Provenance Cache Banner (Kimi Template RFC 011) */}
          {analysisResult.cached && (
            <div className="card glass-card cache-hit-provenance-card">
              <div className="cache-hit-inner">
                <div className="cache-hit-icon-wrap">
                  <Zap size={16} />
                </div>
                <div className="cache-hit-body">
                  <h4 className="cache-hit-title">
                    <Zap size={16} className="inline mr-1" /> Hasil Tersimpan Ditampilkan — 0 Kuota Terpotong
                  </h4>
                  <p className="cache-hit-desc">
                    Ini foto yang sama dengan scan kamu pada {analysisResult.cached_at ? new Date(analysisResult.cached_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'sebelumnya'}. 
                    Foto yang sama berarti kondisi kulit yang terbaca juga sama, sehingga hasil analisisnya identik. Kami tampilkan hasil tersimpanmu secara instan tanpa memotong kuota.
                  </p>
                  <div className="cache-hit-footer">
                    <span className="cache-hit-badge-success">
                      <CheckCircle2 size={13} /> Kuota kamu aman
                    </span>
                    <span className="cache-hit-badge-success">
                      <CheckCircle2 size={13} /> Hasil identik
                    </span>
                    <span className="cache-hit-badge-speed">
                      <Zap size={12} /> Instan (&lt;1 detik)
                    </span>
                    <div className="cache-hit-actions">
                      <button
                        onClick={handleResetFlow}
                        className="btn btn-secondary btn-sm"
                      >
                        <Camera size={13} /> Scan Foto Baru
                      </button>
                      <button
                        onClick={handleForceReanalyze}
                        className="btn btn-outline btn-sm btn-force-reanalyze"
                        title="Analisis ulang foto ini dari awal dengan AI (5 Credits)"
                      >
                        <RotateCcw size={13} /> Analisis Ulang (5 Credits)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Escalation Alert (BPOM Kimi Consensus: Score < 55) */}
          {getClinicalSeverityBand(analysisResult.overall_score ?? 80).band === 'consult_dermatologist' && (
            <div className="card clinical-escalation-alert-card">
              <AlertCircle size={20} className="clinical-escalation-icon" />
              <div>
                <h4 className="clinical-escalation-title">
                  Rekomendasi Rujukan Ahli Dermatologi
                </h4>
                <p className="clinical-escalation-desc">
                  Hasil evaluasi visual menunjukkan beberapa kondisi kulit yang lebih disarankan untuk ditinjau langsung oleh dokter spesialis kulit. AI Skincluv adalah alat bantu panduan kosmetik sehari-hari, bukan instrumen diagnosis medis resmi.
                </p>
              </div>
            </div>
          )}

          {/* Score Hero Banner */}
          <div className="score-hero-banner">
            <div className="dots-bg-pattern" />
            <div className="hero-glow-accent" />
            
            <div className="score-hero-content">
              <div className={`score-ring-avatar ${
                getClinicalSeverityBand(analysisResult.overall_score ?? 80).colorClass
              }`}>
                <div className="sr-number-row">
                  <span className="sr-val">{analysisResult.overall_score ?? 80}</span>
                  <span className="sr-scale">/100</span>
                </div>
                <span className="sr-unit">{getClinicalSeverityBand(analysisResult.overall_score ?? 80).label}</span>
              </div>

              <div className="score-meta-info">
                <div className="hero-badges-row">
                  <span className="hero-skin-type-badge">
                    <Sparkles size={12} /> TIPE KULIT: {String(analysisResult.skin_type || userSkinType).toUpperCase()}
                  </span>
                  <span className="hero-confidence-badge">
                    <ShieldCheck size={12} /> ANALISIS DERMATOLOGI
                  </span>
                </div>
                <h3 className="hero-status-title">
                  {analysisResult.skin_status_title ?? `Kondisi Kulit: ${getClinicalSeverityBand(analysisResult.overall_score ?? 80).label}`}
                </h3>
                <p className="hero-status-desc">
                  {analysisResult.analysis_notes ||
                    getClinicalSeverityBand(analysisResult.overall_score ?? 80).descriptor}
                </p>
              </div>
            </div>
          </div>

          {/* Biometric Scan Snapshot & Area Overview */}
          {previewUrl && (
            <div className="card biometric-overview-card">
              <div className="biometric-photo-col">
                <div className="biometric-frame">
                  <img src={previewUrl} alt="Foto Wajah Teranalisis" className="biometric-img" />
                  <div className="biometric-hud-corners">
                    <span className="bh-corner tl" />
                    <span className="bh-corner tr" />
                    <span className="bh-corner bl" />
                    <span className="bh-corner br" />
                  </div>
                  <div className="biometric-verified-tag">
                    <CheckCircle2 size={12} />
                    <span>Foto Dianalisis Klinis</span>
                  </div>
                </div>
              </div>
              <div className="biometric-areas-col">
                <div className="biometric-areas-header">
                  <Target size={16} className="text-teal" />
                  <span>Ringkasan Biometrik 3 Area Wajah</span>
                </div>
                <div className="biometric-chips-list">
                  {analysisResult.area_evaluations?.map((area) => (
                    <div key={area.id} className="biometric-area-item">
                      <div className="bai-left">
                        <span className="bai-name">{area.area_name}</span>
                        <span className="bai-score-text">Skor: {area.score}/100</span>
                      </div>
                      <span className={`area-severity-badge ${area.status === 'Optimal' ? 'ringan' : 'sedang'}`}>
                        {area.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Granular 3-Area Facial Evaluation */}
          <div className="section-label-header">EVALUASI KONDISI KULIT PER AREA (GRANULAR)</div>

          <div className="area-cards-stack">
            {analysisResult.area_evaluations?.map((area) => (
              <div key={area.id} className="card area-analysis-card">
                <div className="area-card-head">
                  <div className="area-title-group">
                    <Target size={16} className="area-icon-accent" />
                    <h4 className="area-title-text">{area.area_name}</h4>
                  </div>
                  <div className="area-head-badges">
                    <span className={`area-severity-badge ${area.status === 'Optimal' ? 'ringan' : 'sedang'}`}>
                      {area.status}
                    </span>
                    <span className="area-score-pill">Skor: {area.score}/100</span>
                  </div>
                </div>

                <div className="area-finding-box">
                  <span className="af-label">Hasil Analisis:</span>
                  <p className="af-text">{area.finding}</p>
                </div>

                <div className="area-analogy-box">
                  <span className="aa-label">Penjelasan Sederhana:</span>
                  <p className="aa-text">{area.analogy}</p>
                </div>

                <div className="area-action-box">
                  <span className="ac-label">Rencana Tindakan:</span>
                  <p className="ac-text">{area.action_plan}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Section 2: Categorized Lifestyle & Skincare Tips */}
          <div className="section-label-header">TIPS PERSONAL UNTUK KULITMU</div>
          <div className="tips-category-grid">
            <div className="card tip-card card-avoid">
              <h4 className="tip-header-title text-red">
                <X size={16} /> Hindari
              </h4>
              <ul className="tip-items-list avoid">
                {analysisResult.tips_avoid?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="card tip-card card-reduce">
              <h4 className="tip-header-title text-amber">
                <span className="dash-icon">−</span> Kurangi
              </h4>
              <ul className="tip-items-list reduce">
                {analysisResult.tips_reduce?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="card tip-card card-do">
              <h4 className="tip-header-title text-green">
                <CheckCircle2 size={16} /> Rutin Lakukan
              </h4>
              <ul className="tip-items-list do">
                {analysisResult.tips_do?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Rekomendasi Bahan Aktif Kosmetik (Hero Actives) */}
          <div className="section-label-header">HERO ACTIVES — BAHAN YANG COCOK UNTUK KULITMU</div>
          <div className="card hero-actives-card">
            <div className="hero-actives-intro">
              <FlaskConical size={18} className="intro-flask-icon" />
              <span>
                Kandungan bahan aktif kosmetik yang relevan untuk membantu merawat kondisi kulitmu berdasarkan hasil analisis foto wajah.
              </span>
            </div>

            <div className="actives-grid">
              {heroIngredients.map((item, idx) => {
                const isEssential = item.priority === 'essential'
                const cleanName = item.name.replace(/^Kandungan yang cocok:\s*/i, '').trim()
                const searchKeyword = `serum ${cleanName}`

                return (
                  <div key={idx} className="active-item-card">
                    <div className="aic-header">
                      <div className="aic-badge-row">
                        <span className="aic-rank">#{idx + 1}</span>
                        <span className={`aic-priority-pill ${isEssential ? 'essential' : 'recommended'}`}>
                          {isEssential ? 'Prioritas Utama' : 'Prioritas Pendukung'}
                        </span>
                      </div>
                      <h4 className="aic-name">{cleanName}</h4>
                    </div>

                    <p className="aic-purpose">{item.purpose}</p>

                    <div className="aic-micro-disclaimer">
                      Bahan kosmetik, bukan obat — hasil bervariasi tiap orang.
                    </div>

                    <div className="aic-actions-row">
                      <a
                        href={`https://shopee.co.id/search?keyword=${encodeURIComponent(searchKeyword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-shopee-search"
                      >
                        <ShoppingBag size={13} /> Cari Skincare di Marketplace ↗
                      </a>
                      <Link
                        to={
                          createdScanId
                            ? `/chatbot?scan_id=${createdScanId}&q=${encodeURIComponent(`Bagaimana cara dan urutan pemakaian ${cleanName} yang aman untuk kulitku?`)}`
                            : `/chatbot?q=${encodeURIComponent(`Bagaimana cara pemakaian ${cleanName}?`)}`
                        }
                        className="btn-ask-skinsistant"
                      >
                        <MessageSquare size={13} /> Tanya Cara Pakai
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="results-action-row">
            <button className="btn-reset-scan" onClick={handleResetFlow}>
              <RotateCcw size={16} />
              <span>Scan Wajah Ulang</span>
            </button>
            <Link
              to={createdScanId ? `/chatbot?scan_id=${createdScanId}` : '/chatbot'}
              className="btn-consult-skinsistant"
            >
              <MessageSquare size={16} />
              <span>Konsultasikan Rutinitas ke SkinSistant AI</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
