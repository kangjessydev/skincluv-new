// src/hooks/useNotifications.ts
// Hook terpusat untuk mengelola notifikasi dan menghitung unread count secara real-time
// Digunakan oleh AppLayout (ikon Bell Topbar) dan NotificationsPage.

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
  CreditCard,
  Sparkles,
  ScanFace,
  MessageSquare,
  Calendar,
  ShieldCheck,
  FlaskConical,
  HeartPulse,
  Award,
} from 'lucide-react'

export interface NotificationItem {
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

export function useNotifications() {
  const { user, activeSkinProfile } = useAuthStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const storageKey = user?.id ? `skincluv_read_notifs_${user.id}` : null

  // Load read status from localStorage
  const loadReadIds = useCallback(() => {
    if (!storageKey) return []
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [storageKey])

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const notifs: NotificationItem[] = []
      const now = Date.now()

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

      // Sample activity notifications to ensure total 10 messages for testing scroll behavior
      const sampleFeedList: NotificationItem[] = [
        {
          id: 'notif_sample_mission_explorer',
          title: 'Pencapaian: Skincare Explorer!',
          body: 'Selamat! Kamu telah memindai 3 formulasi produk skincare. Ambil bonus pencapaian +10 Credits.',
          category: 'mission',
          timeAgo: '2 hari lalu',
          timestamp: now - 1000 * 60 * 60 * 48,
          actionUrl: '/missions',
          icon: Award,
          color: 'is-gold',
          badgeText: 'Prestasi',
          badgeVariant: 'gold',
        },
        {
          id: 'notif_sample_ingredient_scan',
          title: 'Analisis Komposisi Tersimpan',
          body: 'Tabir Surya SPF 50 berhasil dipetakan: 0 bahan komedogenik terdeteksi dan aman untuk kulit sensitif.',
          category: 'activity',
          timeAgo: '3 hari lalu',
          timestamp: now - 1000 * 60 * 60 * 72,
          actionUrl: '/scan-history',
          icon: FlaskConical,
          color: 'is-teal',
          badgeText: 'Komposisi',
          badgeVariant: 'teal',
        },
        {
          id: 'notif_sample_knowledge_update',
          title: 'Update Literatur Dermatologi',
          body: 'Basis pengetahuan klinis diperbarui: 12 studi interaksi Niacinamide & Retinol siap dijelaskan Skinsistant AI.',
          category: 'activity',
          timeAgo: '4 hari lalu',
          timestamp: now - 1000 * 60 * 60 * 96,
          actionUrl: '/chatbot',
          icon: ShieldCheck,
          color: 'is-purple',
          badgeText: 'Riset AI',
          badgeVariant: 'slate',
        },
        {
          id: 'notif_sample_skin_barrier_trend',
          title: 'Tren Kesehatan Skin Barrier',
          body: 'Indeks kelembapan kulit meningkat +5 poin dalam 2 minggu terakhir. Terus pertahankan hidrasi harian!',
          category: 'activity',
          timeAgo: '5 hari lalu',
          timestamp: now - 1000 * 60 * 60 * 120,
          actionUrl: '/scan-history',
          icon: HeartPulse,
          color: 'is-teal',
          badgeText: 'Progres',
          badgeVariant: 'teal',
        },
        {
          id: 'notif_sample_promo_renewal',
          title: 'Katalog Paket Akses Tersedia',
          body: 'Lihat pilihan paket langganan Glow Club atau Pro Club untuk kuota scan tak terbatas dan model analisis klinis.',
          category: 'transaction',
          timeAgo: '6 hari lalu',
          timestamp: now - 1000 * 60 * 60 * 144,
          actionUrl: '/paket',
          icon: CreditCard,
          color: 'is-rose',
          badgeText: 'Info Paket',
          badgeVariant: 'rose',
        },
        {
          id: 'notif_sample_weekly_recap',
          title: 'Ringkasan Rutinitas Mingguan',
          body: 'Kamu telah menyelesaikan 5 dari 7 target check-in minggu ini. Konsistensi merawat kulit membuahkan hasil nyata.',
          category: 'mission',
          timeAgo: '1 minggu lalu',
          timestamp: now - 1000 * 60 * 60 * 168,
          actionUrl: '/missions',
          icon: Sparkles,
          color: 'is-gold',
          badgeText: 'Mingguan',
          badgeVariant: 'gold',
        },
      ]

      for (const sample of sampleFeedList) {
        if (notifs.length >= 10) break
        if (!notifs.some((n) => n.id === sample.id)) {
          notifs.push(sample)
        }
      }

      // Sort notifications by timestamp descending and take top 10
      notifs.sort((a, b) => b.timestamp - a.timestamp)
      const top10Notifs = notifs.slice(0, 10)
      setNotifications(top10Notifs)
      setReadIds(loadReadIds())
    } catch (err) {
      console.error('[useNotifications] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, activeSkinProfile?.skin_type, activeSkinProfile?.skin_concerns, loadReadIds])

  // Initial fetch and listener for notification updates
  useEffect(() => {
    fetchNotifications()

    const handleUpdate = () => {
      setReadIds(loadReadIds())
    }

    window.addEventListener('cluv:notifications-updated', handleUpdate)
    return () => {
      window.removeEventListener('cluv:notifications-updated', handleUpdate)
    }
  }, [fetchNotifications, loadReadIds])

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    if (!storageKey) return
    setReadIds((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch (e) {
        console.warn('Failed to save read notification:', e)
      }
      return updated
    })
    window.dispatchEvent(new CustomEvent('cluv:notifications-updated'))
  }, [storageKey])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (!storageKey) return
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds))
    } catch (e) {
      console.warn('Failed to save all read notifications:', e)
    }
    window.dispatchEvent(new CustomEvent('cluv:notifications-updated'))
  }, [storageKey, notifications])

  // Compute unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length
  }, [notifications, readIds])

  return {
    notifications,
    readIds,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  }
}
