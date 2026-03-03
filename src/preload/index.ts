import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),

  // Company Management
  getCompanies: () => ipcRenderer.invoke('get-companies'),
  saveCompany: (profile: any) => ipcRenderer.invoke('save-company', profile),
  deleteCompany: (id: string) => ipcRenderer.invoke('delete-company', id),
  switchCompany: (companyId: string) => ipcRenderer.invoke('switch-company', companyId),
  getActiveCompany: () => ipcRenderer.invoke('get-active-company'),

  // Audio
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  sendAudioData: (buffer: ArrayBuffer) => ipcRenderer.send('audio-data', buffer),

  // Call control
  startCall: () => ipcRenderer.invoke('start-call'),
  endCall: () => ipcRenderer.invoke('end-call'),

  // Battle Cards
  getCards: () => ipcRenderer.invoke('get-cards'),
  saveCard: (card: any) => ipcRenderer.invoke('save-card', card),
  deleteCard: (id: string) => ipcRenderer.invoke('delete-card', id),
  voteCard: (id: string, vote: 'up' | 'down') => ipcRenderer.invoke('vote-card', id, vote),

  // Recaps
  getRecaps: () => ipcRenderer.invoke('get-recaps'),
  getRecap: (id: string) => ipcRenderer.invoke('get-recap', id),

  // Knowledge Base
  getKnowledge: () => ipcRenderer.invoke('get-knowledge'),
  saveKnowledge: (doc: any) => ipcRenderer.invoke('save-knowledge', doc),
  deleteKnowledge: (id: string) => ipcRenderer.invoke('delete-knowledge', id),

  // File Upload & Repo Import
  uploadFiles: () => ipcRenderer.invoke('upload-files'),
  importFolder: () => ipcRenderer.invoke('import-folder'),

  // AI Help & Screen Analysis
  aiHelp: (question?: string) => ipcRenderer.invoke('ai-help', question),
  analyzeScreen: () => ipcRenderer.invoke('analyze-screen'),
  quickAsk: (question: string) => ipcRenderer.invoke('quick-ask', question),

  // Pre-call Prep
  prepAsk: (question: string, chatHistory: { role: string; text: string }[]) =>
    ipcRenderer.invoke('prep-ask', question, chatHistory),
  launchCallFromPrep: (payload: any) =>
    ipcRenderer.invoke('launch-call-from-prep', payload),
  onPrepChunk: (callback: (chunk: string) => void) => {
    const listener = (_: any, chunk: string) => callback(chunk)
    ipcRenderer.on('prep-chunk', listener)
    return () => ipcRenderer.removeListener('prep-chunk', listener)
  },
  onPrepContext: (callback: (payload: any) => void) => {
    const listener = (_: any, payload: any) => callback(payload)
    ipcRenderer.on('prep-context', listener)
    return () => ipcRenderer.removeListener('prep-context', listener)
  },

  // Overlay + Window
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),
  minimizeMain: () => ipcRenderer.invoke('minimize-main'),
  setOverlayInteractive: (interactive: boolean) => ipcRenderer.invoke('set-overlay-interactive', interactive),

  // Mic mute (syncs between main window and overlay)
  toggleMicMute: () => ipcRenderer.invoke('toggle-mic-mute'),
  onMicMuteChanged: (callback: (muted: boolean) => void) => {
    const listener = (_: any, muted: boolean) => callback(muted)
    ipcRenderer.on('mic-mute-changed', listener)
    return () => ipcRenderer.removeListener('mic-mute-changed', listener)
  },

  // Event listeners
  onTranscriptUpdate: (callback: (segment: any) => void) => {
    const listener = (_: any, segment: any) => callback(segment)
    ipcRenderer.on('transcript-update', listener)
    return () => ipcRenderer.removeListener('transcript-update', listener)
  },
  onTriggerDetected: (callback: (trigger: any) => void) => {
    const listener = (_: any, trigger: any) => callback(trigger)
    ipcRenderer.on('trigger-detected', listener)
    return () => ipcRenderer.removeListener('trigger-detected', listener)
  },
  onCallStatus: (callback: (status: string) => void) => {
    const listener = (_: any, status: string) => callback(status)
    ipcRenderer.on('call-status', listener)
    return () => ipcRenderer.removeListener('call-status', listener)
  },
  onPhaseChange: (callback: (data: { phase: string; timestamp: number }) => void) => {
    const listener = (_: any, data: { phase: string; timestamp: number }) => callback(data)
    ipcRenderer.on('phase-change', listener)
    return () => ipcRenderer.removeListener('phase-change', listener)
  },
  onProspectIntel: (callback: (intel: any) => void) => {
    const listener = (_: any, intel: any) => callback(intel)
    ipcRenderer.on('prospect-intel', listener)
    return () => ipcRenderer.removeListener('prospect-intel', listener)
  },
  onContextUpdate: (callback: (data: any) => void) => {
    const listener = (_: any, data: any) => callback(data)
    ipcRenderer.on('context-update', listener)
    return () => ipcRenderer.removeListener('context-update', listener)
  },
  onPersonaMatch: (callback: (data: any) => void) => {
    const listener = (_: any, data: any) => callback(data)
    ipcRenderer.on('persona-match', listener)
    return () => ipcRenderer.removeListener('persona-match', listener)
  },

  // Streaming chunks
  onAnswerChunk: (callback: (chunk: string) => void) => {
    const listener = (_: any, chunk: string) => callback(chunk)
    ipcRenderer.on('answer-chunk', listener)
    return () => ipcRenderer.removeListener('answer-chunk', listener)
  },
  onScreenChunk: (callback: (chunk: string) => void) => {
    const listener = (_: any, chunk: string) => callback(chunk)
    ipcRenderer.on('screen-chunk', listener)
    return () => ipcRenderer.removeListener('screen-chunk', listener)
  },

  // Keyboard shortcut events
  onFocusAskInput: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('focus-ask-input', listener)
    return () => ipcRenderer.removeListener('focus-ask-input', listener)
  },
  onTriggerScreenAnalysis: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('trigger-screen-analysis', listener)
    return () => ipcRenderer.removeListener('trigger-screen-analysis', listener)
  },
}

contextBridge.exposeInMainWorld('api', api)

export type PitchPilotAPI = typeof api
