import { useState } from 'react'
import CompanySwitcher from './CompanySwitcher'

type View = 'home' | 'dashboard' | 'ask' | 'docs' | 'cards' | 'recaps' | 'settings'

interface SidebarProps {
  view: View
  onNavigate: (view: View) => void
  callActive: boolean
}

const NAV_ITEMS: { key: View; label: string; icon: string }[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    key: 'dashboard',
    label: 'Call Session',
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  },
  {
    key: 'ask',
    label: 'Prep',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    key: 'docs',
    label: 'Knowledge Base',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    key: 'cards',
    label: 'Battle Cards',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

export default function Sidebar({ view, onNavigate, callActive }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`h-full flex flex-col transition-all duration-200 ${
        collapsed ? 'w-[60px]' : 'w-[240px]'
      }`}
      style={{ background: 'var(--bg-sidebar)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-white/5 app-drag-region">
        <div
          className="w-8 h-8 flex items-center justify-center text-black font-black text-sm shrink-0 no-drag border-2 border-black"
          style={{ background: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
        >
          P
        </div>
        {!collapsed && (
          <span
            className="font-bold text-[15px] text-white tracking-tight no-drag"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            PitchPilot
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`no-drag p-1 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors ${
            collapsed ? 'ml-0' : 'ml-auto'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Company Switcher */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-white/5">
          <CompanySwitcher variant="sidebar" />
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? {
                background: 'var(--color-accent)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
              } : {
                fontFamily: 'var(--font-display)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Active Call Indicator */}
      <div className="px-2 pb-3 shrink-0">
        {callActive ? (
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border-2 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            <span className="w-2.5 h-2.5 bg-[#22c55e] rounded-full animate-pulse shrink-0" />
            {!collapsed && <span className="text-sm uppercase tracking-wide">Call Active</span>}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="w-2.5 h-2.5 bg-white/20 rounded-full shrink-0" />
            {!collapsed && <span className="text-sm">No Active Call</span>}
          </button>
        )}
      </div>
    </div>
  )
}
