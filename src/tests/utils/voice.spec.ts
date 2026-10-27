import { afterEach, describe, expect, it, vi } from 'vitest'

import { isVoiceCaptureSupported, parseVoiceEntry } from '@/utils/voice'

describe('parseVoiceEntry', () => {
  it('"ข้าวมื้อเที่ยง 120" → amount 120, หมวด food', () => {
    expect(parseVoiceEntry('ข้าวมื้อเที่ยง 120')).toEqual({
      description: 'ข้าวมื้อเที่ยง',
      amount: 120,
      category: 'food',
    })
  })

  it('"๑๒๐ บาท" → amount 120 เลขไทย, description ว่าง', () => {
    expect(parseVoiceEntry('๑๒๐ บาท')).toEqual({
      description: '',
      amount: 120,
      category: 'other_expense',
    })
  })

  it('"กาแฟ" → ไม่มีเลข amount null, หมวด food', () => {
    expect(parseVoiceEntry('กาแฟ')).toEqual({
      description: 'กาแฟ',
      amount: null,
      category: 'food',
    })
  })

  it('"ตุ๋ม 1,500 บาท" → amount 1500 ตัด comma และ บาท', () => {
    expect(parseVoiceEntry('ตุ๋ม 1,500 บาท')).toEqual({
      description: 'ตุ๋ม',
      amount: 1500,
      category: 'other_expense',
    })
  })

  it('ข้อความว่าง → ว่างทั้งหมด', () => {
    expect(parseVoiceEntry('  ')).toEqual({
      description: '',
      amount: null,
      category: 'other_expense',
    })
  })

  it('"ขายของ 250.5" → ทศนิยมได้, หมวด other_income', () => {
    expect(parseVoiceEntry('ขายของ 250.5')).toEqual({
      description: 'ขายของ',
      amount: 250.5,
      category: 'other_income',
    })
  })

  it('"น้ำมัน 800" → transport (ลำดับตาราง: น้ำมัน ชนะ น้ำ)', () => {
    expect(parseVoiceEntry('น้ำมัน 800')).toEqual({
      description: 'น้ำมัน',
      amount: 800,
      category: 'transport',
    })
  })

  it('"netflix 419" → entertainment (ชนะ เน็ต ของ housing)', () => {
    expect(parseVoiceEntry('netflix 419')).toEqual({
      description: 'netflix',
      amount: 419,
      category: 'entertainment',
    })
  })

  it('"เงินเดือน 15000" → salary', () => {
    expect(parseVoiceEntry('เงินเดือน 15000')).toEqual({
      description: 'เงินเดือน',
      amount: 15000,
      category: 'salary',
    })
  })

  it('เลขอยู่ตรงกลางไม่จับ → amount null', () => {
    expect(parseVoiceEntry('ค่ารถ 20 ไปกลับ')).toEqual({
      description: 'ค่ารถ 20 ไปกลับ',
      amount: null,
      category: 'transport',
    })
  })
})

describe('isVoiceCaptureSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ไม่มี SpeechRecognition และไม่มี MediaRecorder → false', () => {
    Reflect.deleteProperty(globalThis, 'SpeechRecognition')
    Reflect.deleteProperty(globalThis, 'webkitSpeechRecognition')
    Reflect.deleteProperty(globalThis, 'MediaRecorder')

    expect(isVoiceCaptureSupported()).toBe(false)
  })

  it('มี webkitSpeechRecognition → true', () => {
    Reflect.deleteProperty(globalThis, 'SpeechRecognition')
    vi.stubGlobal('webkitSpeechRecognition', function Fake() {})
    vi.stubGlobal('MediaRecorder', undefined)

    expect(isVoiceCaptureSupported()).toBe(true)
  })

  it('มี MediaRecorder + getUserMedia → true', () => {
    vi.stubGlobal('SpeechRecognition', undefined)
    vi.stubGlobal('webkitSpeechRecognition', undefined)
    vi.stubGlobal('MediaRecorder', class FakeRecorder {})
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: () => {} } })

    expect(isVoiceCaptureSupported()).toBe(true)
  })
})
