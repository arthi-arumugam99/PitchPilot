import { useState, useEffect } from 'react'
import type { CallRecap } from '../../../shared/types'

interface HomePageProps {
  onStartCall: () => void
  onViewRecap: (recap: CallRecap) => void
}

export default function HomePage({ onStartCall, onViewRecap }: HomePageProps) {
  const [recaps, setRecaps] = useState<CallRecap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getRecaps().then((data) => {
      setRecaps(data)
      setLoading(false)
    })
  }, [])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  const formatDurationShort = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const today = new Date().toDateString()
  const todayRecaps = recaps.filter((r) => new Date(r.date).toDateString() === today)
  const callsToday = todayRecaps.length
  const totalDuration = todayRecaps.reduce((sum, r) => sum + r.duration, 0)
  const triggersToday = todayRecaps.reduce(
    (sum, r) => sum + (r.objectionsRaised?.length || 0) + (r.keyTopics?.length || 0),
    0
  )
  const aiAssistsToday = todayRecaps.reduce(
    (sum, r) => sum + (r.nextSteps?.length || 0) + (r.commitmentsMade?.length || 0),
    0
  )

  const getPhaseReached = (recap: CallRecap) => {
    const transcript = recap.transcript || []
    const len = transcript.length
    if (len > 10) return 'Close'
    if (len > 4) return 'Hook'
    return 'Intro'
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b-2 border-black">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            DASHBOARD
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Your sales performance at a glance
          </p>
        </div>
        <button
          onClick={onStartCall}
          className="neo-btn flex items-center gap-2 px-6 py-3 text-sm"
          style={{ background: 'var(--color-accent)', color: '#000' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          Start Call
        </button>
      </div>

      <div className="px-8 py-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard label="Calls Today" value={callsToday.toString()} accent="var(--color-blue)" />
          <MetricCard label="Total Duration" value={formatDurationShort(totalDuration)} accent="var(--color-ai)" />
          <MetricCard label="Triggers Detected" value={triggersToday.toString()} accent="var(--color-accent)" />
          <MetricCard label="AI Assists" value={aiAssistsToday.toString()} accent="var(--color-danger)" />
        </div>

        {/* Recent Sessions Table */}
        <div className="neo-card overflow-hidden" style={{ cursor: 'default' }}>
          <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between">
            <h2
              className="text-base font-bold uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Recent Sessions
            </h2>
            <span
              className="text-xs font-medium px-2 py-1 border-2 border-black"
              style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-primary)' }}
            >
              {recaps.length} total
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              Loading sessions...
            </div>
          ) : recaps.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div
                className="text-4xl font-extrabold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#ddd' }}
              >
                NO CALLS YET
              </div>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Start a call to see your sessions here
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  {['Date', 'Duration', 'Phase', 'Topics', 'Objections', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-bold uppercase tracking-wider ${
                        h === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recaps.map((recap) => (
                  <tr
                    key={recap.id}
                    className="border-b border-black/10 cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-surface)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF9C4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
                    onClick={() => onViewRecap(recap)}
                  >
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold">
                        {new Date(recap.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(recap.date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatDuration(recap.duration)}
                    </td>
                    <td className="px-6 py-3.5">
                      <PhaseBadge phase={getPhaseReached(recap)} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                        {recap.keyTopics.slice(0, 2).map((t, i) => (
                          <span
                            key={i}
                            className="border-2 border-black px-2 py-0.5 text-xs font-medium truncate max-w-[100px]"
                            style={{ background: 'var(--bg-primary)' }}
                          >
                            {t}
                          </span>
                        ))}
                        {recap.keyTopics.length > 2 && (
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            +{recap.keyTopics.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      {recap.objectionsRaised.length > 0 ? (
                        <span
                          className="border-2 border-black px-2 py-0.5 text-xs font-bold text-white"
                          style={{ background: 'var(--color-danger)' }}
                        >
                          {recap.objectionsRaised.length}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewRecap(recap)
                        }}
                        className="neo-btn-sm text-xs px-3 py-1"
                        style={{ background: 'var(--bg-surface)' }}
                      >
                        View Recap
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="neo-card p-5" style={{ cursor: 'default' }}>
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-muted)' }}
        >
          {label}
        </span>
        <div className="w-3 h-3 border-2 border-black" style={{ background: accent }} />
      </div>
      <div
        className="text-4xl font-extrabold tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
    </div>
  )
}

function PhaseBadge({ phase }: { phase: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    Intro: { bg: 'var(--color-blue)', color: '#fff' },
    Hook: { bg: 'var(--color-accent)', color: '#000' },
    Close: { bg: 'var(--color-success)', color: '#fff' },
  }
  const s = styles[phase] || { bg: '#eee', color: '#666' }
  return (
    <span
      className="phase-badge"
      style={{ background: s.bg, color: s.color }}
    >
      {phase}
    </span>
  )
}
