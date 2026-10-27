import { computed, onScopeDispose, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechInputEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechResultLike {
  isFinal: boolean
  0?: { transcript?: string }
}

interface SpeechInputEvent {
  resultIndex: number
  results: { length: number } & Record<number, SpeechResultLike | undefined>
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'ไม่ได้รับอนุญาตให้ใช้ไมค์',
  network: 'การรับเสียงขัดข้อง ลองใหม่',
  'no-speech': 'ไม่ได้ยินเสียง',
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const scope = globalThis as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function useSpeechInput(handlers: { onFinal: (text: string) => void }) {
  const listening = ref(false)
  const interim = ref('')
  const errorMessage = ref('')

  const supported: ComputedRef<boolean> = computed(() => getRecognitionCtor() !== null)

  let rec: SpeechRecognitionLike | null = null

  function start() {
    const Ctor = getRecognitionCtor()
    if (!Ctor || listening.value) return
    errorMessage.value = ''
    try {
      rec = new Ctor()
      rec.lang = 'th-TH'
      rec.interimResults = true
      rec.continuous = false
      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (!result) continue
          const transcript = result[0]?.transcript ?? ''
          if (result.isFinal) {
            handlers.onFinal(transcript.trim())
            interim.value = ''
          } else {
            interim.value = transcript
          }
        }
      }
      rec.onerror = (event) => {
        errorMessage.value = ERROR_MESSAGES[event.error] ?? 'พูดไม่สำเร็จ ลองใหม่'
      }
      rec.onend = () => {
        listening.value = false
      }
      rec.start()
      listening.value = true
    } catch {
      listening.value = false
    }
  }

  function stop() {
    rec?.stop()
  }

  onScopeDispose(() => stop())

  return { supported, listening: listening as Ref<boolean>, interim, errorMessage, start, stop }
}
