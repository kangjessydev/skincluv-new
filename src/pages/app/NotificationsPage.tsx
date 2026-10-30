// src/pages/app/NotificationsPage.tsx
// Halaman Notifikasi Pengguna Skincluv — Mobile-First Actionable Feed
// Terhubung secara kontekstual ke status transaksi, misi, riwayat scan, dan wawasan AI.

import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Loader2,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const {
    notifications,
    readIds,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

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
            className="cluv-notif-mark-btn"
            onClick={markAllAsRead}
          >
            <CheckCheck size={13} />
            <span>Tandai Dibaca</span>
          </button>
        )}
      </div>

      {/* Notification Feed List Container */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <Loader2 size={24} className="animate-spin cluv-text-teal cluv-mx-auto cluv-mb-2" />
          <span className="cluv-caption cluv-text-muted">Memuat notifikasi terbaru...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-12">
          <Bell size={36} className="cluv-text-muted cluv-mx-auto cluv-mb-2" />
          <h4 className="cluv-title-card cluv-text-dark cluv-mb-1">Belum Ada Notifikasi</h4>
          <p className="cluv-caption cluv-text-muted cluv-m-0">
            Semua pembaruan aktivitas dan transaksi kamu akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="cluv-feed-card">
          {notifications.map((item) => {
            const isUnread = !readIds.includes(item.id)
            const IconComponent = item.icon

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={`cluv-notif-item ${isUnread ? 'is-unread' : ''}`}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleItemClick(item)
                  }
                }}
              >
                <div className={`cluv-notif-icon-wrap ${item.color}`}>
                  <IconComponent size={18} strokeWidth={2.2} />
                </div>

                <div className="cluv-notif-content">
                  <div className="cluv-notif-header-row">
                    <div className="cluv-notif-title-wrap">
                      {item.badgeText && (
                        <Badge variant={item.badgeVariant || 'slate'} size="sm">
                          {item.badgeText}
                        </Badge>
                      )}
                      <h4 className="cluv-notif-title">{item.title}</h4>
                    </div>

                    <div className="cluv-notif-meta-wrap">
                      <span className="cluv-notif-time">{item.timeAgo}</span>
                      {isUnread && <span className="cluv-notif-dot" title="Belum dibaca" />}
                    </div>
                  </div>

                  <p className="cluv-notif-body">{item.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
