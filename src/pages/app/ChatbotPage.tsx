// src/pages/app/ChatbotPage.tsx
// 100% Faithful Port of Claude's Skinsistant AI Chatbot UI — Pure Vanilla CSS, Sticky Input & Zero Page Scroll

import { useState, useEffect, useRef } from 'react'
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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'
import FormattedMarkdown from '@/components/ui/FormattedMarkdown'

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  created_at: string
}

interface Session {
  id: string
  title: string
  created_at: string
  last_activity?: string
}

export default function ChatbotPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()

  const { user, profile, coinBalance } = useAuthStore()
  const { invoke, pendingCoinConfirm, confirmCoinUsage, cancelCoinUsage } = useInvokeAI()
  const currentCoins = coinBalance?.balance ?? 0

  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Contextual Thinking Stages ala ChatGPT / Claude
  const thinkingStages = [
    'Memahami pertanyaanmu...',
    'Menyesuaikan dengan profil kulitmu...',
    'Menyusun rekomendasi terbaik...',
    'Masih memproses, mohon tunggu sebentar...',
  ]
  const [thinkingStageIndex, setThinkingStageIndex] = useState(0)

  // Rotate thinking stages when isSending is true
  useEffect(() => {
    if (!isSending) {
      setThinkingStageIndex(0)
      return
    }

    const t1 = setTimeout(() => setThinkingStageIndex(1), 1600)
    const t2 = setTimeout(() => setThinkingStageIndex(2), 3200)
    const t3 = setTimeout(() => setThinkingStageIndex(3), 8000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isSending])

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
        setSessions((prev) => [data, ...prev])
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

    // Call Supabase Edge Function AI Chat endpoint
    try {
      const historyFormatted = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }))

      const res = await invoke({
        feature_slug: 'chatbot',
        messages: [...historyFormatted, { role: 'user', content: query }],
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

        // Save bot message to Supabase
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          role: 'assistant',
          content: botReply,
        })
      }
    } catch (err) {
      console.error('AI invoke error:', err)
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
          featureName="Skinsistant AI Chat"
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      {/* CHAT UTILITY BAR (Riwayat Chat & Chat Baru) */}
      <div className="chat-util-bar">
        <button
          onClick={() => setShowHistoryModal(!showHistoryModal)}
          className="util-btn util-history-btn"
        >
          <History size={16} />
          <span>Riwayat Chat ({sessions.length})</span>
        </button>

        <button onClick={handleCreateNewChat} className="util-btn util-new-btn">
          <Plus size={16} />
          <span>Chat Baru</span>
        </button>
      </div>

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
                  {thinkingStages[thinkingStageIndex]}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* STICKY INPUT BAR AT BOTTOM */}
      <div className="chat-input-bar">
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
            placeholder="Tanyakan sesuatu pada Skinsistant AI..."
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
          padding: 12px 20px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          flex-shrink: 0;
          z-index: 10;
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

        @media (max-width: 768px) {
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
