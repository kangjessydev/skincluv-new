import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Search,
  RefreshCw,
  User,
  Sparkles,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ChatSessionItem {
  id: string
  user_id: string
  title: string | null
  created_at: string
  last_activity: string
  profiles?: {
    full_name: string | null
    username: string | null
  } | null
}

interface ChatMessageItem {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function AdminChatsPage() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedTranscript, setCopiedTranscript] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          user_id,
          title,
          created_at,
          last_activity,
          profiles:user_id (
            full_name,
            username
          )
        `)
        .order('last_activity', { ascending: false })
        .limit(100)

      if (error) throw error
      const items = (data as unknown as ChatSessionItem[]) ?? []
      setSessions(items)
      if (items.length > 0 && !selectedSessionId) {
        setSelectedSessionId(items[0].id)
      }
    } catch (err: any) {
      console.error('[AdminChats] Error loading sessions:', err)
      setErrorMessage(err.message || 'Gagal memuat daftar sesi chat.')
    } finally {
      setIsLoadingSessions(false)
    }
  }, [selectedSessionId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages((data as ChatMessageItem[]) ?? [])
    } catch (err: any) {
      console.error('[AdminChats] Error loading messages:', err)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId)
    } else {
      setMessages([])
    }
  }, [selectedSessionId, loadMessages])

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter((s) => {
      const name = s.profiles?.full_name?.toLowerCase() || ''
      const username = s.profiles?.username?.toLowerCase() || ''
      const title = s.title?.toLowerCase() || ''
      return name.includes(q) || username.includes(q) || title.includes(q)
    })
  }, [sessions, searchQuery])

  const selectedSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || null
  }, [sessions, selectedSessionId])

  const copyConversation = () => {
    if (!messages.length) return
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}] (${new Date(m.created_at).toLocaleString('id-ID')}):\n${m.content}\n`)
      .join('\n---\n\n')
    navigator.clipboard.writeText(text)
    setCopiedTranscript(true)
    setTimeout(() => setCopiedTranscript(false), 2000)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Riwayat Chat Skinsistant AI
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Monitor interaksi percakapan konsultasi skincare antara pengguna dan asisten AI secara real-time.
          </p>
        </div>

        <button
          onClick={loadSessions}
          disabled={isLoadingSessions}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          <RefreshCw size={14} className={isLoadingSessions ? 'animate-spin' : ''} /> Segarkan Sesi
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 20,
          minHeight: 650,
          height: 'calc(100vh - 200px)',
        }}
      >
        {/* Left Column: Sessions List */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f9fafb',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            >
              <Search size={16} color="#9ca3af" />
              <input
                type="text"
                placeholder="Cari user atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 13,
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {isLoadingSessions ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                Memuat sesi...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                Tidak ada sesi ditemukan.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = s.id === selectedSessionId
                const displayName = s.profiles?.full_name || s.profiles?.username || 'User'
                const timeAgo = new Date(s.last_activity).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      marginBottom: 4,
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: 13,
                          color: isSelected ? '#1d4ed8' : '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.title || 'Percakapan Tanpa Judul'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: '#4b5563', fontWeight: 500 }}>
                          {displayName}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>•</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{timeAgo}</span>
                      </div>
                    </div>

                    <ChevronRight size={14} color={isSelected ? '#2563eb' : '#9ca3af'} style={{ marginTop: 4 }} />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Messages Stream */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {selectedSession ? (
            <>
              {/* Active Session Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f9fafb',
                }}
              >
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                    {selectedSession.title || 'Percakapan Konsultasi'}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      {selectedSession.profiles?.full_name || selectedSession.profiles?.username || 'User'}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      Dibuat: {new Date(selectedSession.created_at).toLocaleString('id-ID')}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {messages.length} pesan
                    </span>
                  </div>
                </div>

                <button
                  onClick={copyConversation}
                  disabled={messages.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: copiedTranscript ? '#059669' : '#374151',
                  }}
                >
                  {copiedTranscript ? <Check size={13} /> : <Copy size={13} />}
                  {copiedTranscript ? 'Tersalin!' : 'Salin Dialog'}
                </button>
              </div>

              {/* Messages Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  background: '#fcfcfd',
                }}
              >
                {isLoadingMessages ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 13 }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    Memuat pesan percakapan...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 13 }}>
                    Belum ada pesan dalam sesi ini.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user'
                    const time = new Date(msg.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isUser ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: isUser ? '#4b5563' : '#6366f1',
                          }}
                        >
                          {isUser ? (
                            <>
                              <span>User</span>
                              <User size={13} />
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} />
                              <span>Skinsistant AI</span>
                            </>
                          )}
                        </div>

                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '12px 16px',
                            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isUser ? '#111827' : '#ffffff',
                            color: isUser ? '#ffffff' : '#1f2937',
                            border: isUser ? 'none' : '1px solid #e5e7eb',
                            boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                            fontSize: 13,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            marginTop: 4,
                            padding: '0 4px',
                          }}
                        >
                          {time}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                padding: 40,
              }}
            >
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontWeight: 600, fontSize: 15, color: '#4b5563' }}>
                Pilih sesi percakapan di sebelah kiri
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Riwayat pesan dan saran interaktif AI akan ditampilkan di sini.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
