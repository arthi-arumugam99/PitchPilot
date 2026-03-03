import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import type { TranscriptSegment } from '../shared/types'

let deepgramClient: ReturnType<typeof createClient> | null = null
let liveConnection: any = null
let segmentCounter = 0

type TranscriptCallback = (segment: TranscriptSegment) => void

export function initDeepgram(apiKey: string): void {
  deepgramClient = createClient(apiKey)
}

export function startTranscription(onSegment: TranscriptCallback): void {
  if (!deepgramClient) throw new Error('Deepgram not initialized. Set API key in settings.')

  liveConnection = deepgramClient.listen.live({
    model: 'nova-2',
    language: 'en',
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
    diarize: true,
    punctuate: true,
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
  })

  liveConnection.on(LiveTranscriptionEvents.Open, () => {
    console.log('[Deepgram] Connection opened')
  })

  liveConnection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    const transcript = data.channel?.alternatives?.[0]
    if (!transcript?.transcript) return

    const words = transcript.words || []
    // Use diarization speaker info if available
    const speakerIdx = words[0]?.speaker ?? 0

    const segment: TranscriptSegment = {
      id: `seg-${++segmentCounter}`,
      speaker: speakerIdx === 0 ? 'rep' : 'prospect',
      text: transcript.transcript,
      timestamp: Date.now(),
      isFinal: data.is_final ?? false,
    }

    onSegment(segment)
  })

  liveConnection.on(LiveTranscriptionEvents.Error, (err: any) => {
    console.error('[Deepgram] Error:', err)
  })

  liveConnection.on(LiveTranscriptionEvents.Close, () => {
    console.log('[Deepgram] Connection closed')
  })
}

export function sendAudioChunk(chunk: Buffer): void {
  if (liveConnection) {
    liveConnection.send(chunk)
  }
}

export function stopTranscription(): void {
  if (liveConnection) {
    liveConnection.requestClose()
    liveConnection = null
  }
  segmentCounter = 0
}
