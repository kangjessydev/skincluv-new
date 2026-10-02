import '@/styles/ui-components.css'

export default function PageLoader() {
  return (
    <div className="page-loader-wrapper" role="status" aria-label="Memuat halaman...">
      <div className="page-loader-spinner" />
    </div>
  )
}
