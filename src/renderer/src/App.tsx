import { useState, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import Overlay from './components/Overlay'
import DocsUpload from './components/DocsUpload'
import CardManager from './components/CardManager'
import Settings from './components/Settings'
import RecapList from './components/RecapList'
import PrepChat from './components/PrepChat'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'
import type { CallRecap } from '../../shared/types'

type View = 'home' | 'dashboard' | 'ask' | 'docs' | 'cards' | 'recaps' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [callActive, setCallActive] = useState(false)
  const [selectedRecap, setSelectedRecap] = useState<CallRecap | null>(null)

  if (window.location.hash === '#/overlay') return <Overlay />

  const handleStartCall = useCallback(() => {
    setView('dashboard')
  }, [])

  const handleLaunchCallFromPrep = useCallback(() => {
    setCallActive(true)
    setView('dashboard')
  }, [])

  const handleViewRecap = useCallback((recap: CallRecap) => {
    setSelectedRecap(recap)
    setView('recaps')
  }, [])

  const handleNavigate = useCallback((v: View) => {
    setView(v)
    if (v !== 'recaps') setSelectedRecap(null)
  }, [])

  return (
    <div className="h-screen flex" style={{ background: 'var(--bg-primary)', color: 'var(--color-text)' }}>
      <Sidebar view={view} onNavigate={handleNavigate} callActive={callActive} />
      <main className="flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {view === 'home' && (
          <HomePage onStartCall={handleStartCall} onViewRecap={handleViewRecap} />
        )}
        {view === 'dashboard' && (
          <Dashboard onCallStateChange={setCallActive} />
        )}
        {view === 'ask' && <PrepChat onLaunchCall={handleLaunchCallFromPrep} />}
        {view === 'docs' && <DocsUpload />}
        {view === 'cards' && <CardManager />}
        {view === 'recaps' && <RecapList initialRecap={selectedRecap} />}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  )
}
