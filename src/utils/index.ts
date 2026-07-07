import 'dayjs/locale/th'

import dayjs from 'dayjs'

dayjs.locale('th')

export function getThisMonth(): string {
  return dayjs().format('YYYY-MM')
}

export function formatMonth(month: string): string {
  return dayjs(month + '-01').format('MMMM YYYY')
}

export function formatDate(date: string): string {
  return dayjs(date).format('D MMM YYYY')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateId(): string {
  return crypto.randomUUID()
}
