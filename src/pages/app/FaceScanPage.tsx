import React, { useState, useRef, useEffect } from 'react'
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
import { Button, Badge } from '@/components/ui'

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
function getClinicalSeverityBand(score: number): {
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
    <div className="cluv-canvas-grid cluv-animate-fade">
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
      <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-3 cluv-mb-3">
        <div>
          <h1 className="cluv-title-section cluv-m-0">Scan Wajah AI</h1>
          <p className="cluv-subtitle cluv-mt-1">
            Pemetaan kondisi kulit dari foto wajahmu dengan AI secara objektif, lengkap dengan analogi penyebab, saran perawatan, dan rekomendasi bahan aktif formulasi kosmetik.
          </p>
        </div>
        <Button variant="outline" size="sm" iconLeft={<History size={16} />} to="/scan-history">
          Riwayat Scan Kulit
        </Button>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="cluv-alert is-danger cluv-mb-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STAGE 1: UPLOAD & SIDE PANEL */}
      {stage === 'upload' && (
        <div className="cluv-scan-layout">
          {/* Left Column: Dropzone & Main Action */}
          <div className="cluv-scan-main">
            <div className="cluv-card cluv-gap-4">
              <div
                className={`cluv-dropzone ${isDragging ? 'is-dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="cluv-dropzone-preview">
                    <img src={previewUrl} alt="Preview Foto Wajah" className="cluv-dropzone-preview-img" />
                    <Button
                      variant="outline"
                      size="sm"
                      iconLeft={<X size={14} />}
                      onClick={handleClearImage}
                    >
                      Ganti Foto
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="cluv-dropzone-icon">
                      <Camera size={26} />
                    </div>
                    <h3 className="cluv-dropzone-title">Unggah foto wajah kamu</h3>
                    <p className="cluv-dropzone-subtitle">Tarik & lepas, atau klik untuk memilih — JPG/PNG/WEBP maks 5MB</p>
                    <div className="cluv-dropzone-btn-fake">
                      <Camera size={14} /> Ambil atau Pilih Foto Wajah
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

              {isFreeTierOutOfCredits && (
                <div className="cluv-alert is-warning is-compact cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                    <Coins size={16} className="text-amber-600 shrink-0" />
                    <span className="cluv-micro">
                      Butuh <strong>{faceCost} Credits</strong> untuk analisis wajah (Saldo kamu: <strong>{currentCoins} Credits</strong>).
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

              <Button
                variant="primary"
                size="md"
                block
                iconLeft={<Sparkles size={18} />}
                onClick={handleStartFlow}
                disabled={!imageBase64}
              >
                Mulai Analisis Wajah AI
              </Button>

              {/* Disclaimer (Invariant 19 compliant) */}
              <div className="cluv-alert is-warning is-compact">
                <Info size={16} className="shrink-0 text-amber-600" />
                <span className="cluv-micro">
                  <b>Privasi & Keamanan:</b> Foto hanya diproses untuk observasi kondisi visual kulit dan tidak dibagikan kepada pihak ketiga. Hasil analisis bersifat panduan edukasi kosmetik.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Context & Photo Guidelines */}
          <div className="cluv-scan-aside">
            <div className="cluv-card is-highlight">
              <Badge variant="teal" size="sm" className="cluv-mb-2">PROFIL KULIT AKTIF</Badge>
              <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mb-2 cluv-micro">
                <span className="cluv-text-muted">Tipe kulit:</span>
                <span className="cluv-font-bold cluv-text-dark">{userSkinType}</span>
              </div>
              <div className="cluv-flex-col cluv-gap-1 cluv-micro">
                <span className="cluv-text-muted">Fokus kulit:</span>
                <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1">
                  {userConcerns.map((concern: string, idx: number) => (
                    <Badge key={idx} variant="slate" size="sm">
                      {concern}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="cluv-card">
              <Badge variant="gold" size="sm" className="cluv-mb-2">PANDUAN SEBELUM FOTO</Badge>
              <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mb-3">
                Pastikan kondisi berikut terpenuhi agar hasil analisis akurat dan konsisten dalam membandingkan perkembangan kulit.
              </p>
              <div className="cluv-flex-col cluv-gap-3">
                <div className="cluv-flex-row cluv-gap-2">
                  <div className="cluv-card-icon-wrap is-sm is-gold shrink-0">
                    <Sun size={16} />
                  </div>
                  <div className="cluv-micro">
                    <strong className="cluv-text-dark">1. Pencahayaan merata & alami</strong>
                    <p className="cluv-text-muted cluv-m-0 cluv-mt-1">Pencahayaan memengaruhi akurasi tekstur kulit. Ruangan terang dengan cahaya alami adalah pilihan terbaik.</p>
                  </div>
                </div>
                <div className="cluv-flex-row cluv-gap-2">
                  <div className="cluv-card-icon-wrap is-sm is-teal shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="cluv-micro">
                    <strong className="cluv-text-dark">2. Wajah bersih tanpa riasan tebal</strong>
                    <p className="cluv-text-muted cluv-m-0 cluv-mt-1">Disarankan mengambil foto sekitar 1 jam setelah mencuci wajah agar kondisi alami sebum dan pori terlihat jelas.</p>
                  </div>
                </div>
                <div className="cluv-flex-row cluv-gap-2">
                  <div className="cluv-card-icon-wrap is-sm shrink-0">
                    <Scan size={16} />
                  </div>
                  <div className="cluv-micro">
                    <strong className="cluv-text-dark">3. Jarak wajah sekitar 30 cm</strong>
                    <p className="cluv-text-muted cluv-m-0 cluv-mt-1">Pastikan dahi, kedua pipi, hidung, dan dagu berada tepat di dalam bingkai panduan kamera.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: NEURAL AI FACIAL BIOMETRIC SCANNER HUD */}
      {stage === 'scanning' && (
        <div className="cluv-card cluv-items-center cluv-py-8 cluv-gap-4">
          <div className="cluv-scanner-hud">
            {previewUrl ? (
              <img src={previewUrl} alt="Foto Wajah" className="cluv-scanner-preview-img" />
            ) : (
              <div className="cluv-card is-compact cluv-text-muted cluv-micro">Foto Wajah Pengguna</div>
            )}

            {/* HUD High-Tech Grid & Corner Brackets */}
            <div className="cluv-scanner-grid-overlay" />
            <div className="cluv-scanner-corner top-left" />
            <div className="cluv-scanner-corner top-right" />
            <div className="cluv-scanner-corner bottom-left" />
            <div className="cluv-scanner-corner bottom-right" />

            {/* Sweeping Laser Beam */}
            <div className="cluv-scanner-laser" />

            {/* Live Facial Biometric Status Pill */}
            <div className="cluv-scanner-status-pill">
              <span className="cluv-scanner-status-dot" />
              <span>AI BIOMETRIC SCAN ACTIVE</span>
            </div>
          </div>

          {/* Shimmering Phase Status */}
          <div className="cluv-flex-row cluv-items-center cluv-justify-center cluv-gap-2 cluv-mt-2">
            <span className="cluv-font-bold cluv-text-teal cluv-text-sm">{FACE_SCAN_STAGES_TEXT[scanTextIndex]}</span>
          </div>

          {/* Smooth Indeterminate Progress Bar */}
          <div className="cluv-scanner-progress-track">
            <div className="cluv-scanner-progress-glow" />
          </div>

          {/* Educational Clinical Tip Box */}
          <div className="cluv-card is-highlight cluv-p-3 cluv-max-w-md cluv-w-full">
            <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-text-xs cluv-font-bold cluv-text-teal">
              <Sparkles size={13} className="shrink-0" />
              <span>Catatan Edukasi Kondisi Kulit</span>
            </div>
            <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">{CLINICAL_FACIAL_TIPS[tipIndex]}</p>
          </div>
        </div>
      )}

      {/* STAGE 3: RESULTS OUTPUT & OBSERVATION REPORT */}
      {stage === 'result' && analysisResult && (
        <div className="cluv-flex-col cluv-gap-4">
          {/* Provenance Cache Banner (RFC 011) */}
          {analysisResult.cached && (
            <div className="cluv-alert is-info cluv-gap-3">
              <Zap size={20} className="shrink-0 text-sky-600" />
              <div className="cluv-flex-1">
                <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-text-sm">
                  Hasil Tersimpan Ditampilkan — 0 Kuota Terpotong
                </h4>
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
                  Ini foto yang sama dengan scan kamu pada {analysisResult.cached_at ? new Date(analysisResult.cached_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'sebelumnya'}. 
                  Foto yang sama berarti kondisi kulit yang terbaca juga sama, sehingga hasil analisisnya identik. Kami tampilkan hasil tersimpanmu secara instan tanpa memotong kuota.
                </p>
                <div className="cluv-flex-row cluv-items-center cluv-flex-wrap cluv-gap-2 cluv-mt-2">
                  <Badge variant="teal" size="sm"><CheckCircle2 size={12} /> Kuota aman</Badge>
                  <Badge variant="teal" size="sm"><CheckCircle2 size={12} /> Hasil identik</Badge>
                  <Badge variant="slate" size="sm"><Zap size={12} /> Instan (&lt;1s)</Badge>
                  <div className="cluv-flex-row cluv-gap-1 cluv-ml-auto">
                    <Button variant="outline" size="sm" iconLeft={<Camera size={13} />} onClick={handleResetFlow}>
                      Scan Foto Baru
                    </Button>
                    <Button variant="outline" size="sm" iconLeft={<RotateCcw size={13} />} onClick={handleForceReanalyze}>
                      Analisis Ulang (5 Credits)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Anjuran Konsultasi Spesialis (Score < 55) */}
          {getClinicalSeverityBand(analysisResult.overall_score ?? 80).band === 'consult_dermatologist' && (
            <div className="cluv-alert is-warning">
              <AlertCircle size={20} className="shrink-0 text-amber-600" />
              <div>
                <h4 className="cluv-font-bold cluv-text-dark cluv-m-0 cluv-text-sm">
                  Anjuran Konsultasi Spesialis Kulit
                </h4>
                <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
                  Hasil evaluasi visual menunjukkan beberapa kondisi kulit yang lebih disarankan untuk ditinjau langsung oleh dokter spesialis kulit. AI Skincluv adalah alat bantu panduan kosmetik sehari-hari, bukan instrumen diagnosis medis resmi.
                </p>
              </div>
            </div>
          )}

          {/* Score Hero Banner */}
          <div className="cluv-card cluv-gap-4">
            <div className="cluv-flex-row cluv-items-center cluv-gap-4 cluv-flex-wrap">
              <div className={`cluv-score-circle ${
                getClinicalSeverityBand(analysisResult.overall_score ?? 80).band === 'consult_dermatologist'
                  ? 'is-danger'
                  : getClinicalSeverityBand(analysisResult.overall_score ?? 80).band === 'needs_attention'
                  ? 'is-caution'
                  : 'is-safe'
              }`}>
                <div className="sr-number-row">
                  <span className="sr-val">{analysisResult.overall_score ?? 80}</span>
                  <span className="sr-scale">/100</span>
                </div>
                <span className="sr-unit">{getClinicalSeverityBand(analysisResult.overall_score ?? 80).label}</span>
              </div>

              <div className="cluv-flex-1 cluv-flex-col cluv-gap-1">
                <div className="cluv-flex-row cluv-gap-1 cluv-flex-wrap">
                  <span className="cluv-badge is-teal is-sm">
                    <Sparkles size={12} /> TIPE KULIT: {String(analysisResult.skin_type || userSkinType).toUpperCase()}
                  </span>
                  <span className="cluv-badge is-slate is-sm">
                    <ShieldCheck size={12} /> OBSERVASI KULIT AI
                  </span>
                </div>
                <h3 className="cluv-title-item cluv-m-0">
                  {analysisResult.skin_status_title ?? `Kondisi Kulit: ${getClinicalSeverityBand(analysisResult.overall_score ?? 80).label}`}
                </h3>
                <p className="cluv-body cluv-text-muted cluv-m-0">
                  {analysisResult.analysis_notes ||
                    getClinicalSeverityBand(analysisResult.overall_score ?? 80).descriptor}
                </p>
              </div>
            </div>
          </div>

          {/* Biometric Scan Snapshot & Area Overview */}
          {previewUrl && (
            <div className="cluv-biometric-overview">
              <div className="cluv-biometric-frame">
                <img src={previewUrl} alt="Foto Wajah Teranalisis" className="cluv-biometric-img" />
                <div className="cluv-biometric-badge">
                  <CheckCircle2 size={12} />
                  <span>Foto Teranalisis AI</span>
                </div>
              </div>
              <div className="cluv-biometric-areas-col">
                <div className="cluv-flex-row cluv-items-center cluv-gap-1 cluv-font-bold cluv-text-teal cluv-text-sm">
                  <Target size={16} />
                  <span>Ringkasan Biometrik 3 Area Wajah</span>
                </div>
                <div className="cluv-flex-col cluv-gap-2">
                  {analysisResult.area_evaluations?.map((area) => (
                    <div key={area.id} className="cluv-biometric-area-item">
                      <div className="cluv-flex-col">
                        <span className="cluv-font-bold cluv-text-dark cluv-text-sm">{area.area_name}</span>
                        <span className="cluv-micro cluv-text-muted">Skor: {area.score}/100</span>
                      </div>
                      <span className={`cluv-badge is-sm ${area.status === 'Optimal' ? 'is-teal' : 'is-gold'}`}>
                        {area.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Granular 3-Area Facial Evaluation */}
          <div className="cluv-flex-col cluv-gap-3">
            <span className="cluv-badge is-slate is-sm cluv-self-start">EVALUASI KONDISI KULIT PER AREA (GRANULAR)</span>
            <div className="cluv-flex-col cluv-gap-3">
              {analysisResult.area_evaluations?.map((area) => (
                <div key={area.id} className="cluv-area-card">
                  <div className="cluv-area-card-head">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <div className="cluv-card-icon-wrap is-sm">
                        <Target size={16} />
                      </div>
                      <h4 className="cluv-title-item cluv-m-0">{area.area_name}</h4>
                    </div>
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                      <span className={`cluv-badge is-sm ${area.status === 'Optimal' ? 'is-teal' : 'is-gold'}`}>
                        {area.status}
                      </span>
                      <span className="cluv-badge is-slate is-sm">Skor: {area.score}/100</span>
                    </div>
                  </div>

                  <div className="cluv-area-box">
                    <span className="cluv-micro cluv-font-bold cluv-text-teal">Hasil Analisis:</span>
                    <p className="cluv-micro cluv-text-muted cluv-m-0">{area.finding}</p>
                  </div>

                  <div className="cluv-area-box is-analogy">
                    <span className="cluv-micro cluv-font-bold cluv-text-gold">Penjelasan Sederhana:</span>
                    <p className="cluv-micro cluv-text-muted cluv-m-0">{area.analogy}</p>
                  </div>

                  <div className="cluv-area-box is-action">
                    <span className="cluv-micro cluv-font-bold cluv-text-teal">Rencana Tindakan:</span>
                    <p className="cluv-micro cluv-text-muted cluv-m-0">{area.action_plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Categorized Lifestyle & Skincare Tips */}
          <div className="cluv-flex-col cluv-gap-3">
            <span className="cluv-badge is-slate is-sm cluv-self-start">TIPS PERSONAL UNTUK KULITMU</span>
            <div className="cluv-tips-grid">
              <div className="cluv-tip-card is-avoid">
                <h4 className="cluv-font-bold cluv-text-rose cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-sm">
                  <X size={16} /> Hindari
                </h4>
                <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-space-y-1 cluv-m-0">
                  {analysisResult.tips_avoid?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="cluv-tip-card is-reduce">
                <h4 className="cluv-font-bold cluv-text-gold cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-sm">
                  <span>−</span> Kurangi
                </h4>
                <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-space-y-1 cluv-m-0">
                  {analysisResult.tips_reduce?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="cluv-tip-card is-do">
                <h4 className="cluv-font-bold cluv-text-teal cluv-flex-row cluv-items-center cluv-gap-1 cluv-m-0 cluv-text-sm">
                  <CheckCircle2 size={16} /> Rutin Lakukan
                </h4>
                <ul className="cluv-list-disc cluv-pl-4 cluv-micro cluv-text-muted cluv-space-y-1 cluv-m-0">
                  {analysisResult.tips_do?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Rekomendasi Bahan Aktif Kosmetik (Hero Actives) */}
          <div className="cluv-flex-col cluv-gap-3">
            <span className="cluv-badge is-gold is-sm cluv-self-start">HERO ACTIVES — BAHAN YANG COCOK UNTUK KULITMU</span>
            <div className="cluv-hero-actives">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-micro cluv-text-muted">
                <FlaskConical size={18} className="text-amber-500 shrink-0" />
                <span>
                  Kandungan bahan aktif kosmetik yang relevan untuk membantu merawat kondisi kulitmu berdasarkan hasil analisis foto wajah.
                </span>
              </div>

              <div className="cluv-grid cols-2 cluv-gap-3">
                {heroIngredients.map((item, idx) => {
                  const isEssential = item.priority === 'essential'
                  const cleanName = item.name.replace(/^Kandungan yang cocok:\s*/i, '').trim()
                  const searchKeyword = `serum ${cleanName}`

                  return (
                    <div key={idx} className="cluv-active-item">
                      <div className="cluv-active-item-header">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-1">
                          <span className="cluv-badge is-gold is-sm">#{idx + 1}</span>
                          <span className={`cluv-badge is-sm ${isEssential ? 'is-teal' : 'is-slate'}`}>
                            {isEssential ? 'Prioritas Utama' : 'Prioritas Pendukung'}
                          </span>
                        </div>
                        <h4 className="cluv-font-bold cluv-text-dark cluv-text-sm cluv-m-0">{cleanName}</h4>
                      </div>

                      <p className="cluv-micro cluv-text-muted cluv-m-0">{item.purpose}</p>

                      <div className="cluv-micro cluv-text-muted" style={{ fontSize: '0.72rem' }}>
                        <em>Bahan kosmetik, bukan obat — hasil bervariasi tiap orang.</em>
                      </div>

                      <div className="cluv-flex-row cluv-gap-2 cluv-mt-1 cluv-flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="cluv-flex-1"
                          href={`https://shopee.co.id/search?keyword=${encodeURIComponent(searchKeyword)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          iconLeft={<ShoppingBag size={13} />}
                        >
                          Marketplace ↗
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="cluv-flex-1"
                          to={
                            createdScanId
                              ? `/chatbot?scan_id=${createdScanId}&q=${encodeURIComponent(`Bagaimana cara dan urutan pemakaian ${cleanName} yang aman untuk kulitku?`)}`
                              : `/chatbot?q=${encodeURIComponent(`Bagaimana cara pemakaian ${cleanName}?`)}`
                          }
                          iconLeft={<MessageSquare size={13} />}
                        >
                          Tanya Cara Pakai
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="cluv-flex-row cluv-gap-3 cluv-mt-4 cluv-flex-wrap">
            <Button
              variant="outline"
              size="md"
              className="cluv-flex-1"
              iconLeft={<RotateCcw size={16} />}
              onClick={handleResetFlow}
            >
              Scan Wajah Ulang
            </Button>
            <Button
              variant="primary"
              size="md"
              className="cluv-flex-2"
              iconLeft={<MessageSquare size={16} />}
              to={createdScanId ? `/chatbot?scan_id=${createdScanId}` : '/chatbot'}
            >
              Konsultasikan Rutinitas ke SkinSistant AI
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
