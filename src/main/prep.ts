import type { CompanyProfile, BuyerPersona, PrepLaunchPayload } from '../shared/types'
import { getCompany } from './companies'
import { buildKnowledgeContext } from './knowledge'
import { getCards } from './cards'

/** Check if the user's message is a briefing request (wants structured prep). */
export function isBriefingRequest(question: string): boolean {
  const q = question.toLowerCase()
  return /\b(prep me|brief me|prepare me|get me ready|i'?m calling|what should i know|before my call|about to call)\b/.test(q)
}

/** Structured output format instructions for briefing responses. */
function getBriefingInstructions(): string {
  return `
The user is requesting a PRE-CALL BRIEFING. Respond in this EXACT format:

**PERSONA MATCH:** [best matching persona name, or "General Prospect" if unclear]

**PAIN POINTS:**
- [specific pain point 1]
- [specific pain point 2]
- [specific pain point 3]

**SUGGESTED OPENERS:**
1. [opening line 1 — natural, conversational, under 25 words]
2. [opening line 2 — different angle]

**OBJECTION PREP:**
- "[likely objection]" → [exact response to use]
- "[likely objection]" → [exact response to use]

**DISCOVERY QUESTIONS:**
1. [open-ended question to ask them]
2. [open-ended question to ask them]
3. [open-ended question to ask them]

Be specific. Use actual data from the knowledge base and personas. No generic advice.`
}

/**
 * Build the enhanced system prompt for prep chat.
 * Includes company personas, battle cards, and KB — much richer than Quick Ask.
 * Designed for speed: concise prompt, no bloat.
 */
export function buildPrepPrompt(
  companyId: string,
  question: string,
  chatHistory: { role: string; text: string }[]
): { systemPrompt: string; userMessage: string } {
  const company = getCompany(companyId)
  const knowledgeContext = buildKnowledgeContext(companyId, question)
  const cards = getCards(companyId)

  // Build persona block (concise — only names + key pain points)
  let personaBlock = ''
  if (company?.personas?.length) {
    personaBlock = '\n## BUYER PERSONAS\n' + company.personas.map(p =>
      `**${p.name}** (${p.role}): ${p.painPoints.slice(0, 3).join('; ')}. Trigger: ${p.triggerMoment}`
    ).join('\n')
  }

  // Build battle cards block (just titles + categories for context)
  let cardsBlock = ''
  if (cards.length > 0) {
    cardsBlock = '\n## BATTLE CARDS AVAILABLE\n' + cards.slice(0, 15).map(c =>
      `- [${c.category}] ${c.title}: ${c.triggerKeywords.slice(0, 3).join(', ')}`
    ).join('\n')
  }

  // Briefing detection
  const briefingInstructions = isBriefingRequest(question) ? '\n' + getBriefingInstructions() : ''

  const systemPrompt = `You are PitchPilot — a pre-call research assistant for sales reps. You help them prepare for cold calls by providing specific, actionable intelligence.

RULES:
- Be FAST. Short, punchy responses. Bullet points.
- Use exact data from the knowledge base — never make up product details
- Reference buyer personas by name when relevant
- For objection handling, use battle card responses
- No filler, no disclaimers, no "here's what I found" — just the answer
${company ? `\n## COMPANY: ${company.name}${company.productPitch ? `\nProduct: ${company.productPitch}` : ''}${company.targetVertical ? `\nTarget: ${company.targetVertical}` : ''}${company.customInstructions ? `\nContext: ${company.customInstructions}` : ''}` : ''}
${personaBlock}${cardsBlock}
${knowledgeContext}${briefingInstructions}`

  // Build user message with chat history for continuity
  let userMessage = question
  if (chatHistory.length > 0) {
    const historyBlock = chatHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.text.slice(0, 300)}`
    ).join('\n')
    userMessage = `Previous conversation:\n${historyBlock}\n\n---\nCurrent question: ${question}`
  }

  return { systemPrompt, userMessage }
}

/**
 * Build a concise prep summary for carrying into a live call.
 * Keeps it under ~500 tokens for the call context window.
 */
export function buildPrepSummary(
  chatHistory: { role: string; text: string }[],
  briefing: { matchedPersona: string | null; painPoints: string[]; suggestedOpeners: string[] } | null
): string {
  const parts: string[] = []

  if (briefing) {
    if (briefing.matchedPersona) parts.push(`Persona: ${briefing.matchedPersona}`)
    if (briefing.painPoints.length) parts.push(`Pain points: ${briefing.painPoints.slice(0, 3).join('; ')}`)
    if (briefing.suggestedOpeners.length) parts.push(`Lead with: ${briefing.suggestedOpeners[0]}`)
  }

  // Extract key user context from chat
  const userMessages = chatHistory.filter(m => m.role === 'user').map(m => m.text)
  if (userMessages.length > 0) {
    const lastUserMsg = userMessages[userMessages.length - 1]
    if (lastUserMsg.length > 10) parts.push(`Rep's focus: ${lastUserMsg.slice(0, 150)}`)
  }

  return parts.join('\n') || 'No prep context'
}
