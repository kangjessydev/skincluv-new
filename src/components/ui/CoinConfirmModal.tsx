// src/components/ui/CoinConfirmModal.tsx
// Pengganti window.confirm() untuk konfirmasi penggunaan koin
// Menggunakan CSS custom properties dari index.css — tidak perlu library tambahan

import { useNavigate } from 'react-router-dom'
import { Coins, X, Sparkles, Crown, Trophy } from 'lucide-react'

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
          <div className="coin-modal-icon">
            <Coins size={24} />
          </div>
          <button className="coin-modal-close" onClick={onCancel} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="coin-modal-body">
          <h3>Akses Fitur AI</h3>
          <p>
            Kamu bisa melanjutkan menggunakan Credits untuk mengakses{' '}
            <strong>{featureName}</strong>.
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
              <span className={balanceAfter < 0 ? 'text-error' : 'text-success'}>
                {balanceAfter < 0 ? '0' : balanceAfter} Credits
                {balanceAfter < 0 && ' (kurang)'}
              </span>
            </div>
          </div>

          {isInsufficient && (
            <div className="insufficient-callout">
              <p className="coin-modal-warning">
                Saldo Credits kamu tidak cukup. Selesaikan misi harian untuk mendapatkan Credits gratis atau upgrade ke Paket Glow / PRO untuk kuota bulanan.
              </p>
              <div className="insufficient-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onCancel()
                    navigate('/missions')
                  }}
                >
                  <Trophy size={15} /> Kerjakan Misi
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onCancel()
                    navigate('/pricing')
                  }}
                >
                  <Crown size={15} /> Beli Paket
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="coin-modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            Batal
          </button>
          {!isInsufficient && (
            <button
              className="btn btn-primary"
              onClick={onConfirm}
            >
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
          background: rgba(0, 0, 0, 0.45);
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
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl);
          box-shadow: 0 20px 40px rgba(0, 101, 145, 0.15);
          width: 100%;
          max-width: 360px;
          animation: slideUp 0.2s ease;
        }

        .coin-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg) var(--space-lg) var(--space-sm);
        }

        .coin-modal-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
          border: 1px solid #fde68a;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-tertiary-container);
        }

        .coin-modal-close {
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: background 0.15s;
        }

        .coin-modal-close:hover {
          background: var(--color-surface-container-low);
        }

        .coin-modal-body {
          padding: 0 var(--space-lg) var(--space-md);
        }

        .coin-modal-body h3 {
          font-size: 1.125rem;
          font-family: var(--font-heading);
          font-weight: 700;
          color: var(--color-text-main);
          margin: 0 0 var(--space-xs);
        }

        .coin-modal-body p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0 0 var(--space-md);
        }

        .coin-breakdown {
          background: var(--color-surface-container-low);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .breakdown-cost {
          color: var(--color-error);
          font-weight: 700;
        }

        .breakdown-divider {
          height: 1px;
          background: var(--color-secondary-container);
          margin: var(--space-2xs) 0;
        }

        .breakdown-result {
          font-weight: 700;
          color: var(--color-text-main);
        }

        .text-error { color: var(--color-error); }
        .text-success { color: var(--color-success); }

        .coin-modal-warning {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--color-error) !important;
          font-size: 0.8125rem !important;
          margin: 0 !important;
        }

        .insufficient-callout {
          margin-top: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insufficient-actions {
          display: flex;
          gap: 8px;
        }

        .insufficient-actions .btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          padding: 8px 10px;
        }

        .coin-modal-actions {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-lg) var(--space-lg);
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
