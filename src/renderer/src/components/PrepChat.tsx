import { useState, useEffect, useRef } from 'react'
import type { PrepBriefing } from '../../../shared/types'

interface PrepMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  type: 'chat' | 'briefing'
  timestamp: number
}

interface PrepChatProps {
  onLaunchCall: () => void
}

/** Parse a structured briefing response into a PrepBriefing object. */
function parseBriefing(text: string): PrepBriefing | null {
  if (!text.includes('**PERSONA MATCH:**') && !text.includes('**PAIN POINTS:**')) return null

  const getSection = (header: string): string => {
    const regex = new RegExp(`\\*\\*${header}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`)
    const m = text.match(regex)
    return m ? m[1].trim() : ''
  }

  const getBullets = (section: string): string[] =>
    section.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)

  const getNumbered = (section: string): string[] =>
    section.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)

  const personaRaw = getSection('PERSONA MATCH')
  const painRaw = getSection('PAIN POINTS')
  const openersRaw = getSection('SUGGESTED OPENERS')
  const objectionRaw = getSection('OBJECTION PREP')
  const questionsRaw = getSection('DISCOVERY QUESTIONS')

  // Parse objection prep: "objection" → response
  const objectionPrep = getBullets(objectionRaw).map(line => {
    const arrowMatch = line.match(/["""](.+?)["""]?\s*[→\->]+\s*(.+)/)
    if (arrowMatch) return { objection: arrowMatch[1], response: arrowMatch[2] }
    return { objection: line, response: '' }
  }).filter(o => o.objection)

  return {
    matchedPersona: personaRaw || null,
    painPoints: getBullets(painRaw),
    suggestedOpeners: getNumbered(openersRaw),
    objectionPrep,
    discoveryQuestions: getNumbered(questionsRaw),
    raw: text,
  }
}

export default function PrepChat({ onLaunchCall }: PrepChatProps) {
  const [messages, setMessages] = useState<PrepMessage[]>([])
  const [briefing, setBriefing] = useState<PrepBriefing | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamingIdRef = useRef<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const unsub = window.api.onPrepChunk((chunk) => {
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

    const userMsg: PrepMessage = { id: userMsgId, role: 'user', text: question, type: 'chat', timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)
    setError(null)

    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '', type: 'chat', timestamp: Date.now() }])
    streamingIdRef.current = assistantMsgId

    // Build chat history for context
    const chatHistory = messages.map(m => ({ role: m.role, text: m.text }))

    try {
      const fullText = await window.api.prepAsk(question, chatHistory)

      // Check if the response is a structured briefing
      const parsed = parseBriefing(fullText)
      if (parsed) {
        setBriefing(parsed)
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, type: 'briefing' } : m)
        )
      }
    } finally {
      streamingIdRef.current = null
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const launchCall = async () => {
    if (launching || streaming) return
    setLaunching(true)
    setError(null)

    try {
      // Get mic permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      })
      // Stop the permission stream — Dashboard will create its own
      stream.getTracks().forEach(t => t.stop())

      const payload = {
        prospectName: briefing?.matchedPersona ? extractFromMessages(messages, 'name') : null,
        prospectCompany: extractFromMessages(messages, 'company'),
        prospectRole: extractFromMessages(messages, 'role'),
        prospectIndustry: null,
        matchedPersonaId: null,
        prepSummary: buildSummary(messages, briefing),
        briefing,
      }

      const result = await window.api.launchCallFromPrep(payload)
      if (result.success) {
        onLaunchCall()
      } else {
        setError(result.error || 'Failed to start call')
      }
    } catch (err: any) {
      setError(err.message || 'Microphone access required')
    } finally {
      setLaunching(false)
    }
  }

  const clearHistory = () => {
    if (streaming) return
    setMessages([])
    setBriefing(null)
    setError(null)
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
            Prep
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text)',
              background: 'var(--color-ai)',
              border: '2px solid #000',
              padding: '2px 8px',
            }}
          >
            AI Research
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={launchCall}
            disabled={launching || streaming}
            className="neo-btn"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '8px 16px',
              background: 'var(--color-accent)',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: launching || streaming ? 0.6 : 1,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {launching ? 'Starting...' : 'Launch Call'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mx-4 mt-3 px-4 py-2.5 border-2 border-black text-sm flex items-center gap-2"
          style={{ background: '#FFE0E6', color: 'var(--color-danger)' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      )}

      {/* Pinned Briefing Card */}
      {briefing && (
        <div className="mx-4 mt-3">
          <div
            className="border-2 border-black overflow-hidden"
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}
          >
            <div
              className="px-4 py-2.5 border-b-2 border-black flex items-center gap-2"
              style={{ background: 'var(--color-ai)', color: '#000' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Call Briefing
              </span>
              <button
                onClick={() => setBriefing(null)}
                className="ml-auto p-1 hover:bg-black/10"
                title="Dismiss briefing"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-3 space-y-3">
              {briefing.matchedPersona && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Persona Match</div>
                  <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>{briefing.matchedPersona}</div>
                </div>
              )}
              {briefing.painPoints.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Pain Points</div>
                  {briefing.painPoints.map((p, i) => (
                    <div key={i} className="text-sm flex gap-2" style={{ fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: 'var(--color-danger)' }}>-</span> {p}
                    </div>
                  ))}
                </div>
              )}
              {briefing.suggestedOpeners.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Openers</div>
                  {briefing.suggestedOpeners.map((o, i) => (
                    <div key={i} className="text-sm mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {i + 1}. {o}
                    </div>
                  ))}
                </div>
              )}
              {briefing.objectionPrep.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Objection Prep</div>
                  {briefing.objectionPrep.map((o, i) => (
                    <div key={i} className="text-sm mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>"{o.objection}"</span>
                      {o.response && <> <span style={{ color: 'var(--color-muted)' }}>&rarr;</span> {o.response}</>}
                    </div>
                  ))}
                </div>
              )}
              {briefing.discoveryQuestions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Discovery Questions</div>
                  {briefing.discoveryQuestions.map((q, i) => (
                    <div key={i} className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                      {i + 1}. {q}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              PREP YOUR CALL
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
                maxWidth: '380px',
              }}
            >
              Research prospects, get talking points, rehearse objections. Then hit <b>Launch Call</b> to go live with the overlay.
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                justifyContent: 'center',
                marginTop: '8px',
              }}
            >
              {[
                'Prep me for a CTO call',
                'Common objections?',
                'Give me 3 openers',
                'What pain points should I hit?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                  className="neo-btn-sm"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
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
            <div style={{ maxWidth: '85%' }}>
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
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                  {streaming && msg.id === streamingIdRef.current && (
                    <span className="cursor-blink" style={{ color: 'var(--color-ai)' }}>|</span>
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
            placeholder="Research your prospect, get openers, prep objections..."
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

// Helpers for extracting prospect info from user messages
function extractFromMessages(messages: PrepMessage[], field: 'name' | 'company' | 'role'): string | null {
  const userText = messages.filter(m => m.role === 'user').map(m => m.text).join(' ')
  if (field === 'name') {
    const m = userText.match(/(?:calling|for|with)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i)
    return m ? m[1] : null
  }
  if (field === 'company') {
    const m = userText.match(/(?:at|from|@)\s+([A-Z][A-Za-z\s]+?)(?:\s*,|\s*\.|\s+they|\s+who|\s+a\s|$)/i)
    return m ? m[1].trim() : null
  }
  if (field === 'role') {
    const m = userText.match(/\b(CTO|CEO|CFO|VP|Director|Manager|Head of|Chief)\s*(?:of\s+)?[A-Za-z]*/i)
    return m ? m[0] : null
  }
  return null
}

function buildSummary(messages: PrepMessage[], briefing: PrepBriefing | null): string {
  const parts: string[] = []
  if (briefing?.matchedPersona) parts.push(`Persona: ${briefing.matchedPersona}`)
  if (briefing?.painPoints?.length) parts.push(`Pain points: ${briefing.painPoints.slice(0, 2).join('; ')}`)
  if (briefing?.suggestedOpeners?.length) parts.push(`Lead: ${briefing.suggestedOpeners[0]}`)
  const userMsgs = messages.filter(m => m.role === 'user')
  if (userMsgs.length > 0) parts.push(`Focus: ${userMsgs[userMsgs.length - 1].text.slice(0, 100)}`)
  return parts.join('\n') || 'No prep context'
}
