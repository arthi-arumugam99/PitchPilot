import { useState, useEffect, useRef, useCallback } from 'react'
import type { TranscriptSegment, TriggerEvent, CallPhase, PrepLaunchPayload } from '../../../shared/types'

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

interface DashboardProps {
  onCallStateChange?: (active: boolean) => void
}

export default function Dashboard({ onCallStateChange }: DashboardProps) {
  const [callActive, setCallActive] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [triggers, setTriggers] = useState<TriggerEvent[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [screenLoading, setScreenLoading] = useState(false)
  const activeStreamRef = useRef<'answer' | 'screen' | null>(null)
  const [askInput, setAskInput] = useState('')
  const [phase, setPhase] = useState<CallPhase | null>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [answerStartTime, setAnswerStartTime] = useState(() => Date.now())
  const [prepContext, setPrepContext] = useState<PrepLaunchPayload | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const askInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micGainRef = useRef<GainNode | null>(null)
  const systemStreamRef = useRef<MediaStream | null>(null)

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
        return [...prev, segment]
      })
    })

    const unsub2 = window.api.onTriggerDetected((trigger) => {
      setTriggers(prev => [trigger, ...prev])
    })

    const unsub3 = window.api.onAnswerChunk((chunk) => {
      if (activeStreamRef.current === 'answer') {
        setAnswerText(prev => prev + chunk)
      }
    })
    const unsub4 = window.api.onScreenChunk((chunk) => {
      if (activeStreamRef.current === 'screen') {
        setAnswerText(prev => prev + chunk)
      }
    })

    const unsub5 = window.api.onPhaseChange((data) => {
      setPhase(data.phase as CallPhase)
    })

    const unsub6 = window.api.onMicMuteChanged((muted) => {
      setMicMuted(muted)
    })

    const unsub7 = window.api.onPrepContext((payload) => {
      setPrepContext(payload)
    })

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7() }
  }, [])

  useEffect(() => {
    if (micGainRef.current) {
      micGainRef.current.gain.value = micMuted ? 0 : 1
    }
  }, [micMuted])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  const toggleMic = useCallback(() => {
    window.api.toggleMicMute()
  }, [])

  const updateCallState = useCallback((active: boolean) => {
    setCallActive(active)
    onCallStateChange?.(active)
  }, [onCallStateChange])

  const startCall = useCallback(async () => {
    setError(null)
    try {
      const settings = await window.api.getSettings()

      // Capture microphone (use selected device or default)
      const micAudio: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      }
      if (settings.audioInputDevice && settings.audioInputDevice !== 'default') {
        micAudio.deviceId = { exact: settings.audioInputDevice }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: micAudio })
      setAudioStream(stream)

      const result = await window.api.startCall()
      if (result.error) {
        setError(result.error)
        stream.getTracks().forEach(t => t.stop())
        return
      }

      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Mic source → GainNode (for muting) → ScriptProcessor
      const micSource = audioContext.createMediaStreamSource(stream)
      const micGain = audioContext.createGain()
      micGainRef.current = micGain
      micSource.connect(micGain)

      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      micGain.connect(processor)

      // System audio loopback (VB-Cable / Stereo Mix — captures prospect's voice)
      if (settings.systemAudioDevice) {
        try {
          const sysStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: settings.systemAudioDevice },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          })
          systemStreamRef.current = sysStream
          const sysSource = audioContext.createMediaStreamSource(sysStream)
          sysSource.connect(processor) // Mixes with mic automatically
        } catch (sysErr) {
          console.warn('System audio device not available, continuing with mic only:', sysErr)
        }
      }

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]))
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        window.api.sendAudioData(int16.buffer)
      }

      processor.connect(audioContext.destination)

      updateCallState(true)
      setTranscript([])
      setTriggers([])
      setAnswerText('')
      setElapsed(0)
      setPhase(null)
      setMicMuted(false)
      setPrepContext(null)
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to start call')
    }
  }, [updateCallState])

  const endCall = useCallback(async () => {
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null }
    micGainRef.current = null
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); setAudioStream(null) }
    if (systemStreamRef.current) { systemStreamRef.current.getTracks().forEach(t => t.stop()); systemStreamRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    await window.api.endCall()
    updateCallState(false)
    setPhase(null)
    setMicMuted(false)
  }, [audioStream, updateCallState])

  const requestAnswer = async () => {
    activeStreamRef.current = 'answer'
    setAnswerLoading(true)
    setAnswerText('')
    setAnswerStartTime(Date.now())
    try {
      await window.api.aiHelp()
    } finally {
      setAnswerLoading(false)
      activeStreamRef.current = null
    }
  }

  const requestScreen = async () => {
    activeStreamRef.current = 'screen'
    setScreenLoading(true)
    setAnswerText('')
    setAnswerStartTime(Date.now())
    try {
      await window.api.analyzeScreen()
    } finally {
      setScreenLoading(false)
      activeStreamRef.current = null
    }
  }

  const askQuestion = async () => {
    const q = askInput.trim()
    if (!q) return
    activeStreamRef.current = 'answer'
    setAnswerLoading(true)
    setAnswerText('')
    setAskInput('')
    setAnswerStartTime(Date.now())
    try {
      await window.api.aiHelp(q)
    } finally {
      setAnswerLoading(false)
      activeStreamRef.current = null
    }
  }

  const dismissTrigger = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id))
  }

  const dismissAnswer = () => {
    setAnswerText('')
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const phaseConfig: Record<string, { bg: string; color: string; label: string }> = {
    intro: { bg: 'var(--color-blue)', color: '#fff', label: 'INTRO' },
    hook: { bg: 'var(--color-accent)', color: '#000', label: 'HOOK' },
    close: { bg: 'var(--color-success)', color: '#fff', label: 'CLOSE' },
  }

  const triggerTypeColor = (type: string) => {
    if (type === 'objection' || type === 'risk') return 'var(--color-danger)'
    if (type === 'buying_signal' || type === 'closing') return 'var(--color-success)'
    if (type === 'competitor' || type === 'pricing') return 'var(--color-accent)'
    return 'var(--color-blue)'
  }

  // Auto-minimize main window when call starts so user focuses on overlay
  useEffect(() => {
    if (callActive) {
      window.api.minimizeMain()
    }
  }, [callActive])

  // ===== ACTIVE CALL: minimal view (user should be on Zoom watching overlay) =====
  if (callActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md">
          {/* Pulsing call indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-4 h-4 bg-[#22c55e] rounded-full animate-pulse" />
            <span
              className="text-4xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
            >
              Call Active
            </span>
          </div>

          {/* Timer */}
          <div
            className="text-6xl font-bold tabular-nums mb-8"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {formatTime(elapsed)}
          </div>

          {/* Overlay reminder */}
          <div
            className="border-2 border-black p-4 mb-8"
            style={{ background: 'var(--color-ai)', boxShadow: 'var(--shadow-md)' }}
          >
            <div
              className="text-sm font-bold uppercase tracking-wide mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your AI copilot is on the overlay
            </div>
            <div className="text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted)' }}>
              Check the floating window on top of your Zoom/Teams call.
              Triggers, coaching, and answers appear there automatically.
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={endCall}
              className="neo-btn flex items-center gap-2 px-6 py-3 text-sm text-white"
              style={{ background: 'var(--color-danger)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              End Call
            </button>

            <button
              onClick={toggleMic}
              className="neo-btn p-3"
              style={{
                background: micMuted ? 'var(--color-danger)' : 'var(--bg-surface)',
                color: micMuted ? '#fff' : '#000',
              }}
              title={micMuted ? 'Unmute' : 'Mute'}
            >
              {micMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => window.api.toggleOverlay()}
              className="neo-btn p-3"
              style={{ background: 'var(--bg-surface)' }}
              title="Toggle overlay"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{transcript.filter(s => s.isFinal).length}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Segments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{triggers.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}>Triggers</div>
            </div>
            {phase && phaseConfig[phase] && (
              <div className="text-center">
                <span
                  className="phase-badge text-sm"
                  style={{ background: phaseConfig[phase].bg, color: phaseConfig[phase].color }}
                >
                  {phaseConfig[phase].label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===== NO ACTIVE CALL: start call view =====
  return (
    <div className="h-full flex" style={{ background: 'var(--bg-primary)' }}>
      {/* LEFT PANEL: Controls + Transcript */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Header */}
        <div className="flex items-center px-6 py-4 border-b-2 border-black" style={{ background: 'var(--bg-surface)' }}>
          <h1
            className="text-lg font-bold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Call Session
          </h1>
        </div>

        {/* Controls bar */}
        <div
          className="flex items-center px-4 py-2.5 m-4 mb-0 border-2 border-black"
          style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
        >
          <button
            onClick={startCall}
            className="neo-btn flex items-center gap-2 px-5 py-2 text-sm"
            style={{ background: 'var(--color-accent)', color: '#000' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Start Call
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mx-4 mt-2 px-4 py-2.5 border-2 border-black text-sm flex items-center gap-2"
            style={{ background: '#FFE0E6', color: 'var(--color-danger)' }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Transcript area */}
        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-4">
          {transcript.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div
                className="text-5xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: '#e0e0e0' }}
              >
                READY
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Hit Start Call to begin — the overlay will appear on your Zoom/Teams window
              </div>
            </div>
          )}

          <div className="space-y-1 max-w-3xl mx-auto">
            {transcript.filter(s => s.isFinal).map(segment => (
              <div key={segment.id} className="flex gap-3 py-1.5">
                <div
                  className="w-1 shrink-0 mt-1.5"
                  style={{
                    minHeight: '16px',
                    background: segment.speaker === 'rep' ? 'var(--color-blue)' : 'var(--color-accent)',
                    borderLeft: `3px solid ${segment.speaker === 'rep' ? 'var(--color-blue)' : 'var(--color-accent)'}`,
                  }}
                />
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: segment.speaker === 'rep' ? 'var(--color-blue)' : '#b8860b',
                    }}
                  >
                    {segment.speaker === 'rep' ? 'YOU' : 'THEM'}
                  </span>
                  <p className="text-sm leading-relaxed mt-0.5">{segment.text}</p>
                </div>
              </div>
            ))}
            {transcript.filter(s => !s.isFinal).map(segment => (
              <div key={segment.id} className="flex gap-3 py-1.5 opacity-40">
                <div
                  className="w-1 shrink-0 mt-1.5"
                  style={{
                    minHeight: '16px',
                    background: segment.speaker === 'rep' ? 'var(--color-blue)' : 'var(--color-accent)',
                    borderLeft: `3px solid ${segment.speaker === 'rep' ? 'var(--color-blue)' : 'var(--color-accent)'}`,
                  }}
                />
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: segment.speaker === 'rep' ? 'var(--color-blue)' : '#b8860b',
                    }}
                  >
                    {segment.speaker === 'rep' ? 'YOU' : 'THEM'}
                  </span>
                  <p className="text-sm leading-relaxed mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {segment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: AI Responses + Triggers */}
      <div className="w-[380px] shrink-0 flex flex-col m-4 ml-0 gap-3">
        {/* Prep summary card */}
        {prepContext && (prepContext.prepSummary || prepContext.briefing) && (
          <div
            className="border-2 border-black overflow-hidden group"
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="px-4 py-2 border-b-2 border-black flex items-center gap-2"
              style={{ background: 'var(--color-ai)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: '#000' }}
              >
                Prep Summary
              </span>
              <button
                onClick={() => setPrepContext(null)}
                className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 transition-all"
                title="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {prepContext.prospectName && (
                <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  {prepContext.prospectName}
                  {prepContext.prospectRole && <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> &middot; {prepContext.prospectRole}</span>}
                  {prepContext.prospectCompany && <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> @ {prepContext.prospectCompany}</span>}
                </div>
              )}
              {prepContext.briefing?.matchedPersona && (
                <div className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                  Persona: {prepContext.briefing.matchedPersona}
                </div>
              )}
              {prepContext.briefing?.suggestedOpeners?.[0] && (
                <div className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                  Lead: {prepContext.briefing.suggestedOpeners[0].slice(0, 80)}...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Answer card */}
        {(answerText || answerLoading || screenLoading) && (
          <div
            className={`border-2 border-black overflow-hidden group ${
              screenLoading ? 'screen-accent' : 'ai-accent'
            }`}
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="px-4 py-2.5 border-b-2 border-black flex items-center gap-2">
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: screenLoading ? 'var(--color-blue)' : 'var(--color-ai)',
                }}
              >
                {screenLoading ? 'Screen Analysis' : 'AI Response'}
              </span>
              {(answerLoading || screenLoading) && (
                <span className="cursor-blink text-xs" style={{ color: 'var(--color-ai)' }}>|</span>
              )}
              <span
                className="text-[11px] ml-auto"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {timeAgo(answerStartTime)}
              </span>
              {!answerLoading && !screenLoading && answerText && (
                <button
                  onClick={dismissAnswer}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 transition-all"
                  title="Dismiss"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="px-4 py-3 max-h-64 overflow-y-auto">
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {answerText}
                {(answerLoading || screenLoading) && (
                  <span className="cursor-blink" style={{ color: 'var(--color-ai)' }}>|</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Triggers area */}
        <div
          className="flex-1 overflow-y-auto border-2 border-black"
          style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-4 py-2.5 border-b-2 border-black flex items-center">
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Triggers
            </span>
            {triggers.length > 0 && (
              <span
                className="ml-2 text-[11px] font-bold px-2 py-0.5 border-2 border-black"
                style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-primary)' }}
              >
                {triggers.length}
              </span>
            )}
          </div>

          <div className="p-3 space-y-2">
            {triggers.length === 0 && !answerText && (
              <div className="text-center py-10">
                <div
                  className="text-2xl font-extrabold mb-2"
                  style={{ fontFamily: 'var(--font-display)', color: '#e0e0e0' }}
                >
                  LISTENING
                </div>
                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Auto-detected insights appear here
                </div>
              </div>
            )}

            {triggers.map((trigger, i) => {
              const isOld = Date.now() - trigger.timestamp > 30000
              return (
                <div
                  key={trigger.id}
                  className={`card-enter p-3 border-2 border-black group/card ${isOld ? 'trigger-fade' : ''}`}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: triggerTypeColor(trigger.type),
                    background: 'var(--bg-surface)',
                    boxShadow: isOld ? 'none' : 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-display)', color: triggerTypeColor(trigger.type) }}
                    >
                      {trigger.type.replace('_', ' ')}
                    </span>
                    {trigger.confidence === 'high' && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 border-2 border-black text-white"
                        style={{ background: 'var(--color-success)' }}
                      >
                        HIGH
                      </span>
                    )}
                    <span
                      className="text-[10px] ml-auto"
                      style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                    >
                      {timeAgo(trigger.timestamp)}
                    </span>
                    <button
                      onClick={() => dismissTrigger(trigger.id)}
                      className="opacity-0 group-hover/card:opacity-100 p-0.5 hover:bg-black/5 transition-all"
                      title="Dismiss"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p
                    className={`leading-relaxed ${i === 0 ? 'text-sm font-medium' : 'text-[13px]'}`}
                    style={{ fontFamily: i === 0 ? 'var(--font-body)' : 'var(--font-body)' }}
                  >
                    {trigger.suggestedResponse}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
