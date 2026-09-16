import React, { useState, useRef, useEffect, useMemo } from 'react'
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
  AlertTriangle,
  Zap,
  Edit3,
  RefreshCw,
} from 'lucide-react'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import { compressImageForAI } from '@/utils/imageQualityValidator'
import { detectHumanFace } from '@/utils/faceLandmarkDetector'

type ScanStage = 'upload' | 'scanning' | 'result'
type BadgeFilter = 'all' | 'aman' | 'hati' | 'hindari'

export interface LayeringCombo {
  pair: string
  benefit?: string
  warning?: string
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
  suitable_for_skin_types?: string[]
  layering_guide?: {
    best_combos?: LayeringCombo[]
    danger_combos?: LayeringCombo[]
  }
  key_ingredients?: IngredientItem[]
  ingredients_breakdown?: IngredientItem[]
}



export default function IngredientScanPage() {
  const { profile, activeSkinProfile, coinBalance } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage } = useInvokeAI()

  const userSkinType = activeSkinProfile?.skin_type ? activeSkinProfile.skin_type.toUpperCase() : 'BERMINYAK (OILY)'
  const userConcerns = activeSkinProfile?.skin_concerns?.length
    ? activeSkinProfile.skin_concerns.join(', ')
    : 'Pori-pori besar, Rawan Jerawat, Kemerahan'
  const skinTypeDesc = `${userSkinType.toLowerCase()}, ${userConcerns.toLowerCase()}`

  // Stage & Filter States (Photo-First Scan Experience)
  const [stage, setStage] = useState<ScanStage>('upload')
  const [filterBadge, setFilterBadge] = useState<BadgeFilter>('all')

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

  // Scanner Stage Animation Text & Progress Counter
  // useMemo because the array contains userSkinType interpolation — wrapping ensures
  // a stable reference so it can be safely included in useEffect dependency arrays.
  const scanStagesText = useMemo(() => [
    'Mengekstrak teks komposisi dari foto kemasan...',
    'Mengidentifikasi bahan aktif & sensitizer...',
    `Mencocokkan dengan profil kulitmu (${userSkinType})...`,
    'Menghitung Safety Score & Panduan Layering...',
  ], [userSkinType])
  const [scanTextIndex, setScanTextIndex] = useState(0)
  const [foundCount, setFoundCount] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const topResultRef = useRef<HTMLDivElement>(null)

  // Stage 2 Scanning Timers
  useEffect(() => {
    if (stage !== 'scanning') {
      setScanTextIndex(0)
      setFoundCount(0)
      return
    }

    const textInterval = setInterval(() => {
      setScanTextIndex((prev) => (prev < scanStagesText.length - 1 ? prev + 1 : prev))
    }, 1100)

    const countInterval = setInterval(() => {
      setFoundCount((prev) => (prev < 6 ? prev + 1 : prev))
    }, 600)

    return () => {
      clearInterval(textInterval)
      clearInterval(countInterval)
    }
  }, [stage, scanStagesText])

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
      const base64Data = await compressImageForAI(file)
      
      // Client-side Face Detection Gate: Cegah foto wajah manusia masuk ke Scan Ingredient
      try {
        const faceCheck = await detectHumanFace(base64Data)
        if (faceCheck.isHuman && faceCheck.faceCoverage > 8) {
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

    setErrorMsg(null)
    setStage('scanning')
    setIsAnalyzing(true)
    setIsEditingText(false)

    try {
      const input_context: Record<string, string> = {}
      if (customText) {
        input_context.ingredient_text = customText
      } else if (imageBase64) {
        input_context.image_base64 = imageBase64
      }

      const result = await invoke<IngredientAnalysisResult>({
        feature_slug: 'ingredient_scan',
        messages: [
          {
            role: 'user',
            content: customText
              ? `Teks komposisi skincare untuk dianalisis:\n"${customText}"\n\nAnalisis kecocokan untuk profil kulit Pengguna: Tipe ${userSkinType}, Masalah: ${userConcerns}. Lakukan evaluasi ilmiah per bahan.`
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
        setErrorMsg('Gagal menganalisis komposisi produk. Silakan periksa foto dan coba lagi.')
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
    setIsEditingText(false)
    setEditableText('')
  }

  // Normalization Helpers for Ingredient Breakdown
  const rawIngredientsList = scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []

  const displayIngredientsList: IngredientItem[] =
    rawIngredientsList.length > 0
      ? rawIngredientsList.map((item) => {
          const badgeType =
            item.badge === 'aman' || item.badge === 'safe'
              ? 'aman'
              : item.badge === 'hindari' || item.badge === 'avoid'
              ? 'hindari'
              : 'hati'
          const badgeLabelText =
            item.badgeLabel ||
            (badgeType === 'aman' ? 'Aman' : badgeType === 'hindari' ? 'Hindari' : 'Perlu diperhatikan')

          return {
            name: item.name,
            badge: badgeType,
            badgeLabel: badgeLabelText,
            function: item.function || item.notes || 'Bahan aktif pendukung formulasi skincare.',
            comedogenic_score: item.comedogenic_score,
            skinType: item.skinType || 'Semua jenis kulit, terutama berminyak & kombinasi',
            interaction:
              item.interaction || 'Aman dikombinasikan dengan rutinitas perawatan harian Anda.',
            personal: item.personal || {
              ok: badgeType === 'aman',
              text:
                badgeType === 'aman'
                  ? `Cocok untuk profil kulitmu (${skinTypeDesc}) — membantu menjaga kelembaban kulit.`
                  : `Waspada — bahan ini perlu diperhatikan untuk tipe kulitmu (${skinTypeDesc}).`,
            },
          }
        })
      : []

  // Counts & Filter logic
  const safeCount = displayIngredientsList.filter((i) => i.badge === 'aman').length
  const cautionCount = displayIngredientsList.filter((i) => i.badge === 'hati').length
  const avoidCount = displayIngredientsList.filter((i) => i.badge === 'hindari').length
  const totalCount = displayIngredientsList.length

  const filteredIngredients = displayIngredientsList.filter((item) => {
    if (filterBadge === 'all') return true
    return item.badge === filterBadge
  })

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

          {/* STAGE 2: ANIMATED SCANNER */}
          {stage === 'scanning' && (
            <div className="stage-card scanning-card">
              <div className="scan-frame-viewport">
                {previewUrl ? (
                  <img src={previewUrl} alt="Label Komposisi" className="scan-img-preview" />
                ) : (
                  <div className="mock-label-box">📋 Foto Label Komposisi Produk</div>
                )}
              </div>

              <div className="scan-status-row">
                <div className="bouncing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="shimmer-scan-text">{scanStagesText[scanTextIndex]}</span>
              </div>

              <p className="scan-counter-text">Bahan terdeteksi: {foundCount} komposisi</p>
            </div>
          )}

          {/* STAGE 3: RESULTS & QUICK-CORRECTION */}
          {stage === 'result' && (
            <div className="results-stack">
              {/* Score Summary Box */}
              <div className="result-summary-card">
                <div className="score-ring-avatar">
                  <span className="sr-val">{scanResult?.safety_score || Math.round((safeCount / (totalCount || 1)) * 100)}</span>
                  <span className="sr-unit">Skor Keamanan</span>
                </div>
                <div className="summary-meta">
                  <div className="product-detected-pill">
                    <Sparkles size={13} /> {scanResult?.product_name || 'Formula Skincare Terdeteksi'}
                  </div>
                  <h3 className="summary-title">
                    {safeCount === totalCount
                      ? '100% Cocok & Aman untuk Kulitmu'
                      : 'Sebagian Besar Cocok untuk Kulitmu'}
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

              {/* Partial Read Warning Banner (Jika ada teks pudar) */}
              {scanResult?.partial_read_warning && (
                <div className="partial-warning-box">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  <span>
                    <strong>Catatan Label:</strong> {scanResult.partial_read_warning}
                  </span>
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
                      💡 Perbaiki jika ada kata/huruf yang typo atau tambahkan bahan yang terpotong pada kemasan botol melengkung:
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

              {/* Layering Guide Box (Do & Don't Combos) */}
              {scanResult?.layering_guide && (
                ((scanResult.layering_guide.best_combos && scanResult.layering_guide.best_combos.length > 0) ||
                 (scanResult.layering_guide.danger_combos && scanResult.layering_guide.danger_combos.length > 0)) && (
                  <div className="layering-guide-card">
                    <h4 className="layering-title">
                      <Zap size={16} className="text-amber-500" /> Panduan Layering & Kombinasi Skincare
                    </h4>
                    <div className="layering-grid">
                      {scanResult.layering_guide.best_combos && scanResult.layering_guide.best_combos.length > 0 && (
                        <div className="layering-box best-box">
                          <div className="box-header text-emerald-700">
                            <ShieldCheck size={16} /> <strong>Best Combos (Aman & Efektif):</strong>
                          </div>
                          <ul className="combos-list">
                            {scanResult.layering_guide.best_combos.map((item, bIdx) => (
                              <li key={bIdx}>
                                <b>{item.pair}:</b> {item.benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scanResult.layering_guide.danger_combos && scanResult.layering_guide.danger_combos.length > 0 && (
                        <div className="layering-box danger-box">
                          <div className="box-header text-rose-700">
                            <AlertTriangle size={16} /> <strong>Danger Combos (Hindari Bersamaan):</strong>
                          </div>
                          <ul className="combos-list">
                            {scanResult.layering_guide.danger_combos.map((item, dIdx) => (
                              <li key={dIdx}>
                                <b>{item.pair}:</b> {item.warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Predictive Filter Bar */}
              <div className="filter-bar">
                <div className="filter-label-group">
                  <Filter size={14} />
                  <span>Filter Bahan:</span>
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
              </div>

              {/* Ingredient Breakdown List */}
              <div className="ingredients-cards-list">
                {filteredIngredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="ingredient-card-item"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="card-top-header">
                      <h4 className="ing-item-name">{ing.name}</h4>
                      <span className={`ing-status-badge badge-${ing.badge}`}>
                        {ing.badgeLabel || (ing.badge === 'aman' ? 'Aman' : ing.badge === 'hindari' ? 'Hindari' : 'Perlu diperhatikan')}
                      </span>
                    </div>

                    <p className="ing-item-func">{ing.function}</p>

                    <div className="meta-info-row">
                      <b className="meta-label">Cocok untuk:</b>
                      <span className="meta-value">{ing.skinType}</span>
                    </div>

                    <div className="meta-info-row">
                      <b className="meta-label">Interaksi:</b>
                      <span className="meta-value">{ing.interaction}</span>
                    </div>

                    {/* Personal Skin Flag */}
                    {ing.personal && (
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
                ))}
              </div>

              {/* Reset Button */}
              <button className="btn-reset-scan" onClick={handleResetFlow}>
                Scan Produk Skincare Lain
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Side Summary & Active Skin Profile Panel */}
        <div className="side-summary-col">
          {/* Active Skin Profile Context Card */}
          <div className="side-card profile-context-card">
            <div className="side-card-header">
              <div className="side-icon-box teal">
                <User size={18} />
              </div>
              <h3 className="side-card-title">Profil Kulit Aktif Anda</h3>
            </div>
            <div className="profile-badge-group">
              <span className="profile-pill-primary">{userSkinType}</span>
              <span className="profile-pill-secondary">RAWAN JERAWAT</span>
            </div>
            <p className="profile-desc-text">
              Analisis keamanan bahan kosmetik secara otomatis disesuaikan dengan keluhan T-zone & sensitivitas kulit Anda.
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

        /* SCANNING CARD & ANIMATION */
        .scanning-card {
          align-items: center;
          padding: 32px 20px;
        }

        .scan-frame-viewport {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          height: 220px;
          width: 100%;
          max-width: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scan-img-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.65;
        }

        .scan-frame-viewport::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          box-shadow: 0 0 14px 4px rgba(16, 185, 129, 0.8);
          animation: scanline 2.1s ease-in-out infinite;
        }

        @keyframes scanline {
          0% { top: 6%; }
          50% { top: 92%; }
          100% { top: 6%; }
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
          gap: 10px;
        }

        .bouncing-dots {
          display: flex;
          gap: 4px;
        }

        .bouncing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0f6784;
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
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        .scan-counter-text {
          font-size: 0.78125rem;
          color: #64748b;
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
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .score-ring-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(2, 132, 199, 0.25);
        }

        .sr-val {
          font-size: 1.45rem;
          font-weight: 800;
          line-height: 1;
        }

        .sr-unit {
          font-size: 0.6rem;
          font-weight: 600;
          opacity: 0.9;
          margin-top: 2px;
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
          padding: 12px 14px;
          font-size: 0.8125rem;
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
          margin-bottom: 8px;
          font-size: 0.8125rem;
        }

        .combos-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #334155;
          line-height: 1.45;
        }

        .combos-list li {
          position: relative;
          padding-left: 14px;
        }

        .combos-list li::before {
          content: '•';
          position: absolute;
          left: 2px;
          color: #64748b;
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

        /* PREDICTIVE FILTER BAR */
        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 14px;
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
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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

        .btn-reset-scan {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f6784;
          border-radius: 12px;
          padding: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-reset-scan:hover {
          background: #f8fafc;
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
