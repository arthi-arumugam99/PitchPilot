import Anthropic from '@anthropic-ai/sdk'
import type { TriggerEvent, TriggerType, ConversationContext, CallPhase, BuyerPersona } from '../shared/types'
import { findMatchingCards } from './cards'
import { buildKnowledgeContext } from './knowledge'
import { buildColdCallingPrompt } from './cold-calling'
import { buildContextPrompt, compressTranscript } from './context'

let client: Anthropic | null = null
let triggerCounter = 0

/** Extract JSON from potentially markdown-fenced AI responses. */
function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : text.trim()
}

export function resetTriggerState(): void {
  triggerCounter = 0
}

export function initClaude(apiKey: string): void {
  client = new Anthropic({ apiKey })
}

// ---------------------------------------------------------------------------
// System prompt builders
// ---------------------------------------------------------------------------

/**
 * Build the full system prompt for live call coaching.
 * Threads cold calling strategies + conversation context + company knowledge.
 */
function buildLiveCallPrompt(
  companyId: string,
  context: ConversationContext | null,
  customInstructions: string,
  personas: BuyerPersona[] = []
): string {
  const phase: CallPhase = context?.currentPhase || 'intro'
  const knowledgeDocs = buildKnowledgeContext(companyId)
  const coldCallingPrompt = buildColdCallingPrompt(phase, context, knowledgeDocs, customInstructions, personas)

  // Append context accumulator data if available
  if (context) {
    const contextBlock = buildContextPrompt(context)
    return `${coldCallingPrompt}\n\n${contextBlock}`
  }

  return coldCallingPrompt
}

/**
 * Build a prompt for Quick Ask mode (outside of active calls).
 * Uses company knowledge but no live call context.
 */
function buildQuickAskPrompt(companyId: string, query?: string): string {
  const knowledgeContext = buildKnowledgeContext(companyId, query)

  return `You are PitchPilot AI — a sales intelligence system. You have deep knowledge of everything uploaded to the knowledge base.

When asked a question, provide a thorough, specific, and actionable answer. Use exact details from the knowledge base — features, specs, pricing, competitive differentiators, customer stories.

## RESPONSE FORMAT
- Lead with bullet points for key facts
- Be direct and specific — no filler, no fluff
- Reference exact details from the knowledge base when available
- If the question is about sales/positioning, use proven cold calling frameworks
- If the question is technical, be precise and accurate
- If you don't have specific information, say so clearly — don't make things up

${knowledgeContext}`
}

// ---------------------------------------------------------------------------
// Streaming answer generation
// ---------------------------------------------------------------------------

/**
 * Stream an answer in real-time. Three modes:
 * 1. No question + context → auto-generate coaching (live cold call copilot)
 * 2. Question + context → answer using context + KB + cold calling strategy
 * 3. Question only → pure KB question answering (Quick Ask mode)
 */
export async function streamAnswer(
  companyId: string,
  context: ConversationContext | null,
  customInstructions: string,
  question: string | undefined,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void,
  personas: BuyerPersona[] = [],
  systemPromptOverride?: string
): Promise<void> {
  if (!client) {
    onDone('API key not configured. Go to Settings.')
    return
  }

  try {
    let userContent: string
    let systemPrompt: string

    // If a system prompt override is provided (e.g. from prep chat), use it directly
    if (systemPromptOverride && question) {
      systemPrompt = systemPromptOverride
      userContent = question
    } else if (question && context) {
      // Mode 2: Specific question during a live call
      const transcript = compressTranscript(context.transcript)

      userContent = `LIVE CALL IN PROGRESS. Here's the transcript:

${transcript}

---
My question: ${question}

Give me the exact answer I can use RIGHT NOW on this call. Format as bullet points. Be specific to what's happening in the conversation.`

      systemPrompt = buildLiveCallPrompt(companyId, context, customInstructions, personas)

    } else if (question) {
      // Mode 3: Quick Ask (no call active — research/prep mode)
      userContent = question
      systemPrompt = buildQuickAskPrompt(companyId, question)

    } else if (context) {
      // Mode 1: Auto-respond to live transcript (core cold call copilot flow)
      const transcript = compressTranscript(context.transcript)

      userContent = `LIVE CALL — I need coaching NOW.

${transcript}

---
The prospect just spoke. Coach me on what to say or do next. Format as bullet points:
- First bullet = the EXACT words to say (or "Keep listening" if they're still talking)
- Additional bullets = tactical notes (tone, strategy, what to listen for)`

      systemPrompt = buildLiveCallPrompt(companyId, context, customInstructions, personas)
    } else {
      // Fallback: no context, no question
      onDone('Start a call or ask a question to get coaching.')
      return
    }

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    })

    let fullText = ''

    stream.on('text', (text) => {
      fullText += text
      onChunk(text)
    })

    await stream.finalMessage()
    onDone(fullText)
  } catch (err) {
    console.error('[Claude] Stream error:', err)
    onDone('Error generating response. Check your API key.')
  }
}

// ---------------------------------------------------------------------------
// Screen analysis
// ---------------------------------------------------------------------------

/**
 * Stream screen analysis with sales-trained vision + conversation context.
 */
export async function streamScreenAnalysis(
  companyId: string,
  context: ConversationContext | null,
  screenshotBase64: string,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void
): Promise<void> {
  if (!client) {
    onDone('API key not configured.')
    return
  }

  const knowledgeContext = buildKnowledgeContext(companyId)
  const contextBlock = context ? buildContextPrompt(context) : ''
  const transcriptText = context ? compressTranscript(context.transcript, 5000) : ''

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are PitchPilot AI — a cold calling copilot with vision. Analyze what's on screen and tell the rep exactly what to say.

ANALYZE FOR:
- Competitor products/pricing → give counter-positioning using differentiation, not trash-talk
- Technical questions/requirements → answer with specifics from the knowledge base
- Pricing/proposals → help the rep respond confidently with value framing
- Objections or concerns visible → prepare the rep with the right response
- Any data/charts → translate into talking points
- LinkedIn profiles → extract info about the prospect for personalization

## RESPONSE FORMAT
- Lead with bullet points: the EXACT words to say
- Then tactical notes: what matters on screen and why
- Keep it tight: 3-5 bullets max

${contextBlock}

${knowledgeContext}`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBase64,
            }
          },
          {
            type: 'text',
            text: transcriptText
              ? `Live call context:\n${transcriptText}\n\nWhat's on screen? What should I say?`
              : `What's on screen? Give me the key insights and what to say about it.`
          }
        ]
      }]
    })

    let fullText = ''

    stream.on('text', (text) => {
      fullText += text
      onChunk(text)
    })

    await stream.finalMessage()
    onDone(fullText)
  } catch (err) {
    console.error('[Claude] Screen analysis error:', err)
    onDone('Error analyzing screen.')
  }
}

// ---------------------------------------------------------------------------
// Transcript analysis (trigger detection)
// ---------------------------------------------------------------------------

/**
 * Background auto-analysis with cold-calling-aware trigger detection.
 * Now uses full ConversationContext for richer, more accurate detection.
 */
export async function analyzeTranscript(
  companyId: string,
  context: ConversationContext,
  personas: BuyerPersona[] = []
): Promise<TriggerEvent[]> {
  if (!client) return []

  const recentSegments = context.transcript.slice(-6)
  if (recentSegments.length === 0) return []
  const recentText = recentSegments.map(s => `[${s.speaker.toUpperCase()}]: ${s.text}`).join('\n')

  try {
    const knowledgeContext = buildKnowledgeContext(companyId, recentText)
    const contextBlock = buildContextPrompt(context)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are PitchPilot AI — a cold calling intelligence system that detects critical moments in live conversations and provides immediate, actionable coaching.

## DETECTION FRAMEWORK
Analyze the recent transcript for these trigger types:
- **objection**: Prospect pushes back, says not interested, raises a concern
- **competitor**: Prospect mentions a competing product or alternative approach
- **technical**: Prospect asks a technical question or mentions a requirement
- **buying_signal**: Prospect shows interest, asks about pricing/timeline/next steps
- **pricing**: Prospect brings up cost, budget, or pricing concerns
- **risk**: Prospect mentions risk, security, compliance, or migration concerns
- **decision_maker**: Prospect references their boss, team, approval process
- **closing**: Conversation is ready for a close attempt (engagement signals)

## COLD CALLING CONTEXT
Phase: ${context.currentPhase.toUpperCase()}
${contextBlock}
${context.prospect.matchedPersona ? `\nMatched Persona: ${context.prospect.matchedPersona.personaName} (${context.prospect.matchedPersona.confidence} confidence)\n${(() => { const p = personas.find(pp => pp.id === context.prospect.matchedPersona?.personaId); return p ? `Persona triggers to weight higher: ${p.painPoints.slice(0, 3).join(', ')}` : '' })()}` : ''}

## RESPONSE RULES
- Only flag HIGH confidence triggers — false positives break trust
- For each trigger, provide the EXACT words to say back — natural, confident, specific
- Use the prospect's own words in your response
- Reference knowledge base facts when relevant
- Format responses as bullet points for quick scanning

Respond with JSON only:
{"answers": [{"question": "what they asked/said", "answer": "- First bullet: exact words to say\\n- Second bullet: tactical note", "type": "objection|competitor|technical|buying_signal|pricing|risk|closing|decision_maker", "confidence": "high|medium|low"}]}

If nothing significant detected, return {"answers": []}.

${knowledgeContext}`,
      messages: [{
        role: 'user',
        content: `RECENT TRANSCRIPT:\n${recentText}`
      }]
    })

    const content = message.content[0]
    if (content.type !== 'text') return []

    const parsed = JSON.parse(extractJSON(content.text))
    const answers = parsed.answers || []

    return answers.map((a: any) => {
      const matchedCards = findMatchingCards(companyId, recentText)
      return {
        id: `trigger-${++triggerCounter}`,
        type: (a.type || 'objection') as TriggerType,
        confidence: (a.confidence || 'medium') as 'high' | 'medium' | 'low',
        sourceText: a.question || recentText,
        suggestedResponse: a.answer,
        matchedCards: matchedCards.map((c: any) => c.id),
        timestamp: Date.now(),
      }
    })
  } catch (err) {
    console.error('[Claude] Analysis error:', err)
    return []
  }
}
