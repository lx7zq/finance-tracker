import { describe, expect, it } from 'vitest'

import { useSpeechInput } from '@/composables/useSpeechInput'

describe('useSpeechInput (feature-detect)', () => {
  it('ไม่รองรับ → supported false, start() ไม่ throw, listening ยัง false, ไม่มี error', () => {
    Reflect.deleteProperty(globalThis, 'SpeechRecognition')
    Reflect.deleteProperty(globalThis, 'webkitSpeechRecognition')

    const { supported, listening, errorMessage, start } = useSpeechInput({ onFinal: () => {} })

    expect(supported.value).toBe(false)
    expect(() => start()).not.toThrow()
    expect(listening.value).toBe(false)
    expect(errorMessage.value).toBe('')
  })
})
