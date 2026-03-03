import { useState, useEffect } from 'react'
import type { CallRecap } from '../../../shared/types'

interface RecapListProps {
  initialRecap?: CallRecap | null
}

export default function RecapList({ initialRecap }: RecapListProps) {
  const [recaps, setRecaps] = useState<CallRecap[]>([])
  const [selected, setSelected] = useState<CallRecap | null>(initialRecap || null)

  useEffect(() => { window.api.getRecaps().then(setRecaps) }, [])

  useEffect(() => {
    if (initialRecap) setSelected(initialRecap)
  }, [initialRecap])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  if (selected) {
    return (
      <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px' }}>

          {/* Back button */}
          <button
            onClick={() => setSelected(null)}
            className="neo-btn-sm"
            style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            BACK TO SESSIONS
          </button>

          {/* Title block */}
          <div style={{ marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--color-text)',
              letterSpacing: '-0.5px',
              margin: 0,
            }}>
              CALL RECAP
            </h1>
            <p style={{
              marginTop: '6px',
              fontSize: '13px',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>{new Date(selected.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span style={{ color: '#000', fontWeight: 700 }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#000' }}>{formatDuration(selected.duration)}</span>
            </p>
          </div>

          {/* Detail sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Summary */}
            <section style={{
              background: 'var(--bg-surface)',
              border: '2px solid #000',
              boxShadow: 'var(--shadow-sm)',
              padding: '20px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-muted)',
                marginBottom: '12px',
                margin: '0 0 12px 0',
              }}>
                SUMMARY
              </h2>
              <p style={{
                fontSize: '14px',
                lineHeight: 1.65,
                color: '#222',
                fontFamily: 'var(--font-body)',
                margin: 0,
              }}>
                {selected.summary}
              </p>
            </section>

            {/* Key Topics */}
            {selected.keyTopics.length > 0 && (
              <section style={{
                background: 'var(--bg-surface)',
                border: '2px solid #000',
                boxShadow: 'var(--shadow-sm)',
                padding: '20px',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-muted)',
                  margin: '0 0 12px 0',
                }}>
                  KEY TOPICS
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.keyTopics.map((t, i) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#222',
                      fontFamily: 'var(--font-body)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <span style={{ color: 'var(--color-muted)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>—</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Objections Raised */}
            {selected.objectionsRaised.length > 0 && (
              <section style={{
                background: 'var(--bg-surface)',
                border: '2px solid #000',
                boxShadow: 'var(--shadow-sm)',
                padding: '20px',
                borderLeft: '4px solid var(--color-danger)',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-danger)',
                  margin: '0 0 12px 0',
                }}>
                  OBJECTIONS RAISED
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.objectionsRaised.map((o, i) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#222',
                      fontFamily: 'var(--font-body)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>—</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Commitments Made */}
            {selected.commitmentsMade.length > 0 && (
              <section style={{
                background: 'var(--bg-surface)',
                border: '2px solid #000',
                boxShadow: 'var(--shadow-sm)',
                padding: '20px',
                borderLeft: '4px solid var(--color-success)',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-success)',
                  margin: '0 0 12px 0',
                }}>
                  COMMITMENTS MADE
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.commitmentsMade.map((c, i) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#222',
                      fontFamily: 'var(--font-body)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <span style={{ color: 'var(--color-success)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>—</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Next Steps */}
            {selected.nextSteps.length > 0 && (
              <section style={{
                background: 'var(--bg-surface)',
                border: '2px solid #000',
                boxShadow: 'var(--shadow-sm)',
                padding: '20px',
                borderLeft: '4px solid var(--color-blue)',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-blue)',
                  margin: '0 0 12px 0',
                }}>
                  NEXT STEPS
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.nextSteps.map((n, i) => (
                    <li key={i} style={{
                      fontSize: '13px',
                      color: '#222',
                      fontFamily: 'var(--font-body)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <span style={{ color: 'var(--color-blue)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>—</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Full Transcript */}
            {selected.transcript.length > 0 && (
              <section style={{
                background: 'var(--bg-surface)',
                border: '2px solid #000',
                boxShadow: 'var(--shadow-sm)',
                padding: '20px',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-muted)',
                  margin: '0 0 12px 0',
                }}>
                  FULL TRANSCRIPT
                </h2>
                <div style={{ maxHeight: '384px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.transcript.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '12px',
                        paddingLeft: '8px',
                        borderLeft: `3px solid ${seg.speaker === 'rep' ? 'var(--color-blue)' : '#F59E0B'}`,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        flexShrink: 0,
                        paddingTop: '1px',
                        color: seg.speaker === 'rep' ? 'var(--color-blue)' : '#D97706',
                        minWidth: '36px',
                      }}>
                        {seg.speaker === 'rep' ? 'YOU' : 'THEM'}
                      </span>
                      <span style={{
                        color: '#333',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.55,
                      }}>
                        {seg.text}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '2px solid #000',
        background: 'var(--bg-surface)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '-0.5px',
          color: 'var(--color-text)',
          margin: 0,
        }}>
          CALL SESSIONS
        </h1>
        <p style={{
          marginTop: '4px',
          fontSize: '13px',
          color: 'var(--color-muted)',
          fontFamily: 'var(--font-body)',
          margin: '4px 0 0 0',
        }}>
          Review past call recordings and AI-generated recaps
        </p>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px' }}>

        {/* Empty state */}
        {recaps.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#E5E5D0',
              lineHeight: 1,
              margin: '0 0 16px 0',
              letterSpacing: '-2px',
              textAlign: 'center',
            }}>
              NO SESSIONS
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-muted)',
              margin: '0 0 6px 0',
            }}>
              No call sessions yet
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: '#999',
              margin: 0,
            }}>
              Recaps are auto-generated when you end a call
            </p>
          </div>
        ) : (

          /* Session list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recaps.map(recap => (
              <button
                key={recap.id}
                onClick={() => setSelected(recap)}
                className="neo-card"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px',
                  background: 'var(--bg-surface)',
                  border: '2px solid #000',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.1s ease, transform 0.1s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)'
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(-1px, -1px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)'
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(0, 0)'
                }}
              >
                {/* Card header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                    letterSpacing: '0.02em',
                  }}>
                    {new Date(recap.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-muted)',
                    background: 'var(--bg-primary)',
                    border: '1.5px solid #000',
                    padding: '2px 7px',
                  }}>
                    {formatDuration(recap.duration)}
                  </span>
                </div>

                {/* Summary preview */}
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-muted)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.55,
                  margin: '0 0 12px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {recap.summary}
                </p>

                {/* Topic tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {recap.keyTopics.slice(0, 3).map((t, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#444',
                      background: 'var(--bg-primary)',
                      border: '2px solid #000',
                      padding: '2px 8px',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
