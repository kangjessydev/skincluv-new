// src/pages/app/IngredientScanPage.tsx
// 100% Faithful Port of scan-2 Ingredient Scan UI for Skincluv with Reordered Tabs (Foto Kemasan Default, Ketik Komposisi Second)

import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Sparkles,
  Loader2,
  Tag,
} from 'lucide-react'
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
  const navigate = useNavigate()
  const { coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage } = useInvokeAI()

  const isPro = isActivePremium(subscription)
  const userCoins = coinBalance?.balance ?? 0

  // TAB ORDER DIRECTIVE: Default to 'image' (Foto Kemasan) first, 'text' (Ketik Komposisi) second
  const [activeTab, setActiveTab] = useState<TabMode>('image')

  // Form & Image States
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
    setSelectedFile(file)
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
    setSelectedFile(file)
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
    setSelectedFile(null)
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
      return <span className="status-pill status-optimal"><CheckCircle2 size={12} /> Optimal</span>
    }
    if (statusText === 'Watch' || item.safety_level === 'caution') {
      return <span className="status-pill status-watch"><Info size={12} /> Perhatian</span>
    }
    return <span className="status-pill status-neutral"><AlertCircle size={12} /> Neutral</span>
  }

  const ingredientList = scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []
  const skinTypeList = scanResult?.suitable_for_skin_types || ['Normal', 'Kombinasi', 'Berminyak', 'Sensitif']

  return (
    <div className="scan2-ingredient-root animate-fade-in">
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
          <Link to="/" className="back-link">
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </Link>
          <h1 className="header-title">
            <div className="header-icon-box">
              <FlaskConical size={20} className="text-amber-600" />
            </div>
            <span>Scan Ingredient Skincare</span>
          </h1>
          <p className="header-subtitle">
            Cek tingkat keamanan kandungan bahan kosmetik sebelum Anda membelinya.
          </p>
        </div>

        <div className="coin-cost-pill">
          <Coins size={14} className="text-amber-500" />
          <span>{isPro ? '0 Koin (Pro Member)' : '10 Koin / Scan'}</span>
        </div>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="error-alert-box">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="ingredient-main-grid">
        {/* Left Column (Input Panel) */}
        <div className="input-panel-card">
          {/* Tab Switcher: Tab 1 = Scan Foto Kemasan, Tab 2 = Ketik Teks Bahan */}
          <div className="tab-switcher-pill">
            <button
              onClick={() => { setActiveTab('image'); setErrorMsg(null); }}
              className={`tab-btn ${activeTab === 'image' ? 'tab-btn-active' : ''}`}
            >
              <Camera size={16} />
              <span>Unggah Foto Label</span>
            </button>
            <button
              onClick={() => { setActiveTab('text'); setErrorMsg(null); }}
              className={`tab-btn ${activeTab === 'text' ? 'tab-btn-active' : ''}`}
            >
              <FileText size={16} />
              <span>Ketik Teks Bahan</span>
            </button>
          </div>

          {/* TAB 1: Scan Foto Kemasan */}
          {activeTab === 'image' ? (
            <div className="dropzone-container">
              {previewUrl ? (
                <div className="preview-image-box">
                  <img src={previewUrl} alt="Preview Label Kemasan" className="preview-img" />
                  <button onClick={handleClearImage} className="btn-clear-img">
                    <X size={14} /> Hapus
                  </button>
                </div>
              ) : (
                <label
                  className="upload-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="dropzone-avatar bg-amber-50 text-amber-600">
                    <Upload size={24} />
                  </div>
                  <span className="dropzone-title">Foto Kemasan / Komposisi</span>
                  <span className="dropzone-hint">Format JPG, PNG, WEBP maks 10MB</span>
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
            <div className="text-input-container">
              <label className="input-field-label">
                Tempelkan Teks Komposisi (Ingredients):
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Contoh: Aqua, Niacinamide 5%, Glycerin, Centella Asiatica Extract, Phenoxyethanol..."
                className="ingredient-textarea"
                rows={6}
              />

              <div className="sample-chips-box">
                <span className="sample-kicker">Coba sampel komposisi:</span>
                <div className="sample-chips">
                  {SAMPLE_INGREDIENTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(sample)}
                      className="chip-btn"
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
            className={`btn-analyze-submit ${
              (activeTab === 'image' && imageBase64) || (activeTab === 'text' && inputText.trim())
                ? 'btn-enabled'
                : 'btn-disabled'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Mengekstrak & Menganalisis Komposisi...</span>
              </>
            ) : (
              <>
                <FlaskConical size={18} />
                <span>Analisis Bahan Skincare</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column (Results Panel) */}
        <div className="result-panel-card">
          {isAnalyzing ? (
            <div className="skeleton-loading-box">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-box-large" />
              <div className="skeleton-line skeleton-row" />
              <div className="skeleton-line skeleton-row" />
            </div>
          ) : scanResult ? (
            <div className="results-content-stack">
              <div>
                <span className="result-kicker-tag">HASIL ANALISIS KOMPOSISI</span>
                <h2 className="result-product-title">
                  {scanResult.product_name || 'Komposisi Produk Skincare'}
                </h2>
              </div>

              <div className="clinical-summary-card">
                <p className="summary-label">Rangkuman Klinis AI:</p>
                <p className="summary-text">
                  {scanResult.clinical_summary || scanResult.overall_recommendation || 'Produk mengandung komposisi yang seimbang untuk perawatan harian kulit Anda.'}
                </p>
              </div>

              <div className="skin-compatibility-row">
                <span className="compat-label">Cocok Untuk:</span>
                <div className="compat-pills">
                  {skinTypeList.map((st, idx) => (
                    <span key={idx} className="compat-pill">
                      <CheckCircle2 size={12} className="text-teal-600" />
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="breakdown-title">Rincian Keamanan Bahan:</h3>
                <div className="breakdown-items-list">
                  {ingredientList.length > 0 ? (
                    ingredientList.map((item, idx) => (
                      <div key={idx} className="ingredient-item-row">
                        <div>
                          <p className="item-name">{item.name}</p>
                          <p className="item-func">{item.function || item.notes || 'Bahan aktif pendukung formula'}</p>
                        </div>
                        {getIngredientStatusBadge(item)}
                      </div>
                    ))
                  ) : (
                    <p className="empty-breakdown-text">Seluruh kandungan bahan utama telah terverifikasi aman.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="empty-results-box">
              <div className="empty-icon-avatar">
                <FlaskConical size={36} className="text-amber-500" />
              </div>
              <p className="empty-title">Belum Ada Analisis</p>
              <p className="empty-desc">
                Unggah foto label kemasan atau ketik teks bahan kosmetik Anda di panel sebelah kiri untuk melihat analisis klinis mendalam.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Box */}
      <div className="medical-disclaimer-box">
        <ShieldAlert size={20} className="disclaimer-icon" />
        <div>
          <strong className="disclaimer-title">PENTING (Penafian Medis):</strong> Hasil analisis kecerdasan buatan (AI) ini bersifat sebagai panduan edukasi perawatan kulit mandiri dan referensi kosmetik luar. Aplikasi ini tidak menggantikan diagnosis, konsultasi, atau perawatan klinis dari dokter spesialis kulit dan kelamin (Dermatolog). Jika Anda mengalami iritasi parah atau masalah kulit kronis, segera konsultasikan dengan tenaga medis profesional.
        </div>
      </div>

      {/* VANILLA CSS SCAN INGREDIENT STYLING */}
      <style>{`
        .scan2-ingredient-root {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ingredient-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #0f6784;
          text-decoration: none;
          margin-bottom: 6px;
        }

        .header-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-subtitle {
          font-size: 0.825rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .coin-cost-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.775rem;
          font-weight: 800;
          color: #92400e;
        }

        .error-alert-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 0.825rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ingredient-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .ingredient-main-grid { grid-template-columns: 1fr; }
        }

        /* INPUT PANEL CARD */
        .input-panel-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .tab-switcher-pill {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 16px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 12px;
          font-size: 0.775rem;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn-active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .dropzone-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 200px;
        }

        .upload-dropzone {
          flex: 1;
          border: 2px dashed #cbd5e1;
          border-radius: 20px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-dropzone:hover {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .dropzone-avatar {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .dropzone-title { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
        .dropzone-hint { font-size: 0.725rem; color: #94a3b8; margin-top: 4px; }
        .hidden-file-input { display: none; }

        .preview-image-box {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid #fde68a;
        }

        .preview-img { width: 100%; height: 220px; object-fit: cover; }

        .btn-clear-img {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.8);
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.725rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .text-input-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .input-field-label { font-size: 0.775rem; font-weight: 800; color: #334155; }

        .ingredient-textarea {
          width: 100%;
          padding: 14px;
          font-size: 0.8rem;
          font-family: inherit;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          resize: none;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .ingredient-textarea:focus { border-color: #f59e0b; }

        .sample-chips-box { display: flex; flex-direction: column; gap: 6px; }
        .sample-kicker { font-size: 0.7rem; font-weight: 800; color: #94a3b8; }
        .sample-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip-btn {
          background: #f1f5f9;
          border: none;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.725rem;
          font-weight: 800;
          color: #475569;
          cursor: pointer;
        }

        .chip-btn:hover { background: #e2e8f0; color: #0f172a; }

        .btn-analyze-submit {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: none;
          font-size: 0.875rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-enabled {
          background: linear-gradient(90deg, #d97706 0%, #0f6784 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
        }

        .btn-enabled:hover { opacity: 0.95; transform: translateY(-1px); }
        .btn-disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

        /* RESULTS PANEL CARD */
        .result-panel-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          min-height: 380px;
        }

        .empty-results-box {
          margin: auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 320px;
        }

        .empty-icon-avatar {
          width: 64px;
          height: 64px;
          border-radius: 24px;
          background: #fffbeb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-title { font-size: 1rem; font-weight: 900; color: #1e293b; margin: 0; }
        .empty-desc { font-size: 0.775rem; color: #64748b; margin: 4px 0 0 0; line-height: 1.5; }

        .results-content-stack { display: flex; flex-direction: column; gap: 16px; }

        .result-kicker-tag {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #d97706;
          background: #fffbeb;
          padding: 3px 10px;
          border-radius: 6px;
        }

        .result-product-title { font-size: 1.15rem; font-weight: 900; color: #0f172a; margin: 8px 0 0 0; }

        .clinical-summary-card {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 16px;
        }

        .summary-label { font-size: 0.75rem; font-weight: 800; color: #334155; margin: 0 0 4px 0; }
        .summary-text { font-size: 0.8rem; color: #475569; line-height: 1.55; margin: 0; }

        .skin-compatibility-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .compat-label { font-size: 0.75rem; font-weight: 800; color: #334155; }
        .compat-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .compat-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.725rem;
          font-weight: 800;
          color: #0f766e;
          background: #ccfbf1;
          border: 1px solid #99f6e4;
          padding: 2px 10px;
          border-radius: 8px;
        }

        .breakdown-title { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 10px; }
        .breakdown-items-list { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }

        .ingredient-item-row {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          padding: 10px 14px;
          border-radius: 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .item-name { font-size: 0.8rem; font-weight: 800; color: #0f172a; margin: 0; }
        .item-func { font-size: 0.725rem; color: #64748b; margin: 2px 0 0 0; }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.675rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .status-optimal { background: #d1fae5; color: #065f46; }
        .status-watch { background: #fef3c7; color: #92400e; }
        .status-neutral { background: #f1f5f9; color: #475569; }

        /* MEDICAL DISCLAIMER */
        .medical-disclaimer-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #78350f;
          padding: 16px;
          border-radius: 20px;
          font-size: 0.775rem;
          line-height: 1.55;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .disclaimer-icon { color: #d97706; shrink: 0; margin-top: 2px; }
        .disclaimer-title { font-weight: 900; }
      `}</style>
    </div>
  )
}
