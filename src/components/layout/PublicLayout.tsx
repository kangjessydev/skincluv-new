import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sparkles, ArrowRight, LogIn, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import '@/styles/public-layout.css'

export default function PublicLayout() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuNavRef = useRef<HTMLElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  // Close mobile drawer on route change
  const closeMenu = () => setMobileMenuOpen(false)

  // Check whether menu content overflows and has room to scroll down
  const checkScroll = () => {
    const el = menuNavRef.current
    if (!el) return
    const hasOverflow = el.scrollHeight > el.clientHeight + 4
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6
    setCanScrollDown(hasOverflow && !isAtBottom)
  }

  // Prevent background scroll when mobile drawer is open & calculate initial overflow
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      // Allow modal DOM layout to settle after bubble bloom starts
      const timer = setTimeout(checkScroll, 60)
      window.addEventListener('resize', checkScroll)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', checkScroll)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
      setCanScrollDown(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, location.pathname])

  return (
    <div className="public-shell cluv-surface-public">
      {/* SEAMLESS PUBLIC NAVBAR (TIPE A) */}
      <header className="public-navbar-wrapper">
        <div className="public-navbar-container">
          {/* Brand Wordmark & Icon */}
          <Link to="/" className="public-brand" aria-label="Skincluv Beranda" onClick={closeMenu}>
            <div className="public-brand-icon">
              <Sparkles size={19} />
            </div>
            <span className="public-brand-text">
              Skin<span className="text-highlight">cluv</span>
            </span>
          </Link>

          {/* Desktop Navigation Links — Airy & Breathable */}
          <nav className="public-nav-menu" aria-label="Navigasi Utama">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Beranda</Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>Tentang Kami</Link>
            <Link to="/paket" className={location.pathname === '/paket' ? 'active' : ''}>Paket</Link>
            <Link to="/faq" className={location.pathname === '/faq' ? 'active' : ''}>Pusat Bantuan</Link>
            <Link to="/download" className={location.pathname === '/download' ? 'active' : ''}>Unduh Aplikasi</Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Kontak</Link>
          </nav>

          {/* Primary CTA & Quiet Sign-in */}
          <div className="public-nav-cta">
            {user ? (
              <Link to="/dashboard" className="nav-btn-primary">
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-btn-text">
                  <span>Masuk</span>
                </Link>
                <Link to="/register" className="nav-btn-primary hide-mobile">
                  <span>Mulai Cerita</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              type="button"
              className={`public-mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION CURTAIN & BACKDROP OVERLAY */}
      <div
        className={`public-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={closeMenu}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="public-mobile-drawer" onClick={(e) => e.stopPropagation()}>
          {/* Drawer Header */}
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-badge">
              <Sparkles size={14} />
              <span>Sahabat Meja Riasmu</span>
            </div>
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={closeMenu}
              aria-label="Tutup menu navigasi"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Nav Links Container with Dynamic Overflow Detection */}
          <div className="mobile-menu-container">
            <nav
              ref={menuNavRef}
              className={`public-mobile-menu ${canScrollDown ? 'has-scroll-down' : ''}`}
              onScroll={checkScroll}
            >
              <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={closeMenu}>
                <span>Beranda</span>
              </Link>
              <Link to="/about" className={location.pathname === '/about' ? 'active' : ''} onClick={closeMenu}>
                <span>Tentang Kami</span>
              </Link>
              <Link to="/paket" className={location.pathname === '/paket' ? 'active' : ''} onClick={closeMenu}>
                <span>Paket Akses</span>
              </Link>
              <Link to="/faq" className={location.pathname === '/faq' ? 'active' : ''} onClick={closeMenu}>
                <span>Pusat Bantuan</span>
              </Link>
              <Link to="/download" className={location.pathname === '/download' ? 'active' : ''} onClick={closeMenu}>
                <span>Unduh Aplikasi Android</span>
              </Link>
              <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''} onClick={closeMenu}>
                <span>Kontak Sahabat CS</span>
              </Link>
              <Link to="/medical-disclaimer" className={location.pathname === '/medical-disclaimer' ? 'active' : ''} onClick={closeMenu}>
                <span>Penyangkalan Medis</span>
              </Link>
            </nav>

            {/* Subtle Bouncy Chevron Cue (Opsi A) — Only visible if overflowing and not at bottom */}
            {canScrollDown && (
              <button
                type="button"
                className="mobile-menu-scroll-cue"
                onClick={() => menuNavRef.current?.scrollBy({ top: 90, behavior: 'smooth' })}
                aria-label="Gulir menu ke bawah"
              >
                <ChevronDown size={14} />
              </button>
            )}
          </div>

          {/* Mobile Drawer Action Buttons (Opsi 1: Horizontal Row Masuk + Mulai Cerita) */}
          <div className="mobile-drawer-cta-group">
            {user ? (
              <Link to="/dashboard" className="btn-mobile-primary" onClick={closeMenu}>
                <LayoutDashboard size={16} />
                <span>Buka Dashboard</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-mobile-secondary" onClick={closeMenu}>
                  <LogIn size={15} />
                  <span>Masuk</span>
                </Link>
                <Link to="/register" className="btn-mobile-primary" onClick={closeMenu}>
                  <span>Mulai Cerita</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* OUTLET KONTEN UTAMA */}
      <main className="public-main-content">
        <Outlet />
      </main>

      {/* PUBLIC BESTIE FOOTER */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          {/* MAIN FOOTER LINKS */}
          <div className="footer-main-grid">
            {/* Brand Story Column */}
            <div className="footer-brand-summary">
              <div className="footer-brand-row">
                <div className="footer-brand-badge">
                  <Sparkles size={16} />
                </div>
                <span className="footer-brand-name">Skin<span>cluv</span></span>
              </div>
              <p className="footer-brand-desc">
                Pendamping mandiri untuk membaca sinyal kulit, memeriksa komposisi skincare secara jujur, dan merawat diri tanpa rasa overthinking.
              </p>
              <div className="footer-bestie-quote">
                &ldquo;Dengarkan kulitmu, rawat pelan-pelan.&rdquo;
              </div>
            </div>

            {/* Link Column 1: Jelajahi */}
            <div className="footer-links-group">
              <h4>Jelajahi Cerita</h4>
              <ul>
                <li><Link to="/">Beranda Sahabat</Link></li>
                <li><Link to="/about">Tentang Kami &amp; Cerita Meja Rias</Link></li>
                <li><Link to="/paket">Pilihan Paket 30 Hari</Link></li>
                <li><Link to="/download">Unduh Aplikasi Android (.APK)</Link></li>
                <li><Link to="/faq">Tanya Jawab (FAQ)</Link></li>
              </ul>
            </div>

            {/* Link Column 2: Bantuan & Transparansi */}
            <div className="footer-links-group">
              <h4>Bantuan &amp; Etika</h4>
              <ul>
                <li><Link to="/contact">Hubungi Sahabat CS</Link></li>
                <li><Link to="/medical-disclaimer">Penyangkalan Medis (Non-Terapeutik)</Link></li>
                <li><Link to="/refund-policy">Kebijakan Pengembalian Dana</Link></li>
                <li><Link to="/terms">Syarat &amp; Ketentuan</Link></li>
                <li><Link to="/privacy">Kebijakan Privasi &amp; Data</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-soft-divider" />

          {/* FOOTER BOTTOM */}
          <div className="footer-bottom-row">
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Skincluv. Dibuat dengan kasih sayang untuk kesehatan kulitmu.
            </p>
            <p className="footer-disclaimer-note">
              <strong>Penyangkalan Medis:</strong> Skincluv adalah perangkat lunak edukasi analitik kosmetik independen, bukan fasilitas telemedisin klinis dan bukan apotek. Observasi algoritmik BUKAN diagnosis medis dan tidak menggantikan konsultasi langsung dengan dokter spesialis dermatologi (Sp.DVE/Sp.KK).
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
