import { useState, useEffect } from 'react'
import type { BattleCard } from '../../../shared/types'

const CATEGORIES: BattleCard['category'][] = ['objection', 'competitor', 'pricing', 'technical', 'closing', 'risk', 'general']

export default function CardManager() {
  const [cards, setCards] = useState<BattleCard[]>([])
  const [editing, setEditing] = useState<BattleCard | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { loadCards() }, [])

  const loadCards = async () => setCards(await window.api.getCards())

  const startNew = () => setEditing({
    id: '', title: '', category: 'general', triggerKeywords: [],
    content: '', alternativeFramings: [], thumbsUp: 0, thumbsDown: 0,
    createdAt: '', updatedAt: '', confidence: undefined,
  })

  const save = async () => {
    if (!editing) return
    await window.api.saveCard(editing)
    setEditing(null)
    loadCards()
  }

  const remove = async (id: string) => {
    await window.api.deleteCard(id)
    loadCards()
  }

  const filtered = filter === 'all' ? cards : cards.filter(c => c.category === filter)

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-wrap"
        style={{ background: 'var(--bg-surface)', borderBottom: '2px solid #000' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
          }}
        >
          Battle Cards
        </h1>

        <button
          onClick={startNew}
          className="neo-btn"
          style={{ background: 'var(--color-accent)', color: '#000', marginLeft: '0.5rem' }}
        >
          + New Card
        </button>

        {/* Filter buttons */}
        <div className="flex gap-1 ml-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '3px 10px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              textTransform: 'uppercase',
              border: '2px solid #000',
              borderRadius: 0,
              cursor: 'pointer',
              background: filter === 'all' ? 'var(--color-accent)' : 'var(--bg-surface)',
              color: '#000',
              boxShadow: filter === 'all' ? 'var(--shadow-sm)' : 'none',
              transition: 'background 0.1s',
            }}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '3px 10px',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: '2px solid #000',
                borderRadius: 0,
                cursor: 'pointer',
                background: filter === cat ? 'var(--color-accent)' : 'var(--bg-surface)',
                color: '#000',
                boxShadow: filter === cat ? 'var(--shadow-sm)' : 'none',
                transition: 'background 0.1s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {cards.length} cards
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* Edit form */}
        {editing && (
          <div
            className="mb-6 p-5"
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid #000',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text)',
                marginBottom: '1rem',
              }}
            >
              {editing.id ? 'Edit Card' : 'New Battle Card'}
            </h3>
            <div className="space-y-3">
              <input
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                placeholder="Card title"
                className="neo-input w-full"
              />
              <select
                value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value as BattleCard['category'] })}
                className="neo-input w-full"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              <input
                value={editing.triggerKeywords.join(', ')}
                onChange={e => setEditing({ ...editing, triggerKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Trigger keywords (comma separated)"
                className="neo-input w-full"
              />
              <textarea
                value={editing.content}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                placeholder="Card content - the response/information to show when triggered"
                rows={4}
                className="neo-input w-full"
                style={{ resize: 'vertical' }}
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  className="neo-btn"
                  style={{ background: 'var(--color-accent)', color: '#000' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="neo-btn"
                  style={{ background: 'var(--bg-primary)', color: '#000' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card list */}
        <div className="grid gap-3">
          {filtered.map(card => (
            <div
              key={card.id}
              className="p-4"
              style={{
                background: 'var(--bg-surface)',
                border: '2px solid #000',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px, -2px)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '4px 4px 0px 0px #000'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translate(0, 0)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
              }}
            >
              {/* Card header row */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--color-text)',
                    }}
                  >
                    {card.title}
                  </h3>
                  {/* Category badge */}
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '1px 7px',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: '2px solid #000',
                      borderRadius: 0,
                      background: 'var(--color-accent)',
                      color: '#000',
                    }}
                  >
                    {card.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(card)}
                    className="neo-btn-sm"
                    style={{ background: 'var(--bg-primary)', color: '#000' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(card.id)}
                    className="neo-btn-sm"
                    style={{ background: 'var(--color-danger)', color: '#fff' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Content preview */}
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  fontFamily: 'var(--font-body)',
                  marginBottom: '0.75rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {card.content}
              </p>

              {/* Keyword tags */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {card.triggerKeywords.length > 0 ? (
                  card.triggerKeywords.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '1px 7px',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        border: '2px solid #000',
                        borderRadius: 0,
                        background: 'var(--bg-primary)',
                        color: '#000',
                      }}
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-muted)',
                    }}
                  >
                    No keywords
                  </span>
                )}
              </div>

              {/* Thumbs up / down row */}
              <div
                className="flex items-center gap-3 pt-2"
                style={{
                  borderTop: '2px solid #000',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                  {card.thumbsUp}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                  {card.thumbsDown}
                </span>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && !editing && (
            <div className="flex flex-col items-center justify-center py-16">
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '2.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#000',
                  opacity: 0.08,
                  lineHeight: 1,
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                }}
              >
                No Cards
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-muted)',
                  textAlign: 'center',
                }}
              >
                Create cards with trigger keywords for real-time coaching
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
