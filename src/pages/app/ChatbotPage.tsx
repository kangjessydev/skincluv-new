// src/pages/app/ChatbotPage.tsx
// 100% Faithful Port of Claude's Skinsistant AI Chatbot UI — Pure Vanilla CSS, Sticky Input & Zero Page Scroll

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
  ScanFace,
  ArrowRight,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import { hasPaidAiQuota, getFeatureCreditCost } from '@/utils/subscriptionHelpers'
import { Button } from '@/components/ui'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import FormattedMarkdown from '@/components/ui/FormattedMarkdown'
import ChatAttachmentSlot, { type ChatAttachmentDescriptor } from '@/components/chat/ChatAttachmentSlot'
import FaceScanDetailModal from '@/components/scans/FaceScanDetailModal'
import IngredientScanDetailModal from '@/components/scans/IngredientScanDetailModal'
import type { FaceScan, IngredientScan } from '@/types/database'

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
  metadata?: {
    schema_version?: number
    attachments?: ChatAttachmentDescriptor[]
  }
}

interface Session {
  id: string
  title: string | null
  created_at: string
  last_activity?: string
}

type ChatAction = 'FACE_SCAN' | 'INGREDIENT_SCAN'

function parseMessageAction(text: string): { cleanText: string; actions: ChatAction[] } {
  if (!text) return { cleanText: '', actions: [] }
  const actions: ChatAction[] = []
  if (text.includes('[ACTION:FACE_SCAN]')) {
    actions.push('FACE_SCAN')
  }
  if (text.includes('[ACTION:INGREDIENT_SCAN]')) {
    actions.push('INGREDIENT_SCAN')
  }
  // Strip all [ACTION:...] tags cleanly regardless of casing or position
  const cleanText = text.replace(/\[ACTION:[A-Z_]+\]/gi, '').trim()
  return { cleanText, actions }
}

// Shortcut deterministik untuk sapaan/basa-basi generik — tidak perlu panggil AI,
// hemat token dan Credit user, response instan.
// PENTING: harus EXACT MATCH (bukan "starts with"/substring) supaya pesan yang
// punya pertanyaan tambahan tetap diteruskan ke AI, bukan ke-intercept di sini.
const TRIVIAL_GREETING_RESPONSES: Record<string, string> = {
  'halo': 'Halo! Ada yang ingin Anda tanyakan seputar kulit atau perawatan hari ini?',
  'hai': 'Hai! Ada yang bisa saya bantu seputar perawatan kulit Anda?',
  'hi': 'Hai! Ada yang bisa saya bantu seputar perawatan kulit Anda?',
  'hallo': 'Halo! Ada yang ingin Anda tanyakan seputar kulit atau perawatan hari ini?',
  'permisi': 'Halo, silakan! Ada yang ingin ditanyakan seputar kulit?',
  'makasih': 'Sama-sama! Semoga informasinya bermanfaat.',
  'terima kasih': 'Sama-sama! Semoga informasinya bermanfaat.',
  'thanks': 'Sama-sama! Semoga informasinya bermanfaat.',
  'ok': 'Baik, ada hal lain yang ingin Anda konsultasikan?',
  'oke': 'Baik, ada hal lain yang ingin Anda konsultasikan?',
  'siap': 'Siap! Ada hal lain yang bisa saya bantu?',
}

function getTrivialGreetingReply(text: string): string | null {
  const normalized = text.trim().toLowerCase().replace(/[!.?,]+$/g, '')
  return TRIVIAL_GREETING_RESPONSES[normalized] ?? null
}

export default function ChatbotPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()

  const { user, profile, setProfile, coinBalance, subscription } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage, askCoinConfirmation, getLastError } = useInvokeAI()
  const currentCoins = coinBalance?.balance ?? 0
  const chatbotCost = getFeatureCreditCost('chatbot')
  const isFreeTierOutOfCredits = !hasPaidAiQuota(subscription) && currentCoins < chatbotCost

  const [searchParams] = useSearchParams()
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')

  useEffect(() => {
    const promptQuery = searchParams.get('q')
    if (promptQuery) {
      setInputText((prev) => prev || promptQuery)
    }
  }, [searchParams])
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showMemoryModal, setShowMemoryModal] = useState(false)
  const [clinicalMemories, setClinicalMemories] = useState<ClinicalMemory[]>([])
  const [isLoadingMemories, setIsLoadingMemories] = useState(false)
  const [memoryConsent, setMemoryConsent] = useState<boolean | null>(
    profile?.chatbot_memory_consent ?? null
  )
  // Scan privacy consent state (RFC 006 Full AI Council Consensus)
  const [scanMasterConsent, setScanMasterConsent] = useState<boolean | null>(null)
  const [scanFaceConsent, setScanFaceConsent] = useState<boolean>(true)
  const [scanProductConsent, setScanProductConsent] = useState<boolean>(true)

  // Sources dari web search (diisi jika AI memakai Tavily)
  const [lastSources, setLastSources] = useState<Array<{ title: string; url: string; snippet: string }>>([]) // eslint-disable-line
  const [showSources, setShowSources] = useState(false)
  // Consent banner: muncul sekali per sesi browser setelah BANNER_BUBBLE_THRESHOLD bubble
  const BANNER_BUBBLE_THRESHOLD = 8
  const [showConsentBanner, setShowConsentBanner] = useState(false)

  // RFC 012: In-Chat Visual Cards Modal Preview State
  const [activeFaceModalScan, setActiveFaceModalScan] = useState<FaceScan | null>(null)
  const [activeIngredientModalScan, setActiveIngredientModalScan] = useState<IngredientScan | null>(null)

  // Auto-resize textarea ref & height management
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
    }
  }, [inputText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputText.trim() && !isSending) {
        handleSendMessage()
      }
    }
  }

  useEffect(() => {
    if (profile?.chatbot_memory_consent !== undefined) {
      setMemoryConsent(profile.chatbot_memory_consent ?? null)
    }
  }, [profile?.chatbot_memory_consent])

  // Support prefilled prompt from URL search parameters (RFC 009: secure scan_id context resolver)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const scanId = params.get('scan_id')
    const queryPrompt = params.get('q') || params.get('initialPrompt')

    if (scanId) {
      const fetchContext = async () => {
        try {
          const { data: scanCtx, error: rpcErr } = await supabase.rpc('get_face_scan_chat_context', { p_scan_id: scanId })
          if (!rpcErr && scanCtx && typeof scanCtx === 'object' && (scanCtx as any).allowed) {
            const ctx = scanCtx as any
            const concernsList = Array.isArray(ctx.concerns) && ctx.concerns.length > 0
              ? ctx.concerns.join(', ')
              : 'tidak ada keluhan khusus'

            const promptGreeting = queryPrompt
              ? `Halo Skinsistant! Terkait hasil analisis wajahku barusan (tipe kulit ${ctx.skin_type}, skor ${ctx.overall_score}/100): ${queryPrompt}`
              : `Halo Skinsistant, saya baru saja selesai melakukan analisis wajah. Hasil pemetaan menunjukkan tipe kulitku ${ctx.skin_type} (skor ${ctx.overall_score}/100) dengan perhatian pada: ${concernsList}. Bisa bantu buatkan rekomendasi rutinitas skincare pagi dan malam yang cocok untuk kondisiku?`

            setInputText(promptGreeting)
          } else if (queryPrompt) {
            setInputText(queryPrompt)
          }
        } catch {
          if (queryPrompt) setInputText(queryPrompt)
        }
      }
      fetchContext()
    } else if (queryPrompt) {
      setInputText(queryPrompt)
    }
  }, [])

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
          .select('chatbot_memory_consent, chatbot_scan_master_consent, chatbot_face_scan_consent, chatbot_product_scan_consent')
          .eq('id', user.id)
          .maybeSingle()
        if (data) {
          if (data.chatbot_memory_consent !== undefined) setMemoryConsent(data.chatbot_memory_consent)
          if (data.chatbot_scan_master_consent !== undefined) setScanMasterConsent(data.chatbot_scan_master_consent)
          if (data.chatbot_face_scan_consent !== undefined) setScanFaceConsent(data.chatbot_face_scan_consent ?? true)
          if (data.chatbot_product_scan_consent !== undefined) setScanProductConsent(data.chatbot_product_scan_consent ?? true)
        }
      } catch (err) {
        console.warn('Failed to fetch consent settings:', err)
      }
    }
    fetchConsent()
  }, [user?.id])

  const handleSetScanConsent = async (master: boolean, face?: boolean, product?: boolean) => {
    if (!user?.id) return
    try {
      const faceVal = face !== undefined ? face : scanFaceConsent
      const prodVal = product !== undefined ? product : scanProductConsent

      await supabase.rpc('set_chatbot_scan_consent', {
        p_master: master,
        p_face: faceVal,
        p_product: prodVal,
      })

      setScanMasterConsent(master)
      setScanFaceConsent(faceVal)
      setScanProductConsent(prodVal)
    } catch (err) {
      console.error('Failed to update scan consent:', err)
    }
  }

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
        // Jika memilih Lewati / Nonaktifkan, bersihkan data memori & rangkuman sesi sesuai hak privasi UU PDP (Right to be Forgotten)
        await Promise.allSettled([
          supabase.from('user_clinical_memories').delete().eq('user_id', user.id),
          (supabase.from as any)('chat_session_summaries').delete().eq('user_id', user.id),
        ])
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
        .select('id, role, content, metadata, created_at')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'bot',
            text: m.content,
            created_at: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: m.metadata && typeof m.metadata === 'object' ? m.metadata : undefined,
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

  // Listen for mobile topbar action events from AppLayout
  useEffect(() => {
    const handleHistoryEvent = () => setShowHistoryModal((prev) => !prev)
    const handleMemoryEvent = () => {
      fetchClinicalMemories()
      setShowMemoryModal(true)
    }
    const handleNewChatEvent = () => {
      handleCreateNewChat()
    }

    window.addEventListener('cluv:chatbot-history', handleHistoryEvent)
    window.addEventListener('cluv:chatbot-memory', handleMemoryEvent)
    window.addEventListener('cluv:chatbot-new', handleNewChatEvent)

    return () => {
      window.removeEventListener('cluv:chatbot-history', handleHistoryEvent)
      window.removeEventListener('cluv:chatbot-memory', handleMemoryEvent)
      window.removeEventListener('cluv:chatbot-new', handleNewChatEvent)
    }
  }, [fetchClinicalMemories])

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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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
        const botMetadata = (res as any).metadata || (res as any).data?.metadata || { schema_version: 1, attachments: [] }

        const tempBotMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: botMetadata,
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
          metadata: botMetadata,
        })

        // Segarkan memori klinis jika AI mendeteksi fakta baru di latar belakang
        setTimeout(() => {
          fetchClinicalMemories()
        }, 1500)
      } else {
        setLastSources([])
        const lastErr = getLastError()
        if (lastErr === 'INSUFFICIENT_CREDITS') {
          const noticeText = `Credits kamu tidak mencukupi untuk konsultasi ini (butuh ${chatbotCost} Credit). Kamu bisa mengumpulkan Credits gratis dengan menyelesaikan [Misi Harian](/missions) atau [Tingkatkan Akun](/pricing) ke Paket Glow / PRO untuk kuota bulanan.`
          const tempBotMsg: Message = {
            id: `insufficient-${Date.now()}`,
            sender: 'bot',
            text: noticeText,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setMessages((prev) => [...prev, tempBotMsg])
        } else {
          const tempBotMsg: Message = {
            id: `error-${Date.now()}`,
            sender: 'bot',
            text: 'Maaf, terjadi kendala teknis pada server saat memproses jawaban. Credit kamu tidak berkurang. Silakan coba kirim pesan lagi.',
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setMessages((prev) => [...prev, tempBotMsg])
        }
      }
    } catch (err) {
      console.error('AI invoke error:', err)
      setLastSources([])
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: 'Maaf, terjadi kendala koneksi ke server AI. Credit-mu tidak berkurang. Silakan coba kirim pesan lagi.',
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const activeSession = sessions.find((s) => s.id === sessionId)

  return (
    <div className="cluv-canvas-bleed cluv-chat-root">
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
      <div className="cluv-chat-util-bar">
        <div className="cluv-chat-util-left">
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="cluv-chat-util-btn"
            title="Riwayat Sesi Percakapan"
          >
            <History size={16} />
            <span>Riwayat ({sessions.length})</span>
          </button>

          <button
            onClick={() => {
              fetchClinicalMemories()
              setShowMemoryModal(true)
            }}
            className="cluv-chat-util-btn"
            title="Memori Percakapan (Sesuai UU Perlindungan Data Pribadi)"
          >
            <Brain size={16} />
            <span>Memori ({clinicalMemories.length})</span>
          </button>
        </div>

        <div className="cluv-chat-util-center">
          <div className="cluv-chat-session-badge">
            <Sparkles size={13} style={{ color: 'var(--cluv-teal)' }} />
            <span className="cluv-chat-session-badge-title">
              {activeSession?.title || 'Konsultasi Kulit AI'}
            </span>
          </div>
        </div>

        <div className="cluv-chat-util-right cluv-flex-row cluv-gap-2">
          {sessionId && messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 size={15} />}
              onClick={handleResetCurrentSession}
              title="Kosongkan pesan dalam sesi ini"
            >
              Reset Sesi
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            radius="pill"
            iconLeft={<Plus size={15} />}
            onClick={handleCreateNewChat}
            title="Mulai Percakapan Baru"
          >
            Chat Baru
          </Button>
        </div>
      </div>

      {/* CONSENT BANNER (SESUAI UU PERLINDUNGAN DATA PRIBADI) */}
      {showConsentBanner && user?.id && (
        <div className="cluv-chat-banner">
          <div className="cluv-chat-banner-content">
            <div className="cluv-chat-banner-title">
              <Sparkles size={16} />
              <strong>Aktifkan Memori Skinsistant?</strong>
            </div>
            <p>
              AI akan mengingat preferensi penting dari obrolan Anda (seperti bahan yang memicu iritasi, sensitivitas, atau tujuan perawatan kulit) agar panduan berikutnya makin personal dan aman. Sesuai UU Perlindungan Data Pribadi — Anda bebas melihat, menonaktifkan, atau menghapusnya kapan saja.
            </p>
          </div>
          <div className="cluv-chat-banner-actions">
            <button
              type="button"
              className="cluv-btn is-primary is-sm"
              onClick={() => handleSetMemoryConsent(true)}
            >
              Aktifkan
            </button>
            <button
              type="button"
              className="cluv-btn is-secondary is-sm"
              onClick={() => handleSetMemoryConsent(false)}
            >
              Lewati
            </button>
          </div>
        </div>
      )}

      {/* MEMORY MODAL (SESUAI UU PERLINDUNGAN DATA PRIBADI) */}
      {showMemoryModal && (
        <div className="cluv-chat-drawer-overlay" onClick={() => setShowMemoryModal(false)}>
          <div className="cluv-chat-drawer is-wide" onClick={(e) => e.stopPropagation()}>
            <div className="cluv-chat-drawer-header">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                <h3>Memori Percakapan &amp; Hak Privasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                className="cluv-chat-drawer-close"
                aria-label="Tutup modal privasi & memori"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="cluv-chat-drawer-body">
              <div className="cluv-chat-uupdp-card">
                <div className="cluv-chat-uupdp-badge">
                  <ShieldCheck size={13} /> Sesuai UU Perlindungan Data Pribadi
                </div>
                <p>
                  <strong>Prinsip Minimisasi Data &amp; Isolasi Pribadi:</strong> AI hanya mengingat informasi esensial (seperti sensitivitas bahan atau preferensi kosmetik) yang Anda diskusikan agar edukasi berikutnya selalu aman dan relevan. Memori ini 100% terisolasi untuk akun Anda dan tidak dapat dibaca admin ataupun pihak ketiga.
                </p>
                <div className="cluv-chat-uupdp-rights">
                  <span><CheckCircle2 size={12} className="inline mr-1" /> Hak Akses &amp; Hapus Data Pribadi</span>
                  <span><CheckCircle2 size={12} className="inline mr-1" /> Isolasi Sandboxing Terenkripsi</span>
                </div>
              </div>

              {/* Status Consent Toggle */}
              <div className="cluv-chat-toggle-row">
                <div className="text-xs text-slate-600">
                  <span>Status Memori Percakapan: </span>
                  <strong className={memoryConsent ? 'text-teal-700 font-bold' : 'text-slate-500 font-bold'}>
                    {memoryConsent ? 'Aktif' : 'Nonaktif'}
                  </strong>
                </div>
                <button
                  type="button"
                  className={`cluv-btn is-sm ${memoryConsent ? 'is-danger' : 'is-primary'}`}
                  onClick={() => handleSetMemoryConsent(!memoryConsent)}
                >
                  {memoryConsent ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>

              {/* Scan History Consent Section (RFC 006 Multi-Model Consensus) */}
              <div className="cluv-chat-consent-card">
                <div className="cluv-chat-consent-header">
                  <div className="cluv-chat-consent-title">
                    <Sparkles size={15} style={{ color: 'var(--cluv-teal)' }} />
                    <span>Riwayat Scan AI</span>
                  </div>
                  <button
                    type="button"
                    className={`cluv-btn is-sm ${scanMasterConsent ? 'is-primary' : 'is-danger'}`}
                    onClick={() => handleSetScanConsent(!scanMasterConsent)}
                  >
                    {scanMasterConsent ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <p className="cluv-chat-consent-desc">
                  Izinkan Skinsistant membaca riwayat pemetaan kondisi kulit dan komposisi produk untuk rekomendasi yang lebih tepat sasaran. Sesuai prinsip UU PDP, riwayat hanya dirujuk saat relevan dengan pertanyaan Anda.
                </p>

                {scanMasterConsent && (
                  <div className="cluv-chat-sub-options">
                    <label className="cluv-chat-sub-item">
                      <span>Rekam Jejak Pemetaan Kondisi Kulit Terakhir</span>
                      <input
                        type="checkbox"
                        checked={scanFaceConsent}
                        onChange={(e) => handleSetScanConsent(true, e.target.checked, scanProductConsent)}
                        className="accent-teal-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                    <label className="cluv-chat-sub-item">
                      <span>Rekam Jejak Analisis Komposisi Produk</span>
                      <input
                        type="checkbox"
                        checked={scanProductConsent}
                        onChange={(e) => handleSetScanConsent(true, scanFaceConsent, e.target.checked)}
                        className="accent-teal-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 m-0">Fakta yang Diingat ({clinicalMemories.length})</h4>
                {clinicalMemories.length > 0 && (
                  <button
                    onClick={handleClearAllMemories}
                    className="cluv-btn is-ghost is-sm text-rose-600"
                    title="Hapus seluruh memori"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              {isLoadingMemories ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : clinicalMemories.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl bg-slate-50 border-slate-200">
                  <Brain size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Belum ada preferensi &amp; catatan tersimpan.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Saat Anda menyebut sensitivitas atau bahan yang kurang cocok bagi kulit, AI akan otomatis mengingatnya.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {clinicalMemories.map((m) => (
                    <div key={m.id} className="cluv-chat-memory-card">
                      <div className="cluv-chat-memory-top">
                        <span className={`cluv-chat-memory-badge is-${m.memory_type}`}>
                          {m.memory_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleDeleteSingleMemory(m.id)}
                          className="cluv-chat-delete-btn opacity-100 text-slate-400 hover:text-rose-600"
                          title="Hapus catatan preferensi ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="cluv-chat-memory-entity">{m.entity}</div>
                      <div className="cluv-chat-memory-fact">{m.clinical_fact}</div>
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
        <div className="cluv-chat-drawer-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="cluv-chat-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cluv-chat-drawer-header">
              <h3>Riwayat Percakapan</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="cluv-chat-drawer-close"
                aria-label="Tutup riwayat percakapan"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="cluv-chat-drawer-body">
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 my-6">Belum ada riwayat percakapan.</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      navigate(`/chatbot/${s.id}`)
                      setShowHistoryModal(false)
                    }}
                    className={`cluv-chat-session-item ${sessionId === s.id ? 'is-active' : ''}`}
                  >
                    <MessageSquare size={16} className="shrink-0 text-slate-400" />
                    <span className="cluv-chat-session-title">{s.title || 'Percakapan'}</span>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="cluv-chat-delete-btn"
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
      <div className="cluv-chat-scroll">
        {messages.length === 0 && !isLoadingMessages && (
          <div className="cluv-chat-welcome">
            <div className="cluv-chat-welcome-avatar">
              <Sparkles size={28} />
            </div>
            <h2>Halo, {userName}!</h2>
            <p>
              Saya <b>Skinsistant AI</b>, asisten konsultasi kulit pribadi Anda. Tanyakan apa saja mengenai perawatan kulit, rutinitas skincare, atau analisis komposisi produk.
            </p>
            <div className="cluv-chat-chips-grid">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="cluv-chat-chip"
                  onClick={() => handleSendMessage(chip)}
                >
                  <Sparkles size={14} style={{ color: 'var(--cluv-teal)' }} />
                  <span>{chip}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoadingMessages && (
          <div className="flex items-center justify-center gap-2.5 py-8 text-slate-400 text-sm">
            <Loader2 size={24} className="animate-spin text-teal-600" />
            <span>Memuat pesan percakapan...</span>
          </div>
        )}

        {messages.map((msg) => {
          const { cleanText, actions } = parseMessageAction(msg.text)
          return (
            <div key={msg.id} className={`cluv-chat-row is-${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="cluv-chat-avatar is-bot">
                  <Sparkles size={15} />
                </div>
              )}

              <div className="cluv-chat-bubble-wrap">
                {msg.id.startsWith('insufficient-') ? (
                  <div className="cluv-chat-paywall-card">
                    <div className="cluv-chat-paywall-header">
                      <div className="cluv-chat-paywall-icon">
                        <Coins size={16} />
                      </div>
                      <div>
                        <h4>Credits Tidak Mencukupi</h4>
                        <span className="cluv-chat-paywall-cost">Butuh {chatbotCost} Credit</span>
                      </div>
                    </div>
                    <p className="cluv-chat-paywall-desc">
                      Saldo Anda saat ini tidak mencukupi untuk konsultasi ini. Selesaikan misi harian untuk mendapatkan Credits gratis atau aktifkan paket akses bulanan.
                    </p>
                    <div className="cluv-chat-paywall-actions">
                      <button
                        type="button"
                        className="cluv-btn is-secondary is-sm"
                        onClick={() => navigate('/missions')}
                      >
                        <Trophy size={14} />
                        <span>Misi Harian (+Gratis)</span>
                      </button>
                      <button
                        type="button"
                        className="cluv-btn is-primary is-sm"
                        onClick={() => navigate('/pricing')}
                      >
                        <Crown size={14} />
                        <span>Tingkatkan Akun</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cluv-chat-bubble">
                    {msg.sender === 'bot' ? (
                      <FormattedMarkdown content={cleanText} userName={userName} />
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                )}

                {/* RFC 012: In-Chat Visual Cards (Mini Scan Result Hub) */}
                {msg.sender === 'bot' && msg.metadata?.attachments && msg.metadata.attachments.length > 0 && (
                  <ChatAttachmentSlot
                    attachments={msg.metadata.attachments}
                    onOpenFaceScan={(scan) => setActiveFaceModalScan(scan)}
                    onOpenIngredientScan={(scan) => setActiveIngredientModalScan(scan)}
                  />
                )}

                {/* RFC 006: In-Chat Action CTA Widget */}
                {msg.sender === 'bot' && actions.length > 0 && (
                  <div className="cluv-chat-cta-wrapper">
                    {actions.includes('FACE_SCAN') && (
                      <button
                        type="button"
                        onClick={() => navigate('/face-scan')}
                        className="cluv-chat-cta-btn is-face"
                      >
                        <ScanFace size={15} />
                        <span>Mulai Pemetaan Kondisi Kulit AI</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                    {actions.includes('INGREDIENT_SCAN') && (
                      <button
                        type="button"
                        onClick={() => navigate('/ingredient-scan')}
                        className="cluv-chat-cta-btn is-ingredient"
                      >
                        <FileText size={15} />
                        <span>Cek Komposisi Produk</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                )}

                <span className="cluv-chat-timestamp">{msg.created_at}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="cluv-chat-avatar is-user">{userInitials}</div>
              )}
            </div>
          )
        })}

        {/* SOURCES ACCORDION — tampil di bawah pesan AI terakhir jika ada hasil search */}
        {messages.length > 0 && lastSources.length > 0 && !isSending && (
          <div className="cluv-chat-row is-bot">
            <div className="cluv-chat-avatar is-bot" style={{ visibility: 'hidden' }}>
              <Sparkles size={15} />
            </div>
            <div className="cluv-chat-bubble-wrap">
              <div className="cluv-chat-sources">
                <button
                  type="button"
                  className="cluv-chat-sources-toggle"
                  onClick={() => setShowSources((v) => !v)}
                >
                  <ShieldCheck size={13} />
                  <span>{lastSources.length} Sumber Referensi</span>
                  <span className="cluv-chat-sources-chevron">{showSources ? '▲' : '▼'}</span>
                </button>
                {showSources && (
                  <div className="cluv-chat-sources-list">
                    {lastSources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cluv-chat-source-item"
                      >
                        <span className="cluv-chat-source-num">[{i + 1}]</span>
                        <div className="cluv-chat-source-body">
                          <span className="cluv-chat-source-title">{src.title}</span>
                          <span className="cluv-chat-source-snippet">{src.snippet}</span>
                          <span className="cluv-chat-source-url">{src.url}</span>
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
          <div className="cluv-chat-row is-bot">
            <div className="cluv-chat-avatar is-bot">
              <Sparkles size={15} />
            </div>
            <div className="cluv-chat-bubble-wrap">
              <div className="cluv-chat-bubble cluv-chat-thinking">
                <div className="cluv-chat-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="cluv-chat-shimmer-text">
                  Sedang menganalisis...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* STICKY INPUT BAR AT BOTTOM */}
      <div className="cluv-chat-input-bar">
        {isFreeTierOutOfCredits && (
          <div className="cluv-chat-warning-strip">
            <div className="cluv-chat-warning-left">
              <Coins size={15} />
              <span>
                Saldo <strong>0 Credits</strong>. Kumpulkan Credits dari Misi atau Upgrade Akun untuk konsultasi.
              </span>
            </div>
            <div className="cluv-chat-warning-cta-group">
              <button
                type="button"
                className="cluv-btn is-secondary is-sm"
                onClick={() => navigate('/missions')}
              >
                <Trophy size={13} /> Misi Gratis
              </button>
              <button
                type="button"
                className="cluv-btn is-primary is-sm"
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
          className="cluv-chat-input-wrap"
        >
          <button type="button" className="cluv-chat-attach-btn" title="Lampirkan foto (segera hadir)">
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              isFreeTierOutOfCredits
                ? 'Credits Anda 0. Kerjakan misi atau aktifkan paket akses untuk berkonsultasi...'
                : 'Tanyakan sesuatu pada Skinsistant AI... (Shift + Enter untuk baris baru)'
            }
            disabled={isSending}
            aria-label="Ketik pesan untuk Skinsistant"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="cluv-chat-send-btn"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        <p className="cluv-chat-disclaimer">
          <ShieldAlert size={12} />
          <span>Skinsistant memberikan edukasi dan panduan perawatan kosmetik, bukan diagnosis atau tindakan medis profesional.</span>
        </p>
      </div>

      {/* RFC 012: In-Chat Face Scan & Ingredient Scan Detail Modals */}
      <FaceScanDetailModal
        scan={activeFaceModalScan}
        onClose={() => setActiveFaceModalScan(null)}
      />

      <IngredientScanDetailModal
        scan={activeIngredientModalScan}
        onClose={() => setActiveIngredientModalScan(null)}
      />

    </div>
  )
}

