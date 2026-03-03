// ===== Buyer Personas (ICP Intelligence) =====
export interface BuyerPersona {
  id: string
  name: string                    // "The Burned CTO"
  role: string                    // "CTO / VP Engineering"
  priority: 'primary' | 'secondary' | 'end-user'
  description: string             // Who they are paragraph
  matchRoles: string[]            // ["CTO", "VP Engineering", "VP Eng"]
  painPoints: string[]            // Exact quotes they'd say
  triggerMoment: string           // The moment they'll pay for anything
  nightmares: string[]            // What keeps them up at night
  buyingPower: string             // "Budget authority up to $50K/year"
  languagePatterns: string[]      // Words/phrases that resonate
  antiPatterns: string[]          // What turns them off
}

// ===== Company Profiles =====
export interface CompanyProfile {
  id: string
  name: string
  color?: string // accent color for visual identification
  customInstructions: string // free-text context for AI
  personas: BuyerPersona[]        // ICP buyer personas
  productPitch: string            // one-liner of what you sell
  targetVertical: string          // e.g. "Series A-C startups"
  createdAt: number
  updatedAt: number
}

// ===== Call Phase =====
export type CallPhase = 'intro' | 'hook' | 'close'

// ===== Battle Cards =====
export interface BattleCard {
  id: string
  title: string
  category: 'objection' | 'competitor' | 'pricing' | 'technical' | 'closing' | 'risk' | 'general'
  triggerKeywords: string[]
  content: string
  alternativeFramings?: string[]
  confidence?: number
  thumbsUp: number
  thumbsDown: number
  createdAt: string
  updatedAt: string
}

// ===== Transcription =====
export interface TranscriptSegment {
  id: string
  speaker: 'rep' | 'prospect'
  text: string
  timestamp: number
  isFinal: boolean
}

// ===== Intent / Triggers =====
export type TriggerType =
  | 'objection'
  | 'competitor'
  | 'technical'
  | 'buying_signal'
  | 'pricing'
  | 'risk'
  | 'decision_maker'
  | 'closing'

export interface TriggerEvent {
  id: string
  type: TriggerType
  confidence: 'high' | 'medium' | 'low'
  sourceText: string
  suggestedResponse: string
  matchedCards: string[] // card IDs
  timestamp: number
}

// ===== Prospect Intelligence =====
export interface ProspectIntel {
  name: string | null
  company: string | null
  role: string | null
  industry: string | null
  companySize: string | null
  problemsMentioned: string[]
  objectionsRaised: string[]
  currentSolutions: string[]
  buyingSignals: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown'
  matchedPersona: {
    personaId: string
    personaName: string
    confidence: 'high' | 'medium' | 'low'
  } | null
}

// ===== Conversation Context =====
export interface ConversationCard {
  id: string
  question: string
  answer: string
  type: 'ai-help' | 'screen' | 'trigger' | 'ask'
  timestamp: number
  wasUsed: boolean
}

export interface ConversationContext {
  callId: string
  companyId: string
  startedAt: number
  currentPhase: CallPhase
  phaseChangedAt: number
  transcript: TranscriptSegment[]
  prospect: ProspectIntel
  previousCards: ConversationCard[]
  repCoveredPoints: string[]
  strategiesUsed: string[]
}

// ===== Call Session =====
export interface CallSession {
  id: string
  companyId: string
  startedAt: string
  endedAt?: string
  transcript: TranscriptSegment[]
  triggers: TriggerEvent[]
  status: 'active' | 'ended'
  context: ConversationContext
}

// ===== Post-Call Recap =====
export interface CallRecap {
  id: string
  sessionId: string
  companyId: string
  date: string
  duration: number
  summary: string
  keyTopics: string[]
  objectionsRaised: string[]
  commitmentsMade: string[]
  nextSteps: string[]
  transcript: TranscriptSegment[]
  prospectIntel: ProspectIntel
}

// ===== Lore Knowledge Base =====
export interface KnowledgeDoc {
  id: string
  title: string
  category: 'product' | 'pricing' | 'faq' | 'competitive' | 'technical' | 'process' | 'general'
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ===== Settings =====
export interface AppSettings {
  deepgramApiKey: string
  anthropicApiKey: string
  audioInputDevice: string
  systemAudioDevice: string
  overlayPosition: 'right' | 'left'
  overlayWidth: number
  fontSize: number
  autoExpandOnTrigger: boolean
  collapseAfterSeconds: number
  theme: 'dark' | 'light'
  activeCompanyId: string | null
}

// ===== Pre-Call Prep =====
export interface PrepMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  type: 'chat' | 'briefing'
  timestamp: number
}

export interface PrepBriefing {
  matchedPersona: string | null
  painPoints: string[]
  suggestedOpeners: string[]
  objectionPrep: { objection: string; response: string }[]
  discoveryQuestions: string[]
  raw: string
}

export interface PrepLaunchPayload {
  prospectName: string | null
  prospectCompany: string | null
  prospectRole: string | null
  prospectIndustry: string | null
  matchedPersonaId: string | null
  prepSummary: string
  briefing: PrepBriefing | null
}

export interface PrepContext {
  messages: PrepMessage[]
  briefing: PrepBriefing | null
  prospectInfo: {
    name: string | null
    company: string | null
    role: string | null
    industry: string | null
  }
}

// ===== IPC Channels =====
export const IPC = {
  // Settings
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',

  // Audio
  GET_AUDIO_DEVICES: 'get-audio-devices',
  START_CALL: 'start-call',
  END_CALL: 'end-call',

  // Transcription events (main -> renderer)
  TRANSCRIPT_UPDATE: 'transcript-update',
  TRIGGER_DETECTED: 'trigger-detected',

  // Battle Cards
  GET_CARDS: 'get-cards',
  SAVE_CARD: 'save-card',
  DELETE_CARD: 'delete-card',
  VOTE_CARD: 'vote-card',

  // Recaps
  GET_RECAPS: 'get-recaps',
  GET_RECAP: 'get-recap',
  GENERATE_RECAP: 'generate-recap',

  // Knowledge Base
  GET_KNOWLEDGE: 'get-knowledge',
  SAVE_KNOWLEDGE: 'save-knowledge',
  DELETE_KNOWLEDGE: 'delete-knowledge',

  // Overlay control
  TOGGLE_OVERLAY: 'toggle-overlay',

  // Call status
  CALL_STATUS: 'call-status',

  // Company management
  GET_COMPANIES: 'get-companies',
  SAVE_COMPANY: 'save-company',
  DELETE_COMPANY: 'delete-company',
  SWITCH_COMPANY: 'switch-company',
  GET_ACTIVE_COMPANY: 'get-active-company',

  // Context events (main -> renderer)
  PHASE_CHANGE: 'phase-change',
  PROSPECT_INTEL: 'prospect-intel',
  CONTEXT_UPDATE: 'context-update',
  PERSONA_MATCH: 'persona-match',

  // Prep chat
  PREP_ASK: 'prep-ask',
  LAUNCH_CALL_FROM_PREP: 'launch-call-from-prep',
  PREP_CONTEXT: 'prep-context',
} as const
