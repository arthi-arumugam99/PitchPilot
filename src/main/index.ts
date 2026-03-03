import { app, BrowserWindow, ipcMain, globalShortcut, dialog, desktopCapturer, screen as electronScreen } from 'electron'
import { join, extname, basename } from 'path'
import { readFileSync, readdirSync, statSync } from 'fs'
import { ensureDataDir, readJSON, writeJSON } from './store'
import { getCards, saveCard, deleteCard, voteCard } from './cards'
import { getRecaps, getRecap, saveRecap } from './recaps'
import { getKnowledge, saveKnowledgeDoc, deleteKnowledgeDoc } from './knowledge'
import { getCompanies, getCompany, saveCompany, deleteCompany, getActiveCompany, ensureDefaultCompany } from './companies'
import { initDeepgram, startTranscription, sendAudioChunk, stopTranscription } from './transcription'
import { initClaude, analyzeTranscript, streamAnswer, streamScreenAnalysis, resetTriggerState } from './intent'
import { createContext, updateContext, recordCard, matchPersona } from './context'
import { buildPrepPrompt } from './prep'
import type { AppSettings, TranscriptSegment, CallSession, CallRecap, ConversationContext, BuyerPersona, PrepLaunchPayload } from '../shared/types'

// File extensions we can read as text for knowledge base
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.csv', '.log', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg',
  '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.rb', '.php',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.scala', '.r',
  '.sql', '.sh', '.bash', '.ps1', '.bat', '.cmd',
  '.html', '.css', '.scss', '.less', '.vue', '.svelte',
  '.dockerfile', '.makefile', '.gitignore', '.dockerignore',
  '.env', '.env.example', '.eslintrc', '.prettierrc', '.babelrc',
  '.graphql', '.gql', '.proto', '.prisma',
])

// Directories to always skip when scanning repos
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', '__pycache__', '.next', '.nuxt',
  'dist', 'build', 'out', '.cache', '.parcel-cache', 'coverage',
  '.idea', '.vscode', 'vendor', 'target', 'bin', 'obj',
  '.terraform', '.serverless', 'venv', '.venv', 'env',
])

// Max file size to read (500KB - skip huge generated files)
const MAX_FILE_SIZE = 500_000

function readFileForKB(filepath: string): { name: string; content: string; path: string } | null {
  try {
    const stat = statSync(filepath)
    if (stat.size > MAX_FILE_SIZE) return null
    if (stat.size === 0) return null

    const ext = extname(filepath).toLowerCase()
    const name = basename(filepath)

    // Skip binary files by extension
    if (!TEXT_EXTENSIONS.has(ext) && ext !== '') {
      if (ext !== '') return null
    }

    const content = readFileSync(filepath, 'utf-8')
    if (content.includes('\0')) return null

    return { name, content, path: filepath }
  } catch {
    return null
  }
}

function scanFolder(folderPath: string, maxFiles = 200): { name: string; content: string; path: string }[] {
  const results: { name: string; content: string; path: string }[] = []

  function walk(dir: string, depth: number): void {
    if (depth > 8 || results.length >= maxFiles) return

    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break
      if (SKIP_DIRS.has(entry)) continue
      if (entry.startsWith('.') && entry !== '.env.example') continue

      const fullPath = join(dir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory()) {
          walk(fullPath, depth + 1)
        } else if (stat.isFile()) {
          const file = readFileForKB(fullPath)
          if (file) results.push(file)
        }
      } catch {
        continue
      }
    }
  }

  walk(folderPath, 0)
  return results
}

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let currentSession: CallSession | null = null
let liveContext: ConversationContext | null = null
let livePersonas: BuyerPersona[] = []
let analysisInterval: ReturnType<typeof setInterval> | null = null
let phaseCheckInterval: ReturnType<typeof setInterval> | null = null

const DEFAULT_SETTINGS: AppSettings = {
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
}

function getSettings(): AppSettings {
  return readJSON<AppSettings>('settings.json', DEFAULT_SETTINGS)
}

/** Get the active company ID, ensuring a default exists. */
function getActiveCompanyId(): string {
  const settings = getSettings()
  if (settings.activeCompanyId) return settings.activeCompanyId
  // No active company — ensure default and set it
  const defaultCompany = ensureDefaultCompany()
  writeJSON('settings.json', { ...settings, activeCompanyId: defaultCompany.id })
  return defaultCompany.id
}

/** Get custom instructions for the active company. */
function getActiveCustomInstructions(): string {
  const companyId = getActiveCompanyId()
  const company = getCompany(companyId)
  return company?.customInstructions || ''
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'PitchPilot AI',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createOverlayWindow(): void {
  const display = electronScreen.getPrimaryDisplay()
  const workArea = display.workArea
  overlayWindow = new BrowserWindow({
    width: workArea.width,
    height: workArea.height,
    x: workArea.x,
    y: workArea.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    focusable: true,
    type: 'toolbar',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  overlayWindow.setContentProtection(true)
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

  if (process.env.ELECTRON_RENDERER_URL) {
    overlayWindow.loadURL(process.env.ELECTRON_RENDERER_URL + '#/overlay')
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/overlay' })
  }

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
}

/** Send to both main and overlay windows. */
function broadcast(channel: string, ...args: any[]): void {
  mainWindow?.webContents.send(channel, ...args)
  overlayWindow?.webContents.send(channel, ...args)
}

function registerIPC(): void {
  // ======== Settings ========
  ipcMain.handle('get-settings', () => getSettings())
  ipcMain.handle('save-settings', (_, settings: AppSettings) => {
    writeJSON('settings.json', settings)
    if (settings.deepgramApiKey) initDeepgram(settings.deepgramApiKey)
    if (settings.anthropicApiKey) initClaude(settings.anthropicApiKey)
    return true
  })

  // ======== Company Management ========
  ipcMain.handle('get-companies', () => getCompanies())
  ipcMain.handle('save-company', (_, profile) => saveCompany(profile))
  ipcMain.handle('delete-company', (_, id: string) => { deleteCompany(id); return true })
  ipcMain.handle('switch-company', (_, companyId: string) => {
    const settings = getSettings()
    writeJSON('settings.json', { ...settings, activeCompanyId: companyId })
    return true
  })
  ipcMain.handle('get-active-company', () => {
    const settings = getSettings()
    return getActiveCompany(settings)
  })

  // ======== Audio Devices ========
  ipcMain.handle('get-audio-devices', async () => [])

  // ======== Call Control ========
  ipcMain.handle('start-call', () => {
    const settings = getSettings()
    if (!settings.deepgramApiKey || !settings.anthropicApiKey) {
      return { error: 'API keys not configured. Go to Settings.' }
    }

    initDeepgram(settings.deepgramApiKey)
    initClaude(settings.anthropicApiKey)
    resetTriggerState()

    const companyId = getActiveCompanyId()
    const callId = crypto.randomUUID()

    // Initialize conversation context
    liveContext = createContext(callId, companyId)

    // Load buyer personas from company profile
    const companyProfile = getCompany(companyId)
    livePersonas = companyProfile?.personas || []

    currentSession = {
      id: callId,
      companyId,
      startedAt: new Date().toISOString(),
      transcript: [],
      triggers: [],
      status: 'active',
      context: liveContext,
    }

    startTranscription((segment) => {
      if (!currentSession || !liveContext) return
      currentSession.transcript.push(segment)

      // Only update context with final segments to avoid false positives from interim text
      if (!segment.isFinal) {
        broadcast('transcript-update', segment)
        return
      }

      // Update conversation context with new segment
      updateContext(liveContext, segment)

      // Run persona matching if we have personas and no match yet
      if (livePersonas.length > 0 && !liveContext.prospect.matchedPersona && segment.speaker === 'prospect') {
        const transcriptText = liveContext.transcript.map(s => s.text).join(' ')
        const match = matchPersona(liveContext.prospect.role, transcriptText, livePersonas)
        if (match) {
          liveContext.prospect.matchedPersona = match
          broadcast('persona-match', match)
        }
      }

      broadcast('transcript-update', segment)
    })

    // Analyze transcript every 5 seconds with Claude
    analysisInterval = setInterval(async () => {
      if (!currentSession || !liveContext) return
      if (liveContext.transcript.length === 0) return

      const triggers = await analyzeTranscript(currentSession.companyId, liveContext, livePersonas)

      for (const trigger of triggers) {
        currentSession.triggers.push(trigger)
        broadcast('trigger-detected', trigger)

        // Record trigger as a card in context
        recordCard(liveContext, {
          id: trigger.id,
          question: trigger.sourceText,
          answer: trigger.suggestedResponse,
          type: 'trigger',
          timestamp: trigger.timestamp,
        })
      }
    }, 5000)

    // Check for phase changes every 3 seconds
    let lastPhase = liveContext.currentPhase
    phaseCheckInterval = setInterval(() => {
      if (!liveContext) return
      if (liveContext.currentPhase !== lastPhase) {
        lastPhase = liveContext.currentPhase
        broadcast('phase-change', { phase: lastPhase, timestamp: Date.now() })
      }
    }, 3000)

    // Show overlay
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow()
    }
    overlayWindow?.show()

    broadcast('call-status', 'active')
    // Broadcast initial phase so Dashboard shows INTRO pill immediately
    broadcast('phase-change', { phase: 'intro', timestamp: Date.now() })

    return { sessionId: currentSession.id }
  })

  ipcMain.handle('end-call', async () => {
    if (analysisInterval) {
      clearInterval(analysisInterval)
      analysisInterval = null
    }
    if (phaseCheckInterval) {
      clearInterval(phaseCheckInterval)
      phaseCheckInterval = null
    }
    stopTranscription()

    if (currentSession) {
      currentSession.endedAt = new Date().toISOString()
      currentSession.status = 'ended'

      // Capture session for background recap generation
      const endedSession = currentSession
      const result = { sessionId: endedSession.id, recapId: undefined as string | undefined }

      // Clear state immediately so UI can transition
      currentSession = null
      liveContext = null
      livePersonas = []
      broadcast('call-status', 'ended')

      // Generate recap in background (don't block UI)
      generateRecap(endedSession).then(recap => {
        if (recap) saveRecap(endedSession.companyId, recap)
      }).catch(() => {
        // Recap generation failed silently — call data still saved in session
      })

      return result
    }
    return null
  })

  // Send audio data from renderer to main for Deepgram
  ipcMain.on('audio-data', (_, buffer: ArrayBuffer) => {
    sendAudioChunk(Buffer.from(buffer))
  })

  // ======== Battle Cards (company-scoped) ========
  ipcMain.handle('get-cards', () => getCards(getActiveCompanyId()))
  ipcMain.handle('save-card', (_, card) => saveCard(getActiveCompanyId(), card))
  ipcMain.handle('delete-card', (_, id) => { deleteCard(getActiveCompanyId(), id); return true })
  ipcMain.handle('vote-card', (_, id, vote) => { voteCard(getActiveCompanyId(), id, vote); return true })

  // ======== Recaps (company-scoped) ========
  ipcMain.handle('get-recaps', () => getRecaps(getActiveCompanyId()))
  ipcMain.handle('get-recap', (_, id) => getRecap(getActiveCompanyId(), id))

  // ======== Knowledge Base (company-scoped) ========
  ipcMain.handle('get-knowledge', () => getKnowledge(getActiveCompanyId()))
  ipcMain.handle('save-knowledge', (_, doc) => saveKnowledgeDoc(getActiveCompanyId(), doc))
  ipcMain.handle('delete-knowledge', (_, id: string) => { deleteKnowledgeDoc(getActiveCompanyId(), id); return true })

  // ======== File Upload & Repo Import ========
  ipcMain.handle('upload-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documents', extensions: ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg'] },
        { name: 'Code', extensions: ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'rb', 'php', 'c', 'cpp', 'h', 'cs', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 'bash', 'ps1', 'html', 'css', 'scss', 'less', 'vue', 'svelte'] },
        { name: 'Config', extensions: ['env', 'dockerfile', 'makefile', 'gitignore', 'dockerignore', 'eslintrc', 'prettierrc', 'babelrc'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled || result.filePaths.length === 0) return []

    return result.filePaths.map(filepath => readFileForKB(filepath)).filter(Boolean)
  })

  ipcMain.handle('import-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select folder or repo to import',
    })
    if (result.canceled || result.filePaths.length === 0) return []

    const folderPath = result.filePaths[0]
    return scanFolder(folderPath)
  })

  // ======== AI Help (context-aware streaming) ========
  ipcMain.handle('ai-help', async (_, question?: string) => {
    // Use session's company ID during active calls to prevent mismatch if company is switched
    const companyId = currentSession ? currentSession.companyId : getActiveCompanyId()
    const customInstructions = getActiveCustomInstructions()

    return new Promise<string>((resolve) => {
      let cardId: string | undefined

      streamAnswer(
        companyId,
        liveContext,
        customInstructions,
        question || undefined,
        (chunk) => {
          broadcast('answer-chunk', chunk)
        },
        (fullText) => {
          // Record this AI help card in the conversation context
          if (liveContext) {
            cardId = `card-${Date.now()}`
            recordCard(liveContext, {
              id: cardId,
              question: question || 'AI Help (auto)',
              answer: fullText,
              type: question ? 'ai-help' : 'trigger',
              timestamp: Date.now(),
            })
          }
          resolve(fullText)
        },
        livePersonas
      )
    })
  })

  // Quick Ask - KB-only question answering (no call required)
  ipcMain.handle('quick-ask', async (_, question: string) => {
    const companyId = getActiveCompanyId()

    return new Promise<string>((resolve) => {
      streamAnswer(
        companyId,
        null, // no live context
        '',   // no custom instructions for quick ask
        question,
        (chunk) => {
          broadcast('answer-chunk', chunk)
        },
        (fullText) => {
          resolve(fullText)
        }
      )
    })
  })

  // ======== Pre-Call Prep Chat ========
  ipcMain.handle('prep-ask', async (_, question: string, chatHistory: { role: string; text: string }[]) => {
    if (typeof question !== 'string' || question.length > 2000) {
      return 'Question too long. Please keep it under 2000 characters.'
    }

    const companyId = getActiveCompanyId()
    const { systemPrompt, userMessage } = buildPrepPrompt(companyId, question, chatHistory || [])

    return new Promise<string>((resolve) => {
      streamAnswer(
        companyId,
        null,
        '',
        userMessage,
        (chunk) => {
          mainWindow?.webContents.send('prep-chunk', chunk)
        },
        (fullText) => {
          resolve(fullText)
        },
        [],
        systemPrompt // pass custom system prompt override
      )
    })
  })

  // ======== Launch Call from Prep ========
  ipcMain.handle('launch-call-from-prep', async (_, payload: PrepLaunchPayload) => {
    if (currentSession) {
      return { success: false, error: 'A call is already active. End the current call first.' }
    }

    const settings = getSettings()
    if (!settings.deepgramApiKey || !settings.anthropicApiKey) {
      return { success: false, error: 'API keys not configured. Go to Settings.' }
    }

    initDeepgram(settings.deepgramApiKey)
    initClaude(settings.anthropicApiKey)
    resetTriggerState()

    const companyId = getActiveCompanyId()
    const callId = crypto.randomUUID()

    // Initialize conversation context
    liveContext = createContext(callId, companyId)

    // Pre-populate context with prep data
    if (payload.prospectName) liveContext.prospect.name = payload.prospectName
    if (payload.prospectCompany) liveContext.prospect.company = payload.prospectCompany
    if (payload.prospectRole) liveContext.prospect.role = payload.prospectRole
    if (payload.prospectIndustry) liveContext.prospect.industry = payload.prospectIndustry

    // Load buyer personas
    const companyProfile = getCompany(companyId)
    livePersonas = companyProfile?.personas || []

    // If prep identified a persona, set the match
    if (payload.matchedPersonaId) {
      const matchedP = livePersonas.find(p => p.id === payload.matchedPersonaId)
      if (matchedP) {
        liveContext.prospect.matchedPersona = {
          personaId: matchedP.id,
          personaName: matchedP.name,
          confidence: 'medium',
        }
      }
    }

    currentSession = {
      id: callId,
      companyId,
      startedAt: new Date().toISOString(),
      transcript: [],
      triggers: [],
      status: 'active',
      context: liveContext,
    }

    startTranscription((segment) => {
      if (!currentSession || !liveContext) return
      currentSession.transcript.push(segment)

      if (!segment.isFinal) {
        broadcast('transcript-update', segment)
        return
      }

      updateContext(liveContext, segment)

      if (livePersonas.length > 0 && !liveContext.prospect.matchedPersona && segment.speaker === 'prospect') {
        const transcriptText = liveContext.transcript.map(s => s.text).join(' ')
        const match = matchPersona(liveContext.prospect.role, transcriptText, livePersonas)
        if (match) {
          liveContext.prospect.matchedPersona = match
          broadcast('persona-match', match)
        }
      }

      broadcast('transcript-update', segment)
    })

    // Analyze transcript periodically
    analysisInterval = setInterval(async () => {
      if (!currentSession || !liveContext) return
      if (liveContext.transcript.length === 0) return

      const triggers = await analyzeTranscript(currentSession.companyId, liveContext, livePersonas)
      for (const trigger of triggers) {
        currentSession.triggers.push(trigger)
        broadcast('trigger-detected', trigger)
        recordCard(liveContext, {
          id: trigger.id,
          question: trigger.sourceText,
          answer: trigger.suggestedResponse,
          type: 'trigger',
          timestamp: trigger.timestamp,
        })
      }
    }, 5000)

    // Phase detection
    let lastPhase = liveContext.currentPhase
    phaseCheckInterval = setInterval(() => {
      if (!liveContext) return
      if (liveContext.currentPhase !== lastPhase) {
        lastPhase = liveContext.currentPhase
        broadcast('phase-change', { phase: lastPhase, timestamp: Date.now() })
      }
    }, 3000)

    // Show overlay
    let overlayNewlyCreated = false
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow()
      overlayNewlyCreated = true
    }
    overlayWindow?.show()

    broadcast('call-status', 'active')
    broadcast('phase-change', { phase: 'intro', timestamp: Date.now() })

    // Broadcast prep context — delay for newly created overlay so its renderer has time to mount listeners
    const prepPayload = {
      ...payload,
      briefing: payload.briefing ? { ...payload.briefing, raw: '' } : null,
    }
    if (overlayNewlyCreated && overlayWindow) {
      overlayWindow.webContents.once('did-finish-load', () => {
        broadcast('prep-context', prepPayload)
      })
    } else {
      broadcast('prep-context', prepPayload)
    }

    return { success: true, sessionId: currentSession.id }
  })

  // ======== Screen Analysis (context-aware) ========
  ipcMain.handle('analyze-screen', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      })
      if (sources.length === 0) return 'No screen found to capture.'

      const screenshot = sources[0].thumbnail.toPNG()
      const base64 = screenshot.toString('base64')
      const companyId = getActiveCompanyId()

      return new Promise<string>((resolve) => {
        streamScreenAnalysis(
          companyId,
          liveContext,
          base64,
          (chunk) => {
            broadcast('screen-chunk', chunk)
          },
          (fullText) => {
            // Record screen analysis in context
            if (liveContext) {
              recordCard(liveContext, {
                id: `screen-${Date.now()}`,
                question: 'Screen Analysis',
                answer: fullText,
                type: 'screen',
                timestamp: Date.now(),
              })
            }
            resolve(fullText)
          }
        )
      })
    } catch (err) {
      console.error('[Screen] Capture error:', err)
      return 'Error capturing screen.'
    }
  })

  // ======== Overlay ========
  ipcMain.handle('toggle-overlay', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (overlayWindow.isVisible()) overlayWindow.hide()
      else overlayWindow.show()
    }
    return true
  })

  ipcMain.handle('minimize-main', () => {
    mainWindow?.minimize()
    return true
  })

  // Mic mute toggle — broadcasts to all windows so overlay and dashboard stay in sync
  let micMuted = false
  ipcMain.handle('toggle-mic-mute', () => {
    micMuted = !micMuted
    broadcast('mic-mute-changed', micMuted)
    return micMuted
  })
}

async function generateRecap(session: CallSession): Promise<CallRecap | null> {
  const settings = getSettings()
  if (!settings.anthropicApiKey) return null

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: settings.anthropicApiKey })

    const transcriptText = session.transcript
      .filter(s => s.isFinal)
      .map(s => `[${s.speaker}]: ${s.text}`)
      .join('\n')

    if (!transcriptText.trim()) return null

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are PitchPilot AI — an elite cold calling analyst. Generate a structured post-call recap with coaching insights.

Analyze this cold call like a top sales manager reviewing a rep's performance. Identify:
- What went well (techniques that worked, rapport moments, good transitions)
- What was missed (buying signals ignored, objections not handled, missed closes)
- Specific next steps to advance the deal
- Prospect intelligence gathered during the call

Respond with JSON only:
{"summary": "2-3 sentence executive summary", "keyTopics": ["topic1"], "objectionsRaised": ["objection and how it was handled"], "commitmentsMade": ["agreements made"], "nextSteps": ["specific actionable next steps"]}`,
      messages: [{ role: 'user', content: transcriptText }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null
    const jsonText = content.text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const parsed = JSON.parse(jsonText ? jsonText[1].trim() : content.text.trim())

    const startTime = new Date(session.startedAt).getTime()
    const endTime = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()

    return {
      id: crypto.randomUUID(),
      sessionId: session.id,
      companyId: session.companyId,
      date: session.startedAt,
      duration: Math.round((endTime - startTime) / 1000),
      summary: parsed.summary,
      keyTopics: parsed.keyTopics || [],
      objectionsRaised: parsed.objectionsRaised || [],
      commitmentsMade: parsed.commitmentsMade || [],
      nextSteps: parsed.nextSteps || [],
      transcript: session.transcript.filter(s => s.isFinal),
      prospectIntel: session.context.prospect,
    }
  } catch (err) {
    console.error('[Recap] Generation error:', err)
    return null
  }
}

app.whenReady().then(() => {
  ensureDataDir()

  // Ensure at least one company exists
  ensureDefaultCompany()

  // Init APIs if keys exist
  const settings = getSettings()
  if (settings.deepgramApiKey) initDeepgram(settings.deepgramApiKey)
  if (settings.anthropicApiKey) initClaude(settings.anthropicApiKey)

  registerIPC()
  createMainWindow()

  // Global shortcut to toggle overlay
  globalShortcut.register('Ctrl+Shift+P', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (overlayWindow.isVisible()) overlayWindow.hide()
      else overlayWindow.show()
    }
  })

  // Ctrl+Shift+A: Focus overlay ask input
  globalShortcut.register('Ctrl+Shift+A', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.show()
      overlayWindow.webContents.send('focus-ask-input')
    }
  })

  // Ctrl+Shift+S: Quick screen analysis
  globalShortcut.register('Ctrl+Shift+S', () => {
    broadcast('trigger-screen-analysis')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (analysisInterval) clearInterval(analysisInterval)
  if (phaseCheckInterval) clearInterval(phaseCheckInterval)
  stopTranscription()
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})
