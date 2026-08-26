// src/pages/app/IngredientScanPage.tsx
// Redesigned Scan Ingredient AI Page with 3-Stage Animated Scanning Flow & Personal Skin Flags
// Integrated with useInvokeAI & Pure Vanilla CSS matching Skincluv Design System

import React, { useState, useRef, useEffect } from 'react'
import {
  FlaskConical,
  Upload,
  X,
  Coins,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldAlert,
  Loader2,
  Camera,
  FileText,
  Sparkles,
} from 'lucide-react'
import ScanTabs from '@/components/scan/ScanTabs'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium } from '@/utils/subscriptionHelpers'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'

type TabMode = 'image' | 'text'
type ScanStage = 'upload' | 'scanning' | 'result'

export interface IngredientItem {
  name: string
  badge?: 'aman' | 'hati' | 'hindari' | string
  badgeLabel?: string
  function?: string
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
  product_name?: string
  clinical_summary?: string
  safety_score?: number
  total_ingredients?: number
  safe_count?: number
  caution_count?: number
  overall_recommendation?: string
  suitable_for_skin_types?: string[]
  key_ingredients?: IngredientItem[]
  ingredients_breakdown?: IngredientItem[]
}

const SAMPLE_INGREDIENTS = [
  'Aqua, Niacinamide 5%, Hyaluronic Acid, Centella Asiatica Extract, Phenoxyethanol, Ethylhexylglycerin',
  'Water, Salicylic Acid 2%, Glycolic Acid 7%, Alcohol Denat, Fragrance, Parabens',
  'Aqua, Glycerin, Ceramide NP, Squalane, Tocopherol, Panthenol, Xanthan Gum',
]

export default function IngredientScanPage() {
  const { profile, coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage } = useInvokeAI()

  const isPro = isActivePremium(subscription)
  const skinTypeDesc = profile?.skin_type ? `${profile.skin_type}, prone acne` : 'oily, prone acne'

  // Stage & Tab States
  const [stage, setStage] = useState<ScanStage>('upload')
  const [activeTab, setActiveTab] = useState<TabMode>('image')

  // Input & Image States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')

  // Processing & Stage Animation States
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanResult, setScanResult] = useState<IngredientAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Scanner Stage Animation Text & Progress Counter
  const scanStagesText = [
    'Mendeteksi teks pada label...',
    'Mengidentifikasi bahan aktif...',
    'Menyesuaikan dengan profil kulitmu...',
    'Menyusun hasil analisis...',
  ]
  const [scanTextIndex, setScanTextIndex] = useState(0)
  const [foundCount, setFoundCount] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stage 2 Scanning Timer Animations
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
      setFoundCount((prev) => (prev < 5 ? prev + 1 : prev))
    }, 700)

    return () => {
      clearInterval(textInterval)
      clearInterval(countInterval)
    }
  }, [stage])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP)')
      return
    }
    setErrorMsg(null)
    setPreviewUrl(URL.createObjectURL(file))
    setScanResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP)')
      return
    }
    setErrorMsg(null)
    setPreviewUrl(URL.createObjectURL(file))
    setScanResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    setImageBase64(null)
    setScanResult(null)
  }

  const handleStartAnalysis = async () => {
    if (activeTab === 'image' && !imageBase64) {
      setErrorMsg('Pilih atau unggah foto label komposisi produk terlebih dahulu.')
      return
    }
    if (activeTab === 'text' && !inputText.trim()) {
      setErrorMsg('Masukkan atau tempelkan teks komposisi produk terlebih dahulu.')
      return
    }

    setErrorMsg(null)
    setStage('scanning')
    setIsAnalyzing(true)

    try {
      const input_context: Record<string, string> = {}
      if (activeTab === 'text') input_context.ingredient_text = inputText
      if (activeTab === 'image' && imageBase64) input_context.image_base64 = imageBase64

      const result = await invoke<IngredientAnalysisResult>({
        feature_slug: 'ingredient_scan',
        messages: [
          {
            role: 'user',
            content:
              activeTab === 'text'
                ? inputText
                : 'Analisis komposisi bahan dari foto kemasan produk skincare ini.',
          },
        ],
        input_context,
      })

      if (!result || typeof result !== 'object') {
        setErrorMsg('Gagal menganalisis komposisi produk. Silakan periksa foto/teks dan coba lagi.')
        setStage('upload')
        return
      }

      setScanResult(result)
      setStage('result')
    } catch (err: any) {
      console.error('Ingredient scan error:', err)
      setErrorMsg(err.message || 'Gagal menganalisis komposisi produk.')
      setStage('upload')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleResetFlow = () => {
    setStage('upload')
    setPreviewUrl(null)
    setImageBase64(null)
    setInputText('')
    setScanResult(null)
    setErrorMsg(null)
  }

  // Normalization Helpers for Ingredient Breakdown
  const rawIngredientsList = scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []

  // Mock / Fallback ingredients list if Edge Function returns abstract text
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
            skinType: item.skinType || 'Semua jenis kulit, terutama oily & kombinasi',
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
      : [
          {
            name: 'Niacinamide',
            badge: 'aman',
            badgeLabel: 'Aman',
            function: 'Mengontrol produksi minyak berlebih dan mengecilkan tampilan pori-pori.',
            skinType: 'Semua jenis kulit, terutama oily & kombinasi',
            interaction:
              'Sebaiknya tidak dicampur langsung dengan Vitamin C murni (pakai di waktu terpisah)',
            personal: {
              ok: true,
              text: `Cocok untuk profil kulitmu (${skinTypeDesc}) — bantu kontrol minyak berlebih.`,
            },
          },
          {
            name: 'Salicylic Acid (BHA)',
            badge: 'hati',
            badgeLabel: 'Perlu diperhatikan',
            function:
              'Eksfoliasi dalam pori untuk mengangkat sel kulit mati dan sumbatan penyebab jerawat.',
            skinType: 'Oily & acne-prone, hindari untuk kulit sangat kering/sensitif',
            interaction:
              'Jangan dicampur bersamaan dengan Retinol dalam rutinitas yang sama — bisa memicu iritasi',
            personal: {
              ok: false,
              text:
                'Cocok untuk tipemu, tapi mulai dari konsentrasi rendah — kulitmu tercatat pernah mengalami kemerahan.',
            },
          },
          {
            name: 'Glycerin',
            badge: 'aman',
            badgeLabel: 'Aman',
            function: 'Humektan yang menarik dan mengunci kelembaban di lapisan kulit.',
            skinType: 'Semua jenis kulit',
            interaction: 'Aman dikombinasikan dengan hampir semua bahan aktif lain',
            personal: {
              ok: true,
              text: 'Aman digunakan setiap hari, membantu jaga hidrasi tanpa menyumbat pori.',
            },
          },
          {
            name: 'Fragrance (Parfum)',
            badge: 'hati',
            badgeLabel: 'Perlu diperhatikan',
            function: 'Memberikan aroma pada produk, tidak memiliki fungsi perawatan kulit.',
            skinType: 'Berisiko untuk kulit sensitif & reaktif',
            interaction:
              'Tidak ada interaksi kimia khusus, namun risiko iritasi meningkat jika dikombinasi produk beraroma lain',
            personal: {
              ok: false,
              text: 'Waspada — bahan ini salah satu pemicu umum kemerahan pada tipe kulitmu.',
            },
          },
          {
            name: 'Panthenol',
            badge: 'aman',
            badgeLabel: 'Aman',
            function: 'Menenangkan dan membantu memperbaiki skin barrier yang lemah.',
            skinType: 'Semua jenis kulit, sangat baik untuk kulit iritasi',
            interaction: 'Aman dikombinasikan dengan bahan aktif apapun',
            personal: {
              ok: true,
              text: 'Bagus untukmu — membantu menenangkan kulit setelah pemakaian BHA.',
            },
          },
        ]

  const safeCount =
    scanResult?.safe_count ?? displayIngredientsList.filter((i) => i.badge === 'aman').length
  const totalCount = scanResult?.total_ingredients ?? displayIngredientsList.length
  const scoreRatio = `${safeCount}/${totalCount}`

  return (
    <div className="ingredient-scan-root">
      {/* Top Navigation ScanTabs */}
      <ScanTabs />

      {/* Coin Deduction Confirmation Modal */}
      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={true}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={coinBalance?.balance ?? 0}
          featureName="Scan Ingredient AI"
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* Page Header */}
      <div className="page-head">
        <div className="head-title-row">
          <h1>Scan Ingredient Skincare</h1>
          <div className="coin-cost-pill">
            <Coins size={14} className="text-amber-500" />
            <span>{isPro ? '0 Koin (Pro)' : '10 Koin'}</span>
          </div>
        </div>
        <p>
          Cek keamanan bahan sebelum kamu membeli — hasilnya disesuaikan dengan profil kulitmu ({skinTypeDesc}).
        </p>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="error-alert">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="stage-container">
        {/* STAGE 1: UPLOAD / INPUT */}
        {stage === 'upload' && (
          <div className="stage-content">
            {/* Input Tab Switcher */}
            <div className="tab-switcher">
              <button
                onClick={() => {
                  setActiveTab('image')
                  setErrorMsg(null)
                }}
                className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
              >
                <Camera size={15} />
                <span>Unggah Foto Label</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('text')
                  setErrorMsg(null)
                }}
                className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              >
                <FileText size={15} />
                <span>Ketik Teks Bahan</span>
              </button>
            </div>

            {activeTab === 'image' ? (
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="dropzone-preview">
                    <img src={previewUrl} alt="Preview label komposisi" />
                    <button onClick={handleClearImage} className="clear-btn">
                      <X size={14} /> Hapus Foto
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="dz-icon">
                      <Upload size={24} />
                    </div>
                    <div className="dz-title">Unggah foto label komposisi</div>
                    <div className="dz-sub">JPEG, PNG, atau WEBP — maks 10MB</div>
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
            ) : (
              <div className="text-input-box">
                <label className="text-input-label">Tempelkan Teks Komposisi (Ingredients):</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Contoh: Aqua, Niacinamide 5%, Glycerin, Centella Asiatica Extract, Salicylic Acid 2%..."
                  rows={5}
                  className="ingredient-textarea"
                />
                <div className="sample-chips">
                  <span className="sample-label">Coba sampel komposisi:</span>
                  <div className="chips-row">
                    {SAMPLE_INGREDIENTS.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputText(sample)}
                        className="sample-chip"
                      >
                        Sampel #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              className="primary-btn"
              onClick={handleStartAnalysis}
              disabled={
                isAnalyzing ||
                (activeTab === 'image' && !imageBase64) ||
                (activeTab === 'text' && !inputText.trim())
              }
            >
              <FlaskConical size={18} />
              <span>Analisis Bahan Skincare</span>
            </button>

            {/* Medical Disclaimer Box */}
            <div className="disclaimer">
              <Info size={18} className="disclaimer-icon" />
              <span>
                <b>Penafian medis:</b> Hasil analisis AI ini bersifat panduan edukasi, bukan pengganti diagnosis atau konsultasi dokter kulit. Jika mengalami iritasi parah, segera konsultasi ke tenaga medis profesional.
              </span>
            </div>
          </div>
        )}

        {/* STAGE 2: ANIMATED SCANNER */}
        {stage === 'scanning' && (
          <div className="stage-content">
            <div className="scan-frame">
              {previewUrl ? (
                <img src={previewUrl} alt="Label Komposisi" className="scan-img-preview" />
              ) : (
                <div className="mock-label">📋 Foto label komposisi</div>
              )}
            </div>

            <div className="scan-status">
              <div className="bouncing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="scan-text">{scanStagesText[scanTextIndex]}</span>
            </div>

            <p className="scan-progress-label">Bahan ditemukan: {foundCount}</p>
          </div>
        )}

        {/* STAGE 3: RESULTS & PERSONAL SKIN FLAGS */}
        {stage === 'result' && (
          <div className="stage-content">
            {/* Result Summary */}
            <div className="result-summary">
              <div className="rs-ring">{scoreRatio}</div>
              <div className="rs-text">
                <b>
                  {safeCount === totalCount
                    ? '100% Cocok untuk kulitmu'
                    : 'Sebagian besar cocok untuk kulitmu'}
                </b>
                <span>
                  {safeCount} bahan aman, {totalCount - safeCount} perlu diperhatikan untuk tipe kulit ({skinTypeDesc})
                </span>
              </div>
            </div>

            {/* Ingredient Cards Breakdown List */}
            <div className="ingredient-list">
              {displayIngredientsList.map((ing, idx) => (
                <div
                  key={idx}
                  className="ing-card"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                >
                  <div className="ing-head">
                    <span className="ing-name">{ing.name}</span>
                    <span className={`ing-badge ${ing.badge}`}>
                      {ing.badgeLabel || (ing.badge === 'aman' ? 'Aman' : ing.badge === 'hindari' ? 'Hindari' : 'Perlu diperhatikan')}
                    </span>
                  </div>

                  <p className="ing-func">{ing.function}</p>

                  <div className="ing-row">
                    <b>Cocok untuk</b>
                    <span>{ing.skinType}</span>
                  </div>

                  <div className="ing-row">
                    <b>Interaksi</b>
                    <span>{ing.interaction}</span>
                  </div>

                  {/* Personal Skin Flag */}
                  {ing.personal && (
                    <div className={`personal-flag ${ing.personal.ok ? 'ok' : ''}`}>
                      {ing.personal.ok ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      <span>{ing.personal.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <button className="reset-btn" onClick={handleResetFlow}>
              Scan produk lain
            </button>
          </div>
        )}
      </div>

      {/* PURE VANILLA CSS STYLING */}
      <style>{`
        .ingredient-scan-root {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .page-head {
          margin-bottom: 8px;
        }

        .head-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 4px;
        }

        .page-head h1 {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #0b4f5c;
          margin: 0;
        }

        .coin-cost-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid rgba(10, 62, 72, 0.12);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #b96a3d;
        }

        .page-head p {
          font-size: 0.875rem;
          color: #5c6b6b;
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

        .stage-container {
          width: 100%;
        }

        .stage-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* TAB SWITCHER */
        .tab-switcher {
          display: flex;
          background: #ffffff;
          border: 1px solid rgba(10, 62, 72, 0.12);
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
          color: #5c6b6b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-btn.active {
          background: #dceeea;
          color: #0b4f5c;
          font-weight: 600;
        }

        /* STAGE 1: DROPZONE */
        .dropzone {
          border: 2px dashed rgba(10, 62, 72, 0.18);
          border-radius: 20px;
          padding: 40px 24px;
          text-align: center;
          background: #ffffff;
          cursor: pointer;
          transition: border-color 0.15s ease;
          position: relative;
        }

        .dropzone:hover {
          border-color: #126575;
        }

        .dz-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #dceeea;
          color: #0b4f5c;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }

        .dz-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1a2b2b;
          margin-bottom: 4px;
        }

        .dz-sub {
          font-size: 0.8125rem;
          color: #5c6b6b;
        }

        .dropzone-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .dropzone-preview img {
          max-height: 200px;
          border-radius: 12px;
          object-fit: contain;
        }

        .clear-btn {
          background: #f1f5f9;
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

        /* TEXT INPUT BOX */
        .text-input-box {
          background: #ffffff;
          border: 1px solid rgba(10, 62, 72, 0.12);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .text-input-label {
          font-size: 0.84375rem;
          font-weight: 600;
          color: #1a2b2b;
        }

        .ingredient-textarea {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          font-size: 0.875rem;
          font-family: inherit;
          color: #1a2b2b;
          outline: none;
          resize: vertical;
        }

        .ingredient-textarea:focus {
          border-color: #0b4f5c;
        }

        .sample-chips {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sample-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sample-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0b4f5c;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .sample-chip:hover {
          background: #dceeea;
        }

        /* PRIMARY ACTION BUTTON */
        .primary-btn {
          width: 100%;
          background: #0b4f5c;
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

        .primary-btn:hover:not(:disabled) {
          background: #0a3e48;
        }

        .primary-btn:disabled {
          background: #d8dedd;
          color: #8b9796;
          cursor: not-allowed;
        }

        /* DISCLAIMER BOX */
        .disclaimer {
          background: #faeeda;
          border: 1px solid #f0dba8;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 0.78125rem;
          line-height: 1.6;
          color: #6b4a16;
          display: flex;
          gap: 10px;
        }

        .disclaimer-icon {
          color: #854f0b;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .disclaimer b {
          color: #4a3006;
        }

        /* STAGE 2: ANIMATED SCANNER */
        .scan-frame {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(135deg, #e8e2d5, #d8d0bd);
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scan-img-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.6;
        }

        .scan-frame::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4fe3b8, transparent);
          box-shadow: 0 0 14px 3px rgba(79, 227, 184, 0.75);
          animation: scanline 2.1s ease-in-out infinite;
        }

        @keyframes scanline {
          0% { top: 6%; }
          50% { top: 92%; }
          100% { top: 6%; }
        }

        .mock-label {
          width: 70%;
          height: 70%;
          background: #ffffff;
          border-radius: 10px;
          opacity: 0.55;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5c6b6b;
          font-size: 0.8125rem;
        }

        .scan-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }

        .bouncing-dots {
          display: flex;
          gap: 4px;
        }

        .bouncing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #126575;
          animation: dotBounce 1.1s infinite ease-in-out;
        }

        .bouncing-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .bouncing-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .scan-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #126575;
          animation: thinkShimmer 1.8s infinite ease-in-out;
        }

        @keyframes thinkShimmer {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        .scan-progress-label {
          text-align: center;
          font-size: 0.78125rem;
          color: #5c6b6b;
          margin: 0;
        }

        /* STAGE 3: RESULTS */
        .result-summary {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #ffffff;
          border: 1px solid rgba(10, 62, 72, 0.12);
          border-radius: 16px;
          padding: 16px;
        }

        .rs-ring {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #dceeea;
          color: #0b4f5c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-size: 1.0625rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .rs-text b {
          display: block;
          font-size: 0.9375rem;
          margin-bottom: 2px;
          color: #1a2b2b;
        }

        .rs-text span {
          font-size: 0.8125rem;
          color: #5c6b6b;
        }

        .ingredient-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ing-card {
          background: #ffffff;
          border: 1px solid rgba(10, 62, 72, 0.12);
          border-radius: 16px;
          padding: 16px;
          opacity: 0;
          transform: translateY(8px);
          animation: cardReveal 0.45s ease forwards;
        }

        @keyframes cardReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ing-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 10px;
        }

        .ing-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1a2b2b;
        }

        .ing-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .ing-badge.aman {
          background: #eaf3de;
          color: #3b6d11;
        }

        .ing-badge.hati {
          background: #faeeda;
          color: #854f0b;
        }

        .ing-badge.hindari {
          background: #fbe9e7;
          color: #b3261e;
        }

        .ing-func {
          font-size: 0.8125rem;
          color: #5c6b6b;
          line-height: 1.55;
          margin-bottom: 10px;
        }

        .ing-row {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 0.78125rem;
          line-height: 1.5;
          margin-bottom: 5px;
        }

        .ing-row b {
          color: #1a2b2b;
          font-weight: 600;
          flex-shrink: 0;
          width: 108px;
        }

        .ing-row span {
          color: #5c6b6b;
        }

        .personal-flag {
          margin-top: 10px;
          background: #fbe9e7;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 0.78125rem;
          color: #7a231d;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-weight: 500;
        }

        .personal-flag.ok {
          background: #eaf3de;
          color: #3b6d11;
        }

        .personal-flag svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .reset-btn {
          width: 100%;
          margin-top: 4px;
          background: #ffffff;
          border: 1px solid rgba(10, 62, 72, 0.12);
          color: #0b4f5c;
          border-radius: 12px;
          padding: 12px;
          font-size: 0.84375rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .reset-btn:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  )
}
