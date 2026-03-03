import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function QuickAsk() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamingIdRef = useRef<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const unsub = window.api.onAnswerChunk((chunk) => {
      const id = streamingIdRef.current
      if (!id) return
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, text: m.text + chunk } : m)
      )
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || streaming) return

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `asst-${Date.now()}`

    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: question }])
    setInput('')
    setStreaming(true)

    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '' }])
    streamingIdRef.current = assistantMsgId

    try {
      await window.api.quickAsk(question)
    } finally {
      streamingIdRef.current = null
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const clearHistory = () => {
    if (streaming) return
    setMessages([])
    inputRef.current?.focus()
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          borderBottom: '2px solid #000',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text)',
            }}
          >
            Quick Ask
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text)',
              background: 'var(--color-accent)',
              border: '2px solid #000',
              padding: '2px 8px',
            }}
          >
            Knowledge Base
          </span>
        </div>
        <button
          onClick={clearHistory}
          disabled={streaming || messages.length === 0}
          className="neo-btn-sm"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            opacity: streaming || messages.length === 0 ? 0.3 : 1,
            cursor: streaming || messages.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '2.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-text)',
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              ASK ANYTHING
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.85rem',
                color: 'var(--color-muted)',
                textAlign: 'center',
                borderTop: '2px solid #000',
                paddingTop: '12px',
                marginTop: '4px',
              }}
            >
              Type a question to get answers from your knowledge base
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{ maxWidth: '80%' }}>
              {/* Role label */}
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-muted)',
                  marginBottom: '6px',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                {msg.role === 'user' ? 'You' : 'PitchPilot'}
              </div>

              {/* Bubble */}
              {msg.role === 'user' ? (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--color-accent)',
                    border: '2px solid #000',
                    boxShadow: 'var(--shadow-sm)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    lineHeight: 1.55,
                    color: 'var(--color-text)',
                  }}
                >
                  {msg.text}
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-surface)',
                    border: '2px solid #000',
                    borderLeft: '4px solid var(--color-ai)',
                    boxShadow: 'var(--shadow-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    lineHeight: 1.65,
                    color: 'var(--color-text)',
                  }}
                >
                  {msg.text}
                  {streaming && msg.role === 'assistant' && msg.id === streamingIdRef.current && (
                    <span className="cursor-blink" style={{ color: 'var(--color-text)' }}>|</span>
                  )}
                  {!streaming && msg.role === 'assistant' && msg.text === '' && (
                    <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>No response received</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          borderTop: '2px solid #000',
          padding: '16px',
          background: 'var(--bg-surface)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about your knowledge base..."
            disabled={streaming}
            className="neo-input"
            style={{
              flex: 1,
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              padding: '10px 14px',
              opacity: streaming ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="neo-btn"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '10px 20px',
              background: 'var(--color-accent)',
              color: 'var(--color-text)',
              opacity: !input.trim() || streaming ? 0.4 : 1,
              cursor: !input.trim() || streaming ? 'not-allowed' : 'pointer',
            }}
          >
            {streaming ? '...' : 'Ask'}
          </button>
        </form>

        {streaming && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                background: '#000',
                display: 'inline-block',
                animation: 'pulse 1.2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-muted)',
              }}
            >
              Generating response...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
