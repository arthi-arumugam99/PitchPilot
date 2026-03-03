/**
 * PitchPilot AI Cold Calling Strategy Engine
 *
 * Synthesized from:
 * - Josh Braun / Chris Voss: Permission-based openers, tonality control,
 *   Miyagi objection handling, problem propositions over value propositions
 * - Agentune: Reasoning-before-response, diagnostic checklist, evidence-based tuning
 * - Swarm/Product-Marketing-Agency: Variability system, anti-patterns, QA evaluation
 *
 * This module provides phase-specific cold calling scripts and coaching
 * for INTRO, HOOK, and CLOSE phases of an outbound call.
 */

import type { CallPhase, ConversationContext, BuyerPersona } from '../shared/types'

// ==========================================
// INTRO PHASE STRATEGIES
// ==========================================

export const INTRO_STRATEGIES = {
  permissionOpener: `PERMISSION-BASED OPENER:
Script: "Hey [Name], I just finished reading [trigger/context]. My name's [Rep], and I know I'm calling you out of the blue. Do you mind if I get half a minute? I'll share why I called you specifically, and then you can tell me whether or not it's worth a chat."

WHY IT WORKS:
- Acknowledges the interruption (builds trust immediately)
- Uses a specific trigger so they know this isn't a spray-and-pray dial
- Asks for permission — puts THEM in control, which paradoxically makes them more likely to say yes
- "Half a minute" is a micro-commitment — easy to say yes to
- "You can tell me whether or not it's worth a chat" — zero pressure, total honesty

DELIVERY NOTES:
- Speak at 70% of your normal speed
- Pause after "out of the blue" — let it land
- Smile when you say their name (they can hear it)`,

  nameTossOpener: `NAME-TOSS OPENER:
Script: "I work with a few other [peers] at [company]. It's [Rep] from [Company]. Hey, have you heard my name tossed around?"

WHY IT WORKS:
- Creates curiosity — they immediately wonder "should I know this person?"
- Social proof: you already work with their peers
- The question flips the dynamic — now THEY are responding to YOU
- Even when they say "no," you've earned the right to explain

DELIVERY NOTES:
- Say it casually, like you're calling a colleague
- The tone should be warm and familiar, not scripted
- If they say "no," respond with: "Oh, no worries — we've been working with [peer/dept] on [thing], and your name came up as someone I should reach out to"`,

  tonalityCoaching: `TONALITY AND PRESENCE COACHING:
- Speak slowly — slower than feels natural. Cold calls fail when reps sound rushed and nervous.
- Use downtones at the end of sentences. Uptones (rising intonation) signal uncertainty and sound like you're asking for permission to exist. Downtones signal confidence and authority.
- Tilt your chin slightly down for a more authoritative, grounded vocal tone. Chin up = airy and unsure.
- Your first 5 dials of the day are always your worst. Give yourself grace. Warm up with lower-priority prospects.
- Stand up for a power stance. Your body affects your voice. Slouching = weak voice. Standing = engaged and commanding.
- Smile before you dial. A genuine smile changes your vocal warmth and makes you sound like someone they WANT to talk to.
- Record your first 3 calls and listen back. You will be horrified — and that's how you improve.
- Breathe from your diaphragm, not your chest. Chest breathing makes your voice thin and tense.`,
}

// ==========================================
// HOOK PHASE STRATEGIES
// ==========================================

export const HOOK_STRATEGIES = {
  problemProposition: `PROBLEM PROPOSITION (Not Value Proposition):
Script: "I talk to a lot of [role] at [type of company], and most of the folks I talk to tell me they're really frustrated with [specific problem]. I know I'm totally calling you out of the blue, but that's a problem we make go away for about [N] companies, and I'm wondering if you might be open to learning more when I'm not cold calling you out of the blue."

WHY IT WORKS:
- Leads with THEIR problem, not YOUR product
- "Most of the folks I talk to" = social proof that this is a real, common issue
- Repeating "out of the blue" is intentional — self-aware humor disarms
- "Open to learning more" is low-commitment language
- The ask is for a FUTURE conversation, not a commitment right now

KEY PRINCIPLE: Value propositions say "here's what WE do." Problem propositions say "here's what YOU struggle with." The second one earns attention.`,

  miyagiObjection: `MIYAGI OBJECTION HANDLING (Three Steps):

STEP 1 — AGREE (Do NOT resist):
"Hey [Name], I totally get that. Honestly, you probably would have called me if you were interested. This one's on me."
- Never fight the objection. Agree with it. This completely disarms them.
- "This one's on me" takes ownership and removes all pressure.

STEP 2 — SPLIT (Create a fork):
"Just so no one calls you again, could you give me a sense? Is it because you have something in place, you're doing this in house, or I just totally caught you off guard and you hate getting cold calls? It's gotta be one of those three things."
- The "just so no one calls you again" gives them a reason to answer that benefits THEM.
- The three options are designed to reveal their real situation.
- Option 1 (something in place) = competitive intel opportunity
- Option 2 (in house) = potential pain point to explore
- Option 3 (hate cold calls) = human moment that often opens the door

STEP 3 — REDIRECT (Use their answer):
- If they pick option 1: "Oh interesting — who are you using? How's that going?" (genuine curiosity)
- If they pick option 2: "Got it — how's that working for you? Is the team keeping up?" (explore pain)
- If they pick option 3: "Ha, fair enough. Look, I'll keep it to 30 seconds..." (humor + brevity)
- The goal is a GENUINE conversation, not a pitch. Listen. Be curious. Be human.`,

  customerVoice: `CUSTOMER VOICE TECHNIQUE:
Script: "Usually what I hear from [role]s is that they love [pro about current approach] but one of the things we oftentimes hear is that [con/gap]. How does that compare to your experience?"

WHY IT WORKS:
- You're not telling them they have a problem — you're sharing what OTHERS say
- Leading with a positive ("they love...") shows you're fair and not just bashing their current approach
- The gap/con is delivered as third-party observation, not your opinion
- "How does that compare?" invites them to open up without being interrogated
- If they agree with the con, you've earned the right to go deeper
- If they disagree, you learn something valuable about their situation`,

  magicWand: `MAGIC WAND QUESTION:
Script: "It sounds like you guys are honestly a really well oiled machine. If you could wave your magic wand and improve one thing, what would it be?"

WHY IT WORKS:
- The compliment ("well oiled machine") lowers their guard — you're not attacking their setup
- "Magic wand" makes the question feel hypothetical and safe
- Even people who say "everything is great" will answer this — everyone has something
- Their answer tells you EXACTLY what problem to solve
- This is a discovery goldmine disguised as a casual question

WHEN TO USE: After they've told you things are fine and they don't need anything. This question finds the crack in the armor.`,

  activeListening: `ACTIVE LISTENING DISCIPLINE:
- Take a sip of water after they finish speaking. This forces an artificial pause that shows you're thinking, not just waiting to talk.
- Listen with intent to LISTEN, not intent to RESPOND. Most reps are mentally rehearsing their next line while the prospect talks. Stop doing that.
- Force an artificial pause of 2-3 seconds after they finish. Comfortable silence signals confidence. Jumping in immediately signals anxiety.
- Mirror their last 2-3 words as a question: "You're frustrated with the reporting?" — this makes them elaborate without you asking a direct question.
- Take notes on their EXACT words. Use their language back to them, not your corporate jargon.
- If you catch yourself thinking about what to say next, you've already lost the thread. Refocus on their words.
- Nod (even on the phone — it changes your vocal tone) and use brief affirmations: "mm-hmm," "right," "yeah" — but don't overdo it.`,
}

// ==========================================
// CLOSE PHASE STRATEGIES
// ==========================================

export const CLOSE_STRATEGIES = {
  hardClose: `HARD CLOSE (Two-Option Close):
Script: "That's exactly why we should meet. How about [Day] at [Time] or [Day2] at [Time2]? I could walk you through exactly how we can help support you with [their stated problem]."

WHY IT WORKS:
- "That's exactly why we should meet" connects the meeting to THEIR problem, not your agenda
- Two specific options are easier to choose from than an open-ended "when are you free?"
- Tying it back to "[their stated problem]" proves you were listening
- The choice is between two yeses, not yes vs. no

DELIVERY: Say this with conviction. No uptone. No "would that work?" at the end. State it like the obvious next step.`,

  dontDropBaby: `DON'T DROP THE BABY (Calendar Hold Technique):
Script: "Totally get it. I know you're probably running between meetings. I'm going to send a hold for next [Day] in the afternoon, so it's out of the way. That's probably going to be an incorrect time. And I'll follow up with a few other times that also work. If that hold works, would you mind just accepting it or picking another time if it doesn't?"

WHY IT WORKS:
- "I know you're probably running between meetings" — empathy and awareness
- Sending a calendar hold makes it REAL. An email gets buried. A calendar hold gets seen.
- "That's probably going to be an incorrect time" is genius — it preempts "that time doesn't work" and makes you sound low-pressure
- "Accepting it OR picking another time" — both options result in a meeting
- You've now transferred the ball to their court with a concrete artifact

KEY RULE: NEVER let them say "send me an email" and just send an email. Always send a calendar hold alongside it. Emails die. Calendar holds live.`,

  confirmationProtocol: `CONFIRMATION PROTOCOL (Lock the Meeting):
Script: "Just so I'm best prepared for this meeting — what would you like me to tailor it to? Who else should I add? And let me confirm your email..."

WHY IT WORKS:
- "Best prepared" signals professionalism and respect for their time
- Asking what to tailor it to gets them emotionally invested in the meeting
- "Who else should I add?" multi-threads the opportunity — now you have more stakeholders
- Confirming email is a practical closer that makes the meeting feel done
- Each question deepens their commitment — by the time they answer all three, the meeting is locked

USE THIS: Immediately after they agree to a meeting. Don't celebrate. Don't pause. Go straight into confirmation. Speed = certainty.`,
}

// ==========================================
// FULL-SPECTRUM COACHING
// (Small talk, rapport, transitions, awkward moments, gatekeeper nav)
// ==========================================

export const SMALL_TALK_STRATEGIES = {
  rapportBuilding: `RAPPORT & SMALL TALK COACHING:
You must coach the rep through EVERY moment of the call, not just the big moments.

WEATHER / SPORTS / LOCAL:
- If the prospect mentions weather: "Ha, yeah — it's been [agree]. At least it gives us an excuse to stay inside and take meetings, right?" (pivot to business)
- If sports come up: Mirror their energy. "Oh man, did you catch [game]? That [moment] was unreal." Then pivot: "Anyway, the reason I called..."
- If they mention a local event or holiday: Acknowledge it warmly, then bridge: "Enjoy it — before I let you go, quick reason I called..."
- RULE: Match their energy. If they're chatty, be chatty for 10-15 seconds. If they're curt, skip small talk entirely.

MIRRORING ENERGY:
- If prospect is upbeat → be upbeat. "Hey! Love the energy. Quick thing —"
- If prospect is serious/formal → match it. Drop the casual, be direct and professional.
- If prospect sounds tired/rushed → acknowledge it. "I can hear you're slammed. 20 seconds, I promise."
- If prospect is laughing/joking → laugh with them. Humor builds trust faster than any script.
- NEVER be more energetic than them. Match or go slightly below. Over-enthusiasm is suspicious on a cold call.

CASUAL FOLLOW-UPS (for warm/repeat calls):
- "Hey [Name], it's [Rep] again — how did that [thing they mentioned] go?"
- "Before we dive in — did your team end up [thing they were considering]?"
- "Quick question — last time you mentioned [X]. How's that going?"
- These show you LISTENED and REMEMBERED. That's rare and powerful.`,

  humanMoments: `HUMAN MOMENTS — WHEN TO BE A PERSON, NOT A SALESPERSON:
- If they sneeze: "Bless you." Then pause. Let them recover. Don't bulldoze through it.
- If a baby/dog/kid is in the background: "Ha, sounds like you've got a co-worker there." Quick laugh, then back to business.
- If they apologize for background noise: "No worries at all — life happens. So where were we..."
- If they yawn: "Long day? I'll keep this quick, I promise."
- If they laugh at something you say: PAUSE. Let the laugh breathe. Don't immediately go back to selling. Laughter = connection. Let it land.
- If they share something personal (vacation, new role, kid's game): Acknowledge it genuinely. "Oh that's awesome — congrats." ONE sentence. Then bridge back.
- RULE: These micro-moments build more trust than any pitch. Don't skip them. Don't rush through them. Be human for 3 seconds, then return to the call.`,
}

export const TRANSITION_STRATEGIES = {
  smallTalkToBusiness: `TRANSITIONING FROM SMALL TALK TO BUSINESS:
The transition is the most awkward moment of any cold call. Here's how to make it seamless:

SMOOTH BRIDGES:
- "Anyway — the reason I'm calling is actually pretty specific."
- "So — real quick, before I let you get back to [thing they mentioned]..."
- "I appreciate you taking a sec — here's why I reached out specifically to you."
- "On a totally different note — I came across your name because..."
- "Well hey, I won't keep you — but the reason I called..."

BAD TRANSITIONS (Never do these):
- "So, moving on to business..." (too formal, kills the vibe)
- Abrupt topic change with no bridge (feels jarring)
- Awkward silence followed by a pitch (screams "I'm reading a script")

RULE: The best transition feels like a natural gear shift, not a hard stop. Use a connector word ("anyway," "so," "hey") + reason you called.`,

  openerToProblemProp: `TRANSITIONING FROM OPENER TO PROBLEM PROPOSITION:
After they give you permission to continue (or at least don't hang up):

- "Appreciate that. So here's the deal —" [problem proposition]
- "Cool — so the reason your name came up is..." [specific trigger]
- "Perfect. So I talk to a lot of [their role]s, and here's what keeps coming up —" [problem]
- "Great — so quick context on why I called you specifically..." [trigger + problem]

TIMING: This transition should happen within 5-10 seconds of getting permission. Don't linger in opener mode.`,

  discoveryToClose: `TRANSITIONING FROM DISCOVERY TO CLOSE:
The hardest transition for most reps. Here's how to know when and how:

SIGNALS IT'S TIME TO CLOSE:
- They've shared a real problem (not just surface-level "yeah, could be better")
- They're asking YOU questions ("So how does that work?" / "What do you guys do differently?")
- Their tone shifted from guarded to curious
- They've been talking for 30+ seconds about their challenges
- They said "yeah, exactly" or "that's actually a good point"

TRANSITION SCRIPTS:
- "You know what, it sounds like there's a real conversation here. How about we set up 15 minutes when I'm not cold calling you and I can actually show you how we've solved this?"
- "I don't want to take up more of your time on a cold call — but this sounds like exactly the kind of thing we help with. Can I throw a quick 15 on the calendar?"
- "Look, I could keep asking questions, but honestly I think it'd be way more valuable if I showed you. How's [Day] look?"

RULE: When you feel the urge to ask one more question — STOP. That's your close signal. One more question often kills the momentum.`,
}

export const AWKWARD_MOMENT_STRATEGIES = {
  deadSilence: `HANDLING DEAD SILENCE:
Silence is not your enemy. Most reps panic and fill it with word vomit.

WHAT TO DO:
- 2-3 second pause after they speak: NORMAL. Don't panic. Shows you're thinking.
- 3-5 second silence after your question: WAIT. They're thinking. The first person to speak loses.
- 5+ seconds of silence: Gently re-engage. "I know that's a lot to think about — what's your initial reaction?"
- Silence after your close attempt: DO NOT FILL IT. Let them process. The silence is working FOR you.

WHAT TO SAY IF THEY GO COMPLETELY QUIET:
- "Take your time — it's a fair question."
- "I realize I just threw a lot at you. What stands out?"
- "No rush — what's going through your mind?"

RULE: The person who speaks first after a close attempt loses negotiating position. If you asked for the meeting, SHUT UP and wait.`,

  prospectDistracted: `WHEN THE PROSPECT IS DISTRACTED:
Signs: short "uh-huh" responses, typing sounds, long pauses, asking you to repeat things.

WHAT TO DO:
- Call it out gently: "Hey, it sounds like you might be in the middle of something. Want me to call back in 20 minutes?"
- This does two things: (1) shows respect, (2) gets you a WARM callback instead of a cold call
- If they say "no, go ahead": They'll actually pay attention now because you gave them an out
- If they say "yeah, call me back": You now have a scheduled callback. That's GOLD.

WHAT NOT TO DO:
- Don't keep plowing through your pitch while they're clearly not listening
- Don't get frustrated or passive-aggressive
- Don't speed up to "get through it" before they zone out more`,

  prospectRude: `WHEN THE PROSPECT IS RUDE OR HOSTILE:
"Take me off your list." / "Stop calling me." / "I don't take cold calls."

RESPONSE FRAMEWORK:
- Stay calm. Match their energy with LOWER energy, not equal or higher.
- "Hey, I totally hear you. Before I go — can I ask one quick thing just so I know whether to ever call back?"
- If they say yes → one shot: "Is it that you've got something in place, or is it genuinely bad timing?"
- If they say no / hang up → Let them go. Note it. Move on. Not every call is a win.

HARD NO SIGNALS (Stop immediately):
- "Do not call this number again" → Respect it. Remove them. "Done. You won't hear from me again. Take care."
- Yelling or aggressive language → "I hear you. I'm removing you now. Have a good day."
- Hanging up → They've made their choice. Move on.

RULE: You lose nothing by being gracious when they're rude. You lose everything by being combative. Rude exits that are handled well sometimes lead to callbacks — "Hey, you called me last week and I was having a terrible day..."`,

  gatekeeperNavigation: `NAVIGATING GATEKEEPERS:
Receptionists, EAs, and office managers are NOT obstacles. They are allies if you treat them right.

APPROACH 1 — THE PEER:
"Hey, this is [Rep] — is [Name] around?" (casual, like you know them)
- No last name. No company. No explanation. Like a peer would call.
- If they ask "What's this regarding?": "Oh, I was just following up on something — is [he/she] at [his/her] desk?"

APPROACH 2 — THE ALLY:
"Hi — I'm trying to reach [Name], and honestly, I'm not sure if [he/she] is the right person. You probably know better than me — who handles [topic area] over there?"
- This turns the gatekeeper into a HELPER. They love being the person who knows.
- Often gets you redirected to the ACTUAL decision maker.

APPROACH 3 — THE DIRECT:
"Hey, it's [Rep] from [Company]. I have a meeting request I need to get to [Name] — what's the best email to send that to?"
- Not lying — you DO want a meeting. You're just getting the email.

RULES:
- NEVER lie about who you are or why you're calling
- NEVER say "Is [Name] available?" — that's salesperson language. Say "Is [Name] around?"
- NEVER treat them as less-than. They talk to the decision maker every day. They WILL mention if you were rude.
- If they say "Let me take a message" → Leave one. Then call back at 7:45 AM or 5:15 PM when the gatekeeper isn't there.`,
}

export const ACTIVE_LISTENING_PHRASES = {
  affirmations: [
    'Yeah, that makes total sense.',
    'Right, right.',
    'Oh, interesting.',
    'Hmm, yeah I hear that a lot actually.',
    'That tracks.',
    'Totally.',
    'Yeah, I get that.',
    'Mm-hmm.',
  ],
  reflections: [
    "So what you're saying is [mirror their words]...",
    "Wait — so [restate what they said]? That's really common actually.",
    'Let me make sure I got that — [paraphrase]. Did I get that right?',
    "Interesting — so the main issue is [their words]. How long has that been going on?",
    "[Their exact phrase]? Tell me more about that.",
    "When you say [their word], what does that look like day to day?",
  ],
  deepeners: [
    'Tell me more about that.',
    "What does that look like in practice?",
    'How long has that been an issue?',
    "What have you tried so far?",
    "How's that affecting the team?",
    "What would it look like if that was solved?",
    "Is that the biggest challenge, or is there something else keeping you up at night?",
  ],
}

// ==========================================
// COLD CALLING ANTI-PATTERNS
// ==========================================

export const COLD_CALLING_ANTI_PATTERNS = `
## COLD CALLING ANTI-PATTERNS — NEVER DO THESE

### Opening Anti-Patterns
- NEVER open with "How are you doing today?" — it's disingenuous on a cold call. They know you don't care. It instantly signals "salesperson."
- NEVER ask "Did I catch you at a bad time?" — the answer is ALWAYS yes. You're handing them an easy exit. Instead, acknowledge the interruption and ask for permission.
- NEVER lead with what your company does — "We're a leading provider of..." makes their eyes glaze over. Lead with THEIR problems, not YOUR product.
- NEVER use a value proposition — "We help companies achieve X" is about YOU. Use a problem proposition: "Most [role]s tell me they're frustrated with X" is about THEM.

### Objection Anti-Patterns
- NEVER ask "Why aren't you interested?" — it's confrontational and puts them on the defensive. Use the Miyagi split instead to give them a graceful way to share.
- NEVER argue with an objection — "But actually..." or "Well, the thing is..." makes them dig in harder. Agree first, then redirect.
- NEVER ignore an objection and keep pitching — they'll mentally check out and you'll never get them back.

### Closing Anti-Patterns
- NEVER keep asking questions when you should close — recognize the moment when you've earned the right to ask for the meeting and DO IT. Over-discovering kills momentum.
- NEVER let them say "send me an email" without also sending a placeholder calendar hold — emails get buried. Calendar holds get seen. Always send both.
- NEVER end a cold call without a clear, specific next step — "I'll follow up sometime" is not a next step. "[Day] at [Time]" is a next step.

### Tone Anti-Patterns
- NEVER sound like a telemarketer — if you sound like you're reading a script, you've already lost. Sound like a peer who has something genuinely relevant to share.
- NEVER speak fast out of nervousness — speed signals anxiety and desperation. Slow down. Pause. Breathe.
- NEVER use corporate jargon — "synergy," "leverage," "optimize," "solution" — real humans don't talk like this. Use plain language.
- NEVER be overly enthusiastic — "This is SO exciting!" on a cold call is suspicious. Be calm, warm, and genuine.
`

// ==========================================
// REASONING-BEFORE-RESPONSE FRAMEWORK
// (Cold Calling specific, adapted from Agentune)
// ==========================================

export const COLD_CALLING_REASONING = `
## COLD CALL REASONING PROCESS (Before every coaching suggestion)

Before generating a response or coaching tip, run through this checklist:

1. **WHERE ARE WE?** What phase is this call in?
   - INTRO: Are we past the opener? Did they give permission to continue?
   - HOOK: Have we identified a problem? Are they engaged or trying to leave?
   - CLOSE: Have we earned the right to ask for the meeting?

2. **WHAT JUST HAPPENED?** Read the last 2-3 exchanges.
   - Did the prospect object? Which type? (brush-off, real concern, reflexive "not interested")
   - Did they share information? (pain point, competitor, current situation)
   - Did they give a buying signal? (asked a question, showed curiosity)
   - Are they trying to end the call? (short answers, "send me an email," silence)

3. **WHAT'S THE PROSPECT'S STATE?**
   - Engaged and curious? Push forward.
   - Politely resistant? Use Miyagi.
   - Actively hostile? Gracefully exit — this one isn't worth burning.
   - Sharing freely? Shut up and listen. Do NOT interrupt discovery gold.

4. **WHAT STRATEGY FITS?**
   - Match the strategy to the moment, not the script.
   - If they're sharing, use active listening and customer voice.
   - If they're resisting, use Miyagi or magic wand.
   - If they're engaged, close. Don't over-discover.

5. **SOUND CHECK**: Would a top cold caller actually say this?
   - Is it conversational, not robotic?
   - Is it 1-3 sentences max? (Cold calls need brevity)
   - Does it sound like a peer, not a salesperson?
   - Would you say this to a friend who works in that industry?

6. **VERIFY**: Am I coaching the rep toward the right move?
   - Am I helping them advance, not just survive?
   - Am I being specific, not generic?
   - Am I suggesting words they can actually say out loud right now?
`

// ==========================================
// QA DIMENSIONS FOR COLD CALLING
// (Adapted from Product-Marketing-Agency evaluation)
// ==========================================

export const COLD_CALLING_QA = `
Every cold calling suggestion should score well on these dimensions:
1. **Brevity** (1-10): Is it short enough for a cold call? (2-3 sentences ideal, 5 max)
2. **Authenticity** (1-10): Does it sound like a real human, not a script?
3. **Problem-Centricity** (1-10): Does it focus on THEIR problem, not YOUR product?
4. **Disarming** (1-10): Does it lower resistance and build trust?
5. **Advancing** (1-10): Does it move toward a meeting or next step?
6. **Peer Tonality** (1-10): Does it sound like a peer, not a subordinate or a used car salesman?
`

// ==========================================
// VARIABILITY SYSTEM
// (Cold calling specific openers, transitions, pivots)
// ==========================================

const COLD_OPENER_HOOKS = [
  'Hey, I know this is totally out of the blue — ',
  'Look, I\'m going to be upfront — this is a cold call. ',
  'I know you weren\'t expecting this call — ',
  'Real quick — I know you\'re busy. ',
  'I\'ll be honest, this is a cold call. But here\'s why I specifically called YOU — ',
  'Before you hang up — 30 seconds, and you can decide if it\'s worth talking. ',
  'I know I\'m interrupting your day — ',
  'Quick heads up, this is a cold call. Give me 20 seconds? ',
  'I\'m calling because I noticed something about your team — ',
  'Full transparency — we haven\'t spoken before. ',
]

const EVIDENCE_TRANSITIONS = [
  'What I\'m hearing from other [role]s is',
  'We\'re seeing this a lot with teams like yours —',
  'One of the [role]s I spoke with last week said',
  'Here\'s what\'s interesting —',
  'The pattern I keep seeing is',
  'Most folks in your position tell me',
  'What triggered this call is',
  'The reason I reached out specifically is',
  'I talked to someone at [similar company] who said',
  'Here\'s what caught my attention about your team —',
]

const CLOSING_PIVOTS = [
  'Would it make sense to put 15 minutes on the calendar?',
  'How about we set up a quick chat when I\'m not cold calling you?',
  'Can I send over a calendar hold for next week?',
  'Would [Day] or [Day2] work for a quick 15?',
  'Let me throw a placeholder on the calendar — you can move it if the time doesn\'t work.',
  'Sounds like it\'s at least worth a conversation. How\'s [Day]?',
  'I\'d love to show you how we\'ve solved this for others. 15 minutes — that\'s it.',
  'Let\'s get something on the books. What does your [Day] look like?',
]

export function getRandomColdOpener(): string {
  return COLD_OPENER_HOOKS[Math.floor(Math.random() * COLD_OPENER_HOOKS.length)]
}

export function getRandomEvidenceTransition(): string {
  return EVIDENCE_TRANSITIONS[Math.floor(Math.random() * EVIDENCE_TRANSITIONS.length)]
}

export function getRandomClosingPivot(): string {
  return CLOSING_PIVOTS[Math.floor(Math.random() * CLOSING_PIVOTS.length)]
}

// ==========================================
// PHASE STRATEGY BUILDER
// ==========================================

const PHASE_STRATEGIES: Record<CallPhase, string> = {
  intro: `## INTRO PHASE — EARN THE RIGHT TO SPEAK

Your only goal in the first 10 seconds is to NOT get hung up on. You are not selling. You are not pitching. You are earning 30 more seconds.

### Available Openers:

${INTRO_STRATEGIES.permissionOpener}

${INTRO_STRATEGIES.nameTossOpener}

### Vocal Delivery:
${INTRO_STRATEGIES.tonalityCoaching}

### Small Talk & Rapport:
${SMALL_TALK_STRATEGIES.rapportBuilding}

${SMALL_TALK_STRATEGIES.humanMoments}

### Gatekeeper Navigation:
${AWKWARD_MOMENT_STRATEGIES.gatekeeperNavigation}

### Transitioning to Business:
${TRANSITION_STRATEGIES.smallTalkToBusiness}

${TRANSITION_STRATEGIES.openerToProblemProp}

### Phase Rules:
- Your opener should be under 15 seconds spoken aloud
- Mention THEIR name and a specific reason you're calling
- Acknowledge the cold call — pretending it's not one insults their intelligence
- Ask for permission to continue — it paradoxically increases compliance
- If they say "no" to your permission ask, say "Totally fair. Before I go — can I at least tell you why your name came up?" (one more shot)
- If small talk happens naturally, ride it for 10-15 seconds then bridge to business
- If you hit a gatekeeper, use the peer or ally approach — never the "is [Name] available?" line`,

  hook: `## HOOK PHASE — CREATE GENUINE ENGAGEMENT

You've earned their attention. Now earn their curiosity. The hook phase is about identifying a real problem and making them want to explore it with you.

### Problem Proposition:
${HOOK_STRATEGIES.problemProposition}

### Handling "Not Interested" / Brush-Offs:
${HOOK_STRATEGIES.miyagiObjection}

### Discovery Techniques:
${HOOK_STRATEGIES.customerVoice}

${HOOK_STRATEGIES.magicWand}

### Listening Discipline:
${HOOK_STRATEGIES.activeListening}

### Active Listening Phrases to Suggest:
Affirmations: ${ACTIVE_LISTENING_PHRASES.affirmations.join(' / ')}
Reflections: ${ACTIVE_LISTENING_PHRASES.reflections.join(' / ')}
Deepeners: ${ACTIVE_LISTENING_PHRASES.deepeners.join(' / ')}

### Handling Awkward Moments:
${AWKWARD_MOMENT_STRATEGIES.deadSilence}

${AWKWARD_MOMENT_STRATEGIES.prospectDistracted}

${AWKWARD_MOMENT_STRATEGIES.prospectRude}

### Knowing When to Close:
${TRANSITION_STRATEGIES.discoveryToClose}

### Phase Rules:
- Never pitch your product in the hook phase — only explore their problems
- If they share a problem, go DEEPER, don't pivot to your solution yet
- Use their exact words back to them — it proves you're listening
- If they say "we're all set," use Miyagi. If they share a problem, use customer voice or magic wand.
- The hook phase succeeds when THEY are talking more than you
- Watch for the moment they shift from "why are you calling me" to "hmm, tell me more" — that's your signal to transition to close
- During silence, DON'T fill it with word vomit — coach the rep to wait
- If prospect seems distracted, coach the rep to offer a callback
- Suggest active listening phrases when the prospect is sharing freely`,

  close: `## CLOSE PHASE — SECURE THE NEXT STEP

You've identified a problem and they're engaged. Now convert that into a concrete meeting. Do not over-discover. Do not keep asking questions. CLOSE.

### Hard Close:
${CLOSE_STRATEGIES.hardClose}

### Calendar Hold Technique:
${CLOSE_STRATEGIES.dontDropBaby}

### Lock the Meeting:
${CLOSE_STRATEGIES.confirmationProtocol}

### Handling Post-Close Silence:
When you ask for the meeting and they go silent — DO NOT FILL THE SILENCE. The first person to speak after a close attempt loses. Coach the rep: "Wait. Let them think. Silence is working for you right now."

### Human Moments at Close:
${SMALL_TALK_STRATEGIES.humanMoments}

### Phase Rules:
- The close should happen within 3-5 minutes of the call starting — cold calls are SHORT
- Always offer two specific times, never "when works for you?"
- If they say "send me an email" — send the email AND a calendar hold
- After they agree, go IMMEDIATELY to confirmation protocol — name, email, who else to invite, what to tailor
- Do not celebrate or thank them excessively — act like this is normal (because it should be)
- If they push back on a meeting, use the "Don't Drop the Baby" technique — send a placeholder they can move
- After the close silence, if they come back with anything other than "no," you're in. Confirm the meeting.
- Be human. If they crack a joke after agreeing, laugh with them. Then lock the calendar.`,
}

// ==========================================
// COACHING TIPS (Brief, phase-specific)
// ==========================================

const PHASE_COACHING_TIPS: Record<CallPhase, string[]> = {
  intro: [
    'Slow down. You\'re probably speaking 30% too fast right now.',
    'Smile before you speak — they can hear it in your voice.',
    'Use their first name within the first 5 seconds.',
    'Acknowledge the cold call. Pretending it\'s not one kills trust instantly.',
    'Ask for 30 seconds, not a meeting. Micro-commitments first.',
    'Downtone at the end of your sentences. Uptones sound uncertain.',
    'Stand up. Your posture changes your vocal presence.',
    'If this is one of your first dials today, give yourself grace — warm-up dials are always rough.',
    'Pause after saying their name. Let the silence create attention.',
    'Remember: your only job right now is to not get hung up on.',
  ],
  hook: [
    'Lead with their problem, not your product. Problem propositions beat value propositions every time.',
    'Take a sip of water after they finish talking. The pause shows you\'re thinking.',
    'If they say "not interested," don\'t fight it. Use the Miyagi three-step.',
    'Mirror their last few words as a question to get them to elaborate.',
    'They should be talking 60%+ of the time right now. If you\'re talking more, ask a question.',
    'Use their exact words back to them — not your corporate translation of what they said.',
    'If they share a problem, go deeper. Don\'t pivot to your solution yet.',
    'Watch for the shift from resistance to curiosity — that\'s your close signal.',
    'Ask "how does that compare to your experience?" to make them open up without interrogating.',
    'If everything is "fine," try the magic wand question. Everyone has something they\'d improve.',
  ],
  close: [
    'You\'ve earned the right. Ask for the meeting with conviction.',
    'Offer two specific times. "When works for you?" is too open-ended.',
    'If they say "send me an email," send both an email AND a calendar hold.',
    'Go straight into confirmation after they agree — name, email, who else, what to tailor.',
    'Do not over-discover. When the moment is right, close. Questions kill momentum.',
    'Say the close with a downtone. No uptone. No "would that work?" at the end.',
    'If they push back on timing, use the calendar hold technique — send a placeholder they can move.',
    'The goal is 15 minutes on their calendar, not a 45-minute deep dive. Keep the ask small.',
    'Tie the meeting back to THEIR stated problem, not your demo agenda.',
    'After they confirm, stop talking. Don\'t add more. You got the meeting. End the call cleanly.',
  ],
}

export function getPhaseCoachingTip(phase: CallPhase): string {
  const tips = PHASE_COACHING_TIPS[phase]
  return tips[Math.floor(Math.random() * tips.length)]
}

export function getRandomAffirmation(): string {
  const a = ACTIVE_LISTENING_PHRASES.affirmations
  return a[Math.floor(Math.random() * a.length)]
}

export function getRandomReflection(): string {
  const r = ACTIVE_LISTENING_PHRASES.reflections
  return r[Math.floor(Math.random() * r.length)]
}

export function getRandomDeepener(): string {
  const d = ACTIVE_LISTENING_PHRASES.deepeners
  return d[Math.floor(Math.random() * d.length)]
}

// ==========================================
// PERSONA-AWARE COACHING
// ==========================================

/**
 * Build persona-specific coaching for the matched buyer persona.
 */
export function buildPersonaCoaching(persona: BuyerPersona, phase: CallPhase): string {
  const painPointsList = persona.painPoints.map(p => `  - "${p}"`).join('\n')
  const nightmaresList = persona.nightmares.map(n => `  - ${n}`).join('\n')
  const languageList = persona.languagePatterns.map(l => `  - "${l}"`).join('\n')
  const antiList = persona.antiPatterns.map(a => `  - ${a}`).join('\n')

  const phaseTactics: Record<CallPhase, string> = {
    intro: `INTRO TACTICS FOR ${persona.name.toUpperCase()}:
- Reference their specific world: mention engineering teams, technical debt, or whatever matches their domain
- Use language they'd use — not corporate speak. This persona responds to ${persona.languagePatterns[0] || 'direct, specific language'}
- Your opener should signal you understand their level and problems. Generic openers will get you hung up on.
- If they mention anything related to their trigger moment, lean into it HARD`,

    hook: `HOOK TACTICS FOR ${persona.name.toUpperCase()}:
- Lead with their pain points — use THEIR exact language, not yours
- When they share a problem, mirror it back using words from their world
- This persona's trigger moment is: "${persona.triggerMoment}" — if ANYTHING related comes up, that's your opening
- Buying power: ${persona.buyingPower} — size your pitch accordingly
- Go deep on problems, not wide on features. This persona wants to know you understand their specific situation`,

    close: `CLOSE TACTICS FOR ${persona.name.toUpperCase()}:
- Frame the meeting around THEIR specific problem, not a generic demo
- Reference the exact pain points they mentioned — tie the meeting to solving those
- Buying power: ${persona.buyingPower} — match your ask to their authority
- This persona's decision path: understand who else needs to be involved
- Priority level: ${persona.priority} — ${persona.priority === 'primary' ? 'this is the key decision maker, close directly' : persona.priority === 'secondary' ? 'they influence the decision — get them championing internally' : 'they use the product daily — get them excited to advocate up'}`
  }

  return `## MATCHED BUYER PERSONA: ${persona.name}
**Role**: ${persona.role}
**Priority**: ${persona.priority}
**Who they are**: ${persona.description}

### THEIR EXACT PAIN POINTS (Use their language, not yours):
${painPointsList}

### TRIGGER MOMENT (What brought them to this call):
${persona.triggerMoment}

### WHAT KEEPS THEM UP AT NIGHT:
${nightmaresList}

### LANGUAGE THAT RESONATES:
${languageList}

### WHAT TURNS THEM OFF (AVOID):
${antiList}

### ${phaseTactics[phase]}`
}

/**
 * Build persona detection hints when no match has been made yet.
 */
function buildPersonaDetectionHints(personas: BuyerPersona[]): string {
  if (personas.length === 0) return ''

  const hints = personas.map(p =>
    `- **${p.name}** (${p.role}): Listen for ${p.matchRoles.join(', ')} role mentions. Key signals: ${p.painPoints.slice(0, 2).map(pp => `"${pp}"`).join(', ')}`
  ).join('\n')

  return `## PERSONA DETECTION — Listen for these signals:
You haven't identified which buyer persona this prospect matches yet. As they talk, listen for:
${hints}

When you detect a match, adjust your language and pain points to match that persona.`
}

// ==========================================
// EXPORTED FUNCTIONS
// ==========================================

/**
 * Returns the full strategy text for a given call phase.
 */
export function getPhaseStrategy(phase: CallPhase): string {
  return PHASE_STRATEGIES[phase]
}

/**
 * Builds the complete cold calling system prompt, incorporating
 * phase-specific strategy, conversation context, company docs,
 * custom instructions, reasoning framework, QA dimensions,
 * anti-patterns, and variability hints.
 */
export function buildColdCallingPrompt(
  phase: CallPhase,
  context: ConversationContext | null,
  companyDocs: string,
  customInstructions: string,
  personas: BuyerPersona[] = []
): string {
  const sections: string[] = []

  // --- Identity and role ---
  sections.push(`## ROLE
You are PitchPilot AI, a real-time cold calling coach embedded in a sales rep's workflow. You are NOT the one making the call — you are whispering coaching and suggested scripts into the rep's ear as the call happens live. Every suggestion must be something they can say OUT LOUD, RIGHT NOW, in natural conversation.`)

  // --- Reasoning framework ---
  sections.push(COLD_CALLING_REASONING)

  // --- Phase-specific strategy ---
  sections.push(getPhaseStrategy(phase))

  // --- Persona coaching ---
  const matchedPersona = context?.prospect?.matchedPersona
  if (matchedPersona && personas.length > 0) {
    const persona = personas.find(p => p.id === matchedPersona.personaId)
    if (persona) {
      sections.push(buildPersonaCoaching(persona, phase))
    }
  } else if (personas.length > 0) {
    sections.push(buildPersonaDetectionHints(personas))
  }

  // --- Anti-patterns ---
  sections.push(COLD_CALLING_ANTI_PATTERNS)

  // --- QA self-check ---
  sections.push(COLD_CALLING_QA)

  // --- Variability hints ---
  sections.push(`## RESPONSE VARIABILITY
To keep coaching fresh and natural, consider using these patterns (only if they fit organically):
- Cold opener hook: "${getRandomColdOpener()}"
- Evidence transition: "${getRandomEvidenceTransition()}"
- Closing pivot: "${getRandomClosingPivot()}"
- Coaching tip: "${getPhaseCoachingTip(phase)}"
Do NOT force these. Use them only when they fit the moment.`)

  // --- Full-spectrum coaching ---
  sections.push(`## FULL-SPECTRUM COACHING — EVERY MOMENT MATTERS
You don't just coach the big moments (objections, closes). You coach EVERYTHING:
- Small talk: If weather, sports, or casual topics come up, help the rep engage naturally then bridge to business
- Rapport: Suggest mirroring their energy level. If they're casual, be casual. If formal, match it.
- Transitions: Coach smooth bridges between small talk → business, opener → problem prop, discovery → close
- Awkward silences: After a question or close attempt, coach "Wait. Don't fill the silence."
- Distracted prospect: Coach "Offer to call back — it turns a cold call into a warm callback"
- Rude prospect: Coach grace and a graceful exit. Never combative.
- Gatekeepers: Coach peer-like casual approach, never "is [Name] available?"
- Human moments: Sneezes, background noise, jokes — acknowledge them. Be a person.
- Active listening: Suggest specific reflection phrases using THEIR words, not generic filler
- When to laugh: If they make a joke, let the laugh breathe. Don't immediately pivot back to selling.
- When to shut up: If they're sharing freely, the best coaching is "Keep listening. Don't interrupt."`)

  // --- Company knowledge base ---
  if (companyDocs && companyDocs.trim().length > 0) {
    sections.push(`## COMPANY KNOWLEDGE BASE
Use the following product/company information to make your coaching specific and grounded. Reference real features, real metrics, and real customer stories when they exist.

${companyDocs}`)
  }

  // --- Custom instructions ---
  if (customInstructions && customInstructions.trim().length > 0) {
    sections.push(`## CUSTOM INSTRUCTIONS FROM REP
The rep has provided these custom instructions. Respect them — they know their territory.

${customInstructions}`)
  }

  // --- Conversation context ---
  if (context) {
    const contextParts: string[] = []

    contextParts.push(`Current Phase: ${context.currentPhase}`)
    contextParts.push(`Call Duration: ${Math.round((Date.now() - context.startedAt) / 1000)}s`)

    if (context.prospect) {
      const p = context.prospect
      if (p.name) contextParts.push(`Prospect Name: ${p.name}`)
      if (p.company) contextParts.push(`Prospect Company: ${p.company}`)
      if (p.role) contextParts.push(`Prospect Role: ${p.role}`)
      if (p.industry) contextParts.push(`Industry: ${p.industry}`)
      if (p.sentiment !== 'unknown') contextParts.push(`Sentiment: ${p.sentiment}`)
      if (p.problemsMentioned.length > 0)
        contextParts.push(`Problems Mentioned: ${p.problemsMentioned.join(', ')}`)
      if (p.objectionsRaised.length > 0)
        contextParts.push(`Objections Raised: ${p.objectionsRaised.join(', ')}`)
      if (p.currentSolutions.length > 0)
        contextParts.push(`Current Solutions: ${p.currentSolutions.join(', ')}`)
      if (p.buyingSignals.length > 0)
        contextParts.push(`Buying Signals: ${p.buyingSignals.join(', ')}`)
    }

    if (context.strategiesUsed.length > 0) {
      contextParts.push(`Strategies Already Used: ${context.strategiesUsed.join(', ')}`)
    }

    if (context.repCoveredPoints.length > 0) {
      contextParts.push(`Points Already Covered: ${context.repCoveredPoints.join(', ')}`)
    }

    // Include recent transcript for immediate context
    if (context.transcript.length > 0) {
      const recentLines = context.transcript.slice(-8)
      const transcriptText = recentLines
        .map((seg) => `[${seg.speaker.toUpperCase()}]: ${seg.text}`)
        .join('\n')
      contextParts.push(`\nRecent Transcript:\n${transcriptText}`)
    }

    sections.push(`## LIVE CONVERSATION CONTEXT\n${contextParts.join('\n')}`)
  }

  // --- Output instructions ---
  sections.push(`## OUTPUT RULES
1. Suggest what the rep should say NEXT — in their voice, not yours
2. Keep suggestions to 1-3 sentences. Cold calls demand brevity.
3. If the prospect is talking, suggest what to listen for, not what to say
4. If you detect a phase transition moment, flag it: "[TRANSITION: Move to HOOK]" or "[TRANSITION: Move to CLOSE]"
5. If the prospect gives a hard no, coach the rep to exit gracefully — not every call converts
6. Never suggest anything that sounds scripted, corporate, or salesy
7. Use the prospect's name and specific details from the conversation
8. Match the energy of the conversation — if they're casual, be casual; if they're formal, be professional`)

  return sections.join('\n\n')
}
