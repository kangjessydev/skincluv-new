export default function PageLoader() {
  return (
    <div className="page-loader-wrapper" role="status" aria-label="Memuat halaman...">
      <div className="page-loader-spinner" />
      <style>{`
        .page-loader-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 45vh;
          width: 100%;
        }
        .page-loader-spinner {
          width: 38px;
          height: 38px;
          border: 3px solid rgba(15, 103, 132, 0.15);
          border-top-color: var(--skincluv-teal, #0f6784);
          border-radius: 50%;
          animation: page-loader-spin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes page-loader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
