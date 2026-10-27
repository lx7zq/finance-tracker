import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useVoiceEntry } from '@/composables/useVoiceEntry'
import { useSettingsStore } from '@/stores/settings'
import { callGeminiParse, GeminiParseError } from '@/utils/gemini'
import type { VoiceDraft } from '@/types'

vi.mock('@/utils/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/gemini')>()
  return { ...actual, callGeminiParse: vi.fn() }
})

const callMock = vi.mocked(callGeminiParse)

const VALID_DRAFT: VoiceDraft = {
  type: 'expense',
  amount: 45,
  category: 'food',
  description: 'กาแฟ',
}

class FakeRecognition {
  static instances: FakeRecognition[] = []
  lang = ''
  interimResults = false
  continuous = false
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  started = false

  constructor() {
    FakeRecognition.instances.push(this)
  }
  start() {
    this.started = true
  }
  stop() {}

  emitFinal(text: string) {
    this.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: true, 0: { transcript: text } } },
    })
  }
  emitInterim(text: string) {
    this.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: false, 0: { transcript: text } } },
    })
  }
  emitEnd() {
    this.onend?.()
  }
}

class FakeRecorder {
  static instances: FakeRecorder[] = []
  static isTypeSupported(_mimeType: string) {
    return true
  }
  mimeType = 'audio/webm'
  state = 'inactive'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null

  constructor(_stream: MediaStream) {
    FakeRecorder.instances.push(this)
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.onstop?.()
  }
}

function lastRecognition(): FakeRecognition {
  const inst = FakeRecognition.instances.at(-1)
  if (!inst) throw new Error('no recognition instance')
  return inst
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
  Reflect.deleteProperty(globalThis, 'SpeechRecognition')
  Reflect.deleteProperty(globalThis, 'webkitSpeechRecognition')
  Reflect.deleteProperty(globalThis, 'MediaRecorder')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useVoiceEntry', () => {
  it('ไม่รองรับทั้งสอง API → supported false, start() ไม่ throw, phase ยัง idle', () => {
    const entry = useVoiceEntry()

    expect(entry.supported.value).toBe(false)
    expect(() => entry.start()).not.toThrow()
    expect(entry.phase.value).toBe('idle')
  })

  it('เสียงจบ (final + end) → AI parse ระหว่างรอ phase processing → ได้ draft → confirm', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    useSettingsStore().setApiKey('K')
    let resolveAI!: (draft: VoiceDraft) => void
    callMock.mockImplementation(
      () =>
        new Promise<VoiceDraft>((resolve) => {
          resolveAI = resolve
        }),
    )

    const entry = useVoiceEntry()
    await entry.start()
    expect(entry.phase.value).toBe('listening')

    lastRecognition().emitFinal('กาแฟ 45 บาท')
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('processing'))
    resolveAI(VALID_DRAFT)
    await vi.waitFor(() => expect(entry.phase.value).toBe('confirm'))
    expect(entry.draft.value).toEqual(VALID_DRAFT)
    expect(callMock).toHaveBeenCalledWith({ text: 'กาแฟ 45 บาท' }, 'K')
  })

  it('AI ตอบ quota error → fallback parser คีย์เวิร์ด → confirm', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    useSettingsStore().setApiKey('K')
    callMock.mockRejectedValue(
      new GeminiParseError('โควต้า Gemini หมด ลองพูดใหม่หรือพิมพ์เอง', 'quota'),
    )

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().emitFinal('กาแฟ 45 บาท')
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('confirm'))
    expect(entry.draft.value).toEqual({
      type: 'expense',
      amount: 45,
      category: 'food',
      description: 'กาแฟ',
    })
  })

  it('ไม่มี key + มีเลขท้ายประโยค → fallback คีย์เวิร์ดโดยไม่เรียก AI', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().emitFinal('ข้าวมื้อเที่ยง 120')
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('confirm'))
    expect(entry.draft.value).toEqual({
      type: 'expense',
      amount: 120,
      category: 'food',
      description: 'ข้าวมื้อเที่ยง',
    })
    expect(callMock).not.toHaveBeenCalled()
  })

  it('ไม่มี key + ไม่มีเลข → error แจ้งไม่เข้าใจยอดเงิน', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().emitFinal('กาแฟ')
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('error'))
    expect(entry.errorMessage.value).toBe('ไม่เข้าใจยอดเงิน ลองพูดใหม่หรือพิมพ์เอง')
  })

  it('cancel() ระหว่างฟัง → กลับ idle และเคลียร์ interim', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().emitInterim('กาแฟ 4')

    expect(entry.interim.value).toBe('กาแฟ 4')
    entry.cancel()

    expect(entry.phase.value).toBe('idle')
    expect(entry.interim.value).toBe('')
    expect(entry.draft.value).toBeNull()
  })

  it('เส้นทาง MediaRecorder (iOS) ไม่มี key → stopCapture แจ้งตั้งค่า key และหยุดไมค์', async () => {
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    const fakeTrack = { stop: vi.fn() }
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(async () => ({ getTracks: () => [fakeTrack] })),
      },
    })

    const entry = useVoiceEntry()
    await entry.start()
    expect(entry.phase.value).toBe('listening')

    entry.stopCapture()

    await vi.waitFor(() => expect(entry.phase.value).toBe('error'))
    expect(entry.errorMessage.value).toBe('ต้องตั้งค่า Gemini API key ก่อนใช้เสียงบนเบราว์เซอร์นี้')
    expect(fakeTrack.stop).toHaveBeenCalled()
  })
})
