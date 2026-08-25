// src/pages/app/IngredientScanPage.tsx
// 100% Faithful Port of scan-2 Ingredient Scan UI for Skincluv with ScanTabs & Reordered Input Tabs (Foto Kemasan Default, Ketik Komposisi Second)

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
  Tag,
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
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 size={10} /> Optimal</span>
    }
    if (statusText === 'Watch' || item.safety_level === 'caution') {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 flex items-center gap-1"><Info size={10} /> Perhatian</span>
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-700 flex items-center gap-1"><AlertCircle size={10} /> Neutral</span>
  }

  const ingredientList = scanResult?.ingredients_breakdown || scanResult?.key_ingredients || []
  const skinTypeList = scanResult?.suitable_for_skin_types || ['Normal', 'Kombinasi', 'Berminyak', 'Sensitif']

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-6 animate-fade-in">
      {/* Top Scan Tabs Switcher (Face Scan vs Ingredients) */}
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
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <Link
            to="/"
            className="text-xs font-semibold text-[#0f6784] hover:underline flex items-center gap-1 mb-1"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <FlaskConical size={20} />
            </span>
            Scan Ingredient Skincare
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cek tingkat keamanan kandungan bahan kosmetik sebelum Anda membelinya.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
          <Coins size={14} className="text-amber-600" />
          <span>{isPro ? '0 Koin (Pro)' : '10 Koin'}</span>
        </div>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column (Input Panel) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-4">
          {/* Tab Switcher: Tab 1 = Scan Foto Kemasan, Tab 2 = Ketik Teks Bahan */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('image'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'image'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera size={14} />
              <span>Unggah Foto Label</span>
            </button>
            <button
              onClick={() => { setActiveTab('text'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={14} />
              <span>Ketik Teks Bahan</span>
            </button>
          </div>

          {/* TAB 1: Scan Foto Kemasan */}
          {activeTab === 'image' ? (
            <div className="flex flex-col items-center justify-center flex-1 space-y-3">
              {previewUrl ? (
                <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border-2 border-amber-200 shadow-inner group">
                  <img src={previewUrl} alt="Preview Label Kemasan" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 text-xs flex items-center gap-1"
                  >
                    <X size={12} /> Hapus
                  </button>
                </div>
              ) : (
                <label
                  className="w-full max-w-xs aspect-video rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 flex flex-col items-center justify-center cursor-pointer transition-all p-4 group text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-700 group-hover:text-amber-700">
                    Foto Kemasan / Komposisi
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPEG/PNG/WEBP maks 10MB</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            /* TAB 2: Ketik Teks Bahan */
            <div className="flex-1 flex flex-col space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Tempelkan Teks Komposisi (Ingredients):
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Contoh: Aqua, Niacinamide 5%, Glycerin, Centella Asiatica Extract, Phenoxyethanol..."
                className="w-full flex-1 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none min-h-[160px]"
              />

              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400">Coba sampel komposisi:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {SAMPLE_INGREDIENTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(sample)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
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
            className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
              (activeTab === 'image' && imageBase64) || (activeTab === 'text' && inputText.trim())
                ? 'bg-gradient-to-r from-amber-500 to-[#0f6784] text-white hover:opacity-95 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[380px]">
          {isAnalyzing ? (
            <div className="space-y-4 animate-pulse my-auto">
              <div className="h-4 bg-slate-200 rounded-full w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded-xl w-2/3"></div>
              <div className="h-24 bg-slate-200 rounded-2xl w-full"></div>
              <div className="space-y-2">
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
              </div>
            </div>
          ) : scanResult ? (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold tracking-wider text-amber-600 uppercase bg-amber-50 px-2.5 py-1 rounded-md">
                  Hasil Analisis Komposisi
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-2">
                  {scanResult.product_name || 'Komposisi Produk Skincare'}
                </h2>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-700 mb-1">Rangkuman Klinis:</p>
                {scanResult.clinical_summary || scanResult.overall_recommendation || 'Produk mengandung komposisi yang seimbang untuk perawatan harian kulit Anda.'}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Cocok Untuk:</span>
                <div className="flex flex-wrap gap-1">
                  {skinTypeList.map((st, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 font-medium rounded-md text-[11px] flex items-center gap-0.5"
                    >
                      <CheckCircle2 size={12} className="text-teal-600" />
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">
                  Rincian Keamanan Bahan:
                </h3>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {ingredientList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.function || item.notes || 'Bahan aktif pendukung formula'}</p>
                      </div>
                      {getIngredientStatusBadge(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="my-auto text-center p-8 text-slate-400 space-y-3 flex flex-col items-center">
              <FlaskConical size={36} className="text-slate-300" />
              <p className="text-xs sm:text-sm">
                Unggah foto label atau ketik teks bahan kosmetik Anda untuk melihat analisis ilmiah di sini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Box */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start gap-3 shadow-xs">
        <ShieldAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">PENTING (Penafian Medis):</strong> Hasil analisis kecerdasan buatan (AI) ini bersifat sebagai panduan edukasi perawatan kulit mandiri dan referensi kosmetik luar. Aplikasi ini tidak menggantikan diagnosis, konsultasi, atau perawatan klinis dari dokter spesialis kulit dan kelamin (Dermatolog). Jika Anda mengalami iritasi parah atau masalah kulit kronis, segera konsultasikan dengan tenaga medis profesional.
        </div>
      </div>
    </div>
  )
}
