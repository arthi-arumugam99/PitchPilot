import { useState, useEffect, useRef } from 'react'
import type { CompanyProfile, BuyerPersona } from '../../../shared/types'

function emptyPersona(): BuyerPersona {
  return {
    id: crypto.randomUUID(),
    name: '',
    role: '',
    priority: 'primary',
    description: '',
    matchRoles: [],
    painPoints: [],
    triggerMoment: '',
    nightmares: [],
    buyingPower: '',
    languagePatterns: [],
    antiPatterns: [],
  }
}

interface CompanySwitcherProps {
  variant?: 'navbar' | 'sidebar'
}

export default function CompanySwitcher({ variant = 'navbar' }: CompanySwitcherProps) {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [active, setActive] = useState<CompanyProfile | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyProfile | null>(null)
  const [newName, setNewName] = useState('')
  const [newInstructions, setNewInstructions] = useState('')
  const [newColor, setNewColor] = useState('#FFE500')
  const [newProductPitch, setNewProductPitch] = useState('')
  const [newTargetVertical, setNewTargetVertical] = useState('')
  const [newPersonas, setNewPersonas] = useState<BuyerPersona[]>([])
  const [editingPersonaIdx, setEditingPersonaIdx] = useState<number | null>(null)
  const [showPersonas, setShowPersonas] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isSidebar = variant === 'sidebar'

  const load = async () => {
    const [all, current] = await Promise.all([
      window.api.getCompanies(),
      window.api.getActiveCompany(),
    ])
    setCompanies(all)
    setActive(current)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setEditing(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const switchTo = async (id: string) => {
    await window.api.switchCompany(id)
    setOpen(false)
    load()
  }

  const startCreate = () => {
    setEditing({ id: '', name: '', customInstructions: '', personas: [], productPitch: '', targetVertical: '', createdAt: 0, updatedAt: 0 })
    setNewName('')
    setNewInstructions('')
    setNewColor('#FFE500')
    setNewProductPitch('')
    setNewTargetVertical('')
    setNewPersonas([])
    setEditingPersonaIdx(null)
    setShowPersonas(false)
  }

  const startEdit = (c: CompanyProfile) => {
    setEditing(c)
    setNewName(c.name)
    setNewInstructions(c.customInstructions)
    setNewColor(c.color || '#FFE500')
    setNewProductPitch(c.productPitch || '')
    setNewTargetVertical(c.targetVertical || '')
    setNewPersonas(c.personas || [])
    setEditingPersonaIdx(null)
    setShowPersonas(false)
  }

  const saveProfile = async () => {
    if (!newName.trim()) return
    const payload: any = {
      name: newName.trim(),
      customInstructions: newInstructions.trim(),
      color: newColor,
      productPitch: newProductPitch.trim(),
      targetVertical: newTargetVertical.trim(),
      personas: newPersonas,
    }
    if (editing?.id) payload.id = editing.id

    const saved = await window.api.saveCompany(payload)
    if (!editing?.id) await window.api.switchCompany(saved.id)
    setEditing(null)
    load()
  }

  const deleteProfile = async (id: string) => {
    if (companies.length <= 1) return
    await window.api.deleteCompany(id)
    if (active?.id === id) {
      const remaining = companies.filter(c => c.id !== id)
      if (remaining.length > 0) await window.api.switchCompany(remaining[0].id)
    }
    load()
  }

  const COLORS = ['#FFE500', '#4D5BFF', '#00D4AA', '#FF375F', '#22c55e', '#ec4899', '#06b6d4', '#84cc16']

  const inputCls = isSidebar
    ? 'neo-input w-full px-3 py-2 text-sm'
    : 'neo-input w-full px-3 py-2 text-sm'

  const inputStyle = isSidebar
    ? { background: '#2a2a4e', border: '2px solid rgba(255,255,255,0.15)', color: '#fff' }
    : {}

  const textareaStyle = isSidebar
    ? { background: '#2a2a4e', border: '2px solid rgba(255,255,255,0.15)', color: '#fff' }
    : {}

  return (
    <div ref={ref} className="relative">
      {/* Active company button */}
      <button
        onClick={() => { setOpen(!open); setEditing(null) }}
        className="flex items-center gap-2 px-3 py-1.5 w-full transition-colors"
        style={isSidebar ? { background: 'rgba(255,255,255,0.05)' } : { background: 'var(--bg-primary)', border: '2px solid #000' }}
        onMouseEnter={(e) => {
          if (isSidebar) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          else e.currentTarget.style.background = '#FFF9C4'
        }}
        onMouseLeave={(e) => {
          if (isSidebar) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          else e.currentTarget.style.background = 'var(--bg-primary)'
        }}
      >
        <div
          className="w-2.5 h-2.5 shrink-0 border border-black"
          style={{ backgroundColor: active?.color || '#FFE500' }}
        />
        <span
          className="text-sm font-bold truncate flex-1 text-left"
          style={{
            fontFamily: 'var(--font-display)',
            color: isSidebar ? 'rgba(255,255,255,0.8)' : '#000',
          }}
        >
          {active?.name || 'No Company'}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          style={{ color: isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-72 border-2 border-black z-50 overflow-hidden"
          style={{
            background: isSidebar ? 'var(--bg-sidebar)' : 'var(--bg-surface)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {!editing ? (
            <>
              <div className="p-1.5 max-h-52 overflow-y-auto">
                {companies.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer group transition-colors"
                    style={{
                      background: c.id === active?.id
                        ? (isSidebar ? 'rgba(255,229,0,0.15)' : '#FFF9C4')
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (c.id !== active?.id) {
                        e.currentTarget.style.background = isSidebar ? 'rgba(255,255,255,0.05)' : '#FFFEF0'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (c.id !== active?.id) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                    onClick={() => switchTo(c.id)}
                  >
                    <div
                      className="w-3 h-3 flex-shrink-0 border border-black"
                      style={{ backgroundColor: c.color || '#FFE500' }}
                    />
                    <span
                      className="text-sm flex-1 truncate font-medium"
                      style={{ color: isSidebar ? 'rgba(255,255,255,0.9)' : '#000' }}
                    >
                      {c.name}
                    </span>
                    {c.id === active?.id && (
                      <span
                        className="text-[10px] font-bold uppercase"
                        style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                      >
                        ACTIVE
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(c) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      style={{ color: isSidebar ? 'rgba(255,255,255,0.3)' : 'var(--color-muted)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-black p-1.5">
                <button
                  onClick={startCreate}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-bold transition-colors"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isSidebar ? 'rgba(255,255,255,0.5)' : 'var(--color-muted)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = isSidebar ? 'rgba(255,255,255,0.8)' : '#000'
                    e.currentTarget.style.background = isSidebar ? 'rgba(255,255,255,0.05)' : 'var(--bg-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isSidebar ? 'rgba(255,255,255,0.5)' : 'var(--color-muted)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Company
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div
                className="text-xs uppercase tracking-widest font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)',
                }}
              >
                {editing.id ? 'Edit Company' : 'New Company'}
              </div>

              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Company name..."
                className={inputCls}
                style={inputStyle}
                autoFocus
              />

              {/* Color picker */}
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] uppercase tracking-wider mr-1 font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)',
                  }}
                >
                  Color
                </span>
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 border-2 border-black transition-transform"
                    style={{
                      backgroundColor: c,
                      transform: newColor === c ? 'scale(1.2)' : 'none',
                      boxShadow: newColor === c ? '2px 2px 0px 0px #000' : 'none',
                    }}
                  />
                ))}
              </div>

              <input
                type="text"
                value={newProductPitch}
                onChange={e => setNewProductPitch(e.target.value)}
                placeholder="Product pitch (one-liner)..."
                className={inputCls}
                style={inputStyle}
              />

              <input
                type="text"
                value={newTargetVertical}
                onChange={e => setNewTargetVertical(e.target.value)}
                placeholder="Target vertical (e.g. Series A-C startups)..."
                className={inputCls}
                style={inputStyle}
              />

              <textarea
                value={newInstructions}
                onChange={e => setNewInstructions(e.target.value)}
                placeholder="Custom instructions for AI (optional)..."
                rows={3}
                className={`${inputCls} resize-none`}
                style={textareaStyle}
              />

              {/* Personas section */}
              <div className="border-t-2 pt-3" style={{ borderColor: isSidebar ? 'rgba(255,255,255,0.05)' : '#000' }}>
                <button
                  onClick={() => setShowPersonas(!showPersonas)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${showPersonas ? 'rotate-90' : ''}`}
                    style={{ color: isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)',
                    }}
                  >
                    Buyer Personas
                  </span>
                  <span style={{ color: isSidebar ? 'rgba(255,255,255,0.25)' : '#ccc' }} className="text-[10px]">
                    {newPersonas.length}
                  </span>
                </button>

                {showPersonas && (
                  <div className="mt-2 space-y-2">
                    {newPersonas.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-2 py-1.5"
                        style={{
                          background: isSidebar ? 'rgba(255,255,255,0.03)' : 'var(--bg-primary)',
                          border: '1px solid',
                          borderColor: isSidebar ? 'rgba(255,255,255,0.05)' : '#000',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate" style={{ color: isSidebar ? 'rgba(255,255,255,0.8)' : '#000' }}>
                            {p.name || 'Unnamed'}
                          </div>
                          <div className="text-[10px] truncate" style={{ color: isSidebar ? 'rgba(255,255,255,0.3)' : 'var(--color-muted)' }}>
                            {p.role || 'No role'}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingPersonaIdx(idx)}
                          className="p-0.5"
                          style={{ color: isSidebar ? 'rgba(255,255,255,0.3)' : 'var(--color-muted)' }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setNewPersonas(prev => prev.filter((_, i) => i !== idx))}
                          className="p-0.5"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {editingPersonaIdx !== null && newPersonas[editingPersonaIdx] && (() => {
                      const p = newPersonas[editingPersonaIdx]
                      const update = (field: keyof BuyerPersona, value: any) => {
                        setNewPersonas(prev => prev.map((pp, i) => i === editingPersonaIdx ? { ...pp, [field]: value } : pp))
                      }
                      const pInputCls = 'neo-input w-full px-2 py-1.5 text-xs'
                      const pInputStyle = isSidebar
                        ? { background: '#2a2a4e', border: '2px solid rgba(255,255,255,0.1)', color: '#fff' }
                        : {}
                      return (
                        <div
                          className="p-2 space-y-2 border-2"
                          style={{
                            background: isSidebar ? 'rgba(255,255,255,0.03)' : 'var(--bg-primary)',
                            borderColor: isSidebar ? 'rgba(255,255,255,0.05)' : '#000',
                          }}
                        >
                          <div
                            className="text-[10px] uppercase tracking-wider font-bold"
                            style={{ color: 'var(--color-ai)', fontFamily: 'var(--font-display)' }}
                          >
                            Edit Persona
                          </div>
                          <input value={p.name} onChange={e => update('name', e.target.value)} placeholder="Persona name..." className={pInputCls} style={pInputStyle} />
                          <input value={p.role} onChange={e => update('role', e.target.value)} placeholder="Role..." className={pInputCls} style={pInputStyle} />
                          <select value={p.priority} onChange={e => update('priority', e.target.value)} className={pInputCls} style={pInputStyle}>
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="end-user">End User</option>
                          </select>
                          <textarea value={p.description} onChange={e => update('description', e.target.value)} placeholder="Who they are..." rows={2} className={`${pInputCls} resize-none`} style={pInputStyle} />
                          <input value={p.matchRoles.join(', ')} onChange={e => update('matchRoles', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Match roles (comma-separated)..." className={pInputCls} style={pInputStyle} />
                          <textarea value={p.painPoints.join('\n')} onChange={e => update('painPoints', e.target.value.split('\n').filter(Boolean))} placeholder="Pain points (one per line)..." rows={2} className={`${pInputCls} resize-none`} style={pInputStyle} />
                          <input value={p.triggerMoment} onChange={e => update('triggerMoment', e.target.value)} placeholder="Trigger moment..." className={pInputCls} style={pInputStyle} />
                          <textarea value={p.nightmares.join('\n')} onChange={e => update('nightmares', e.target.value.split('\n').filter(Boolean))} placeholder="Nightmares (one per line)..." rows={2} className={`${pInputCls} resize-none`} style={pInputStyle} />
                          <input value={p.buyingPower} onChange={e => update('buyingPower', e.target.value)} placeholder="Buying power..." className={pInputCls} style={pInputStyle} />
                          <input value={p.languagePatterns.join(', ')} onChange={e => update('languagePatterns', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Language patterns..." className={pInputCls} style={pInputStyle} />
                          <input value={p.antiPatterns.join(', ')} onChange={e => update('antiPatterns', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Anti-patterns..." className={pInputCls} style={pInputStyle} />
                          <button
                            onClick={() => setEditingPersonaIdx(null)}
                            className="neo-btn-sm w-full px-2 py-1.5 text-[10px]"
                            style={{ background: 'var(--color-ai)', color: '#000' }}
                          >
                            Done
                          </button>
                        </div>
                      )
                    })()}

                    <button
                      onClick={() => {
                        const p = emptyPersona()
                        setNewPersonas(prev => [...prev, p])
                        setEditingPersonaIdx(newPersonas.length)
                      }}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-bold transition-colors"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isSidebar ? 'rgba(255,255,255,0.6)' : '#000'
                        e.currentTarget.style.background = isSidebar ? 'rgba(255,255,255,0.05)' : 'var(--bg-primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isSidebar ? 'rgba(255,255,255,0.4)' : 'var(--color-muted)'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Persona
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveProfile}
                  disabled={!newName.trim()}
                  className="neo-btn flex-1 px-3 py-1.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'var(--color-accent)', color: '#000' }}
                >
                  {editing.id ? 'Save' : 'Create'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="neo-btn-sm px-3 py-1.5 text-sm"
                  style={{
                    background: isSidebar ? '#2a2a4e' : 'var(--bg-surface)',
                    color: isSidebar ? 'rgba(255,255,255,0.6)' : '#000',
                  }}
                >
                  Cancel
                </button>
                {editing.id && companies.length > 1 && (
                  <button
                    onClick={() => { deleteProfile(editing.id); setEditing(null) }}
                    className="neo-btn-sm px-3 py-1.5 text-sm text-white"
                    style={{ background: 'var(--color-danger)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
