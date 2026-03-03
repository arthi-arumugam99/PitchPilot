import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './globals.css'

// Mock window.api for browser-based testing (Playwright, dev browser)
if (!window.api) {
  const noop = () => () => {}
  ;(window as any).api = {
    getSettings: async () => ({
      deepgramApiKey: '',
      anthropicApiKey: '',
      audioInputDevice: 'default',
      systemAudioDevice: '',
      overlayPosition: 'right',
      overlayWidth: 340,
      fontSize: 14,
      autoExpandOnTrigger: true,
      collapseAfterSeconds: 8,
      theme: 'dark',
      activeCompanyId: null,
    }),
    saveSettings: async () => true,

    // Company Management
    getCompanies: async () => [{ id: 'default', name: 'Default', customInstructions: '', personas: [], productPitch: '', targetVertical: '', createdAt: Date.now(), updatedAt: Date.now() }],
    saveCompany: async (p: any) => ({ id: 'default', ...p, createdAt: Date.now(), updatedAt: Date.now() }),
    deleteCompany: async () => true,
    switchCompany: async () => true,
    getActiveCompany: async () => ({ id: 'default', name: 'Default', customInstructions: '', personas: [], productPitch: '', targetVertical: '', createdAt: Date.now(), updatedAt: Date.now() }),

    // Audio
    getAudioDevices: async () => [],
    sendAudioData: () => {},

    // Call
    startCall: async () => ({ error: 'Running in browser mode (no Electron)' }),
    endCall: async () => null,

    // Cards
    getCards: async () => [],
    saveCard: async (c: any) => c,
    deleteCard: async () => true,
    voteCard: async () => true,

    // Recaps
    getRecaps: async () => [],
    getRecap: async () => null,

    // Knowledge
    getKnowledge: async () => [],
    saveKnowledge: async (d: any) => d,
    deleteKnowledge: async () => true,

    // Files
    uploadFiles: async () => [],
    importFolder: async () => [],

    // AI
    aiHelp: async () => 'Mock answer: This is a test response from browser mode.',
    analyzeScreen: async () => 'Mock screen analysis from browser mode.',
    quickAsk: async () => 'Mock quick ask response from browser mode.',
    toggleOverlay: async () => true,

    // Events
    onTranscriptUpdate: noop,
    onTriggerDetected: noop,
    onCallStatus: noop,
    onPhaseChange: noop,
    onProspectIntel: noop,
    onContextUpdate: noop,
    onPersonaMatch: noop,
    onAnswerChunk: noop,
    onScreenChunk: noop,
    onFocusAskInput: noop,
    onTriggerScreenAnalysis: noop,
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
