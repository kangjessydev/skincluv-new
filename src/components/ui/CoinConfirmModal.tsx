// src/components/ui/CoinConfirmModal.tsx
// Modal Konfirmasi Penggunaan Credits & Modal Edukatif Saldo Tidak Cukup
// Memandu user untuk kerjakan Misi (/missions) atau Upgrade Akun (/pricing)

import { useNavigate } from 'react-router-dom'
import { Coins, X, Sparkles, Crown, Trophy, AlertTriangle, ArrowRight } from 'lucide-react'

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
          <button className="coin-modal-close" onClick={onCancel} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="coin-modal-body">
          {isInsufficient ? (
            <>
              <div className="modal-badge-pill insufficient-badge">
                <Coins size={12} />
                <span>Saldo Tidak Mencukupi</span>
              </div>
              <h3 className="modal-title">Credits Kamu Tidak Cukup</h3>
              <p className="modal-desc">
                Fitur <strong>{featureName}</strong> membutuhkan{' '}
                <span className="text-highlight">{coinCost} Credits</span>, sedangkan saldo kamu saat ini{' '}
                <span className="text-highlight">{currentBalance} Credits</span>.
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
                  role="button"
                  tabIndex={0}
                >
                  <div className="option-icon-box trophy-bg">
                    <Trophy size={20} />
                  </div>
                  <div className="option-info">
                    <div className="option-title-row">
                      <h4>Kerjakan Misi Harian</h4>
                      <span className="badge-free-pill">GRATIS</span>
                    </div>
                    <p>Dapatkan Credits gratis setiap hari dari check-in & misi skincare.</p>
                  </div>
                  <div className="option-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>

                {/* Opsi 2: Upgrade Paket */}
                <div
                  className="option-card upgrade-card"
                  onClick={() => {
                    onCancel()
                    navigate('/pricing')
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="option-icon-box crown-bg">
                    <Crown size={20} />
                  </div>
                  <div className="option-info">
                    <div className="option-title-row">
                      <h4>Tingkatkan ke Glow / PRO</h4>
                      <span className="badge-pro-pill">KUOTA AI</span>
                    </div>
                    <p>Nikmati kuota bulanan AI tanpa perlu khawatir saldo Credits habis.</p>
                  </div>
                  <div className="option-arrow">
                    <ArrowRight size={16} />
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
                  <span className="breakdown-cost">-{coinCost} Credits</span>
                </div>
                <div className="breakdown-row">
                  <span>Saldo kamu</span>
                  <span>{currentBalance} Credits</span>
                </div>
                <div className="breakdown-divider" />
                <div className="breakdown-row breakdown-result">
                  <span>Sisa setelah pemotongan</span>
                  <span className="text-success">{balanceAfter} Credits</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="coin-modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            {isInsufficient ? 'Nanti Saja' : 'Batal'}
          </button>
          {!isInsufficient && (
            <button className="btn btn-primary" onClick={onConfirm}>
              <Sparkles size={16} />
              Gunakan {coinCost} Credits
            </button>
          )}
        </div>
      </div>

      <style>{`
        .coin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: var(--space-md);
          animation: fadeIn 0.15s ease;
        }

        .coin-modal-panel {
          background: var(--color-surface-container-lowest, #ffffff);
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-2xl, 1.25rem);
          box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.2s ease;
        }

        .coin-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem 0.5rem;
        }

        .coin-modal-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
          border: 1px solid #fde68a;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d97706;
        }

        .coin-modal-icon.insufficient {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border-color: #fecaca;
          color: #dc2626;
        }

        .coin-modal-close {
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted, #64748b);
          cursor: pointer;
          transition: all 0.15s;
        }

        .coin-modal-close:hover {
          background: var(--color-surface-container-low, #f1f5f9);
          color: var(--color-text-main, #0f172a);
        }

        .coin-modal-body {
          padding: 0.5rem 1.5rem 1.25rem;
        }

        .modal-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          margin-bottom: 0.75rem;
        }

        .insufficient-badge {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .modal-title {
          font-size: 1.25rem;
          font-family: var(--font-heading, inherit);
          font-weight: 700;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 0.5rem;
        }

        .modal-desc {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
          margin: 0 0 1.25rem;
        }

        .text-highlight {
          font-weight: 700;
          color: var(--color-text-main, #0f172a);
        }

        .insufficient-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .option-card:hover {
          border-color: #0f6784;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(15, 103, 132, 0.08);
        }

        .mission-card:hover {
          border-color: #f59e0b;
        }

        .upgrade-card:hover {
          border-color: #0284c7;
        }

        .option-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .trophy-bg {
          background: #fef3c7;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .crown-bg {
          background: #e0f2fe;
          color: #0284c7;
          border: 1px solid #bae6fd;
        }

        .option-info {
          flex: 1;
          min-width: 0;
        }

        .option-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .option-title-row h4 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
        }

        .badge-free-pill {
          font-size: 0.625rem;
          font-weight: 800;
          background: #dcfce7;
          color: #15803d;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .badge-pro-pill {
          font-size: 0.625rem;
          font-weight: 800;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .option-info p {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1.35;
        }

        .option-arrow {
          color: #94a3b8;
          transition: transform 0.2s;
        }

        .option-card:hover .option-arrow {
          color: #0f6784;
          transform: translateX(3px);
        }

        .coin-breakdown {
          background: var(--color-surface-container-low, #f8fafc);
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: 12px;
          padding: 0.875rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
        }

        .breakdown-cost {
          color: #dc2626;
          font-weight: 700;
        }

        .breakdown-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 0.25rem 0;
        }

        .breakdown-result {
          font-weight: 700;
          color: #0f172a;
        }

        .text-success { color: #16a34a; }

        .coin-modal-actions {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem 1.5rem;
        }

        .coin-modal-actions .btn {
          flex: 1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
