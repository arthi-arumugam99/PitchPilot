import { useState, useEffect } from 'react'
import type { AppSettings } from '../../../shared/types'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    navigator.mediaDevices.enumerateDevices().then(all => {
      setDevices(all.filter(d => d.kind === 'audioinput'))
    })
  }, [])

  const save = async () => {
    if (!settings) return
    await window.api.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        color: 'var(--color-muted, #666666)',
        background: 'var(--bg-primary, #FFFEF0)',
      }}
    >
      Loading...
    </div>
  )

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-primary, #FFFEF0)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.5rem 2rem',
          borderBottom: '2px solid #000',
          background: 'var(--bg-surface, #FFFFFF)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text, #000000)',
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body, "Inter", sans-serif)',
            fontSize: '0.8125rem',
            color: 'var(--color-muted, #666666)',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          Configure your API keys, audio, and overlay preferences
        </p>
      </div>

      <div
        style={{
          maxWidth: '42rem',
          margin: '0 auto',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* API Keys */}
        <section
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface, #FFFFFF)',
            border: '2px solid #000',
            boxShadow: 'var(--shadow-sm, 2px 2px 0px 0px #000)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-text, #000000)',
              marginTop: 0,
              marginBottom: '1rem',
            }}
          >
            API Keys
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.375rem',
                }}
              >
                Deepgram API Key
              </label>
              <input
                type="password"
                value={settings.deepgramApiKey}
                onChange={e => setSettings({ ...settings, deepgramApiKey: e.target.value })}
                placeholder="Enter your Deepgram API key"
                className="neo-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '0.7rem',
                  color: 'var(--color-muted, #666666)',
                  marginTop: '0.375rem',
                  marginBottom: 0,
                }}
              >
                Get a free key at deepgram.com (200 mins/month free)
              </p>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.375rem',
                }}
              >
                Anthropic API Key
              </label>
              <input
                type="password"
                value={settings.anthropicApiKey}
                onChange={e => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                placeholder="Enter your Anthropic API key"
                className="neo-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '0.7rem',
                  color: 'var(--color-muted, #666666)',
                  marginTop: '0.375rem',
                  marginBottom: 0,
                }}
              >
                Get a key at console.anthropic.com
              </p>
            </div>
          </div>
        </section>

        {/* Audio */}
        <section
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface, #FFFFFF)',
            border: '2px solid #000',
            boxShadow: 'var(--shadow-sm, 2px 2px 0px 0px #000)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-text, #000000)',
              marginTop: 0,
              marginBottom: '1rem',
            }}
          >
            Audio
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.375rem',
                }}
              >
                Microphone Input
              </label>
              <select
                value={settings.audioInputDevice}
                onChange={e => setSettings({ ...settings, audioInputDevice: e.target.value })}
                className="neo-input"
                style={{ width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              >
                <option value="default">Default Microphone</option>
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.375rem',
                }}
              >
                System Audio (Loopback)
              </label>
              <select
                value={settings.systemAudioDevice}
                onChange={e => setSettings({ ...settings, systemAudioDevice: e.target.value })}
                className="neo-input"
                style={{ width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              >
                <option value="">None (mic only)</option>
                {devices.map(d => (
                  <option key={`sys-${d.deviceId}`} value={d.deviceId}>{d.label || d.deviceId}</option>
                ))}
              </select>
              <p
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '0.7rem',
                  color: 'var(--color-muted, #666666)',
                  marginTop: '0.375rem',
                  marginBottom: 0,
                }}
              >
                Captures the prospect's voice. Select "Stereo Mix", "VB-Cable Output", or "CABLE Output" to hear both sides of the call.
              </p>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontSize: '0.7rem',
                color: 'var(--color-muted, #666666)',
                margin: 0,
                padding: '0.75rem',
                background: 'var(--bg-primary, #FFFEF0)',
                border: '2px solid var(--color-accent, #FFE500)',
              }}
            >
              Setup: Install VB-Cable (free) &rarr; set your Zoom/Teams speaker output to "CABLE Input" &rarr; select "CABLE Output" here. PitchPilot will mix both your mic and system audio for full conversation capture.
            </p>
          </div>
        </section>

        {/* Overlay */}
        <section
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface, #FFFFFF)',
            border: '2px solid #000',
            boxShadow: 'var(--shadow-sm, 2px 2px 0px 0px #000)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-text, #000000)',
              marginTop: 0,
              marginBottom: '1rem',
            }}
          >
            Overlay
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Position toggle */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.5rem',
                }}
              >
                Position
              </label>
              <div style={{ display: 'flex', gap: '0' }}>
                {(['right', 'left'] as const).map((pos, i) => (
                  <button
                    key={pos}
                    onClick={() => setSettings({ ...settings, overlayPosition: pos })}
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontFamily: 'var(--font-body, "Inter", sans-serif)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      border: '2px solid #000',
                      borderRadius: 0,
                      outline: 'none',
                      marginLeft: i === 0 ? 0 : '-2px',
                      position: 'relative',
                      zIndex: settings.overlayPosition === pos ? 1 : 0,
                      background: settings.overlayPosition === pos
                        ? 'var(--color-accent, #FFE500)'
                        : 'var(--bg-surface, #FFFFFF)',
                      color: 'var(--color-text, #000000)',
                      transition: 'background 0.1s',
                    }}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Width range */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.5rem',
                }}
              >
                Width{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontWeight: 400,
                    color: 'var(--color-muted, #666666)',
                  }}
                >
                  ({settings.overlayWidth}px)
                </span>
              </label>
              <input
                type="range"
                min={240}
                max={500}
                value={settings.overlayWidth}
                onChange={e => setSettings({ ...settings, overlayWidth: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent, #FFE500)' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '0.6875rem',
                  color: 'var(--color-muted, #666666)',
                  marginTop: '0.25rem',
                }}
              >
                <span>240px</span>
                <span>500px</span>
              </div>
            </div>

            {/* Font Size range */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #000000)',
                  marginBottom: '0.5rem',
                }}
              >
                Font Size{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontWeight: 400,
                    color: 'var(--color-muted, #666666)',
                  }}
                >
                  ({settings.fontSize}px)
                </span>
              </label>
              <input
                type="range"
                min={10}
                max={20}
                value={settings.fontSize}
                onChange={e => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent, #FFE500)' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '0.6875rem',
                  color: 'var(--color-muted, #666666)',
                  marginTop: '0.25rem',
                }}
              >
                <span>10px</span>
                <span>20px</span>
              </div>
            </div>

            {/* Auto-expand checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <input
                type="checkbox"
                checked={settings.autoExpandOnTrigger}
                onChange={e => setSettings({ ...settings, autoExpandOnTrigger: e.target.checked })}
                style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #000',
                  borderRadius: 0,
                  accentColor: 'var(--color-accent, #FFE500)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <label
                style={{
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-text, #000000)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Auto-expand overlay when trigger detected
              </label>
            </div>
          </div>
        </section>

        {/* Save */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingTop: '0.25rem',
            paddingBottom: '1.5rem',
          }}
        >
          <button
            onClick={save}
            className="neo-btn"
            style={{
              background: 'var(--color-accent, #FFE500)',
              color: 'var(--color-text, #000000)',
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Save Settings
          </button>
          {saved && (
            <span
              style={{
                fontFamily: 'var(--font-body, "Inter", sans-serif)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#16a34a',
              }}
            >
              Saved!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
