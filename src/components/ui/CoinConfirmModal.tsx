// src/components/ui/CoinConfirmModal.tsx
// Modal Konfirmasi Penggunaan Credits & Modal Edukatif Saldo Tidak Cukup
// Memandu user untuk kerjakan Misi (/missions) atau Upgrade Akun (/pricing)

import { useNavigate } from 'react-router-dom'
import { Coins, X, Sparkles, Crown, Trophy, AlertTriangle, ArrowRight } from 'lucide-react'
import '@/styles/scan-modals.css'

interface CoinConfirmModalProps {
  isOpen: boolean
  coinCost: number
  currentBalance: number
  featureName?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function CoinConfirmModal({
  isOpen,
  coinCost,
  currentBalance,
  featureName = 'fitur ini',
  onConfirm,
  onCancel,
}: CoinConfirmModalProps) {
  const navigate = useNavigate()
  if (!isOpen) return null

  const balanceAfter = currentBalance - coinCost
  const isInsufficient = balanceAfter < 0

  return (
    <div className="coin-modal-overlay" onClick={onCancel}>
      <div className="coin-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="coin-modal-header">
          <div className={`coin-modal-icon ${isInsufficient ? 'insufficient' : ''}`}>
            {isInsufficient ? <AlertTriangle size={24} /> : <Coins size={24} />}
          </div>
          <button type="button" className="coin-modal-close" onClick={onCancel} aria-label="Tutup dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="coin-modal-body">
          {isInsufficient ? (
            <>
              <div className="modal-badge-pill insufficient-badge">
                <Coins size={12} aria-hidden="true" />
                <span>Saldo Tidak Mencukupi</span>
              </div>
              <h3 className="modal-title">Credits Kamu Tidak Cukup</h3>
              <p className="modal-desc">
                Fitur <strong>{featureName}</strong> membutuhkan{' '}
                <span className="text-highlight cluv-tabular-nums">{coinCost} Credits</span>, sedangkan saldo kamu saat ini{' '}
                <span className="text-highlight cluv-tabular-nums">{currentBalance} Credits</span>.
              </p>

              {/* 2 Pilihan Aksi Edukatif */}
              <div className="insufficient-options">
                {/* Opsi 1: Kerjakan Misi */}
                <div
                  className="option-card mission-card"
                  onClick={() => {
                    onCancel()
                    navigate('/missions')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onCancel()
                      navigate('/missions')
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="option-icon-box trophy-bg">
                    <Trophy size={20} aria-hidden="true" />
                  </div>
                  <div className="option-info">
                    <div className="option-title-row">
                      <h4>Kerjakan Misi Harian</h4>
                      <span className="badge-free-pill">GRATIS</span>
                    </div>
                    <p>Dapatkan Credits gratis setiap hari dari check-in & misi skincare.</p>
                  </div>
                  <div className="option-arrow">
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </div>

                {/* Opsi 2: Upgrade Paket */}
                <div
                  className="option-card upgrade-card"
                  onClick={() => {
                    onCancel()
                    navigate('/pricing')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onCancel()
                      navigate('/pricing')
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="option-icon-box crown-bg">
                    <Crown size={20} aria-hidden="true" />
                  </div>
                  <div className="option-info">
                    <div className="option-title-row">
                      <h4>Tingkatkan ke Glow / PRO</h4>
                      <span className="badge-pro-pill">KUOTA AI</span>
                    </div>
                    <p>Nikmati kuota bulanan AI tanpa perlu khawatir saldo Credits habis.</p>
                  </div>
                  <div className="option-arrow">
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="modal-title">Gunakan Credits</h3>
              <p className="modal-desc">
                Kamu akan menggunakan Credits untuk mengakses <strong>{featureName}</strong>.
              </p>

              {/* Cost Breakdown */}
              <div className="coin-breakdown">
                <div className="breakdown-row">
                  <span>Biaya penggunaan</span>
                  <span className="breakdown-cost cluv-tabular-nums">-{coinCost} Credits</span>
                </div>
                <div className="breakdown-row">
                  <span>Saldo kamu</span>
                  <span className="cluv-tabular-nums">{currentBalance} Credits</span>
                </div>
                <div className="breakdown-divider" />
                <div className="breakdown-row breakdown-result">
                  <span>Sisa setelah pemotongan</span>
                  <span className="text-success cluv-tabular-nums">{balanceAfter} Credits</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="coin-modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            {isInsufficient ? 'Nanti Saja' : 'Batal'}
          </button>
          {!isInsufficient && (
            <button type="button" className="btn btn-primary" onClick={onConfirm}>
              <Sparkles size={16} aria-hidden="true" />
              Gunakan {coinCost} Credits
            </button>
          )}
        </div>
      </div>


    </div>
  )
}
