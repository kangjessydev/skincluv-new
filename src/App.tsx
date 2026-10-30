import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from '@/hooks/useAuthInit'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import ScrollToTop from '@/components/layout/ScrollToTop'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PageLoader from '@/components/ui/PageLoader'

// Eager load core entry routes for instant initial render
import LoginPage from '@/pages/auth/LoginPage'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/app/DashboardPage'

// Lazy load user feature pages
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('@/pages/auth/AuthCallbackPage'))
const FaceScanPage = lazy(() => import('@/pages/app/FaceScanPage'))
const ScanHistoryPage = lazy(() => import('@/pages/app/ScanHistoryPage'))
const IngredientScanPage = lazy(() => import('@/pages/app/IngredientScanPage'))
const ChatbotPage = lazy(() => import('@/pages/app/ChatbotPage'))
const MissionsPage = lazy(() => import('@/pages/app/MissionsPage'))
const PricingPage = lazy(() => import('@/pages/app/PricingPage'))
const AppPricingPage = lazy(() => import('@/pages/app/AppPricingPage'))
const AppFaqPage = lazy(() => import('@/pages/app/AppFaqPage'))
const CheckoutPage = lazy(() => import('@/pages/app/CheckoutPage'))
const TransactionHistoryPage = lazy(() => import('@/pages/app/TransactionHistoryPage'))
const CoinHistoryPage = lazy(() => import('@/pages/app/CoinHistoryPage'))
const PaymentSuccessPage = lazy(() => import('@/pages/app/PaymentSuccessPage'))
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'))
const ProfileSkinPage = lazy(() => import('@/pages/profile/ProfileSkinPage'))
const ProfileBillingPage = lazy(() => import('@/pages/profile/ProfileBillingPage'))
const PrivacyCenterPage = lazy(() => import('@/pages/app/PrivacyCenterPage'))
const NotificationsPage = lazy(() => import('@/pages/app/NotificationsPage'))

// Lazy load admin portal & routes
const AdminRoute = lazy(() => import('@/components/admin/AdminRoute'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminPromptsPage = lazy(() => import('@/pages/admin/AdminPromptsPage'))
const AdminModelsPage = lazy(() => import('@/pages/admin/AdminModelsPage'))
const AdminMissionsPage = lazy(() => import('@/pages/admin/AdminMissionsPage'))
const AdminPricingPage = lazy(() => import('@/pages/admin/AdminPricingPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminLogsPage = lazy(() => import('@/pages/admin/AdminLogsPage'))
const AdminKnowledgeBasePage = lazy(() => import('@/pages/admin/AdminKnowledgeBasePage'))
const AdminHandbookPage = lazy(() => import('@/pages/admin/AdminHandbookPage'))
const AdminProductFormulasPage = lazy(() => import('@/pages/admin/AdminProductFormulasPage'))
const AdminTrainingDatasetsPage = lazy(() => import('@/pages/admin/AdminTrainingDatasetsPage'))
const AdminTransactionsPage = lazy(() => import('@/pages/admin/AdminTransactionsPage'))
const AdminFinancialsPage = lazy(() => import('@/pages/admin/AdminFinancialsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminMarketIntelligencePage = lazy(() => import('@/pages/admin/AdminMarketIntelligencePage'))
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'))
const AdminSystemHealthPage = lazy(() => import('@/pages/admin/AdminSystemHealthPage'))
const TermsPage = lazy(() => import('@/pages/public/TermsPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPolicyPage'))
const MedicalDisclaimerPage = lazy(() => import('@/pages/public/MedicalDisclaimerPage'))
const RefundPolicyPage = lazy(() => import('@/pages/public/RefundPolicyPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const FaqPage = lazy(() => import('@/pages/public/FaqPage'))
const DownloadPage = lazy(() => import('@/pages/public/DownloadPage'))
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))
const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'))
const DesignSystemPage = lazy(() => import('@/pages/DesignSystemPage'))

export default function App() {
  useAuthInit()

  const { user, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Route>

        {/* Public regulatory, trust, & informational routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          {!user && (
            <>
              <Route path="/paket" element={<PricingPage />} />
              <Route path="/pricing" element={<Navigate to="/paket" replace />} />
              <Route path="/faq" element={<FaqPage />} />
            </>
          )}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/unduh" element={<Navigate to="/download" replace />} />
        </Route>

        {/* Cluv Framework Living Design System Documentation Portal */}
        <Route path="/design-system" element={<DesignSystemPage />} />
        <Route path="/docs" element={<Navigate to="/design-system" replace />} />

        {/* Protected app routes */}
        <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/beranda-2" element={<Navigate to="/dashboard" replace />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route path="/face-scan" element={<FaceScanPage />} />
          <Route path="/scan-history" element={<ScanHistoryPage />} />
          <Route path="/ingredient-scan" element={<IngredientScanPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/chatbot/:sessionId" element={<ChatbotPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/paket" element={<AppPricingPage />} />
          <Route path="/pricing" element={<Navigate to="/paket" replace />} />
          <Route path="/faq" element={<AppFaqPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:reference" element={<CheckoutPage />} />
          <Route path="/transactions" element={<TransactionHistoryPage />} />
          <Route path="/coin-history" element={<CoinHistoryPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/skin" element={<ProfileSkinPage />} />
          <Route path="/profile/billing" element={<ProfileBillingPage />} />
          <Route path="/privacy-center" element={<PrivacyCenterPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/wallet" element={<Navigate to="/paket" replace />} />
        </Route>

        {/* Protected admin routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            {/* Bisnis & Transaksi */}
            <Route path="/admin/market-intelligence" element={<AdminMarketIntelligencePage />} />
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="/admin/financials" element={<AdminFinancialsPage />} />
            <Route path="/admin/pricing" element={<AdminPricingPage />} />

            {/* Pengguna & CRM */}
            <Route path="/admin/users" element={<AdminUsersPage />} />

            {/* Konfigurasi Sistem */}
            <Route path="/admin/prompts" element={<AdminPromptsPage />} />
            <Route path="/admin/models" element={<AdminModelsPage />} />
            <Route path="/admin/missions" element={<AdminMissionsPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />

            {/* AI Knowledge Hub */}
            <Route path="/admin/knowledge/handbook" element={<AdminHandbookPage />} />
            <Route path="/admin/knowledge/ingredients" element={<AdminKnowledgeBasePage />} />
            <Route path="/admin/knowledge/formulas" element={<AdminProductFormulasPage />} />
            <Route path="/admin/training/datasets" element={<AdminTrainingDatasetsPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />

            {/* Tata Kelola & Audit */}
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/system-health" element={<AdminSystemHealthPage />} />
          </Route>
        </Route>

        {/* Fallback 404 Catch-All */}
        <Route element={<PublicLayout />}>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
    </>
  )
}
