// Conversation Context Accumulator
// Tracks call state, prospect intelligence, and AI suggestion history
// to provide rich context for real-time coaching.

import type {
  ConversationContext,
  ConversationCard,
  TranscriptSegment,
  CallPhase,
  ProspectIntel,
  BuyerPersona
} from '../shared/types'

// ---------------------------------------------------------------------------
// 1. createContext — initialize a blank conversation context
// ---------------------------------------------------------------------------

export function createContext(callId: string, companyId: string): ConversationContext {
  return {
    callId,
    companyId,
    startedAt: Date.now(),
    currentPhase: 'intro',
    phaseChangedAt: Date.now(),
    transcript: [],
    prospect: {
      name: null,
      company: null,
      role: null,
      industry: null,
      companySize: null,
      problemsMentioned: [],
      objectionsRaised: [],
      currentSolutions: [],
      buyingSignals: [],
      sentiment: 'unknown',
      matchedPersona: null
    },
    previousCards: [],
    repCoveredPoints: [],
    strategiesUsed: []
  }
}

// ---------------------------------------------------------------------------
// 2. updateContext — append a segment and derive new intelligence
// ---------------------------------------------------------------------------

export function updateContext(
  ctx: ConversationContext,
  segment: TranscriptSegment
): ConversationContext {
  // Append segment to the running transcript
  ctx.transcript.push(segment)

  // Extract prospect intel from the full transcript and merge
  const newIntel = extractProspectIntel(ctx.transcript)
  mergeIntel(ctx.prospect, newIntel)

  // Track what the rep has covered so far
  if (segment.speaker === 'rep') {
    const points = extractRepCoveredPoints(segment.text)
    for (const point of points) {
      if (!ctx.repCoveredPoints.includes(point)) {
        ctx.repCoveredPoints.push(point)
      }
    }
  }

  // Re-evaluate the call phase
  const newPhase = detectPhase(ctx)
  if (newPhase !== ctx.currentPhase) {
    ctx.currentPhase = newPhase
    ctx.phaseChangedAt = Date.now()
  }

  return ctx
}

// ---------------------------------------------------------------------------
// 3. detectPhase — determine which phase the call is in
// ---------------------------------------------------------------------------

const CLOSE_SIGNALS = [
  'meeting',
  'calendar',
  'schedule',
  'next week',
  'tomorrow',
  'free time',
  '30 minutes'
]

export function detectPhase(ctx: ConversationContext): CallPhase {
  const now = Date.now()
  const durationMs = now - ctx.startedAt
  const durationSec = durationMs / 1000

  const prospectSegments = ctx.transcript.filter((s) => s.speaker === 'prospect')

  // INTRO: early in the call AND prospect hasn't engaged substantively
  if (durationSec < 90 && prospectSegments.length < 3) {
    return 'intro'
  }

  // CLOSE: only check recent segments (last 6) to avoid permanent lock from early mentions
  const recentSegments = ctx.transcript.slice(-6)
  const recentText = recentSegments.map((s) => s.text).join(' ').toLowerCase()
  const hasCloseSignal = CLOSE_SIGNALS.some((signal) => recentText.includes(signal))
  if (hasCloseSignal) {
    return 'close'
  }

  // Default: HOOK — active selling / discovery phase
  return 'hook'
}

// ---------------------------------------------------------------------------
// 4. recordCard — store a card that was surfaced to the rep
// ---------------------------------------------------------------------------

export function recordCard(
  ctx: ConversationContext,
  card: Omit<ConversationCard, 'wasUsed'>
): void {
  ctx.previousCards.push({ ...card, wasUsed: false })
}

// ---------------------------------------------------------------------------
// 5. markCardUsed — flag a previously surfaced card as consumed
// ---------------------------------------------------------------------------

export function markCardUsed(ctx: ConversationContext, cardId: string): void {
  const card = ctx.previousCards.find((c) => c.id === cardId)
  if (card) {
    card.wasUsed = true
  }
}

// ---------------------------------------------------------------------------
// 6. buildContextPrompt — serialize context into a structured AI prompt block
// ---------------------------------------------------------------------------

export function buildContextPrompt(ctx: ConversationContext): string {
  const now = Date.now()
  const durationMs = now - ctx.startedAt
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const phase = ctx.currentPhase.toUpperCase()

  const p = ctx.prospect
  const prospectName = p.name || 'Unknown'
  const prospectCompany = p.company || 'Unknown'
  const prospectRole = p.role || 'Unknown'
  const industry = p.industry || 'Unknown'
  const companySize = p.companySize || 'Unknown'

  const problems = p.problemsMentioned.length > 0 ? p.problemsMentioned.join(', ') : 'none yet'
  const objections = p.objectionsRaised.length > 0 ? p.objectionsRaised.join(', ') : 'none yet'
  const solutions = p.currentSolutions.length > 0 ? p.currentSolutions.join(', ') : 'none yet'
  const buyingSignals = p.buyingSignals.length > 0 ? p.buyingSignals.join(', ') : 'none yet'
  const sentiment = p.sentiment

  const repCovered =
    ctx.repCoveredPoints.length > 0 ? ctx.repCoveredPoints.join(', ') : 'nothing yet'
  const strategies =
    ctx.strategiesUsed.length > 0 ? ctx.strategiesUsed.join(', ') : 'none yet'

  const usedCards = ctx.previousCards.filter((c) => c.wasUsed)
  const ignoredCards = ctx.previousCards.filter((c) => !c.wasUsed)

  const usedList =
    usedCards.length > 0 ? usedCards.map((c) => c.question).join(', ') : 'none'
  const ignoredList =
    ignoredCards.length > 0 ? ignoredCards.map((c) => c.question).join(', ') : 'none'

  const previousAnswers = ctx.previousCards.map((c) => c.answer)
  const doNotRepeat =
    previousAnswers.length > 0 ? previousAnswers.join(' | ') : 'none'

  return [
    'CALL CONTEXT:',
    `- Active Company: ${ctx.companyId}`,
    `- Duration: ${duration}`,
    `- Phase: ${phase}`,
    `- Prospect: ${prospectName} at ${prospectCompany}, ${prospectRole}`,
    `- Prospect Company Intel: ${industry} | ${companySize}`,
    `- Problems mentioned: ${problems}`,
    `- Objections raised: ${objections}`,
    `- Current solutions: ${solutions}`,
    `- Buying signals: ${buyingSignals}`,
    `- Sentiment: ${sentiment}`,
    `- Rep has already covered: ${repCovered}`,
    `- Strategies already used: ${strategies}`,
    `- Previous AI suggestions used: ${usedList}`,
    `- Previous AI suggestions ignored: ${ignoredList}`,
    '',
    `DO NOT REPEAT these suggestions: ${doNotRepeat}`
  ].join('\n')
}

// ---------------------------------------------------------------------------
// 7. compressTranscript — fit transcript into a token-friendly window
// ---------------------------------------------------------------------------

export function compressTranscript(
  segments: TranscriptSegment[],
  maxChars: number = 15000
): string {
  const formatSegment = (s: TranscriptSegment): string => {
    const label = s.speaker === 'rep' ? 'YOU' : 'THEM'
    return `${label}: ${s.text}`
  }

  // Fast path — everything fits
  const fullText = segments.map(formatSegment).join('\n')
  if (fullText.length <= maxChars) {
    return fullText
  }

  // Split into "recent" (last 2 minutes) and "older"
  const now = Date.now()
  const twoMinutesAgo = now - 2 * 60 * 1000

  const recentSegments: TranscriptSegment[] = []
  const olderSegments: TranscriptSegment[] = []

  for (const seg of segments) {
    if (seg.timestamp >= twoMinutesAgo) {
      recentSegments.push(seg)
    } else {
      olderSegments.push(seg)
    }
  }

  // Summarize older segments
  const olderSummary = summarizeOlderSegments(olderSegments)
  const recentText = recentSegments.map(formatSegment).join('\n')

  return `${olderSummary}\n\n${recentText}`
}

// ---------------------------------------------------------------------------
// 8. extractProspectIntel — mine prospect segments for structured intel
// ---------------------------------------------------------------------------

export function extractProspectIntel(segments: TranscriptSegment[]): Partial<ProspectIntel> {
  const prospectSegments = segments.filter((s) => s.speaker === 'prospect')
  if (prospectSegments.length === 0) return {}

  const intel: Partial<ProspectIntel> = {}
  const allText = prospectSegments.map((s) => s.text).join(' ')

  // --- Name detection ---
  const namePatterns = [
    /(?:I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /(?:This is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here\b/,
    /(?:my name is|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  ]
  for (const pattern of namePatterns) {
    const match = allText.match(pattern)
    if (match) {
      intel.name = match[1].trim()
      break
    }
  }

  // --- Company detection ---
  const companyPatterns = [
    /(?:we're at|we are at)\s+([A-Z][\w\s&.-]+?)(?:\.|,|$|\s+and\b)/i,
    /(?:I'm with|I am with)\s+([A-Z][\w\s&.-]+?)(?:\.|,|$|\s+and\b)/i,
    /(?:here at)\s+([A-Z][\w\s&.-]+?)(?:\.|,|$|\s+and\b)/i,
    /([A-Z][\w&.-]+(?:\s+[A-Z][\w&.-]+)*)'s\s+(?:CFO|CTO|CEO|VP|Director|Manager|Head|Lead)/i
  ]
  for (const pattern of companyPatterns) {
    const match = allText.match(pattern)
    if (match) {
      intel.company = match[1].trim()
      break
    }
  }

  // --- Role detection ---
  const rolePatterns = [
    /I'm the\s+((?:Chief\s+)?(?:CFO|CTO|CEO|COO|CMO|CIO|VP|Director|Manager|Head|Lead|SVP|EVP)(?:\s+of\s+\w+(?:\s+\w+)*)?)/i,
    /I am the\s+((?:Chief\s+)?(?:CFO|CTO|CEO|COO|CMO|CIO|VP|Director|Manager|Head|Lead|SVP|EVP)(?:\s+of\s+\w+(?:\s+\w+)*)?)/i,
    /as\s+((?:the\s+)?(?:CFO|CTO|CEO|COO|CMO|CIO|VP|Director|Manager|Head|Lead|SVP|EVP)(?:\s+of\s+\w+(?:\s+\w+)*)?)/i,
    /I run\s+(the\s+)?(\w+(?:\s+\w+)*?\s*(?:team|department|group|division|org))/i
  ]
  for (const pattern of rolePatterns) {
    const match = allText.match(pattern)
    if (match) {
      // For "I run [department]" the capture group is different
      if (pattern.source.startsWith('I run')) {
        intel.role = `Runs ${(match[1] || '') + match[2]}`.trim()
      } else {
        intel.role = match[1].trim()
      }
      break
    }
  }

  // --- Industry detection ---
  const industryPatterns: [RegExp, string][] = [
    [/\b(?:we're|we are)\s+(?:a\s+)?SaaS\b/i, 'SaaS'],
    [/\b(?:we're|we are)\s+(?:a\s+)?fintech\b/i, 'Fintech'],
    [/\b(?:we're|we are)\s+(?:a\s+)?(?:health\s*tech|healthcare)\b/i, 'Healthcare'],
    [/\b(?:we're|we are)\s+(?:a\s+)?(?:ed\s*tech|education)\b/i, 'EdTech'],
    [/\b(?:we're|we are)\s+(?:a\s+)?(?:e-?commerce|retail)\b/i, 'E-commerce'],
    [/\b(?:we're|we are)\s+(?:a\s+)?startup\b/i, 'Startup'],
    [/\b(?:we're|we are)\s+(?:a\s+)?(?:dev\s*tools|developer tools)\b/i, 'DevTools'],
    [/\b(?:we're|we are)\s+in\s+([\w\s]+?)(?:\.|,|$)/i, '$1'],
    [/\bour (?:industry|vertical|space) is\s+([\w\s]+?)(?:\.|,|$)/i, '$1'],
  ]
  for (const [pattern, replacement] of industryPatterns) {
    const match = allText.match(pattern)
    if (match) {
      intel.industry = replacement.startsWith('$') ? match[1].trim() : replacement
      break
    }
  }

  // --- Company size detection ---
  const sizePatterns = [
    /we have (?:about |around |roughly |approximately )?(\d+[\w\s]*(?:engineers|developers|devs|employees|people|folks|staff|team members))/i,
    /(?:team of|staff of|about|around) (\d+[\w\s]*(?:engineers|developers|people|employees))/i,
    /(\d+[\w\s]*(?:person|people|employee|engineer|developer)) (?:company|team|org|organization)/i,
  ]
  for (const pattern of sizePatterns) {
    const match = allText.match(pattern)
    if (match) {
      intel.companySize = match[1].trim()
      break
    }
  }

  // --- Problem detection ---
  const problemKeywords = [
    'frustrated',
    'struggling',
    'difficult',
    'challenge',
    'challenging',
    'issue',
    'issues',
    'problem',
    'problems',
    'pain',
    'painful',
    'hard time',
    'trouble',
    'bottleneck',
    'headache',
    'nightmare'
  ]
  const problems: string[] = []
  for (const seg of prospectSegments) {
    const sentences = seg.text.split(/[.!?]+/).filter(Boolean)
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase().trim()
      if (problemKeywords.some((kw) => lower.includes(kw)) && lower.length > 10) {
        const cleaned = sentence.trim()
        if (!problems.includes(cleaned)) {
          problems.push(cleaned)
        }
      }
    }
  }
  if (problems.length > 0) {
    intel.problemsMentioned = problems
  }

  // --- Objection detection ---
  const objectionPhrases = [
    'not interested',
    'already have',
    'too expensive',
    'no budget',
    'bad time',
    'send email',
    'send me an email',
    'not a priority',
    'not the right time',
    "don't need",
    "don't see the value",
    'happy with what we have',
    'locked into a contract',
    'need to think about it'
  ]
  const objections: string[] = []
  for (const seg of prospectSegments) {
    const lower = seg.text.toLowerCase()
    for (const phrase of objectionPhrases) {
      if (lower.includes(phrase)) {
        const cleaned = seg.text.trim()
        if (!objections.includes(cleaned)) {
          objections.push(cleaned)
        }
        break // one objection per segment is enough
      }
    }
  }
  if (objections.length > 0) {
    intel.objectionsRaised = objections
  }

  // --- Solution detection ---
  const solutionPatterns = [
    /we (?:use|are using|currently use)\s+(.+?)(?:\.|,|$)/gi,
    /we (?:have|already have)\s+(.+?)(?:\.|,|$)/gi,
    /our team handles?\s+(.+?)(?:\.|,|$)/gi,
    /we do it\s+(.+?)(?:\.|,|$)/gi,
    /we(?:'re| are) (?:on|using|with)\s+(.+?)(?:\.|,|$)/gi
  ]
  const solutions: string[] = []
  for (const seg of prospectSegments) {
    for (const pattern of solutionPatterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.exec(seg.text)) !== null) {
        const cleaned = match[1].trim()
        if (cleaned.length > 2 && !solutions.includes(cleaned)) {
          solutions.push(cleaned)
        }
      }
    }
  }
  if (solutions.length > 0) {
    intel.currentSolutions = solutions
  }

  // --- Buying signal detection ---
  const buyingPhrases = [
    'how much',
    'pricing',
    'what does it cost',
    'timeline',
    'demo',
    'could you show',
    'show me',
    'tell me more',
    'walk me through',
    'what would it take',
    'how does it work',
    'can we try',
    'trial',
    'pilot',
    'proof of concept',
    'next steps',
    'implementation',
    'onboarding',
    'when can we start',
    'how quickly',
    'how soon'
  ]
  const signals: string[] = []
  for (const seg of prospectSegments) {
    const lower = seg.text.toLowerCase()
    for (const phrase of buyingPhrases) {
      if (lower.includes(phrase)) {
        const cleaned = seg.text.trim()
        if (!signals.includes(cleaned)) {
          signals.push(cleaned)
        }
        break
      }
    }
  }
  if (signals.length > 0) {
    intel.buyingSignals = signals
  }

  // --- Sentiment detection ---
  const positiveWords = [
    'great',
    'love',
    'excellent',
    'fantastic',
    'amazing',
    'perfect',
    'awesome',
    'excited',
    'interesting',
    'impressed',
    'helpful',
    'useful',
    'exactly',
    'wonderful',
    'brilliant'
  ]
  const negativeWords = [
    'terrible',
    'awful',
    'hate',
    'waste',
    'useless',
    'disappointed',
    'annoyed',
    'angry',
    'unacceptable',
    'ridiculous',
    'worst',
    'horrible',
    'frustrating'
  ]
  const lowerAll = allText.toLowerCase()
  let positiveScore = 0
  let negativeScore = 0
  for (const w of positiveWords) {
    if (lowerAll.includes(w)) positiveScore++
  }
  for (const w of negativeWords) {
    if (lowerAll.includes(w)) negativeScore++
  }
  if (positiveScore > negativeScore && positiveScore >= 2) {
    intel.sentiment = 'positive'
  } else if (negativeScore > positiveScore && negativeScore >= 2) {
    intel.sentiment = 'negative'
  } else if (positiveScore > 0 || negativeScore > 0) {
    intel.sentiment = positiveScore > negativeScore ? 'positive' : negativeScore > positiveScore ? 'negative' : 'neutral'
  }
  // If no sentiment signals at all, don't set it (keep existing)

  return intel
}

// ---------------------------------------------------------------------------
// 9. matchPersona — match prospect to a known buyer persona
// ---------------------------------------------------------------------------

export function matchPersona(
  role: string | null,
  transcriptText: string,
  personas: BuyerPersona[]
): { personaId: string; personaName: string; confidence: 'high' | 'medium' | 'low' } | null {
  if (personas.length === 0) return null

  const lowerRole = (role || '').toLowerCase()
  const lowerText = transcriptText.toLowerCase()

  let bestMatch: BuyerPersona | null = null
  let bestScore = 0

  for (const persona of personas) {
    let score = 0

    // Role match (strongest signal)
    if (lowerRole) {
      for (const matchRole of persona.matchRoles) {
        if (lowerRole.includes(matchRole.toLowerCase())) {
          score += 3
          break
        }
      }
    }

    // Pain point language match
    for (const pain of persona.painPoints) {
      const keywords = pain.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      const matches = keywords.filter(kw => lowerText.includes(kw))
      if (matches.length >= 2) score += 2
      else if (matches.length >= 1) score += 1
    }

    // Nightmare keywords
    for (const nightmare of persona.nightmares) {
      const keywords = nightmare.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      if (keywords.some(kw => lowerText.includes(kw))) {
        score += 1
      }
    }

    // Language pattern match
    for (const pattern of persona.languagePatterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = persona
    }
  }

  if (!bestMatch || bestScore === 0) return null

  const confidence: 'high' | 'medium' | 'low' =
    bestScore >= 5 ? 'high' :
    bestScore >= 3 ? 'medium' :
    'low'

  return {
    personaId: bestMatch.id,
    personaName: bestMatch.name,
    confidence
  }
}

// ===========================================================================
// Internal helpers
// ===========================================================================

/**
 * Merge newly extracted intel into existing prospect record.
 * Only overwrites fields that are non-null/non-empty in the new data.
 * Arrays are union-merged (no duplicates).
 */
function mergeIntel(existing: ProspectIntel, incoming: Partial<ProspectIntel>): void {
  if (incoming.name) existing.name = incoming.name
  if (incoming.company) existing.company = incoming.company
  if (incoming.role) existing.role = incoming.role
  if (incoming.industry) existing.industry = incoming.industry
  if (incoming.companySize) existing.companySize = incoming.companySize
  if (incoming.sentiment) existing.sentiment = incoming.sentiment

  if (incoming.problemsMentioned) {
    for (const item of incoming.problemsMentioned) {
      if (!existing.problemsMentioned.includes(item)) {
        existing.problemsMentioned.push(item)
      }
    }
  }
  if (incoming.objectionsRaised) {
    for (const item of incoming.objectionsRaised) {
      if (!existing.objectionsRaised.includes(item)) {
        existing.objectionsRaised.push(item)
      }
    }
  }
  if (incoming.currentSolutions) {
    for (const item of incoming.currentSolutions) {
      if (!existing.currentSolutions.includes(item)) {
        existing.currentSolutions.push(item)
      }
    }
  }
  if (incoming.buyingSignals) {
    for (const item of incoming.buyingSignals) {
      if (!existing.buyingSignals.includes(item)) {
        existing.buyingSignals.push(item)
      }
    }
  }
}

/**
 * Extract high-level topics that the rep has covered, based on keyword clusters.
 */
function extractRepCoveredPoints(text: string): string[] {
  const points: string[] = []
  const lower = text.toLowerCase()

  const topicMap: Record<string, string[]> = {
    pricing: ['price', 'pricing', 'cost', 'subscription', 'plan', 'tier', 'discount', 'fee'],
    product: ['feature', 'functionality', 'capability', 'platform', 'tool', 'product', 'solution'],
    integration: ['integrate', 'integration', 'api', 'connect', 'plugin', 'sync', 'import', 'export'],
    security: ['security', 'encryption', 'compliance', 'soc', 'gdpr', 'hipaa', 'secure', 'privacy'],
    onboarding: ['onboarding', 'implementation', 'setup', 'migration', 'training', 'support'],
    'case study': ['case study', 'customer story', 'success story', 'example', 'client'],
    ROI: ['roi', 'return on investment', 'savings', 'efficiency', 'productivity', 'value'],
    competition: ['competitor', 'compared to', 'unlike', 'versus', 'vs', 'better than', 'different from'],
    timeline: ['timeline', 'rollout', 'go live', 'launch', 'schedule', 'weeks', 'months'],
    demo: ['demo', 'show you', 'walk through', 'let me show', 'screen share']
  }

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      points.push(topic)
    }
  }

  return points
}

/**
 * Create a brief summary of older transcript segments for context compression.
 */
function summarizeOlderSegments(segments: TranscriptSegment[]): string {
  if (segments.length === 0) return ''

  const repTexts: string[] = []
  const prospectTexts: string[] = []

  for (const seg of segments) {
    if (seg.speaker === 'rep') {
      repTexts.push(seg.text)
    } else {
      prospectTexts.push(seg.text)
    }
  }

  // Extract key topics from each side
  const repSummary = extractTopicSummary(repTexts)
  const prospectSummary = extractTopicSummary(prospectTexts)

  const parts: string[] = []
  if (repSummary) parts.push(`Rep discussed ${repSummary}`)
  if (prospectSummary) parts.push(`Prospect mentioned ${prospectSummary}`)

  if (parts.length === 0) {
    return `[Earlier: ${segments.length} exchanges occurred]`
  }

  return `[Earlier: ${parts.join(', ')}]`
}

/**
 * Extract a rough topic summary from a collection of text strings.
 * Returns a comma-separated list of detected topics.
 */
function extractTopicSummary(texts: string[]): string {
  if (texts.length === 0) return ''

  const combined = texts.join(' ').toLowerCase()
  const topics: string[] = []

  const topicKeywords: Record<string, string[]> = {
    pricing: ['price', 'cost', 'budget', 'subscription', 'plan'],
    'product features': ['feature', 'functionality', 'capability', 'platform'],
    integrations: ['integration', 'api', 'connect'],
    security: ['security', 'compliance', 'encryption'],
    'pain points': ['problem', 'challenge', 'issue', 'struggling', 'frustrated'],
    'current solutions': ['currently use', 'we use', 'existing', 'right now'],
    timelines: ['timeline', 'deadline', 'when', 'schedule', 'soon'],
    'team structure': ['team', 'department', 'organization', 'reports to'],
    competition: ['competitor', 'alternative', 'compared'],
    implementation: ['onboarding', 'implementation', 'setup', 'migration']
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      topics.push(topic)
    }
  }

  return topics.join(', ')
}
