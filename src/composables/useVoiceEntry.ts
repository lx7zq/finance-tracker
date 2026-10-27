import { computed, onScopeDispose, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { useSpeechInput } from '@/composables/useSpeechInput'
import { useSettingsStore } from '@/stores/settings'
import { callGeminiParse, GeminiParseError, type GeminiParseInput } from '@/utils/gemini'
import { INCOME_CATEGORIES, type VoiceDraft } from '@/types'
import { isVoiceCaptureSupported, parseVoiceEntry } from '@/utils/voice'

export type VoiceEntryPhase = 'idle' | 'listening' | 'processing' | 'confirm' | 'error'

const NO_AMOUNT_MESSAGE = 'ไม่เข้าใจยอดเงิน ลองพูดใหม่หรือพิมพ์เอง'
const NO_KEY_AUDIO_MESSAGE = 'ต้องตั้งค่า Gemini API key ก่อนใช้เสียงบนเบราว์เซอร์นี้'
const MIC_DENIED_MESSAGE = 'ไม่ได้รับอนุญาตให้ใช้ไมค์'
const NO_AUDIO_MESSAGE = 'ไม่ได้ยินเสียง'

const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      resolve(comma === -1 ? '' : result.slice(comma + 1))
    }
    reader.onerror = () => reject(new Error('audio-read-failed'))
    reader.readAsDataURL(blob)
  })
}

export function useVoiceEntry() {
  const settings = useSettingsStore()

  const phase = ref<VoiceEntryPhase>('idle')
  const draft = ref<VoiceDraft | null>(null)
  const errorMessage = ref('')
  const pendingTranscript = ref('')

  const supported: ComputedRef<boolean> = computed(() => isVoiceCaptureSupported())
  const hasKey = computed(() => settings.hasKey)

  let parsing = false
  let starting = false
  let startToken = 0
  let stream: MediaStream | null = null
  let tracks: MediaStreamTrack[] = []
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []

  const speech = useSpeechInput({
    onFinal: (text) => {
      pendingTranscript.value = text
    },
  })

  // จบการพูด (listening → false) → มี transcript → parse, ไม่มี → กลับ idle (หยุดก่อนพูด)
  watch(speech.listening, (listening) => {
    if (listening) return
    if (speech.errorMessage.value) {
      phase.value = 'error'
      errorMessage.value = speech.errorMessage.value
      return
    }
    if (phase.value !== 'listening') return
    if (pendingTranscript.value) {
      void parse({ text: pendingTranscript.value })
    } else {
      reset()
    }
  })

  function releaseAudio() {
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      try {
        recorder.stop()
      } catch {
        // ปล่อยผ่าน — จุดประสงค์คือเลิกใช้ไมค์
      }
    }
    recorder = null
    tracks.forEach((t) => t.stop())
    tracks = []
    stream = null
    chunks = []
  }

  function reset() {
    phase.value = 'idle'
    draft.value = null
    errorMessage.value = ''
    pendingTranscript.value = ''
    speech.interim.value = ''
  }

  function cancel() {
    startToken++
    speech.stop()
    releaseAudio()
    reset()
  }

  function draftFromKeywordFallback(): boolean {
    if (!pendingTranscript.value) return false
    const parsed = parseVoiceEntry(pendingTranscript.value)
    if (parsed.amount === null) return false
    draft.value = {
      type: INCOME_CATEGORIES.includes(parsed.category) ? 'income' : 'expense',
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
    }
    phase.value = 'confirm'
    return true
  }

  async function parse(input: GeminiParseInput) {
    if (parsing) return
    parsing = true
    phase.value = 'processing'
    try {
      if (settings.effectiveApiKey) {
        draft.value = await callGeminiParse(input, settings.effectiveApiKey)
        phase.value = 'confirm'
        return
      }
      if (!draftFromKeywordFallback()) {
        phase.value = 'error'
        errorMessage.value = pendingTranscript.value ? NO_AMOUNT_MESSAGE : NO_KEY_AUDIO_MESSAGE
      }
    } catch (err) {
      if (!draftFromKeywordFallback()) {
        phase.value = 'error'
        errorMessage.value = pendingTranscript.value
          ? NO_AMOUNT_MESSAGE
          : err instanceof GeminiParseError
            ? err.message
            : NO_KEY_AUDIO_MESSAGE
      }
    } finally {
      parsing = false
    }
  }

  async function startAudioRecording() {
    const token = ++startToken
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      tracks = stream.getTracks()
      if (token !== startToken) {
        // ผู้ใช้ปิด/ยกเลิกระหว่างรออนุญาต — ปิดไมค์ ไม่เริ่มอัด
        tracks.forEach((t) => t.stop())
        tracks = []
        stream = null
        return
      }
      const mimeType = AUDIO_MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunks = []
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      recorder.onstop = async () => {
        const mimeTypeUsed = recorder?.mimeType || mimeType || 'audio/webm'
        const captured = [...chunks]
        releaseAudio()
        if (!settings.hasKey) {
          phase.value = 'error'
          errorMessage.value = NO_KEY_AUDIO_MESSAGE
          return
        }
        const blob = new Blob(captured, { type: mimeTypeUsed })
        if (blob.size === 0) {
          phase.value = 'error'
          errorMessage.value = NO_AUDIO_MESSAGE
          return
        }
        phase.value = 'processing'
        try {
          const base64 = await blobToBase64(blob)
          await parse({ audio: { base64, mimeType: mimeTypeUsed } })
        } catch (err) {
          if (err instanceof GeminiParseError) {
            phase.value = 'error'
            errorMessage.value = err.message
          } else {
            phase.value = 'error'
            errorMessage.value = NO_AUDIO_MESSAGE
          }
        }
      }
      recorder.start()
      phase.value = 'listening'
    } catch {
      releaseAudio()
      phase.value = 'error'
      errorMessage.value = MIC_DENIED_MESSAGE
    }
  }

  async function start() {
    if (starting || !supported.value) return
    if (phase.value === 'listening' || phase.value === 'processing' || phase.value === 'confirm') {
      return
    }
    starting = true
    try {
      reset()

      if (speech.supported.value) {
        pendingTranscript.value = ''
        speech.start()
        if (speech.listening.value) {
          phase.value = 'listening'
        } else {
          phase.value = 'error'
          errorMessage.value = speech.errorMessage.value || MIC_DENIED_MESSAGE
        }
        return
      }
      await startAudioRecording()
    } finally {
      starting = false
    }
  }

  function stopCapture() {
    if (phase.value !== 'listening') return
    if (speech.listening.value) {
      speech.stop()
      return
    }
    recorder?.stop()
  }

  onScopeDispose(cancel)

  return {
    supported,
    phase: phase as Ref<VoiceEntryPhase>,
    interim: speech.interim,
    draft,
    errorMessage,
    hasKey,
    start,
    stopCapture,
    cancel,
    reset,
  }
}
