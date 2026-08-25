import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  History,
  FlaskConical,
  ShieldCheck,
  Search,
  Stethoscope,
  Utensils,
  Clock,
  FileText,
  BrainCircuit,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useInvokeAI } from '@/hooks/useInvokeAI'
import CoinConfirmModal from '@/components/ui/CoinConfirmModal'

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
}

interface ThinkingStep {
  icon: React.ElementType
  text: string
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
  const [showHistory, setShowHistory] = useState(false)

  // Dynamic Contextual Thinking Steps (Icons only, NO Emojis)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userName = profile?.full_name?.split(' ')[0] || 'Sarah'

  // Dynamic Thinking Step Rotation Timer (every 1.3s)
  useEffect(() => {
    if (!isSending || thinkingSteps.length === 0) return
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % thinkingSteps.length)
    }, 1300)
    return () => clearInterval(interval)
  }, [isSending, thinkingSteps])

  // Fetch sessions list on user load
  useEffect(() => {
    if (!user?.id) return
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending, currentStepIdx])

  const fetchSessions = async () => {
    if (!user?.id) return
    try {
      // Clean up orphaned empty sessions from DB
      const { data: allSessions } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!allSessions) return

      // Filter out sessions that have zero messages
      const validSessions: Session[] = []
      for (const s of allSessions) {
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', s.id)

        if (count && count > 0) {
          validSessions.push(s)
        } else if (s.id !== sessionId) {
          // Delete empty session from DB asynchronously if not currently active
          supabase.from('chat_sessions').delete().eq('id', s.id).then(() => {})
        }
      }

      setSessions(validSessions)
    } catch (err) {
      console.error('Fetch sessions failed:', err)
    }
  }

  const fetchMessages = async (sid: string) => {
    setIsLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('Error fetching chat_messages:', error.message)
        setMessages([])
        return
      }

      if (data) {
        const formatted: Message[] = data.map((m: any) => ({
          id: m.id,
          sender: m.role === 'user' ? 'user' : 'bot',
          text: m.content,
          created_at: m.created_at,
        }))
        setMessages(formatted)
      }
    } catch (err) {
      console.error('Fetch messages failed:', err)
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleNewChatClick = () => {
    setShowHistory(false)
    navigate('/chatbot')
  }

  const handleSelectSession = (sid: string) => {
    setShowHistory(false)
    if (sid === sessionId) return
    navigate(`/chatbot/${sid}`)
  }

  const createSessionInDB = async (): Promise<string | null> => {
    if (!user?.id) return null
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'Konsultasi Baru',
        })
        .select('id, title, created_at')
        .single()

      if (error || !data) {
        console.error('Error creating chat_session:', error?.message)
        return null
      }

      return data.id
    } catch (err) {
      console.error('createSessionInDB exception:', err)
      return null
    }
  }

  // Generate Dynamic Contextual Thinking Steps (strictly Lucide Icons, NO Emojis!)
  const determineThinkingSteps = (query: string): ThinkingStep[] => {
    const q = query.toLowerCase()
    const snippet = query.length > 20 ? query.substring(0, 20) + '...' : query

    const foodKeywords = ['makanan', 'makan', 'minum', 'diet', 'boba', 'gula', 'gorengan', 'minyak', 'sebum', 'nutrisi', 'air']
    const ingredientKeywords = ['niacinamide', 'retinol', 'serum', 'moisturizer', 'aha', 'bha', 'salicylic', 'hyaluronic', 'toner', 'cleanser', 'sunscreen', 'spf', 'kandungan', 'komposisi', 'efek samping']
    const concernKeywords = ['jerawat', 'acne', 'kusam', 'kering', 'flek', 'mata panda', 'dark circles', 'komedo', 'pori', 'merah', 'eksim', 'bruntusan']
    const routineKeywords = ['rutin', 'routine', 'urutan', 'langkah', 'pagi', 'malam', 'cleansing', 'layering']

    if (foodKeywords.some((kw) => q.includes(kw))) {
      return [
        { icon: Utensils, text: `Menganalisis korelasi pola makan & produksi sebum...` },
        { icon: Search, text: `Mengecek pengaruh kadar gula & karbohidrat terhadap kulit...` },
        { icon: Sparkles, text: `Menyusun saran nutrisi & perawatan kulit dari dalam...` },
      ]
    }

    if (ingredientKeywords.some((kw) => q.includes(kw))) {
      return [
        { icon: FlaskConical, text: `Menganalisis komposisi & molekul bahan aktif...` },
        { icon: ShieldCheck, text: `Mengecek tingkat keamanan & interaksi bahan...` },
        { icon: Sparkles, text: `Menyusun panduan dosis & rekomendasi penggunaan...` },
      ]
    }

    if (concernKeywords.some((kw) => q.includes(kw))) {
      return [
        { icon: Stethoscope, text: `Menganalisis kondisi & sensitivitas tipe kulit...` },
        { icon: Search, text: `Mencari metode spesifik dermatologi untuk penanganan...` },
        { icon: FileText, text: `Menyusun urutan langkah penanganan kulit...` },
      ]
    }

    if (routineKeywords.some((kw) => q.includes(kw))) {
      return [
        { icon: Clock, text: `Menganalisis tahapan perawatan pagi & malam...` },
        { icon: ShieldCheck, text: `Pemeriksaan jeda waktu & layering bahan aktif...` },
        { icon: FileText, text: `Merapikan jadwal rutinitas kulit...` },
      ]
    }

    return [
      { icon: Search, text: `Menganalisis pertanyaan: "${snippet}"...` },
      { icon: BrainCircuit, text: `Menghubungkan dengan basis data medis Skincluv...` },
      { icon: Sparkles, text: `Menyusun tanggapan terstruktur...` },
    ]
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText
    if (!query.trim() || isSending) return

    // Set contextual thinking steps
    const steps = determineThinkingSteps(query)
    setThinkingSteps(steps)
    setCurrentStepIdx(0)

    setInputText('')
    setIsSending(true)

    let currentSessionId = sessionId

    // Lazy Session Creation: If no session ID in URL, create DB session now
    if (!currentSessionId) {
      currentSessionId = await createSessionInDB()
      if (!currentSessionId) {
        setIsSending(false)
        alert('Gagal membuat sesi obrolan baru. Silakan periksa koneksi kamu.')
        return
      }
      // Instant URL update without full reload
      navigate(`/chatbot/${currentSessionId}`, { replace: true })
    }

    const tempUserMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      // 1. Save user msg to DB using user_id, session_id, role, content
      const { error: insertErr } = await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        user_id: user?.id,
        role: 'user',
        content: query,
      })

      if (insertErr) {
        console.warn('Warning inserting user chat_message:', insertErr.message)
      }

      // 2. Prepare message history payload for invoke-ai Edge Function
      const historyPayload = messages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }))
      historyPayload.push({ role: 'user', content: query })

      // 3. Invoke Edge Function with correct contract (feature_slug & messages)
      const aiResponse = await invoke({
        feature_slug: 'chatbot',
        messages: historyPayload,
      })

      const botReply = aiResponse?.content || 'Maaf, saya tidak dapat memproses pertanyaan kamu saat ini.'

      // 4. Save assistant msg to DB
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        user_id: user?.id,
        role: 'assistant',
        content: botReply,
      })

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMsg])

      // Auto title snippet
      if (messages.length === 0) {
        const titleSnippet = query.length > 25 ? query.substring(0, 25) + '...' : query
        await supabase.from('chat_sessions').update({ title: titleSnippet }).eq('id', currentSessionId)
        fetchSessions()
      }
    } catch (err: any) {
      console.error('Chatbot error:', err)
      const errorBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Mohon maaf, terjadi gangguan saat merespon: ' + (err.message || 'Error AI'),
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorBotMsg])
    } finally {
      setIsSending(false)
    }
  }

  const deleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('chat_sessions').delete().eq('id', sid)
    const updated = sessions.filter((s) => s.id !== sid)
    setSessions(updated)
    if (sessionId === sid) {
      navigate('/chatbot')
    }
  }

  // Full Article & Markdown Table Line-by-Line AST Parser
  const renderFormattedMessage = (rawText: string) => {
    let text = rawText.replace(/\{\{\s*user_name\s*\}\}/g, userName)
    const lines = text.split('\n')

    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        i++
        continue
      }

      // Horizontal Rule
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`hr-${i}`} className="article-hr" />)
        i++
        continue
      }

      // Headers (Strict single line header match!)
      if (trimmed.startsWith('# ')) {
        elements.push(<h1 key={`h1-${i}`} className="article-h1">{parseInlineMarkdown(trimmed.replace(/^#\s+/, ''))}</h1>)
        i++
        continue
      }
      if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={`h2-${i}`} className="article-h2">{parseInlineMarkdown(trimmed.replace(/^##\s+/, ''))}</h2>)
        i++
        continue
      }
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i}`} className="article-h3">{parseInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h3>)
        i++
        continue
      }
      if (trimmed.startsWith('#### ')) {
        elements.push(<h4 key={`h4-${i}`} className="article-h4">{parseInlineMarkdown(trimmed.replace(/^####\s+/, ''))}</h4>)
        i++
        continue
      }

      // Markdown Table Grouping
      if (trimmed.startsWith('|') && trimmed.includes('|')) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim())
          i++
        }
        const dataLines = tableLines.filter((l) => !/^[|\s-:]+$/.test(l))
        if (dataLines.length > 0) {
          const headerCells = dataLines[0].split('|').map((c) => c.trim()).filter(Boolean)
          const bodyRows = dataLines.slice(1).map((row) => row.split('|').map((c) => c.trim()).filter(Boolean))

          elements.push(
            <div key={`table-${i}`} className="markdown-table-wrapper">
              <table className="markdown-table">
                <thead>
                  <tr>
                    {headerCells.map((cell, hIdx) => (
                      <th key={hIdx}>{parseInlineMarkdown(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{parseInlineMarkdown(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        continue
      }

      // Ordered List Grouping (`1. `, `2. `)
      if (/^\d+\.\s+/.test(trimmed)) {
        const listItems: string[] = []
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
          i++
        }
        elements.push(
          <ol key={`ol-${i}`} className="article-ol">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInlineMarkdown(item)}</li>
            ))}
          </ol>
        )
        continue
      }

      // Unordered List Grouping (`- `, `* `)
      if (/^[-*]\s+/.test(trimmed)) {
        const listItems: string[] = []
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''))
          i++
        }
        elements.push(
          <ul key={`ul-${i}`} className="article-ul">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInlineMarkdown(item)}</li>
            ))}
          </ul>
        )
        continue
      }

      // Regular Paragraph Grouping (accumulate consecutive normal text lines)
      const pLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('|') &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !/^[-*]\s+/.test(lines[i].trim()) &&
        lines[i].trim() !== '---' &&
        lines[i].trim() !== '***'
      ) {
        pLines.push(lines[i].trim())
        i++
      }

      if (pLines.length > 0) {
        elements.push(
          <p key={`p-${i}`} className="article-p">
            {pLines.map((pLine, idx) => (
              <span key={idx}>
                {parseInlineMarkdown(pLine)}
                {idx < pLines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      }
    }

    return <div className="article-markdown-body">{elements}</div>
  }

  // Parse inline Markdown (**bold**, *italic*, `code`)
  const parseInlineMarkdown = (inlineText: string) => {
    const parts = inlineText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="article-bold">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="article-italic">{part.slice(1, -1)}</em>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="article-code">{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  // Active Thinking Step Icon
  const ActiveStepIcon = thinkingSteps[currentStepIdx]?.icon || Search

  return (
    <div className="gemini-chat-page animate-fade-in">
      {/* Session Controls Top Bar */}
      <div className="chat-control-bar">
        <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(!showHistory)}>
          <History size={16} /> Riwayat Chat ({sessions.length})
        </button>
        <button className="btn btn-outline btn-sm" onClick={handleNewChatClick}>
          <Plus size={16} /> Chat Baru
        </button>
      </div>

      {/* History Drawer Overlay */}
      {showHistory && (
        <div className="history-drawer animate-fade-in">
          <div className="drawer-header">
            <h3>Riwayat Obrolan</h3>
            <button className="btn-close" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="session-list">
            {sessions.length === 0 ? (
              <p className="empty-text">Belum ada riwayat obrolan.</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`session-item ${s.id === sessionId ? 'active' : ''}`}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <MessageSquare size={16} className="session-icon" />
                  <span className="session-title">{s.title}</span>
                  <button className="btn-del" onClick={(e) => deleteSession(s.id, e)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Stream Area (ChatGPT / Gemini Style - Full Canvas Width) */}
      <div className="chat-stream">
        {isLoadingMessages ? (
          <div className="chat-loading-skeleton animate-fade-in">
            <div className="skeleton-msg skeleton-user"></div>
            <div className="skeleton-msg skeleton-bot"></div>
            <div className="skeleton-msg skeleton-user"></div>
          </div>
        ) : !sessionId || messages.length === 0 ? (
          <div className="gemini-hero-state">
            <div className="hero-sparkle-icon">
              <Sparkles size={36} />
            </div>
            <h2>Halo, {userName}!</h2>
            <p>Apa yang ingin kamu konsultasikan tentang kesehatan & perawatan kulitmu hari ini?</p>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((m) => (
              <div key={m.id} className={`message-row ${m.sender === 'user' ? 'row-user' : 'row-bot'}`}>
                {m.sender === 'bot' && (
                  <div className="avatar-icon bot-avatar">
                    <Sparkles size={18} />
                  </div>
                )}

                <div className={`message-content ${m.sender === 'user' ? 'content-user' : 'content-bot'}`}>
                  {m.sender === 'bot' ? renderFormattedMessage(m.text) : m.text}
                </div>

                {m.sender === 'user' && (
                  <div className="avatar-icon user-avatar">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {/* Dynamic Contextual Thinking Indicator (STRICTLY LUCIDE ICONS) */}
            {isSending && (
              <div className="message-row row-bot animate-fade-in">
                <div className="avatar-icon bot-avatar ambient-pulse-avatar">
                  <Sparkles size={18} className="sparkle-pulse" />
                </div>
                <div className="message-content content-bot dynamic-thinking-content">
                  <ActiveStepIcon size={16} className="step-lucide-icon" />
                  <span className="thinking-step-text">
                    {thinkingSteps[currentStepIdx]?.text || 'Menganalisis pertanyaan kamu...'}
                  </span>
                  <span className="jumping-dots">
                    <span className="dot dot-1">.</span>
                    <span className="dot dot-2">.</span>
                    <span className="dot dot-3">.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Locked Sticky Floating Bottom Input Bar */}
      <div className="floating-input-wrapper">
        <div className="floating-input-bar">
          <input
            type="text"
            className="gemini-input"
            placeholder="Tanyakan sesuatu pada AI Skincluv..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isSending}
          />
          <button
            className="gemini-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
            title="Kirim Pesan"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {pendingCoinConfirm && (
        <CoinConfirmModal
          isOpen={!!pendingCoinConfirm}
          coinCost={pendingCoinConfirm.coinCost}
          currentBalance={currentCoins}
          featureName={pendingCoinConfirm.featureName}
          onConfirm={confirmCoinUsage}
          onCancel={cancelCoinUsage}
        />
      )}

      <style>{`
        .gemini-chat-page {
          display: flex; flex-direction: column; flex: 1; height: 100%; min-height: 0;
          width: 100%; position: relative; overflow: hidden;
        }

        .chat-control-bar {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: 8px; border-bottom: 1px solid var(--color-secondary-container); flex-shrink: 0;
        }

        .history-drawer {
          position: absolute; top: 48px; left: 0; width: 320px;
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl); padding: var(--space-md); box-shadow: var(--shadow-lg); z-index: 50;
        }
        .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .drawer-header h3 { font-size: 1rem; margin: 0; }
        .btn-close { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: var(--color-secondary); }
        .session-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; }
        .session-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-md);
          background: var(--color-surface-container-low); cursor: pointer; transition: all 0.2s;
        }
        .session-item:hover, .session-item.active { background: var(--color-secondary-container); color: var(--color-primary); font-weight: 700; }
        .session-title { flex: 1; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .btn-del { background: transparent; border: none; color: var(--color-secondary); cursor: pointer; padding: 2px; }

        .chat-stream {
          flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-md) 0; display: flex; flex-direction: column;
        }

        .chat-loading-skeleton {
          display: flex; flex-direction: column; gap: 16px; max-width: 1000px; width: 100%; margin: auto; padding: var(--space-md);
        }
        .skeleton-msg {
          height: 54px; border-radius: var(--radius-xl); background: rgba(212, 229, 241, 0.4);
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        .skeleton-user { width: 60%; margin-left: auto; background: rgba(14, 165, 233, 0.2); }
        .skeleton-bot { width: 75%; margin-right: auto; }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }

        .gemini-hero-state {
          margin: auto; text-align: center; max-width: 600px; padding: var(--space-md);
        }
        .hero-sparkle-icon {
          width: 64px; height: 64px; border-radius: 50%; background: var(--color-secondary-fixed);
          color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md) auto;
          box-shadow: var(--shadow-sky);
        }
        .gemini-hero-state h2 { font-size: 2rem; font-weight: 700; color: var(--color-primary); margin: 0 0 6px 0; font-family: var(--font-heading); }
        .gemini-hero-state p { font-size: 1rem; color: var(--color-text-muted); margin: 0; line-height: 1.5; }

        /* Full Canvas Width Chat Stream Container */
        .messages-container {
          width: 100%; max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-md);
          padding: 0 var(--space-md);
        }

        .message-row { display: flex; gap: 14px; width: 100%; }
        .row-user { justify-content: flex-end; }
        .row-bot { justify-content: flex-start; }

        .avatar-icon {
          width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 0.875rem; font-weight: 700;
        }
        .bot-avatar { background: var(--color-secondary-fixed); color: var(--color-primary); }
        .user-avatar { background: var(--color-primary-container); color: white; }

        /* Dynamic Ambient Pulsing Avatar */
        .ambient-pulse-avatar {
          animation: skyPulse 1.8s infinite ease-in-out;
        }
        @keyframes skyPulse {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        .sparkle-pulse {
          animation: spinSparkle 3s linear infinite;
        }
        @keyframes spinSparkle {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }

        .message-content {
          width: 100%; max-width: 100%; padding: 14px 20px; border-radius: var(--radius-xl); font-size: 0.9375rem; line-height: 1.6;
        }
        .content-bot {
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          color: var(--color-text-main); box-shadow: var(--shadow-sm); border-top-left-radius: 4px;
        }
        .content-user {
          background: var(--color-primary); color: white; border-top-right-radius: 4px; box-shadow: var(--shadow-sm);
          max-width: 80%; margin-left: auto;
        }

        /* Rich Article Markdown Typography Hierarchy */
        .article-markdown-body {
          display: flex; flex-direction: column; gap: 12px; color: var(--color-text-main); width: 100%;
        }
        .article-h1 {
          font-size: 1.35rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-heading);
          margin: 12px 0 4px 0; border-bottom: 2px solid var(--color-secondary-container); padding-bottom: 4px;
        }
        .article-h2 {
          font-size: 1.2rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-heading);
          margin: 10px 0 4px 0;
        }
        .article-h3 {
          font-size: 1.05rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-heading);
          margin: 10px 0 2px 0;
        }
        .article-h4 {
          font-size: 0.95rem; font-weight: 700; color: var(--color-text-main); margin: 6px 0 2px 0;
        }
        .article-p {
          margin: 0; line-height: 1.65; color: var(--color-text-main); font-weight: 400;
        }
        .article-bold {
          font-weight: 700; color: var(--color-primary);
        }
        .article-italic {
          font-style: italic; color: var(--color-secondary);
        }
        .article-code {
          background: var(--color-surface-container); padding: 2px 6px; border-radius: var(--radius-sm);
          font-family: monospace; font-size: 0.85em; color: var(--color-primary); border: 1px solid var(--color-secondary-container);
        }
        .article-ol {
          margin: 4px 0 4px 20px; padding: 0; display: flex; flex-direction: column; gap: 6px; list-style-type: decimal;
        }
        .article-ul {
          margin: 4px 0 4px 20px; padding: 0; display: flex; flex-direction: column; gap: 6px; list-style-type: disc;
        }
        .article-hr {
          border: none; border-top: 1px solid var(--color-secondary-container); margin: 12px 0;
        }

        /* Markdown Table Responsive Container */
        .markdown-table-wrapper {
          width: 100%; overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-secondary-container);
          margin: 12px 0; background: var(--color-surface-container-lowest); box-shadow: var(--shadow-sm);
        }
        .markdown-table {
          width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left;
        }
        .markdown-table th {
          background: rgba(212, 229, 241, 0.5); color: var(--color-primary); font-weight: 700;
          padding: 10px 14px; border-bottom: 2px solid var(--color-secondary-container); white-space: nowrap;
        }
        .markdown-table td {
          padding: 10px 14px; border-top: 1px solid var(--color-secondary-container); color: var(--color-text-main);
          line-height: 1.5;
        }
        .markdown-table tr:nth-child(even) {
          background: rgba(248, 250, 252, 0.5);
        }

        /* Dynamic Contextual Thinking Indicator (STRICTLY LUCIDE ICONS) */
        .dynamic-thinking-content {
          display: flex; align-items: center; gap: 10px; color: var(--color-primary); font-size: 0.90625rem; font-weight: 600;
          background: rgba(238, 246, 252, 0.85); border-color: rgba(186, 224, 247, 0.7); max-width: max-content;
        }
        .step-lucide-icon {
          color: var(--color-primary); flex-shrink: 0; animation: iconPulse 1.5s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        .thinking-step-text {
          transition: opacity 0.3s ease-in-out;
        }
        .jumping-dots {
          display: inline-flex; gap: 2px; font-weight: 800; font-size: 1.25rem; line-height: 0.8; color: var(--color-primary);
        }
        .dot {
          animation: dotJump 1.4s infinite ease-in-out;
        }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
        @keyframes dotJump {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }

        /* Locked Sticky Bottom Floating Input Bar */
        .floating-input-wrapper {
          flex-shrink: 0; position: sticky; bottom: 0; z-index: 30;
          width: 100%; max-width: 1000px; margin: 0 auto;
          background: linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.9) 35%, rgba(248, 250, 252, 1) 100%);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          padding: 8px 16px 16px 16px;
        }
        .floating-input-bar {
          display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 18px;
          background: var(--color-surface-container-lowest); border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl); box-shadow: var(--shadow-sky); transition: all 0.2s;
        }
        .floating-input-bar:focus-within {
          border-color: var(--color-primary-container); box-shadow: 0 4px 20px rgba(14, 165, 233, 0.18);
        }
        .gemini-input {
          flex: 1; border: none; background: transparent; font-family: var(--font-body); font-size: 0.9375rem;
          outline: none; color: var(--color-text-main);
        }
        .gemini-send-btn {
          width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); color: white;
          border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s; flex-shrink: 0;
        }
        .gemini-send-btn:disabled { opacity: 0.4; cursor: not-allowed; background: var(--color-secondary); }
        .gemini-send-btn:hover:not(:disabled) { background: var(--color-primary-container); transform: scale(1.04); }
      `}</style>
    </div>
  )
}
