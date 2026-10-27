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
    this.ondataavailable?.({ data: new Blob(['fake-audio-bytes']) })
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
  // แยก test จาก .env ของเครื่อง — เคส "ไม่มี key" ต้องไม่มี key จริง
  vi.stubEnv('VITE_GEMINI_API_KEY', '')
  FakeRecognition.instances.length = 0
  FakeRecorder.instances.length = 0
  Reflect.deleteProperty(globalThis, 'SpeechRecognition')
  Reflect.deleteProperty(globalThis, 'webkitSpeechRecognition')
  Reflect.deleteProperty(globalThis, 'MediaRecorder')
})

afterEach(() => {
  vi.unstubAllEnvs()
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

  it('เส้นทาง MediaRecorder มี key → ส่งเสียง (base64) ให้ AI แล้ว confirm', async () => {
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })),
      },
    })
    useSettingsStore().setApiKey('K')
    callMock.mockResolvedValue(VALID_DRAFT)

    const entry = useVoiceEntry()
    await entry.start()
    entry.stopCapture()

    await vi.waitFor(() => expect(entry.phase.value).toBe('confirm'))
    expect(entry.draft.value).toEqual(VALID_DRAFT)
    const [input, apiKey] = callMock.mock.calls[0] as unknown as [
      { audio?: { base64: string; mimeType: string } },
      string,
    ]
    expect(apiKey).toBe('K')
    expect(input.audio?.mimeType).toBe('audio/webm')
    expect(input.audio?.base64.length).toBeGreaterThan(0)
  })

  it('หยุดก่อนพูด (ไม่มี transcript ไม่มี error) → กลับ idle ไม่ค้าง listening', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('idle'))
  })

  it('Chrome ยิง error "aborted" ตอนหยุดเอง → ไม่แสดง error และกลับ idle', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().onerror?.({ error: 'aborted' })
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('idle'))
    expect(entry.errorMessage.value).toBe('')
  })

  it('AI error + พูดแล้วแต่ไม่มีเลข → แจ้งไม่เข้าใจยอดเงิน (ไม่ใช่ข้อความ quota)', async () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    useSettingsStore().setApiKey('K')
    callMock.mockRejectedValue(
      new GeminiParseError('โควต้า Gemini หมด ลองพูดใหม่หรือพิมพ์เอง', 'quota'),
    )

    const entry = useVoiceEntry()
    await entry.start()
    lastRecognition().emitFinal('กาแฟ')
    lastRecognition().emitEnd()

    await vi.waitFor(() => expect(entry.phase.value).toBe('error'))
    expect(entry.errorMessage.value).toBe('ไม่เข้าใจยอดเงิน ลองพูดใหม่หรือพิมพ์เอง')
  })

  it('กดไมค์ซ้ำระหว่างรออนุญาตไมค์ → getUserMedia ครั้งเดียว (ไม่รั่ว stream)', async () => {
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    const getUserMedia = vi.fn(() => new Promise(() => {}))
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } })

    const entry = useVoiceEntry()
    void entry.start()
    await Promise.resolve()
    await entry.start()

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(FakeRecorder.instances).toHaveLength(0)
  })

  it('cancel ระหว่างรออนุญาตไมค์ → ได้ stream คืนก็ไม่เริ่มอัด (ไมค์ปิด)', async () => {
    let resolveGUM!: (stream: MediaStream) => void
    const fakeTrack = { stop: vi.fn() }
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(
          () =>
            new Promise<MediaStream>((resolve) => {
              resolveGUM = resolve
            }),
        ),
      },
    })

    const entry = useVoiceEntry()
    const pending = entry.start()
    entry.cancel()
    resolveGUM({ getTracks: () => [fakeTrack] } as unknown as MediaStream)
    await pending

    expect(FakeRecorder.instances).toHaveLength(0)
    expect(fakeTrack.stop).toHaveBeenCalled()
    expect(entry.phase.value).toBe('idle')
  })
})
