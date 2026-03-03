import { useState, useEffect, useRef } from 'react'
import type { TranscriptSegment, TriggerEvent, PrepLaunchPayload } from '../../../shared/types'

interface QAItem {
  id: string
  question: string
  answer: string
  loading: boolean
  timestamp: number
}

export default function Overlay() {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [callActive, setCallActive] = useState(false)
  const [items, setItems] = useState<QAItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [askInput, setAskInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [micMuted, setMicMuted] = useState(false)
  const [prepSummary, setPrepSummary] = useState<PrepLaunchPayload | null>(null)
  const askInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeTypeRef = useRef<'answer' | 'screen' | null>(null)

  useEffect(() => {
    const unsub1 = window.api.onTranscriptUpdate((segment) => {
      setTranscript(prev => {
        const existing = prev.findIndex(s => !s.isFinal && s.speaker === segment.speaker)
        if (!segment.isFinal && existing >= 0) {
          const updated = [...prev]; updated[existing] = segment; return updated
        }
        if (segment.isFinal && existing >= 0) {
          const updated = [...prev]; updated[existing] = segment; return updated
        }
        return [...prev.slice(-40), segment]
      })
    })

    const unsub2 = window.api.onTriggerDetected((trigger: TriggerEvent) => {
      const label = trigger.type.replace('_', ' ')
      const item: QAItem = {
        id: trigger.id,
        question: `Detected: ${label}`,
        answer: trigger.suggestedResponse,
        loading: false,
        timestamp: Date.now(),
      }
      setItems(prev => {
        const next = [...prev, item]
        setCurrentIdx(next.length - 1)
        return next
      })
    })

    const unsub3 = window.api.onCallStatus((status) => {
      setCallActive(status === 'active')
      if (status === 'active') {
        setTranscript([])
        setItems([])
        setCurrentIdx(0)
        setElapsed(0)
        setMicMuted(false)
        setStreaming(false)
        setShowChat(false)
        timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
      } else {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }
    })

    const unsub4 = window.api.onPhaseChange(() => {})

    const unsub5 = window.api.onAnswerChunk((chunk: string) => {
      if (activeTypeRef.current === 'answer') {
        setItems(prev => {
          const last = prev[prev.length - 1]
          if (!last || !last.loading) return prev
          return [...prev.slice(0, -1), { ...last, answer: last.answer + chunk }]
        })
      }
    })

    const unsub6 = window.api.onScreenChunk((chunk: string) => {
      if (activeTypeRef.current === 'screen') {
        setItems(prev => {
          const last = prev[prev.length - 1]
          if (!last || !last.loading) return prev
          return [...prev.slice(0, -1), { ...last, answer: last.answer + chunk }]
        })
      }
    })

    const unsub7 = window.api.onFocusAskInput(() => {
      setShowChat(true)
      setTimeout(() => askInputRef.current?.focus(), 100)
    })

    const unsub8 = window.api.onTriggerScreenAnalysis(() => {
      requestScreen()
    })

    const unsub9 = window.api.onMicMuteChanged((muted) => {
      setMicMuted(muted)
    })

    const unsub10 = window.api.onPrepContext((payload: PrepLaunchPayload) => {
      setPrepSummary(payload)
      const openers = payload.briefing?.suggestedOpeners
      if (openers && openers.length > 0) {
        const name = [payload.prospectName, payload.prospectCompany].filter(Boolean).join(' @ ')
        const item: QAItem = {
          id: `prep-${Date.now()}`,
          question: name ? `Prep: Call with ${name}` : 'Pre-call prep',
          answer: openers.map((o, i) => `${i + 1}. ${o}`).join('\n\n'),
          loading: false,
          timestamp: Date.now(),
        }
        setItems(prev => {
          const next = [...prev, item]
          setCurrentIdx(next.length - 1)
          return next
        })
      }
    })

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const requestAnswer = async () => {
    activeTypeRef.current = 'answer'
    const id = `help-${Date.now()}`
    const item: QAItem = { id, question: 'AI Help — What should I say?', answer: '', loading: true, timestamp: Date.now() }
    setItems(prev => {
      const next = [...prev, item]
      setCurrentIdx(next.length - 1)
      return next
    })
    setStreaming(true)
    try {
      await window.api.aiHelp()
    } finally {
      setItems(prev => prev.map(it => it.id === id ? { ...it, loading: false } : it))
      setStreaming(false)
      activeTypeRef.current = null
    }
  }

  const requestScreen = async () => {
    activeTypeRef.current = 'screen'
    const id = `screen-${Date.now()}`
    const item: QAItem = { id, question: 'Screen Analysis', answer: '', loading: true, timestamp: Date.now() }
    setItems(prev => {
      const next = [...prev, item]
      setCurrentIdx(next.length - 1)
      return next
    })
    setStreaming(true)
    try {
      await window.api.analyzeScreen()
    } finally {
      setItems(prev => prev.map(it => it.id === id ? { ...it, loading: false } : it))
      setStreaming(false)
      activeTypeRef.current = null
    }
  }

  const askQuestion = async () => {
    const q = askInput.trim()
    if (!q) return
    activeTypeRef.current = 'answer'
    const id = `ask-${Date.now()}`
    const item: QAItem = { id, question: q, answer: '', loading: true, timestamp: Date.now() }
    setItems(prev => {
      const next = [...prev, item]
      setCurrentIdx(next.length - 1)
      return next
    })
    setAskInput('')
    setStreaming(true)
    try {
      await window.api.aiHelp(q)
    } finally {
      setItems(prev => prev.map(it => it.id === id ? { ...it, loading: false } : it))
      setStreaming(false)
      activeTypeRef.current = null
    }
  }

  const deleteItem = (id: string) => {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id)
      if (currentIdx >= next.length) setCurrentIdx(Math.max(0, next.length - 1))
      return next
    })
  }

  const goBack = () => setCurrentIdx(prev => Math.max(0, prev - 1))
  const goForward = () => setCurrentIdx(prev => Math.min(items.length - 1, prev + 1))

  const current = items[currentIdx] || null

  const enableInteractive = () => window.api.setOverlayInteractive(true)
  const disableInteractive = () => window.api.setOverlayInteractive(false)

  // ========== WAITING STATE ==========
  if (!callActive) {
    return (
      <div className="overlay-mode h-screen flex items-center justify-center">
        <div
          className="rounded-2xl px-8 py-5 text-center"
          onMouseEnter={enableInteractive}
          onMouseLeave={disableInteractive}
          style={{ background: 'rgba(15,15,25,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-3">P</div>
          <div className="text-sm font-medium text-white/80">PitchPilot</div>
          <div className="text-xs text-white/40 mt-1">Waiting for call...</div>
          <button
            onClick={() => window.api.toggleOverlay()}
            className="mt-3 px-3 py-1 text-[11px] text-white/30 hover:text-white/50 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Hide
          </button>
        </div>
      </div>
    )
  }

  // ========== ACTIVE CALL — PARAKEET-STYLE OVERLAY ==========
  return (
    <div className="overlay-mode h-screen flex flex-col">

      {/* ===== TOP TOOLBAR (like Parakeet's green bar) ===== */}
      <div
        className="flex items-center gap-2 px-4 py-2 mx-4 mt-3 rounded-xl"
        onMouseEnter={enableInteractive}
        onMouseLeave={disableInteractive}
        style={{ background: 'rgba(15,15,25,0.9)', backdropFilter: 'blur(16px)' }}
      >
        {/* Brand */}
        <div className="w-7 h-7 bg-[#2563eb] rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0">P</div>
        <span className="text-[13px] font-semibold text-white/80 mr-1">PitchPilot</span>

        {/* Mic */}
        <button
          onClick={() => window.api.toggleMicMute()}
          className={`p-1.5 rounded-lg transition-colors ${
            micMuted ? 'bg-red-500/30 text-red-400' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
          title={micMuted ? 'Unmute' : 'Mute'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {micMuted ? (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </>
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* AI Help button */}
        <button
          onClick={requestAnswer}
          disabled={streaming}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-30 text-white text-[12px] font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Help
        </button>

        {/* Analyze Screen */}
        <button
          onClick={requestScreen}
          disabled={streaming}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-30 text-white text-[12px] font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Analyze Screen
        </button>

        {/* Chat toggle */}
        <button
          onClick={() => { setShowChat(!showChat); setTimeout(() => askInputRef.current?.focus(), 100) }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors ${
            showChat ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat
        </button>

        <div className="flex-1" />

        {/* Recording + timer */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[13px] text-white/60 font-mono tabular-nums">{formatTime(elapsed)}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Close */}
        <button
          onClick={() => window.api.toggleOverlay()}
          className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/10 rounded-lg transition-colors"
          title="Hide overlay"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ===== HINT BAR (like Parakeet's info bar) ===== */}
      <div
        className="mx-4 mt-1 px-4 py-1.5 rounded-lg flex items-center"
        onMouseEnter={enableInteractive}
        onMouseLeave={disableInteractive}
        style={{ background: 'rgba(15,15,25,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <span className="text-[11px] text-white/40 flex-1 truncate">
          Click AI Help and PitchPilot will analyze the conversation and tell you exactly what to say
        </span>
        {/* Chat input (expandable) */}
        {showChat && (
          <form onSubmit={(e) => { e.preventDefault(); askQuestion() }} className="flex items-center gap-1.5 ml-3">
            <input
              ref={askInputRef}
              value={askInput}
              onChange={e => setAskInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={streaming}
              className="w-56 px-3 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-[12px] text-white placeholder:text-white/25 focus:border-[#2563eb]/50 outline-none disabled:opacity-40 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={!askInput.trim() || streaming}
              className="px-3 py-1 bg-[#2563eb] disabled:opacity-20 text-white text-[11px] font-medium rounded-lg transition-colors"
            >
              Send
            </button>
          </form>
        )}
      </div>

      {/* ===== CLICK-THROUGH TRANSPARENT ZONE (middle of screen) ===== */}
      <div className="flex-1" />

      {/* ===== MAIN Q&A CARD (bottom, like Parakeet's answer card) ===== */}
      {current && (
        <div
          className="mx-4 mb-4 rounded-2xl overflow-hidden"
          onMouseEnter={enableInteractive}
          onMouseLeave={disableInteractive}
          style={{ background: 'rgba(15,15,25,0.88)', backdropFilter: 'blur(20px)' }}
        >
          {/* Navigation bar */}
          <div className="flex items-center px-4 py-2 border-b border-white/5">
            {/* Back / Forward */}
            <button
              onClick={goBack}
              disabled={currentIdx <= 0}
              className="p-1 text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goForward}
              disabled={currentIdx >= items.length - 1}
              className="p-1 text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <span className="text-[11px] text-white/30 ml-2 font-mono">
              {currentIdx + 1} / {items.length}
            </span>

            <div className="flex-1" />

            {/* Delete */}
            <button
              onClick={() => deleteItem(current.id)}
              className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Q&A Content */}
          <div className="px-6 py-5 max-h-[45vh] overflow-y-auto">
            {/* Question */}
            <div className="text-[15px] text-white/70 font-medium mb-4">
              <span className="mr-2">💬</span>
              <span className="font-semibold">Question:</span> {current.question}
            </div>

            {/* Answer */}
            <div>
              <div className="text-[15px] text-white/70 font-semibold mb-3">
                <span className="mr-2">⭐</span>Answer:
              </div>
              <div className="text-[16px] text-white/90 leading-relaxed whitespace-pre-wrap pl-7">
                {current.answer}
                {current.loading && <span className="text-[#2563eb] animate-pulse ml-1">|</span>}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="px-6 pb-3">
            <span className="text-[11px] text-white/25">
              {new Date(current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Empty state — no Q&A yet */}
      {!current && (
        <div
          className="mx-4 mb-4 rounded-2xl px-8 py-10 text-center"
          onMouseEnter={enableInteractive}
          onMouseLeave={disableInteractive}
          style={{ background: 'rgba(15,15,25,0.85)', backdropFilter: 'blur(16px)' }}
        >
          <div className="text-white/25 text-[15px] mb-1">No responses yet</div>
          <div className="text-white/15 text-[12px]">Click AI Help or ask a question to get started</div>
        </div>
      )}
    </div>
  )
}
