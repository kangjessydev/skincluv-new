// src/pages/app/NotificationsPage.tsx
// Halaman Notifikasi Pengguna Skincluv — Mobile-First Actionable Feed
// Terhubung secara kontekstual ke status transaksi, misi, riwayat scan, dan wawasan AI.

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CreditCard,
  Sparkles,
  ScanFace,
  MessageSquare,
  CheckCheck,
  ChevronRight,
  Loader2,
  Calendar,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Badge, Button } from '@/components/ui'

type NotifCategory = 'all' | 'transaction' | 'mission' | 'activity'

interface NotificationItem {
  id: string
  title: string
  body: string
  category: 'transaction' | 'mission' | 'activity'
  timeAgo: string
  timestamp: number
  actionUrl: string
  icon: any
  color: 'is-teal' | 'is-gold' | 'is-purple' | 'is-rose'
  badgeText?: string
  badgeVariant?: 'teal' | 'gold' | 'rose' | 'slate'
}

export default function NotificationsPage() {
  const { user, activeSkinProfile } = useAuthStore()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NotifCategory>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<string[]>([])

  const storageKey = user?.id ? `skincluv_read_notifs_${user.id}` : null

  // Load read notifications from localStorage
  useEffect(() => {
    if (!storageKey) return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setReadIds(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Failed to parse read notifications:', e)
    }
  }, [storageKey])

  // Save read notification IDs to localStorage
  const markAsRead = (id: string) => {
    if (!storageKey) return
    setReadIds((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      localStorage.setItem(storageKey, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('cluv:notifications-updated'))
      return updated
    })
  }

  const markAllAsRead = () => {
    if (!storageKey) return
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    localStorage.setItem(storageKey, JSON.stringify(allIds))
    window.dispatchEvent(new CustomEvent('cluv:notifications-updated'))
  }

  // Fetch real contextual notifications based on user data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      setLoading(true)
      const notifs: NotificationItem[] = []
      const now = Date.now()

      try {
        // 1. Check Tripay Invoices (Unpaid and Recent Paid)
        const { data: invoices } = await supabase
          .from('tripay_invoices')
          .select('id, merchant_ref, plan, status, created_at, expired_at, paid_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        if (invoices && invoices.length > 0) {
          invoices.forEach((inv) => {
            const createdMs = new Date(inv.created_at).getTime()
            if (inv.status === 'UNPAID') {
              const isExpired = inv.expired_at ? new Date(inv.expired_at).getTime() < now : false
              if (!isExpired) {
                notifs.push({
                  id: `inv_unpaid_${inv.id}`,
                  title: 'Menunggu Pembayaran',
                  body: `Tagihan ${inv.plan || 'Paket'} belum dibayar. Selesaikan sebelum batas waktu berakhir.`,
                  category: 'transaction',
                  timeAgo: 'Menunggu',
                  timestamp: createdMs,
                  actionUrl: `/checkout/${inv.merchant_ref}`,
                  icon: CreditCard,
                  color: 'is-rose',
                  badgeText: 'Belum Bayar',
                  badgeVariant: 'rose',
                })
              }
            } else if (inv.status === 'PAID') {
              notifs.push({
                id: `inv_paid_${inv.id}`,
                title: 'Pembayaran Berhasil',
                body: `Akses paket ${inv.plan || 'Skincluv'} kamu telah aktif! Kuota Universal AI siap digunakan.`,
                category: 'transaction',
                timeAgo: 'Selesai',
                timestamp: inv.paid_at ? new Date(inv.paid_at).getTime() : createdMs,
                actionUrl: '/profile/billing',
                icon: ShieldCheck,
                color: 'is-teal',
                badgeText: 'Lunas',
                badgeVariant: 'teal',
              })
            }
          })
        }

        // 2. Check Missions & User Progress
        const { data: dbMissions } = await supabase
          .from('missions')
          .select('id, slug, name, coin_reward, target_count, type')
          .eq('is_active', true)

        const { data: userMissions } = await supabase
          .from('user_missions')
          .select('mission_id, current_count, is_completed, last_activity, completed_at')
          .eq('user_id', user.id)

        if (dbMissions && dbMissions.length > 0) {
          const isSameDay = (dateStr?: string | null) => {
            if (!dateStr) return false
            return new Date(dateStr).toDateString() === new Date().toDateString()
          }

          let readyToClaimCount = 0
          let totalReadyReward = 0
          let isLoginDoneToday = false

          dbMissions.forEach((m) => {
            const up = userMissions?.find((u) => u.mission_id === m.id)
            const progress = (m.type === 'daily' && !isSameDay(up?.last_activity)) ? 0 : (up?.current_count ?? 0)
            const isCompleted = (m.type === 'daily' && !isSameDay(up?.completed_at)) ? false : (up?.is_completed ?? false)

            if (m.slug === 'daily_login' && isCompleted) {
              isLoginDoneToday = true
            }

            if (!isCompleted && progress >= (m.target_count ?? 1)) {
              readyToClaimCount++
              totalReadyReward += m.coin_reward
            }
          })

          if (readyToClaimCount > 0) {
            notifs.push({
              id: `mission_ready_${readyToClaimCount}_${new Date().toDateString()}`,
              title: 'Hadiah Misi Siap Diambil!',
              body: `Kamu telah menyelesaikan ${readyToClaimCount} misi. Klaim sekarang dan dapatkan +${totalReadyReward} AI Credits!`,
              category: 'mission',
              timeAgo: 'Hari ini',
              timestamp: now - 1000 * 60 * 15,
              actionUrl: '/missions',
              icon: Sparkles,
              color: 'is-gold',
              badgeText: 'Klaim Siap',
              badgeVariant: 'gold',
            })
          }

          if (!isLoginDoneToday) {
            notifs.push({
              id: `daily_checkin_${new Date().toDateString()}`,
              title: 'Check-in Harian Menunggumu',
              body: 'Buka misi hari ini untuk mengklaim bonus streak login harian +2 Credits.',
              category: 'mission',
              timeAgo: 'Pagi ini',
              timestamp: now - 1000 * 60 * 60,
              actionUrl: '/missions',
              icon: Calendar,
              color: 'is-gold',
              badgeText: 'Bonus',
              badgeVariant: 'gold',
            })
          }
        }

        // 3. Check Face Scans History (Skin Journey Reminder)
        const { data: scans } = await supabase
          .from('face_scans')
          .select('id, created_at, overall_score, skin_status_title')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!scans || scans.length === 0) {
          notifs.push({
            id: 'scan_first_time_reminder',
            title: 'Mulai Observasi Wajah Pertama',
            body: 'Ambil foto wajah dengan pencahayaan cukup untuk memetakan kondisi kulit dan target perawatanmu.',
            category: 'activity',
            timeAgo: 'Aktivitas',
            timestamp: now - 1000 * 60 * 60 * 5,
            actionUrl: '/face-scan',
            icon: ScanFace,
            color: 'is-teal',
            badgeText: 'Mulai',
            badgeVariant: 'teal',
          })
        } else {
          const lastScan = scans[0]
          const lastScanDate = new Date(lastScan.created_at)
          const daysSinceLast = Math.floor((now - lastScanDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysSinceLast >= 7) {
            notifs.push({
              id: `scan_weekly_reminder_${daysSinceLast}`,
              title: 'Waktunya Cek Progres Kulit',
              body: `Sudah ${daysSinceLast} hari sejak observasi terakhir. Ambil foto baru untuk melihat perkembangan skin barrier kamu.`,
              category: 'activity',
              timeAgo: `${daysSinceLast} hari lalu`,
              timestamp: now - 1000 * 60 * 60 * 12,
              actionUrl: '/face-scan',
              icon: ScanFace,
              color: 'is-teal',
              badgeText: 'Rutin',
              badgeVariant: 'teal',
            })
          } else {
            notifs.push({
              id: `scan_recent_score_${lastScan.id}`,
              title: `Hasil Scan Wajah (${lastScan.overall_score ?? 80}/100)`,
              body: `${lastScan.skin_status_title || 'Observasi Kulit Optimal'}. Buka riwayat untuk melihat rekomendasi bahan aktif.`,
              category: 'activity',
              timeAgo: daysSinceLast === 0 ? 'Hari ini' : `${daysSinceLast} hari lalu`,
              timestamp: lastScanDate.getTime(),
              actionUrl: '/scan-history',
              icon: ScanFace,
              color: 'is-teal',
              badgeText: 'Tersimpan',
              badgeVariant: 'slate',
            })
          }
        }

        // 4. Personalized AI Skin Insight from Skinsistant
        const skinType = activeSkinProfile?.skin_type || 'Kombinasi'
        const skinConcerns = Array.isArray(activeSkinProfile?.skin_concerns) && activeSkinProfile.skin_concerns.length > 0
          ? activeSkinProfile.skin_concerns.slice(0, 2).join(' & ')
          : 'Hidrasi Kulit'

        notifs.push({
          id: `ai_tip_${skinType}_${new Date().toDateString()}`,
          title: `Tips Cerdas Kulit ${skinType}`,
          body: `Untuk fokus ${skinConcerns}, tanyakan kombinasi bahan aktif terbaik pada Skinsistant AI hari ini.`,
          category: 'activity',
          timeAgo: '1 hari lalu',
          timestamp: now - 1000 * 60 * 60 * 24,
          actionUrl: '/chatbot',
          icon: MessageSquare,
          color: 'is-purple',
          badgeText: 'Tips AI',
          badgeVariant: 'slate',
        })

        // Sort notifications by timestamp descending
        notifs.sort((a, b) => b.timestamp - a.timestamp)
        setNotifications(notifs)
      } catch (err) {
        console.error('[NotificationsPage] Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user?.id, activeSkinProfile?.skin_type, activeSkinProfile?.skin_concerns])

  // Filtered Notifications
  const filteredNotifs = useMemo(() => {
    if (activeTab === 'all') return notifications
    return notifications.filter((n) => n.category === activeTab)
  }, [notifications, activeTab])

  // Unread Count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length
  }, [notifications, readIds])

  const filterTabs = [
    { key: 'all' as NotifCategory, label: 'Semua', count: notifications.length },
    { key: 'transaction' as NotifCategory, label: 'Transaksi', count: notifications.filter((n) => n.category === 'transaction').length },
    { key: 'mission' as NotifCategory, label: 'Misi & Credits', count: notifications.filter((n) => n.category === 'mission').length },
    { key: 'activity' as NotifCategory, label: 'Aktivitas & AI', count: notifications.filter((n) => n.category === 'activity').length },
  ]

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id)
    navigate(item.actionUrl)
  }

  return (
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Desktop Header */}
      <div className="cluv-hide-mobile cluv-mb-5">
        <div className="cluv-flex-between cluv-items-center">
          <div>
            <h1 className="cluv-title-page cluv-m-0">Notifikasi</h1>
            <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-mb-0">
              Pembaruan status transaksi, pengingat misi harian, dan wawasan AI terkini.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              iconLeft={<CheckCheck size={14} />}
              onClick={markAllAsRead}
            >
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Top Sub-Header Bar */}
      <div className="cluv-hide-desktop cluv-flex-between cluv-items-center cluv-mb-3 cluv-mt-1">
        <div className="cluv-flex-row cluv-items-center cluv-gap-2">
          <span className="cluv-font-bold cluv-text-dark cluv-text-sm">Pusat Pesan</span>
          {unreadCount > 0 && (
            <Badge variant="teal" size="sm">
              {unreadCount} Baru
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="cluv-btn-text cluv-text-teal cluv-micro cluv-font-bold cluv-flex-row cluv-items-center cluv-gap-1"
            onClick={markAllAsRead}
          >
            <CheckCheck size={13} />
            <span>Tandai Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Scrollable */}
      <div className="cluv-filter-scroll cluv-mb-3" role="tablist" aria-label="Filter Notifikasi">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`cluv-chip is-pill ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="cluv-tab-badge cluv-tabular-nums">{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* Notification Feed List Container */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <Loader2 size={24} className="animate-spin cluv-text-teal cluv-mx-auto cluv-mb-2" />
          <span className="cluv-caption cluv-text-muted">Memuat notifikasi terbaru...</span>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <Bell size={36} className="cluv-text-muted cluv-mx-auto cluv-mb-2" />
          <h4 className="cluv-title-card cluv-text-dark cluv-mb-1">Belum Ada Notifikasi</h4>
          <p className="cluv-caption cluv-text-muted cluv-m-0">
            Semua pembaruan aktivitas dan transaksi kamu akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="cluv-feed-card">
          {filteredNotifs.map((item) => {
            const isUnread = !readIds.includes(item.id)
            const IconComponent = item.icon

            return (
              <button
                key={item.id}
                type="button"
                className={`cluv-notif-item ${isUnread ? 'is-unread' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="cluv-notif-left">
                  <div className={`cluv-notif-icon-wrap ${item.color}`}>
                    <IconComponent size={18} strokeWidth={2.2} />
                  </div>
                  <div className="cluv-notif-content">
                    <div className="cluv-notif-title-row">
                      {item.badgeText && (
                        <Badge variant={item.badgeVariant || 'slate'} size="sm">
                          {item.badgeText}
                        </Badge>
                      )}
                      <h4 className="cluv-notif-title">{item.title}</h4>
                    </div>
                    <p className="cluv-notif-body">{item.body}</p>
                    <span className="cluv-notif-time">{item.timeAgo}</span>
                  </div>
                </div>

                <div className="cluv-notif-right">
                  {isUnread && <span className="cluv-notif-dot" title="Belum dibaca" />}
                  <ChevronRight size={16} className="cluv-feed-arrow" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
