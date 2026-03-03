/// <reference types="vite/client" />

interface Window {
  api: {
    // Settings
    getSettings: () => Promise<import('../../shared/types').AppSettings>
    saveSettings: (settings: import('../../shared/types').AppSettings) => Promise<boolean>

    // Company Management
    getCompanies: () => Promise<import('../../shared/types').CompanyProfile[]>
    saveCompany: (profile: Partial<import('../../shared/types').CompanyProfile> & { name: string }) => Promise<import('../../shared/types').CompanyProfile>
    deleteCompany: (id: string) => Promise<boolean>
    switchCompany: (companyId: string) => Promise<boolean>
    getActiveCompany: () => Promise<import('../../shared/types').CompanyProfile | null>

    // Audio
    getAudioDevices: () => Promise<MediaDeviceInfo[]>
    sendAudioData: (buffer: ArrayBuffer) => void

    // Call Control
    startCall: () => Promise<{ sessionId?: string; error?: string }>
    endCall: () => Promise<{ sessionId?: string; recapId?: string } | null>

    // Battle Cards
    getCards: () => Promise<import('../../shared/types').BattleCard[]>
    saveCard: (card: import('../../shared/types').BattleCard) => Promise<import('../../shared/types').BattleCard>
    deleteCard: (id: string) => Promise<boolean>
    voteCard: (id: string, vote: 'up' | 'down') => Promise<boolean>

    // Recaps
    getRecaps: () => Promise<import('../../shared/types').CallRecap[]>
    getRecap: (id: string) => Promise<import('../../shared/types').CallRecap | null>

    // Knowledge Base
    getKnowledge: () => Promise<import('../../shared/types').KnowledgeDoc[]>
    saveKnowledge: (doc: import('../../shared/types').KnowledgeDoc) => Promise<import('../../shared/types').KnowledgeDoc>
    deleteKnowledge: (id: string) => Promise<boolean>

    // File Upload & Repo Import
    uploadFiles: () => Promise<Array<{ name: string; content: string; path: string; error?: string }>>
    importFolder: () => Promise<Array<{ name: string; content: string; path: string }>>

    // AI Help & Screen Analysis
    aiHelp: (question?: string) => Promise<string>
    analyzeScreen: () => Promise<string>
    quickAsk: (question: string) => Promise<string>

    // Pre-call Prep
    prepAsk: (question: string, chatHistory: { role: string; text: string }[]) => Promise<string>
    launchCallFromPrep: (payload: import('../../shared/types').PrepLaunchPayload) => Promise<{ success: boolean; sessionId?: string; error?: string }>
    onPrepChunk: (callback: (chunk: string) => void) => () => void
    onPrepContext: (callback: (payload: import('../../shared/types').PrepLaunchPayload) => void) => () => void

    // Overlay + Window
    toggleOverlay: () => Promise<boolean>
    minimizeMain: () => Promise<boolean>
    setOverlayInteractive: (interactive: boolean) => Promise<void>

    // Mic mute
    toggleMicMute: () => Promise<boolean>
    onMicMuteChanged: (callback: (muted: boolean) => void) => () => void

    // Event listeners
    onTranscriptUpdate: (callback: (segment: import('../../shared/types').TranscriptSegment) => void) => () => void
    onTriggerDetected: (callback: (trigger: import('../../shared/types').TriggerEvent) => void) => () => void
    onCallStatus: (callback: (status: string) => void) => () => void
    onPhaseChange: (callback: (data: { phase: string; timestamp: number }) => void) => () => void
    onProspectIntel: (callback: (intel: import('../../shared/types').ProspectIntel) => void) => () => void
    onContextUpdate: (callback: (data: any) => void) => () => void
    onPersonaMatch: (callback: (data: { personaId: string; personaName: string; confidence: 'high' | 'medium' | 'low' }) => void) => () => void
    onAnswerChunk: (callback: (chunk: string) => void) => () => void
    onScreenChunk: (callback: (chunk: string) => void) => () => void
    onFocusAskInput: (callback: () => void) => () => void
    onTriggerScreenAnalysis: (callback: () => void) => () => void
  }
}
