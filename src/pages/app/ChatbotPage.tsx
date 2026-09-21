// src/pages/app/ChatbotPage.tsx
// 100% Faithful Port of Claude's Skinsistant AI Chatbot UI — Pure Vanilla CSS, Sticky Input & Zero Page Scroll

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send,
  Sparkles,
  Plus,
  History,
  Trash2,
  Paperclip,
  Loader2,
  MessageSquare,
  Coins,
  Crown,
  Trophy,
  ShieldAlert,
  ShieldCheck,
  Brain,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import FormattedMarkdown from '@/components/ui/FormattedMarkdown'

interface ClinicalMemory {
  id: string
  memory_type: 'allergy' | 'sensitivity' | 'treatment_reaction' | 'preference' | 'skin_trend'
  entity: string
  clinical_fact: string
  confidence_score: number
  created_at: string
}

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  created_at: string
}

interface Session {
  id: string
  title: string | null
  created_at: string
  last_activity?: string
}

// Shortcut deterministik untuk sapaan/basa-basi generik — tidak perlu panggil AI,
// hemat token dan Credit user, response instan.
// PENTING: harus EXACT MATCH (bukan "starts with"/substring) supaya pesan yang
// punya pertanyaan tambahan tetap diteruskan ke AI, bukan ke-intercept di sini.
const TRIVIAL_GREETING_RESPONSES: Record<string, string> = {
  'halo': 'Halo! Ada yang mau kamu tanyain soal kulit atau skincare hari ini? 😊',
  'hai': 'Hai! Ada yang bisa aku bantu soal skincare kamu? 😊',
  'hi': 'Hai! Ada yang bisa aku bantu soal skincare kamu? 😊',
  'hallo': 'Halo! Ada yang mau kamu tanyain soal kulit atau skincare hari ini? 😊',
  'permisi': 'Halo, silakan! Ada yang mau ditanyain soal skincare? 😊',
  'makasih': 'Sama-sama! Semoga membantu ya ✨',
  'terima kasih': 'Sama-sama! Semoga membantu ya ✨',
  'thanks': 'Sama-sama! Semoga membantu ya ✨',
  'ok': 'Oke! Ada lagi yang mau ditanyain? 😊',
  'oke': 'Oke! Ada lagi yang mau ditanyain? 😊',
  'siap': 'Siap! Ada lagi yang bisa aku bantu? 😊',
}

function getTrivialGreetingReply(text: string): string | null {
  const normalized = text.trim().toLowerCase().replace(/[!.?,]+$/g, '')
  return TRIVIAL_GREETING_RESPONSES[normalized] ?? null
}

export default function ChatbotPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()

  const { user, profile, setProfile, coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage, askCoinConfirmation } = useInvokeAI()
  const currentCoins = coinBalance?.balance ?? 0
  const chatbotCost = getFeatureCreditCost('chatbot')
  const isFreeTierOutOfCredits = !hasPaidAiQuota(subscription) && currentCoins < chatbotCost

  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showMemoryModal, setShowMemoryModal] = useState(false)
  const [clinicalMemories, setClinicalMemories] = useState<ClinicalMemory[]>([])
  const [isLoadingMemories, setIsLoadingMemories] = useState(false)
  const [memoryConsent, setMemoryConsent] = useState<boolean | null>(
    profile?.chatbot_memory_consent ?? null
  )
  // Sources dari web search (diisi jika AI memakai Tavily)
  const [lastSources, setLastSources] = useState<Array<{ title: string; url: string; snippet: string }>>([]) // eslint-disable-line
  const [showSources, setShowSources] = useState(false)
  // Consent banner: muncul sekali per sesi browser setelah BANNER_BUBBLE_THRESHOLD bubble
  const BANNER_BUBBLE_THRESHOLD = 8
  const [showConsentBanner, setShowConsentBanner] = useState(false)

  useEffect(() => {
    if (profile?.chatbot_memory_consent !== undefined) {
      setMemoryConsent(profile.chatbot_memory_consent ?? null)
    }
  }, [profile?.chatbot_memory_consent])

  // Banner trigger: muncul setelah BANNER_BUBBLE_THRESHOLD bubble jika memori belum aktif
  useEffect(() => {
    if (!user?.id) return
    const bannerKey = `memory_banner_shown_${user.id}`
    const alreadyShown = sessionStorage.getItem(bannerKey)
    if (
      memoryConsent !== true &&
      messages.length === BANNER_BUBBLE_THRESHOLD &&
      !alreadyShown
    ) {
      setShowConsentBanner(true)
      sessionStorage.setItem(bannerKey, '1')
    }
  }, [messages.length, memoryConsent, user?.id])

  useEffect(() => {
    if (!user?.id) return
    const fetchConsent = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('chatbot_memory_consent')
          .eq('id', user.id)
          .maybeSingle()
        if (data && data.chatbot_memory_consent !== undefined) {
          setMemoryConsent(data.chatbot_memory_consent)
        }
      } catch (err) {
        console.warn('Failed to fetch memory consent:', err)
      }
    }
    fetchConsent()
  }, [user?.id])

  const handleSetMemoryConsent = async (consent: boolean) => {
    if (!user?.id) return
    try {
      await supabase
        .from('profiles')
        .update({ chatbot_memory_consent: consent })
        .eq('id', user.id)

      setMemoryConsent(consent)
      setShowConsentBanner(false)  // dismiss banner setelah user memilih
      if (profile) {
        setProfile({ ...profile, chatbot_memory_consent: consent })
      }

      if (!consent) {
        // Jika memilih Lewati / Nonaktifkan, bersihkan data memori sesuai hak privasi UU Perlindungan Data Pribadi
        await supabase.from('user_clinical_memories').delete().eq('user_id', user.id)
        setClinicalMemories([])
      } else {
        fetchClinicalMemories()
      }
    } catch (err) {
      console.error('Failed to set memory consent:', err)
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchClinicalMemories = useCallback(async () => {
    if (!user?.id) return
    setIsLoadingMemories(true)
    try {
      const { data } = await supabase
        .from('user_clinical_memories')
        .select('id, memory_type, entity, clinical_fact, confidence_score, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (data) setClinicalMemories(data as ClinicalMemory[])
    } catch (err) {
      console.error('Failed to fetch clinical memories:', err)
    } finally {
      setIsLoadingMemories(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchClinicalMemories()
  }, [fetchClinicalMemories])

  const handleDeleteSingleMemory = async (memId: string) => {
    if (!user?.id) return
    try {
      await supabase.from('user_clinical_memories').delete().eq('id', memId).eq('user_id', user.id)
      setClinicalMemories((prev) => prev.filter((m) => m.id !== memId))
    } catch (err) {
      console.error('Error deleting memory:', err)
    }
  }

  const handleClearAllMemories = async () => {
    if (!user?.id) return
    if (!window.confirm('Hapus seluruh memori yang diingat AI tentang kulit Anda? Tindakan ini mematuhi hak penghapusan data pribadi Anda sesuai UU Perlindungan Data Pribadi.')) return
    try {
      await supabase.from('user_clinical_memories').delete().eq('user_id', user.id)
      setClinicalMemories([])
    } catch (err) {
      console.error('Error clearing clinical memories:', err)
    }
  }

  const handleResetCurrentSession = async () => {
    const activeSessionId = sessionId
    if (!activeSessionId) return
    if (!window.confirm('Kosongkan seluruh riwayat obrolan dalam sesi chat ini?')) return
    try {
      await supabase.from('chat_messages').delete().eq('session_id', activeSessionId)
      setMessages([])
      setLastSources([])
      setShowSources(false)
    } catch (err) {
      console.error('Failed to reset current session:', err)
    }
  }

  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'PE'

  // Suggestion Quick Chips for Welcome State
  const suggestionChips = [
    'Rekomendasi ingredient',
    'Tips atasi kemerahan',
    'Susun skincare routine',
    'Bahan aman untuk kulit sensitif',
  ]

  // Fetch sessions list on user load, ordered by last_activity DESC
  useEffect(() => {
    if (!user?.id) return
    const fetchSessions = async () => {
      try {
        const { data } = await supabase
          .from('chat_sessions')
          .select('id, title, created_at, last_activity')
          .eq('user_id', user.id)
          .order('last_activity', { ascending: false, nullsFirst: false })

        if (data) setSessions(data)
      } catch (err) {
        console.error('Failed to fetch sessions:', err)
      }
    }
    fetchSessions()
  }, [user?.id])

  // Fetch messages when URL param `sessionId` changes
  useEffect(() => {
    setLastSources([])
    setShowSources(false)
    if (!sessionId) {
      setMessages([])
      setIsLoadingMessages(false)
      return
    }
    fetchMessages(sessionId)
  }, [sessionId])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])



  const fetchMessages = async (sid: string) => {
    setIsLoadingMessages(true)
    try {
      // Update last_activity timestamp for this active session in DB
      const nowIso = new Date().toISOString()
      supabase
        .from('chat_sessions')
        .update({ last_activity: nowIso })
        .eq('id', sid)
        .then(() => {
          setSessions((prev) =>
            [...prev]
              .map((s) => (s.id === sid ? { ...s, last_activity: nowIso } : s))
              .sort((a, b) => new Date(b.last_activity || b.created_at).getTime() - new Date(a.last_activity || a.created_at).getTime())
          )
        })

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'bot',
            text: m.content,
            created_at: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        )
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const createNewSession = async () => {
    if (!user?.id) return null
    try {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title: 'Diskusi Baru', last_activity: nowIso })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setSessions((prev) => [
          {
            id: data.id,
            title: data.title,
            created_at: data.created_at,
            last_activity: data.last_activity,
          },
          ...prev,
        ])
        return data.id
      }
    } catch (err) {
      console.error('Failed to create session:', err)
    }
    return null
  }

  const handleCreateNewChat = async () => {
    const newSid = await createNewSession()
    if (newSid) {
      setMessages([])
      setLastSources([])
      setShowSources(false)
      navigate(`/chatbot/${newSid}`)
    }
  }

  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await supabase.from('chat_messages').delete().eq('session_id', sid)
      await supabase.from('chat_sessions').delete().eq('id', sid)
      setSessions((prev) => prev.filter((s) => s.id !== sid))
      if (sessionId === sid) {
        navigate('/chatbot')
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText
    if (!query.trim() || isSending) return

    // Shortcut: sapaan/basa-basi generik dijawab instan tanpa panggil AI sama sekali.
    const trivialReply = getTrivialGreetingReply(query)
    if (trivialReply) {
      let activeSessionId = sessionId
      if (!activeSessionId) {
        const newSid = await createNewSession()
        if (!newSid) return
        activeSessionId = newSid
        navigate(`/chatbot/${newSid}`, { replace: true })
      }

      const tempUserMsg: Message = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: query,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      const tempBotMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: trivialReply,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, tempUserMsg, tempBotMsg])
      setInputText('')

      await supabase.from('chat_messages').insert([
        { session_id: activeSessionId, role: 'user', content: query },
        { session_id: activeSessionId, role: 'assistant', content: trivialReply },
      ])

      return
    }

    // Cek apakah akun Free kehabisan kredit sebelum mengirim pesan non-sapaan
    if (isFreeTierOutOfCredits) {
      const confirmed = await askCoinConfirmation(chatbotCost, 'Konsultasi Skinsistant AI')
      if (!confirmed) return
    }

    let activeSessionId = sessionId
    if (!activeSessionId) {
      const newSid = await createNewSession()
      if (!newSid) return
      activeSessionId = newSid
      navigate(`/chatbot/${newSid}`, { replace: true })
    }

    const tempUserMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, tempUserMsg])
    setInputText('')
    setIsSending(true)

    // Save user message to Supabase & update session title / last_activity
    try {
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'user',
        content: query,
      })

      const nowIso = new Date().toISOString()
      const currentSession = sessions.find((s) => s.id === activeSessionId)
      const isDefaultTitle = !currentSession?.title || currentSession?.title === 'Diskusi Baru'
      const autoTitle = query.trim().length > 30 ? query.trim().substring(0, 30) + '...' : query.trim()

      const updatePayload: { last_activity: string; title?: string } = { last_activity: nowIso }
      if (isDefaultTitle) {
        updatePayload.title = autoTitle
      }

      await supabase
        .from('chat_sessions')
        .update(updatePayload)
        .eq('id', activeSessionId)

      setSessions((prev) =>
        [...prev]
          .map((s) => (s.id === activeSessionId ? { ...s, ...updatePayload } : s))
          .sort((a, b) => new Date(b.last_activity || b.created_at).getTime() - new Date(a.last_activity || a.created_at).getTime())
      )
    } catch (err) {
      console.error('Error saving user message:', err)
    }

    // Call Supabase Edge Function AI Chat endpoint with extended context window
    try {
      const isProUser = (subscription as any)?.subscription_tiers?.slug === 'premium'
      const maxHistory = isProUser ? 20 : 14
      const historyFormatted = messages.slice(-maxHistory).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }))

      const res = await invoke({
        feature_slug: 'chatbot',
        messages: [...historyFormatted, { role: 'user', content: query }],
        session_id: activeSessionId,
        message_count: messages.length + 1,  // +1 untuk pesan user yang baru dikirim
      })

      if (res) {
        const botReply = res.content || res.reply || res.data?.reply || res.data?.answer || res.data?.text || 'Maaf, saya tidak dapat memproses tanggapan saat ini.'

        const tempBotMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }

        setMessages((prev) => [...prev, tempBotMsg])

        // Simpan sources dari web search (jika ada)
        const resSources = (res as any).sources
        if (Array.isArray(resSources) && resSources.length > 0) {
          setLastSources(resSources)
          setShowSources(false) // reset accordion
        } else {
          setLastSources([])
        }

        // Save bot message to Supabase
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          role: 'assistant',
          content: botReply,
        })

        // Segarkan memori klinis jika AI mendeteksi fakta baru di latar belakang
        setTimeout(() => {
          fetchClinicalMemories()
        }, 1500)
      } else {
        setLastSources([])
        // Fallback bubble informatif jika invoke gagal atau credits habis — bukan hening/tidak ada respon
        const noticeText = `⚠️ **Credits kamu tidak mencukupi** untuk konsultasi ini (butuh ${chatbotCost} Credit). Kamu bisa mengumpulkan Credits gratis dengan menyelesaikan [Misi Harian](/missions) atau [Tingkatkan Akun](/pricing) ke Paket Glow / PRO untuk kuota bulanan.`
        const tempBotMsg: Message = {
          id: `insufficient-${Date.now()}`,
          sender: 'bot',
          text: noticeText,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, tempBotMsg])
      }
    } catch (err) {
      console.error('AI invoke error:', err)
      setLastSources([])
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ Maaf, ada gangguan koneksi ke server AI. Credit-mu tidak berkurang. Coba kirim pesan lagi ya.',
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="skinsistant-chat-root">
      {/* COIN CONFIRMATION MODAL */}
      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={true}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={currentCoins}
          featureName={pendingCoinConfirm.featureName || 'Skinsistant AI Chat'}
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* CHAT UTILITY BAR (Riwayat Chat, Memori Percakapan, Reset Sesi & Chat Baru) */}
      <div className="chat-util-bar">
        <div className="chat-util-left">
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="util-btn util-history-btn"
          >
            <History size={16} />
            <span>Riwayat ({sessions.length})</span>
          </button>

          <button
            onClick={() => {
              fetchClinicalMemories()
              setShowMemoryModal(true)
            }}
            className="util-btn util-memory-btn"
            title="Memori Percakapan (Sesuai UU Perlindungan Data Pribadi)"
          >
            <Brain size={16} />
            <span>Memori ({clinicalMemories.length})</span>
          </button>
        </div>

        <div className="chat-util-right">
          {sessionId && messages.length > 0 && (
            <button
              onClick={handleResetCurrentSession}
              className="util-btn util-reset-btn"
              title="Kosongkan pesan dalam sesi ini"
            >
              <Trash2 size={15} />
              <span>Reset Sesi</span>
            </button>
          )}

          <button onClick={handleCreateNewChat} className="util-btn util-new-btn">
            <Plus size={16} />
            <span>Chat Baru</span>
          </button>
        </div>
      </div>

      {/* CONSENT BANNER (SESUAI UU PERLINDUNGAN DATA PRIBADI) */}
      {showConsentBanner && user?.id && (
        <div className="memory-consent-banner">
          <div className="consent-content">
            <div className="consent-title-row">
              <Sparkles size={16} className="text-[#0f6784]" />
              <strong>Aktifkan Memori Skinsistant?</strong>
            </div>
            <p>
              AI akan mengingat hal penting dari obrolanmu (seperti bahan yang memicu iritasi, alergi, atau preferensi skincare-mu) supaya saran konsultasi berikutnya makin personal dan aman. Sesuai UU Perlindungan Data Pribadi — kamu bebas melihat, mematikan, atau menghapusnya kapan saja.
            </p>
          </div>
          <div className="consent-action-buttons">
            <button
              type="button"
              className="consent-btn-accept"
              onClick={() => handleSetMemoryConsent(true)}
            >
              Aktifkan
            </button>
            <button
              type="button"
              className="consent-btn-dismiss"
              onClick={() => handleSetMemoryConsent(false)}
            >
              Lewati
            </button>
          </div>
        </div>
      )}

      {/* MEMORY MODAL (SESUAI UU PERLINDUNGAN DATA PRIBADI) */}
      {showMemoryModal && (
        <div className="history-drawer-overlay" onClick={() => setShowMemoryModal(false)}>
          <div className="history-drawer clinical-memory-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                <h3>Memori Percakapan &amp; Hak Privasi</h3>
              </div>
              <button onClick={() => setShowMemoryModal(false)} className="drawer-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="uupdp-compliance-card">
                <div className="uupdp-badge">
                  <ShieldCheck size={13} /> Sesuai UU Perlindungan Data Pribadi
                </div>
                <p>
                  <strong>Prinsip Minimisasi Data &amp; Isolasi Pribadi:</strong> AI hanya mengingat hal penting (seperti alergi, sensitivitas bahan, atau preferensi skincare) yang Anda diskusikan agar konsultasi berikutnya selalu aman dan relevan. Memori ini 100% terisolasi untuk akun Anda dan tidak dapat dibaca admin ataupun pihak ketiga.
                </p>
                <div className="uupdp-rights">
                  <span>✓ Hak Akses &amp; Hapus Data Pribadi</span>
                  <span>✓ Isolasi Sandboxing Terenkripsi</span>
                </div>
              </div>

              {/* Status Consent Toggle */}
              <div className="memory-consent-toggle-row">
                <div className="consent-status-label">
                  <span>Status Memori Percakapan: </span>
                  <strong className={memoryConsent ? 'text-emerald-600' : 'text-slate-500'}>
                    {memoryConsent ? 'Aktif' : 'Nonaktif'}
                  </strong>
                </div>
                <button
                  type="button"
                  className={`consent-toggle-btn ${memoryConsent ? 'btn-disable' : 'btn-enable'}`}
                  onClick={() => handleSetMemoryConsent(!memoryConsent)}
                >
                  {memoryConsent ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>

              <div className="memories-section-header">
                <h4>Fakta yang Diingat ({clinicalMemories.length})</h4>
                {clinicalMemories.length > 0 && (
                  <button
                    onClick={handleClearAllMemories}
                    className="clear-all-memories-btn"
                    title="Hapus seluruh memori"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              {isLoadingMemories ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : clinicalMemories.length === 0 ? (
                <div className="empty-memories-box">
                  <Brain size={28} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Belum ada memori klinis tersimpan.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Saat Anda menyebut alergi atau bahan yang membuat kulit iritasi (misal: "kulitku alergi parfum"), AI akan otomatis mengingatnya.
                  </p>
                </div>
              ) : (
                <div className="clinical-memories-list">
                  {clinicalMemories.map((m) => (
                    <div key={m.id} className="clinical-memory-card">
                      <div className="memory-card-top">
                        <span className={`memory-type-badge type-${m.memory_type}`}>
                          {m.memory_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleDeleteSingleMemory(m.id)}
                          className="delete-memory-btn"
                          title="Hapus fakta memori ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="memory-entity-name">{m.entity}</div>
                      <div className="memory-fact-text">{m.clinical_fact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY SESSIONS POPOVER / DRAWER */}
      {showHistoryModal && (
        <div className="history-drawer-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Riwayat Percakapan</h3>
              <button onClick={() => setShowHistoryModal(false)} className="drawer-close-btn">
                ×
              </button>
            </div>
            <div className="drawer-body">
              {sessions.length === 0 ? (
                <p className="empty-history-text">Belum ada riwayat percakapan.</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      navigate(`/chatbot/${s.id}`)
                      setShowHistoryModal(false)
                    }}
                    className={`history-session-item ${sessionId === s.id ? 'active' : ''}`}
                  >
                    <MessageSquare size={16} className="shrink-0 text-slate-400" />
                    <span className="session-title-text">{s.title || 'Percakapan'}</span>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="delete-session-btn"
                      title="Hapus percakapan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CHAT SCROLL AREA (Only message list scrolls internally) */}
      <div className="chat-scroll-area">
        {messages.length === 0 && !isLoadingMessages && (
          <div className="chat-welcome-box">
            <div className="welcome-avatar-icon">
              <Sparkles size={28} className="text-[#0f6784]" />
            </div>
            <h2>Halo, {userName}! 👋</h2>
            <p>
              Saya <b>Skinsistant AI</b>, asisten konsultasi kulit pribadi Anda. Tanyakan apa saja mengenai masalah kulit, rutinitas skincare, atau analisis komposisi produk.
            </p>
            <div className="welcome-chips-grid">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="welcome-chip-item"
                  onClick={() => handleSendMessage(chip)}
                >
                  <Sparkles size={14} />
                  <span>{chip}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoadingMessages && (
          <div className="loading-chat-state">
            <Loader2 size={24} className="animate-spin text-[#0f6784]" />
            <span>Memuat pesan percakapan...</span>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-row ${msg.sender}`}>
            {msg.sender === 'bot' && (
              <div className="chat-avatar bot-avatar">
                <Sparkles size={15} />
              </div>
            )}

            <div className="bubble-wrapper">
              <div className="chat-bubble">
                {msg.sender === 'bot' ? (
                  <FormattedMarkdown content={msg.text} userName={userName} />
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
              <span className="chat-timestamp">{msg.created_at}</span>
            </div>

            {msg.sender === 'user' && (
              <div className="chat-avatar user-avatar">{userInitials}</div>
            )}
          </div>
        ))}

        {/* SOURCES ACCORDION — tampil di bawah pesan AI terakhir jika ada hasil search */}
        {messages.length > 0 && lastSources.length > 0 && !isSending && (
          <div className="chat-row bot">
            <div className="chat-avatar bot-avatar" style={{ visibility: 'hidden' }}>
              <Sparkles size={15} />
            </div>
            <div className="bubble-wrapper">
              <div className="sources-accordion">
                <button
                  type="button"
                  className="sources-accordion-toggle"
                  onClick={() => setShowSources((v) => !v)}
                >
                  <ShieldCheck size={13} />
                  <span>{lastSources.length} Sumber Referensi</span>
                  <span className="sources-chevron">{showSources ? '▲' : '▼'}</span>
                </button>
                {showSources && (
                  <div className="sources-list">
                    {lastSources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-card"
                      >
                        <span className="source-num">[{i + 1}]</span>
                        <div className="source-body">
                          <span className="source-title">{src.title}</span>
                          <span className="source-snippet">{src.snippet}</span>
                          <span className="source-url">{src.url}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isSending && (
          <div className="chat-row bot">
            <div className="chat-avatar bot-avatar">
              <Sparkles size={15} />
            </div>
            <div className="bubble-wrapper">
              <div className="chat-bubble thinking-bubble">
                <div className="bouncing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="shimmer-think-text">
                  Sedang mengetik...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* STICKY INPUT BAR AT BOTTOM */}
      <div className="chat-input-bar">
        {isFreeTierOutOfCredits && (
          <div className="chat-credit-warning-strip">
            <div className="warning-left">
              <Coins size={15} className="warning-coin-icon" />
              <span>
                Saldo <strong>0 Credits</strong>. Kumpulkan Credits dari Misi atau Upgrade Akun untuk konsultasi.
              </span>
            </div>
            <div className="warning-cta-group">
              <button
                type="button"
                className="strip-btn strip-btn-mission"
                onClick={() => navigate('/missions')}
              >
                <Trophy size={13} /> Misi Gratis
              </button>
              <button
                type="button"
                className="strip-btn strip-btn-upgrade"
                onClick={() => navigate('/pricing')}
              >
                <Crown size={13} /> Upgrade
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="input-wrap"
        >
          <button type="button" className="attach-btn" title="Lampirkan foto (segera hadir)">
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isFreeTierOutOfCredits
                ? 'Credits kamu 0. Kerjakan misi atau upgrade akun untuk chat...'
                : 'Tanyakan sesuatu pada Skinsistant AI...'
            }
            disabled={isSending}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="send-btn"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        <p className="chat-medical-disclaimer">
          <ShieldAlert size={12} className="disclaimer-icon" />
          <span>Skinsistant memberikan saran perawatan kosmetik & edukasi, bukan diagnosa medis klinis.</span>
        </p>
      </div>

      {/* PURE VANILLA CSS STYLING MATCHING SKINCLUV DESIGN SYSTEM */}
      <style>{`
        .skinsistant-chat-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          flex: 1;
          width: 100%;
          background: #f8fafc;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* UTILITY BAR */
        .chat-util-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .util-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .util-history-btn {
          color: #64748b;
        }
        .util-history-btn:hover {
          background: #f1f5f9;
          color: #0f6784;
        }

        .util-new-btn {
          color: #0f6784;
          background: #eaf4fa;
        }
        .util-new-btn:hover {
          background: #d4e5f1;
        }

        /* HISTORY DRAWER */
        .history-drawer-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          justify-content: flex-start;
        }

        .history-drawer {
          width: 280px;
          height: 100%;
          background: #ffffff;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          animation: slideRight 0.25s ease;
        }

        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .drawer-header h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .drawer-close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #64748b;
          cursor: pointer;
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .empty-history-text {
          font-size: 0.8125rem;
          color: #94a3b8;
          text-align: center;
          margin-top: 24px;
        }

        .history-session-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.875rem;
          color: #334155;
          transition: background 0.2s ease;
        }

        .history-session-item:hover {
          background: #f1f5f9;
        }

        .history-session-item.active {
          background: #eaf4fa;
          color: #0f6784;
          font-weight: 600;
        }

        .session-title-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .delete-session-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .history-session-item:hover .delete-session-btn {
          opacity: 1;
        }

        .delete-session-btn:hover {
          color: #ef4444;
        }

        /* MAIN CHAT SCROLL AREA */
        .chat-scroll-area {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-sizing: border-box;
        }

        .chat-scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .chat-scroll-area::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        /* WELCOME BOX */
        .chat-welcome-box {
          max-width: 540px;
          margin: 40px auto 0;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px 24px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        }

        .welcome-avatar-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #eaf4fa;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .chat-welcome-box h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .chat-welcome-box p {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .welcome-chips-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .welcome-chip-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0f6784;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .welcome-chip-item:hover {
          background: #eaf4fa;
          border-color: #0f6784;
          transform: translateY(-1px);
        }

        .loading-chat-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px;
          color: #64748b;
          font-size: 0.875rem;
        }

        /* CHAT ROWS & BUBBLES */
        .chat-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          width: 100%;
        }

        .chat-row.user {
          justify-content: flex-end;
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .bot-avatar {
          background: #eaf4fa;
          color: #0f6784;
        }

        .user-avatar {
          background: #0f6784;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .bubble-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 75%;
        }

        .chat-bubble {
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 0.875rem;
          line-height: 1.6;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }

        .chat-row.user .chat-bubble {
          background: #0f6784;
          color: #ffffff !important;
          border-bottom-right-radius: 4px;
        }

        .chat-row.user .chat-bubble p {
          color: #ffffff !important;
          margin: 0;
        }

        .chat-row.bot .chat-bubble {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 4px;
        }

        .thinking-bubble {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-bottom-left-radius: 4px !important;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px !important;
          width: fit-content;
        }

        .bouncing-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .bouncing-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #0f6784;
          animation: dotBounce 1.1s infinite ease-in-out;
        }

        .bouncing-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .bouncing-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes dotBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .shimmer-think-text {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #0f6784;
          animation: thinkShimmer 1.8s infinite ease-in-out;
          white-space: nowrap;
        }

        @keyframes thinkShimmer {
          0%, 100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }

        .chat-bubble p {
          margin: 0;
        }

        .chat-bubble p + p {
          margin-top: 8px;
        }

        .chat-timestamp {
          font-size: 0.65rem;
          color: #94a3b8;
          margin-top: 3px;
          display: block;
        }

        .chat-row.user .chat-timestamp {
          text-align: right;
        }

        .chat-row.bot .chat-timestamp {
          text-align: left;
        }

        /* STICKY INPUT BAR AT BOTTOM */
        .chat-input-bar {
          position: sticky;
          bottom: 0;
          padding: 10px 20px 8px 20px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          flex-shrink: 0;
          z-index: 10;
        }

        .chat-medical-disclaimer {
          margin: 6px 0 0 0;
          font-size: 0.6875rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          text-align: center;
          user-select: none;
        }

        .chat-medical-disclaimer .disclaimer-icon {
          color: #f59e0b;
          flex-shrink: 0;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 24px;
          padding: 4px 6px 4px 14px;
          transition: border-color 0.2s ease;
        }

        .input-wrap:focus-within {
          border-color: #0f6784;
        }

        .input-wrap input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          outline: none;
          color: #0f172a;
        }

        .input-wrap input::placeholder {
          color: #94a3b8;
        }

        .attach-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.2s;
        }

        .attach-btn:hover {
          color: #0f6784;
        }

        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0f6784;
          color: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .send-btn:hover {
          background: #0b4f5c;
        }

        .send-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .chat-credit-warning-strip {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 8px 14px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.8125rem;
          color: #92400e;
          animation: fadeIn 0.2s ease;
        }

        .warning-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .warning-coin-icon {
          color: #d97706;
          flex-shrink: 0;
        }

        .warning-cta-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .strip-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .strip-btn-mission {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .strip-btn-mission:hover {
          background: #fde68a;
        }

        .strip-btn-upgrade {
          background: #0f6784;
          color: #ffffff;
        }

        .strip-btn-upgrade:hover {
          background: #0b4d63;
        }

        .chat-util-left, .chat-util-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .util-memory-btn {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .util-memory-btn:hover {
          background: #dcfce7;
        }

        .util-reset-btn {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .util-reset-btn:hover {
          background: #ffe4e6;
        }

        .clinical-memory-drawer {
          max-width: 480px;
        }

        .uupdp-compliance-card {
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .uupdp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 6px;
        }

        .uupdp-compliance-card p {
          font-size: 12px;
          color: #334155;
          line-height: 1.5;
          margin: 0 0 8px 0;
        }

        .uupdp-rights {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #0d9488;
        }

        /* Sources Accordion (Web Search Results) */
        .sources-accordion {
          margin-top: 6px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #f8fafc;
          font-size: 0.78rem;
          max-width: 480px;
        }

        .sources-accordion-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          background: none;
          border: none;
          padding: 8px 12px;
          font-size: 0.78rem;
          color: #0f766e;
          cursor: pointer;
          font-weight: 600;
          text-align: left;
        }

        .sources-accordion-toggle:hover {
          background: #f0fdfa;
        }

        .sources-chevron {
          margin-left: auto;
          font-size: 0.65rem;
          opacity: 0.6;
        }

        .sources-list {
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .source-card {
          display: flex;
          gap: 10px;
          padding: 8px 12px;
          text-decoration: none;
          color: inherit;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;
        }

        .source-card:last-child {
          border-bottom: none;
        }

        .source-card:hover {
          background: #f0fdfa;
        }

        .source-num {
          font-size: 0.7rem;
          font-weight: 700;
          color: #0f766e;
          min-width: 24px;
          padding-top: 1px;
        }

        .source-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .source-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: #1e293b;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .source-snippet {
          font-size: 0.72rem;
          color: #64748b;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .source-url {
          font-size: 0.68rem;
          color: #0f766e;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Consent Banner */
        .memory-consent-banner {
          background: #f0fdfa;
          border: 1px solid #99f6e4;
          border-radius: 12px;
          padding: 12px 16px;
          margin: 10px 16px 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          animation: fadeIn 0.2s ease;
        }

        .consent-content {
          flex: 1;
        }

        .consent-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #0f766e;
          margin-bottom: 4px;
        }

        .consent-content p {
          font-size: 0.75rem;
          color: #334155;
          line-height: 1.4;
          margin: 0;
        }

        .consent-action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .consent-btn-accept {
          background: #0f6784;
          color: #ffffff;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .consent-btn-accept:hover {
          background: #0b4d63;
        }

        .consent-btn-dismiss {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .consent-btn-dismiss:hover {
          background: #e2e8f0;
          color: #334155;
        }

        /* Consent Toggle in Drawer */
        .memory-consent-toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 14px;
        }

        .consent-status-label {
          font-size: 0.75rem;
          color: #475569;
        }

        .consent-toggle-btn {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .consent-toggle-btn.btn-disable {
          background: #fee2e2;
          color: #b91c1c;
        }

        .consent-toggle-btn.btn-disable:hover {
          background: #fecdd3;
        }

        .consent-toggle-btn.btn-enable {
          background: #dcfce7;
          color: #15803d;
        }

        .consent-toggle-btn.btn-enable:hover {
          background: #bbf7d0;
        }

        .memories-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .memories-section-header h4 {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .clear-all-memories-btn {
          font-size: 11px;
          color: #e11d48;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .clear-all-memories-btn:hover {
          background: #ffe4e6;
        }

        .empty-memories-box {
          text-align: center;
          padding: 24px 12px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px dashed #cbd5e1;
        }

        .clinical-memories-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .clinical-memory-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          transition: all 0.15s ease;
        }

        .clinical-memory-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .memory-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .memory-type-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.03em;
        }

        .memory-type-badge.type-allergy {
          background: #fee2e2;
          color: #b91c1c;
        }

        .memory-type-badge.type-sensitivity {
          background: #fef3c7;
          color: #b45309;
        }

        .memory-type-badge.type-treatment_reaction {
          background: #ede9fe;
          color: #6d28d9;
        }

        .memory-type-badge.type-preference {
          background: #e0f2fe;
          color: #0369a1;
        }

        .delete-memory-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .delete-memory-btn:hover {
          color: #ef4444;
          background: #fee2e2;
        }

        .memory-entity-name {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 3px;
        }

        .memory-fact-text {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .chat-credit-warning-strip {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .warning-cta-group {
            width: 100%;
          }
          .strip-btn {
            flex: 1;
            justify-content: center;
          }
          .chat-util-bar {
            padding: 8px 12px;
          }
          .chat-scroll-area {
            padding: 14px 12px;
          }
          .bubble-wrapper {
            max-width: 85%;
          }
          .chat-input-bar {
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  )
}
