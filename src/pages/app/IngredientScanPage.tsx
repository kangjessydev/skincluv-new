// src/pages/app/IngredientScanPage.tsx
// 100% Faithful Port of scan-2 Ingredient Scan UI for Skincluv — PURE VANILLA CSS (Zero Tailwind)
// Tab 1 Default = Unggah Foto Label, Tab 2 = Ketik Teks Bahan

import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FlaskConical,
  Camera,
  FileText,
  Coins,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldAlert,
  Upload,
  X,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import ScanTabs from '@/components/scan/ScanTabs'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium } from '@/utils/subscriptionHelpers'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'

type TabMode = 'image' | 'text'

interface IngredientItem {
  name: string
  function: string
  status?: 'Optimal' | 'Watch' | 'Neutral'
  safety_level?: 'safe' | 'caution' | 'avoid'
  notes?: string
}

interface IngredientAnalysisResult {
  is_valid_skincare?: boolean
  product_name?: string
  clinical_summary?: string
  safety_score?: number
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
  const { coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage } = useInvokeAI()

  const isPro = isActivePremium(subscription)

  // TAB ORDER DIRECTIVE: Default to 'image' (Foto Kemasan) first, 'text' (Ketik Komposisi) second
  const [activeTab, setActiveTab] = useState<TabMode>('image')

  // Form & Image States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')

  // Processing & Result States
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanResult, setScanResult] = useState<IngredientAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleClearImage = () => {
    setPreviewUrl(null)
    setImageBase64(null)
    setScanResult(null)
  }

  const handleStartAnalysis = async () => {
    if (activeTab === 'image' && !imageBase64) {
      setErrorMsg('Pilih atau unggah foto kemasan produk terlebih dahulu.')
      return
    }
    if (activeTab === 'text' && !inputText.trim()) {
      setErrorMsg('Masukkan atau tempelkan teks komposisi produk terlebih dahulu.')
      return
    }

    setIsAnalyzing(true)
    setErrorMsg(null)

    try {
      const input_context: Record<string, string> = {}
      if (activeTab === 'text') input_context.ingredient_text = inputText
      if (activeTab === 'image' && imageBase64) input_context.image_base64 = imageBase64

      const result = await invoke<IngredientAnalysisResult>({
        feature_slug: 'ingredient_scan',
        messages: [{
          role: 'user',
          content: activeTab === 'text'
            ? inputText
            : 'Analisis komposisi bahan dari foto kemasan produk skincare ini.'
        }],
        input_context,
      })

      if (!result || typeof result !== 'object') {
        setErrorMsg('Gagal menganalisis komposisi produk. Silakan periksa foto/teks dan coba lagi.')
        return
      }

      setScanResult(result)
    } catch (err: any) {
      console.error('Ingredient scan error:', err)
      setErrorMsg(err.message || 'Gagal menganalisis komposisi produk.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper for Status Badges
  const getIngredientStatusBadge = (item: IngredientItem) => {
    const statusText = item.status || (item.safety_level === 'safe' ? 'Optimal' : item.safety_level === 'caution' ? 'Watch' : 'Neutral')
    if (statusText === 'Optimal' || item.safety_level === 'safe') {
      return <span className="status-badge-item badge-optimal"><CheckCircle2 size={10} /> Optimal</span>
    }
    if (statusText === 'Watch' || item.safety_level === 'caution') {
      return <span className="status-badge-item badge-watch"><Info size={10} /> Perhatian</span>
    }
    return <span className="status-badge-item badge-neutral"><AlertCircle size={10} /> Neutral</span>
  }

  const ingredientList = scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []
  const skinTypeList = scanResult?.suitable_for_skin_types || ['Normal', 'Kombinasi', 'Berminyak', 'Sensitif']

  return (
    <div className="scan2-ingredient-root">
      {/* Top Navigation ScanTabs */}
      <ScanTabs />

      {/* Coin Deduction Modal */}
      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={true}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={pendingCoinConfirm.currentBalance}
          featureName="Scan Ingredient AI"
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* Header Bar */}
      <div className="ingredient-header-bar">
        <div>
          <Link to="/" className="back-nav-link">
            <ArrowLeft size={12} /> Kembali ke Dashboard
          </Link>
          <h1 className="header-title-text">
            <div className="header-icon-avatar bg-amber-light">
              <FlaskConical size={20} className="text-amber-dark" />
            </div>
            <span>Scan Ingredient Skincare</span>
          </h1>
          <p className="header-subtitle-text">
            Cek tingkat keamanan kandungan bahan kosmetik sebelum Anda membelinya.
          </p>
        </div>

        <div className="coin-cost-badge">
          <Coins size={14} className="text-amber-icon" />
          <span>{isPro ? '0 Koin (Pro)' : '10 Koin'}</span>
        </div>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="error-alert-banner">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="ingredient-main-grid">
        {/* Left Column (Input Panel) */}
        <div className="ingredient-input-panel">
          {/* Tab Switcher: Tab 1 = Unggah Foto Label, Tab 2 = Ketik Teks Bahan */}
          <div className="tab-switcher-container">
            <button
              onClick={() => { setActiveTab('image'); setErrorMsg(null); }}
              className={`input-tab-button ${activeTab === 'image' ? 'tab-button-active' : ''}`}
            >
              <Camera size={14} />
              <span>Unggah Foto Label</span>
            </button>
            <button
              onClick={() => { setActiveTab('text'); setErrorMsg(null); }}
              className={`input-tab-button ${activeTab === 'text' ? 'tab-button-active' : ''}`}
            >
              <FileText size={14} />
              <span>Ketik Teks Bahan</span>
            </button>
          </div>

          {/* TAB 1: Scan Foto Kemasan */}
          {activeTab === 'image' ? (
            <div className="dropzone-wrapper">
              {previewUrl ? (
                <div className="preview-image-container">
                  <img src={previewUrl} alt="Preview Label Kemasan" className="preview-img-element" />
                  <button onClick={handleClearImage} className="btn-clear-preview">
                    <X size={12} /> Hapus
                  </button>
                </div>
              ) : (
                <label
                  className="dropzone-upload-box"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="dropzone-avatar-circle">
                    <Upload size={22} className="text-amber-icon" />
                  </div>
                  <span className="dropzone-primary-text">Foto Kemasan / Komposisi</span>
                  <span className="dropzone-secondary-text">JPEG/PNG/WEBP maks 10MB</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                </label>
              )}
            </div>
          ) : (
            /* TAB 2: Ketik Teks Bahan */
            <div className="textarea-wrapper">
              <label className="input-field-label">
                Tempelkan Teks Komposisi (Ingredients):
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Contoh: Aqua, Niacinamide 5%, Glycerin, Centella Asiatica Extract, Phenoxyethanol..."
                className="textarea-input-field"
                rows={6}
              />

              <div className="sample-chips-box">
                <span className="sample-kicker-text">Coba sampel komposisi:</span>
                <div className="sample-buttons-row">
                  {SAMPLE_INGREDIENTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(sample)}
                      className="sample-chip-button"
                    >
                      Sampel #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Submit Button */}
          <button
            onClick={handleStartAnalysis}
            disabled={
              isAnalyzing ||
              (activeTab === 'image' && !imageBase64) ||
              (activeTab === 'text' && !inputText.trim())
            }
            className={`btn-analyze-gradient ${
              (activeTab === 'image' && imageBase64) || (activeTab === 'text' && inputText.trim())
                ? 'btn-enabled-state'
                : 'btn-disabled-state'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Mengekstrak Komposisi...</span>
              </>
            ) : (
              <>
                <FlaskConical size={16} />
                <span>Analisis Bahan Skincare</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column (Results Panel) */}
        <div className="ingredient-result-panel">
          {isAnalyzing ? (
            <div className="skeleton-loader-stack">
              <div className="skeleton-bar bar-short" />
              <div className="skeleton-bar bar-medium" />
              <div className="skeleton-bar bar-box" />
              <div className="skeleton-bar bar-list" />
            </div>
          ) : scanResult ? (
            <div className="results-stack">
              <div>
                <span className="result-kicker-badge">HASIL ANALISIS KOMPOSISI</span>
                <h2 className="result-product-title">
                  {scanResult.product_name || 'Komposisi Produk Skincare'}
                </h2>
              </div>

              <div className="clinical-summary-box">
                <p className="summary-title-text">Rangkuman Klinis:</p>
                <p className="summary-body-text">
                  {scanResult.clinical_summary || scanResult.overall_recommendation || 'Produk mengandung komposisi yang seimbang untuk perawatan harian kulit Anda.'}
                </p>
              </div>

              <div className="skin-compat-row">
                <span className="compat-row-label">Cocok Untuk:</span>
                <div className="compat-pills-wrap">
                  {skinTypeList.map((st, idx) => (
                    <span key={idx} className="compat-pill-item">
                      <CheckCircle2 size={12} className="text-teal-icon" />
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="breakdown-section-title">Rincian Keamanan Bahan:</h3>
                <div className="breakdown-cards-stack">
                  {ingredientList.map((item, idx) => (
                    <div key={idx} className="breakdown-item-card">
                      <div>
                        <p className="item-name-text">{item.name}</p>
                        <p className="item-function-text">{item.function || item.notes || 'Bahan aktif pendukung formula'}</p>
                      </div>
                      {getIngredientStatusBadge(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="empty-result-state">
              <FlaskConical size={36} className="empty-icon-element" />
              <p className="empty-state-text">
                Unggah foto label atau ketik teks bahan kosmetik Anda untuk melihat analisis ilmiah di sini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Box */}
      <div className="medical-disclaimer-card">
        <ShieldAlert size={20} className="disclaimer-alert-icon" />
        <div>
          <strong className="disclaimer-bold-title">PENTING (Penafian Medis):</strong> Hasil analisis kecerdasan buatan (AI) ini bersifat sebagai panduan edukasi perawatan kulit mandiri dan referensi kosmetik luar. Aplikasi ini tidak menggantikan diagnosis, konsultasi, atau perawatan klinis dari dokter spesialis kulit dan kelamin (Dermatolog). Jika Anda mengalami iritasi parah atau masalah kulit kronis, segera konsultasikan dengan tenaga medis profesional.
        </div>
      </div>

      {/* PURE VANILLA CSS STYLING */}
      <style>{`
        .scan2-ingredient-root {
          max-width: 896px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .ingredient-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .back-nav-link {
          font-size: 0.75rem;
          font-weight: 600;
          color: #0f6784;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }

        .back-nav-link:hover { text-decoration: underline; }

        .header-title-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon-avatar {
          padding: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-amber-light { background: #fef3c7; }
        .text-amber-dark { color: #b45309; }

        .header-subtitle-text {
          font-size: 0.825rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .coin-cost-badge {
          padding: 6px 12px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .text-amber-icon { color: #d97706; }

        .error-alert-banner {
          padding: 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ingredient-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .ingredient-main-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* INPUT PANEL */
        .ingredient-input-panel {
          background: #ffffff;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-switcher-container {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .input-tab-button {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .input-tab-button.tab-button-active {
          background: #ffffff;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .dropzone-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-height: 180px;
        }

        .dropzone-upload-box {
          width: 100%;
          max-width: 320px;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 16px;
          text-align: center;
        }

        .dropzone-upload-box:hover {
          border-color: #fbbf24;
          background: rgba(254, 243, 199, 0.4);
        }

        .dropzone-avatar-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .dropzone-primary-text { font-size: 0.75rem; font-weight: 600; color: #334155; }
        .dropzone-secondary-text { font-size: 0.625rem; color: #94a3b8; margin-top: 2px; }
        .hidden-file-input { display: none; }

        .preview-image-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #fde68a;
        }

        .preview-img-element { width: 100%; height: 100%; object-fit: cover; }

        .btn-clear-preview {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          color: #ffffff;
          border: none;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 0.65rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .textarea-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-field-label { font-size: 0.75rem; font-weight: 600; color: #475569; }

        .textarea-input-field {
          width: 100%;
          flex: 1;
          padding: 12px;
          font-size: 0.75rem;
          font-family: inherit;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          resize: none;
          min-height: 140px;
        }

        .textarea-input-field:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }

        .sample-chips-box { display: flex; flex-direction: column; gap: 4px; }
        .sample-kicker-text { font-size: 0.65rem; font-weight: 700; color: #94a3b8; }
        .sample-buttons-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .sample-chip-button {
          padding: 4px 10px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          font-size: 0.675rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .sample-chip-button:hover { background: #e2e8f0; }

        .btn-analyze-gradient {
          width: 100%;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .btn-enabled-state {
          background: linear-gradient(90deg, #f59e0b 0%, #0f6784 100%);
          color: #ffffff;
        }

        .btn-enabled-state:hover { opacity: 0.95; }
        .btn-disabled-state { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; }

        /* RESULTS PANEL */
        .ingredient-result-panel {
          background: #ffffff;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          min-height: 380px;
        }

        .empty-result-state {
          margin: auto;
          text-align: center;
          padding: 32px;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-icon-element { color: #cbd5e1; }
        .empty-state-text { font-size: 0.75rem; max-width: 280px; line-height: 1.5; margin: 0; }

        .results-stack { display: flex; flex-direction: column; gap: 16px; }

        .result-kicker-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #d97706;
          text-transform: uppercase;
          background: #fffbeb;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .result-product-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin: 8px 0 0 0;
        }

        .clinical-summary-box {
          padding: 14px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.6;
        }

        .summary-title-text { font-weight: 600; color: #334155; margin: 0 0 4px 0; }
        .summary-body-text { margin: 0; }

        .skin-compat-row { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; }
        .compat-row-label { font-weight: 600; color: #334155; }
        .compat-pills-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
        .compat-pill-item {
          padding: 2px 8px;
          background: #ccfbf1;
          color: #115e59;
          border: 1px solid #99f6e4;
          font-weight: 500;
          border-radius: 6px;
          font-size: 0.6875rem;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .text-teal-icon { color: #0d9488; }

        .breakdown-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }

        .breakdown-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .breakdown-item-card {
          padding: 10px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          background: rgba(248, 250, 252, 0.6);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.75rem;
        }

        .item-name-text { font-weight: 600; color: #1e293b; margin: 0; }
        .item-function-text { font-size: 0.6875rem; color: #64748b; margin: 2px 0 0 0; }

        .status-badge-item {
          padding: 2px 8px;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 6px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .badge-optimal { background: #d1fae5; color: #065f46; }
        .badge-watch { background: #fef3c7; color: #92400e; }
        .badge-neutral { background: #e2e8f0; color: #334155; }

        /* SKELETON LOADER */
        .skeleton-loader-stack { display: flex; flex-direction: column; gap: 16px; margin: auto 0; width: 100%; }
        .skeleton-bar { background: #e2e8f0; border-radius: 8px; animation: pulse 1.5s infinite; }
        .bar-short { height: 16px; width: 30%; }
        .bar-medium { height: 32px; width: 60%; }
        .bar-box { height: 80px; width: 100%; border-radius: 12px; }
        .bar-list { height: 40px; width: 100%; border-radius: 12px; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* MEDICAL DISCLAIMER CARD */
        .medical-disclaimer-card {
          padding: 16px;
          background: rgba(254, 243, 199, 0.8);
          border: 1px solid rgba(253, 230, 138, 0.7);
          border-radius: 16px;
          font-size: 0.75rem;
          color: #78350f;
          line-height: 1.6;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .disclaimer-alert-icon { color: #b45309; shrink: 0; margin-top: 2px; }
        .disclaimer-bold-title { font-weight: 700; }
      `}</style>
    </div>
  )
}
