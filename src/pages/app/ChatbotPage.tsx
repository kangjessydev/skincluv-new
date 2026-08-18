import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Trash2, Plus, MessageSquare, History, X, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'

interface ChatSession {
  id: string
  title: string
  created_at: string
}

interface ChatMessage {
  id: string
  session_id: string
  sender: 'user' | 'assistant'
  content: string
  created_at: string
}

const SUGGESTIONS = [
  'Rekomendasi moisturizer untuk kulit kering',
  'Bahan aktif apa yang cocok untuk jerawat?',
  'Apakah Niacinamide boleh dicampur Retinol?',
  'Urutan skincare malam yang benar'
]

export default function ChatbotPage() {
  const { activeSkinProfile, profile, session } = useAuthStore()
  const { invoke, isLoading } = useInvokeAI()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // -------------------------------------------------------------
  // 1. Fetch Chat Sessions on Mount
  // -------------------------------------------------------------
  const fetchSessions = async () => {
    if (!session?.user) return
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSessions(data)
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Fetch chat sessions error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [session])

  // -------------------------------------------------------------
  // 2. Fetch Messages when activeSessionId changes
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeSessionId || !session?.user) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
    }

    fetchMessages()
  }, [activeSessionId, session])

  // -------------------------------------------------------------
  // 3. Create New Chat Session
  // -------------------------------------------------------------
  const handleNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setShowSidebar(false)
  }

  // -------------------------------------------------------------
  // 4. Delete Session
  // -------------------------------------------------------------
  const handleDeleteSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Apakah kamu yakin ingin menghapus obrolan ini?')) return

    try {
      await supabase.from('chat_sessions').delete().eq('id', sessionIdToDelete)
      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete))
      if (activeSessionId === sessionIdToDelete) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Delete session error:', err)
    }
  }

  // -------------------------------------------------------------
  // 5. Send Message & Invoke AI
  // -------------------------------------------------------------
  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || input).trim()
    if (!userText || isLoading || !session?.user) return

    setInput('')

    let currentSessionId = activeSessionId

    // A. Create new session if none is active
    if (!currentSessionId) {
      const titleSnippet = userText.length > 30 ? userText.slice(0, 30) + '...' : userText
      const { data: newSubSession, error: createErr } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: session.user.id,
          title: titleSnippet
        })
        .select()
        .single()

      if (createErr || !newSubSession) {
        alert('Gagal membuat sesi obrolan baru: ' + (createErr?.message || 'Error'))
        return
      }

      currentSessionId = newSubSession.id
      setActiveSessionId(currentSessionId)
      setSessions(prev => [newSubSession, ...prev])
    }

    // B. Insert User Message to Database & Local State
    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: currentSessionId,
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempUserMsg])

    await supabase.from('chat_messages').insert({
      id: tempUserMsg.id,
      session_id: currentSessionId,
      user_id: session.user.id,
      sender: 'user',
      content: userText
    })

    // C. Format recent message history for AI context
    const historyPayload = [...messages, tempUserMsg]
      .slice(-6)
      .map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content
      }))

    // D. Invoke AI Function
    const res = await invoke({
      feature_slug: 'chatbot',
      messages: historyPayload,
      input_context: {
        user_name: profile?.full_name ?? 'Pengguna',
      }
    })

    const botContent = res?.content || 'Maaf, terjadi masalah koneksi ke server AI. Coba lagi nanti.'

    // E. Save Assistant Response to Database & Local State
    const tempBotMsg: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: currentSessionId,
      sender: 'assistant',
      content: botContent,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempBotMsg])

    await supabase.from('chat_messages').insert({
      id: tempBotMsg.id,
      session_id: currentSessionId,
      user_id: session.user.id,
      sender: 'assistant',
      content: botContent
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chatbot-layout">
      {/* Mobile / Tablet Backdrop */}
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`chat-sidebar glass-card ${showSidebar ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <button className="btn btn-primary btn-block btn-new-chat" onClick={handleNewChat}>
            <Plus size={18} /> Obrolan Baru
          </button>
          <button className="btn-close-sidebar" onClick={() => setShowSidebar(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="session-list">
          <span className="sidebar-section-title">Riwayat Percakapan</span>
          {loadingHistory ? (
            <p className="loading-text">Memuat riwayat...</p>
          ) : sessions.length === 0 ? (
            <p className="empty-text">Belum ada obrolan sebelumnya.</p>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className={`session-item ${activeSessionId === s.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSessionId(s.id)
                  setShowSidebar(false)
                }}
              >
                <MessageSquare size={16} className="session-icon" />
                <span className="session-title">{s.title}</span>
                <button
                  className="btn-delete-session"
                  onClick={e => handleDeleteSession(s.id, e)}
                  title="Hapus Obrolan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Panel */}
      <main className="chat-main">
        {/* Header */}
        <div className="chat-header glass-card">
          <div className="header-left">
            <button 
              className={`btn-toggle-sidebar ${showSidebar ? 'active' : ''}`} 
              onClick={() => setShowSidebar(!showSidebar)}
              title="Toggle Riwayat Obrolan"
            >
              <History size={18} />
              <span className="toggle-label">Riwayat</span>
            </button>
            <div>
              <h1>Tanya Skincluv AI</h1>
              <p className="page-subtitle">
                {activeSkinProfile ? 'AI terhubung dengan profil kulitmu' : 'Asisten Kesehatan Kulit 24/7'}
              </p>
            </div>
          </div>

          <button className="btn btn-outline btn-sm btn-new-top" onClick={handleNewChat}>
            <Plus size={16} /> Obrolan Baru
          </button>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat-welcome animate-fade-in">
              <div className="welcome-icon-circle">
                <Sparkles size={36} className="text-gold" />
              </div>
              <h2>Ada yang bisa aku bantu untuk kulitmu hari ini?</h2>
              <p>Tanyakan seputar bahan aktif, masalah jerawat, atau rekomendasi rutinitas harian.</p>

              <div className="suggestions-grid">
                {SUGGESTIONS.map((sug, idx) => (
                  <button key={idx} className="suggestion-chip glass-card" onClick={() => handleSend(sug)}>
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                <div className="chat-avatar">
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="chat-bubble">
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="chat-bubble-wrapper bot">
              <div className="chat-avatar"><Bot size={16} /></div>
              <div className="chat-bubble typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-area glass-card">
          <input
            type="text"
            className="chat-input"
            placeholder="Tanya tentang rutinitas skincare..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="btn btn-primary btn-icon send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </main>

      <style>{`
        .chatbot-layout {
          display: flex; gap: var(--space-md);
          height: calc(100vh - var(--nav-height) - 40px);
          max-height: calc(100vh - var(--nav-height) - 40px);
          position: relative; overflow: hidden; max-width: 1000px; margin: 0 auto;
        }

        /* Backdrop */
        .sidebar-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px); z-index: 190;
        }

        /* Sidebar Desktop & Mobile */
        .chat-sidebar {
          width: 260px; flex-shrink: 0; display: flex; flex-direction: column;
          padding: var(--space-md); border-radius: var(--radius-2xl);
          background: rgba(20, 15, 35, 0.95); border: 1px solid var(--color-border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 200;
        }

        /* Desktop Behavior */
        @media (min-width: 769px) {
          .chat-sidebar.sidebar-closed {
            display: none;
          }
          .chat-sidebar.sidebar-open {
            display: flex;
          }
        }

        /* Mobile / Tablet Behavior */
        @media (max-width: 768px) {
          .chat-sidebar {
            position: fixed; top: 0; bottom: 0; left: 0; width: 280px; height: 100vh;
            border-radius: 0; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          }
          .chat-sidebar.sidebar-closed {
            transform: translateX(-100%); opacity: 0; pointer-events: none;
          }
          .chat-sidebar.sidebar-open {
            transform: translateX(0); opacity: 1; pointer-events: auto;
          }
        }

        .sidebar-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: var(--space-md); }
        .btn-new-chat { justify-content: center; gap: 6px; box-shadow: 0 4px 16px rgba(168,85,247,0.3); }
        .btn-close-sidebar { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; display: flex; padding: 4px; }
        .btn-close-sidebar:hover { color: white; }

        .sidebar-section-title { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 8px; }
        .session-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .loading-text, .empty-text { font-size: 0.75rem; color: var(--color-text-muted); text-align: center; padding: 20px 0; }

        .session-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: var(--radius-lg); font-size: 0.8125rem; color: var(--color-text-secondary);
          cursor: pointer; transition: all 0.2s; position: relative;
        }
        .session-item:hover { background: rgba(255,255,255,0.06); color: white; }
        .session-item.active { background: rgba(168,85,247,0.2); color: white; font-weight: 600; border: 1px solid rgba(168,85,247,0.3); }
        .session-icon { color: var(--color-brand-400); flex-shrink: 0; }
        .session-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .btn-delete-session {
          background: transparent; border: none; color: var(--color-text-muted);
          opacity: 0; cursor: pointer; padding: 4px; transition: all 0.2s;
        }
        .session-item:hover .btn-delete-session { opacity: 1; }
        .btn-delete-session:hover { color: #ef4444; }

        /* Main Panel */
        .chat-main { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; width: 100%; }

        .chat-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-radius: var(--radius-xl); margin-bottom: 12px;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .btn-toggle-sidebar {
          background: rgba(255,255,255,0.05); border: 1px solid var(--color-border);
          color: var(--color-text-secondary); padding: 6px 12px; border-radius: var(--radius-lg);
          cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8125rem;
          font-weight: 600; transition: all 0.2s;
        }
        .btn-toggle-sidebar:hover, .btn-toggle-sidebar.active {
          background: rgba(168,85,247,0.2); color: white; border-color: var(--color-brand-400);
        }
        .toggle-label { font-size: 0.8125rem; }

        .chat-header h1 { font-size: 1.25rem; margin: 0; }
        .page-subtitle { color: var(--color-brand-300); font-size: 0.75rem; font-weight: 600; margin: 2px 0 0 0; }
        .btn-new-top { gap: 6px; }

        /* Messages */
        .chat-messages {
          flex: 1; overflow-y: auto; display: flex; flex-direction: column;
          gap: var(--space-md); padding: 8px 4px 20px 4px;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

        /* Empty State */
        .empty-chat-welcome {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; margin: auto; max-width: 480px; padding: 20px;
        }
        .welcome-icon-circle {
          width: 64px; height: 64px; border-radius: 50%; background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.3); display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .text-gold { color: #FBBF24; filter: drop-shadow(0 2px 8px rgba(251,191,36,0.4)); }
        .empty-chat-welcome h2 { font-size: 1.25rem; margin: 0 0 8px 0; color: white; }
        .empty-chat-welcome p { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 24px; }

        .suggestions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; width: 100%; }
        .suggestion-chip {
          padding: 12px 14px; border-radius: var(--radius-lg); text-align: left;
          background: rgba(255,255,255,0.04); border: 1px solid var(--color-border);
          color: var(--color-text-secondary); font-size: 0.8125rem; cursor: pointer; transition: all 0.2s;
        }
        .suggestion-chip:hover { background: rgba(168,85,247,0.15); border-color: var(--color-brand-400); color: white; transform: translateY(-2px); }

        /* Chat Bubbles */
        .chat-bubble-wrapper { display: flex; gap: 10px; max-width: 85%; align-items: flex-end; }
        .chat-bubble-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }

        .chat-avatar {
          width: 30px; height: 30px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0; color: white;
        }
        .bot .chat-avatar { background: var(--gradient-brand); }
        .user .chat-avatar { background: var(--color-surface-glass); border: 1px solid var(--color-border); color: var(--color-text); }

        .chat-bubble { padding: 12px 16px; border-radius: 20px; font-size: 0.9375rem; line-height: 1.5; white-space: pre-wrap; }
        .bot .chat-bubble { background: var(--color-surface-glass); border: 1px solid var(--color-border); border-bottom-left-radius: 4px; color: var(--color-text); }
        .user .chat-bubble { background: var(--color-brand-500); color: white; border-bottom-right-radius: 4px; }

        /* Input */
        .chat-input-area { display: flex; gap: var(--space-sm); padding: 8px 12px; margin-top: auto; border-radius: var(--radius-full); }
        .chat-input { flex: 1; background: transparent; border: none; padding: 0 var(--space-md); color: var(--color-text); font-size: 0.9375rem; }
        .chat-input:focus { outline: none; }
        .send-btn { border-radius: 50%; width: 40px; height: 40px; padding: 0; flex-shrink: 0; }

        .typing-indicator { display: flex; align-items: center; gap: 4px; height: 44px; }
        .dot { width: 6px; height: 6px; background: var(--color-text-muted); border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
    </div>
  )
}
